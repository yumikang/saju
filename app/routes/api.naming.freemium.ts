/**
 * Naming Freemium API - 4-Stage Business Process
 *
 * POST /api/naming/freemium
 *
 * 4단계 비즈니스 프로세스:
 * - Stage 1: 정보입력 (무료) - 성씨, 성별, 생년월일시, 부모 가치관
 * - Stage 2: 사주분석 (무료) - 자동 계산 및 분석
 * - Stage 3: 이름추천 (무료 5개) - AI 분석 포함 top 5
 * - Stage 4: 결제/전문가 (선택) - 70,000원 OR 8-15만원
 *
 * Created: 2025-10-27
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { prisma } from '~/lib/db.server';
import { getRedisClient } from '~/lib/redis.server';
import {
  createNamingPipeline,
  DatabaseHanjaService,
  RedisCacheService,
  InMemoryCacheService,
  type BirthInfo,
} from '~/lib/naming/pipeline';
import { SajuCalculator } from '~/lib/saju/calculator';
import { Element } from '@prisma/client';
import { elementToKoreanWithHanja } from '~/lib/element-utils';
// YongsinAnalyzer disabled for performance - using simple algorithm instead
// import { YongsinAnalyzer } from '~/lib/saju/yongsin-analyzer';

// ============================================================
// Request Validation Schemas
// ============================================================

/**
 * Parent values that can be selected (max 3)
 */
const PARENT_VALUES = [
  'success',    // 성공과 출세
  'health',     // 건강과 장수
  'popularity', // 인덕과 인기
  'wealth',     // 재물과 풍요
  'peace',      // 평화와 안정
  'wisdom',     // 지혜와 학업
] as const;

/**
 * Stage 1: Input stage validation
 */
const Stage1Schema = z.object({
  stage: z.literal(1),
  data: z.object({
    lastName: z.string().min(1).max(2),
    lastNameStrokes: z.number().int().min(1).max(30),
    gender: z.enum(['M', 'F']),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    birthTime: z.string().regex(/^\d{2}:\d{2}$/),       // HH:MM
    isLunar: z.boolean(),
    selectedValues: z.array(z.enum(PARENT_VALUES)).min(1).max(3),
  }),
});

/**
 * Stage 2 & 3: Require sessionId
 */
const Stage2Schema = z.object({
  stage: z.literal(2),
  sessionId: z.string().uuid(),
});

const Stage3Schema = z.object({
  stage: z.literal(3),
  sessionId: z.string().uuid(),
});

/**
 * Union of all possible request types
 */
const FreemiumRequestSchema = z.discriminatedUnion('stage', [
  Stage1Schema,
  Stage2Schema,
  Stage3Schema,
]);

type FreemiumRequest = z.infer<typeof FreemiumRequestSchema>;

// ============================================================
// Response Types
// ============================================================

interface Stage1Response {
  success: true;
  sessionId: string;
  stage: 1;
  nextStage: 2;
}

interface Stage2Response {
  success: true;
  sessionId: string;
  stage: 2;
  saju: {
    pillars: {
      year: { gan: string; ji: string };
      month: { gan: string; ji: string };
      day: { gan: string; ji: string };
      hour: { gan: string; ji: string };
    };
    elementCounts: {
      WOOD: number;
      FIRE: number;
      EARTH: number;
      METAL: number;
      WATER: number;
    };
    lackingElements: string[];
    yongsin: {
      primary: string;
      secondary?: string;
    };
  };
  nextStage: 3;
}

interface NameRecommendation {
  rank: number;
  fullName: string;
  characters: Array<{
    character: string;
    meaning: string;
    strokes: number;
    element: string;
  }>;
  scores: {
    overall: number;
    element: number;
    yinyang: number;
    numerology: number;
    meaning: number;
    aiMeaning?: number;
  };
  aiExplanation: string;
}

interface Stage3Response {
  success: true;
  sessionId: string;
  stage: 3;
  recommendations: NameRecommendation[];
  hasMore: boolean;
  pricing: {
    auto: number;
    expertRange: [number, number];
  };
  nextStage: 4;
}

// ============================================================
// Stage Handlers
// ============================================================

/**
 * Stage 1: Create session and store input data
 */
async function handleStage1(data: z.infer<typeof Stage1Schema>['data']): Promise<Stage1Response> {
  console.log('[Stage 1] Creating session with input data');

  // Create session with input data
  const session = await prisma.namingSession.create({
    data: {
      lastName: data.lastName,
      lastNameStrokes: data.lastNameStrokes,
      gender: data.gender,
      birthDate: new Date(data.birthDate),
      birthTime: data.birthTime,
      isLunar: data.isLunar,
      selectedValues: data.selectedValues,
      // Placeholder data (will be filled in stage 2 & 3)
      saju: {},
      yongsin: {},
      top2: [],
      locked8: [],
      allCandidates: [],
    },
  });

  console.log(`[Stage 1] Session created: ${session.id}`);

  return {
    success: true,
    sessionId: session.id,
    stage: 1,
    nextStage: 2,
  };
}

/**
 * Stage 2: Calculate Saju and Yongsin
 */
async function handleStage2(sessionId: string): Promise<Stage2Response> {
  console.log(`[Stage 2] Calculating Saju for session: ${sessionId}`);

  // Load session
  const session = await prisma.namingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('세션을 찾을 수 없습니다');
  }

  // Check expiration
  if (session.expiresAt < new Date()) {
    throw new Error('세션이 만료되었습니다');
  }

  // Use SajuCalculator directly
  const sajuCalculator = new SajuCalculator(prisma);
  // YongsinAnalyzer disabled for performance

  // Ensure birthDate is a Date object
  const birthDate = new Date(session.birthDate);

  // Calculate Saju
  const sajuResult = await sajuCalculator.calculate(
    birthDate,
    session.birthTime,
    session.isLunar
  );

  // Parse birth info for Yongsin analysis
  const [hour, minute] = session.birthTime.split(':').map(Number);
  const birthInfo = {
    year: birthDate.getFullYear(),
    month: birthDate.getMonth() + 1,
    day: birthDate.getDate(),
    hour,
    minute,
    isLunar: session.isLunar,
    gender: session.gender as 'M' | 'F',
  };

  // PERFORMANCE: Use simple algorithm-based yongsin instead of AI (skip yongsinAnalyzer.analyze)
  console.log('[Stage 2] Using fast algorithm-based yongsin (AI disabled for performance)');
  const lackingElements = Object.entries(sajuResult.elementCounts)
    .filter(([, count]) => count < 1.5)
    .map(([element]) => element);

  // Convert lacking elements to Korean with Hanja
  const lackingElementsKorean = lackingElements
    .map(el => elementToKoreanWithHanja(el as Element))
    .filter(Boolean);

  const yongsinResult = {
    primary: lackingElements[0] || 'WOOD',
    secondary: lackingElements[1],
    avoid: [],
    methods: {} as any,
    dayMasterStrength: { score: 0, category: '중화', explanation: '알고리즘 기반 분석' },
    seasonalContext: { season: '봄', temperatureNeed: '중화', adjustment: '' },
    fullAnalysis: `부족한 오행(${lackingElementsKorean.join(', ')})을 보충하는 용신 분석 결과입니다.`,
    aiEnhanced: false,
  };

  // Update session with Saju data
  await prisma.namingSession.update({
    where: { id: sessionId },
    data: {
      saju: sajuResult as any,
      yongsin: yongsinResult as any,
    },
  });

  console.log(`[Stage 2] Saju calculated for session: ${sessionId}`);

  // Format response (use Korean with Hanja for lackingElements)
  return {
    success: true,
    sessionId,
    stage: 2,
    saju: {
      pillars: {
        year: sajuResult.pillars.year,
        month: sajuResult.pillars.month,
        day: sajuResult.pillars.day,
        hour: sajuResult.pillars.hour,
      },
      elementCounts: sajuResult.elementCounts,
      lackingElements: lackingElementsKorean,
      yongsin: {
        primary: yongsinResult.primary,
        secondary: yongsinResult.secondary,
      },
    },
    nextStage: 3,
  };
}

/**
 * Stage 3: Generate name recommendations (2 free + 8 paid)
 */
async function handleStage3(sessionId: string): Promise<Stage3Response> {
  console.log(`[Stage 3] Generating names for session: ${sessionId}`);

  // Load session
  const session = await prisma.namingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('세션을 찾을 수 없습니다');
  }

  // Check expiration
  if (session.expiresAt < new Date()) {
    throw new Error('세션이 만료되었습니다');
  }

  // Parse birth info
  const birthDate = new Date(session.birthDate);
  const [hour, minute] = session.birthTime.split(':').map(Number);
  const birthInfo: BirthInfo = {
    year: birthDate.getFullYear(),
    month: birthDate.getMonth() + 1,
    day: birthDate.getDate(),
    hour,
    minute,
    isLunar: session.isLunar,
    gender: session.gender as 'M' | 'F',
  };

  // Initialize services
  const hanjaService = new DatabaseHanjaService(prisma);
  const redisClient = await getRedisClient();
  const cacheService = redisClient
    ? new RedisCacheService(redisClient)
    : new InMemoryCacheService();

  const pipeline = createNamingPipeline(hanjaService, cacheService);

  // Execute full pipeline
  const startTime = Date.now();
  const result = await pipeline.execute(
    birthInfo,
    session.lastName,
    session.lastNameStrokes,
    {
      maxCandidates: 10,  // Generate exactly 10 candidates
      minScore: 50,       // Lower threshold for much faster generation
    }
  );
  const executionTime = Date.now() - startTime;

  console.log(`[Stage 3] Generated ${result.candidates.length} names in ${executionTime}ms`);

  // Freemium V2 structure: 상위 10개만 생성 (1-9위 잠금, 10위 무료)
  const allCandidates = result.candidates;
  const top10 = allCandidates.slice(0, 10); // 1-10위만 사용
  const locked9 = top10.slice(0, 9);        // 1-9위 프리미엄 (잠금)
  const free1 = top10.slice(9, 10);         // 10위 무료

  // Update session with candidates
  await prisma.namingSession.update({
    where: { id: sessionId },
    data: {
      top2: free1 as any,          // V2: 10위 무료 저장
      locked8: locked9 as any,     // V2: 1-9위 잠금 저장
      allCandidates: allCandidates as any,
    },
  });

  // Format ALL 10 names for response (Freemium V2)
  const recommendations: NameRecommendation[] = top10.map((candidate, index) => ({
    rank: index + 1,
    fullName: `${session.lastName}${candidate.firstName.join('')}`,
    characters: candidate.characters.map((char) => ({
      character: char.character,
      meaning: char.meaning,
      strokes: char.strokes,
      element: char.element,
    })),
    scores: {
      overall: Math.round(candidate.score),
      element: Math.round(candidate.breakdown.element),
      yinyang: Math.round(candidate.breakdown.yinyang),
      numerology: Math.round(candidate.breakdown.numerology),
      meaning: Math.round(candidate.breakdown.meaning),
    },
    aiExplanation: `이 이름은 ${session.selectedValues.join(', ')} 가치를 반영하여 선택되었습니다.`,
  }));

  console.log(`[Stage 3] Returning 10 names (1-9위 locked premium, 10위 free) for session: ${sessionId}`);

  return {
    success: true,
    sessionId,
    stage: 3,
    recommendations,
    hasMore: true,
    pricing: {
      auto: 70000,
      expertRange: [80000, 150000],
    },
    nextStage: 4,
  };
}

// ============================================================
// Main Action Handler
// ============================================================

/**
 * POST handler for Freemium API
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validatedData: FreemiumRequest = FreemiumRequestSchema.parse(body);

    // 2. Route to appropriate stage handler
    switch (validatedData.stage) {
      case 1:
        return json(await handleStage1(validatedData.data));

      case 2:
        return json(await handleStage2(validatedData.sessionId));

      case 3:
        return json(await handleStage3(validatedData.sessionId));

      default:
        // TypeScript should prevent this, but just in case
        throw new Error('Invalid stage');
    }
  } catch (error) {
    // 3. Handle errors
    console.error('[Freemium API] Error:', error);

    if (error instanceof z.ZodError) {
      return json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '요청 데이터 형식이 올바르지 않습니다',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return json(
        {
          success: false,
          error: 'GENERATION_ERROR',
          message: error.message || '처리 중 오류가 발생했습니다',
        },
        { status: 500 }
      );
    }

    return json(
      {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - API documentation
 */
export async function loader() {
  return json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'POST 요청만 허용됩니다',
      documentation: {
        endpoint: '/api/naming/freemium',
        method: 'POST',
        contentType: 'application/json',
        stages: {
          stage1: {
            description: '정보입력 (무료)',
            requiredFields: {
              stage: 1,
              data: {
                lastName: 'string (1-2 chars)',
                lastNameStrokes: 'number (1-30)',
                gender: '"M" | "F"',
                birthDate: 'string (YYYY-MM-DD)',
                birthTime: 'string (HH:MM)',
                isLunar: 'boolean',
                selectedValues: 'string[] (1-3 values from: success, health, popularity, wealth, peace, wisdom)',
              },
            },
            response: {
              sessionId: 'uuid',
              nextStage: 2,
            },
          },
          stage2: {
            description: '사주분석 (무료)',
            requiredFields: {
              stage: 2,
              sessionId: 'uuid from stage 1',
            },
            response: {
              saju: 'Saju analysis result',
              nextStage: 3,
            },
          },
          stage3: {
            description: '이름추천 (무료 5개)',
            requiredFields: {
              stage: 3,
              sessionId: 'uuid from stage 1',
            },
            response: {
              recommendations: 'Top 5 names',
              hasMore: true,
              pricing: { auto: 70000, expertRange: [80000, 150000] },
              nextStage: 4,
            },
          },
        },
      },
    },
    { status: 405 }
  );
}
