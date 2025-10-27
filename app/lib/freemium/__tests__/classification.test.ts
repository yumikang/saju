import { describe, it, expect } from 'vitest';
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
        id: rank * 10,
        character: `字${rank}`,
        strokes: 10,
        element: 'WOOD' as Element,
        yinYang: 'YANG' as YinYang,
        meaning: `의미${rank}`,
        koreanReading: `읽기${rank}`,
      },
      {
        id: rank * 10 + 1,
        character: `字${rank + 1}`,
        strokes: 12,
        element: 'FIRE' as Element,
        yinYang: 'YIN' as YinYang,
        meaning: `의미${rank + 1}`,
        koreanReading: `읽기${rank + 1}`,
      },
    ],
    score,
    breakdown: {
      element: score * 0.4,
      yinyang: score * 0.2,
      numerology: score * 0.25,
      meaning: score * 0.15,
    },
    analysis: {
      elementHarmony: {} as any,
      yinyangBalance: {} as any,
      numerologyGrids: {} as any,
      meaningCompatibility: {} as any,
      reasoning: [`이름 분석 ${rank}`],
    },
    scores: {
      overall: score,
      elementHarmony: {
        score: score * 0.4,
        weight: 40,
        weightedScore: score * 0.4 * 0.4,
        explanation: '오행 조화 점수',
      },
      yinYangBalance: {
        score: score * 0.2,
        weight: 20,
        weightedScore: score * 0.2 * 0.2,
        explanation: '음양 균형 점수',
      },
      numerology: {
        score: score * 0.25,
        weight: 25,
        weightedScore: score * 0.25 * 0.25,
        explanation: '수리 길흉 점수',
      },
      meaningHarmony: {
        score: score * 0.15,
        weight: 15,
        weightedScore: score * 0.15 * 0.15,
        explanation: '의미 조화 점수',
      },
    },
    confidenceScore: 85,
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
// Tests: classifyCandidates() - Strategic Freemium (11-12위 free, 1-10위 premium)
// ============================================================

describe('classifyCandidates (strategic freemium: 11-12위 free, 1-10위 premium)', () => {
  describe('정상 케이스 (Happy Path)', () => {
    it('12개의 후보를 올바르게 분류해야 함 (1-10위 locked, 11-12위 free)', () => {
      const candidates = createMockCandidateList(12);
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(10); // 1-10위 프리미엄
      expect(result.free).toHaveLength(2); // 11-12위 무료
      expect(result.remaining).toHaveLength(0); // 13+위
    });

    it('1-10위는 locked 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(12);
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(10);
      expect(result.locked[0].scores.overall).toBe(100); // 1위
      expect(result.locked[9].scores.overall).toBe(82); // 10위
    });

    it('11-12위는 free 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(12);
      const result = classifyCandidates(candidates);

      expect(result.free).toHaveLength(2);
      expect(result.free[0].scores.overall).toBe(80); // 11위
      expect(result.free[1].scores.overall).toBe(78); // 12위
    });

    it('13위 이상은 remaining 티어에 배정되어야 함', () => {
      const candidates = createMockCandidateList(15);
      const result = classifyCandidates(candidates);

      expect(result.remaining).toHaveLength(3);
      expect(result.remaining[0].scores.overall).toBe(76); // 13위
      expect(result.remaining[2].scores.overall).toBe(72); // 15위
    });
  });

  describe('경계값 테스트 (Edge Cases)', () => {
    it('정확히 12개의 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(12);
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(10);
      expect(result.free).toHaveLength(2);
      expect(result.remaining).toHaveLength(0);
    });

    it('10개 미만의 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(5);
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(5);
      expect(result.free).toHaveLength(0);
      expect(result.remaining).toHaveLength(0);
    });

    it('빈 배열을 처리해야 함', () => {
      const candidates: ScoredCandidate[] = [];
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(0);
      expect(result.free).toHaveLength(0);
      expect(result.remaining).toHaveLength(0);
    });

    it('50개 이상의 대량 후보를 처리해야 함', () => {
      const candidates = createMockCandidateList(50);
      const result = classifyCandidates(candidates);

      expect(result.locked).toHaveLength(10);
      expect(result.free).toHaveLength(2);
      expect(result.remaining).toHaveLength(38);
    });
  });

  describe('정렬 테스트', () => {
    it('정렬되지 않은 후보를 자동으로 정렬해야 함', () => {
      const candidates = [
        createMockCandidate(70, 12),
        createMockCandidate(100, 1),
        createMockCandidate(85, 6),
        createMockCandidate(95, 2),
        createMockCandidate(90, 4),
        createMockCandidate(80, 10),
        createMockCandidate(75, 11),
      ];

      const result = classifyCandidates(candidates);

      // 점수 내림차순으로 정렬되어야 함
      expect(result.locked[0].scores.overall).toBe(100); // 1위
      expect(result.locked[1].scores.overall).toBe(95);  // 2위
      expect(result.locked[5].scores.overall).toBe(80);  // 10위
      expect(result.free[0].scores.overall).toBe(75);    // 11위
      expect(result.free[1].scores.overall).toBe(70);    // 12위
    });
  });
});

// ============================================================
// Tests: calculatePsychologicalMetrics() - Strategic Freemium
// ============================================================

describe('calculatePsychologicalMetrics (strategic freemium)', () => {
  it('기본 메트릭을 올바르게 계산해야 함', () => {
    const candidates = createMockCandidateList(12);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);

    expect(metrics.topScore).toBe(100); // 1위 (프리미엄)
    expect(metrics.secondScore).toBe(98); // 2위 (프리미엄)
    expect(metrics.lockedTopScore).toBe(100); // 1위 (프리미엄)
    expect(metrics.scoreDifference).toBe(20); // 100 - 80 (1위 - 11위)
    expect(metrics.lockedCount).toBe(10); // 1-10위 프리미엄
    expect(metrics.totalCount).toBe(12);
  });

  it('점수 차이를 올바르게 계산해야 함 (1위 vs 11위)', () => {
    const candidates = [
      createMockCandidate(95, 1),
      createMockCandidate(90, 2),
      ...Array.from({ length: 8 }, (_, i) => createMockCandidate(85 - i * 2, i + 3)),
      createMockCandidate(60, 11), // 11위 (무료)
      createMockCandidate(58, 12), // 12위 (무료)
    ];

    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);

    expect(metrics.scoreDifference).toBe(35); // 95 - 60
    expect(metrics.conversionMessage).toContain('완벽');
  });

  it('전환 메시지를 적절히 생성해야 함', () => {
    const candidates = createMockCandidateList(12);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);

    expect(metrics.conversionMessage).toBeTruthy();
    expect(typeof metrics.conversionMessage).toBe('string');
  });
});

// ============================================================
// Tests: getRankLabel() - Strategic Freemium
// ============================================================

describe('getRankLabel (strategic freemium)', () => {
  it('1-10위는 프리미엄 라벨을 반환해야 함', () => {
    expect(getRankLabel(1)).toContain('프리미엄');
    expect(getRankLabel(5)).toContain('프리미엄');
    expect(getRankLabel(10)).toContain('프리미엄');
  });

  it('11-12위는 무료 라벨을 반환해야 함', () => {
    expect(getRankLabel(11)).toContain('무료');
    expect(getRankLabel(12)).toContain('무료');
  });

  it('13위 이상은 등수만 반환해야 함', () => {
    expect(getRankLabel(13)).toBe('13등');
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
// Tests: getConversionMessages() - Strategic Freemium
// ============================================================

describe('getConversionMessages (strategic freemium)', () => {
  it('높은 점수 차이에 대한 메시지를 생성해야 함', () => {
    const tiers: FreemiumTiers = {
      locked: [
        createMockCandidate(95, 1),
        createMockCandidate(93, 2),
        ...Array.from({ length: 8 }, (_, i) => createMockCandidate(90 - i * 2, i + 3)),
      ],
      free: [
        createMockCandidate(70, 11),
        createMockCandidate(68, 12),
      ],
      remaining: [],
    };

    const metrics = calculatePsychologicalMetrics(tiers);
    const messages = getConversionMessages(metrics);

    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some((msg) => msg.includes('점'))).toBe(true);
  });

  it('프리미엄 이름 개수를 강조해야 함', () => {
    const candidates = createMockCandidateList(12);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);
    const messages = getConversionMessages(metrics);

    expect(messages.some((msg) => msg.includes('10개'))).toBe(true);
  });

  it('가치 제안 메시지를 포함해야 함', () => {
    const candidates = createMockCandidateList(12);
    const tiers = classifyCandidates(candidates);
    const metrics = calculatePsychologicalMetrics(tiers);
    const messages = getConversionMessages(metrics);

    expect(messages.some((msg) => msg.includes('평생'))).toBe(true);
  });
});

// ============================================================
// Tests: getValueProposition() - Strategic Freemium with 69,000원
// ============================================================

describe('getValueProposition (strategic freemium, 69,000원)', () => {
  it('기본 가격(69,000원)으로 가치 제안을 생성해야 함', () => {
    const proposition = getValueProposition(); // 기본 69,000원
    expect(proposition).toContain('10개');
    expect(proposition).toContain('6,900'); // 69,000 / 10 = 6,900
  });

  it('커스텀 가격으로 가치 제안을 생성해야 함', () => {
    const proposition = getValueProposition(100000);
    expect(proposition).toContain('10개');
    expect(proposition).toContain('10,000'); // 100,000 / 10 = 10,000
  });

  it('가격 포맷팅이 올바른지 확인해야 함', () => {
    const proposition = getValueProposition(69000);
    expect(proposition).toMatch(/\d{1,3}(,\d{3})*/); // 쉼표 포맷팅 확인
  });
});

// ============================================================
// Integration Tests
// ============================================================

describe('통합 테스트 (strategic freemium)', () => {
  it('전체 워크플로우가 정상 작동해야 함', () => {
    // 1. 후보 생성
    const candidates = createMockCandidateList(15);

    // 2. 분류
    const tiers = classifyCandidates(candidates);
    expect(tiers.locked).toHaveLength(10); // 1-10위 프리미엄
    expect(tiers.free).toHaveLength(2); // 11-12위 무료
    expect(tiers.remaining).toHaveLength(3); // 13+위

    // 3. 메트릭 계산
    const metrics = calculatePsychologicalMetrics(tiers);
    expect(metrics.topScore).toBeGreaterThan(0);
    expect(metrics.lockedCount).toBe(10); // 10개 프리미엄 이름

    // 4. 전환 메시지 생성
    const messages = getConversionMessages(metrics);
    expect(messages.length).toBeGreaterThan(0);

    // 5. 가치 제안 생성
    const valueProposition = getValueProposition();
    expect(valueProposition).toBeTruthy();

    // 6. 순위 라벨 확인
    expect(getRankLabel(1)).toContain('프리미엄'); // 1위는 프리미엄
    expect(getRankLabel(5)).toContain('프리미엄'); // 5위도 프리미엄
    expect(getRankLabel(11)).toContain('무료'); // 11위는 무료
  });
});
