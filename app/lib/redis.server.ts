import Redis from 'redis';

// Redis 클라이언트 (옵셔널 - 없어도 작동)
let redis: any = null;

if (process.env.REDIS_URL) {
  try {
    const { createClient } = Redis;
    redis = createClient({
      url: process.env.REDIS_URL
    });
    
    redis.on('error', (err: any) => {
      console.error('Redis Client Error', err);
    });
    
    redis.connect().catch((err: any) => {
      console.error('Redis connection failed:', err);
      redis = null;
    });
  } catch (e) {
    console.warn('Redis not available, running without cache');
  }
} else {
  console.info('Redis URL not configured, running without cache');
}

export { redis };