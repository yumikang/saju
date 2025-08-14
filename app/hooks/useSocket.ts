import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents,
  NamingStartRequest,
  NamingProgressEvent,
  NamingCompleteEvent,
  NamingErrorEvent,
  QueueStatusEvent,
  BaseEventPayload
} from '../socket/types';

// Socket 설정 타입
interface SocketConfig extends Partial<ManagerOptions & SocketOptions> {
  namespace?: string;
  enableLogging?: boolean;
}

// 연결 상태 타입
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// Socket Hook 반환 타입
interface UseSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connectionState: ConnectionState;
  isConnected: boolean;
  isReconnecting: boolean;
  lastError: Error | null;
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => void;
  on: <E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ) => void;
  off: <E extends keyof ServerToClientEvents>(
    event: E,
    handler?: ServerToClientEvents[E]
  ) => void;
  connect: () => void;
  disconnect: () => void;
  volatile: {
    emit: <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => void;
  };
}

// 기본 Socket 설정
const DEFAULT_CONFIG: SocketConfig = {
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  enableLogging: process.env.NODE_ENV === 'development'
};

// Exponential Backoff 계산
const calculateBackoff = (attempt: number, baseDelay: number, maxDelay: number): number => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.3 * delay; // 30% jitter
  return delay + jitter;
};

/**
 * Socket.IO 연결을 관리하는 React Hook
 * 자동 재연결, 오프라인 처리, 메모리 관리 기능 포함
 */
export function useSocket(
  url: string = process.env.SOCKET_URL || 'http://localhost:3001',
  config: SocketConfig = {}
): UseSocketReturn {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastError, setLastError] = useState<Error | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  const isUnmountedRef = useRef(false);

  // 설정 병합
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { namespace = '', enableLogging } = finalConfig;

  // 로깅 유틸리티
  const log = useCallback((...args: any[]) => {
    if (enableLogging) {
      console.log('[useSocket]', ...args);
    }
  }, [enableLogging]);

  // 연결 상태 파생
  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting';

  // Socket 초기화
  const initSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      log('Socket already connected');
      return socketRef.current;
    }

    log('Initializing socket connection to', url + namespace);

    // 기존 소켓 정리
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.close();
    }

    // 새 소켓 생성
    const socket = io(url + namespace, {
      ...finalConfig,
      auth: (cb) => {
        // 동적 인증 정보 제공
        const userId = localStorage.getItem('userId') || `guest_${Date.now()}`;
        const sessionId = localStorage.getItem('sessionId');
        cb({ userId, sessionId });
      }
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    // 연결 이벤트 핸들러
    socket.on('connect', () => {
      if (isUnmountedRef.current) return;
      
      log('Connected successfully', {
        id: socket.id,
        recovered: socket.recovered,
        transport: socket.io.engine?.transport?.name
      });
      
      setConnectionState('connected');
      setReconnectAttempt(0);
      setLastError(null);

      // Transport 업그레이드 감지
      socket.io.engine?.on('upgrade', (transport: any) => {
        log('Transport upgraded to', transport.name);
      });
    });

    // 연결 에러 핸들러
    socket.on('connect_error', (error) => {
      if (isUnmountedRef.current) return;
      
      log('Connection error:', error.message);
      setLastError(error);
      
      if (socket.active) {
        // 자동 재연결 시도 중
        setConnectionState('reconnecting');
      } else {
        // 수동 재연결 필요
        setConnectionState('disconnected');
        handleManualReconnect();
      }
    });

    // 연결 해제 핸들러
    socket.on('disconnect', (reason, details) => {
      if (isUnmountedRef.current) return;
      
      log('Disconnected:', reason, details);
      
      // 재연결 가능 여부 확인
      if (socket.active) {
        setConnectionState('reconnecting');
      } else {
        setConnectionState('disconnected');
        
        // 강제 종료가 아닌 경우 수동 재연결 시도
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          handleManualReconnect();
        }
      }
    });

    // 재연결 이벤트
    socket.io.on('reconnect', (attempt) => {
      if (isUnmountedRef.current) return;
      log('Reconnected after', attempt, 'attempts');
      setReconnectAttempt(0);
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      if (isUnmountedRef.current) return;
      log('Reconnection attempt', attempt);
      setReconnectAttempt(attempt);
      setConnectionState('reconnecting');
    });

    socket.io.on('reconnect_error', (error) => {
      if (isUnmountedRef.current) return;
      log('Reconnection error:', error.message);
      setLastError(error);
    });

    socket.io.on('reconnect_failed', () => {
      if (isUnmountedRef.current) return;
      log('Reconnection failed after maximum attempts');
      setConnectionState('disconnected');
      handleManualReconnect();
    });

    socketRef.current = socket;
    return socket;
  }, [url, namespace, finalConfig, log]);

  // 수동 재연결 처리 (Exponential Backoff)
  const handleManualReconnect = useCallback(() => {
    if (isUnmountedRef.current || socketRef.current?.connected) return;
    
    const delay = calculateBackoff(
      reconnectAttempt,
      finalConfig.reconnectionDelay || 1000,
      finalConfig.reconnectionDelayMax || 5000
    );
    
    log(`Manual reconnection scheduled in ${Math.round(delay)}ms (attempt ${reconnectAttempt + 1})`);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current && !socketRef.current?.connected) {
        setReconnectAttempt(prev => prev + 1);
        socketRef.current?.connect();
      }
    }, delay);
  }, [reconnectAttempt, finalConfig, log]);

  // 이벤트 발송 (타입 안전)
  const emit = useCallback(<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => {
    if (!socketRef.current?.connected) {
      log('Cannot emit event, socket not connected:', event);
      return;
    }
    
    log('Emitting event:', event, args);
    (socketRef.current.emit as any)(event, ...args);
  }, [log]);

  // Volatile 이벤트 발송 (오프라인 시 버퍼링 안함)
  const volatileEmit = useCallback(<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => {
    if (!socketRef.current) {
      log('Socket not initialized');
      return;
    }
    
    log('Emitting volatile event:', event, args);
    (socketRef.current.volatile.emit as any)(event, ...args);
  }, [log]);

  // 이벤트 리스너 등록
  const on = useCallback(<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ) => {
    if (!socketRef.current) {
      log('Socket not initialized, queuing handler for:', event);
      
      // 핸들러 큐에 저장
      if (!eventHandlersRef.current.has(event as string)) {
        eventHandlersRef.current.set(event as string, new Set());
      }
      eventHandlersRef.current.get(event as string)!.add(handler);
      return;
    }
    
    log('Registering event handler:', event);
    socketRef.current.on(event as any, handler as any);
    
    // 핸들러 추적
    if (!eventHandlersRef.current.has(event as string)) {
      eventHandlersRef.current.set(event as string, new Set());
    }
    eventHandlersRef.current.get(event as string)!.add(handler);
  }, [log]);

  // 이벤트 리스너 제거
  const off = useCallback(<E extends keyof ServerToClientEvents>(
    event: E,
    handler?: ServerToClientEvents[E]
  ) => {
    if (!socketRef.current) return;
    
    log('Removing event handler:', event);
    
    if (handler) {
      socketRef.current.off(event as any, handler as any);
      eventHandlersRef.current.get(event as string)?.delete(handler);
    } else {
      socketRef.current.removeAllListeners(event as any);
      eventHandlersRef.current.delete(event as string);
    }
  }, [log]);

  // 수동 연결
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      log('Already connected');
      return;
    }
    
    log('Manual connect requested');
    setConnectionState('connecting');
    
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      initSocket();
    }
  }, [initSocket, log]);

  // 수동 연결 해제
  const disconnect = useCallback(() => {
    log('Manual disconnect requested');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      setConnectionState('disconnected');
    }
  }, [log]);

  // 네트워크 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      log('Network online, attempting to connect');
      if (!socketRef.current?.connected) {
        connect();
      }
    };

    const handleOffline = () => {
      log('Network offline');
      setConnectionState('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, log]);

  // 가시성 변경 감지 (모바일 배터리 최적화)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        log('Page hidden, reducing activity');
        // 페이지가 숨겨지면 폴링 간격 증가
        if (socketRef.current?.io) {
          socketRef.current.io.opts.reconnectionDelay = 5000;
          socketRef.current.io.opts.reconnectionDelayMax = 10000;
        }
      } else {
        log('Page visible, restoring activity');
        // 페이지가 보이면 폴링 간격 복원
        if (socketRef.current?.io) {
          socketRef.current.io.opts.reconnectionDelay = finalConfig.reconnectionDelay || 1000;
          socketRef.current.io.opts.reconnectionDelayMax = finalConfig.reconnectionDelayMax || 5000;
        }
        
        // 연결 상태 확인
        if (!socketRef.current?.connected) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, finalConfig, log]);

  // Socket 초기화 및 정리
  useEffect(() => {
    isUnmountedRef.current = false;
    
    // 자동 연결이 활성화된 경우 초기화
    if (finalConfig.autoConnect) {
      const socket = initSocket();
      
      // 큐에 저장된 핸들러 등록
      eventHandlersRef.current.forEach((handlers, event) => {
        handlers.forEach(handler => {
          socket?.on(event as any, handler as any);
        });
      });
    }

    // 정리 함수
    return () => {
      isUnmountedRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        log('Cleaning up socket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      
      eventHandlersRef.current.clear();
    };
  }, [initSocket, finalConfig.autoConnect, log]);

  return {
    socket: socketRef.current,
    connectionState,
    isConnected,
    isReconnecting,
    lastError,
    emit,
    on,
    off,
    connect,
    disconnect,
    volatile: {
      emit: volatileEmit
    }
  };
}

/**
 * 작명 네임스페이스 전용 Hook
 */
export function useNamingSocket(config?: SocketConfig) {
  return useSocket(
    process.env.SOCKET_URL || 'http://localhost:3001',
    { ...config, namespace: '/naming' }
  );
}

/**
 * 대기열 네임스페이스 전용 Hook
 */
export function useQueueSocket(config?: SocketConfig) {
  return useSocket(
    process.env.SOCKET_URL || 'http://localhost:3001',
    { ...config, namespace: '/queue' }
  );
}