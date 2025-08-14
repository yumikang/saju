import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  NamingProgressEvent,
  NamingCompleteEvent,
  NamingErrorEvent,
  QueueStatusEvent,
  NamingResult,
  BaseEventPayload
} from '../socket/types';

// 작명 프로세스 상태
interface NamingProcessState {
  requestId: string | null;
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'error' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  stepName: string;
  progress: number;
  message: string;
  estimatedTimeRemaining: number;
  startTime: Date | null;
  endTime: Date | null;
  results: NamingResult[];
  totalGenerated: number;
  processingTime: number;
}

// 대기열 상태
interface QueueState {
  position: number;
  estimatedTime: number;
  totalInQueue: number;
  status: 'idle' | 'waiting' | 'processing' | 'ready';
  joinedAt: Date | null;
}

// 에러 상태
interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  timestamp?: Date;
  details?: any;
}

// 연결 메트릭
interface ConnectionMetrics {
  latency: number;
  reconnectAttempts: number;
  lastConnectedAt: Date | null;
  totalMessagesReceived: number;
  totalMessagesSent: number;
}

// 전체 실시간 상태
export interface RealtimeState {
  // 작명 프로세스
  naming: NamingProcessState;
  
  // 대기열
  queue: QueueState;
  
  // 에러
  error: ErrorState;
  
  // 연결 메트릭
  metrics: ConnectionMetrics;
  
  // 활성 요청 추적
  activeRequests: Set<string>;
  
  // 히스토리 (최근 10개)
  history: Array<{
    requestId: string;
    timestamp: Date;
    status: 'completed' | 'error' | 'cancelled';
    resultsCount?: number;
    errorMessage?: string;
  }>;
}

// 액션 인터페이스
export interface RealtimeActions {
  // 작명 프로세스 액션
  startNamingProcess: (requestId: string) => void;
  updateNamingProgress: (event: NamingProgressEvent) => void;
  completeNamingProcess: (event: NamingCompleteEvent) => void;
  setNamingError: (event: NamingErrorEvent) => void;
  cancelNamingProcess: (requestId: string) => void;
  
  // 대기열 액션
  joinQueue: () => void;
  updateQueueStatus: (event: QueueStatusEvent) => void;
  leaveQueue: () => void;
  setQueueReady: () => void;
  
  // 에러 액션
  setError: (message: string, code?: string, details?: any) => void;
  clearError: () => void;
  
  // 메트릭 액션
  updateLatency: (latency: number) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  incrementMessagesReceived: () => void;
  incrementMessagesSent: () => void;
  setLastConnectedAt: () => void;
  
  // 히스토리 액션
  addToHistory: (entry: RealtimeState['history'][0]) => void;
  clearHistory: () => void;
  
  // 유틸리티 액션
  reset: () => void;
  isRequestActive: (requestId: string) => boolean;
  getOptimisticUpdate: <T>(action: () => T) => T;
}

// 초기 상태
const initialState: RealtimeState = {
  naming: {
    requestId: null,
    status: 'idle',
    currentStep: 0,
    totalSteps: 0,
    stepName: '',
    progress: 0,
    message: '',
    estimatedTimeRemaining: 0,
    startTime: null,
    endTime: null,
    results: [],
    totalGenerated: 0,
    processingTime: 0
  },
  queue: {
    position: 0,
    estimatedTime: 0,
    totalInQueue: 0,
    status: 'idle',
    joinedAt: null
  },
  error: {
    hasError: false,
    message: '',
    code: undefined,
    timestamp: undefined,
    details: undefined
  },
  metrics: {
    latency: 0,
    reconnectAttempts: 0,
    lastConnectedAt: null,
    totalMessagesReceived: 0,
    totalMessagesSent: 0
  },
  activeRequests: new Set(),
  history: []
};

// Zustand 스토어 생성
export const useRealtimeStore = create<RealtimeState & RealtimeActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // 작명 프로세스 액션
        startNamingProcess: (requestId: string) => {
          set((state) => {
            state.naming.requestId = requestId;
            state.naming.status = 'starting';
            state.naming.startTime = new Date();
            state.naming.endTime = null;
            state.naming.progress = 0;
            state.naming.results = [];
            state.activeRequests.add(requestId);
          });
        },

        updateNamingProgress: (event: NamingProgressEvent) => {
          set((state) => {
            if (state.naming.requestId === event.requestId) {
              state.naming.status = 'processing';
              state.naming.currentStep = event.step;
              state.naming.totalSteps = event.totalSteps;
              state.naming.stepName = event.name;
              state.naming.progress = event.progress;
              state.naming.message = event.message;
              state.naming.estimatedTimeRemaining = event.details?.estimatedTimeRemaining || 0;
              
              // 메트릭 업데이트
              state.metrics.totalMessagesReceived++;
            }
          });
        },

        completeNamingProcess: (event: NamingCompleteEvent) => {
          set((state) => {
            if (state.naming.requestId === event.requestId) {
              state.naming.status = 'completed';
              state.naming.endTime = new Date();
              state.naming.progress = 100;
              state.naming.results = event.result.names;
              state.naming.totalGenerated = event.result.totalGenerated;
              state.naming.processingTime = event.result.processingTime;
              
              // 히스토리에 추가
              const historyEntry = {
                requestId: event.requestId,
                timestamp: new Date(),
                status: 'completed' as const,
                resultsCount: event.result.names.length
              };
              state.history = [historyEntry, ...state.history.slice(0, 9)];
              
              // 활성 요청에서 제거
              state.activeRequests.delete(event.requestId);
              
              // 메트릭 업데이트
              state.metrics.totalMessagesReceived++;
            }
          });
        },

        setNamingError: (event: NamingErrorEvent) => {
          set((state) => {
            if (state.naming.requestId === event.requestId) {
              state.naming.status = 'error';
              state.naming.endTime = new Date();
              
              // 에러 상태 설정
              state.error = {
                hasError: true,
                message: event.error,
                code: event.code,
                timestamp: new Date(),
                details: event.details
              };
              
              // 히스토리에 추가
              const historyEntry = {
                requestId: event.requestId,
                timestamp: new Date(),
                status: 'error' as const,
                errorMessage: event.error
              };
              state.history = [historyEntry, ...state.history.slice(0, 9)];
              
              // 활성 요청에서 제거
              state.activeRequests.delete(event.requestId);
              
              // 메트릭 업데이트
              state.metrics.totalMessagesReceived++;
            }
          });
        },

        cancelNamingProcess: (requestId: string) => {
          set((state) => {
            if (state.naming.requestId === requestId) {
              state.naming.status = 'cancelled';
              state.naming.endTime = new Date();
              
              // 히스토리에 추가
              const historyEntry = {
                requestId,
                timestamp: new Date(),
                status: 'cancelled' as const
              };
              state.history = [historyEntry, ...state.history.slice(0, 9)];
              
              // 활성 요청에서 제거
              state.activeRequests.delete(requestId);
            }
          });
        },

        // 대기열 액션
        joinQueue: () => {
          set((state) => {
            state.queue.status = 'waiting';
            state.queue.joinedAt = new Date();
          });
        },

        updateQueueStatus: (event: QueueStatusEvent) => {
          set((state) => {
            state.queue.position = event.position;
            state.queue.estimatedTime = event.estimatedTime;
            state.queue.totalInQueue = event.totalInQueue;
            state.queue.status = event.status;
            
            // 메트릭 업데이트
            state.metrics.totalMessagesReceived++;
          });
        },

        leaveQueue: () => {
          set((state) => {
            state.queue = {
              position: 0,
              estimatedTime: 0,
              totalInQueue: 0,
              status: 'idle',
              joinedAt: null
            };
          });
        },

        setQueueReady: () => {
          set((state) => {
            state.queue.status = 'ready';
            state.queue.position = 0;
            state.queue.estimatedTime = 0;
          });
        },

        // 에러 액션
        setError: (message: string, code?: string, details?: any) => {
          set((state) => {
            state.error = {
              hasError: true,
              message,
              code,
              timestamp: new Date(),
              details
            };
          });
        },

        clearError: () => {
          set((state) => {
            state.error = {
              hasError: false,
              message: '',
              code: undefined,
              timestamp: undefined,
              details: undefined
            };
          });
        },

        // 메트릭 액션
        updateLatency: (latency: number) => {
          set((state) => {
            state.metrics.latency = latency;
          });
        },

        incrementReconnectAttempts: () => {
          set((state) => {
            state.metrics.reconnectAttempts++;
          });
        },

        resetReconnectAttempts: () => {
          set((state) => {
            state.metrics.reconnectAttempts = 0;
          });
        },

        incrementMessagesReceived: () => {
          set((state) => {
            state.metrics.totalMessagesReceived++;
          });
        },

        incrementMessagesSent: () => {
          set((state) => {
            state.metrics.totalMessagesSent++;
          });
        },

        setLastConnectedAt: () => {
          set((state) => {
            state.metrics.lastConnectedAt = new Date();
            state.metrics.reconnectAttempts = 0;
          });
        },

        // 히스토리 액션
        addToHistory: (entry: RealtimeState['history'][0]) => {
          set((state) => {
            state.history = [entry, ...state.history.slice(0, 9)];
          });
        },

        clearHistory: () => {
          set((state) => {
            state.history = [];
          });
        },

        // 유틸리티 액션
        reset: () => {
          set(() => ({
            ...initialState,
            activeRequests: new Set(),
            history: []
          }));
        },

        isRequestActive: (requestId: string) => {
          return get().activeRequests.has(requestId);
        },

        getOptimisticUpdate: <T>(action: () => T): T => {
          // 낙관적 업데이트를 위한 헬퍼
          // 즉시 UI를 업데이트하고 서버 응답을 기다림
          const result = action();
          set((state) => {
            state.metrics.totalMessagesSent++;
          });
          return result;
        }
      }))
    ),
    {
      name: 'realtime-store',
      trace: true // 액션 추적 활성화
    }
  )
);

// 선택자 (Selectors) - 성능 최적화를 위한 메모이제이션
export const useNamingStatus = () => useRealtimeStore((state) => state.naming.status);
export const useNamingProgress = () => useRealtimeStore((state) => state.naming.progress);
export const useNamingResults = () => useRealtimeStore((state) => state.naming.results);
export const useQueuePosition = () => useRealtimeStore((state) => state.queue.position);
export const useQueueStatus = () => useRealtimeStore((state) => state.queue.status);
export const useError = () => useRealtimeStore((state) => state.error);
export const useConnectionMetrics = () => useRealtimeStore((state) => state.metrics);
export const useHistory = () => useRealtimeStore((state) => state.history);

// 구독 헬퍼 - Socket.IO 이벤트와 연동용
export const subscribeToSocketEvents = (socket: any) => {
  const store = useRealtimeStore.getState();
  
  // 작명 이벤트 구독
  socket.on('naming:started', (data: BaseEventPayload) => {
    store.startNamingProcess(data.requestId);
  });
  
  socket.on('naming:progress', (data: NamingProgressEvent) => {
    store.updateNamingProgress(data);
  });
  
  socket.on('naming:complete', (data: NamingCompleteEvent) => {
    store.completeNamingProcess(data);
  });
  
  socket.on('naming:error', (data: NamingErrorEvent) => {
    store.setNamingError(data);
  });
  
  socket.on('naming:cancelled', (data: BaseEventPayload) => {
    store.cancelNamingProcess(data.requestId);
  });
  
  // 대기열 이벤트 구독
  socket.on('queue:status', (data: QueueStatusEvent) => {
    store.updateQueueStatus(data);
  });
  
  socket.on('queue:update', (data: QueueStatusEvent) => {
    store.updateQueueStatus(data);
  });
  
  socket.on('queue:ready', () => {
    store.setQueueReady();
  });
  
  socket.on('queue:left', () => {
    store.leaveQueue();
  });
  
  // 연결 이벤트 구독
  socket.on('connect', () => {
    store.setLastConnectedAt();
    store.clearError();
  });
  
  socket.on('disconnect', () => {
    store.incrementReconnectAttempts();
  });
  
  // Cleanup 함수 반환
  return () => {
    socket.off('naming:started');
    socket.off('naming:progress');
    socket.off('naming:complete');
    socket.off('naming:error');
    socket.off('naming:cancelled');
    socket.off('queue:status');
    socket.off('queue:update');
    socket.off('queue:ready');
    socket.off('queue:left');
    socket.off('connect');
    socket.off('disconnect');
  };
};