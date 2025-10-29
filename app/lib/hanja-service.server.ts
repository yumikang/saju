import { PrismaClient, Element, Prisma } from '@prisma/client';
import { prisma } from '~/lib/db.server';
import { redis } from '~/lib/redis.server';
import { CACHE_CONFIG, getCacheKey, getCacheTTL } from '~/lib/cache-config.server';
import { SURNAME_MAP, getSurnameHanja, HANJA_TO_SURNAME_MAP } from '~/lib/korean-surnames.data';

// 표준 에러 응답 형식
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
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

  // 성씨 모드일 때 한국 성씨 데이터 확인
  let surnameHanjaList: string[] | undefined;
  if (isSurname) {
    surnameHanjaList = getSurnameHanja(reading);

    // 두음법칙 적용된 읽기도 확인 (예: 이/리)
    if (!surnameHanjaList) {
      for (const altReading of readings) {
        if (altReading !== reading) {
          surnameHanjaList = getSurnameHanja(altReading);
          if (surnameHanjaList) break;
        }
      }
    }

    // 복합 성씨 처리 (예: 남궁 → 南宮을 南, 宮으로 분리)
    if (surnameHanjaList) {
      const expandedList: string[] = [];
      for (const hanja of surnameHanjaList) {
        if (hanja.length > 1) {
          // 복합 한자를 개별 문자로 분리
          expandedList.push(...hanja.split(''));
        } else {
          expandedList.push(hanja);
        }
      }
      surnameHanjaList = [...new Set(expandedList)]; // 중복 제거
    }
  }

  // Prisma orderBy를 사용한 Null-safe 정렬
  type OrderByClause = { [key: string]: 'asc' | 'desc' };
  let orderBy: OrderByClause[] = [];

  if (sort === 'popularity') {
    // popularity 정렬: nameFrequency와 usageFrequency 우선
    // frequency가 모두 0일 때는 획수 적은 것 우선 (상용한자)
    orderBy = [
      { nameFrequency: 'desc' },
      { usageFrequency: 'desc' },
      { strokes: 'asc' }, // 획수 적은 것 우선
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

  // ⚠️ 부적절한 한자 필터링은 isGoodForNaming 필드로 통합 관리됨
  // taboo-rules.ts의 중앙화된 시스템이 DB 스캔을 통해 isGoodForNaming을 설정
  // 하드코딩된 BAD_CHARACTERS 리스트는 제거하고 DB 필드를 신뢰

  // HanjaDict에서 검색
  type HanjaDictRecord = Awaited<ReturnType<typeof prisma.hanjaDict.findMany>>[number];
  let results: HanjaDictRecord[] = [];

  if (isSurname && surnameHanjaList) {
    // 성씨 모드: 큐레이션된 성씨 목록만 (빈도수 필터 없음)
    // korean-surnames.data에 정의된 성씨는 모두 유효하므로 nameFrequency 관계없이 표시
    results = await prisma.hanjaDict.findMany({
      where: {
        character: { in: surnameHanjaList },
        isGoodForNaming: true  // DB 스캔으로 관리되는 필드
        // 성씨 모드에서는 nameFrequency 필터 제거
      },
      take: actualLimit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy
    });
  } else {
    // 이름 모드: 성씨 한자를 우선적으로 가져오기
    const surnameCharsForReading = getSurnameHanja(reading);
    let surnameResults: HanjaDictRecord[] = [];

    if (surnameCharsForReading) {
      // 1. 해당 읽기의 성씨 한자 먼저 가져오기
      surnameResults = await prisma.hanjaDict.findMany({
        where: {
          character: { in: surnameCharsForReading },
          isGoodForNaming: true,  // DB 스캔으로 관리되는 필드
          nameFrequency: { gte: 50 }  // 인기도 필터
        },
        orderBy
      });
    }

    // 2. 나머지 한자 가져오기 (충분한 선택지 제공)
    const remainingLimit = Math.max(actualLimit * 2, 40); // 상용한자 포함을 위해 여유있게

    const otherResults = await prisma.hanjaDict.findMany({
      where: {
        koreanReading: { in: readings },
        isGoodForNaming: true,  // DB 스캔으로 관리되는 필드
        nameFrequency: { gte: 50 },  // 인기도 필터 (50 이상)
        ...(surnameCharsForReading && { character: { notIn: surnameCharsForReading } })
      },
      take: remainingLimit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy
    });

    // 3. 성씨 한자 먼저, 그 다음 일반 한자
    results = [...surnameResults, ...otherResults];
  }
  
  // 후처리: nameFrequency < 50인 한자 제거 (캐시 이슈 방지)
  // 단, 성씨 모드에서는 이 필터를 적용하지 않음
  if (!isSurname) {
    results = results.filter(hanja => {
      const freq = hanja.nameFrequency || 0;
      return freq >= 50;
    });
  }

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

      // 둘 다 빈도가 0이면 획수로 정렬 (상용한자 우선)
      if (!aHasValue && !bHasValue) {
        return (a.strokes || 999) - (b.strokes || 999);
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
  const hanjaChars: HanjaChar[] = results.map((hanja, index) => {
    let alternativeReadings: string[] = [];
    let isSurnameChar = false;
    let priority = 999;

    // 한국 성씨 데이터에서 확인
    const surnameInfo = HANJA_TO_SURNAME_MAP.get(hanja.character);
    if (surnameInfo) {
      isSurnameChar = true;
      priority = surnameInfo.rank; // 인구순 순위를 priority로 사용
    }

    // evidenceJSON 파싱 (타입이 string인 경우만 파싱)
    if (hanja.evidenceJSON) {
      try {
        const evidence = typeof hanja.evidenceJSON === 'string'
          ? JSON.parse(hanja.evidenceJSON)
          : hanja.evidenceJSON;
        alternativeReadings = evidence.alternativeReadings || [];

        // evidenceJSON에 성씨 정보가 없으면 한국 성씨 데이터 우선
        if (!isSurnameChar && evidence.isSurname) {
          isSurnameChar = evidence.isSurname;
        }

        // priority도 성씨 데이터가 우선
        if (!surnameInfo && evidence.priority) {
          priority = evidence.priority;
        }
      } catch (e) {
        // 파싱 실패 무시
      }
    }

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
  
  // 성씨/이름 모드 공통: 성씨 한자를 우선적으로 표시
  hanjaChars.sort((a, b) => {
    // 1. 성씨 우선 (이름에 사용하더라도 성씨 한자가 먼저)
    if (a.isSurname && !b.isSurname) return -1;
    if (!a.isSurname && b.isSurname) return 1;

    // 2. 성씨끼리는 priority 순 (인구 많은 성씨 우선)
    if (a.isSurname && b.isSurname) {
      const aPriority = a.priority || 999;
      const bPriority = b.priority || 999;
      if (aPriority !== bPriority) return aPriority - bPriority;
    }

    // 3. 일반 한자끼리는 획수 순 (상용한자 우선)
    if (!a.isSurname && !b.isSurname) {
      return (a.strokes || 999) - (b.strokes || 999);
    }

    // 4. 그 외는 frequency 순
    const aFreq = (a.nameFrequency || 0) + (a.usageFrequency || 0);
    const bFreq = (b.nameFrequency || 0) + (b.usageFrequency || 0);
    return bFreq - aFreq;
  });
  
  // 응답 생성
  const response: PaginatedResponse<HanjaChar> = {
    data: hanjaChars,
    pagination: {
      total: results.length,
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