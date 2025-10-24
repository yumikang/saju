/**
 * Naming API: Generate Names (NamingPipeline)
 *
 * POST /api/naming/generate
 *
 * Complete name generation using the full NamingPipeline system.
 * Integrates Saju calculation, Yongsin analysis, Hanja filtering, validation, and scoring.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { prisma } from '~/lib/prisma.server';
import { getRedisClient } from '~/lib/redis.server';
import {
  createNamingPipeline,
  DatabaseHanjaService,
  RedisCacheService,
  InMemoryCacheService,
  NullCacheService,
} from '~/lib/naming/pipeline';

/**
 * Request validation schema
 */
const GenerateNameRequestSchema = z.object({
  birthInfo: z.object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    isLunar: z.boolean(),
    gender: z.enum(['M', 'F']),
  }),
  lastName: z.string().min(1).max(2),
  lastNameStrokes: z.number().int().min(1).max(30),
  config: z
    .object({
      maxCombinations: z.number().int().optional(),
      maxCandidates: z.number().int().optional(),
      minScore: z.number().optional(),
      requireYongsinMatch: z.boolean().optional(),
      avoidInauspicious: z.boolean().optional(),
    })
    .optional(),
});

type GenerateNameRequest = z.infer<typeof GenerateNameRequestSchema>;

/**
 * POST handler for complete name generation
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/naming/generate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "birthInfo": {
 *       "year": 1990,
 *       "month": 5,
 *       "day": 15,
 *       "hour": 14,
 *       "minute": 30,
 *       "isLunar": false,
 *       "gender": "M"
 *     },
 *     "lastName": "김",
 *     "lastNameStrokes": 8,
 *     "config": {
 *       "maxCandidates": 20,
 *       "minScore": 60
 *     }
 *   }'
 * ```
 *
 * @returns NamingResponse with candidates, metadata, and saju analysis
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validatedData: GenerateNameRequest = GenerateNameRequestSchema.parse(body);

    // 2. Initialize services with Redis cache if available
    const hanjaService = new DatabaseHanjaService(prisma);

    // Try to use Redis cache, fallback to in-memory cache
    const redisClient = await getRedisClient();
    const cacheService = redisClient
      ? new RedisCacheService(redisClient)
      : new InMemoryCacheService();

    console.log(`Using cache: ${redisClient ? 'Redis' : 'In-Memory'}`);

    const pipeline = createNamingPipeline(hanjaService, cacheService);

    // 3. Execute pipeline
    const startTime = Date.now();
    const result = await pipeline.execute(
      validatedData.birthInfo,
      validatedData.lastName,
      validatedData.lastNameStrokes,
      validatedData.config
    );
    const executionTime = Date.now() - startTime;

    // 4. Return response
    return json(
      {
        success: true,
        data: result,
        performance: {
          executionTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // 5. Handle errors
    console.error('Name generation error:', error);

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
          message: error.message || '이름 생성 중 오류가 발생했습니다',
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
 * GET handler - Not allowed
 */
export async function loader() {
  return json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'POST 요청만 허용됩니다',
      usage: {
        endpoint: '/api/naming/generate',
        method: 'POST',
        contentType: 'application/json',
        requiredFields: [
          'birthInfo.year',
          'birthInfo.month',
          'birthInfo.day',
          'birthInfo.hour',
          'birthInfo.minute',
          'birthInfo.isLunar',
          'birthInfo.gender',
          'lastName',
          'lastNameStrokes',
        ],
        optionalFields: ['config.maxCombinations', 'config.maxCandidates', 'config.minScore'],
      },
    },
    { status: 405 }
  );
}
