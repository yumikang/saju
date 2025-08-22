// hanja-normalize.ts 테스트 스위트
// Prisma enum 변환 및 검증 함수들의 단위 테스트

import { Element, YinYang, ReviewStatus } from '@prisma/client';
import {
  safeNormalizeToPrismaElement,
  safeNormalizeToPrismaYinYang,
  safeNormalizeToPrismaReviewStatus,
  normalizeToPrismaElement,
  normalizeToPrismaYinYang,
  normalizeToPrismaReviewStatus,
  prismaElementToCJK,
  prismaElementToKorean,
  prismaYinYangToKorean,
  prismaYinYangToCJK,
  isValidElementValue,
  isValidYinYangValue,
  getSupportedElementValues,
  getSupportedYinYangValues,
  isPrismaElement,
  isPrismaYinYang,
  isPrismaReviewStatus
} from '../app/lib/hanja-normalize';

describe('hanja-normalize 유틸리티 테스트', () => {
  
  // ==============================================
  // Element 변환 테스트
  // ==============================================
  
  describe('safeNormalizeToPrismaElement', () => {
    test('CJK 한자 입력이 올바르게 변환된다', () => {
      expect(safeNormalizeToPrismaElement('金')).toEqual({
        success: true,
        value: Element.METAL
      });
      expect(safeNormalizeToPrismaElement('木')).toEqual({
        success: true,
        value: Element.WOOD
      });
      expect(safeNormalizeToPrismaElement('水')).toEqual({
        success: true,
        value: Element.WATER
      });
      expect(safeNormalizeToPrismaElement('火')).toEqual({
        success: true,
        value: Element.FIRE
      });
      expect(safeNormalizeToPrismaElement('土')).toEqual({
        success: true,
        value: Element.EARTH
      });
    });

    test('한글 입력이 올바르게 변환된다', () => {
      expect(safeNormalizeToPrismaElement('금')).toEqual({
        success: true,
        value: Element.METAL
      });
      expect(safeNormalizeToPrismaElement('목')).toEqual({
        success: true,
        value: Element.WOOD
      });
      expect(safeNormalizeToPrismaElement('물')).toEqual({
        success: true,
        value: Element.WATER
      });
      expect(safeNormalizeToPrismaElement('불')).toEqual({
        success: true,
        value: Element.FIRE
      });
      expect(safeNormalizeToPrismaElement('흙')).toEqual({
        success: true,
        value: Element.EARTH
      });
    });

    test('영문 입력이 올바르게 변환된다', () => {
      expect(safeNormalizeToPrismaElement('metal')).toEqual({
        success: true,
        value: Element.METAL
      });
      expect(safeNormalizeToPrismaElement('WOOD')).toEqual({
        success: true,
        value: Element.WOOD
      });
    });

    test('null/undefined 입력시 에러를 반환한다', () => {
      const result = safeNormalizeToPrismaElement(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    test('잘못된 입력시 에러를 반환한다', () => {
      const result = safeNormalizeToPrismaElement('잘못된값');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid element value');
    });
  });

  describe('normalizeToPrismaElement (strict)', () => {
    test('유효한 입력시 Element를 반환한다', () => {
      expect(normalizeToPrismaElement('金')).toBe(Element.METAL);
    });

    test('잘못된 입력시 에러를 throw한다', () => {
      expect(() => normalizeToPrismaElement('잘못된값')).toThrow();
    });
  });

  // ==============================================
  // YinYang 변환 테스트
  // ==============================================

  describe('safeNormalizeToPrismaYinYang', () => {
    test('한글 입력이 올바르게 변환된다', () => {
      expect(safeNormalizeToPrismaYinYang('음')).toEqual({
        success: true,
        value: YinYang.YIN
      });
      expect(safeNormalizeToPrismaYinYang('양')).toEqual({
        success: true,
        value: YinYang.YANG
      });
    });

    test('CJK 한자 입력이 올바르게 변환된다', () => {
      expect(safeNormalizeToPrismaYinYang('陰')).toEqual({
        success: true,
        value: YinYang.YIN
      });
      expect(safeNormalizeToPrismaYinYang('陽')).toEqual({
        success: true,
        value: YinYang.YANG
      });
    });

    test('영문 입력이 올바르게 변환된다', () => {
      expect(safeNormalizeToPrismaYinYang('yin')).toEqual({
        success: true,
        value: YinYang.YIN
      });
      expect(safeNormalizeToPrismaYinYang('YANG')).toEqual({
        success: true,
        value: YinYang.YANG
      });
    });
  });

  // ==============================================
  // ReviewStatus 변환 테스트
  // ==============================================

  describe('safeNormalizeToPrismaReviewStatus', () => {
    test('null/undefined 입력시 기본값 ok를 반환한다', () => {
      expect(safeNormalizeToPrismaReviewStatus(null)).toEqual({
        success: true,
        value: ReviewStatus.ok
      });
    });

    test('한글 입력이 올바르게 변환된다', () => {
      expect(safeNormalizeToPrismaReviewStatus('정상')).toEqual({
        success: true,
        value: ReviewStatus.ok
      });
      expect(safeNormalizeToPrismaReviewStatus('검토필요')).toEqual({
        success: true,
        value: ReviewStatus.needs_review
      });
    });

    test('잘못된 입력시 기본값으로 fallback한다', () => {
      const result = safeNormalizeToPrismaReviewStatus('알수없음');
      expect(result.success).toBe(false);
      expect(result.value).toBe(ReviewStatus.ok);
    });
  });

  // ==============================================
  // 역방향 변환 테스트
  // ==============================================

  describe('역방향 변환 함수들', () => {
    test('prismaElementToCJK가 올바르게 변환한다', () => {
      expect(prismaElementToCJK(Element.METAL)).toBe('金');
      expect(prismaElementToCJK(Element.WOOD)).toBe('木');
      expect(prismaElementToCJK(Element.WATER)).toBe('水');
      expect(prismaElementToCJK(Element.FIRE)).toBe('火');
      expect(prismaElementToCJK(Element.EARTH)).toBe('土');
    });

    test('prismaElementToKorean이 올바르게 변환한다', () => {
      expect(prismaElementToKorean(Element.METAL)).toBe('금');
      expect(prismaElementToKorean(Element.WOOD)).toBe('목');
    });

    test('prismaYinYangToKorean이 올바르게 변환한다', () => {
      expect(prismaYinYangToKorean(YinYang.YIN)).toBe('음');
      expect(prismaYinYangToKorean(YinYang.YANG)).toBe('양');
    });

    test('prismaYinYangToCJK가 올바르게 변환한다', () => {
      expect(prismaYinYangToCJK(YinYang.YIN)).toBe('陰');
      expect(prismaYinYangToCJK(YinYang.YANG)).toBe('陽');
    });
  });

  // ==============================================
  // 유틸리티 함수 테스트
  // ==============================================

  describe('유틸리티 함수들', () => {
    test('isValidElementValue가 올바르게 검증한다', () => {
      expect(isValidElementValue('金')).toBe(true);
      expect(isValidElementValue('잘못된값')).toBe(false);
    });

    test('isValidYinYangValue가 올바르게 검증한다', () => {
      expect(isValidYinYangValue('음')).toBe(true);
      expect(isValidYinYangValue('잘못된값')).toBe(false);
    });

    test('getSupportedElementValues가 모든 지원값을 반환한다', () => {
      const supported = getSupportedElementValues();
      expect(supported).toContain('金');
      expect(supported).toContain('금');
      expect(supported).toContain('metal');
    });

    test('getSupportedYinYangValues가 모든 지원값을 반환한다', () => {
      const supported = getSupportedYinYangValues();
      expect(supported).toContain('음');
      expect(supported).toContain('陰');
      expect(supported).toContain('yin');
    });
  });

  // ==============================================
  // 타입 가드 테스트
  // ==============================================

  describe('타입 가드 함수들', () => {
    test('isPrismaElement가 올바르게 동작한다', () => {
      expect(isPrismaElement(Element.METAL)).toBe(true);
      expect(isPrismaElement('잘못된값')).toBe(false);
    });

    test('isPrismaYinYang이 올바르게 동작한다', () => {
      expect(isPrismaYinYang(YinYang.YIN)).toBe(true);
      expect(isPrismaYinYang('잘못된값')).toBe(false);
    });

    test('isPrismaReviewStatus가 올바르게 동작한다', () => {
      expect(isPrismaReviewStatus(ReviewStatus.ok)).toBe(true);
      expect(isPrismaReviewStatus('잘못된값')).toBe(false);
    });
  });

  // ==============================================
  // 엣지 케이스 테스트
  // ==============================================

  describe('엣지 케이스 처리', () => {
    test('공백이 포함된 입력을 올바르게 처리한다', () => {
      expect(safeNormalizeToPrismaElement(' 金 ')).toEqual({
        success: true,
        value: Element.METAL
      });
    });

    test('빈 문자열 입력을 올바르게 처리한다', () => {
      const result = safeNormalizeToPrismaElement('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Element value is empty string');
    });

    test('대소문자 구분 없이 처리한다', () => {
      expect(safeNormalizeToPrismaElement('METAL')).toEqual({
        success: true,
        value: Element.METAL
      });
      expect(safeNormalizeToPrismaYinYang('YIN')).toEqual({
        success: true,
        value: YinYang.YIN
      });
    });
  });
});