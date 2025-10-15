/**
 * Naming API Custom Error Classes
 *
 * Provides structured error handling with Korean user-friendly messages.
 * Each error includes a code, HTTP status, and localized message.
 */

import { json } from '@remix-run/node';
import { ZodError } from 'zod';

// ============================================================
// Base Error Class
// ============================================================

/**
 * 작명 API 기본 에러 클래스
 */
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

  /**
   * Remix json() 응답으로 변환
   */
  toResponse() {
    return json(
      {
        success: false,
        error: this.code,
        message: this.userMessage,
        details: this.message,
        timestamp: new Date().toISOString(),
      },
      { status: this.statusCode }
    );
  }
}

// ============================================================
// Specific Error Classes
// ============================================================

/**
 * 400 Bad Request - Validation Error
 */
export class ValidationError extends NamingError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      userMessage || '입력 데이터가 올바르지 않습니다'
    );
    this.name = 'ValidationError';
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends NamingError {
  constructor(resource: string, userMessage?: string) {
    super(
      `${resource} not found`,
      'NOT_FOUND',
      404,
      userMessage || '요청한 데이터를 찾을 수 없습니다'
    );
    this.name = 'NotFoundError';
  }
}

/**
 * 500 Internal Server Error - Saju Calculation Failed
 */
export class SajuCalculationError extends NamingError {
  constructor(message: string) {
    super(
      message,
      'SAJU_CALCULATION_ERROR',
      500,
      '사주 계산 중 오류가 발생했습니다. 입력 정보를 확인해주세요.'
    );
    this.name = 'SajuCalculationError';
  }
}

/**
 * 400 Bad Request - Insufficient Characters
 */
export class InsufficientCharactersError extends NamingError {
  constructor(availableCount: number) {
    super(
      `Only ${availableCount} characters available`,
      'INSUFFICIENT_CHARACTERS',
      400,
      `조건에 맞는 한자가 부족합니다 (${availableCount}개). 조건을 완화해주세요.`
    );
    this.name = 'InsufficientCharactersError';
  }
}

/**
 * 429 Too Many Requests - Rate Limit Exceeded
 */
export class RateLimitError extends NamingError {
  constructor(retryAfter: number = 60) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      'RATE_LIMIT_EXCEEDED',
      429,
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    );
    this.name = 'RateLimitError';
  }
}

/**
 * 504 Gateway Timeout
 */
export class TimeoutError extends NamingError {
  constructor() {
    super(
      'Request processing timeout',
      'TIMEOUT',
      504,
      '요청 처리 시간이 초과되었습니다. 조건을 단순화해주세요.'
    );
    this.name = 'TimeoutError';
  }
}

// ============================================================
// Error Handler for Remix
// ============================================================

/**
 * Remix action/loader에서 사용할 통합 에러 핸들러
 *
 * @example
 * ```typescript
 * export async function action({ request }: ActionFunctionArgs) {
 *   try {
 *     // ... business logic
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown) {
  console.error('[API Error]', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return json(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다',
        details: firstError.message,
        field: firstError.path.join('.'),
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Custom naming errors
  if (error instanceof NamingError) {
    return error.toResponse();
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string };

    // Record not found
    if (prismaError.code === 'P2025') {
      return json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: '요청한 데이터를 찾을 수 없습니다',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return json(
        {
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: '중복된 데이터가 존재합니다',
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }
  }

  // Unknown errors
  return json(
    {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

// ============================================================
// Error Response Type
// ============================================================

/**
 * API 에러 응답 타입
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: string;
  field?: string;
  timestamp: string;
}
