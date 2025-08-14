import { Socket } from 'socket.io';
import { queueManager } from '../queue/queue-manager';
import type { 
  QueueJoinRequest, 
  QueueLeaveRequest,
  QueueStatusEvent,
  BaseResponse 
} from '../types';

/**
 * 대기열 관련 Socket.IO 이벤트 핸들러
 */
export class QueueHandler {
  private socket: Socket;
  private userId: string;
  private statusUpdateInterval?: NodeJS.Timeout;

  constructor(socket: Socket) {
    this.socket = socket;
    this.userId = socket.data.userId || `user_${socket.id}`;
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners() {
    this.socket.on('queue:join', this.handleJoinQueue.bind(this));
    this.socket.on('queue:leave', this.handleLeaveQueue.bind(this));
    this.socket.on('queue:status', this.handleStatusRequest.bind(this));
    this.socket.on('queue:priority', this.handlePriorityRequest.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
  }

  /**
   * 대기열 참가 처리
   */
  private async handleJoinQueue(request: QueueJoinRequest) {
    console.log(`[Queue] 참가 요청: ${request.requestId}`);
    
    try {
      // 대기열에 추가
      const status = await queueManager.addToQueue({
        requestId: request.requestId,
        userId: this.userId,
        socketId: this.socket.id,
        priority: request.priority || 0,
        estimatedProcessingTime: 30,
        metadata: request.metadata
      });

      // 성공 응답
      const response: BaseResponse = {
        success: true,
        requestId: request.requestId,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('queue:joined', response);

      // 상태 전송
      this.sendQueueStatus(request.requestId, status);

      // 대기열 방에 참가
      this.socket.join(`queue:${request.requestId}`);
      
      // 주기적 상태 업데이트 시작 (10초마다)
      this.startStatusUpdates(request.requestId);
      
      // 전체 대기열 상태 브로드캐스트
      await this.broadcastQueueMetrics();
      
    } catch (error) {
      console.error('[Queue] 참가 실패:', error);
      
      const response: BaseResponse = {
        success: false,
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
        error: {
          code: 'QUEUE_JOIN_ERROR',
          message: '대기열 참가에 실패했습니다'
        }
      };
      
      this.socket.emit('queue:error', response);
    }
  }

  /**
   * 대기열 이탈 처리
   */
  private async handleLeaveQueue(request: QueueLeaveRequest) {
    console.log(`[Queue] 이탈 요청: ${request.requestId}`);
    
    try {
      // 대기열에서 제거
      await queueManager.removeFromQueue(request.requestId, this.userId);

      // 성공 응답
      const response: BaseResponse = {
        success: true,
        requestId: request.requestId,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('queue:left', response);

      // 대기열 방에서 나가기
      this.socket.leave(`queue:${request.requestId}`);
      
      // 상태 업데이트 중지
      this.stopStatusUpdates();
      
      // 전체 대기열 상태 브로드캐스트
      await this.broadcastQueueMetrics();
      
    } catch (error) {
      console.error('[Queue] 이탈 실패:', error);
      
      const response: BaseResponse = {
        success: false,
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
        error: {
          code: 'QUEUE_LEAVE_ERROR',
          message: '대기열 이탈에 실패했습니다'
        }
      };
      
      this.socket.emit('queue:error', response);
    }
  }

  /**
   * 대기열 상태 요청 처리
   */
  private async handleStatusRequest(request: { requestId: string }) {
    try {
      const status = await queueManager.getQueueStatus(request.requestId);
      this.sendQueueStatus(request.requestId, status);
    } catch (error) {
      console.error('[Queue] 상태 조회 실패:', error);
    }
  }

  /**
   * 우선순위 요청 처리 (프리미엄 사용자용)
   */
  private async handlePriorityRequest(request: {
    requestId: string;
    priority: number;
  }) {
    console.log(`[Queue] 우선순위 변경 요청: ${request.requestId}`);
    
    try {
      // 권한 확인 (실제로는 DB에서 사용자 권한 확인)
      const hasPermission = await this.checkPriorityPermission();
      
      if (!hasPermission) {
        const response: BaseResponse = {
          success: false,
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
          error: {
            code: 'PERMISSION_DENIED',
            message: '우선순위 변경 권한이 없습니다'
          }
        };
        
        this.socket.emit('queue:error', response);
        return;
      }

      // 기존 항목 제거 후 다시 추가
      await queueManager.removeFromQueue(request.requestId, this.userId);
      
      const status = await queueManager.addToQueue({
        requestId: request.requestId,
        userId: this.userId,
        socketId: this.socket.id,
        priority: request.priority,
        estimatedProcessingTime: 30
      });

      // 성공 응답
      const response: BaseResponse = {
        success: true,
        requestId: request.requestId,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('queue:priority-updated', response);
      this.sendQueueStatus(request.requestId, status);
      
    } catch (error) {
      console.error('[Queue] 우선순위 변경 실패:', error);
      
      const response: BaseResponse = {
        success: false,
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
        error: {
          code: 'PRIORITY_UPDATE_ERROR',
          message: '우선순위 변경에 실패했습니다'
        }
      };
      
      this.socket.emit('queue:error', response);
    }
  }

  /**
   * 연결 해제 처리
   */
  private async handleDisconnect() {
    console.log(`[Queue] 연결 해제: ${this.socket.id}`);
    
    // 상태 업데이트 중지
    this.stopStatusUpdates();
    
    // 사용자의 모든 대기열 항목 조회
    try {
      const userQueues = await queueManager.getUserQueues(this.userId);
      
      // 모든 대기열에서 제거
      for (const entry of userQueues) {
        if (entry.socketId === this.socket.id) {
          await queueManager.removeFromQueue(entry.requestId, this.userId);
        }
      }
    } catch (error) {
      console.error('[Queue] 연결 해제 처리 실패:', error);
    }
  }

  /**
   * 대기열 상태 전송
   */
  private sendQueueStatus(requestId: string, status: any) {
    const event: QueueStatusEvent = {
      requestId,
      timestamp: new Date().toISOString(),
      position: status.position,
      totalInQueue: status.totalInQueue,
      estimatedTime: status.estimatedWaitTime,
      status: status.isProcessing 
        ? 'processing' 
        : status.position === 1 
          ? 'ready' 
          : 'waiting'
    };
    
    this.socket.emit('queue:status', event);
    
    // 준비 완료 시 알림
    if (status.position === 1 && !status.isProcessing) {
      this.socket.emit('queue:ready', {
        requestId,
        timestamp: new Date().toISOString(),
        message: '이제 작명을 시작할 수 있습니다!'
      });
    }
  }

  /**
   * 주기적 상태 업데이트 시작
   */
  private startStatusUpdates(requestId: string) {
    this.stopStatusUpdates(); // 기존 인터벌 정리
    
    this.statusUpdateInterval = setInterval(async () => {
      try {
        const status = await queueManager.getQueueStatus(requestId);
        
        if (status.position === -1) {
          // 대기열에서 제거됨
          this.stopStatusUpdates();
          return;
        }
        
        this.sendQueueStatus(requestId, status);
        
        // 처리 시작 시 인터벌 중지
        if (status.isProcessing) {
          this.stopStatusUpdates();
          
          // 처리 시작 이벤트
          this.socket.emit('queue:processing', {
            requestId,
            timestamp: new Date().toISOString(),
            message: '작명 처리가 시작되었습니다'
          });
        }
      } catch (error) {
        console.error('[Queue] 상태 업데이트 실패:', error);
      }
    }, 10000); // 10초마다 업데이트
  }

  /**
   * 상태 업데이트 중지
   */
  private stopStatusUpdates() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = undefined;
    }
  }

  /**
   * 전체 대기열 메트릭 브로드캐스트
   */
  private async broadcastQueueMetrics() {
    try {
      const metrics = await queueManager.getQueueMetrics();
      
      // 모든 연결된 클라이언트에게 브로드캐스트
      this.socket.broadcast.emit('queue:metrics', {
        timestamp: new Date().toISOString(),
        ...metrics
      });
    } catch (error) {
      console.error('[Queue] 메트릭 브로드캐스트 실패:', error);
    }
  }

  /**
   * 우선순위 권한 확인 (실제 구현 필요)
   */
  private async checkPriorityPermission(): Promise<boolean> {
    // TODO: 실제로는 DB에서 사용자 권한 확인
    // 예: 프리미엄 구독, 특별 권한 등
    return this.socket.data.isPremium || false;
  }

  /**
   * 정리 메서드
   */
  public cleanup() {
    this.stopStatusUpdates();
    this.socket.removeAllListeners('queue:join');
    this.socket.removeAllListeners('queue:leave');
    this.socket.removeAllListeners('queue:status');
    this.socket.removeAllListeners('queue:priority');
  }
}

/**
 * 대기열 처리 워커
 * 주기적으로 대기열에서 요청을 가져와 처리
 */
export class QueueProcessor {
  private isRunning = false;
  private processingInterval?: NodeJS.Timeout;

  /**
   * 처리 시작
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[QueueProcessor] 시작됨');
    
    // 5초마다 대기열 확인
    this.processingInterval = setInterval(async () => {
      await this.processNext();
    }, 5000);
    
    // 즉시 한 번 실행
    this.processNext();
  }

  /**
   * 처리 중지
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    
    console.log('[QueueProcessor] 중지됨');
  }

  /**
   * 다음 요청 처리
   */
  private async processNext() {
    try {
      const entry = await queueManager.getNextForProcessing();
      
      if (!entry) {
        return; // 처리할 요청이 없음
      }
      
      console.log(`[QueueProcessor] 처리 시작: ${entry.requestId}`);
      
      // Socket.IO 서버 인스턴스 가져오기 (전역 변수나 싱글톤으로 관리)
      const io = global.io;
      if (io) {
        // 해당 소켓에 처리 시작 알림
        io.to(entry.socketId).emit('naming:start', {
          requestId: entry.requestId,
          timestamp: new Date().toISOString()
        });
        
        // 실제 작명 처리 트리거
        // NamingHandler의 처리 로직 호출
        setTimeout(async () => {
          // 처리 완료 표시
          await queueManager.markAsCompleted(entry.requestId);
          console.log(`[QueueProcessor] 처리 완료: ${entry.requestId}`);
        }, entry.estimatedProcessingTime * 1000);
      }
      
    } catch (error) {
      console.error('[QueueProcessor] 처리 실패:', error);
    }
  }
}

// 전역 프로세서 인스턴스
export const queueProcessor = new QueueProcessor();