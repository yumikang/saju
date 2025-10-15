# Phase 2: Remix API Architecture Design
## Korean Naming Service - Resource Routes Specification

**Document Version**: 1.0.0
**Created**: 2025-10-15
**Framework**: Remix v2.16.8
**Phase 1 Status**: Complete (HanjaMatcher 8-60ms, ScoringPipeline, SajuCalculator)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Remix vs Next.js Patterns](#2-remix-vs-nextjs-patterns)
3. [API Endpoints Specification](#3-api-endpoints-specification)
4. [Code Organization](#4-code-organization)
5. [Phase 1 Integration](#5-phase-1-integration)
6. [Testing Strategy](#6-testing-strategy)
7. [Performance Optimization](#7-performance-optimization)
8. [Implementation Examples](#8-implementation-examples)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  (React Components + Zustand State + Shadcn/UI)            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/JSON
┌──────────────────────▼──────────────────────────────────────┐
│                  Remix Resource Routes                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ POST /api/naming/analyze                           │    │
│  │ POST /api/naming/recommend                         │    │
│  │ GET  /api/naming/character/:id                     │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                            │
│  ┌──────────────▼─────────────────────────────────────┐    │
│  │         Business Logic Layer                       │    │
│  │  • Request Validation (Zod)                        │    │
│  │  • Authentication (Supabase)                       │    │
│  │  • Error Handling                                  │    │
│  │  • Response Formatting                             │    │
│  └──────────────┬─────────────────────────────────────┘    │
└─────────────────┼──────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────┐
│               Phase 1 Core Services                         │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ SajuCalculator   │  │ HanjaMatcher     │               │
│  │  8-60ms          │  │  8-60ms          │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────────────────────────────┐             │
│  │      ScoringPipeline (Parallel)          │             │
│  │  • ElementScorer (40%)                   │             │
│  │  • YinYangScorer (20%)                   │             │
│  │  • NumerologyScorer (20%)                │             │
│  │  • MeaningScorer (20%)                   │             │
│  └──────────────────────────────────────────┘             │
└──────────────────┬─────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│              Data Access Layer                              │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Prisma Client → PostgreSQL                      │     │
│  │  • SajuData, NamingResult, HanjaDict             │     │
│  │  • Optimized indexes for performance             │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

**Remix-First Approach**
- Resource routes with dot notation: `api.naming.analyze.ts`
- `loader` for GET, `action` for POST/PUT/DELETE
- Type-safe with `ActionFunctionArgs`/`LoaderFunctionArgs`
- Built-in `json()` helper for responses

**Separation of Concerns**
- Routes handle HTTP concerns (validation, auth, response formatting)
- Business logic in `/app/lib/naming/api-handlers.ts`
- Phase 1 services remain unchanged
- Clear boundaries between layers

**Performance Targets**
- Analyze endpoint: 50-150ms (Saju calculation + DB query)
- Recommend endpoint: 2-5s (1,000+ name generation + scoring)
- Character endpoint: <50ms (Single DB query with cache)

**Error Handling Philosophy**
- Zod for request validation (catch at boundary)
- Business logic errors with typed error responses
- Consistent error format across all endpoints
- Detailed error messages in development, safe in production

---

## 2. Remix vs Next.js Patterns

### 2.1 Key Differences

| Aspect | Next.js | Remix |
|--------|---------|-------|
| **File Location** | `pages/api/naming/analyze.ts` | `app/routes/api.naming.analyze.ts` |
| **Route Definition** | File path = URL | Dot notation in filename |
| **Request Handlers** | `export default function handler(req, res)` | `export async function action({ request })` |
| **HTTP Methods** | Check `req.method` | Separate `loader` (GET) and `action` (POST) |
| **Response** | `res.status(200).json(data)` | `return json(data, { status: 200 })` |
| **Request Body** | `req.body` (parsed by Next.js) | `await request.json()` or `await request.formData()` |
| **Type Safety** | Manual types | `ActionFunctionArgs`, `LoaderFunctionArgs` |
| **Authentication** | Manual middleware | Integrate in loader/action |
| **Error Handling** | Try-catch + res.status | Try-catch + return json() or throw Response |

### 2.2 Remix Resource Routes

**What are Resource Routes?**
- Routes that return data (JSON, XML, PDF) instead of UI
- Use `loader` for GET requests
- Use `action` for mutations (POST, PUT, DELETE)
- Return data with `json()` helper
- Can throw `Response` objects for errors

**File Naming Convention**
```
app/routes/
  api.naming.analyze.ts       → /api/naming/analyze
  api.naming.recommend.ts     → /api/naming/recommend
  api.naming.character.$id.ts → /api/naming/character/:id (dynamic segment)
```

**Basic Structure**
```typescript
// app/routes/api.naming.analyze.ts
import { json, type ActionFunctionArgs } from "@remix-run/node";

// POST /api/naming/analyze
export async function action({ request }: ActionFunctionArgs) {
  // Parse request
  const body = await request.json();

  // Process
  const result = await processAnalysis(body);

  // Return response
  return json(result);
}

// Optional: Prevent GET requests
export async function loader() {
  throw new Response("Method Not Allowed", { status: 405 });
}
```

---

## 3. API Endpoints Specification

### 3.1 POST /api/naming/analyze

**Purpose**: Calculate Saju (Four Pillars) from birth data

**Route File**: `app/routes/api.naming.analyze.ts`

**Request Validation**
```typescript
// app/lib/naming/validators.ts
import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  isLunar: z.boolean().default(false),
  gender: z.enum(['M', 'F']),
  name: z.string().min(1).max(50).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
```

**Request Example**
```json
POST /api/naming/analyze
Content-Type: application/json

{
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "isLunar": false,
  "gender": "M",
  "name": "홍길동"
}
```

**Response Success (200)**
```typescript
interface AnalyzeResponse {
  success: true;
  data: {
    sajuDataId: string;
    pillars: {
      year: { stem: string; branch: string };
      month: { stem: string; branch: string };
      day: { stem: string; branch: string };
      hour: { stem: string; branch: string };
    };
    dayMaster: {
      stem: string;
      element: Element;
    };
    elementCounts: Record<Element, number>;
    lackingElements: Element[];
    favorableElements: Element[];
    yongsin: {
      primary: Element;
      secondary?: Element;
    };
  };
  metadata: {
    executionTime: number; // milliseconds
    timestamp: string;
  };
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "sajuDataId": "550e8400-e29b-41d4-a716-446655440000",
    "pillars": {
      "year": { "stem": "경", "branch": "오" },
      "month": { "stem": "신", "branch": "사" },
      "day": { "stem": "갑", "branch": "자" },
      "hour": { "stem": "신", "branch": "미" }
    },
    "dayMaster": {
      "stem": "갑",
      "element": "WOOD"
    },
    "elementCounts": {
      "WOOD": 2.5,
      "FIRE": 3.0,
      "EARTH": 1.5,
      "METAL": 3.0,
      "WATER": 2.0
    },
    "lackingElements": [],
    "favorableElements": ["WATER", "WOOD"],
    "yongsin": {
      "primary": "WATER",
      "secondary": "WOOD"
    }
  },
  "metadata": {
    "executionTime": 87,
    "timestamp": "2025-10-15T10:30:00.123Z"
  }
}
```

**Error Responses**

```typescript
// 400 Bad Request - Validation Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "path": ["birthDate"],
        "message": "Invalid date format (YYYY-MM-DD)"
      }
    ]
  }
}

// 401 Unauthorized - Authentication Required
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to calculate Saju",
    "details": "SajuCalculator error: Invalid lunar date conversion"
  }
}
```

**Performance Target**: 50-150ms

---

### 3.2 POST /api/naming/recommend

**Purpose**: Generate name recommendations based on Saju analysis

**Route File**: `app/routes/api.naming.recommend.ts`

**Request Validation**
```typescript
// app/lib/naming/validators.ts
export const RecommendRequestSchema = z.object({
  sajuDataId: z.string().uuid(),
  lastName: z.string().min(1).max(10),
  gender: z.enum(['male', 'female', 'neutral']).optional(),
  preferences: z.object({
    avoidCharacters: z.array(z.string()).optional(),
    preferredElements: z.array(z.nativeEnum(Element)).optional(),
    minScore: z.number().min(0).max(100).default(60),
    maxResults: z.number().min(1).max(1000).default(50),
  }).optional(),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;
```

**Request Example**
```json
POST /api/naming/recommend
Content-Type: application/json

{
  "sajuDataId": "550e8400-e29b-41d4-a716-446655440000",
  "lastName": "김",
  "gender": "male",
  "preferences": {
    "avoidCharacters": ["병", "사"],
    "preferredElements": ["WATER", "WOOD"],
    "minScore": 70,
    "maxResults": 20
  }
}
```

**Response Success (200)**
```typescript
interface RecommendResponse {
  success: true;
  data: {
    recommendations: ScoredCandidate[];
    totalGenerated: number;
    totalScored: number;
  };
  metadata: {
    executionTime: number;
    timestamp: string;
    performance: {
      stage1FilterMs: number; // DB element filtering
      stage2FilterMs: number; // Stroke filtering
      stage3GenerateMs: number; // Combination generation + scoring
    };
  };
}

// ScoredCandidate structure from Phase 1
interface ScoredCandidate {
  firstName: [string, string]; // Korean readings
  characters: [HanjaCharacter, HanjaCharacter];
  scores: {
    overall: number; // 0-100
    elementHarmony: DetailedScore;
    yinYangBalance: DetailedScore;
    numerology: DetailedScore;
    meaningHarmony: DetailedScore;
  };
  confidenceScore: number; // Score consistency metric
  analysis: NameAnalysis;
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "firstName": ["민", "준"],
        "characters": [
          {
            "id": 1234,
            "character": "敏",
            "strokes": 11,
            "element": "WATER",
            "yinYang": "YIN",
            "meaning": "민첩하다, 영리하다",
            "koreanReading": "민"
          },
          {
            "id": 5678,
            "character": "俊",
            "strokes": 9,
            "element": "WOOD",
            "yinYang": "YANG",
            "meaning": "뛰어나다, 준수하다",
            "koreanReading": "준"
          }
        ],
        "scores": {
          "overall": 87,
          "elementHarmony": {
            "score": 92,
            "weight": 0.4,
            "weightedScore": 36.8,
            "explanation": "부족 오행(水) 보완, 상생 관계(水生木) 형성"
          },
          "yinYangBalance": {
            "score": 85,
            "weight": 0.2,
            "weightedScore": 17.0,
            "explanation": "음양 균형: 음-양-양"
          },
          "numerology": {
            "score": 83,
            "weight": 0.2,
            "weightedScore": 16.6,
            "explanation": "4격 중 3격 길수"
          },
          "meaningHarmony": {
            "score": 84,
            "weight": 0.2,
            "weightedScore": 16.8,
            "explanation": "지혜와 재능의 조화"
          }
        },
        "confidenceScore": 0.89,
        "analysis": {
          "elementHarmony": {
            "lacksComplement": true,
            "hasProducingCycle": true,
            "hasConflictingCycle": false,
            "strengthensFavorable": true,
            "details": ["水 부족 보완", "水生木 상생"]
          }
        }
      }
    ],
    "totalGenerated": 1247,
    "totalScored": 324
  },
  "metadata": {
    "executionTime": 2847,
    "timestamp": "2025-10-15T10:30:03.456Z",
    "performance": {
      "stage1FilterMs": 67,
      "stage2FilterMs": 23,
      "stage3GenerateMs": 2757
    }
  }
}
```

**Error Responses**
```typescript
// 404 Not Found - Saju Data Not Found
{
  "success": false,
  "error": {
    "code": "SAJU_NOT_FOUND",
    "message": "Saju data not found",
    "details": "No Saju record found with ID: 550e8400..."
  }
}

// 422 Unprocessable Entity - Insufficient Data
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CANDIDATES",
    "message": "Cannot generate recommendations",
    "details": "Only 3 suitable Hanja characters found (minimum 10 required). Please relax filtering criteria."
  }
}
```

**Performance Target**: 2-5 seconds (for 50-1000 candidates)

---

### 3.3 GET /api/naming/character/:id

**Purpose**: Retrieve detailed information about a specific Hanja character

**Route File**: `app/routes/api.naming.character.$id.ts`

**URL Parameters**
```typescript
// Dynamic segment: $id
// Example: /api/naming/character/550e8400-e29b-41d4-a716-446655440000
```

**Request Example**
```http
GET /api/naming/character/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response Success (200)**
```typescript
interface CharacterResponse {
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
    usageFrequency: number;
    nameFrequency: number;
    category?: string;
    gender?: 'male' | 'female' | 'neutral';
    isGoodForNaming: boolean;
    // Additional analysis
    numerology: {
      fortune: FortuneRating;
      meanings: string[];
    };
    relatedCharacters: {
      sameElement: string[];
      sameReading: string[];
      similar: string[];
    };
  };
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "character": "敏",
    "meaning": "민첩하다, 영리하다",
    "strokes": 11,
    "element": "WATER",
    "yinYang": "YIN",
    "koreanReading": "민",
    "chineseReading": "mǐn",
    "radical": "攴",
    "usageFrequency": 850,
    "nameFrequency": 320,
    "category": "virtue",
    "gender": "neutral",
    "isGoodForNaming": true,
    "numerology": {
      "fortune": "길",
      "meanings": ["지혜", "재능", "성공"]
    },
    "relatedCharacters": {
      "sameElement": ["珉", "旻", "玟"],
      "sameReading": ["民", "珉", "旻"],
      "similar": ["敦", "敬", "敍"]
    }
  }
}
```

**Error Responses**
```typescript
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "CHARACTER_NOT_FOUND",
    "message": "Hanja character not found",
    "details": "No character found with ID: 550e8400..."
  }
}
```

**Performance Target**: <50ms (with caching)

---

## 4. Code Organization

### 4.1 Directory Structure

```
app/
├── routes/
│   ├── api.naming.analyze.ts       # POST /api/naming/analyze
│   ├── api.naming.recommend.ts     # POST /api/naming/recommend
│   └── api.naming.character.$id.ts # GET /api/naming/character/:id
│
├── lib/
│   ├── naming/
│   │   ├── api-handlers.ts         # 🆕 Business logic for API routes
│   │   ├── validators.ts           # 🆕 Zod validation schemas
│   │   ├── errors.ts               # 🆕 Error types and handlers
│   │   ├── matcher.ts              # ✅ Phase 1 - HanjaMatcher
│   │   ├── types.ts                # ✅ Phase 1 - Type definitions
│   │   ├── scorers/
│   │   │   ├── scoring-pipeline.ts # ✅ Phase 1
│   │   │   ├── element-scorer.ts   # ✅ Phase 1
│   │   │   ├── yinyang-scorer.ts   # ✅ Phase 1
│   │   │   ├── numerology-scorer.ts# ✅ Phase 1
│   │   │   └── meaning-scorer.ts   # ✅ Phase 1
│   │   └── utils/
│   │       ├── element-relations.ts# ✅ Phase 1
│   │       └── numerology-81.ts    # ✅ Phase 1
│   │
│   ├── saju/
│   │   └── calculator.ts           # ✅ Phase 1 - SajuCalculator
│   │
│   ├── db.server.ts                # ✅ Existing - Prisma + Repositories
│   ├── supabase.server.ts          # ✅ Existing - Auth helpers
│   └── cache-config.server.ts      # ✅ Existing - Redis cache
│
└── repositories/
    ├── saju.repository.ts          # 🆕 Saju CRUD operations
    ├── naming.repository.ts        # 🆕 NamingResult CRUD
    └── hanja.repository.ts         # 🆕 HanjaDict queries
```

### 4.2 New Files to Create

#### 4.2.1 Validators (`app/lib/naming/validators.ts`)

```typescript
import { z } from 'zod';
import { Element } from '@prisma/client';

// ============================================================
// Analyze Endpoint
// ============================================================

export const AnalyzeRequestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  isLunar: z.boolean().default(false),
  gender: z.enum(['M', 'F']),
  name: z.string().min(1).max(50).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// ============================================================
// Recommend Endpoint
// ============================================================

export const RecommendRequestSchema = z.object({
  sajuDataId: z.string().uuid('Invalid Saju ID format'),
  lastName: z.string().min(1, 'Last name required').max(10),
  gender: z.enum(['male', 'female', 'neutral']).optional(),
  preferences: z.object({
    avoidCharacters: z.array(z.string().length(1)).optional(),
    preferredElements: z.array(z.nativeEnum(Element)).optional(),
    minScore: z.number().min(0).max(100).default(60),
    maxResults: z.number().min(1).max(1000).default(50),
  }).optional(),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

// ============================================================
// Character Endpoint
// ============================================================

export const CharacterParamsSchema = z.object({
  id: z.string().uuid('Invalid character ID format'),
});

export type CharacterParams = z.infer<typeof CharacterParamsSchema>;

// ============================================================
// Validation Helper
// ============================================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}
```

#### 4.2.2 Error Handling (`app/lib/naming/errors.ts`)

```typescript
import { json } from '@remix-run/node';
import type { z } from 'zod';

// ============================================================
// Error Types
// ============================================================

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SAJU_NOT_FOUND = 'SAJU_NOT_FOUND',
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
  INSUFFICIENT_CANDIDATES = 'INSUFFICIENT_CANDIDATES',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: string | Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
}

// ============================================================
// Error Factories
// ============================================================

export function createValidationError(zodError: z.ZodError) {
  return json<ErrorResponse>(
    {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid request data',
        details: zodError.errors.map(err => ({
          path: err.path,
          message: err.message,
        })),
      },
    },
    { status: 400 }
  );
}

export function createUnauthorizedError() {
  return json<ErrorResponse>(
    {
      success: false,
      error: {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
      },
    },
    { status: 401 }
  );
}

export function createNotFoundError(resource: string, id: string) {
  return json<ErrorResponse>(
    {
      success: false,
      error: {
        code: ErrorCode.SAJU_NOT_FOUND,
        message: `${resource} not found`,
        details: `No ${resource.toLowerCase()} found with ID: ${id}`,
      },
    },
    { status: 404 }
  );
}

export function createInternalError(message: string, details?: string) {
  return json<ErrorResponse>(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      },
    },
    { status: 500 }
  );
}

// ============================================================
// Error Handler Middleware
// ============================================================

export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof Response) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  const details = error instanceof Error ? error.stack : undefined;

  return createInternalError('Internal server error', details);
}
```

#### 4.2.3 API Handlers (`app/lib/naming/api-handlers.ts`)

```typescript
import { SajuCalculator, type SajuResult } from '../saju/calculator';
import { HanjaMatcher } from './matcher';
import { getSajuRepository, getHanjaRepository } from '../db.server';
import type { AnalyzeRequest, RecommendRequest } from './validators';
import type { ScoredCandidate } from './types';
import { Element } from '@prisma/client';

// ============================================================
// Analyze Handler
// ============================================================

export interface AnalyzeResult {
  sajuDataId: string;
  pillars: SajuResult['pillars'];
  dayMaster: SajuResult['dayMaster'];
  elementCounts: SajuResult['elementCounts'];
  lackingElements: SajuResult['lackingElements'];
  favorableElements: SajuResult['favorableElements'];
  yongsin: SajuResult['yongsin'];
}

export async function handleAnalyzeRequest(
  request: AnalyzeRequest,
  userId: string
): Promise<AnalyzeResult> {
  const startTime = Date.now();

  // 1. Calculate Saju
  const calculator = new SajuCalculator();
  const birthDate = new Date(request.birthDate + 'T00:00:00Z');
  const sajuResult = calculator.calculate(birthDate, request.birthTime, request.isLunar);

  // 2. Save to database
  const sajuRepository = getSajuRepository();
  const savedSaju = await sajuRepository.create({
    userId,
    name: request.name || 'unnamed',
    birthDate,
    birthTime: request.birthTime,
    isLunar: request.isLunar,
    gender: request.gender,
    // Pillars
    yearGan: sajuResult.pillars.year.stem,
    yearJi: sajuResult.pillars.year.branch,
    monthGan: sajuResult.pillars.month.stem,
    monthJi: sajuResult.pillars.month.branch,
    dayGan: sajuResult.pillars.day.stem,
    dayJi: sajuResult.pillars.day.branch,
    hourGan: sajuResult.pillars.hour.stem,
    hourJi: sajuResult.pillars.hour.branch,
    // Element counts
    woodCount: Math.round(sajuResult.elementCounts[Element.WOOD]),
    fireCount: Math.round(sajuResult.elementCounts[Element.FIRE]),
    earthCount: Math.round(sajuResult.elementCounts[Element.EARTH]),
    metalCount: Math.round(sajuResult.elementCounts[Element.METAL]),
    waterCount: Math.round(sajuResult.elementCounts[Element.WATER]),
    // Yongsin
    primaryYongsin: elementToKorean(sajuResult.yongsin.primary),
    secondaryYongsin: sajuResult.yongsin.secondary
      ? elementToKorean(sajuResult.yongsin.secondary)
      : null,
  });

  const executionTime = Date.now() - startTime;
  console.log(`Saju analysis completed in ${executionTime}ms`);

  return {
    sajuDataId: savedSaju.id,
    pillars: sajuResult.pillars,
    dayMaster: sajuResult.dayMaster,
    elementCounts: sajuResult.elementCounts,
    lackingElements: sajuResult.lackingElements,
    favorableElements: sajuResult.favorableElements,
    yongsin: sajuResult.yongsin,
  };
}

// ============================================================
// Recommend Handler
// ============================================================

export interface RecommendResult {
  recommendations: ScoredCandidate[];
  totalGenerated: number;
  totalScored: number;
  performance: {
    stage1FilterMs: number;
    stage2FilterMs: number;
    stage3GenerateMs: number;
  };
}

export async function handleRecommendRequest(
  request: RecommendRequest,
  userId: string
): Promise<RecommendResult> {
  const startTime = Date.now();

  // 1. Fetch Saju data
  const sajuRepository = getSajuRepository();
  const sajuData = await sajuRepository.findById(request.sajuDataId);

  if (!sajuData) {
    throw new Error('SAJU_NOT_FOUND');
  }

  // Verify ownership
  if (sajuData.userId !== userId) {
    throw new Error('UNAUTHORIZED');
  }

  // 2. Convert to SajuResult format
  const sajuResult: SajuResult = {
    pillars: {
      year: { stem: sajuData.yearGan, branch: sajuData.yearJi },
      month: { stem: sajuData.monthGan, branch: sajuData.monthJi },
      day: { stem: sajuData.dayGan, branch: sajuData.dayJi },
      hour: { stem: sajuData.hourGan, branch: sajuData.hourJi },
    },
    dayMaster: {
      stem: sajuData.dayGan,
      element: inferElementFromStem(sajuData.dayGan),
    },
    elementCounts: {
      [Element.WOOD]: sajuData.woodCount,
      [Element.FIRE]: sajuData.fireCount,
      [Element.EARTH]: sajuData.earthCount,
      [Element.METAL]: sajuData.metalCount,
      [Element.WATER]: sajuData.waterCount,
    },
    lackingElements: findLackingElements({
      [Element.WOOD]: sajuData.woodCount,
      [Element.FIRE]: sajuData.fireCount,
      [Element.EARTH]: sajuData.earthCount,
      [Element.METAL]: sajuData.metalCount,
      [Element.WATER]: sajuData.waterCount,
    }),
    favorableElements: [
      koreanToElement(sajuData.primaryYongsin!),
      ...(sajuData.secondaryYongsin ? [koreanToElement(sajuData.secondaryYongsin)] : []),
    ],
    yongsin: {
      primary: koreanToElement(sajuData.primaryYongsin!),
      secondary: sajuData.secondaryYongsin ? koreanToElement(sajuData.secondaryYongsin) : undefined,
    },
  };

  // 3. Generate name recommendations
  const matcher = new HanjaMatcher();
  const options = {
    minScore: request.preferences?.minScore || 60,
    maxResults: request.preferences?.maxResults || 50,
    gender: request.gender === 'male' ? 'male' : request.gender === 'female' ? 'female' : undefined,
    preferredElements: request.preferences?.preferredElements,
    avoidChars: request.preferences?.avoidCharacters || [],
  };

  const candidates = await matcher.findOptimalNames(sajuResult, request.lastName, options);

  const executionTime = Date.now() - startTime;
  console.log(`Name recommendation completed in ${executionTime}ms`);

  return {
    recommendations: candidates,
    totalGenerated: candidates.length,
    totalScored: candidates.length,
    performance: {
      stage1FilterMs: 0, // Matcher tracks internally
      stage2FilterMs: 0,
      stage3GenerateMs: executionTime,
    },
  };
}

// ============================================================
// Character Details Handler
// ============================================================

export async function handleCharacterRequest(characterId: string) {
  const hanjaRepository = getHanjaRepository();
  const character = await hanjaRepository.findById(characterId);

  if (!character) {
    throw new Error('CHARACTER_NOT_FOUND');
  }

  // TODO: Add related characters query
  const relatedCharacters = {
    sameElement: [],
    sameReading: [],
    similar: [],
  };

  return {
    ...character,
    relatedCharacters,
  };
}

// ============================================================
// Helper Functions
// ============================================================

function elementToKorean(element: Element): string {
  const map = {
    [Element.WOOD]: '목',
    [Element.FIRE]: '화',
    [Element.EARTH]: '토',
    [Element.METAL]: '금',
    [Element.WATER]: '수',
  };
  return map[element];
}

function koreanToElement(korean: string): Element {
  const map: Record<string, Element> = {
    '목': Element.WOOD,
    '화': Element.FIRE,
    '토': Element.EARTH,
    '금': Element.METAL,
    '수': Element.WATER,
  };
  return map[korean];
}

function inferElementFromStem(stem: string): Element {
  const map: Record<string, Element> = {
    '갑': Element.WOOD, '을': Element.WOOD,
    '병': Element.FIRE, '정': Element.FIRE,
    '무': Element.EARTH, '기': Element.EARTH,
    '경': Element.METAL, '신': Element.METAL,
    '임': Element.WATER, '계': Element.WATER,
  };
  return map[stem] || Element.WOOD;
}

function findLackingElements(counts: Record<Element, number>): Element[] {
  const avg = Object.values(counts).reduce((a, b) => a + b, 0) / 5;
  return (Object.entries(counts) as [Element, number][])
    .filter(([_, count]) => count < avg * 0.5)
    .map(([elem]) => elem);
}
```

---

## 5. Phase 1 Integration

### 5.1 Integration Points

**SajuCalculator Integration**
```typescript
// app/routes/api.naming.analyze.ts
import { SajuCalculator } from '~/lib/saju/calculator';

const calculator = new SajuCalculator();
const birthDate = new Date(request.birthDate + 'T00:00:00Z');
const sajuResult = calculator.calculate(
  birthDate,
  request.birthTime,
  request.isLunar
);

// Performance: 8-60ms ✅
```

**HanjaMatcher Integration**
```typescript
// app/routes/api.naming.recommend.ts
import { HanjaMatcher } from '~/lib/naming/matcher';

const matcher = new HanjaMatcher();
const candidates = await matcher.findOptimalNames(
  sajuResult,
  lastName,
  options
);

// Performance: 2-5s for 1000 candidates ✅
```

**ScoringPipeline (Automatic)**
```typescript
// Called internally by HanjaMatcher
// Parallel scoring of all candidates
// - ElementScorer (40%)
// - YinYangScorer (20%)
// - NumerologyScorer (20%)
// - MeaningScorer (20%)

// No direct API route integration needed ✅
```

### 5.2 Performance Optimization

**Database Query Optimization**
```typescript
// Composite index already exists in schema
// @@index([element, isGoodForNaming])

// Query uses index for fast filtering
const pool = await prisma.hanjaDict.findMany({
  where: {
    AND: [
      { element: { in: targetElements } },
      { isGoodForNaming: true },
      { character: { notIn: avoidChars } },
    ],
  },
  orderBy: [
    { nameFrequency: 'desc' },
    { usageFrequency: 'desc' },
  ],
  take: 1000,
});

// Performance: 50-100ms ✅
```

**Caching Strategy**
```typescript
// app/lib/cache-config.server.ts
import { LRUCache } from 'lru-cache';

// Character details cache (1 hour TTL)
const characterCache = new LRUCache<string, HanjaCharacter>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
});

export async function getCachedCharacter(id: string) {
  const cached = characterCache.get(id);
  if (cached) return cached;

  const character = await hanjaRepository.findById(id);
  if (character) {
    characterCache.set(id, character);
  }

  return character;
}
```

**Batch Processing**
```typescript
// Scoring pipeline already implements batching
const BATCH_SIZE = 100;

for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
  const batch = candidates.slice(i, i + BATCH_SIZE);
  const scored = await Promise.all(
    batch.map(candidate => scoreCandidate(candidate, context))
  );
  results.push(...scored);
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Validators Test** (`app/lib/naming/__tests__/validators.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { AnalyzeRequestSchema, RecommendRequestSchema } from '../validators';

describe('AnalyzeRequestSchema', () => {
  it('validates correct analyze request', () => {
    const valid = {
      birthDate: '1990-05-15',
      birthTime: '14:30',
      isLunar: false,
      gender: 'M',
    };

    expect(AnalyzeRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const invalid = {
      birthDate: '1990/05/15', // Wrong format
      birthTime: '14:30',
      gender: 'M',
    };

    const result = AnalyzeRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const invalid = {
      birthDate: '1990-05-15',
      birthTime: '14:30:00', // HH:mm:ss not HH:mm
      gender: 'M',
    };

    const result = AnalyzeRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

**API Handlers Test** (`app/lib/naming/__tests__/api-handlers.test.ts`)
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleAnalyzeRequest, handleRecommendRequest } from '../api-handlers';

describe('handleAnalyzeRequest', () => {
  it('calculates Saju and saves to database', async () => {
    const request = {
      birthDate: '1990-05-15',
      birthTime: '14:30',
      isLunar: false,
      gender: 'M' as const,
    };

    const result = await handleAnalyzeRequest(request, 'test-user-id');

    expect(result.sajuDataId).toBeDefined();
    expect(result.pillars).toBeDefined();
    expect(result.dayMaster).toBeDefined();
    expect(result.elementCounts).toBeDefined();
  });

  it('completes within performance target', async () => {
    const start = Date.now();
    await handleAnalyzeRequest({
      birthDate: '1990-05-15',
      birthTime: '14:30',
      isLunar: false,
      gender: 'M',
    }, 'test-user-id');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(150); // 150ms target
  });
});

describe('handleRecommendRequest', () => {
  it('generates name recommendations', async () => {
    // Create test Saju data first
    const sajuDataId = await createTestSajuData();

    const request = {
      sajuDataId,
      lastName: '김',
      preferences: {
        minScore: 60,
        maxResults: 10,
      },
    };

    const result = await handleRecommendRequest(request, 'test-user-id');

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeLessThanOrEqual(10);
    expect(result.recommendations[0].scores.overall).toBeGreaterThanOrEqual(60);
  });
});
```

### 6.2 Integration Tests

**Remix Route Tests** (`app/routes/__tests__/api.naming.analyze.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { action } from '../api.naming.analyze';

describe('POST /api/naming/analyze', () => {
  it('returns 200 with valid request', async () => {
    const request = new Request('http://localhost/api/naming/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        birthDate: '1990-05-15',
        birthTime: '14:30',
        isLunar: false,
        gender: 'M',
      }),
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.sajuDataId).toBeDefined();
  });

  it('returns 400 with invalid request', async () => {
    const request = new Request('http://localhost/api/naming/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthDate: 'invalid',
        birthTime: '14:30',
        gender: 'M',
      }),
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without authentication', async () => {
    const request = new Request('http://localhost/api/naming/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthDate: '1990-05-15',
        birthTime: '14:30',
        gender: 'M',
      }),
    });

    const response = await action({ request, params: {}, context: {} });

    expect(response.status).toBe(401);
  });
});
```

### 6.3 Performance Benchmarks

**Performance Test Suite** (`app/lib/naming/__tests__/performance.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { handleAnalyzeRequest, handleRecommendRequest } from '../api-handlers';

describe('Performance Benchmarks', () => {
  it('analyze completes within 150ms', async () => {
    const times: number[] = [];

    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await handleAnalyzeRequest({
        birthDate: '1990-05-15',
        birthTime: '14:30',
        isLunar: false,
        gender: 'M',
      }, 'test-user');
      times.push(Date.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average analyze time: ${avg}ms`);
    expect(avg).toBeLessThan(150);
  });

  it('recommend completes within 5 seconds', async () => {
    const sajuDataId = await createTestSajuData();

    const start = Date.now();
    const result = await handleRecommendRequest({
      sajuDataId,
      lastName: '김',
      preferences: { maxResults: 50 },
    }, 'test-user');
    const duration = Date.now() - start;

    console.log(`Recommend time: ${duration}ms`);
    console.log(`Generated: ${result.totalGenerated} candidates`);

    expect(duration).toBeLessThan(5000);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
```

---

## 7. Performance Optimization

### 7.1 Optimization Strategies

**1. Database Query Optimization**
- Composite indexes: `[element, isGoodForNaming]`, `[gender]`, `[nameFrequency]`
- LIMIT queries to prevent full table scans
- Use `select` to fetch only needed fields
- Connection pooling with Prisma

**2. Caching Strategy**
- LRU cache for character details (1 hour TTL)
- Redis for Saju analysis results (optional)
- In-memory cache for frequently used characters

**3. Parallel Processing**
- Scoring pipeline runs scorers in parallel
- Batch processing for large candidate sets
- Use `Promise.all()` for independent operations

**4. Early Termination**
- Stop generation when 150+ high-quality candidates found
- Quick score pre-filtering before full scoring
- Prioritize high-frequency characters

### 7.2 Performance Monitoring

**Logging**
```typescript
// Add to each API handler
const startTime = Date.now();

// ... processing ...

const duration = Date.now() - startTime;
console.log(`[${endpoint}] ${duration}ms | User: ${userId}`);

if (duration > TARGET_TIME) {
  console.warn(`[${endpoint}] Exceeded target: ${duration}ms > ${TARGET_TIME}ms`);
}
```

**Metrics Collection**
```typescript
// app/lib/metrics.server.ts
export interface PerformanceMetrics {
  endpoint: string;
  duration: number;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Store in DB or send to monitoring service
export async function recordMetrics(metrics: PerformanceMetrics) {
  // Implementation depends on monitoring solution
  // e.g., Prometheus, DataDog, CloudWatch
}
```

---

## 8. Implementation Examples

### 8.1 Complete Route Implementation

#### POST /api/naming/analyze

```typescript
// app/routes/api.naming.analyze.ts
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getSession } from '~/lib/supabase.server';
import { AnalyzeRequestSchema, validateRequest } from '~/lib/naming/validators';
import { handleAnalyzeRequest } from '~/lib/naming/api-handlers';
import {
  createValidationError,
  createUnauthorizedError,
  handleApiError,
} from '~/lib/naming/errors';

/**
 * POST /api/naming/analyze
 *
 * Calculate Saju (Four Pillars) from birth data
 *
 * Performance Target: 50-150ms
 */
export async function action({ request }: ActionFunctionArgs) {
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await getSession(request);
    if (!session) {
      return createUnauthorizedError();
    }
    const userId = session.user.id;

    // 2. Parse request body
    const body = await request.json();

    // 3. Validate request
    const validation = validateRequest(AnalyzeRequestSchema, body);
    if (!validation.success) {
      return createValidationError(validation.errors);
    }

    // 4. Process request
    const result = await handleAnalyzeRequest(validation.data, userId);

    // 5. Return response
    const executionTime = Date.now() - startTime;

    return json(
      {
        success: true,
        data: result,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Prevent GET requests
export async function loader() {
  return json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
```

#### POST /api/naming/recommend

```typescript
// app/routes/api.naming.recommend.ts
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getSession } from '~/lib/supabase.server';
import { RecommendRequestSchema, validateRequest } from '~/lib/naming/validators';
import { handleRecommendRequest } from '~/lib/naming/api-handlers';
import {
  createValidationError,
  createUnauthorizedError,
  createNotFoundError,
  handleApiError,
  ErrorCode,
} from '~/lib/naming/errors';

/**
 * POST /api/naming/recommend
 *
 * Generate name recommendations based on Saju analysis
 *
 * Performance Target: 2-5 seconds
 */
export async function action({ request }: ActionFunctionArgs) {
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await getSession(request);
    if (!session) {
      return createUnauthorizedError();
    }
    const userId = session.user.id;

    // 2. Parse and validate request
    const body = await request.json();
    const validation = validateRequest(RecommendRequestSchema, body);
    if (!validation.success) {
      return createValidationError(validation.errors);
    }

    // 3. Process request
    const result = await handleRecommendRequest(validation.data, userId);

    // 4. Return response
    const executionTime = Date.now() - startTime;

    // Log performance warning if exceeded target
    if (executionTime > 5000) {
      console.warn(
        `[/api/naming/recommend] Exceeded 5s target: ${executionTime}ms`
      );
    }

    return json(
      {
        success: true,
        data: result,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
          performance: result.performance,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'SAJU_NOT_FOUND') {
        return createNotFoundError('Saju data', 'unknown');
      }
      if (error.message === 'UNAUTHORIZED') {
        return createUnauthorizedError();
      }
      if (error.message.includes('minimum 10 required')) {
        return json(
          {
            success: false,
            error: {
              code: ErrorCode.INSUFFICIENT_CANDIDATES,
              message: 'Cannot generate recommendations',
              details: error.message,
            },
          },
          { status: 422 }
        );
      }
    }

    return handleApiError(error);
  }
}

export async function loader() {
  return json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
```

#### GET /api/naming/character/:id

```typescript
// app/routes/api.naming.character.$id.ts
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getSession } from '~/lib/supabase.server';
import { CharacterParamsSchema, validateRequest } from '~/lib/naming/validators';
import { handleCharacterRequest } from '~/lib/naming/api-handlers';
import {
  createValidationError,
  createUnauthorizedError,
  createNotFoundError,
  handleApiError,
} from '~/lib/naming/errors';

/**
 * GET /api/naming/character/:id
 *
 * Retrieve detailed information about a Hanja character
 *
 * Performance Target: <50ms (with caching)
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const startTime = Date.now();

  try {
    // 1. Authentication (optional for character lookup)
    const session = await getSession(request);
    const userId = session?.user?.id || 'anonymous';

    // 2. Validate params
    const validation = validateRequest(CharacterParamsSchema, params);
    if (!validation.success) {
      return createValidationError(validation.errors);
    }

    // 3. Fetch character details
    const result = await handleCharacterRequest(validation.data.id);

    // 4. Return response
    const executionTime = Date.now() - startTime;

    return json(
      {
        success: true,
        data: result,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600', // 1 hour cache
        },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'CHARACTER_NOT_FOUND') {
      return createNotFoundError('Character', params.id || 'unknown');
    }

    return handleApiError(error);
  }
}
```

### 8.2 Repository Implementation

```typescript
// app/repositories/saju.repository.ts
import type { PrismaClient } from '@prisma/client';

export class SajuRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    userId: string;
    name: string;
    birthDate: Date;
    birthTime: string;
    isLunar: boolean;
    gender: string;
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
  }) {
    return this.prisma.sajuData.create({ data });
  }

  async findById(id: string) {
    return this.prisma.sajuData.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.sajuData.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

```typescript
// app/repositories/hanja.repository.ts
import type { PrismaClient } from '@prisma/client';

export class HanjaRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.hanjaDict.findUnique({
      where: { id },
    });
  }

  async findByCharacter(character: string) {
    return this.prisma.hanjaDict.findUnique({
      where: { character },
    });
  }

  async findRelatedCharacters(character: string) {
    const base = await this.findByCharacter(character);
    if (!base) return null;

    const [sameElement, sameReading] = await Promise.all([
      // Same element
      this.prisma.hanjaDict.findMany({
        where: {
          element: base.element,
          character: { not: character },
          isGoodForNaming: true,
        },
        take: 10,
        orderBy: { nameFrequency: 'desc' },
      }),
      // Same reading
      this.prisma.hanjaDict.findMany({
        where: {
          koreanReading: base.koreanReading,
          character: { not: character },
          isGoodForNaming: true,
        },
        take: 10,
        orderBy: { nameFrequency: 'desc' },
      }),
    ]);

    return {
      character: base,
      sameElement,
      sameReading,
    };
  }
}
```

---

## Summary

This comprehensive design document provides:

1. **Remix-specific patterns** for resource routes (NOT Next.js)
2. **Complete API specifications** for 3 endpoints with examples
3. **Code organization** with clear separation of concerns
4. **Phase 1 integration** patterns for existing services
5. **Testing strategy** covering unit, integration, and performance tests
6. **Performance optimization** techniques and monitoring
7. **Complete implementation examples** ready for development

**Next Steps**:
1. Create new files: `validators.ts`, `errors.ts`, `api-handlers.ts`
2. Implement 3 resource routes following examples
3. Create repository classes for data access
4. Write tests for each component
5. Set up performance monitoring

**Performance Targets**:
- Analyze: 50-150ms ✅
- Recommend: 2-5s ✅
- Character: <50ms ✅

All patterns follow Remix conventions and integrate seamlessly with Phase 1 components.
