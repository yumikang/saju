/**
 * Mode Recommendation System
 *
 * 사주팔자 분석 결과를 기반으로 최적의 점수 모드 추천
 *
 * 로직:
 * - 오행 균형이 이미 좋음 → 의미형 (오행은 충분, 의미에 집중)
 * - 오행 균형이 부족함 → 균형형 (오행 보완 우선)
 * - 애매한 경우 → 하이브리드 (자동 조정)
 */

import type { SajuResult } from '../../saju/calculator';
import type { ScoringMode } from '../types/scoring-mode';

export interface ModeRecommendation {
  recommendedMode: ScoringMode;
  reason: string;
  confidence: number; // 0-1, 추천 확신도
  elementBalance: ElementBalanceStatus;
}

export interface ElementBalanceStatus {
  score: number; // 0-100, 오행 균형 점수
  lacks: string[]; // 부족한 오행
  excess: string[]; // 과한 오행
  isBalanced: boolean; // 균형 잡혔는지
}

/**
 * 사주팔자 기반 모드 추천
 *
 * @param sajuResult - 사주 분석 결과
 * @returns 추천 모드 및 이유
 */
export function recommendScoringMode(sajuResult: SajuResult): ModeRecommendation {
  // 1. 오행 균형 상태 분석
  const elementBalance = analyzeElementBalance(sajuResult);

  // 2. 균형 점수 기반 모드 결정
  const { score, lacks } = elementBalance;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 케이스 1: 오행 균형 매우 좋음 (80점 이상)
  // → 의미형: 오행은 이미 좋으니 부모 가치/의미에 집중
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (score >= 80) {
    return {
      recommendedMode: 'meaning',
      reason: `타고난 오행 균형이 매우 좋습니다 (${score}점). 이름에서는 부모님의 가치와 의미를 중심으로 선택하시는 것을 추천합니다.`,
      confidence: 0.9,
      elementBalance,
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 케이스 2: 오행 균형 양호 (65-79점)
  // → 하이브리드: 오행도 고려하되 의미도 중요
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (score >= 65) {
    return {
      recommendedMode: 'hybrid',
      reason: `타고난 오행 균형이 양호합니다 (${score}점). 오행 보완과 의미를 균형있게 고려하는 것을 추천합니다.`,
      confidence: 0.8,
      elementBalance,
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 케이스 3: 오행 균형 부족 (40-64점)
  // → 하이브리드: 오행 보완 필요하지만 의미도 고려
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (score >= 40) {
    const lackText = lacks.length > 0 ? `(특히 ${lacks.join(', ')} 보완 필요)` : '';
    return {
      recommendedMode: 'hybrid',
      reason: `타고난 오행 균형이 다소 부족합니다 (${score}점). 오행 보완에 중점을 두되 의미도 함께 고려하는 것을 추천합니다. ${lackText}`,
      confidence: 0.85,
      elementBalance,
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 케이스 4: 오행 균형 매우 부족 (< 40점)
  // → 균형형: 오행 보완이 최우선
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const lackText = lacks.length > 0 ? `(특히 ${lacks.join(', ')} 보완 시급)` : '';
  return {
    recommendedMode: 'balance',
    reason: `타고난 오행 균형이 많이 부족합니다 (${score}점). 이름을 통한 오행 보완을 최우선으로 하는 것을 추천합니다. ${lackText}`,
    confidence: 0.95,
    elementBalance,
  };
}

/**
 * 오행 균형 상태 분석
 *
 * @param sajuResult - 사주 분석 결과
 * @returns 오행 균형 상태
 */
function analyzeElementBalance(sajuResult: SajuResult): ElementBalanceStatus {
  const { elementAnalysis } = sajuResult;

  // 천간지지 오행 분포 분석
  const elementCounts: Record<string, number> = {
    WOOD: 0,
    FIRE: 0,
    EARTH: 0,
    METAL: 0,
    WATER: 0,
  };

  // 천간 4개 카운트
  sajuResult.heavenlyStems.forEach((stem) => {
    elementCounts[stem.element]++;
  });

  // 지지 4개 카운트
  sajuResult.earthlyBranches.forEach((branch) => {
    elementCounts[branch.element]++;
  });

  // 총 8개 중 오행 분포
  const total = 8;
  const elementPercentages: Record<string, number> = {};
  Object.keys(elementCounts).forEach((element) => {
    elementPercentages[element] = (elementCounts[element] / total) * 100;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 균형 점수 계산
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 이상적 분포: 각 오행 20% (5개 오행)
  // 편차가 작을수록 균형 좋음
  const idealPercentage = 20;
  let totalDeviation = 0;

  Object.values(elementPercentages).forEach((percentage) => {
    totalDeviation += Math.abs(percentage - idealPercentage);
  });

  // 균형 점수: 편차가 0이면 100점, 편차가 클수록 낮은 점수
  // 최대 편차: 100 (하나만 100%, 나머지 0%)
  const maxDeviation = 100;
  const balanceScore = Math.max(0, 100 - (totalDeviation / maxDeviation) * 100);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 부족/과다 오행 식별
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const lacks: string[] = [];
  const excess: string[] = [];

  const elementNames: Record<string, string> = {
    WOOD: '목(木)',
    FIRE: '화(火)',
    EARTH: '토(土)',
    METAL: '금(金)',
    WATER: '수(水)',
  };

  Object.entries(elementPercentages).forEach(([element, percentage]) => {
    if (percentage === 0) {
      lacks.push(elementNames[element]);
    } else if (percentage < 10) {
      lacks.push(elementNames[element]);
    } else if (percentage > 40) {
      excess.push(elementNames[element]);
    }
  });

  // 희신(喜神) 우선순위 추가
  if (elementAnalysis.favorableElement) {
    const favorableElementName = elementNames[elementAnalysis.favorableElement];
    if (!lacks.includes(favorableElementName)) {
      lacks.unshift(favorableElementName); // 희신을 맨 앞에
    }
  }

  return {
    score: Math.round(balanceScore),
    lacks,
    excess,
    isBalanced: balanceScore >= 70,
  };
}

/**
 * 모드별 설명 텍스트
 */
export const MODE_DESCRIPTIONS = {
  balance: {
    title: '균형형 (사주 오행 우선)',
    description: '타고난 오행 균형을 보완하는 것을 최우선으로 합니다.',
    recommended: '오행 균형이 부족한 경우 추천',
    weights: '오행 45% | 의미 15%',
  },
  meaning: {
    title: '의미형 (부모 가치 우선)',
    description: '부모님의 가치와 바람을 담은 의미를 최우선으로 합니다.',
    recommended: '오행 균형이 이미 좋은 경우 추천',
    weights: '오행 25% | 의미 35%',
  },
  hybrid: {
    title: '하이브리드 (균형 조정)',
    description: '오행과 의미를 균형있게 고려하며, 상황에 따라 자동 조정합니다.',
    recommended: '대부분의 경우 추천 (기본값)',
    weights: '오행 35% | 의미 25% (가변)',
  },
};

/**
 * 추천 확신도에 따른 UI 표시
 */
export function getRecommendationStrength(confidence: number): string {
  if (confidence >= 0.9) return '강력 추천';
  if (confidence >= 0.8) return '추천';
  if (confidence >= 0.7) return '권장';
  return '참고';
}

/**
 * 오행 균형 상태에 따른 색상
 */
export function getBalanceColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 65) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}
