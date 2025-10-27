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
  AnalyzeCurrentRequest,
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
    // 0. Resolve user ID (optional for anonymous users)
    const resolvedUserId = userId || null; // Allow null for anonymous users

    // 1. Calculate Saju using Phase 1 SajuCalculator
    const calculator = new SajuCalculator();
    const birthDateTime = new Date(`${request.birthDate}T${request.birthTime}`);

    const sajuResult = await calculator.calculate(
      birthDateTime,
      request.birthTime,
      request.isLunar
    );

    // 2. Save to database for future reference
    const sajuData = await prisma.sajuData.create({
      data: {
        userId: resolvedUserId, // Can be null for anonymous users
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
  });

  if (!hanjaDict) {
    throw new NotFoundError('Character', '한자를 찾을 수 없습니다');
  }

  // Fetch readings separately if requested
  let alternativeReadings: Array<{
    reading: string;
    isPrimary: boolean;
    soundElement: Element | null;
  }> | undefined;

  if (include === 'readings' || include === 'all') {
    const readings = await prisma.hanjaReading.findMany({
      where: { character: hanjaDict.character },
      select: {
        reading: true,
        isPrimary: true,
        soundElem: true,
      },
    });

    alternativeReadings = readings.map((r) => ({
      reading: r.reading,
      isPrimary: r.isPrimary,
      soundElement: r.soundElem,
    }));
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
      ...(alternativeReadings ? { alternativeReadings } : {}),
    },
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * DB SajuData 타입 정의
 */
interface DBSajuData {
  yearGan: string;
  yearJi: string;
  monthGan: string;
  monthJi: string;
  dayGan: string;
  dayJi: string;
  hourGan: string;
  hourJi: string;
  woodCount: number;
  fireCount: number;
  earthCount: number;
  metalCount: number;
  waterCount: number;
  primaryYongsin: string;
  secondaryYongsin: string | null;
}

/**
 * DB에서 가져온 사주 데이터를 SajuResult로 재구성
 */
function reconstructSajuFromDB(sajuData: DBSajuData): SajuResult {
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
function determineLackingElements(sajuData: DBSajuData): Element[] {
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

// ============================================================
// Handler: Analyze Current Name for Renaming
// ============================================================

export interface AnalyzeCurrentResponse {
  success: true;
  data: {
    analysisId: string;
    currentScore: number;
    saju: {
      pillars: SajuResult['pillars'];
      elementCounts: SajuResult['elementCounts'];
      lackingElements: Element[];
      favorableElements: Element[];
    };
    currentName: {
      hanja: string;
      elements: { first: Element | null; second: Element | null };
      scores: {
        element: number;
        yinyang: number;
        numerology: number;
        meaning: number;
      };
    };
    problems: string[];
    recommendations: {
      neededElements: Element[];
      avoidElements: Element[];
      targetScore: number;
    };
    predictions: {
      career: number;
      health: number;
      relationships: number;
      wealth: number;
    };
  };
  metadata: {
    calculationTime: number;
    timestamp: string;
  };
}

/**
 * 현재 이름 분석 핸들러
 *
 * POST /api/renaming/analyze-current
 *
 * @param request - Validated current name analysis request
 * @param userId - Optional user ID for tracking
 */
export async function handleAnalyzeCurrent(
  request: AnalyzeCurrentRequest,
  userId?: string
): Promise<AnalyzeCurrentResponse> {
  const startTime = Date.now();

  try {
    // 1. Calculate Saju
    const calculator = new SajuCalculator();
    const birthDateTime = new Date(`${request.birthDate}T${request.birthTime}`);

    const sajuResult = calculator.calculate(
      birthDateTime,
      request.birthTime,
      request.isLunar
    );

    // 2. Construct full current name in Hanja
    const fullName = request.currentName.lastName + request.currentName.firstName.join('');

    // 3. Look up Hanja characters for current name
    const firstChar = request.currentName.firstName[0];
    const secondChar = request.currentName.firstName[1];

    const [firstHanja, secondHanja] = await Promise.all([
      prisma.hanjaDict.findFirst({
        where: { koreanReading: firstChar },
        orderBy: { nameFrequency: 'desc' }, // Most common reading first
      }),
      prisma.hanjaDict.findFirst({
        where: { koreanReading: secondChar },
        orderBy: { nameFrequency: 'desc' },
      }),
    ]);

    // 4. Score the current name
    const matcher = new HanjaMatcher();

    // Create a candidate from current name for scoring
    let currentScore = 0;
    let elementScore = 0;
    let yinyangScore = 0;
    let numerologyScore = 0;
    let meaningScore = 0;
    let firstElement: Element | null = null;
    let secondElement: Element | null = null;

    if (firstHanja && secondHanja) {
      // Calculate score using matcher's internal scoring
      // We find the candidate that matches the current name's hanja characters
      const scoredCandidates = await matcher.findOptimalNames(
        sajuResult,
        request.currentName.lastName,
        {
          minScore: 0, // Accept any score
          maxResults: 1000,
          gender: request.gender as 'male' | 'female' | undefined,
          enableEarlyTermination: false,
        }
      );

      // Find the exact match in scored candidates
      const matchedCandidate = scoredCandidates.find(
        (c) =>
          c.characters[0].id === firstHanja.id &&
          c.characters[1].id === secondHanja.id
      );

      if (matchedCandidate) {
        currentScore = matchedCandidate.scores.overall;
        elementScore = matchedCandidate.scores.elementHarmony.score;
        yinyangScore = matchedCandidate.scores.yinYangBalance.score;
        numerologyScore = matchedCandidate.scores.numerology.score;
        meaningScore = matchedCandidate.scores.meaningHarmony.score;
      }

      firstElement = firstHanja.element;
      secondElement = secondHanja.element;
    }

    // 5. Analyze problems based on scores
    const problems: string[] = [];
    if (elementScore < 60) {
      problems.push(`${sajuResult.lackingElements.join(', ')} 기운 부족`);
    }
    if (yinyangScore < 60) {
      problems.push('음양 불균형');
    }
    if (numerologyScore < 60) {
      problems.push('81수리 불길');
    }
    if (meaningScore < 60) {
      problems.push('의미 조화 부족');
    }
    if (problems.length === 0 && currentScore < 70) {
      problems.push('전반적인 조화 부족');
    }

    // 6. Generate recommendations
    const neededElements = sajuResult.lackingElements;
    const avoidElements = Object.entries(sajuResult.elementCounts)
      .filter(([_, count]) => count > 2)
      .map(([elem, _]) => elem as Element);
    const targetScore = Math.max(75, currentScore + 15);

    // 7. Calculate predictions based on current score
    const basePrediction = currentScore * 0.8; // Base off current score
    const predictions = {
      career: Math.round(basePrediction + (elementScore - 50) * 0.3),
      health: Math.round(basePrediction + (yinyangScore - 50) * 0.4),
      relationships: Math.round(basePrediction + (meaningScore - 50) * 0.4),
      wealth: Math.round(basePrediction + (numerologyScore - 50) * 0.3),
    };

    // 8. Save analysis to database
    const analysis = await prisma.renamingAnalysis.create({
      data: {
        birthDate: request.birthDate,
        birthTime: request.birthTime,
        isLunar: request.isLunar,
        currentNameHanja: fullName,
        currentScore,
        sajuData: {
          pillars: sajuResult.pillars,
          elementCounts: sajuResult.elementCounts,
          lackingElements: sajuResult.lackingElements,
          favorableElements: sajuResult.favorableElements,
        },
        analysisData: {
          currentName: {
            hanja: fullName,
            elements: { first: firstElement, second: secondElement },
            scores: {
              element: elementScore,
              yinyang: yinyangScore,
              numerology: numerologyScore,
              meaning: meaningScore,
            },
          },
          problems,
          recommendations: {
            neededElements,
            avoidElements,
            targetScore,
          },
          predictions,
        },
      },
    });

    const calculationTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        analysisId: analysis.id,
        currentScore,
        saju: {
          pillars: sajuResult.pillars,
          elementCounts: sajuResult.elementCounts,
          lackingElements: sajuResult.lackingElements,
          favorableElements: sajuResult.favorableElements,
        },
        currentName: {
          hanja: fullName,
          elements: { first: firstElement, second: secondElement },
          scores: {
            element: elementScore,
            yinyang: yinyangScore,
            numerology: numerologyScore,
            meaning: meaningScore,
          },
        },
        problems,
        recommendations: {
          neededElements,
          avoidElements,
          targetScore,
        },
        predictions,
      },
      metadata: {
        calculationTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[handleAnalyzeCurrent] Error:', error);
    throw new SajuCalculationError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
