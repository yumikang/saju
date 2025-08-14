import { beforeAll, afterAll, afterEach } from 'vitest';
import { config } from 'dotenv';

// 환경 변수 로드
config({ path: '.env.test' });

// 전역 테스트 설정
beforeAll(() => {
  // 테스트 환경 설정
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = 'redis://localhost:6379/1'; // 테스트용 Redis DB
  
  // 콘솔 로그 억제 (필요시)
  if (process.env.SUPPRESS_LOGS === 'true') {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
  }
});

afterAll(() => {
  // 전역 정리
});

afterEach(() => {
  // 각 테스트 후 정리
});