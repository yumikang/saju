/**
 * Freemium Classification Utilities
 *
 * Classifies name candidates into strategic freemium structure:
 * - Free (10위): Single free preview name
 * - Locked (1-9위): Premium top names, require payment
 * - Remaining: Stored but not initially displayed
 */

import type { ScoredCandidate } from '~/lib/naming/types';

// ============================================================
// Types
// ============================================================

export interface FreemiumTiers {
  free: ScoredCandidate[];    // 10위: Free preview name (single card)
  locked: ScoredCandidate[];  // 1-9위: Premium names (top 9)
  remaining: ScoredCandidate[]; // 11+위: Additional names
}

export interface PsychologicalMetrics {
  topScore: number;           // 최고 점수 (1등)
  secondScore: number;        // 2등 점수
  lockedTopScore: number;     // 잠긴 이름 최고 점수 (3등)
  scoreDifference: number;    // 1등 vs 3등 점수 차이
  percentageDiff: number;     // 퍼센트 차이
  lockedCount: number;        // 잠긴 프리미엄 이름 수 (8개)
  totalCount: number;         // 전체 후보 수
  conversionMessage: string;  // 전환 유도 메시지
}

// ============================================================
// Classification Functions
// ============================================================

/**
 * Classify candidates into strategic freemium tiers
 *
 * @param candidates - All candidates sorted by score (descending)
 * @returns FreemiumTiers object with free (10위) + locked (1-9위) + remaining
 */
export function classifyCandidates(
  candidates: ScoredCandidate[]
): FreemiumTiers {
  // Sort by score descending (just in case)
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return {
    // 🔒 1-9위: 프리미엄 잠금 (Top 9 premium names)
    locked: sorted.slice(0, 9),

    // 🆓 10위: 무료 공개 (Free preview, single name at rank 10)
    free: sorted.slice(9, 10),

    // 📦 11+위: 추가 이름 (Remaining names)
    remaining: sorted.slice(10),
  };
}

/**
 * Calculate psychological metrics for conversion optimization (strategic freemium)
 *
 * @param tiers - Classified freemium tiers
 * @returns PsychologicalMetrics
 */
export function calculatePsychologicalMetrics(
  tiers: FreemiumTiers
): PsychologicalMetrics {
  const topScore = tiers.locked[0]?.scores.overall || 0;  // 1위 (프리미엄)
  const secondScore = tiers.locked[1]?.scores.overall || 0;  // 2위 (프리미엄)
  const lockedTopScore = tiers.locked[0]?.scores.overall || 0;  // 프리미엄 최고점
  const freeTopScore = tiers.free[0]?.scores.overall || 0;  // 10위 (무료)
  const scoreDifference = Math.round(topScore - freeTopScore);
  const percentageDiff = freeTopScore > 0
    ? Math.round(((topScore - freeTopScore) / freeTopScore) * 100)
    : 0;

  const lockedCount = tiers.locked.length;
  const totalCount = tiers.free.length + tiers.locked.length + tiers.remaining.length;

  // 전환 유도 메시지 생성 (10위 무료 vs 1-9위 프리미엄)
  let conversionMessage = '';
  if (scoreDifference >= 15) {
    conversionMessage = `1위 이름은 무료 이름보다 ${scoreDifference}점이나 높은 완벽한 조화입니다!`;
  } else if (scoreDifference >= 10) {
    conversionMessage = `프리미엄 이름 9개로 최고의 선택지를 확보하세요`;
  } else {
    conversionMessage = `1-9위 프리미엄 이름들은 최상위 품질입니다`;
  }

  return {
    topScore,
    secondScore,
    lockedTopScore,
    scoreDifference,
    percentageDiff,
    lockedCount,
    totalCount,
    conversionMessage,
  };
}

/**
 * Get rank label with emoji (strategic freemium)
 *
 * @param rank - Rank number (1-based)
 * @returns Formatted rank string
 */
export function getRankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return '🏆 1등 (프리미엄)';
    case 2:
      return '🥈 2등 (프리미엄)';
    case 3:
      return '🥉 3등 (프리미엄)';
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
      return `${rank}등 (프리미엄)`;
    case 10:
      return '10등 (무료)';
    default:
      return `${rank}등`;
  }
}

/**
 * Check if user has premium access for specific saju
 *
 * @param isPremium - Premium status from store
 * @param sajuIdPurchased - Purchased saju ID from store
 * @param currentSajuId - Current saju ID
 * @returns boolean
 */
export function hasPremiumAccess(
  isPremium: boolean,
  sajuIdPurchased: string | null,
  currentSajuId: string | null
): boolean {
  return isPremium && sajuIdPurchased !== null && sajuIdPurchased === currentSajuId;
}

/**
 * Get conversion messages based on metrics (strategic freemium)
 *
 * @param metrics - Psychological metrics
 * @returns Array of conversion message lines
 */
export function getConversionMessages(
  metrics: PsychologicalMetrics
): string[] {
  const messages: string[] = [];

  // 10위 무료 vs 1-9위 프리미엄 비교
  if (metrics.scoreDifference >= 15) {
    messages.push(
      `무료 이름도 좋지만, 1위 이름은 **${metrics.scoreDifference}점**이나 더 높습니다!`,
      `프리미엄 최고 점수: **${metrics.topScore}점**`
    );
  } else if (metrics.scoreDifference >= 10) {
    messages.push(
      `1-9위 프리미엄 이름은 **${metrics.topScore}점**부터 시작합니다`,
      `무료 이름보다 평균 **${metrics.scoreDifference}점** 더 높은 조화`
    );
  } else {
    messages.push(
      `1-9위 프리미엄 이름: **${metrics.topScore}점**부터 **최상위 품질**`,
      `더 나은 선택을 위한 9개의 프리미엄 이름`
    );
  }

  // 볼륨 강조 (9개 프리미엄 이름)
  messages.push(
    `**${metrics.lockedCount}개**의 최고 점수 이름으로 완벽한 선택을 하세요`
  );

  // 가치 강조
  messages.push(
    '평생 사용할 이름, 단 한 번의 투자로 완성하세요'
  );

  return messages;
}

/**
 * Calculate price value proposition (strategic freemium with 69,000원)
 *
 * @param price - Price in KRW (default: 69,000원)
 * @returns Value message
 */
export function getValueProposition(price: number = 69000): string {
  const pricePerName = Math.round(price / 9); // 9개 프리미엄 이름 기준
  return `프리미엄 이름 9개, 이름 하나당 ${pricePerName.toLocaleString()}원`;
}
