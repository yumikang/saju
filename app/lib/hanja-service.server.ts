import { PrismaClient, Element, Prisma } from '@prisma/client';
import { prisma } from '~/lib/db.server';
import { redis } from '~/lib/redis.server';
import { CACHE_CONFIG, getCacheKey, getCacheTTL } from '~/lib/cache-config.server';

// 표준 에러 응답 형식
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 페이지네이션 응답 형식
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    cursor?: string;
    hasMore: boolean;
  };
}

// 한자 검색 옵션
export interface HanjaSearchOptions {
  reading: string;
  isSurname?: boolean;
  limit?: number;
  cursor?: string;
  sort?: 'popularity' | 'strokes' | 'element';
}

// HanjaChar 인터페이스 (프론트엔드 호환)
export interface HanjaChar {
  id: string;
  char: string;
  meaning: string;
  strokes: number;
  element: Element | null;
  koreanReading: string;
  alternativeReadings?: string[];
  isSurname?: boolean;
  priority?: number;
  usageFrequency?: number;
  nameFrequency?: number;
}

// 두음법칙 매핑
const DUEUM_MAP: Record<string, string[]> = {
  '이': ['리'],
  '리': ['이'],
  '유': ['류'],
  '류': ['유'],
  '임': ['림'],
  '림': ['임'],
  '노': ['로'],
  '로': ['노'],
  '라': ['나'],
  '나': ['라'],
  '양': ['량'],
  '량': ['양'],
  '여': ['려'],
  '려': ['여'],
  '연': ['련'],
  '련': ['연'],
  '열': ['렬'],
  '렬': ['열'],
  '염': ['렴'],
  '렴': ['염'],
  '영': ['령'],
  '령': ['영'],
  '예': ['례'],
  '례': ['예'],
  '요': ['료'],
  '료': ['요'],
  '용': ['룡'],
  '룡': ['용'],
  '우': ['루'],
  '루': ['우'],
  '육': ['륙'],
  '륙': ['육'],
  '윤': ['륜'],
  '륜': ['윤'],
  '은': ['른'],
  '른': ['은'],
  '을': ['를'],
  '를': ['을'],
  '음': ['름'],
  '름': ['음'],
  '읍': ['릅'],
  '릅': ['읍'],
  '응': ['릉'],
  '릉': ['응'],
  '의': ['리'],
  '인': ['린'],
  '린': ['인'],
  '일': ['릴'],
  '릴': ['일'],
  '익': ['릭'],
  '릭': ['익']
};

// 입력값 정규화 (NFKC + 공백 제거)
export function normalizeReading(input: string): string {
  return input.normalize('NFKC').trim();
}

// 두음법칙 확장 (입력값 + 변환값 배열 반환)
export function expandDueum(reading: string): string[] {
  const normalized = normalizeReading(reading);
  const expansions = [normalized];
  
  if (DUEUM_MAP[normalized]) {
    expansions.push(...DUEUM_MAP[normalized]);
  }
  
  return [...new Set(expansions)]; // 중복 제거
}

// 입력값 검증
export function validateInput(reading: string): { valid: boolean; error?: string } {
  if (!reading) {
    return { valid: false, error: 'Reading parameter is required' };
  }
  
  const normalized = normalizeReading(reading);
  
  if (normalized.length === 0) {
    return { valid: false, error: 'Reading cannot be empty' };
  }
  
  if (normalized.length > 10) {
    return { valid: false, error: 'Reading cannot exceed 10 characters' };
  }
  
  // 한글만 허용 (자음, 모음 제외)
  const koreanRegex = /^[가-힣]+$/;
  if (!koreanRegex.test(normalized)) {
    return { valid: false, error: 'Only Korean characters are allowed' };
  }
  
  return { valid: true };
}

// 캐시 키 생성 (버전 포함)
function generateCacheKey(options: HanjaSearchOptions): string {
  const { reading, isSurname, limit, cursor, sort } = options;
  return getCacheKey(
    'hanja:q:<reading>:<surname>:<limit>:<cursor>:<sort>:<version>',
    {
      reading,
      surname: isSurname || false,
      limit: limit || 20,
      cursor: cursor || 'none',
      sort: sort || 'default'
    }
  );
}

// DB에서 한자 검색 (Null-safe 정렬 적용 - SQLite 버전)
export async function searchHanjaFromDB(
  options: HanjaSearchOptions
): Promise<PaginatedResponse<HanjaChar>> {
  const { reading, isSurname, limit = 20, cursor, sort = 'popularity' } = options;
  
  // 입력값 검증
  const validation = validateInput(reading);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // 캐시 확인
  if (redis) {
    const cacheKey = generateCacheKey(options);
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Redis cache error:', e);
    }
  }
  
  // 두음법칙 확장
  const readings = expandDueum(reading);
  
  // 페이지네이션 설정
  const actualLimit = Math.min(limit, 50); // 최대 50개
  
  // HanjaReading 테이블에서 검색
  const hanjaReadings = await prisma.hanjaReading.findMany({
    where: {
      reading: { in: readings }
    }
  });
  
  // character 목록 추출
  const characters = [...new Set(hanjaReadings.map(hr => hr.character))];
  
  if (characters.length === 0) {
    // 검색 결과 없음
    const response: PaginatedResponse<HanjaChar> = {
      data: [],
      pagination: {
        total: 0,
        limit: actualLimit,
        cursor: undefined,
        hasMore: false
      }
    };
    
    // 캐시 저장 (TTL 구분)
    if (redis) {
      const cacheKey = generateCacheKey(options);
      const ttl = getCacheTTL(cursor);
      try {
        await redis.setex(cacheKey, ttl, JSON.stringify(response));
      } catch (e) {
        console.warn('Redis cache save error:', e);
      }
    }
    
    return response;
  }
  
  // Prisma orderBy를 사용한 Null-safe 정렬
  let orderBy: any[] = [];
  
  if (sort === 'popularity') {
    // popularity 정렬: nameFrequency와 usageFrequency 우선
    orderBy = [
      { nameFrequency: 'desc' },
      { usageFrequency: 'desc' },
      { id: 'asc' }
    ];
  } else if (sort === 'strokes') {
    // strokes 정렬: null과 0은 자연스럽게 뒤로 감
    orderBy = [
      { strokes: 'asc' },
      { id: 'asc' }
    ];
  } else if (sort === 'element') {
    // element 정렬: null은 자연스럽게 뒤로 감
    orderBy = [
      { element: 'asc' },
      { id: 'asc' }
    ];
  }
  
  // 기본 쿼리로 데이터 가져오기
  const results = await prisma.hanjaDict.findMany({
    where: {
      character: { in: characters }
    },
    take: actualLimit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy
  });
  
  // NULL/0 값을 가진 레코드를 뒤로 보내는 후처리
  if (sort === 'popularity') {
    results.sort((a, b) => {
      // NULL이나 0인 경우 뒤로
      const aHasValue = (a.nameFrequency && a.nameFrequency > 0) || (a.usageFrequency && a.usageFrequency > 0);
      const bHasValue = (b.nameFrequency && b.nameFrequency > 0) || (b.usageFrequency && b.usageFrequency > 0);
      
      if (aHasValue && !bHasValue) return -1;
      if (!aHasValue && bHasValue) return 1;
      
      // 둘 다 값이 있으면 빈도로 정렬
      if (aHasValue && bHasValue) {
        const aFreq = (a.nameFrequency || 0) + (a.usageFrequency || 0);
        const bFreq = (b.nameFrequency || 0) + (b.usageFrequency || 0);
        return bFreq - aFreq; // 내림차순
      }
      
      return 0;
    });
  } else if (sort === 'strokes') {
    results.sort((a, b) => {
      // NULL이나 0인 경우 뒤로
      const aHasValue = a.strokes && a.strokes > 0;
      const bHasValue = b.strokes && b.strokes > 0;
      
      if (aHasValue && !bHasValue) return -1;
      if (!aHasValue && bHasValue) return 1;
      
      // 둘 다 값이 있으면 획수로 정렬
      if (aHasValue && bHasValue) {
        return a.strokes! - b.strokes!; // 오름차순
      }
      
      return 0;
    });
  } else if (sort === 'element') {
    results.sort((a, b) => {
      // NULL인 경우 뒤로
      if (a.element && !b.element) return -1;
      if (!a.element && b.element) return 1;
      
      // 둘 다 값이 있으면 알파벳순
      if (a.element && b.element) {
        return a.element.localeCompare(b.element);
      }
      
      return 0;
    });
  }
  
  // HanjaChar 형식으로 변환
  const hanjaChars: HanjaChar[] = results.map(hanja => {
    let alternativeReadings: string[] = [];
    let isSurnameChar = false;
    let priority = 999;
    
    // evidenceJSON 파싱
    if (hanja.evidenceJSON) {
      try {
        const evidence = JSON.parse(hanja.evidenceJSON);
        alternativeReadings = evidence.alternativeReadings || [];
        isSurnameChar = evidence.isSurname || false;
        priority = evidence.priority || 999;
      } catch (e) {
        // 파싱 실패 무시
      }
    }
    
    // HanjaReading에서 대체 읽기 추가
    const altReadings = hanjaReadings
      .filter(hr => hr.character === hanja.character && !hr.isPrimary)
      .map(hr => hr.reading);
    
    alternativeReadings = [...new Set([...alternativeReadings, ...altReadings])];
    
    return {
      id: hanja.id,
      char: hanja.character,
      meaning: hanja.meaning || '',
      strokes: hanja.strokes || 0,
      element: hanja.element,
      koreanReading: hanja.koreanReading || reading,
      alternativeReadings,
      isSurname: isSurnameChar,
      priority,
      usageFrequency: hanja.usageFrequency || 0,
      nameFrequency: hanja.nameFrequency || 0
    };
  });
  
  // 성씨 모드일 때 priority로 추가 정렬
  if (isSurname) {
    // 먼저 성씨 여부와 priority로 정렬
    hanjaChars.sort((a, b) => {
      // 1. 성씨 우선
      if (a.isSurname && !b.isSurname) return -1;
      if (!a.isSurname && b.isSurname) return 1;
      
      // 2. priority 순 (낮은 값이 높은 우선순위)
      const aPriority = a.priority || 999;
      const bPriority = b.priority || 999;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // 3. frequency 순
      const aFreq = (a.nameFrequency || 0) + (a.usageFrequency || 0);
      const bFreq = (b.nameFrequency || 0) + (b.usageFrequency || 0);
      return bFreq - aFreq;
    });
  }
  
  // 응답 생성
  const response: PaginatedResponse<HanjaChar> = {
    data: hanjaChars,
    pagination: {
      total: characters.length,
      limit: actualLimit,
      cursor: results.length > 0 ? results[results.length - 1].id : undefined,
      hasMore: results.length === actualLimit
    }
  };
  
  // 캐시 저장 (TTL 구분)
  if (redis) {
    const cacheKey = generateCacheKey(options);
    const ttl = getCacheTTL(cursor);
    try {
      await redis.setex(cacheKey, ttl, JSON.stringify(response));
    } catch (e) {
      console.warn('Redis cache save error:', e);
    }
  }
  
  return response;
}

// 필수 성씨 30개 프리로드
export async function preloadEssentialSurnames() {
  const essentialReadings = [
    '김', '금', '이', '리', '박', '최', '정', '조', '윤', '장',
    '강', '임', '림', '한', '오', '신', '양', '량', '송', '현',
    '고', '주', '서', '문', '손', '안', '유', '류', '전', '허'
  ];
  
  for (const reading of essentialReadings) {
    await searchHanjaFromDB({
      reading,
      isSurname: true,
      limit: 10
    });
  }
  
  console.log('✅ Essential surnames preloaded');
}