# Phase 2: API Design Analysis for Korean Naming Service

**Date**: 2025-10-15
**System**: 사주 기반 작명 서비스 (Saju-based Name Recommendation System)
**Technology Stack**: Next.js 15, Prisma, PostgreSQL, TypeScript

---

## Executive Summary

This document provides a comprehensive architectural analysis for Phase 2 REST API endpoints, building on the completed Phase 1 core naming algorithm (HanjaMatcher + ScoringPipeline). The design emphasizes performance (sub-5s response), type safety, and seamless integration with existing Phase 1 components.

### Key Design Principles
1. **Next.js 15 App Router** pattern with Route Handlers
2. **Type-safe** request/response with Zod validation
3. **Performance-first** with intelligent caching and database optimization
4. **Korean-first UX** with user-friendly error messages
5. **Production-ready** error handling and monitoring

---

## 1. API Architecture Analysis

### 1.1 Next.js 15 App Router Patterns

**File Structure** (Recommended):
```
app/
├── api/
│   └── naming/
│       ├── analyze/
│       │   └── route.ts          # POST /api/naming/analyze
│       ├── recommend/
│       │   └── route.ts          # POST /api/naming/recommend
│       └── character/
│           └── [id]/
│               └── route.ts      # GET /api/naming/character/:id
└── lib/
    ├── naming/
    │   ├── matcher.ts            # ✅ Phase 1: HanjaMatcher
    │   ├── scorers/              # ✅ Phase 1: Scoring system
    │   ├── types.ts              # ✅ Phase 1: Type definitions
    │   └── api-handlers.ts       # 🆕 Phase 2: Business logic handlers
    ├── saju/
    │   └── calculator.ts         # ✅ Phase 1: SajuCalculator
    └── validators/
        └── naming-validators.ts  # 🆕 Phase 2: Request validators
```

**Next.js 15 Route Handler Pattern**:
```typescript
// app/api/naming/recommend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleRecommendation } from '@/lib/naming/api-handlers';
import { validateRecommendRequest } from '@/lib/validators/naming-validators';

export const runtime = 'nodejs'; // Edge runtime not needed for DB queries
export const dynamic = 'force-dynamic'; // Disable static optimization

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validatedData = validateRecommendRequest(body);

    // 2. Execute business logic
    const result = await handleRecommendation(validatedData);

    // 3. Return response
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}
```

### 1.2 Validation Strategy

**Zod Schema-Based Validation**:
```typescript
// lib/validators/naming-validators.ts
import { z } from 'zod';
import { Element } from '@prisma/client';

// Birth data schema
const BirthDataSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM 형식이어야 합니다'),
  isLunar: z.boolean().default(false),
  gender: z.enum(['male', 'female']),
  timezone: z.string().default('Asia/Seoul'),
});

// Recommendation request schema
const RecommendRequestSchema = z.object({
  sajuDataId: z.string().uuid().optional(),
  birthData: BirthDataSchema.optional(),
  lastName: z.string().min(1).max(2, '성은 1-2자여야 합니다'),
  preferences: z.object({
    minScore: z.number().min(0).max(100).default(60),
    maxResults: z.number().min(1).max(1000).default(100),
    avoidCharacters: z.array(z.string().length(1)).optional(),
    preferredElements: z.array(z.nativeEnum(Element)).optional(),
    gender: z.enum(['male', 'female', 'neutral']).optional(),
  }).optional(),
}).refine(
  (data) => data.sajuDataId || data.birthData,
  { message: 'sajuDataId 또는 birthData 중 하나는 필수입니다' }
);

export function validateRecommendRequest(body: unknown) {
  return RecommendRequestSchema.parse(body);
}
```

**Validation Flow**:
```
Request Body
  → Zod Parse
    → Type-safe validated data
      → Business logic
        → Response
```

### 1.3 Error Handling Strategy

**Error Hierarchy**:
```typescript
// lib/errors/naming-errors.ts
export class NamingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public userMessage: string // Korean user-friendly message
  ) {
    super(message);
    this.name = 'NamingError';
  }
}

export class ValidationError extends NamingError {
  constructor(message: string, userMessage: string) {
    super(message, 'VALIDATION_ERROR', 400, userMessage);
  }
}

export class SajuCalculationError extends NamingError {
  constructor(message: string) {
    super(
      message,
      'SAJU_CALCULATION_ERROR',
      500,
      '사주 계산 중 오류가 발생했습니다. 입력 정보를 확인해주세요.'
    );
  }
}

export class InsufficientCharactersError extends NamingError {
  constructor(availableCount: number) {
    super(
      `Only ${availableCount} characters available`,
      'INSUFFICIENT_CHARACTERS',
      400,
      `조건에 맞는 한자가 부족합니다 (${availableCount}개). 조건을 완화해주세요.`
    );
  }
}
```

**Error Handler**:
```typescript
// lib/errors/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { NamingError } from './naming-errors';

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return NextResponse.json(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다',
        details: firstError.message,
        field: firstError.path.join('.'),
      },
      { status: 400 }
    );
  }

  // Custom naming errors
  if (error instanceof NamingError) {
    return NextResponse.json(
      {
        success: false,
        error: error.code,
        message: error.userMessage,
        details: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: '요청한 데이터를 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }
  }

  // Unknown errors
  return NextResponse.json(
    {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    },
    { status: 500 }
  );
}
```

---

## 2. API Endpoint Specifications

### 2.1 POST /api/naming/analyze

**Purpose**: Analyze birth data to calculate 사주 (Four Pillars)

**Request Schema**:
```typescript
{
  birthDate: string;      // "YYYY-MM-DD"
  birthTime: string;      // "HH:MM"
  isLunar: boolean;       // 음력 여부
  gender: 'male' | 'female';
  timezone?: string;      // default: "Asia/Seoul"
}
```

**Response Schema**:
```typescript
{
  success: true;
  data: {
    sajuDataId: string;   // UUID for reuse
    pillars: {
      year: { stem: string; branch: string };
      month: { stem: string; branch: string };
      day: { stem: string; branch: string };
      hour: { stem: string; branch: string };
    };
    dayMaster: {
      stem: string;
      element: Element;     // WOOD | FIRE | EARTH | METAL | WATER
    };
    elementCounts: {
      WOOD: number;
      FIRE: number;
      EARTH: number;
      METAL: number;
      WATER: number;
    };
    lackingElements: Element[];
    favorableElements: Element[];
    yongsin: {
      primary: Element;
      secondary?: Element;
    };
  };
  metadata: {
    calculationTime: number; // ms
    timestamp: string;
  };
}
```

**Business Logic Flow**:
```
1. Validate birth data (Zod)
2. SajuCalculator.calculate()
3. Save to SajuData table (Prisma)
4. Return analysis + sajuDataId
```

**Implementation**:
```typescript
// lib/naming/api-handlers.ts
import { SajuCalculator, type SajuResult } from '../saju/calculator';
import { PrismaClient, Element } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyzeRequest {
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: 'male' | 'female';
  timezone?: string;
}

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

export async function handleAnalyze(
  request: AnalyzeRequest,
  userId?: string
): Promise<AnalyzeResponse> {
  const startTime = Date.now();

  // 1. Calculate Saju
  const calculator = new SajuCalculator();
  const birthDate = new Date(request.birthDate + 'T' + request.birthTime);

  const sajuResult = calculator.calculate(
    birthDate,
    request.birthTime,
    request.isLunar
  );

  // 2. Save to database
  const sajuData = await prisma.sajuData.create({
    data: {
      userId: userId || 'anonymous',
      name: '', // To be filled later
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
      secondaryYongsin: sajuResult.yongsin.secondary,
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
}
```

**Error Scenarios**:
- Invalid date format → `400 VALIDATION_ERROR`
- Invalid time format → `400 VALIDATION_ERROR`
- Calculation failure → `500 SAJU_CALCULATION_ERROR`
- Database error → `500 INTERNAL_ERROR`

---

### 2.2 POST /api/naming/recommend

**Purpose**: Generate name recommendations based on 사주 analysis

**Request Schema**:
```typescript
{
  // Option 1: Use existing saju analysis
  sajuDataId?: string;      // UUID from /analyze

  // Option 2: Calculate on-the-fly
  birthData?: {
    birthDate: string;
    birthTime: string;
    isLunar: boolean;
    gender: 'male' | 'female';
  };

  // Required
  lastName: string;         // 성 (1-2 characters)

  // Optional preferences
  preferences?: {
    minScore?: number;      // default: 60
    maxResults?: number;    // default: 100, max: 1000
    avoidCharacters?: string[];
    preferredElements?: Element[];
    gender?: 'male' | 'female' | 'neutral';
  };
}
```

**Response Schema**:
```typescript
{
  success: true;
  data: {
    candidates: Array<{
      firstName: [string, string];    // 한글 읽기
      firstNameHanja: [string, string]; // 한자
      scores: {
        overall: number;              // 0-100
        elementHarmony: {
          score: number;
          weight: number;
          weightedScore: number;
          explanation: string;
        };
        yinYangBalance: { /* same structure */ };
        numerology: { /* same structure */ };
        meaningHarmony: { /* same structure */ };
      };
      confidenceScore: number;        // 0.0-1.0
      analysis: {
        elementHarmony: {
          lacksComplement: boolean;
          hasProducingCycle: boolean;
          hasConflictingCycle: boolean;
          strengthensFavorable: boolean;
          details: string[];
        };
        yinyangBalance: {
          pattern: string;
          isBalanced: boolean;
          distribution: { yang: number; yin: number };
          details: string[];
        };
        numerologyGrids: {
          원격: { strokes: number; fortune: string; meaning: string; score: number };
          형격: { /* same */ };
          이격: { /* same */ };
          정격: { /* same */ };
          overallFortune: string;
        };
        meaningCompatibility: {
          theme: string;
          isHarmonious: boolean;
          quality: 'excellent' | 'good' | 'fair' | 'poor';
          details: string[];
        };
        reasoning: string[];
      };
    }>;
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
```

**Business Logic Flow**:
```
1. Validate request (sajuDataId XOR birthData)
2. Get/Calculate SajuResult
3. HanjaMatcher.findOptimalNames()
4. Return top candidates with detailed scoring
```

**Implementation**:
```typescript
// lib/naming/api-handlers.ts (continued)
import { HanjaMatcher, type MatchingOptions } from './matcher';
import type { ScoredCandidate } from './types';

export interface RecommendRequest {
  sajuDataId?: string;
  birthData?: {
    birthDate: string;
    birthTime: string;
    isLunar: boolean;
    gender: 'male' | 'female';
  };
  lastName: string;
  preferences?: {
    minScore?: number;
    maxResults?: number;
    avoidCharacters?: string[];
    preferredElements?: Element[];
    gender?: 'male' | 'female' | 'neutral';
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
      throw new NamingError(
        'Saju data not found',
        'NOT_FOUND',
        404,
        '사주 데이터를 찾을 수 없습니다'
      );
    }

    // Reconstruct SajuResult from database
    sajuResult = {
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
  } else if (request.birthData) {
    // Option 2: Calculate on-the-fly
    const calculator = new SajuCalculator();
    const birthDate = new Date(
      request.birthData.birthDate + 'T' + request.birthData.birthTime
    );
    sajuResult = calculator.calculate(
      birthDate,
      request.birthData.birthTime,
      request.birthData.isLunar
    );
  } else {
    throw new ValidationError(
      'Either sajuDataId or birthData required',
      'sajuDataId 또는 birthData 중 하나는 필수입니다'
    );
  }

  // 2. Generate name candidates using HanjaMatcher
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

  const executionTime = Date.now() - startTime;

  // 3. Performance validation
  if (executionTime > 5000) {
    console.warn(
      `[Performance Warning] Recommendation took ${executionTime}ms (target: <5s)`
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

function determineElement(stem: string): Element {
  const map: Record<string, Element> = {
    갑: Element.WOOD, 을: Element.WOOD,
    병: Element.FIRE, 정: Element.FIRE,
    무: Element.EARTH, 기: Element.EARTH,
    경: Element.METAL, 신: Element.METAL,
    임: Element.WATER, 계: Element.WATER,
  };
  return map[stem] || Element.WOOD;
}

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
```

**Error Scenarios**:
- Missing sajuDataId and birthData → `400 VALIDATION_ERROR`
- Invalid sajuDataId → `404 NOT_FOUND`
- Insufficient characters (< 10) → `400 INSUFFICIENT_CHARACTERS`
- Timeout (> 10s) → `504 GATEWAY_TIMEOUT`

---

### 2.3 GET /api/naming/character/:id

**Purpose**: Get detailed information about a specific 한자 character

**URL Parameters**:
```typescript
{
  id: string;  // UUID or character itself
}
```

**Query Parameters** (optional):
```typescript
{
  include?: 'readings' | 'usage' | 'all';  // default: basic info
}
```

**Response Schema**:
```typescript
{
  success: true;
  data: {
    id: string;
    character: string;
    meaning: string;
    strokes: number;
    element: Element;
    yinYang: YinYang;
    koreanReading: string;
    chineseReading?: string;
    radical?: string;

    // Optional expanded data
    usageFrequency?: number;
    nameFrequency?: number;
    category?: string;
    gender?: 'male' | 'female' | 'neutral';
    isGoodForNaming: boolean;

    // If include=readings
    alternativeReadings?: Array<{
      reading: string;
      isPrimary: boolean;
      soundElement: Element;
    }>;

    // If include=usage
    usageExamples?: Array<{
      word: string;
      meaning: string;
    }>;
  };
}
```

**Business Logic Flow**:
```
1. Parse character ID (UUID or character)
2. Query HanjaDict table
3. Optionally join HanjaReading table
4. Return character details
```

**Implementation**:
```typescript
// lib/naming/api-handlers.ts (continued)
export interface CharacterRequest {
  id: string;
  include?: 'readings' | 'usage' | 'all';
}

export interface CharacterResponse {
  success: true;
  data: {
    id: string;
    character: string;
    meaning: string | null;
    strokes: number | null;
    element: Element | null;
    yinYang: YinYang | null;
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

export async function handleCharacterLookup(
  request: CharacterRequest
): Promise<CharacterResponse> {
  const { id, include } = request;

  // Try to find by UUID first, then by character
  const whereClause = id.length === 1
    ? { character: id }
    : { id };

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
    throw new NamingError(
      'Character not found',
      'NOT_FOUND',
      404,
      '한자를 찾을 수 없습니다'
    );
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
```

**Error Scenarios**:
- Character not found → `404 NOT_FOUND`
- Invalid UUID format → `400 VALIDATION_ERROR`

---

## 3. Data Flow Design

### 3.1 Input Validation Flow

```
HTTP Request
  ↓
[Next.js Route Handler]
  ↓
JSON Parse → request.json()
  ↓
[Zod Validator]
  ↓ (success)
Type-safe validated data
  ↓
[Business Logic Handler]
  ↓
Database Queries
  ↓
Response Formatting
  ↓
NextResponse.json()
  ↓
HTTP Response

(failure) ↓
[Error Handler]
  ↓
User-friendly Korean error message
  ↓
HTTP Error Response (4xx/5xx)
```

### 3.2 Business Logic Integration

**Complete Flow for /api/naming/recommend**:
```
1. Request Validation (Zod)
   ├─ sajuDataId? → Load from DB
   └─ birthData? → SajuCalculator

2. Saju Analysis
   SajuCalculator.calculate()
   ├─ 년주, 월주, 일주, 시주
   ├─ 오행 카운트 (木火土金水)
   ├─ 용신 결정
   └─ 부족/유리 오행

3. Name Generation
   HanjaMatcher.findOptimalNames()
   ├─ Stage 1: Element Filter (DB) → 600-800 chars
   ├─ Stage 2: Stroke Filter (CPU) → 300-500 chars
   └─ Stage 3-4: Combination + Scoring → 1,000 candidates

4. Scoring Pipeline (Parallel)
   ├─ ElementScorer (40%)
   ├─ YinYangScorer (20%)
   ├─ NumerologyScorer (20%)
   └─ MeaningScorer (20%)

5. Sort and Filter
   ├─ Sort by overall score (desc)
   ├─ Take top N (maxResults)
   └─ Format response

6. Response
   Return JSON with candidates + metadata
```

### 3.3 Database Query Optimization

**Phase 1 Query** (Element-based filtering):
```sql
-- Uses composite index [element, isGoodForNaming]
SELECT id, character, koreanReading, meaning, strokes, element, yinYang,
       gender, nameFrequency, usageFrequency, category
FROM hanja_dict
WHERE element IN ('WOOD', 'FIRE')          -- Uses index
  AND isGoodForNaming = true               -- Uses index
  AND character NOT IN (?, ?)              -- Avoid chars
  AND (gender = 'male' OR gender = 'neutral' OR gender IS NULL)
ORDER BY nameFrequency DESC, usageFrequency DESC
LIMIT 1000;
```

**Performance**:
- Index hit: `[element, isGoodForNaming]`
- Expected rows: 600-800
- Query time: 50-100ms

**Phase 2 Query** (Character lookup):
```sql
-- Uses unique index on character
SELECT * FROM hanja_dict
WHERE character = '智';  -- O(1) lookup
```

**Caching Strategy**:
```typescript
// lib/cache/naming-cache.ts
import { LRUCache } from 'lru-cache';

// Cache frequently accessed characters
const characterCache = new LRUCache<string, HanjaDict>({
  max: 500,  // Top 500 most common characters
  ttl: 1000 * 60 * 60 * 24,  // 24 hours
});

export async function getCachedCharacter(id: string): Promise<HanjaDict | null> {
  const cached = characterCache.get(id);
  if (cached) return cached;

  const fromDb = await prisma.hanjaDict.findUnique({ where: { id } });
  if (fromDb) characterCache.set(id, fromDb);

  return fromDb;
}
```

---

## 4. Implementation Strategy

### 4.1 File Structure

```
app/
├── api/
│   └── naming/
│       ├── analyze/
│       │   └── route.ts              # 100 lines
│       ├── recommend/
│       │   └── route.ts              # 150 lines
│       └── character/
│           └── [id]/
│               └── route.ts          # 80 lines
│
├── lib/
│   ├── naming/
│   │   ├── matcher.ts                # ✅ Phase 1 (485 lines)
│   │   ├── api-handlers.ts           # 🆕 300 lines - Business logic
│   │   ├── types.ts                  # ✅ Phase 1 (222 lines)
│   │   └── scorers/
│   │       ├── scoring-pipeline.ts   # ✅ Phase 1 (159 lines)
│   │       ├── element-scorer.ts     # ✅ Phase 1
│   │       ├── yinyang-scorer.ts     # ✅ Phase 1
│   │       ├── numerology-scorer.ts  # ✅ Phase 1
│   │       └── meaning-scorer.ts     # ✅ Phase 1
│   │
│   ├── saju/
│   │   └── calculator.ts             # ✅ Phase 1 (354 lines)
│   │
│   ├── validators/
│   │   └── naming-validators.ts      # 🆕 150 lines - Zod schemas
│   │
│   ├── errors/
│   │   ├── naming-errors.ts          # 🆕 100 lines - Error classes
│   │   └── error-handler.ts          # 🆕 80 lines - Error handling
│   │
│   └── cache/
│       └── naming-cache.ts           # 🆕 60 lines - LRU cache
│
└── __tests__/
    └── api/
        ├── analyze.test.ts           # 🆕 200 lines
        ├── recommend.test.ts         # 🆕 300 lines
        └── character.test.ts         # 🆕 150 lines
```

**Total New Code**: ~1,570 lines
**Total Project**: ~3,500 lines

### 4.2 Code Patterns and Best Practices

**1. Separation of Concerns**:
```typescript
// ❌ BAD: Business logic in route handler
export async function POST(request: NextRequest) {
  const body = await request.json();
  const calculator = new SajuCalculator();
  const result = calculator.calculate(/* ... */);
  await prisma.sajuData.create(/* ... */);
  return NextResponse.json(/* ... */);
}

// ✅ GOOD: Thin route handler, logic in separate module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateAnalyzeRequest(body);
    const result = await handleAnalyze(validatedData);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**2. Type Safety**:
```typescript
// ✅ Use Zod for runtime validation + TypeScript inference
const RequestSchema = z.object({ /* ... */ });
type RequestType = z.infer<typeof RequestSchema>;

function handleRequest(data: RequestType) {
  // data is fully typed and validated
}
```

**3. Error Handling**:
```typescript
// ✅ Custom error classes with user-friendly messages
throw new InsufficientCharactersError(poolSize);

// Caught by error handler:
{
  "success": false,
  "error": "INSUFFICIENT_CHARACTERS",
  "message": "조건에 맞는 한자가 부족합니다 (15개). 조건을 완화해주세요."
}
```

**4. Performance Monitoring**:
```typescript
// ✅ Always measure execution time
const startTime = Date.now();
const result = await expensiveOperation();
const executionTime = Date.now() - startTime;

if (executionTime > TARGET_TIME) {
  console.warn(`[Performance] Operation took ${executionTime}ms (target: ${TARGET_TIME}ms)`);
}

return { ...result, metadata: { executionTime } };
```

### 4.3 Integration Points with Phase 1

**Existing Phase 1 Components**:
- ✅ `SajuCalculator` - Used in `/api/naming/analyze`
- ✅ `HanjaMatcher` - Used in `/api/naming/recommend`
- ✅ `ScoringPipeline` - Automatically used by HanjaMatcher
- ✅ Type definitions in `types.ts` - Reused in API responses

**Integration Pattern**:
```typescript
// app/api/naming/recommend/route.ts
import { HanjaMatcher } from '@/lib/naming/matcher';
import { handleRecommendation } from '@/lib/naming/api-handlers';

// Phase 1 code is directly called from Phase 2 handlers
export async function POST(request: NextRequest) {
  const result = await handleRecommendation(validatedData);
  // handleRecommendation internally uses HanjaMatcher
  return NextResponse.json(result);
}
```

### 4.4 Testing Strategy

**Unit Tests**:
```typescript
// __tests__/api/analyze.test.ts
describe('POST /api/naming/analyze', () => {
  it('should calculate saju from birth data', async () => {
    const response = await POST(createMockRequest({
      birthDate: '1990-05-15',
      birthTime: '14:30',
      isLunar: false,
      gender: 'male',
    }));

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.sajuDataId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.data.pillars).toHaveProperty('year');
    expect(body.metadata.calculationTime).toBeLessThan(1000);
  });

  it('should return 400 for invalid date format', async () => {
    const response = await POST(createMockRequest({
      birthDate: 'invalid',
      birthTime: '14:30',
      isLunar: false,
      gender: 'male',
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});
```

**Integration Tests**:
```typescript
// __tests__/integration/naming-flow.test.ts
describe('End-to-end naming flow', () => {
  it('should analyze → recommend → lookup character', async () => {
    // 1. Analyze birth data
    const analyzeRes = await fetch('/api/naming/analyze', {
      method: 'POST',
      body: JSON.stringify({ /* birth data */ }),
    });
    const { data: { sajuDataId } } = await analyzeRes.json();

    // 2. Get recommendations
    const recommendRes = await fetch('/api/naming/recommend', {
      method: 'POST',
      body: JSON.stringify({ sajuDataId, lastName: '김' }),
    });
    const { data: { candidates } } = await recommendRes.json();

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].scores.overall).toBeGreaterThanOrEqual(60);

    // 3. Lookup character details
    const firstChar = candidates[0].characters[0].character;
    const charRes = await fetch(`/api/naming/character/${firstChar}`);
    const charData = await charRes.json();

    expect(charData.data.character).toBe(firstChar);
  });
});
```

**Performance Tests**:
```typescript
// __tests__/performance/recommend.perf.ts
describe('Performance benchmarks', () => {
  it('should generate 1000 candidates in <5 seconds', async () => {
    const startTime = Date.now();

    const response = await fetch('/api/naming/recommend', {
      method: 'POST',
      body: JSON.stringify({
        sajuDataId: 'valid-uuid',
        lastName: '김',
        preferences: { maxResults: 1000 },
      }),
    });

    const executionTime = Date.now() - startTime;
    const body = await response.json();

    expect(executionTime).toBeLessThan(5000);
    expect(body.data.candidates.length).toBeLessThanOrEqual(1000);
  });
});
```

---

## 5. Security & Performance

### 5.1 Rate Limiting

**Strategy**: Implement per-IP rate limiting to prevent abuse

```typescript
// lib/middleware/rate-limiter.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number[]>({
  max: 1000,  // Track 1000 IPs
  ttl: 1000 * 60,  // 1 minute window
});

export function checkRateLimit(
  ip: string,
  maxRequests: number = 10
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - 60000;  // 1 minute ago

  const requests = rateLimitCache.get(ip) || [];
  const recentRequests = requests.filter(time => time > windowStart);

  if (recentRequests.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  recentRequests.push(now);
  rateLimitCache.set(ip, recentRequests);

  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length,
  };
}

// Usage in route handler
export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const { allowed, remaining } = checkRateLimit(ip, 10);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        },
      }
    );
  }

  // Process request
  const response = await handleRequest(/* ... */);

  return NextResponse.json(response, {
    headers: {
      'X-RateLimit-Remaining': remaining.toString(),
    },
  });
}
```

**Rate Limits**:
- `/api/naming/analyze`: 10 requests/minute/IP
- `/api/naming/recommend`: 5 requests/minute/IP (more expensive)
- `/api/naming/character/:id`: 30 requests/minute/IP

### 5.2 Input Sanitization

**SQL Injection Prevention**:
- ✅ Use Prisma ORM (parameterized queries by default)
- ✅ Never concatenate user input into SQL

**XSS Prevention**:
```typescript
// ✅ Sanitize user input before storing
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

// Apply to text fields
const sanitizedLastName = sanitizeInput(request.lastName);
```

**Character Validation**:
```typescript
// Only allow valid Korean/Hanja characters
const KoreanHanjaRegex = /^[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF]+$/;

if (!KoreanHanjaRegex.test(lastName)) {
  throw new ValidationError(
    'Invalid characters in lastName',
    '성은 한글 또는 한자만 입력 가능합니다'
  );
}
```

### 5.3 Caching Strategy

**Multi-Level Caching**:

```typescript
// 1. In-memory cache for hot data (LRU)
const characterCache = new LRUCache<string, HanjaDict>({ max: 500, ttl: 86400000 });

// 2. Redis cache for distributed systems (optional)
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getCachedRecommendation(cacheKey: string) {
  // Check memory cache first
  const memCached = recommendationCache.get(cacheKey);
  if (memCached) return memCached;

  // Check Redis cache
  const redisCached = await redis.get(cacheKey);
  if (redisCached) {
    const parsed = JSON.parse(redisCached);
    recommendationCache.set(cacheKey, parsed);
    return parsed;
  }

  return null;
}

async function setCachedRecommendation(cacheKey: string, data: any, ttl: number) {
  recommendationCache.set(cacheKey, data);
  await redis.setex(cacheKey, ttl, JSON.stringify(data));
}
```

**Cache Keys**:
```typescript
// Recommendation cache key (deterministic)
function getRecommendationCacheKey(
  sajuDataId: string,
  lastName: string,
  preferences: any
): string {
  return `rec:${sajuDataId}:${lastName}:${JSON.stringify(preferences)}`;
}

// Character cache key
function getCharacterCacheKey(id: string): string {
  return `char:${id}`;
}
```

**Cache Invalidation**:
- Character data: 24 hour TTL (rarely changes)
- Recommendations: 1 hour TTL (or no cache for personalized results)
- Saju analysis: No cache (unique per user)

### 5.4 Error Messages (Korean UX)

**User-Friendly Error Messages**:
```typescript
const ERROR_MESSAGES = {
  VALIDATION_ERROR: '입력 데이터가 올바르지 않습니다',
  SAJU_CALCULATION_ERROR: '사주 계산 중 오류가 발생했습니다. 입력 정보를 확인해주세요.',
  INSUFFICIENT_CHARACTERS: (count: number) =>
    `조건에 맞는 한자가 부족합니다 (${count}개). 조건을 완화해주세요.`,
  NOT_FOUND: '요청한 데이터를 찾을 수 없습니다',
  RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  TIMEOUT: '요청 처리 시간이 초과되었습니다. 조건을 단순화해주세요.',
};
```

**Error Response Format**:
```json
{
  "success": false,
  "error": "INSUFFICIENT_CHARACTERS",
  "message": "조건에 맞는 한자가 부족합니다 (15개). 조건을 완화해주세요.",
  "details": "Only 15 characters found matching criteria",
  "timestamp": "2025-10-15T12:34:56.789Z"
}
```

---

## 6. Performance Predictions

### 6.1 Expected Performance

**POST /api/naming/analyze**:
```
Saju Calculation:     10-20ms
Database Insert:      20-30ms
Response Formatting:  <5ms
──────────────────────────
Total:                30-55ms  ✅ Target: <100ms
```

**POST /api/naming/recommend**:
```
Input Validation:     <5ms
Saju Retrieval:       10-20ms (or calculation: +20ms)
HanjaMatcher:
  - Stage 1 (DB):     50-100ms
  - Stage 2 (CPU):    10-20ms
  - Stage 3-4 (CPU):  1,500-2,500ms
Response Formatting:  <10ms
──────────────────────────────
Total:                1,600-2,700ms  ✅ Target: <5,000ms
```

**GET /api/naming/character/:id**:
```
Database Query:       5-10ms (with index)
Cache Lookup:         <1ms (if cached)
Response Formatting:  <5ms
──────────────────────────
Total:                5-15ms  ✅ Target: <50ms
```

### 6.2 Bottleneck Analysis

**Primary Bottleneck**: Combination generation + scoring (Stage 3-4)
- Current: 1.5-2.5s for 1,000 candidates
- Optimization: Early termination + quick-score heuristic
- Future: Worker thread parallelization

**Secondary Bottleneck**: Database element filtering (Stage 1)
- Current: 50-100ms for 600-800 characters
- Mitigation: Composite index `[element, isGoodForNaming]`
- Future: Read replica for heavy read traffic

**Tertiary Bottleneck**: Scoring pipeline
- Current: Parallel execution with Promise.all()
- Already optimized: Independent scorers run concurrently
- No further optimization needed

### 6.3 Scalability Considerations

**Horizontal Scaling**:
- Stateless API design (no session state)
- Database connection pooling (Prisma default: 10 connections)
- Redis caching for distributed systems

**Database Scaling**:
- Current: 8,787 characters (HanjaDict)
- Projected growth: +1,000 characters/year
- Index maintenance: Automatic (PostgreSQL)

**Load Testing Results** (Expected):
```
Concurrent Users:     100
Requests/second:      50 (mixed endpoints)
Avg Response Time:    500ms
P95 Response Time:    2,000ms
P99 Response Time:    4,500ms
Error Rate:           <0.1%
```

---

## 7. Implementation Roadmap

### Phase 2.1: Core API Setup (Day 1-2)

**Tasks**:
1. ✅ Create directory structure (`app/api/naming/`)
2. ✅ Set up validators (`lib/validators/naming-validators.ts`)
3. ✅ Implement error handling (`lib/errors/`)
4. ✅ Create business logic handlers (`lib/naming/api-handlers.ts`)

**Deliverables**:
- File structure
- Zod validation schemas
- Error classes
- Handler skeleton functions

### Phase 2.2: Implement /analyze Endpoint (Day 3)

**Tasks**:
1. ✅ Implement `app/api/naming/analyze/route.ts`
2. ✅ Implement `handleAnalyze()` in api-handlers
3. ✅ Write unit tests
4. ✅ Test with Postman/curl

**Deliverables**:
- Working /analyze endpoint
- 100% test coverage
- API documentation

### Phase 2.3: Implement /recommend Endpoint (Day 4-5)

**Tasks**:
1. ✅ Implement `app/api/naming/recommend/route.ts`
2. ✅ Implement `handleRecommendation()` in api-handlers
3. ✅ Integrate HanjaMatcher
4. ✅ Write unit + integration tests
5. ✅ Performance testing

**Deliverables**:
- Working /recommend endpoint
- <5s response time validation
- Integration tests with Phase 1

### Phase 2.4: Implement /character/:id Endpoint (Day 6)

**Tasks**:
1. ✅ Implement `app/api/naming/character/[id]/route.ts`
2. ✅ Implement `handleCharacterLookup()` in api-handlers
3. ✅ Add LRU caching
4. ✅ Write unit tests

**Deliverables**:
- Working /character/:id endpoint
- Cache implementation
- 100% test coverage

### Phase 2.5: Security & Polish (Day 7)

**Tasks**:
1. ✅ Implement rate limiting
2. ✅ Add input sanitization
3. ✅ Implement caching strategy
4. ✅ Korean error message localization
5. ✅ API documentation (Swagger/OpenAPI)

**Deliverables**:
- Rate limiter
- Security audit passed
- Complete API documentation
- Production-ready endpoints

---

## 8. Testing Checklist

### Unit Tests
- [ ] Zod validators (all schemas)
- [ ] Error handler (all error types)
- [ ] Business logic handlers (all functions)
- [ ] Cache utilities (hit/miss scenarios)

### Integration Tests
- [ ] /analyze endpoint (success + error cases)
- [ ] /recommend endpoint (success + error cases)
- [ ] /character/:id endpoint (success + error cases)
- [ ] End-to-end flow (analyze → recommend → lookup)

### Performance Tests
- [ ] /recommend completes in <5s (1,000 candidates)
- [ ] /analyze completes in <100ms
- [ ] /character/:id completes in <50ms
- [ ] Load test: 50 req/s sustained for 5 minutes

### Security Tests
- [ ] Rate limiting works (429 after limit)
- [ ] SQL injection prevented (Prisma ORM)
- [ ] XSS prevented (sanitization)
- [ ] Invalid input rejected (400 errors)

---

## 9. Monitoring & Observability

### Key Metrics to Track

**Performance Metrics**:
```typescript
// lib/monitoring/metrics.ts
export interface ApiMetrics {
  endpoint: string;
  executionTime: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
}

export function logMetrics(metrics: ApiMetrics) {
  console.log(JSON.stringify({
    type: 'api_metrics',
    ...metrics,
  }));

  // Send to monitoring service (e.g., DataDog, New Relic)
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoring(metrics);
  }
}
```

**Metrics to Monitor**:
1. **Request Rate**: requests/second per endpoint
2. **Response Time**: P50, P95, P99 latency
3. **Error Rate**: 4xx/5xx errors per endpoint
4. **Database Performance**: Query time, connection pool usage
5. **Cache Hit Rate**: % of requests served from cache

**Alerting Rules**:
```yaml
alerts:
  - name: high_error_rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical

  - name: slow_response_time
    condition: p95_latency > 8s
    duration: 10m
    severity: warning

  - name: database_connection_exhaustion
    condition: db_pool_usage > 90%
    duration: 5m
    severity: critical
```

---

## 10. API Documentation (OpenAPI/Swagger)

### Auto-Generated Documentation

```typescript
// lib/openapi/naming-api.yaml
openapi: 3.0.0
info:
  title: Korean Naming Service API
  version: 2.0.0
  description: 사주 기반 작명 서비스 REST API

servers:
  - url: https://api.saju-naming.com
    description: Production server
  - url: http://localhost:3000
    description: Development server

paths:
  /api/naming/analyze:
    post:
      summary: Analyze birth data to calculate Saju
      tags: [Saju Analysis]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [birthDate, birthTime, gender]
              properties:
                birthDate:
                  type: string
                  format: date
                  example: "1990-05-15"
                birthTime:
                  type: string
                  pattern: '^\d{2}:\d{2}$'
                  example: "14:30"
                isLunar:
                  type: boolean
                  default: false
                gender:
                  type: string
                  enum: [male, female]
      responses:
        '200':
          description: Successful analysis
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AnalyzeResponse'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/naming/recommend:
    post:
      summary: Generate name recommendations
      tags: [Name Recommendation]
      # ... (similar structure)

  /api/naming/character/{id}:
    get:
      summary: Get character details
      tags: [Character Lookup]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      # ... (similar structure)

components:
  schemas:
    AnalyzeResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            sajuDataId:
              type: string
              format: uuid
            pillars:
              # ... (detailed schema)

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          example: "VALIDATION_ERROR"
        message:
          type: string
          example: "입력 데이터가 올바르지 않습니다"
```

---

## 11. Conclusion

### Summary of Design Decisions

1. **Next.js 15 App Router**: Modern, type-safe route handlers
2. **Zod Validation**: Runtime type safety + TypeScript inference
3. **Separation of Concerns**: Thin route handlers, business logic in separate modules
4. **Performance-First**: <5s target with early termination + caching
5. **Korean UX**: User-friendly error messages in Korean
6. **Production-Ready**: Error handling, rate limiting, monitoring

### Success Criteria

✅ **Phase 2 Complete When**:
- [ ] All 3 endpoints working (`/analyze`, `/recommend`, `/character/:id`)
- [ ] 100% integration with Phase 1 code (HanjaMatcher, SajuCalculator)
- [ ] <5s response time for `/recommend` with 1,000 candidates
- [ ] 100% test coverage (unit + integration)
- [ ] Security measures implemented (rate limiting, sanitization)
- [ ] API documentation complete (Swagger/OpenAPI)

### Next Steps (Phase 3)

**Frontend Integration**:
- React components for name recommendation UI
- Form validation with Zod (shared schemas)
- Real-time progress indicators during generation
- Responsive design for mobile devices

**Advanced Features**:
- User accounts and favorite names
- Payment integration for premium features
- AI-powered meaning generation (GPT-4)
- Multi-language support (English translations)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-15
**Status**: Ready for Implementation ✅
