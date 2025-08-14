import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBatteryOptimization } from './useBatteryOptimization';

interface OptimizedSocketConfig {
  namespace?: string;
  enableBatteryOptimization?: boolean;
  enableAutoReconnect?: boolean;
  enableCompression?: boolean;
  enableBinary?: boolean;
  enableLogging?: boolean;
}

interface ConnectionMetrics {
  connectedAt: Date | null;
  disconnectedAt: Date | null;
  reconnectAttempts: number;
  totalDataSent: number;
  totalDataReceived: number;
  averageLatency: number;
  messageQueue: any[];
}

/**
 * 배터리 최적화가 적용된 Socket.IO 훅
 * 모바일 환경에서 배터리 소모를 최소화하면서 실시간 통신 유지
 */
export function useOptimizedSocket(config: OptimizedSocketConfig = {}) {
  const {
    namespace = '/',
    enableBatteryOptimization = true,
    enableAutoReconnect = true,
    enableCompression = true,
    enableBinary = true,
    enableLogging = false
  } = config;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    connectedAt: null,
    disconnectedAt: null,
    reconnectAttempts: 0,
    totalDataSent: 0,
    totalDataReceived: 0,
    averageLatency: 0,
    messageQueue: []
  });

  const socketRef = useRef<Socket | null>(null);
  const messageQueueRef = useRef<any[]>([]);
  const latencyMeasurementsRef = useRef<number[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // 배터리 최적화 훅 사용
  const batteryOptimization = useBatteryOptimization({
    enableOptimization: enableBatteryOptimization
  });

  // Socket 초기화
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socketPath = namespace === '/' ? '/socket.io/' : `/socket.io/${namespace}/`;

    // Socket.IO 옵션 설정
    const socketOptions: any = {
      path: socketPath,
      transports: ['websocket', 'polling'],
      reconnection: enableAutoReconnect,
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      autoConnect: false, // 수동으로 연결 관리
      
      // 압축 설정
      perMessageDeflate: enableCompression,
      
      // 바이너리 지원
      forceBase64: !enableBinary,
      
      // 인증 정보
      auth: {
        token: localStorage.getItem('auth_token'),
        userId: localStorage.getItem('user_id')
      },
      
      // 쿼리 파라미터
      query: {
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        screen: `${window.screen.width}x${window.screen.height}`
      }
    };

    // Socket 인스턴스 생성
    const newSocket = io(socketUrl + namespace, socketOptions);
    socketRef.current = newSocket;
    setSocket(newSocket);

    // 이벤트 리스너 설정
    setupEventListeners(newSocket);

    // 배터리 최적화 적용
    if (enableBatteryOptimization) {
      batteryOptimization.optimizeSocketConnection(newSocket);
    }

    // 초기 연결
    if (batteryOptimization.networkStatus) {
      connectWithOptimization(newSocket);
    }

    return () => {
      cleanup();
    };
  }, [namespace]);

  // 배터리 상태 변경 시 Socket 설정 업데이트
  useEffect(() => {
    if (socket && enableBatteryOptimization) {
      batteryOptimization.optimizeSocketConnection(socket);
      
      // 최적화 모드에 따른 연결 관리
      if (batteryOptimization.optimizationMode === 'critical' && !batteryOptimization.batteryStatus?.charging) {
        // 긴급 모드: 연결 최소화
        disconnectGracefully();
      } else if (batteryOptimization.networkStatus && !socket.connected) {
        // 네트워크 복구 시 재연결
        connectWithOptimization(socket);
      }
    }
  }, [batteryOptimization.optimizationMode, batteryOptimization.networkStatus]);

  // 이벤트 리스너 설정
  const setupEventListeners = (socket: Socket) => {
    // 연결 이벤트
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');
      setMetrics(prev => ({
        ...prev,
        connectedAt: new Date(),
        reconnectAttempts: 0
      }));
      
      if (enableLogging) {
        console.log('[OptimizedSocket] Connected:', socket.id);
      }
      
      // 대기 중인 메시지 전송
      flushMessageQueue(socket);
    });

    // 연결 해제 이벤트
    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionState('disconnected');
      setMetrics(prev => ({
        ...prev,
        disconnectedAt: new Date()
      }));
      
      if (enableLogging) {
        console.log('[OptimizedSocket] Disconnected:', reason);
      }
    });

    // 재연결 시도
    socket.on('reconnect_attempt', (attemptNumber) => {
      setConnectionState('reconnecting');
      setMetrics(prev => ({
        ...prev,
        reconnectAttempts: attemptNumber
      }));
      
      if (enableLogging) {
        console.log('[OptimizedSocket] Reconnect attempt:', attemptNumber);
      }
    });

    // 에러 처리
    socket.on('connect_error', (error) => {
      if (enableLogging) {
        console.error('[OptimizedSocket] Connection error:', error);
      }
      
      // 배터리 절약 모드에서는 재연결 시도 제한
      if (batteryOptimization.optimizationMode === 'critical') {
        socket.io.opts.reconnectionAttempts = 1;
      }
    });

    // 핑/퐁으로 지연시간 측정
    socket.on('pong', () => {
      const latency = Date.now() - socket.sendBuffer[0]?.timestamp || 0;
      latencyMeasurementsRef.current.push(latency);
      
      // 최근 10개의 측정값으로 평균 계산
      if (latencyMeasurementsRef.current.length > 10) {
        latencyMeasurementsRef.current.shift();
      }
      
      const avgLatency = latencyMeasurementsRef.current.reduce((a, b) => a + b, 0) / latencyMeasurementsRef.current.length;
      
      setMetrics(prev => ({
        ...prev,
        averageLatency: Math.round(avgLatency)
      }));
    });
  };

  // 최적화된 연결
  const connectWithOptimization = (socket: Socket) => {
    const syncStrategy = batteryOptimization.getSyncStrategy();
    
    // 동기화 전략에 따른 이벤트 구독
    if (syncStrategy.immediate.length > 0) {
      socket.connect();
    } else if (batteryOptimization.optimizationMode === 'critical') {
      // 긴급 모드에서는 최소한의 연결만
      console.log('[OptimizedSocket] Skipping connection in critical battery mode');
    } else {
      socket.connect();
    }
  };

  // 우아한 연결 해제
  const disconnectGracefully = () => {
    if (socket?.connected) {
      // 대기 중인 메시지 저장
      messageQueueRef.current = [...socket.sendBuffer];
      
      socket.disconnect();
      
      if (enableLogging) {
        console.log('[OptimizedSocket] Gracefully disconnected, queued messages:', messageQueueRef.current.length);
      }
    }
  };

  // 메시지 큐 처리
  const flushMessageQueue = (socket: Socket) => {
    if (messageQueueRef.current.length > 0) {
      const syncStrategy = batteryOptimization.getSyncStrategy();
      
      messageQueueRef.current.forEach(message => {
        // 동기화 전략에 따라 메시지 필터링
        if (!syncStrategy.skip.includes(message.type)) {
          socket.emit(message.event, message.data);
        }
      });
      
      if (enableLogging) {
        console.log('[OptimizedSocket] Flushed message queue:', messageQueueRef.current.length);
      }
      
      messageQueueRef.current = [];
    }
  };

  // 메시지 전송 (큐잉 지원)
  const emit = useCallback((event: string, data: any, options?: { 
    priority?: 'immediate' | 'batched' | 'deferred',
    queueIfOffline?: boolean 
  }) => {
    const { priority = 'immediate', queueIfOffline = true } = options || {};
    
    // 메트릭 업데이트
    setMetrics(prev => ({
      ...prev,
      totalDataSent: prev.totalDataSent + JSON.stringify(data).length
    }));
    
    if (socket?.connected) {
      // 동기화 전략 확인
      const syncStrategy = batteryOptimization.getSyncStrategy();
      
      if (syncStrategy[priority].includes(event) || priority === 'immediate') {
        socket.emit(event, data);
      } else if (priority === 'batched') {
        // 배치 처리를 위해 큐에 추가
        messageQueueRef.current.push({ event, data, type: priority, timestamp: Date.now() });
        
        // 일정 시간 후 배치 전송
        setTimeout(() => {
          if (socket.connected) {
            flushMessageQueue(socket);
          }
        }, batteryOptimization.pollingInterval);
      } else if (priority === 'deferred') {
        // 지연 처리
        messageQueueRef.current.push({ event, data, type: priority, timestamp: Date.now() });
      }
    } else if (queueIfOffline) {
      // 오프라인 시 큐에 저장
      messageQueueRef.current.push({ event, data, type: 'queued', timestamp: Date.now() });
      
      if (enableLogging) {
        console.log('[OptimizedSocket] Message queued for offline:', event);
      }
    }
  }, [socket, batteryOptimization]);

  // 이벤트 리스너 등록
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, (...args) => {
        // 메트릭 업데이트
        setMetrics(prev => ({
          ...prev,
          totalDataReceived: prev.totalDataReceived + JSON.stringify(args).length
        }));
        
        handler(...args);
      });
    }
  }, [socket]);

  // 이벤트 리스너 제거
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socket) {
      if (handler) {
        socket.off(event, handler);
      } else {
        socket.off(event);
      }
    }
  }, [socket]);

  // 정리 함수
  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // 수동 연결/해제
  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      connectWithOptimization(socket);
    }
  }, [socket, batteryOptimization]);

  const disconnect = useCallback(() => {
    disconnectGracefully();
  }, [socket]);

  return {
    // Socket 인스턴스
    socket,
    
    // 연결 상태
    isConnected,
    connectionState,
    
    // 메트릭
    metrics,
    
    // 배터리 최적화 정보
    batteryStatus: batteryOptimization.batteryStatus,
    optimizationMode: batteryOptimization.optimizationMode,
    batterySavingTips: batteryOptimization.getBatterySavingTips(),
    
    // Socket 메서드
    emit,
    on,
    off,
    connect,
    disconnect,
    
    // 유틸리티
    flushMessageQueue: () => flushMessageQueue(socket!),
    getQueuedMessageCount: () => messageQueueRef.current.length
  };
}