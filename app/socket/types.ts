// Socket.IO 이벤트 타입 정의

// 기본 이벤트 페이로드
export interface BaseEventPayload {
  requestId: string;
  timestamp: string;
  userId?: string;
}

// 작명 시작 요청
export interface NamingStartRequest extends BaseEventPayload {
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: 'M' | 'F';
  lastName: string;
  preferences?: {
    style?: 'traditional' | 'modern' | 'balanced';
    values?: string[];
    avoidChars?: string[];
  };
}

// 작명 진행상황
export interface NamingProgressEvent extends BaseEventPayload {
  step: number;
  totalSteps: number;
  name: string;
  progress: number;
  message: string;
  details?: {
    currentProcess?: string;
    estimatedTimeRemaining?: number;
  };
}

// 작명 완료
export interface NamingCompleteEvent extends BaseEventPayload {
  result: {
    names: NamingResult[];
    totalGenerated: number;
    processingTime: number;
  };
}

// 개별 작명 결과
export interface NamingResult {
  fullName: string;
  lastName: string;
  firstName: string;
  lastNameHanja?: string;
  firstNameHanja?: string;
  totalStrokes: number;
  scores: {
    balance: number;    // 오행 균형
    sound: number;      // 음향
    meaning: number;    // 의미
    overall: number;    // 종합
  };
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  explanation?: string;
}

// 에러 이벤트
export interface NamingErrorEvent extends BaseEventPayload {
  error: string;
  code?: string;
  details?: any;
}

// 대기열 상태
export interface QueueStatusEvent extends BaseEventPayload {
  position: number;
  estimatedTime: number; // seconds
  totalInQueue: number;
  status: 'waiting' | 'processing' | 'ready';
}

// 서버 -> 클라이언트 이벤트 맵
export interface ServerToClientEvents {
  // 연결 관련
  connected: (data: { userId: string; socketId: string; timestamp: string }) => void;
  
  // 작명 프로세스
  'naming:started': (data: BaseEventPayload) => void;
  'naming:progress': (data: NamingProgressEvent) => void;
  'naming:complete': (data: NamingCompleteEvent) => void;
  'naming:error': (data: NamingErrorEvent) => void;
  'naming:cancelled': (data: BaseEventPayload) => void;
  
  // 대기열
  'queue:status': (data: QueueStatusEvent) => void;
  'queue:update': (data: QueueStatusEvent) => void;
  'queue:ready': (data: BaseEventPayload & { message: string }) => void;
  'queue:left': (data: BaseEventPayload) => void;
}

// 클라이언트 -> 서버 이벤트 맵
export interface ClientToServerEvents {
  // 작명 프로세스
  'naming:start': (data: NamingStartRequest, callback?: (response: any) => void) => void;
  'naming:cancel': (data: BaseEventPayload) => void;
  
  // 대기열
  'queue:join': (data: BaseEventPayload) => void;
  'queue:leave': (data: BaseEventPayload) => void;
  'queue:status': (data: BaseEventPayload) => void;
}

// Socket 데이터 타입
export interface SocketData {
  userId: string;
  sessionId?: string;
  requestId?: string;
  joinedAt?: Date;
}

// 인터페이스 익스포트 (Socket.IO 타입 정의용)
export interface InterServerEvents {
  ping: () => void;
}

// Socket.IO 네임스페이스별 타입
export type MainNamespace = {
  serverEvents: Pick<ServerToClientEvents, 'connected'>;
  clientEvents: {};
};

export type NamingNamespace = {
  serverEvents: Omit<ServerToClientEvents, 'connected' | 'queue:status' | 'queue:update' | 'queue:ready' | 'queue:left'>;
  clientEvents: Pick<ClientToServerEvents, 'naming:start' | 'naming:cancel'>;
};

export type QueueNamespace = {
  serverEvents: Pick<ServerToClientEvents, 'queue:status' | 'queue:update' | 'queue:ready' | 'queue:left'>;
  clientEvents: Pick<ClientToServerEvents, 'queue:join' | 'queue:leave' | 'queue:status'>;
};