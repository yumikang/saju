/**
 * Freemium Classification Utilities
 *
 * Classifies name candidates into 3 tiers:
 * - Blurred (1-4위): High scores shown, details blurred
 * - Free (5위): Fully accessible
 * - Locked (6+위): Completely hidden
 */

import type { ScoredCandidate } from '~/lib/naming/types';

// ============================================================
// Types
// ============================================================

export interface FreemiumTiers {
  blurred: ScoredCandidate[]; // 1-4위
  free: ScoredCandidate[];    // 5위
  locked: ScoredCandidate[];  // 6+ 위
}

export interface PsychologicalMetrics {
  topScore: number;           // 최고 점수 (1등)
  freeScore: number;          // 무료 점수 (5등)
  scoreDifference: number;    // 점수 차이
  percentageDiff: number;     // 퍼센트 차이
  lockedCount: number;        // 잠긴 후보 수
  totalCount: number;         // 전체 후보 수
  conversionMessage: string;  // 전환 유도 메시지
}

// ============================================================
// Classification Functions
// ============================================================

/**
 * Classify candidates into freemium tiers
 *
 * @param candidates - All candidates sorted by score (descending)
 * @returns FreemiumTiers object
 */
export function classifyCandidates(
  candidates: ScoredCandidate[]
): FreemiumTiers {
  // Sort by score descending (just in case)
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return {
    // 🔓 1-4위: 블러 프리뷰
    blurred: sorted.slice(0, 4),

    // 🆓 5위: 무료 공개
    free: sorted.slice(4, 5),

    // 🔒 6+위: 완전 잠금
    locked: sorted.slice(5),
  };
}

/**
 * Calculate psychological metrics for conversion optimization
 *
 * @param tiers - Classified freemium tiers
 * @returns PsychologicalMetrics
 */
export function calculatePsychologicalMetrics(
  tiers: FreemiumTiers
): PsychologicalMetrics {
  const topScore = tiers.blurred[0]?.scores.overall || 0;
  const freeScore = tiers.free[0]?.scores.overall || 0;
  const scoreDifference = Math.round(topScore - freeScore);
  const percentageDiff = freeScore > 0
    ? Math.round(((topScore - freeScore) / freeScore) * 100)
    : 0;

  const lockedCount = tiers.locked.length;
  const totalCount = tiers.blurred.length + tiers.free.length + tiers.locked.length;

  // 전환 유도 메시지 생성
  let conversionMessage = '';
  if (scoreDifference >= 20) {
    conversionMessage = `1등 이름은 무료 이름보다 무려 ${scoreDifference}점이나 더 높습니다!`;
  } else if (scoreDifference >= 10) {
    conversionMessage = `1등 이름은 ${scoreDifference}점 더 완벽한 조화를 이룹니다`;
  } else {
    conversionMessage = `TOP 4 이름들은 최상위 품질입니다`;
  }

  return {
    topScore,
    freeScore,
    scoreDifference,
    percentageDiff,
    lockedCount,
    totalCount,
    conversionMessage,
  };
}

/**
 * Get rank label with emoji
 *
 * @param rank - Rank number (1-based)
 * @returns Formatted rank string
 */
export function getRankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return '🏆 1등';
    case 2:
      return '🥈 2등';
    case 3:
      return '🥉 3등';
    case 4:
      return '4등';
    case 5:
      return '🎁 5등 (무료)';
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
 * Get conversion message based on metrics
 *
 * @param metrics - Psychological metrics
 * @returns Array of conversion message lines
 */
export function getConversionMessages(
  metrics: PsychologicalMetrics
): string[] {
  const messages: string[] = [];

  // 점수 차이 강조
  if (metrics.scoreDifference >= 20) {
    messages.push(
      `1등 이름이 무려 **${metrics.topScore}점**입니다!`,
      `무료 이름보다 **${metrics.scoreDifference}점** 더 높은 완벽한 조화`
    );
  } else if (metrics.scoreDifference >= 10) {
    messages.push(
      `최고 점수는 **${metrics.topScore}점**`,
      `무료 이름보다 ${metrics.scoreDifference}점 더 완벽합니다`
    );
  }

  // 볼륨 강조
  if (metrics.lockedCount > 40) {
    messages.push(
      `추가로 **${metrics.lockedCount}개**의 이름이 더 있습니다`
    );
  } else if (metrics.lockedCount > 20) {
    messages.push(
      `${metrics.lockedCount}개의 추가 이름을 확인하세요`
    );
  }

  // 가치 강조
  messages.push(
    '평생 사용할 이름, 단 한 번의 투자로 완성하세요'
  );

  return messages;
}

/**
 * Calculate price value proposition
 *
 * @param totalCount - Total number of candidates
 * @param price - Price in KRW
 * @returns Value message
 */
export function getValueProposition(
  totalCount: number,
  price: number = 9900
): string {
  const pricePerName = Math.round(price / totalCount);
  return `이름 하나당 단 ${pricePerName}원, 총 ${totalCount}개의 완벽한 이름`;
}
