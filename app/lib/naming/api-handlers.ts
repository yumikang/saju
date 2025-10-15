/**
 * Naming API Business Logic Handlers
 *
 * Separates business logic from Remix route handlers.
 * Integrates Phase 1 components (SajuCalculator, HanjaMatcher) with API layer.
 */

import { PrismaClient, Element } from '@prisma/client';
import { SajuCalculator, type SajuResult } from '../saju/calculator';
import { HanjaMatcher, type MatchingOptions } from './matcher';
import type { ScoredCandidate } from './types';
import type {
  AnalyzeRequest,
  RecommendRequest,
  CharacterParams,
  CharacterQuery,
} from './validators';
import {
  NotFoundError,
  SajuCalculationError,
  ValidationError,
  InsufficientCharactersError,
} from './errors';

const prisma = new PrismaClient();

// ============================================================
// Type Definitions
// ============================================================

export interface AnalyzeResponse {
  success: true;
  data: {
    sajuDataId: string;
    pillars: SajuResult['pillars'];
    dayMaster: SajuResult['dayMaster'];
    elementCounts: SajuResult['elementCounts'];
    lackingElements: Element[];
    favorableElements: Element[];
    yongsin: SajuResult['yongsin'];
  };
  metadata: {
    calculationTime: number;
    timestamp: string;
  };
}

export interface RecommendResponse {
  success: true;
  data: {
    candidates: ScoredCandidate[];
    saju: {
      lackingElements: Element[];
      favorableElements: Element[];
      elementCounts: Record<Element, number>;
    };
  };
  metadata: {
    totalGenerated: number;
    totalScored: number;
    executionTime: number;
    timestamp: string;
  };
}

export interface CharacterResponse {
  success: true;
  data: {
    id: string;
    character: string;
    meaning: string | null;
    strokes: number | null;
    element: Element | null;
    yinYang: string | null;
    koreanReading: string | null;
    chineseReading: string | null;
    radical: string | null;
    usageFrequency: number | null;
    nameFrequency: number | null;
    category: string | null;
    gender: string | null;
    isGoodForNaming: boolean;
    alternativeReadings?: Array<{
      reading: string;
      isPrimary: boolean;
      soundElement: Element | null;
    }>;
  };
}

// ============================================================
// Handler: Analyze Birth Data
// ============================================================

/**
 * 사주 분석 핸들러
 *
 * POST /api/naming/analyze
 *
 * @param request - Validated birth data
 * @param userId - Optional user ID for tracking
 */
export async function handleAnalyze(
  request: AnalyzeRequest,
  userId?: string
): Promise<AnalyzeResponse> {
  const startTime = Date.now();

  try {
    // 1. Calculate Saju using Phase 1 SajuCalculator
    const calculator = new SajuCalculator();
    const birthDateTime = new Date(`${request.birthDate}T${request.birthTime}`);

    const sajuResult = calculator.calculate(
      birthDateTime,
      request.birthTime,
      request.isLunar
    );

    // 2. Save to database for future reference
    const sajuData = await prisma.sajuData.create({
      data: {
        userId: userId || 'anonymous',
        name: '', // To be filled when name is chosen
        birthDate: new Date(request.birthDate),
        birthTime: request.birthTime,
        isLunar: request.isLunar,
        gender: request.gender,
        yearGan: sajuResult.pillars.year.stem,
        yearJi: sajuResult.pillars.year.branch,
        monthGan: sajuResult.pillars.month.stem,
        monthJi: sajuResult.pillars.month.branch,
        dayGan: sajuResult.pillars.day.stem,
        dayJi: sajuResult.pillars.day.branch,
        hourGan: sajuResult.pillars.hour.stem,
        hourJi: sajuResult.pillars.hour.branch,
        woodCount: Math.round(sajuResult.elementCounts[Element.WOOD]),
        fireCount: Math.round(sajuResult.elementCounts[Element.FIRE]),
        earthCount: Math.round(sajuResult.elementCounts[Element.EARTH]),
        metalCount: Math.round(sajuResult.elementCounts[Element.METAL]),
        waterCount: Math.round(sajuResult.elementCounts[Element.WATER]),
        primaryYongsin: sajuResult.yongsin.primary,
        secondaryYongsin: sajuResult.yongsin.secondary || null,
      },
    });

    const calculationTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        sajuDataId: sajuData.id,
        pillars: sajuResult.pillars,
        dayMaster: sajuResult.dayMaster,
        elementCounts: sajuResult.elementCounts,
        lackingElements: sajuResult.lackingElements,
        favorableElements: sajuResult.favorableElements,
        yongsin: sajuResult.yongsin,
      },
      metadata: {
        calculationTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[handleAnalyze] Error:', error);
    throw new SajuCalculationError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================
// Handler: Recommend Names
// ============================================================

/**
 * 이름 추천 핸들러
 *
 * POST /api/naming/recommend
 *
 * @param request - Validated recommendation request
 * @param userId - Optional user ID for tracking
 */
export async function handleRecommendation(
  request: RecommendRequest,
  userId?: string
): Promise<RecommendResponse> {
  const startTime = Date.now();

  // 1. Get or calculate Saju
  let sajuResult: SajuResult;

  if (request.sajuDataId) {
    // Option 1: Load from database
    const sajuData = await prisma.sajuData.findUnique({
      where: { id: request.sajuDataId },
    });

    if (!sajuData) {
      throw new NotFoundError('Saju data', '사주 데이터를 찾을 수 없습니다');
    }

    // Reconstruct SajuResult from database
    sajuResult = reconstructSajuFromDB(sajuData);
  } else if (request.birthData) {
    // Option 2: Calculate on-the-fly
    const calculator = new SajuCalculator();
    const birthDateTime = new Date(
      `${request.birthData.birthDate}T${request.birthData.birthTime}`
    );

    sajuResult = calculator.calculate(
      birthDateTime,
      request.birthData.birthTime,
      request.birthData.isLunar
    );
  } else {
    throw new ValidationError(
      'Either sajuDataId or birthData required',
      'sajuDataId 또는 birthData 중 하나는 필수입니다'
    );
  }

  // 2. Generate name candidates using Phase 1 HanjaMatcher
  const matcher = new HanjaMatcher();
  const matchingOptions: MatchingOptions = {
    minScore: request.preferences?.minScore ?? 60,
    maxResults: request.preferences?.maxResults ?? 100,
    gender: request.preferences?.gender as 'male' | 'female' | undefined,
    avoidChars: request.preferences?.avoidCharacters,
    preferredElements: request.preferences?.preferredElements,
    enableEarlyTermination: true,
  };

  const candidates = await matcher.findOptimalNames(
    sajuResult,
    request.lastName,
    matchingOptions
  );

  // 3. Validate results
  if (candidates.length === 0) {
    throw new InsufficientCharactersError(0);
  }

  const executionTime = Date.now() - startTime;

  // 4. Performance warning (target: <5s)
  if (executionTime > 5000) {
    console.warn(
      `[Performance Warning] Recommendation took ${executionTime}ms (target: <5000ms)`
    );
  }

  return {
    success: true,
    data: {
      candidates,
      saju: {
        lackingElements: sajuResult.lackingElements,
        favorableElements: sajuResult.favorableElements,
        elementCounts: sajuResult.elementCounts,
      },
    },
    metadata: {
      totalGenerated: candidates.length,
      totalScored: candidates.length,
      executionTime,
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================================
// Handler: Character Lookup
// ============================================================

/**
 * 한자 상세 정보 조회 핸들러
 *
 * GET /api/naming/character/:id
 *
 * @param params - Validated character ID or character itself
 * @param query - Optional query parameters (include)
 */
export async function handleCharacterLookup(
  params: CharacterParams,
  query?: CharacterQuery
): Promise<CharacterResponse> {
  const { id } = params;
  const { include } = query || {};

  // Try to find by UUID first, then by character
  const whereClause = id.length === 1 ? { character: id } : { id };

  const hanjaDict = await prisma.hanjaDict.findFirst({
    where: whereClause,
    include: {
      ...(include === 'readings' || include === 'all'
        ? {
            readings: {
              select: {
                reading: true,
                isPrimary: true,
                soundElem: true,
              },
            },
          }
        : {}),
    },
  });

  if (!hanjaDict) {
    throw new NotFoundError('Character', '한자를 찾을 수 없습니다');
  }

  return {
    success: true,
    data: {
      id: hanjaDict.id,
      character: hanjaDict.character,
      meaning: hanjaDict.meaning,
      strokes: hanjaDict.strokes,
      element: hanjaDict.element,
      yinYang: hanjaDict.yinYang,
      koreanReading: hanjaDict.koreanReading,
      chineseReading: hanjaDict.chineseReading,
      radical: hanjaDict.radical,
      usageFrequency: hanjaDict.usageFrequency,
      nameFrequency: hanjaDict.nameFrequency,
      category: hanjaDict.category,
      gender: hanjaDict.gender,
      isGoodForNaming: hanjaDict.isGoodForNaming,
      ...(include === 'readings' || include === 'all'
        ? {
            alternativeReadings: (hanjaDict as any).readings?.map((r: any) => ({
              reading: r.reading,
              isPrimary: r.isPrimary,
              soundElement: r.soundElem,
            })),
          }
        : {}),
    },
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * DB에서 가져온 사주 데이터를 SajuResult로 재구성
 */
function reconstructSajuFromDB(sajuData: any): SajuResult {
  return {
    pillars: {
      year: { stem: sajuData.yearGan, branch: sajuData.yearJi },
      month: { stem: sajuData.monthGan, branch: sajuData.monthJi },
      day: { stem: sajuData.dayGan, branch: sajuData.dayJi },
      hour: { stem: sajuData.hourGan, branch: sajuData.hourJi },
    },
    dayMaster: {
      stem: sajuData.dayGan,
      element: determineElement(sajuData.dayGan),
    },
    elementCounts: {
      [Element.WOOD]: sajuData.woodCount,
      [Element.FIRE]: sajuData.fireCount,
      [Element.EARTH]: sajuData.earthCount,
      [Element.METAL]: sajuData.metalCount,
      [Element.WATER]: sajuData.waterCount,
    },
    lackingElements: determineLackingElements(sajuData),
    favorableElements: [sajuData.primaryYongsin as Element],
    yongsin: {
      primary: sajuData.primaryYongsin as Element,
      secondary: sajuData.secondaryYongsin as Element | undefined,
    },
  };
}

/**
 * 천간으로 오행 결정
 */
function determineElement(stem: string): Element {
  const map: Record<string, Element> = {
    갑: Element.WOOD,
    을: Element.WOOD,
    병: Element.FIRE,
    정: Element.FIRE,
    무: Element.EARTH,
    기: Element.EARTH,
    경: Element.METAL,
    신: Element.METAL,
    임: Element.WATER,
    계: Element.WATER,
  };
  return map[stem] || Element.WOOD;
}

/**
 * 부족한 오행 결정 (평균의 50% 미만)
 */
function determineLackingElements(sajuData: any): Element[] {
  const counts = {
    [Element.WOOD]: sajuData.woodCount,
    [Element.FIRE]: sajuData.fireCount,
    [Element.EARTH]: sajuData.earthCount,
    [Element.METAL]: sajuData.metalCount,
    [Element.WATER]: sajuData.waterCount,
  };

  const avg = Object.values(counts).reduce((a, b) => a + b, 0) / 5;
  return Object.entries(counts)
    .filter(([_, count]) => count < avg * 0.5)
    .map(([elem, _]) => elem as Element);
}
