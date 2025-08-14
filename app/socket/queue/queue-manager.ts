import { redisManager, REDIS_KEYS, REDIS_TTL, withRedisLock } from './redis-client';
import type { RedisClientType } from 'redis';

export interface QueueEntry {
  requestId: string;
  userId: string;
  socketId: string;
  priority: number;
  joinedAt: number;
  estimatedProcessingTime: number;
  metadata?: Record<string, any>;
}

export interface QueueStatus {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number;
  isProcessing: boolean;
  queueType: 'normal' | 'priority';
}

/**
 * 대기열 관리자
 * Redis Sorted Set을 사용한 공정한 순서 처리 시스템
 */
export class QueueManager {
  private static instance: QueueManager;
  private processingCapacity = 5; // 동시 처리 가능한 요청 수
  private averageProcessingTime = 30; // 평균 처리 시간 (초)

  private constructor() {}

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * 대기열에 사용자 추가
   */
  async addToQueue(entry: Omit<QueueEntry, 'joinedAt'>): Promise<QueueStatus> {
    const client = redisManager.getClient();
    const now = Date.now();
    
    return withRedisLock(REDIS_KEYS.LOCK.QUEUE, 5, async () => {
      // 중복 확인
      const existingScore = await client.zScore(
        REDIS_KEYS.QUEUE.MAIN, 
        entry.requestId
      );
      
      if (existingScore !== null) {
        // 이미 대기열에 있는 경우 현재 상태 반환
        return this.getQueueStatus(entry.requestId);
      }

      // 우선순위 계산 (낮은 점수가 높은 우선순위)
      const score = entry.priority > 0 
        ? now / 1000 - entry.priority * 1000  // 우선순위가 있으면 점수를 낮춤
        : now / 1000;

      // 대기열에 추가
      const queueKey = entry.priority > 0 
        ? REDIS_KEYS.QUEUE.PRIORITY 
        : REDIS_KEYS.QUEUE.MAIN;
      
      await client.zAdd(queueKey, {
        score,
        value: entry.requestId
      });

      // 메타데이터 저장
      const fullEntry: QueueEntry = {
        ...entry,
        joinedAt: now
      };
      
      await client.hSet(
        REDIS_KEYS.QUEUE.USER(entry.userId),
        entry.requestId,
        JSON.stringify(fullEntry)
      );
      
      // TTL 설정
      await client.expire(
        REDIS_KEYS.QUEUE.USER(entry.userId),
        REDIS_TTL.SESSION
      );

      // 대기열 상태 반환
      return this.getQueueStatus(entry.requestId);
    });
  }

  /**
   * 대기열에서 제거
   */
  async removeFromQueue(requestId: string, userId: string): Promise<void> {
    const client = redisManager.getClient();
    
    await withRedisLock(REDIS_KEYS.LOCK.QUEUE, 5, async () => {
      // 모든 대기열에서 제거
      await Promise.all([
        client.zRem(REDIS_KEYS.QUEUE.MAIN, requestId),
        client.zRem(REDIS_KEYS.QUEUE.PRIORITY, requestId),
        client.sRem(REDIS_KEYS.QUEUE.PROCESSING, requestId),
        client.hDel(REDIS_KEYS.QUEUE.USER(userId), requestId)
      ]);
    });
  }

  /**
   * 다음 처리할 요청 가져오기
   */
  async getNextForProcessing(): Promise<QueueEntry | null> {
    const client = redisManager.getClient();
    
    return withRedisLock(REDIS_KEYS.LOCK.QUEUE, 5, async () => {
      // 현재 처리 중인 수 확인
      const processingCount = await client.sCard(REDIS_KEYS.QUEUE.PROCESSING);
      
      if (processingCount >= this.processingCapacity) {
        return null; // 처리 용량 초과
      }

      // 우선순위 대기열 먼저 확인
      let result = await client.zPopMin(REDIS_KEYS.QUEUE.PRIORITY);
      
      // 우선순위 대기열이 비어있으면 일반 대기열 확인
      if (!result) {
        result = await client.zPopMin(REDIS_KEYS.QUEUE.MAIN);
      }
      
      if (!result) {
        return null; // 대기열이 비어있음
      }

      const requestId = result.value;
      
      // 처리 중 목록에 추가
      await client.sAdd(REDIS_KEYS.QUEUE.PROCESSING, requestId);
      
      // 메타데이터 조회
      const users = await client.keys(REDIS_KEYS.QUEUE.USER('*'));
      for (const userKey of users) {
        const entryJson = await client.hGet(userKey, requestId);
        if (entryJson) {
          const entry = JSON.parse(entryJson) as QueueEntry;
          
          // 처리 시작 시간 업데이트
          entry.metadata = {
            ...entry.metadata,
            processingStartedAt: Date.now()
          };
          
          await client.hSet(userKey, requestId, JSON.stringify(entry));
          return entry;
        }
      }
      
      return null;
    });
  }

  /**
   * 처리 완료 표시
   */
  async markAsCompleted(requestId: string): Promise<void> {
    const client = redisManager.getClient();
    
    await withRedisLock(REDIS_KEYS.LOCK.QUEUE, 5, async () => {
      // 처리 중 목록에서 제거
      await client.sRem(REDIS_KEYS.QUEUE.PROCESSING, requestId);
      
      // 메트릭 업데이트
      const today = new Date().toISOString().split('T')[0];
      await client.hIncrBy(REDIS_KEYS.METRICS.DAILY(today), 'completed', 1);
      
      // 평균 처리 시간 업데이트 (이동 평균)
      const metrics = await client.hGetAll(REDIS_KEYS.METRICS.REALTIME);
      const currentAvg = parseFloat(metrics.avgProcessingTime || '30');
      const count = parseInt(metrics.totalProcessed || '0');
      
      // 실제 처리 시간 계산 (메타데이터에서)
      const users = await client.keys(REDIS_KEYS.QUEUE.USER('*'));
      let actualProcessingTime = 30;
      
      for (const userKey of users) {
        const entryJson = await client.hGet(userKey, requestId);
        if (entryJson) {
          const entry = JSON.parse(entryJson) as QueueEntry;
          if (entry.metadata?.processingStartedAt) {
            actualProcessingTime = (Date.now() - entry.metadata.processingStartedAt) / 1000;
          }
          // 사용자 데이터에서 제거
          await client.hDel(userKey, requestId);
          break;
        }
      }
      
      // 새 평균 계산
      const newAvg = (currentAvg * count + actualProcessingTime) / (count + 1);
      this.averageProcessingTime = newAvg;
      
      await client.hSet(REDIS_KEYS.METRICS.REALTIME, {
        avgProcessingTime: newAvg.toString(),
        totalProcessed: (count + 1).toString(),
        lastProcessedAt: Date.now().toString()
      });
    });
  }

  /**
   * 대기열 상태 조회
   */
  async getQueueStatus(requestId: string): Promise<QueueStatus> {
    const client = redisManager.getClient();
    
    // 처리 중인지 확인
    const isProcessing = await client.sIsMember(
      REDIS_KEYS.QUEUE.PROCESSING, 
      requestId
    );
    
    if (isProcessing) {
      return {
        position: 0,
        totalInQueue: 0,
        estimatedWaitTime: 0,
        isProcessing: true,
        queueType: 'normal'
      };
    }

    // 우선순위 대기열 확인
    let position = await client.zRank(REDIS_KEYS.QUEUE.PRIORITY, requestId);
    let queueType: 'normal' | 'priority' = 'priority';
    let totalInQueue = await client.zCard(REDIS_KEYS.QUEUE.PRIORITY);
    
    // 일반 대기열 확인
    if (position === null) {
      position = await client.zRank(REDIS_KEYS.QUEUE.MAIN, requestId);
      queueType = 'normal';
      totalInQueue = await client.zCard(REDIS_KEYS.QUEUE.MAIN);
      
      // 우선순위 대기열도 고려
      const priorityCount = await client.zCard(REDIS_KEYS.QUEUE.PRIORITY);
      if (priorityCount > 0) {
        position = position !== null ? position + priorityCount : null;
        totalInQueue += priorityCount;
      }
    }
    
    if (position === null) {
      // 대기열에 없음
      return {
        position: -1,
        totalInQueue: 0,
        estimatedWaitTime: 0,
        isProcessing: false,
        queueType: 'normal'
      };
    }

    // 현재 처리 중인 수
    const processingCount = await client.sCard(REDIS_KEYS.QUEUE.PROCESSING);
    
    // 예상 대기 시간 계산
    const effectivePosition = Math.max(0, position - (this.processingCapacity - processingCount));
    const batchesAhead = Math.ceil(effectivePosition / this.processingCapacity);
    const estimatedWaitTime = batchesAhead * this.averageProcessingTime;

    return {
      position: position + 1, // 1부터 시작
      totalInQueue,
      estimatedWaitTime: Math.round(estimatedWaitTime),
      isProcessing: false,
      queueType
    };
  }

  /**
   * 전체 대기열 상태 조회
   */
  async getQueueMetrics(): Promise<{
    normalQueue: number;
    priorityQueue: number;
    processing: number;
    capacity: number;
    averageWaitTime: number;
    estimatedTotalTime: number;
  }> {
    const client = redisManager.getClient();
    
    const [normalCount, priorityCount, processingCount] = await Promise.all([
      client.zCard(REDIS_KEYS.QUEUE.MAIN),
      client.zCard(REDIS_KEYS.QUEUE.PRIORITY),
      client.sCard(REDIS_KEYS.QUEUE.PROCESSING)
    ]);
    
    const totalWaiting = normalCount + priorityCount;
    const estimatedTotalTime = Math.ceil(totalWaiting / this.processingCapacity) * this.averageProcessingTime;
    
    return {
      normalQueue: normalCount,
      priorityQueue: priorityCount,
      processing: processingCount,
      capacity: this.processingCapacity,
      averageWaitTime: this.averageProcessingTime,
      estimatedTotalTime
    };
  }

  /**
   * 사용자의 모든 대기 요청 조회
   */
  async getUserQueues(userId: string): Promise<QueueEntry[]> {
    const client = redisManager.getClient();
    const entries = await client.hGetAll(REDIS_KEYS.QUEUE.USER(userId));
    
    return Object.values(entries).map(json => JSON.parse(json) as QueueEntry);
  }

  /**
   * 대기열 정리 (오래된 항목 제거)
   */
  async cleanupQueue(maxAge: number = 3600): Promise<number> {
    const client = redisManager.getClient();
    const cutoffTime = Date.now() / 1000 - maxAge;
    
    return withRedisLock(REDIS_KEYS.LOCK.QUEUE, 10, async () => {
      let removed = 0;
      
      // 오래된 항목 제거
      removed += await client.zRemRangeByScore(
        REDIS_KEYS.QUEUE.MAIN, 
        '-inf', 
        cutoffTime
      );
      
      removed += await client.zRemRangeByScore(
        REDIS_KEYS.QUEUE.PRIORITY, 
        '-inf', 
        cutoffTime
      );
      
      console.log(`대기열 정리: ${removed}개 항목 제거됨`);
      return removed;
    });
  }

  /**
   * 처리 용량 동적 조정
   */
  async adjustCapacity(newCapacity: number): Promise<void> {
    if (newCapacity < 1 || newCapacity > 20) {
      throw new Error('처리 용량은 1-20 사이여야 합니다');
    }
    
    this.processingCapacity = newCapacity;
    
    const client = redisManager.getClient();
    await client.hSet(REDIS_KEYS.QUEUE.METADATA, 'capacity', newCapacity.toString());
    
    console.log(`처리 용량 조정: ${newCapacity}`);
  }

  /**
   * 초기화 (서버 시작 시)
   */
  async initialize(): Promise<void> {
    const client = redisManager.getClient();
    
    // 메타데이터에서 설정 로드
    const metadata = await client.hGetAll(REDIS_KEYS.QUEUE.METADATA);
    
    if (metadata.capacity) {
      this.processingCapacity = parseInt(metadata.capacity);
    }
    
    if (metadata.avgProcessingTime) {
      this.averageProcessingTime = parseFloat(metadata.avgProcessingTime);
    }
    
    // 처리 중 목록 초기화 (서버 재시작 시)
    await client.del(REDIS_KEYS.QUEUE.PROCESSING);
    
    console.log('대기열 관리자 초기화 완료', {
      capacity: this.processingCapacity,
      avgProcessingTime: this.averageProcessingTime
    });
  }
}

export const queueManager = QueueManager.getInstance();