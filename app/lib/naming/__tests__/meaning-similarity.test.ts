/**
 * 한자 의미 유사도 알고리즘 테스트
 *
 * 테스트 케이스:
 * 1. 전처리 (Preprocessing)
 * 2. Jaccard 유사도 계산
 * 3. 패널티 매핑
 * 4. 설명 문자열 생성
 * 5. 통합 분석
 * 6. 배치 처리
 * 7. 다양성 점수 계산
 */

import {
  preprocessMeaning,
  calculateJaccardSimilarity,
  calculateSimilarityPenalty,
  describeSimilarity,
  analyzeMeaningSimilarity,
  analyzeMeaningSimilarityBatch,
  calculateMeaningDiversityScore,
} from '../meaning-similarity';

describe('한자 의미 유사도 알고리즘', () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. 전처리 테스트 (Preprocessing)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('preprocessMeaning', () => {
    it('단일 토큰을 정확히 처리해야 함', () => {
      const result = preprocessMeaning('깃들일');
      expect(result).toEqual(['깃들일']);
    });

    it('슬래시로 구분된 다중 토큰을 분할해야 함', () => {
      const result = preprocessMeaning('살피다/살펴보다');
      expect(result).toEqual(['살피다', '살펴보다']);
    });

    it('좌우 공백을 제거해야 함', () => {
      const result = preprocessMeaning('  깃들일  /  살펴보다  ');
      expect(result).toEqual(['깃들일', '살펴보다']);
    });

    it('빈 문자열을 필터링해야 함', () => {
      const result = preprocessMeaning('살피다//살펴보다');
      expect(result).toEqual(['살피다', '살펴보다']);
    });

    it('중복 토큰을 제거해야 함', () => {
      const result = preprocessMeaning('살피다/살펴보다/살피다');
      expect(result).toEqual(['살피다', '살펴보다']);
    });

    it('빈 문자열을 처리해야 함', () => {
      const result = preprocessMeaning('');
      expect(result).toEqual([]);
    });

    it('공백만 있는 입력을 처리해야 함', () => {
      const result = preprocessMeaning('   /   ');
      expect(result).toEqual([]);
    });

    it('3개 이상의 토큰을 분할해야 함', () => {
      const result = preprocessMeaning('밝다/환하다/맑다');
      expect(result).toEqual(['밝다', '환하다', '맑다']);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Jaccard 유사도 계산 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('calculateJaccardSimilarity', () => {
    it('완전히 다른 토큰은 0을 반환해야 함', () => {
      const similarity = calculateJaccardSimilarity('깃들일', '깃계할');
      expect(similarity).toBe(0);
    });

    it('동일한 문자열은 1을 반환해야 함', () => {
      const similarity = calculateJaccardSimilarity('깃들일', '깃들일');
      expect(similarity).toBe(1);
    });

    it('부분적으로 공통된 토큰을 정확히 계산해야 함', () => {
      // tokens1 = {살피다, 살펴보다}
      // tokens2 = {살피다, 관찰하다}
      // 교집합 = {살피다} → 1
      // 합집합 = {살피다, 살펴보다, 관찰하다} → 3
      // 유사도 = 1/3 ≈ 0.333
      const similarity = calculateJaccardSimilarity(
        '살피다/살펴보다',
        '살피다/관찰하다'
      );
      expect(similarity).toBeCloseTo(1 / 3);
    });

    it('완전히 공통된 두 의미는 1을 반환해야 함', () => {
      const similarity = calculateJaccardSimilarity(
        '밝다/환하다/맑다',
        '밝다/환하다/맑다'
      );
      expect(similarity).toBe(1);
    });

    it('순서와 관계없이 동일한 유사도를 반환해야 함 (교환성)', () => {
      const sim1 = calculateJaccardSimilarity(
        '살피다/관찰하다',
        '살피다/살펴보다'
      );
      const sim2 = calculateJaccardSimilarity(
        '살피다/살펴보다',
        '살피다/관찰하다'
      );
      expect(sim1).toBe(sim2);
    });

    it('빈 문자열을 처리해야 함', () => {
      // 둘 다 빈 문자열일 때 → 1 (동일)
      const similarity = calculateJaccardSimilarity('', '');
      expect(similarity).toBe(1);
    });

    it('하나가 빈 문자열일 때 0을 반환해야 함', () => {
      const similarity = calculateJaccardSimilarity('깃들일', '');
      expect(similarity).toBe(0);
    });

    it('특수 문자가 포함된 의미를 처리해야 함', () => {
      const similarity = calculateJaccardSimilarity(
        '짐지울/잰다',
        '계산하다/헤아리다'
      );
      // 공통 토큰 없음
      expect(similarity).toBe(0);
    });

    it('수학적 성질을 만족해야 함: 0 <= similarity <= 1', () => {
      const testCases = [
        ['깃들일', '깃계할'],
        ['살피다/관찰하다', '살피다/살펴보다'],
        ['밝다', '밝다'],
        ['', ''],
      ];

      testCases.forEach(([meaning1, meaning2]) => {
        const sim = calculateJaccardSimilarity(meaning1, meaning2);
        expect(sim).toBeGreaterThanOrEqual(0);
        expect(sim).toBeLessThanOrEqual(1);
      });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. 패널티 매핑 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('calculateSimilarityPenalty', () => {
    it('0.7 이상: -20점 (매우 유사)', () => {
      expect(calculateSimilarityPenalty(0.7)).toBe(-20);
      expect(calculateSimilarityPenalty(0.9)).toBe(-20);
      expect(calculateSimilarityPenalty(1.0)).toBe(-20);
    });

    it('0.4 ~ 0.7: -10점 (부분 유사)', () => {
      expect(calculateSimilarityPenalty(0.4)).toBe(-10);
      expect(calculateSimilarityPenalty(0.5)).toBe(-10);
      expect(calculateSimilarityPenalty(0.69)).toBe(-10);
    });

    it('0.4 미만: 0점 (다양함)', () => {
      expect(calculateSimilarityPenalty(0.0)).toBe(0);
      expect(calculateSimilarityPenalty(0.3)).toBe(0);
      expect(calculateSimilarityPenalty(0.39)).toBe(0);
    });

    it('경계값을 정확히 처리해야 함', () => {
      // 0.7 경계
      expect(calculateSimilarityPenalty(0.6999)).toBe(-10);
      expect(calculateSimilarityPenalty(0.7)).toBe(-20);

      // 0.4 경계
      expect(calculateSimilarityPenalty(0.3999)).toBe(0);
      expect(calculateSimilarityPenalty(0.4)).toBe(-10);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. 설명 문자열 생성 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('describeSimilarity', () => {
    it('0.7 이상: "매우 유사"', () => {
      expect(describeSimilarity(0.7)).toBe('매우 유사');
      expect(describeSimilarity(0.9)).toBe('매우 유사');
    });

    it('0.4 ~ 0.7: "부분 유사"', () => {
      expect(describeSimilarity(0.4)).toBe('부분 유사');
      expect(describeSimilarity(0.5)).toBe('부분 유사');
    });

    it('0.4 미만: "다양함"', () => {
      expect(describeSimilarity(0.0)).toBe('다양함');
      expect(describeSimilarity(0.3)).toBe('다양함');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. 통합 분석 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('analyzeMeaningSimilarity', () => {
    it('예시: 깃들일 vs 깃계할 (0% 유사, -0점)', () => {
      const result = analyzeMeaningSimilarity('깃들일', '깃계할');

      expect(result.similarity).toBe(0);
      expect(result.penalty).toBe(0);
      expect(result.explanation).toBe('다양함');
      expect(result.tokens1).toEqual(['깃들일']);
      expect(result.tokens2).toEqual(['깃계할']);
    });

    it('부분 유사: 살피다/관찰하다 vs 살피다/살펴보다', () => {
      const result = analyzeMeaningSimilarity(
        '살피다/관찰하다',
        '살피다/살펴보다'
      );

      expect(result.similarity).toBeCloseTo(1 / 3);
      // 유사도 0.333은 0.4 미만이므로 패널티 0 (다양함)
      expect(result.penalty).toBe(0);
      expect(result.explanation).toBe('다양함');
      expect(result.tokens1.length).toBe(2);
      expect(result.tokens2.length).toBe(2);
    });

    it('완전 유사: 동일한 의미', () => {
      const result = analyzeMeaningSimilarity('밝다', '밝다');

      expect(result.similarity).toBe(1);
      expect(result.penalty).toBe(-20); // 매우 유사
      expect(result.explanation).toBe('매우 유사');
    });

    it('입력 부족: null/undefined 처리', () => {
      const result1 = analyzeMeaningSimilarity('깃들일', undefined);
      expect(result1.similarity).toBe(0);
      expect(result1.penalty).toBe(0);
      expect(result1.explanation).toBe('입력 부족');

      const result2 = analyzeMeaningSimilarity(undefined, '깃계할');
      expect(result2.similarity).toBe(0);
      expect(result2.penalty).toBe(0);
      expect(result2.explanation).toBe('입력 부족');
    });

    it('결과 객체 구조를 확인해야 함', () => {
      const result = analyzeMeaningSimilarity('깃들일', '깃계할');

      expect(result).toHaveProperty('similarity');
      expect(result).toHaveProperty('penalty');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('tokens1');
      expect(result).toHaveProperty('tokens2');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. 배치 처리 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('analyzeMeaningSimilarityBatch', () => {
    it('여러 의미 쌍을 동시에 분석해야 함', () => {
      const pairs: Array<[string, string]> = [
        ['깃들일', '깃계할'],
        ['살피다', '살피다'],
        ['밝다/환하다', '밝다/밝다'],
      ];

      const results = analyzeMeaningSimilarityBatch(pairs);

      expect(results).toHaveLength(3);
      expect(results[0].similarity).toBe(0);
      expect(results[1].similarity).toBe(1);
      expect(results[2].similarity).toBeGreaterThan(0);
    });

    it('빈 배열을 처리해야 함', () => {
      const results = analyzeMeaningSimilarityBatch([]);
      expect(results).toEqual([]);
    });

    it('대량 처리: 1000개 쌍을 처리할 수 있어야 함', () => {
      const pairs: Array<[string, string]> = Array(1000)
        .fill(null)
        .map((_, i) => [`의미${i}`, `의미${(i + 1) % 1000}`]);

      const results = analyzeMeaningSimilarityBatch(pairs);
      expect(results).toHaveLength(1000);
      expect(results.every(r => r.similarity >= 0 && r.similarity <= 1)).toBe(true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. 다양성 점수 계산 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('calculateMeaningDiversityScore', () => {
    it('유사도 0 → 다양성 점수 100', () => {
      const score = calculateMeaningDiversityScore('깃들일', '깃계할');
      expect(score).toBe(100);
    });

    it('유사도 1 → 다양성 점수 0', () => {
      const score = calculateMeaningDiversityScore('깃들일', '깃들일');
      expect(score).toBe(0);
    });

    it('유사도 0.5 → 다양성 점수 50', () => {
      const score = calculateMeaningDiversityScore(
        '살피다/관찰하다',
        '살피다/살펴보다'
      );
      // 유사도 = 1/3 ≈ 0.333
      // 다양성 = (1 - 0.333) * 100 ≈ 66.7 → 반올림 67
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThan(100);
    });

    it('입력 부족: null/undefined 처리', () => {
      const score1 = calculateMeaningDiversityScore('깃들일', undefined);
      expect(score1).toBe(50); // 중립적 점수

      const score2 = calculateMeaningDiversityScore(undefined, '깃계할');
      expect(score2).toBe(50); // 중립적 점수
    });

    it('점수 범위 검증: 0 ~ 100', () => {
      const testCases = [
        ['깃들일', '깃계할'],
        ['살피다', '살피다'],
        ['밝다/환하다', '어두운/칙칙한'],
      ];

      testCases.forEach(([meaning1, meaning2]) => {
        const score = calculateMeaningDiversityScore(meaning1, meaning2);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('작명 시나리오: 이름의 두 글자 다양성 평가', () => {
      // 시나리오: 이름 "명희" (명+희)
      // - 명: 의미 = "밝다/빛나다"
      // - 희: 의미 = "드물다/보기 드물다"
      // → 유사도가 낮으므로 다양성 점수 높음

      const score = calculateMeaningDiversityScore('밝다/빛나다', '드물다/보기드물다');
      expect(score).toBeGreaterThan(70); // 대부분 다양함
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. 엣지 케이스 및 성능 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('엣지 케이스 및 특수 상황', () => {
    it('매우 긴 의미 문자열을 처리해야 함', () => {
      const longMeaning = '밝다/환하다/맑다/투명하다/명확하다/어스름없다/서광이다/천명함이다';
      const result = analyzeMeaningSimilarity(longMeaning, '어둡다');

      expect(result.similarity).toBe(0); // 공통 토큰 없음
      expect(result.penalty).toBe(0);
    });

    it('유니코드 문자 (한글 + 한자)를 정확히 처리해야 함', () => {
      const result = analyzeMeaningSimilarity(
        '깃들일(棲)',
        '깃계할(栖)'
      );

      expect(result.similarity).toBe(0);
      expect(result.tokens1.length).toBe(1);
      expect(result.tokens2.length).toBe(1);
    });

    it('공백과 슬래시의 다양한 조합을 처리해야 함', () => {
      const result1 = analyzeMeaningSimilarity(
        '  깃들일  /  살펴보다  ',
        '깃들일/살펴보다'
      );

      // 정규화 후 동일해야 함
      expect(result1.similarity).toBe(1);
    });

    it('특수 문자만 있는 입력을 안전하게 처리해야 함', () => {
      const result = analyzeMeaningSimilarity('/', '');
      // '/'는 분할 후 빈 문자열만 남음 → []
      // ''도 → []
      // 둘 다 빈 배열 → unionSize = 0 → similarity = 1.0
      expect(result.similarity).toBe(1);
    });
  });
});
