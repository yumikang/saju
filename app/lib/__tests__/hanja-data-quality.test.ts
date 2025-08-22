import { expect, test, describe } from 'vitest';
import { getAllExpandedHanja } from '../hanja-expanded-data';
import { getAllHanja } from '../hanja-data';
import type { YinYang, Element } from '../hanja-enhanced';

describe('한자 데이터 품질 회귀 방지 테스트', () => {
  test('확장 데이터의 yin_yang은 한글로 통일되어야 함', () => {
    const expandedHanja = getAllExpandedHanja();
    
    for (const hanja of expandedHanja) {
      expect(['음', '양']).toContain(hanja.yin_yang);
      // 한자 표기가 섞여있지 않아야 함
      expect(hanja.yin_yang).not.toBe('陰');
      expect(hanja.yin_yang).not.toBe('陽');
    }
  });

  test('확장 데이터의 primary_element는 CJK 한자로 통일되어야 함', () => {
    const expandedHanja = getAllExpandedHanja();
    const validElements: Element[] = ['水', '木', '火', '土', '金'];
    
    for (const hanja of expandedHanja) {
      expect(validElements).toContain(hanja.primary_element);
      // 한글 표기가 섞여있지 않아야 함
      expect(['수', '목', '화', '토', '금']).not.toContain(hanja.primary_element);
    }
  });

  test('기본 데이터의 element는 한글로 통일되어야 함', () => {
    const baseHanja = getAllHanja();
    const validElements = ['수', '목', '화', '토', '금'];
    
    for (const hanja of baseHanja) {
      if (hanja.element) {
        expect(validElements).toContain(hanja.element);
        // CJK 한자 표기가 섞여있지 않아야 함
        expect(['水', '木', '火', '土', '金']).not.toContain(hanja.element);
      }
    }
  });

  test('확장 데이터의 secondary_element가 있다면 CJK 한자여야 함', () => {
    const expandedHanja = getAllExpandedHanja();
    const validElements: Element[] = ['水', '木', '火', '土', '金'];
    
    for (const hanja of expandedHanja) {
      if (hanja.secondary_element) {
        expect(validElements).toContain(hanja.secondary_element);
        // 한글 표기가 섞여있지 않아야 함
        expect(['수', '목', '화', '토', '금']).not.toContain(hanja.secondary_element);
      }
    }
  });

  test('중복 문자가 없어야 함 (확장 데이터)', () => {
    const expandedHanja = getAllExpandedHanja();
    const characters = expandedHanja.map(h => h.char);
    const uniqueCharacters = [...new Set(characters)];
    
    expect(characters.length).toBe(uniqueCharacters.length);
  });

  test('ID가 고유해야 함 (확장 데이터)', () => {
    const expandedHanja = getAllExpandedHanja();
    const ids = expandedHanja.map(h => h.id);
    const uniqueIds = [...new Set(ids)];
    
    expect(ids.length).toBe(uniqueIds.length);
  });

  test('모든 필수 필드가 존재해야 함 (확장 데이터)', () => {
    const expandedHanja = getAllExpandedHanja();
    
    for (const hanja of expandedHanja) {
      expect(hanja.id).toBeDefined();
      expect(hanja.char).toBeDefined();
      expect(hanja.meaning).toBeDefined();
      expect(hanja.reading).toBeDefined();
      expect(hanja.strokes).toBeGreaterThan(0);
      expect(hanja.primary_element).toBeDefined();
      expect(hanja.yin_yang).toBeDefined();
      expect(hanja.fortune).toBeDefined();
      expect(Array.isArray(hanja.naming_tags)).toBe(true);
      expect(hanja.gender_preference).toBeDefined();
      expect(hanja.popularity_score).toBeGreaterThanOrEqual(0);
      expect(hanja.popularity_score).toBeLessThanOrEqual(100);
      expect(hanja.category).toBeDefined();
      expect(typeof hanja.is_common).toBe('boolean');
      expect(hanja.unicode).toBeDefined();
    }
  });

  test('데이터 스냅샷 - 예상 개수 유지', () => {
    const expandedHanja = getAllExpandedHanja();
    const baseHanja = getAllHanja();
    
    // 현재 데이터 개수를 기록 (변경 시 의도적인지 확인 가능)
    expect(expandedHanja.length).toBe(39); // 확장 데이터
    expect(baseHanja.length).toBe(184);    // 기본 데이터 (중복 키로 인한 실제 개수)
  });
});