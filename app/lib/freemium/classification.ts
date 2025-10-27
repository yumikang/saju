/**
 * Freemium Classification Utilities
 *
 * Classifies name candidates into 2+8 freemium structure:
 * - Free (1-2위): Fully accessible, no payment required
 * - Locked (3-10위): Premium names, require payment
 * - Remaining: Stored but not initially displayed
 */

import type { ScoredCandidate } from '~/lib/naming/types';

// ============================================================
// Types
// ============================================================

export interface FreemiumTiers {
  free: ScoredCandidate[];    // 1-2위: Free names
  locked: ScoredCandidate[];  // 3-10위: Premium names (8 names)
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
 * Classify candidates into 2+8 freemium tiers
 *
 * @param candidates - All candidates sorted by score (descending)
 * @returns FreemiumTiers object with 2 free + 8 locked + remaining
 */
export function classifyCandidates(
  candidates: ScoredCandidate[]
): FreemiumTiers {
  // Sort by score descending (just in case)
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return {
    // 🆓 1-2위: 무료 공개 (Free names)
    free: sorted.slice(0, 2),

    // 🔒 3-10위: 프리미엄 잠금 (8 premium names)
    locked: sorted.slice(2, 10),

    // 📦 11+위: 추가 이름 (Remaining names)
    remaining: sorted.slice(10),
  };
}

/**
 * Calculate psychological metrics for conversion optimization (2+8 structure)
 *
 * @param tiers - Classified freemium tiers
 * @returns PsychologicalMetrics
 */
export function calculatePsychologicalMetrics(
  tiers: FreemiumTiers
): PsychologicalMetrics {
  const topScore = tiers.free[0]?.scores.overall || 0;
  const secondScore = tiers.free[1]?.scores.overall || 0;
  const lockedTopScore = tiers.locked[0]?.scores.overall || 0;
  const scoreDifference = Math.round(topScore - lockedTopScore);
  const percentageDiff = lockedTopScore > 0
    ? Math.round(((topScore - lockedTopScore) / lockedTopScore) * 100)
    : 0;

  const lockedCount = tiers.locked.length;
  const totalCount = tiers.free.length + tiers.locked.length + tiers.remaining.length;

  // 전환 유도 메시지 생성 (1-2위 무료 vs 3-10위 프리미엄)
  let conversionMessage = '';
  if (scoreDifference >= 15) {
    conversionMessage = `1-2위 무료 이름도 훌륭하지만, 3-10위 프리미엄 이름들은 더욱 완벽합니다!`;
  } else if (scoreDifference >= 5) {
    conversionMessage = `프리미엄 이름 8개로 더 많은 선택지를 확보하세요`;
  } else {
    conversionMessage = `3-10위 프리미엄 이름들도 최상위 품질입니다`;
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
 * Get rank label with emoji (2+8 structure)
 *
 * @param rank - Rank number (1-based)
 * @returns Formatted rank string
 */
export function getRankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return '🏆 1등 (무료)';
    case 2:
      return '🥈 2등 (무료)';
    case 3:
      return '🥉 3등 (프리미엄)';
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
      return `${rank}등 (프리미엄)`;
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
 * Get conversion messages based on metrics (2+8 structure)
 *
 * @param metrics - Psychological metrics
 * @returns Array of conversion message lines
 */
export function getConversionMessages(
  metrics: PsychologicalMetrics
): string[] {
  const messages: string[] = [];

  // 1-2위 무료 vs 3-10위 프리미엄 비교
  if (metrics.scoreDifference >= 10) {
    messages.push(
      `1-2위 무료 이름도 **${metrics.topScore}점**으로 훌륭합니다`,
      `하지만 3-10위 프리미엄 이름들은 더욱 완벽합니다`
    );
  } else {
    messages.push(
      `1-2위 무료 이름: **${metrics.topScore}점**, **${metrics.secondScore}점**`,
      `3-10위 프리미엄 이름: **${metrics.lockedTopScore}점** 부터 시작`
    );
  }

  // 볼륨 강조 (8개 프리미엄 이름)
  messages.push(
    `**${metrics.lockedCount}개**의 프리미엄 이름으로 더 많은 선택지를 확보하세요`
  );

  // 가치 강조
  messages.push(
    '평생 사용할 이름, 단 한 번의 투자로 완성하세요'
  );

  return messages;
}

/**
 * Calculate price value proposition (2+8 structure with 69,000원)
 *
 * @param totalCount - Total number of candidates
 * @param price - Price in KRW (default: 69,000원)
 * @returns Value message
 */
export function getValueProposition(
  totalCount: number,
  price: number = 69000
): string {
  const pricePerName = Math.round(price / 8); // 8개 프리미엄 이름 기준
  return `프리미엄 이름 8개, 이름 하나당 ${pricePerName.toLocaleString()}원`;
}
