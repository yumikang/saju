import { PrismaClient, Element } from '@prisma/client';
import { prisma } from '~/lib/db.server';
import { redis } from '~/lib/redis.server';

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

// 캐시 키 생성
function getCacheKey(options: HanjaSearchOptions): string {
  const { reading, isSurname, limit, cursor, sort } = options;
  return `hanja:q:${reading}:${isSurname || false}:${limit || 20}:${cursor || ''}:${sort || 'default'}`;
}

// DB에서 한자 검색 (HanjaReading 테이블 활용)
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
    const cacheKey = getCacheKey(options);
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
    },
    include: {
      // HanjaDict와 조인하기 위해 character로 연결
      // Prisma 스키마에 relation이 없으므로 별도 쿼리 필요
    }
  });
  
  // character 목록 추출
  const characters = [...new Set(hanjaReadings.map(hr => hr.character))];
  
  // HanjaDict에서 상세 정보 가져오기
  let query = prisma.hanjaDict.findMany({
    where: {
      character: { in: characters }
    },
    take: actualLimit
  });
  
  // 커서 기반 페이지네이션
  if (cursor) {
    query = prisma.hanjaDict.findMany({
      where: {
        character: { in: characters }
      },
      take: actualLimit,
      skip: 1,
      cursor: { id: cursor }
    });
  }
  
  // 정렬
  let orderBy: any = {};
  switch (sort) {
    case 'popularity':
      orderBy = [
        { nameFrequency: 'desc' },
        { usageFrequency: 'desc' }
      ];
      break;
    case 'strokes':
      orderBy = { strokes: 'asc' };
      break;
    case 'element':
      orderBy = { element: 'asc' };
      break;
  }
  
  const results = await prisma.hanjaDict.findMany({
    where: {
      character: { in: characters }
    },
    take: actualLimit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy
  });
  
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
    hanjaChars.sort((a, b) => (a.priority || 999) - (b.priority || 999));
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
  
  // 캐시 저장 (24시간)
  if (redis) {
    const cacheKey = getCacheKey(options);
    try {
      await redis.setex(cacheKey, 86400, JSON.stringify(response));
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