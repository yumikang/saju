import { expect, test, describe } from 'vitest';
import { 
  safeNormalizeYinYang, 
  safeNormalizeElement, 
  normalizeYinYang, 
  normalizeElement,
  validateHanjaData,
  printValidationReport 
} from '../hanja-enhanced';

describe('한자 데이터 변환 및 검증 테스트', () => {
  describe('safeNormalizeYinYang', () => {
    test('정상적인 음양 값 변환', () => {
      expect(safeNormalizeYinYang('陰')).toEqual({ success: true, value: '음' });
      expect(safeNormalizeYinYang('陽')).toEqual({ success: true, value: '양' });
      expect(safeNormalizeYinYang('음')).toEqual({ success: true, value: '음' });
      expect(safeNormalizeYinYang('양')).toEqual({ success: true, value: '양' });
      expect(safeNormalizeYinYang('yin')).toEqual({ success: true, value: '음' });
      expect(safeNormalizeYinYang('yang')).toEqual({ success: true, value: '양' });
      expect(safeNormalizeYinYang('阴')).toEqual({ success: true, value: '음' }); // 간체자
      expect(safeNormalizeYinYang('阳')).toEqual({ success: true, value: '양' }); // 간체자
    });

    test('잘못된 음양 값 처리', () => {
      const result = safeNormalizeYinYang('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid yin_yang value');
      expect(result.originalValue).toBe('invalid');
    });

    test('null/undefined 처리', () => {
      expect(safeNormalizeYinYang(null).success).toBe(false);
      expect(safeNormalizeYinYang(undefined).success).toBe(false);
    });
  });

  describe('safeNormalizeElement', () => {
    test('CJK 한자 오행 변환', () => {
      expect(safeNormalizeElement('水')).toEqual({ success: true, value: '水' });
      expect(safeNormalizeElement('木')).toEqual({ success: true, value: '木' });
      expect(safeNormalizeElement('火')).toEqual({ success: true, value: '火' });
      expect(safeNormalizeElement('土')).toEqual({ success: true, value: '土' });
      expect(safeNormalizeElement('金')).toEqual({ success: true, value: '金' });
    });

    test('한글 오행 변환', () => {
      expect(safeNormalizeElement('수')).toEqual({ success: true, value: '水' });
      expect(safeNormalizeElement('목')).toEqual({ success: true, value: '木' });
      expect(safeNormalizeElement('화')).toEqual({ success: true, value: '火' });
      expect(safeNormalizeElement('토')).toEqual({ success: true, value: '土' });
      expect(safeNormalizeElement('금')).toEqual({ success: true, value: '金' });
    });

    test('한글 별칭 변환', () => {
      expect(safeNormalizeElement('물')).toEqual({ success: true, value: '水' });
      expect(safeNormalizeElement('나무')).toEqual({ success: true, value: '木' });
      expect(safeNormalizeElement('불')).toEqual({ success: true, value: '火' });
      expect(safeNormalizeElement('흙')).toEqual({ success: true, value: '土' });
      expect(safeNormalizeElement('쇠')).toEqual({ success: true, value: '金' });
    });

    test('영문 오행 변환', () => {
      expect(safeNormalizeElement('water')).toEqual({ success: true, value: '水' });
      expect(safeNormalizeElement('wood')).toEqual({ success: true, value: '木' });
      expect(safeNormalizeElement('fire')).toEqual({ success: true, value: '火' });
      expect(safeNormalizeElement('earth')).toEqual({ success: true, value: '土' });
      expect(safeNormalizeElement('metal')).toEqual({ success: true, value: '金' });
    });

    test('공백 처리', () => {
      expect(safeNormalizeElement(' 수 ')).toEqual({ success: true, value: '水' });
      expect(safeNormalizeElement('  水  ')).toEqual({ success: true, value: '水' });
    });

    test('잘못된 오행 값 처리', () => {
      const result = safeNormalizeElement('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid element value');
      expect(result.originalValue).toBe('invalid');
    });
  });

  describe('strict 모드 테스트', () => {
    test('normalizeYinYang는 에러 시 throw', () => {
      expect(() => normalizeYinYang('invalid')).toThrow();
      expect(normalizeYinYang('음')).toBe('음');
    });

    test('normalizeElement는 에러 시 throw', () => {
      expect(() => normalizeElement('invalid')).toThrow();
      expect(normalizeElement('수')).toBe('水');
    });
  });

  describe('배치 검증 테스트', () => {
    test('정상 데이터 검증', () => {
      const testData = [
        { id: 'test1', char: '金', yin_yang: '음', primary_element: '金' },
        { id: 'test2', char: '木', yin_yang: '양', primary_element: '목' }
      ];

      const report = validateHanjaData(testData, { reportMode: true });
      expect(report.totalProcessed).toBe(2);
      expect(report.successCount).toBe(2);
      expect(report.errorCount).toBe(0);
      expect(report.errors).toHaveLength(0);
    });

    test('오류 데이터 리포트 모드', () => {
      const testData = [
        { id: 'test1', char: '金', yin_yang: 'invalid', primary_element: '金' },
        { id: 'test2', char: '木', yin_yang: '양', primary_element: 'invalid' }
      ];

      const report = validateHanjaData(testData, { reportMode: true });
      expect(report.totalProcessed).toBe(2);
      expect(report.successCount).toBe(0);
      expect(report.errorCount).toBe(2);
      expect(report.errors).toHaveLength(2);
      
      expect(report.errors[0].field).toBe('yin_yang');
      expect(report.errors[0].recordId).toBe('test1');
      expect(report.errors[1].field).toBe('primary_element');
      expect(report.errors[1].recordId).toBe('test2');
    });

    test('continueOnError 모드', () => {
      const testData = [
        { id: 'test1', char: '金', yin_yang: 'invalid' },
        { id: 'test2', char: '木', yin_yang: '양' }
      ];

      const report = validateHanjaData(testData, { continueOnError: true });
      expect(report.totalProcessed).toBe(2);
      expect(report.errorCount).toBe(1);
      expect(report.successCount).toBe(1);
    });

    test('첫 에러에서 중단 (기본 모드)', () => {
      const testData = [
        { id: 'test1', char: '金', yin_yang: 'invalid' },
        { id: 'test2', char: '木', yin_yang: '양' }
      ];

      const report = validateHanjaData(testData);
      expect(report.totalProcessed).toBe(1); // 첫 번째에서 중단
      expect(report.errorCount).toBe(1);
      expect(report.successCount).toBe(0);
    });
  });

  test('printValidationReport 실행 테스트', () => {
    const mockReport = {
      totalProcessed: 2,
      successCount: 1,
      errorCount: 1,
      errors: [{
        field: 'yin_yang',
        originalValue: 'invalid',
        error: 'Invalid yin_yang value',
        recordId: 'test1'
      }]
    };

    // 콘솔 출력 테스트 (실제로는 출력되지만 에러 없이 실행되는지 확인)
    expect(() => printValidationReport(mockReport)).not.toThrow();
  });
});