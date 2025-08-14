import { createClient, RedisClientType } from 'redis';

/**
 * Redis 클라이언트 싱글톤
 * 대기열 관리, 캐싱, Pub/Sub을 위한 Redis 연결 관리
 */
class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  /**
   * Redis 연결 초기화
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      // Redis 연결 설정
      const redisConfig = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('Redis: 최대 재연결 시도 횟수 초과');
              return new Error('최대 재연결 시도 횟수 초과');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      };

      // 메인 클라이언트
      this.client = createClient(redisConfig);
      this.client.on('error', (err) => console.error('Redis Client Error:', err));
      this.client.on('connect', () => console.log('Redis: 메인 클라이언트 연결됨'));
      this.client.on('ready', () => console.log('Redis: 메인 클라이언트 준비됨'));
      
      // Pub/Sub 클라이언트
      this.pubClient = createClient(redisConfig);
      this.subClient = createClient(redisConfig);
      
      // 모든 클라이언트 연결
      await Promise.all([
        this.client.connect(),
        this.pubClient.connect(),
        this.subClient.connect()
      ]);

      this.isConnected = true;
      console.log('Redis: 모든 클라이언트 연결 완료');
    } catch (error) {
      console.error('Redis 연결 실패:', error);
      throw error;
    }
  }

  /**
   * Redis 연결 종료
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await Promise.all([
        this.client?.quit(),
        this.pubClient?.quit(),
        this.subClient?.quit()
      ]);
      
      this.isConnected = false;
      console.log('Redis: 모든 클라이언트 연결 종료');
    } catch (error) {
      console.error('Redis 연결 종료 실패:', error);
    }
  }

  /**
   * 메인 클라이언트 반환
   */
  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis 클라이언트가 연결되지 않았습니다');
    }
    return this.client;
  }

  /**
   * Pub 클라이언트 반환
   */
  getPubClient(): RedisClientType {
    if (!this.pubClient || !this.isConnected) {
      throw new Error('Redis Pub 클라이언트가 연결되지 않았습니다');
    }
    return this.pubClient;
  }

  /**
   * Sub 클라이언트 반환
   */
  getSubClient(): RedisClientType {
    if (!this.subClient || !this.isConnected) {
      throw new Error('Redis Sub 클라이언트가 연결되지 않았습니다');
    }
    return this.subClient;
  }

  /**
   * 연결 상태 확인
   */
  isReady(): boolean {
    return this.isConnected && 
           this.client?.isReady && 
           this.pubClient?.isReady && 
           this.subClient?.isReady;
  }
}

// 싱글톤 인스턴스 export
export const redisManager = RedisManager.getInstance();

// Redis 키 네임스페이스
export const REDIS_KEYS = {
  // 대기열 관련
  QUEUE: {
    MAIN: 'queue:main',                    // 메인 대기열 (Sorted Set)
    PRIORITY: 'queue:priority',            // 우선순위 대기열
    PROCESSING: 'queue:processing',        // 처리 중인 요청
    METADATA: 'queue:metadata',            // 대기열 메타데이터
    USER: (userId: string) => `queue:user:${userId}`, // 사용자별 대기 정보
  },
  
  // 작명 프로세스 관련
  NAMING: {
    SESSION: (requestId: string) => `naming:session:${requestId}`,
    PROGRESS: (requestId: string) => `naming:progress:${requestId}`,
    RESULTS: (requestId: string) => `naming:results:${requestId}`,
    HISTORY: (userId: string) => `naming:history:${userId}`,
  },
  
  // 통계 및 메트릭
  METRICS: {
    DAILY: (date: string) => `metrics:daily:${date}`,
    HOURLY: (hour: string) => `metrics:hourly:${hour}`,
    REALTIME: 'metrics:realtime',
    USER: (userId: string) => `metrics:user:${userId}`,
  },
  
  // 캐시
  CACHE: {
    SAJU: (birth: string) => `cache:saju:${birth}`,
    ELEMENTS: (data: string) => `cache:elements:${data}`,
    NAMES: (params: string) => `cache:names:${params}`,
  },
  
  // 세션 및 상태
  SESSION: {
    SOCKET: (socketId: string) => `session:socket:${socketId}`,
    USER: (userId: string) => `session:user:${userId}`,
  },
  
  // 잠금 (분산 락)
  LOCK: {
    QUEUE: 'lock:queue',
    NAMING: (requestId: string) => `lock:naming:${requestId}`,
  }
};

// TTL 설정 (초 단위)
export const REDIS_TTL = {
  SESSION: 3600,        // 1시간
  CACHE_SHORT: 300,     // 5분
  CACHE_MEDIUM: 1800,   // 30분
  CACHE_LONG: 86400,    // 24시간
  RESULTS: 604800,      // 7일
  METRICS: 2592000,     // 30일
};

// Redis 트랜잭션 헬퍼
export async function withRedisTransaction<T>(
  fn: (client: RedisClientType) => Promise<T>
): Promise<T> {
  const client = redisManager.getClient();
  
  try {
    const multi = client.multi();
    const result = await fn(multi as any);
    await multi.exec();
    return result;
  } catch (error) {
    console.error('Redis 트랜잭션 실패:', error);
    throw error;
  }
}

// Redis 분산 락 헬퍼
export async function withRedisLock<T>(
  lockKey: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const client = redisManager.getClient();
  const lockValue = `${Date.now()}_${Math.random()}`;
  
  try {
    // 락 획득 시도
    const acquired = await client.set(lockKey, lockValue, {
      NX: true,
      EX: ttl
    });
    
    if (!acquired) {
      throw new Error('락을 획득할 수 없습니다');
    }
    
    // 작업 실행
    const result = await fn();
    
    // 락 해제 (본인이 설정한 락인지 확인)
    const currentValue = await client.get(lockKey);
    if (currentValue === lockValue) {
      await client.del(lockKey);
    }
    
    return result;
  } catch (error) {
    console.error('Redis 락 처리 실패:', error);
    throw error;
  }
}