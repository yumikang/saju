import { describe, it, expect, beforeEach } from 'vitest';
import type { ScoredCandidate } from '~/lib/naming/types';
import type { Element, YinYang } from '@prisma/client';
import {
  classifyCandidates,
  calculatePsychologicalMetrics,
  getRankLabel,
  hasPremiumAccess,
  getConversionMessages,
  getValueProposition,
  type FreemiumTiers,
  type PsychologicalMetrics,
} from '../classification';

// ============================================================
// Mock Data Helpers
// ============================================================

/**
 * Create a mock ScoredCandidate with specified score and rank
 */
function createMockCandidate(
  score: number,
  rank: number,
  overrides?: Partial<ScoredCandidate>
): ScoredCandidate {
  return {
    id: `candidate-${rank}`,
    firstName: [`이름${rank}`, `名${rank}`],
    characters: [
      {
        id: `char-${rank * 10}`,
        character: `字${rank}`,
        strokes: 10,
        element: 'WOOD' as Element,
        yinYang: 'YANG' as YinYang,
        meaning: `의미${rank}`,
        koreanReading: `읽기${rank}`,
      },
      {
        id: `char-${rank * 10 + 1}`,
        character: `字${rank + 1}`,
        strokes: 12,
        element: 'FIRE' as Element,
        yinYang: 'YIN' as YinYang,
        meaning: `의미${rank + 1}`,
        koreanReading: `읽기${rank + 1}`,
      },
    ],
    totalStrokes: 22,
    scores: {
      overall: score,
      elementHarmony: {
        score: score * 0.4,
        weight: 0.4,
        weightedScore: score * 0.4 * 0.4,
        explanation: '오행 조화',
      },
      yinYangBalance: {
        score: score * 0.2,
        weight: 0.2,
        weightedScore: score * 0.2 * 0.2,
        explanation: '음양 균형',
      },
      numerology: {
        score: score * 0.2,
        weight: 0.2,
        weightedScore: score * 0.2 * 0.2,
        explanation: '수리',
      },
      meaningHarmony: {
        score: score * 0.2,
        weight: 0.2,
        weightedScore: score * 0.2 * 0.2,
        explanation: '의미 조화',
      },
    },
    confidenceScore: 0.85,
    ...overrides,
  };
}

/**
 * Create a list of mock candidates
 */
function createMockCandidateList(count: number): ScoredCandidate[] {
  const candidates: ScoredCandidate[] = [];
  const baseScore = 100;

  for (let i = 0; i < count; i++) {
    // 점수는 순위에 따라 감소 (1등 100점, 2등 98점, 3등 96점...)
    const score = baseScore - (i * 2);
    candidates.push(createMockCandidate(score, i + 1));
  }

  return candidates;
}

// ============================================================
// Tests: classifyCandidates()
// ============================================================

describe('classifyCandidates', () => {
  describe('정상 케이스 (Happy Path)', () => {
    it('10개의 후보를 올바르게 분류해야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.blurred).toHaveLength(4);
      expect(result.free).toHaveLength(1);
      expect(result.locked).toHaveLength(5);
    });

    it('1-4위는 blurred 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.blurred[0].scores.overall).toBe(100);
      expect(result.blurred[1].scores.overall).toBe(98);
      expect(result.blurred[2].scores.overall).toBe(96);
      expect(result.blurred[3].scores.overall).toBe(94);
    });

    it('5위는 free 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.free).toHaveLength(1);
      expect(result.free[0].scores.overall).toBe(92);
    });

    it('6위 이상은 locked 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(5);
      expect(result.locked[0].scores.overall).toBe(90);
      expect(result.locked[4].scores.overall).toBe(82);
    });
  });

  describe('경계값 테스트 (Edge Cases)', () => {
    it('정확히 5개의 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(5);
      const result = classifyCandidates(candidates);

      expect(result.blurred).toHaveLength(4);
      expect(result.free).toHaveLength(1);
      expect(result.locked).toHaveLength(0);
    });

    it('4개 미만의 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(3);
      const result = classifyCandidates(candidates);

      expect(result.blurred).toHaveLength(3);
      expect(result.free).toHaveLength(0);
      expect(result.locked).toHaveLength(0);
    });

    it('빈 배열을 처리해야 함', () => {
      const candidates: ScoredCandidate[] = [];
      const result = classifyCandidates(candidates);

      expect(result.blurred).toHaveLength(0);
      expect(result.free).toHaveLength(0);
      expect(result.locked).toHaveLength(0);
    });

    it('100개 이상의 대량 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(150);
      const result = classifyCandidates(candidates);

      expect(result.blurred).toHaveLength(4);
      expect(result.free).toHaveLength(1);
      expect(result.locked).toHaveLength(145);
    });
  });

  describe('정렬 테스트', () => {
    it('정렬되지 않은 후보를 자동으로 정렬해야 함', () => {
      const candidates = [
        createMockCandidate(80, 5),
        createMockCandidate(100, 1),
        createMockCandidate(90, 3),
        createMockCandidate(95, 2),
        createMockCandidate(85, 4),
      ];

      const result = classifyCandidates(candidates);

      // 점수 내림차순으로 정렬되어야 함
      expect(result.blurred[0].scores.overall).toBe(100);
      expect(result.blurred[1].scores.overall).toBe(95);
      expect(result.blurred[2].scores.overall).toBe(90);
      expect(result.blurred[3].scores.overall).toBe(85);
      expect(result.free[0].scores.overall).toBe(80);
    });

    it('동점자가 있어도 처리해야 함', () => {
      const candidates = [
        createMockCandidate(90, 1),
        createMockCandidate(90, 2),
        createMockCandidate(90, 3),
        createMockCandidate(90, 4),
        createMockCandidate(90, 5),
      ];

      const result = classifyCandidates(candidates);

      expect(result.blurred).toHaveLength(4);
      expect(result.free).toHaveLength(1);
    });
  });

  describe('불변성 테스트', () => {
    it('원본 배열을 변경하지 않아야 함', () => {
      const candidates = createMockCandidateList(10);
      const originalFirst = candidates[0];

      classifyCandidates(candidates);

      expect(candidates[0]).toBe(originalFirst);
      expect(candidates).toHaveLength(10);
    });
  });
});

// ============================================================
// Tests: calculatePsychologicalMetrics()
// ============================================================

describe('calculatePsychologicalMetrics', () => {
  let mockTiers: FreemiumTiers;

  beforeEach(() => {
    const candidates = createMockCandidateList(10);
    mockTiers = classifyCandidates(candidates);
  });

  describe('정상 케이스', () => {
    it('올바른 메트릭을 계산해야 함', () => {
      const metrics = calculatePsychologicalMetrics(mockTiers);

      expect(metrics.topScore).toBe(100);
      expect(metrics.freeScore).toBe(92);
      expect(metrics.scoreDifference).toBe(8);
      expect(metrics.lockedCount).toBe(5);
      expect(metrics.totalCount).toBe(10);
    });

    it('퍼센트 차이를 올바르게 계산해야 함', () => {
      const metrics = calculatePsychologicalMetrics(mockTiers);

      // (100 - 92) / 92 * 100 = 8.69... ≈ 9
      expect(metrics.percentageDiff).toBe(9);
    });

    it('점수 차이가 20점 이상일 때 올바른 메시지를 생성해야 함', () => {
      const tiers: FreemiumTiers = {
        blurred: [createMockCandidate(100, 1)],
        free: [createMockCandidate(70, 5)],
        locked: [],
      };

      const metrics = calculatePsychologicalMetrics(tiers);

      expect(metrics.scoreDifference).toBe(30);
      expect(metrics.conversionMessage).toContain('무려 30점이나 더 높습니다');
    });

    it('점수 차이가 10-19점일 때 올바른 메시지를 생성해야 함', () => {
      const tiers: FreemiumTiers = {
        blurred: [createMockCandidate(100, 1)],
        free: [createMockCandidate(85, 5)],
        locked: [],
      };

      const metrics = calculatePsychologicalMetrics(tiers);

      expect(metrics.scoreDifference).toBe(15);
      expect(metrics.conversionMessage).toContain('15점 더 완벽한 조화');
    });

    it('점수 차이가 10점 미만일 때 기본 메시지를 생성해야 함', () => {
      const tiers: FreemiumTiers = {
        blurred: [createMockCandidate(100, 1)],
        free: [createMockCandidate(95, 5)],
        locked: [],
      };

      const metrics = calculatePsychologicalMetrics(tiers);

      expect(metrics.scoreDifference).toBe(5);
      expect(metrics.conversionMessage).toBe('TOP 4 이름들은 최상위 품질입니다');
    });
  });

  describe('경계값 테스트', () => {
    it('빈 티어를 처리해야 함', () => {
      const emptyTiers: FreemiumTiers = {
        blurred: [],
        free: [],
        locked: [],
      };

      const metrics = calculatePsychologicalMetrics(emptyTiers);

      expect(metrics.topScore).toBe(0);
      expect(metrics.freeScore).toBe(0);
      expect(metrics.scoreDifference).toBe(0);
      expect(metrics.percentageDiff).toBe(0);
      expect(metrics.lockedCount).toBe(0);
      expect(metrics.totalCount).toBe(0);
    });

    it('free 티어만 비어있는 경우를 처리해야 함', () => {
      const tiers: FreemiumTiers = {
        blurred: [createMockCandidate(100, 1)],
        free: [],
        locked: [createMockCandidate(80, 6)],
      };

      const metrics = calculatePsychologicalMetrics(tiers);

      expect(metrics.topScore).toBe(100);
      expect(metrics.freeScore).toBe(0);
      expect(metrics.percentageDiff).toBe(0); // division by zero 방지
    });
  });
});

// ============================================================
// Tests: getRankLabel()
// ============================================================

describe('getRankLabel', () => {
  describe('정상 케이스', () => {
    it('1등에 대한 라벨을 반환해야 함', () => {
      expect(getRankLabel(1)).toBe('🏆 1등');
    });

    it('2등에 대한 라벨을 반환해야 함', () => {
      expect(getRankLabel(2)).toBe('🥈 2등');
    });

    it('3등에 대한 라벨을 반환해야 함', () => {
      expect(getRankLabel(3)).toBe('🥉 3등');
    });

    it('4등에 대한 라벨을 반환해야 함', () => {
      expect(getRankLabel(4)).toBe('4등');
    });

    it('5등(무료)에 대한 라벨을 반환해야 함', () => {
      expect(getRankLabel(5)).toBe('🎁 5등 (무료)');
    });

    it('6등 이상에 대한 라벨을 반환해야 함', () => {
      expect(getRankLabel(6)).toBe('6등');
      expect(getRankLabel(10)).toBe('10등');
      expect(getRankLabel(100)).toBe('100등');
    });
  });

  describe('경계값 테스트', () => {
    it('0 순위를 처리해야 함', () => {
      expect(getRankLabel(0)).toBe('0등');
    });

    it('음수 순위를 처리해야 함', () => {
      expect(getRankLabel(-1)).toBe('-1등');
    });
  });
});

// ============================================================
// Tests: hasPremiumAccess()
// ============================================================

describe('hasPremiumAccess', () => {
  describe('정상 케이스', () => {
    it('프리미엄이고 사주 ID가 일치하면 true를 반환해야 함', () => {
      expect(hasPremiumAccess(true, 'saju-123', 'saju-123')).toBe(true);
    });

    it('프리미엄이 아니면 false를 반환해야 함', () => {
      expect(hasPremiumAccess(false, 'saju-123', 'saju-123')).toBe(false);
    });

    it('사주 ID가 일치하지 않으면 false를 반환해야 함', () => {
      expect(hasPremiumAccess(true, 'saju-123', 'saju-456')).toBe(false);
    });
  });

  describe('null 처리', () => {
    it('구매한 사주 ID가 null이면 false를 반환해야 함', () => {
      expect(hasPremiumAccess(true, null, 'saju-123')).toBe(false);
    });

    it('현재 사주 ID가 null이면 false를 반환해야 함', () => {
      expect(hasPremiumAccess(true, 'saju-123', null)).toBe(false);
    });

    it('둘 다 null이면 false를 반환해야 함', () => {
      expect(hasPremiumAccess(true, null, null)).toBe(false);
    });
  });
});

// ============================================================
// Tests: getConversionMessages()
// ============================================================

describe('getConversionMessages', () => {
  describe('점수 차이가 20점 이상인 경우', () => {
    it('올바른 메시지를 반환해야 함', () => {
      const metrics: PsychologicalMetrics = {
        topScore: 100,
        freeScore: 70,
        scoreDifference: 30,
        percentageDiff: 43,
        lockedCount: 10,
        totalCount: 15,
        conversionMessage: '테스트',
      };

      const messages = getConversionMessages(metrics);

      expect(messages).toContain('1등 이름이 무려 **100점**입니다!');
      expect(messages).toContain('무료 이름보다 **30점** 더 높은 완벽한 조화');
      expect(messages).toContain('평생 사용할 이름, 단 한 번의 투자로 완성하세요');
    });
  });

  describe('점수 차이가 10-19점인 경우', () => {
    it('올바른 메시지를 반환해야 함', () => {
      const metrics: PsychologicalMetrics = {
        topScore: 95,
        freeScore: 80,
        scoreDifference: 15,
        percentageDiff: 19,
        lockedCount: 5,
        totalCount: 10,
        conversionMessage: '테스트',
      };

      const messages = getConversionMessages(metrics);

      expect(messages).toContain('최고 점수는 **95점**');
      expect(messages).toContain('무료 이름보다 15점 더 완벽합니다');
    });
  });

  describe('항상 포함되는 메시지', () => {
    it('가치 강조 메시지가 항상 포함되어야 함', () => {
      const metrics: PsychologicalMetrics = {
        topScore: 80,
        freeScore: 75,
        scoreDifference: 5,
        percentageDiff: 7,
        lockedCount: 5,
        totalCount: 10,
        conversionMessage: '테스트',
      };

      const messages = getConversionMessages(metrics);

      expect(messages).toContain('평생 사용할 이름, 단 한 번의 투자로 완성하세요');
    });
  });
});

// ============================================================
// Tests: getValueProposition()
// ============================================================

describe('getValueProposition', () => {
  describe('정상 케이스', () => {
    it('기본 가격으로 가치 제안을 반환해야 함', () => {
      const result = getValueProposition(10);

      // 9900 / 10 = 990원
      expect(result).toBe('이름 하나당 단 990원, 총 10개의 완벽한 이름');
    });

    it('커스텀 가격으로 가치 제안을 반환해야 함', () => {
      const result = getValueProposition(20, 20000);

      // 20000 / 20 = 1000원
      expect(result).toBe('이름 하나당 단 1000원, 총 20개의 완벽한 이름');
    });
  });

  describe('반올림 테스트', () => {
    it('나눗셈 결과를 반올림해야 함', () => {
      // 9900 / 3 = 3300
      expect(getValueProposition(3)).toBe('이름 하나당 단 3300원, 총 3개의 완벽한 이름');

      // 9900 / 7 = 1414.28... ≈ 1414
      expect(getValueProposition(7)).toBe('이름 하나당 단 1414원, 총 7개의 완벽한 이름');
    });
  });

  describe('경계값 테스트', () => {
    it('1개의 후보를 처리해야 함', () => {
      expect(getValueProposition(1)).toBe('이름 하나당 단 9900원, 총 1개의 완벽한 이름');
    });

    it('매우 많은 후보를 처리해야 함', () => {
      expect(getValueProposition(1000)).toBe('이름 하나당 단 10원, 총 1000개의 완벽한 이름');
    });
  });

  describe('기본값 테스트', () => {
    it('가격 파라미터를 생략하면 9900원을 사용해야 함', () => {
      const withDefault = getValueProposition(10);
      const withExplicit = getValueProposition(10, 9900);

      expect(withDefault).toBe(withExplicit);
    });
  });
});
