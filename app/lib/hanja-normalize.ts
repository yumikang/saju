// Prisma enum 호환 한자 데이터 정규화 유틸리티
// contracts.md 규칙에 따른 안전한 데이터 변환 시스템

import { Element, YinYang, ReviewStatus } from '@prisma/client';
import { ValidationResult } from './hanja-enhanced';

// ==============================================
// 매핑 테이블 - 다양한 입력 형태를 Prisma enum으로 변환
// ==============================================

// Element 매핑 테이블 (오행: 金木水火土)
const ELEMENT_MAPPING: Record<string, Element> = {
  // CJK 한자 (우선순위 최고)
  '金': Element.METAL,
  '木': Element.WOOD, 
  '水': Element.WATER,
  '火': Element.FIRE,
  '土': Element.EARTH,
  
  // 한글
  '금': Element.METAL,
  '목': Element.WOOD,
  '수': Element.WATER,
  '화': Element.FIRE,
  '토': Element.EARTH,
  
  // 한글 별칭
  '쇠': Element.METAL,
  '철': Element.METAL,
  '나무': Element.WOOD,
  '물': Element.WATER,
  '불': Element.FIRE,
  '흙': Element.EARTH,
  
  // 영문
  'metal': Element.METAL,
  'wood': Element.WOOD,
  'water': Element.WATER,
  'fire': Element.FIRE,
  'earth': Element.EARTH,
  
  // 영문 대문자
  'METAL': Element.METAL,
  'WOOD': Element.WOOD,
  'WATER': Element.WATER,
  'FIRE': Element.FIRE,
  'EARTH': Element.EARTH,
};

// YinYang 매핑 테이블 (음양)
const YINYANG_MAPPING: Record<string, YinYang> = {
  // 한글
  '음': YinYang.YIN,
  '양': YinYang.YANG,
  
  // CJK 한자 (정체자)
  '陰': YinYang.YIN,
  '陽': YinYang.YANG,
  
  // CJK 한자 (간체자)
  '阴': YinYang.YIN,
  '阳': YinYang.YANG,
  
  // 영문
  'yin': YinYang.YIN,
  'yang': YinYang.YANG,
  
  // 영문 대문자
  'YIN': YinYang.YIN,
  'YANG': YinYang.YANG,
};

// ReviewStatus 매핑 테이블
const REVIEW_STATUS_MAPPING: Record<string, ReviewStatus> = {
  // 영문
  'ok': ReviewStatus.ok,
  'needs_review': ReviewStatus.needs_review,
  
  // 영문 대문자
  'OK': ReviewStatus.ok,
  'NEEDS_REVIEW': ReviewStatus.needs_review,
  
  // 한글
  '정상': ReviewStatus.ok,
  '완료': ReviewStatus.ok,
  '확인': ReviewStatus.ok,
  '검토필요': ReviewStatus.needs_review,
  '검토': ReviewStatus.needs_review,
  '수정필요': ReviewStatus.needs_review,
  
  // 숫자/기호
  '0': ReviewStatus.ok,
  '1': ReviewStatus.needs_review,
};

// ==============================================
// 안전한 변환 함수들 (ValidationResult 패턴)
// ==============================================

/**
 * 안전한 Element 변환 - 실패시 에러 정보 반환
 */
export function safeNormalizeToPrismaElement(value: string | null | undefined): ValidationResult<Element> {
  if (value === null || value === undefined) {
    return {
      success: false,
      error: 'Element value is null or undefined',
      originalValue: value
    };
  }

  const normalized = value.toString().trim();
  
  // 빈 문자열 체크
  if (!normalized) {
    return {
      success: false,
      error: 'Element value is empty string',
      originalValue: value
    };
  }

  // 매핑 테이블에서 찾기
  const element = ELEMENT_MAPPING[normalized];
  if (element) {
    return { 
      success: true, 
      value: element 
    };
  }

  // 매핑 실패
  const validValues = Object.keys(ELEMENT_MAPPING).join(', ');
  return {
    success: false,
    error: `Invalid element value: "${value}". Expected one of: ${validValues}`,
    originalValue: value
  };
}

/**
 * 안전한 YinYang 변환 - 실패시 에러 정보 반환
 */
export function safeNormalizeToPrismaYinYang(value: string | null | undefined): ValidationResult<YinYang> {
  if (value === null || value === undefined) {
    return {
      success: false,
      error: 'YinYang value is null or undefined',
      originalValue: value
    };
  }

  const normalized = value.toString().trim();
  
  // 빈 문자열 체크
  if (!normalized) {
    return {
      success: false,
      error: 'YinYang value is empty string',
      originalValue: value
    };
  }

  // 매핑 테이블에서 찾기
  const yinYang = YINYANG_MAPPING[normalized];
  if (yinYang) {
    return { 
      success: true, 
      value: yinYang 
    };
  }

  // 매핑 실패
  const validValues = Object.keys(YINYANG_MAPPING).join(', ');
  return {
    success: false,
    error: `Invalid yin_yang value: "${value}". Expected one of: ${validValues}`,
    originalValue: value
  };
}

/**
 * 안전한 ReviewStatus 변환 - 실패시 에러 정보 반환
 */
export function safeNormalizeToPrismaReviewStatus(value: string | null | undefined): ValidationResult<ReviewStatus> {
  if (!value) {
    // null/undefined인 경우 기본값 'ok' 반환
    return {
      success: true,
      value: ReviewStatus.ok
    };
  }

  const normalized = value.toString().trim();
  
  // 빈 문자열인 경우 기본값 'ok' 반환
  if (!normalized) {
    return {
      success: true,
      value: ReviewStatus.ok
    };
  }

  // 매핑 테이블에서 찾기
  const status = REVIEW_STATUS_MAPPING[normalized];
  if (status) {
    return { 
      success: true, 
      value: status 
    };
  }

  // 매핑 실패 - 기본값으로 fallback
  return {
    success: false,
    error: `Unknown review_status value: "${value}". Using default 'ok'`,
    originalValue: value,
    value: ReviewStatus.ok  // fallback value
  };
}

// ==============================================
// Strict 변환 함수들 (에러 throw)
// ==============================================

/**
 * Strict Element 변환 - 실패시 에러 throw
 */
export function normalizeToPrismaElement(value: string | null | undefined): Element {
  const result = safeNormalizeToPrismaElement(value);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.value!;
}

/**
 * Strict YinYang 변환 - 실패시 에러 throw
 */
export function normalizeToPrismaYinYang(value: string | null | undefined): YinYang {
  const result = safeNormalizeToPrismaYinYang(value);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.value!;
}

/**
 * Strict ReviewStatus 변환 - 실패시 에러 throw
 */
export function normalizeToPrismaReviewStatus(value: string | null | undefined): ReviewStatus {
  const result = safeNormalizeToPrismaReviewStatus(value);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.value!;
}

// ==============================================
// 역방향 변환 함수들 (Prisma enum → 문자열)
// ==============================================

/**
 * Prisma Element를 CJK 한자로 변환
 */
export function prismaElementToCJK(element: Element): string {
  switch (element) {
    case Element.METAL: return '金';
    case Element.WOOD: return '木';
    case Element.WATER: return '水';
    case Element.FIRE: return '火';
    case Element.EARTH: return '土';
    default:
      throw new Error(`Unknown Element enum value: ${element}`);
  }
}

/**
 * Prisma Element를 한글로 변환
 */
export function prismaElementToKorean(element: Element): string {
  switch (element) {
    case Element.METAL: return '금';
    case Element.WOOD: return '목';
    case Element.WATER: return '수';
    case Element.FIRE: return '화';
    case Element.EARTH: return '토';
    default:
      throw new Error(`Unknown Element enum value: ${element}`);
  }
}

/**
 * Prisma YinYang을 한글로 변환
 */
export function prismaYinYangToKorean(yinYang: YinYang): string {
  switch (yinYang) {
    case YinYang.YIN: return '음';
    case YinYang.YANG: return '양';
    default:
      throw new Error(`Unknown YinYang enum value: ${yinYang}`);
  }
}

/**
 * Prisma YinYang을 CJK 한자로 변환
 */
export function prismaYinYangToCJK(yinYang: YinYang): string {
  switch (yinYang) {
    case YinYang.YIN: return '陰';
    case YinYang.YANG: return '陽';
    default:
      throw new Error(`Unknown YinYang enum value: ${yinYang}`);
  }
}

// ==============================================
// 배치 처리 유틸리티
// ==============================================

/**
 * 배치 데이터의 Element 값들을 한번에 검증
 */
export function validatePrismaElements(
  data: Array<{ element?: any }>,
  options: { continueOnError?: boolean } = {}
): ValidationResult<Element[]> {
  const results: Element[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const elementResult = safeNormalizeToPrismaElement(item.element);
    
    if (elementResult.success) {
      results.push(elementResult.value!);
    } else {
      errors.push(`Row ${i + 1}: ${elementResult.error}`);
      if (!options.continueOnError) {
        return {
          success: false,
          error: errors.join('; '),
          originalValue: data
        };
      }
    }
  }

  if (errors.length > 0 && !options.continueOnError) {
    return {
      success: false,
      error: errors.join('; '),
      originalValue: data
    };
  }

  return {
    success: errors.length === 0,
    value: results,
    error: errors.length > 0 ? `${errors.length} validation errors: ${errors.join('; ')}` : undefined
  };
}

// ==============================================
// 유틸리티 함수들
// ==============================================

/**
 * 유효한 Element 값인지 확인
 */
export function isValidElementValue(value: any): boolean {
  const result = safeNormalizeToPrismaElement(value);
  return result.success;
}

/**
 * 유효한 YinYang 값인지 확인
 */
export function isValidYinYangValue(value: any): boolean {
  const result = safeNormalizeToPrismaYinYang(value);
  return result.success;
}

/**
 * 모든 지원되는 Element 입력값 목록 반환
 */
export function getSupportedElementValues(): string[] {
  return Object.keys(ELEMENT_MAPPING);
}

/**
 * 모든 지원되는 YinYang 입력값 목록 반환
 */
export function getSupportedYinYangValues(): string[] {
  return Object.keys(YINYANG_MAPPING);
}

/**
 * 모든 지원되는 ReviewStatus 입력값 목록 반환
 */
export function getSupportedReviewStatusValues(): string[] {
  return Object.keys(REVIEW_STATUS_MAPPING);
}

// ==============================================
// 타입 가드 함수들
// ==============================================

/**
 * Prisma Element 타입 가드
 */
export function isPrismaElement(value: any): value is Element {
  return Object.values(Element).includes(value);
}

/**
 * Prisma YinYang 타입 가드
 */
export function isPrismaYinYang(value: any): value is YinYang {
  return Object.values(YinYang).includes(value);
}

/**
 * Prisma ReviewStatus 타입 가드
 */
export function isPrismaReviewStatus(value: any): value is ReviewStatus {
  return Object.values(ReviewStatus).includes(value);
}