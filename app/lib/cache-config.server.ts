// 캐시 설정 및 전략
export const CACHE_CONFIG = {
  // TTL 설정 (초 단위)
  TTL: {
    FIRST_PAGE: 24 * 60 * 60,  // 24시간 - 첫 페이지 (가장 자주 조회)
    CURSOR_PAGE: 4 * 60 * 60,  // 4시간 - 커서 페이지 (덜 자주 조회)
    ESSENTIAL: 7 * 24 * 60 * 60, // 7일 - 필수 성씨 (거의 변경 없음)
  },
  
  // 데이터 버전 (ETL 실행 시 증가)
  DATA_VERSION: process.env.DATA_VERSION || '1.0.0',
  
  // 캐시 키 패턴
  KEY_PATTERNS: {
    HANJA_SEARCH: 'hanja:q:<reading>:<surname>:<limit>:<cursor>:<sort>:<version>',
    ESSENTIAL_SURNAMES: 'hanja:essential:<version>',
  },
  
  // 캐시 무효화 전략
  INVALIDATION: {
    ON_ETL: true,           // ETL 실행 시 전체 무효화
    ON_DATA_UPDATE: true,   // 데이터 업데이트 시 관련 키만 무효화
    VERSION_BASED: true,    // DATA_VERSION 변경 시 자동 무효화
  }
};

// 캐시 키 생성 헬퍼
export function getCacheKey(
  pattern: string,
  params: Record<string, any>
): string {
  let key = pattern;
  
  // 자동으로 DATA_VERSION 추가
  params.version = CACHE_CONFIG.DATA_VERSION;
  
  Object.entries(params).forEach(([param, value]) => {
    key = key.replace(`<${param}>`, String(value || 'default'));
  });
  
  return key;
}

// TTL 결정 로직
export function getCacheTTL(cursor?: string): number {
  // 커서가 없으면 첫 페이지
  if (!cursor) {
    return CACHE_CONFIG.TTL.FIRST_PAGE;
  }
  
  // 커서가 있으면 후속 페이지
  return CACHE_CONFIG.TTL.CURSOR_PAGE;
}

// 캐시 무효화 패턴
export async function invalidateCachePattern(
  redis: any,
  pattern: string
): Promise<number> {
  if (!redis) return 0;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      return await redis.del(...keys);
    }
    return 0;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// ETL 후 캐시 무효화
export async function invalidateAfterETL(redis: any): Promise<void> {
  if (!redis || !CACHE_CONFIG.INVALIDATION.ON_ETL) return;
  
  try {
    // 모든 한자 검색 캐시 무효화
    await invalidateCachePattern(redis, 'hanja:q:*');
    await invalidateCachePattern(redis, 'hanja:essential:*');
    
    console.log('✅ Cache invalidated after ETL');
  } catch (error) {
    console.error('ETL cache invalidation error:', error);
  }
}