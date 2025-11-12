/**
 * Scoring Mode Types
 *
 * 3가지 점수 계산 모드:
 * - 균형형: 사주 오행을 1순위, 가치는 2순위
 * - 의미형: 부모 가치/의미를 1순위, 오행은 최소 기준만 충족
 * - 하이브리드: 상황에 따라 자동으로 가중치 비율 조정
 */

export type ScoringMode = 'balance' | 'meaning' | 'hybrid';

export interface ScoringWeights {
  /** 오행 조화 (사주 적합도) */
  element: number;
  /** 음양 균형 */
  yinyang: number;
  /** 의미 조화 (부모 가치 반영) */
  meaning: number;
  /** 언어적 자연스러움 */
  linguistic: number;
  /** 금기 필터 (부정어, 동물명 등) */
  taboo: number;
}

export interface ModeConfiguration {
  mode: ScoringMode;
  weights: ScoringWeights;
  description: string;
  /** 오행 점수 하한선 (이 값 미만이면 TOP 노출 금지) */
  elementThreshold: number;
  /** 의미 점수 최대 가점 */
  meaningCap: number;
}

/**
 * 균형형 (Balance Mode)
 * - 사주 오행을 1순위, 가치는 2순위
 * - 전통적 사주명리학 기반 접근
 */
export const BALANCE_MODE: ModeConfiguration = {
  mode: 'balance',
  weights: {
    element: 0.45,    // 오행 45%
    yinyang: 0.15,    // 음양 15%
    meaning: 0.15,    // 의미 15%
    linguistic: 0.15, // 언어 15%
    taboo: 0.10,      // 금기 10%
  },
  description: '사주 오행 조화를 최우선으로 하는 전통 명리학 기반 모드',
  elementThreshold: 60,  // 오행 60점 미만 → TOP 제외
  meaningCap: 12,        // 의미 가점 최대 +12
};

/**
 * 의미형 (Meaning Mode)
 * - 부모 가치/의미를 1순위, 오행은 최소 기준만 충족
 * - 현대적 가치 중심 접근
 */
export const MEANING_MODE: ModeConfiguration = {
  mode: 'meaning',
  weights: {
    element: 0.25,    // 오행 25% (최소한만)
    yinyang: 0.10,    // 음양 10%
    meaning: 0.35,    // 의미 35% (최우선)
    linguistic: 0.15, // 언어 15%
    taboo: 0.15,      // 금기 15%
  },
  description: '부모의 가치와 의미를 최우선으로 하는 현대적 접근 모드',
  elementThreshold: 50,  // 오행 50점 미만 → TOP 제외 (완화)
  meaningCap: 15,        // 의미 가점 최대 +15 (확대)
};

/**
 * 하이브리드 (Hybrid Mode) - 추천 기본값
 * - 상황에 따라 자동으로 가중치 비율 조정
 * - 오행 부족이 심할수록 오행 가중 ↑, 충분하면 의미 가중 ↑
 */
export const HYBRID_MODE: ModeConfiguration = {
  mode: 'hybrid',
  weights: {
    element: 0.35,    // 오행 35%
    yinyang: 0.12,    // 음양 12%
    meaning: 0.25,    // 의미 25%
    linguistic: 0.15, // 언어 15%
    taboo: 0.13,      // 금기 13%
  },
  description: '오행과 의미를 균형있게 고려하는 추천 모드',
  elementThreshold: 55,  // 오행 55점 미만 → TOP 제외
  meaningCap: 13,        // 의미 가점 최대 +13
};

/**
 * 모드별 설정 매핑
 */
export const MODE_CONFIGURATIONS: Record<ScoringMode, ModeConfiguration> = {
  balance: BALANCE_MODE,
  meaning: MEANING_MODE,
  hybrid: HYBRID_MODE,
};

/**
 * Get mode configuration
 */
export function getModeConfiguration(mode: ScoringMode): ModeConfiguration {
  return MODE_CONFIGURATIONS[mode];
}

/**
 * Calculate dynamic weights for hybrid mode based on element deficiency
 *
 * @param elementScore - 오행 점수 (0-100)
 * @returns Dynamically adjusted weights
 */
export function calculateHybridWeights(elementScore: number): ScoringWeights {
  // 오행 점수가 낮을수록 오행 가중치 증가
  // elementScore: 100 → element 0.30, meaning 0.30
  // elementScore: 80  → element 0.33, meaning 0.27
  // elementScore: 60  → element 0.37, meaning 0.23
  // elementScore: 40  → element 0.42, meaning 0.18

  const elementDeficiency = Math.max(0, 100 - elementScore) / 100; // 0.0 - 1.0

  // Element weight: 30% ~ 45%
  const elementWeight = 0.30 + (elementDeficiency * 0.15);

  // Meaning weight: 30% ~ 15% (inverse)
  const meaningWeight = 0.30 - (elementDeficiency * 0.15);

  // Keep other weights proportional
  const remainingWeight = 1.0 - elementWeight - meaningWeight;
  const yinyang = remainingWeight * 0.30;  // ~12%
  const linguistic = remainingWeight * 0.37; // ~15%
  const taboo = remainingWeight * 0.33;    // ~13%

  return {
    element: Number(elementWeight.toFixed(3)),
    yinyang: Number(yinyang.toFixed(3)),
    meaning: Number(meaningWeight.toFixed(3)),
    linguistic: Number(linguistic.toFixed(3)),
    taboo: Number(taboo.toFixed(3)),
  };
}

/**
 * Validate weights sum to 1.0
 */
export function validateWeights(weights: ScoringWeights): boolean {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1.0) < 0.01;
}

/**
 * Apply safety thresholds to final score
 *
 * @param score - Original score
 * @param elementScore - Element harmony score
 * @param elementThreshold - Minimum element score for TOP ranking
 * @returns Adjusted score with safety cap
 */
export function applySafetyThreshold(
  score: number,
  elementScore: number,
  elementThreshold: number
): number {
  // 오행 점수가 기준 미달이면 79.9점으로 제한 (TOP 10 진입 차단)
  if (elementScore < elementThreshold) {
    return Math.min(score, 79.9);
  }

  return score;
}
