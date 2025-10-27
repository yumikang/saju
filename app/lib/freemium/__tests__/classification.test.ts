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
    scores: {
      overall: score,
      elementHarmony: {
        score: score * 0.4,
        weight: 40,
        breakdown: {
          lackingElements: score * 0.15,
          elementBalance: score * 0.15,
          yongsinAlignment: score * 0.10,
        },
      },
      yinYangBalance: {
        score: score * 0.2,
        weight: 20,
        breakdown: {
          ganBalance: score * 0.1,
          jiBalance: score * 0.1,
          overallBalance: score * 0.1,
        },
      },
      numerology: {
        score: score * 0.25,
        weight: 25,
        breakdown: {
          totalStrokes: 22,
          individualStrokes: [10, 12],
        },
      },
      meaningHarmony: {
        score: score * 0.15,
        weight: 15,
        breakdown: {
          valueAlignment: score * 0.08,
          synergy: score * 0.07,
        },
      },
    },
    confidenceScore: 85,
    aiExplanation: `${rank}번째 이름에 대한 AI 설명`,
    ...overrides,
  };
}

/**
 * Create a list of mock candidates with descending scores
 */
function createMockCandidateList(count: number): ScoredCandidate[] {
  const candidates: ScoredCandidate[] = [];
  for (let i = 0; i < count; i++) {
    const score = 100 - i * 2;
    candidates.push(createMockCandidate(score, i + 1));
  }
  return candidates;
}

// ============================================================
// Tests: classifyCandidates() - 2+8 Structure
// ============================================================

describe('classifyCandidates (2+8 structure)', () => {
  describe('정상 케이스 (Happy Path)', () => {
    it('10개의 후보를 2+8로 올바르게 분류해야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.free).toHaveLength(2); // 1-2위
      expect(result.locked).toHaveLength(8); // 3-10위
      expect(result.remaining).toHaveLength(0); // 11+위
    });

    it('1-2위는 free 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.free[0].scores.overall).toBe(100);
      expect(result.free[1].scores.overall).toBe(98);
    });

    it('3-10위는 locked 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(8);
      expect(result.locked[0].scores.overall).toBe(96); // 3위
      expect(result.locked[7].scores.overall).toBe(82); // 10위
    });

    it('11위 이상은 remaining 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(15);
      const result = classifyCandidates(candidates);

      expect(result.remaining).toHaveLength(5);
      expect(result.remaining[0].scores.overall).toBe(80); // 11위
      expect(result.remaining[4].scores.overall).toBe(72); // 15위
    });
  });

  describe('경계값 테스트 (Edge Cases)', () => {
    it('정확히 10개의 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(10);
      const result = classifyCandidates(candidates);

      expect(result.free).toHaveLength(2);
      expect(result.locked).toHaveLength(8);
      expect(result.remaining).toHaveLength(0);
    });

    it('2개 미만의 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(1);
      const result = classifyCandidates(candidates);

      expect(result.free).toHaveLength(1);
      expect(result.locked).toHaveLength(0);
      expect(result.remaining).toHaveLength(0);
    });

    it('빈 배열을 처리해야 함', () => {
      const candidates: ScoredCandidate[] = [];
      const result = classifyCandidates(candidates);

      expect(result.free).toHaveLength(0);
      expect(result.locked).toHaveLength(0);
      expect(result.remaining).toHaveLength(0);
    });

    it('50개 이상의 대량 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(50);
      const result = classifyCandidates(candidates);

      expect(result.free).toHaveLength(2);
      expect(result.locked).toHaveLength(8);
      expect(result.remaining).toHaveLength(40);
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
      expect(result.free[0].scores.overall).toBe(100);
      expect(result.free[1].scores.overall).toBe(95);
      expect(result.locked[0].scores.overall).toBe(90);
      expect(result.locked[1].scores.overall).toBe(85);
      expect(result.locked[2].scores.overall).toBe(80);
    });
  });
});

// ============================================================
// Tests: calculatePsychologicalMetrics() - 2+8 Structure
// ============================================================

describe('calculatePsychologicalMetrics (2+8 structure)', () => {
  it('기본 메트릭을 올바르게 계산해야 함', () => {
    const candidates = createMockCandidateList(10);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);

    expect(metrics.topScore).toBe(100); // 1위
    expect(metrics.secondScore).toBe(98); // 2위
    expect(metrics.lockedTopScore).toBe(96); // 3위
    expect(metrics.scoreDifference).toBe(4); // 100 - 96
    expect(metrics.lockedCount).toBe(8); // 3-10위
    expect(metrics.totalCount).toBe(10);
  });

  it('점수 차이를 올바르게 계산해야 함', () => {
    const candidates = [
      createMockCandidate(95, 1),
      createMockCandidate(90, 2),
      createMockCandidate(75, 3),
      ...createMockCandidateList(7).slice(3),
    ];

    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);

    expect(metrics.scoreDifference).toBe(20); // 95 - 75
    expect(metrics.conversionMessage).toContain('완벽');
  });

  it('전환 메시지를 적절히 생성해야 함', () => {
    const candidates = createMockCandidateList(10);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);

    expect(metrics.conversionMessage).toBeTruthy();
    expect(typeof metrics.conversionMessage).toBe('string');
  });
});

// ============================================================
// Tests: getRankLabel() - 2+8 Structure
// ============================================================

describe('getRankLabel (2+8 structure)', () => {
  it('1-2위는 무료 라벨을 반환해야 함', () => {
    expect(getRankLabel(1)).toContain('무료');
    expect(getRankLabel(2)).toContain('무료');
  });

  it('3-10위는 프리미엄 라벨을 반환해야 함', () => {
    expect(getRankLabel(3)).toContain('프리미엄');
    expect(getRankLabel(5)).toContain('프리미엄');
    expect(getRankLabel(10)).toContain('프리미엄');
  });

  it('11위 이상은 등수만 반환해야 함', () => {
    expect(getRankLabel(11)).toBe('11등');
    expect(getRankLabel(50)).toBe('50등');
  });
});

// ============================================================
// Tests: hasPremiumAccess()
// ============================================================

describe('hasPremiumAccess', () => {
  it('프리미엄이고 같은 사주 ID면 true를 반환해야 함', () => {
    const result = hasPremiumAccess(true, 'saju-123', 'saju-123');
    expect(result).toBe(true);
  });

  it('프리미엄이지만 다른 사주 ID면 false를 반환해야 함', () => {
    const result = hasPremiumAccess(true, 'saju-123', 'saju-456');
    expect(result).toBe(false);
  });

  it('프리미엄이 아니면 false를 반환해야 함', () => {
    const result = hasPremiumAccess(false, 'saju-123', 'saju-123');
    expect(result).toBe(false);
  });

  it('sajuIdPurchased가 null이면 false를 반환해야 함', () => {
    const result = hasPremiumAccess(true, null, 'saju-123');
    expect(result).toBe(false);
  });

  it('currentSajuId가 null이면 false를 반환해야 함', () => {
    const result = hasPremiumAccess(true, 'saju-123', null);
    expect(result).toBe(false);
  });
});

// ============================================================
// Tests: getConversionMessages() - 2+8 Structure
// ============================================================

describe('getConversionMessages (2+8 structure)', () => {
  it('높은 점수 차이에 대한 메시지를 생성해야 함', () => {
    const tiers: FreemiumTiers = {
      free: [
        createMockCandidate(95, 1),
        createMockCandidate(93, 2),
      ],
      locked: [
        createMockCandidate(80, 3),
        ...createMockCandidateList(7).slice(3),
      ],
      remaining: [],
    };

    const metrics = calculatePsychologicalMetrics(tiers);
    const messages = getConversionMessages(metrics);

    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some((msg) => msg.includes('점'))).toBe(true);
  });

  it('프리미엄 이름 개수를 강조해야 함', () => {
    const candidates = createMockCandidateList(10);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);
    const messages = getConversionMessages(metrics);

    expect(messages.some((msg) => msg.includes('8개'))).toBe(true);
  });

  it('가치 제안 메시지를 포함해야 함', () => {
    const candidates = createMockCandidateList(10);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);
    const messages = getConversionMessages(metrics);

    expect(messages.some((msg) => msg.includes('평생'))).toBe(true);
  });
});

// ============================================================
// Tests: getValueProposition() - 2+8 Structure with 69,000원
// ============================================================

describe('getValueProposition (2+8 structure, 69,000원)', () => {
  it('기본 가격(69,000원)으로 가치 제안을 생성해야 함', () => {
    const proposition = getValueProposition(10); // 기본 69,000원
    expect(proposition).toContain('8개');
    expect(proposition).toContain('8,625'); // 69,000 / 8 = 8,625
  });

  it('커스텀 가격으로 가치 제안을 생성해야 함', () => {
    const proposition = getValueProposition(10, 100000);
    expect(proposition).toContain('8개');
    expect(proposition).toContain('12,500'); // 100,000 / 8 = 12,500
  });

  it('가격 포맷팅이 올바른지 확인해야 함', () => {
    const proposition = getValueProposition(10, 69000);
    expect(proposition).toMatch(/\d{1,3}(,\d{3})*/); // 쉼표 포맷팅 확인
  });
});

// ============================================================
// Integration Tests
// ============================================================

describe('통합 테스트 (2+8 structure)', () => {
  it('전체 워크플로우가 정상 작동해야 함', () => {
    // 1. 후보 생성
    const candidates = createMockCandidateList(15);

    // 2. 분류
    const tiers = classifyCandidates(candidates);
    expect(tiers.free).toHaveLength(2);
    expect(tiers.locked).toHaveLength(8);
    expect(tiers.remaining).toHaveLength(5);

    // 3. 메트릭 계산
    const metrics = calculatePsychologicalMetrics(tiers);
    expect(metrics.topScore).toBeGreaterThan(0);
    expect(metrics.lockedCount).toBe(8);

    // 4. 전환 메시지 생성
    const messages = getConversionMessages(metrics);
    expect(messages.length).toBeGreaterThan(0);

    // 5. 가치 제안 생성
    const valueProposition = getValueProposition(15);
    expect(valueProposition).toBeTruthy();

    // 6. 순위 라벨 확인
    expect(getRankLabel(1)).toContain('무료');
    expect(getRankLabel(5)).toContain('프리미엄');
  });
});
