import { useEffect, useRef } from 'react';
import { useNamingSocket, useQueueSocket } from './useSocket';
import { useRealtimeStore, subscribeToSocketEvents } from '../store/realtime.store';
import type { NamingStartRequest } from '../socket/types';

/**
 * Socket.IO와 Zustand 스토어를 연동하는 통합 훅
 * 실시간 작명 프로세스와 대기열 관리를 담당
 */
export function useRealtimeSocket() {
  const namingSocket = useNamingSocket({
    enableLogging: process.env.NODE_ENV === 'development'
  });
  
  const queueSocket = useQueueSocket({
    enableLogging: process.env.NODE_ENV === 'development'
  });
  
  const store = useRealtimeStore();
  const cleanupRef = useRef<(() => void) | null>(null);
  const latencyCheckIntervalRef = useRef<NodeJS.Timeout>();
  
  // Socket 이벤트와 Zustand 스토어 연동
  useEffect(() => {
    if (namingSocket.socket && namingSocket.isConnected) {
      // 작명 소켓 이벤트 구독
      const cleanupNaming = subscribeToSocketEvents(namingSocket.socket);
      
      // 대기열 소켓 이벤트 구독 (별도 네임스페이스)
      const cleanupQueue = queueSocket.socket ? subscribeToSocketEvents(queueSocket.socket) : () => {};
      
      // Cleanup 함수 저장
      cleanupRef.current = () => {
        cleanupNaming();
        cleanupQueue();
      };
      
      // Latency 측정 (5초마다)
      latencyCheckIntervalRef.current = setInterval(() => {
        const startTime = Date.now();
        namingSocket.socket?.emit('ping', () => {
          const latency = Date.now() - startTime;
          store.updateLatency(latency);
        });
      }, 5000);
    }
    
    return () => {
      cleanupRef.current?.();
      if (latencyCheckIntervalRef.current) {
        clearInterval(latencyCheckIntervalRef.current);
      }
    };
  }, [namingSocket.socket, namingSocket.isConnected, queueSocket.socket, store]);
  
  // 작명 시작 함수
  const startNaming = (request: Omit<NamingStartRequest, 'requestId' | 'timestamp'>) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 낙관적 업데이트
    store.getOptimisticUpdate(() => {
      store.startNamingProcess(requestId);
    });
    
    // 서버에 요청 전송
    const fullRequest: NamingStartRequest = {
      ...request,
      requestId,
      timestamp: new Date().toISOString()
    };
    
    namingSocket.emit('naming:start', fullRequest);
    store.incrementMessagesSent();
    
    return requestId;
  };
  
  // 작명 취소 함수
  const cancelNaming = (requestId: string) => {
    if (!store.isRequestActive(requestId)) {
      console.warn('Request not active:', requestId);
      return;
    }
    
    // 낙관적 업데이트
    store.getOptimisticUpdate(() => {
      store.cancelNamingProcess(requestId);
    });
    
    // 서버에 취소 요청
    namingSocket.emit('naming:cancel', {
      requestId,
      timestamp: new Date().toISOString()
    });
    store.incrementMessagesSent();
  };
  
  // 대기열 참가 함수
  const joinQueue = () => {
    // 낙관적 업데이트
    store.getOptimisticUpdate(() => {
      store.joinQueue();
    });
    
    // 서버에 요청
    queueSocket.emit('queue:join', {
      requestId: `queue_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    store.incrementMessagesSent();
  };
  
  // 대기열 이탈 함수
  const leaveQueue = () => {
    // 낙관적 업데이트
    store.getOptimisticUpdate(() => {
      store.leaveQueue();
    });
    
    // 서버에 요청
    queueSocket.emit('queue:leave', {
      requestId: `queue_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    store.incrementMessagesSent();
  };
  
  // 대기열 상태 확인 함수
  const checkQueueStatus = () => {
    queueSocket.emit('queue:status', {
      requestId: `status_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    store.incrementMessagesSent();
  };
  
  return {
    // Socket 연결 상태
    namingSocket: {
      isConnected: namingSocket.isConnected,
      isReconnecting: namingSocket.isReconnecting,
      connectionState: namingSocket.connectionState,
      lastError: namingSocket.lastError
    },
    queueSocket: {
      isConnected: queueSocket.isConnected,
      isReconnecting: queueSocket.isReconnecting,
      connectionState: queueSocket.connectionState,
      lastError: queueSocket.lastError
    },
    
    // 작명 관련 액션
    startNaming,
    cancelNaming,
    
    // 대기열 관련 액션
    joinQueue,
    leaveQueue,
    checkQueueStatus,
    
    // 스토어 상태 (직접 접근용)
    store: {
      naming: store.naming,
      queue: store.queue,
      error: store.error,
      metrics: store.metrics,
      history: store.history,
      clearError: store.clearError,
      reset: store.reset
    }
  };
}

/**
 * 작명 프로세스 상태만 구독하는 경량 훅
 */
export function useNamingProcess() {
  const status = useRealtimeStore((state) => state.naming.status);
  const progress = useRealtimeStore((state) => state.naming.progress);
  const currentStep = useRealtimeStore((state) => state.naming.currentStep);
  const totalSteps = useRealtimeStore((state) => state.naming.totalSteps);
  const stepName = useRealtimeStore((state) => state.naming.stepName);
  const message = useRealtimeStore((state) => state.naming.message);
  const results = useRealtimeStore((state) => state.naming.results);
  const error = useRealtimeStore((state) => state.error);
  
  return {
    status,
    progress,
    currentStep,
    totalSteps,
    stepName,
    message,
    results,
    error,
    isProcessing: status === 'processing' || status === 'starting',
    isCompleted: status === 'completed',
    hasError: status === 'error' || error.hasError
  };
}

/**
 * 대기열 상태만 구독하는 경량 훅
 */
export function useQueueStatus() {
  const position = useRealtimeStore((state) => state.queue.position);
  const estimatedTime = useRealtimeStore((state) => state.queue.estimatedTime);
  const totalInQueue = useRealtimeStore((state) => state.queue.totalInQueue);
  const status = useRealtimeStore((state) => state.queue.status);
  const joinedAt = useRealtimeStore((state) => state.queue.joinedAt);
  
  // 예상 시간을 사람이 읽기 쉬운 형식으로 변환
  const formatEstimatedTime = () => {
    if (estimatedTime <= 0) return '곧 시작';
    if (estimatedTime < 60) return `약 ${estimatedTime}초`;
    if (estimatedTime < 3600) return `약 ${Math.ceil(estimatedTime / 60)}분`;
    return `약 ${Math.ceil(estimatedTime / 3600)}시간`;
  };
  
  // 대기 시간 계산 (joinedAt 기준)
  const getWaitingTime = () => {
    if (!joinedAt) return 0;
    return Math.floor((Date.now() - joinedAt.getTime()) / 1000);
  };
  
  return {
    position,
    estimatedTime,
    totalInQueue,
    status,
    joinedAt,
    formattedEstimatedTime: formatEstimatedTime(),
    waitingTime: getWaitingTime(),
    isWaiting: status === 'waiting',
    isReady: status === 'ready',
    isProcessing: status === 'processing'
  };
}

/**
 * 연결 메트릭만 구독하는 경량 훅
 */
export function useConnectionMetrics() {
  const metrics = useRealtimeStore((state) => state.metrics);
  
  return {
    latency: metrics.latency,
    reconnectAttempts: metrics.reconnectAttempts,
    lastConnectedAt: metrics.lastConnectedAt,
    totalMessagesReceived: metrics.totalMessagesReceived,
    totalMessagesSent: metrics.totalMessagesSent,
    isHealthy: metrics.latency < 100 && metrics.reconnectAttempts === 0,
    connectionQuality: 
      metrics.latency < 50 ? 'excellent' :
      metrics.latency < 100 ? 'good' :
      metrics.latency < 200 ? 'fair' : 'poor'
  };
}