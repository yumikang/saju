/**
 * Naming API Request Validators
 *
 * Zod schemas for validating API requests to naming endpoints.
 * Provides runtime type safety and automatic TypeScript type inference.
 */

import { z } from 'zod';
import { Element } from '@prisma/client';

// ============================================================
// Birth Data Schema
// ============================================================

/**
 * 생년월일시 데이터 스키마
 */
export const BirthDataSchema = z.object({
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'YYYY-MM-DD 형식이어야 합니다 (예: 1990-05-15)',
    }),

  birthTime: z.string()
    .regex(/^\d{2}:\d{2}$/, {
      message: 'HH:MM 형식이어야 합니다 (예: 14:30)',
    }),

  isLunar: z.boolean()
    .default(false)
    .describe('음력 여부'),

  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'male 또는 female이어야 합니다' }),
  }),

  timezone: z.string()
    .default('Asia/Seoul')
    .optional()
    .describe('타임존 (기본: Asia/Seoul)'),
});

export type BirthData = z.infer<typeof BirthDataSchema>;

// ============================================================
// Analyze Request Schema
// ============================================================

/**
 * POST /api/naming/analyze 요청 스키마
 *
 * 사주 분석 API 요청 데이터
 */
export const AnalyzeRequestSchema = BirthDataSchema.extend({
  // BirthDataSchema의 모든 필드를 상속받음
  // 추가 필드는 향후 필요시 여기에 추가
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * Analyze 요청 데이터 검증
 */
export function validateAnalyzeRequest(data: unknown): AnalyzeRequest {
  return AnalyzeRequestSchema.parse(data);
}

// ============================================================
// Recommend Request Schema
// ============================================================

/**
 * 이름 추천 선호도 스키마
 */
export const NamingPreferencesSchema = z.object({
  minScore: z.number()
    .min(0, '최소 점수는 0 이상이어야 합니다')
    .max(100, '최소 점수는 100 이하여야 합니다')
    .default(60)
    .describe('최소 점수 (기본: 60)'),

  maxResults: z.number()
    .min(1, '최소 1개 이상의 결과가 필요합니다')
    .max(1000, '최대 1000개까지 요청 가능합니다')
    .default(100)
    .describe('최대 결과 수 (기본: 100)'),

  avoidCharacters: z.array(z.string().length(1, '한 글자씩 입력해주세요'))
    .optional()
    .describe('제외할 한자 목록'),

  preferredElements: z.array(z.nativeEnum(Element))
    .optional()
    .describe('선호하는 오행 목록'),

  gender: z.enum(['male', 'female', 'neutral'])
    .optional()
    .describe('성별 필터'),
}).optional();

export type NamingPreferences = z.infer<typeof NamingPreferencesSchema>;

/**
 * POST /api/naming/recommend 요청 스키마
 *
 * 이름 추천 API 요청 데이터
 * sajuDataId 또는 birthData 중 하나는 필수
 */
export const RecommendRequestSchema = z.object({
  sajuDataId: z.string()
    .uuid({ message: '유효한 UUID 형식이어야 합니다' })
    .optional()
    .describe('기존 사주 데이터 ID'),

  birthData: BirthDataSchema
    .optional()
    .describe('새로운 사주 계산용 생년월일시'),

  lastName: z.string()
    .min(1, '성은 최소 1자 이상이어야 합니다')
    .max(2, '성은 최대 2자까지 입력 가능합니다')
    .describe('성 (1-2자)'),

  preferences: NamingPreferencesSchema,
}).refine(
  (data) => data.sajuDataId || data.birthData,
  {
    message: 'sajuDataId 또는 birthData 중 하나는 필수입니다',
    path: ['sajuDataId'], // 에러 표시 위치
  }
);

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

/**
 * Recommend 요청 데이터 검증
 */
export function validateRecommendRequest(data: unknown): RecommendRequest {
  return RecommendRequestSchema.parse(data);
}

// ============================================================
// Character Request Schema
// ============================================================

/**
 * GET /api/naming/character/:id 쿼리 파라미터 스키마
 */
export const CharacterQuerySchema = z.object({
  include: z.enum(['readings', 'usage', 'all'])
    .optional()
    .describe('추가 정보 포함 여부'),
}).optional();

export type CharacterQuery = z.infer<typeof CharacterQuerySchema>;

/**
 * GET /api/naming/character/:id 경로 파라미터 스키마
 */
export const CharacterParamsSchema = z.object({
  id: z.string()
    .min(1, 'ID는 필수입니다')
    .describe('한자 ID (UUID) 또는 한자 문자'),
});

export type CharacterParams = z.infer<typeof CharacterParamsSchema>;

/**
 * Character 요청 데이터 검증
 */
export function validateCharacterParams(data: unknown): CharacterParams {
  return CharacterParamsSchema.parse(data);
}

export function validateCharacterQuery(data: unknown): CharacterQuery {
  return CharacterQuerySchema.parse(data);
}

// ============================================================
// Shared Validation Utilities
// ============================================================

/**
 * 한글/한자 문자 검증 정규식
 */
export const KOREAN_HANJA_REGEX = /^[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF]+$/;

/**
 * 한글/한자 문자 여부 검증
 */
export function isKoreanOrHanja(text: string): boolean {
  return KOREAN_HANJA_REGEX.test(text);
}

/**
 * 성(lastName) 검증 (한글 또는 한자만 허용)
 */
export const validateLastName = z.string()
  .min(1, '성은 최소 1자 이상이어야 합니다')
  .max(2, '성은 최대 2자까지 입력 가능합니다')
  .refine(isKoreanOrHanja, {
    message: '성은 한글 또는 한자만 입력 가능합니다',
  });

// ============================================================
// Type Exports for Convenience
// ============================================================

export type {
  Element, // Re-export from Prisma for convenience
};
