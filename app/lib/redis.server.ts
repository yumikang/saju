/**
 * Redis Client Singleton
 *
 * Naming pipeline 캐싱을 위한 Redis 클라이언트 관리
 */

import { createClient, type RedisClientType } from 'redis';

export type RedisClient = RedisClientType;

// Singleton instance
let redis: RedisClient | null = null;
let isConnecting = false;

/**
 * Redis 클라이언트 초기화 및 반환
 *
 * @returns Redis client instance or null if not available
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  // 이미 연결되어 있으면 반환
  if (redis?.isOpen) {
    return redis;
  }

  // 연결 중이면 대기
  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return redis?.isOpen ? redis : null;
  }

  // Redis URL이 설정되지 않으면 null 반환
  if (!process.env.REDIS_URL) {
    console.info('Redis URL not configured, caching disabled');
    return null;
  }

  try {
    isConnecting = true;

    redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000); // 최대 3초 대기
        },
      },
    });

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis: Connected');
    });

    redis.on('ready', () => {
      console.log('Redis: Ready for commands');
    });

    await redis.connect();
    isConnecting = false;

    return redis;
  } catch (error) {
    console.error('Redis connection failed:', error);
    redis = null;
    isConnecting = false;
    return null;
  }
}

/**
 * Redis 연결 종료
 */
export async function disconnectRedis(): Promise<void> {
  if (redis?.isOpen) {
    await redis.quit();
    redis = null;
    console.log('Redis: Disconnected');
  }
}

/**
 * Redis PING 테스트
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis ping failed:', error);
    return false;
  }
}

// 기존 export도 유지 (하위 호환성)
export { redis };