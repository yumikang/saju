/**
 * Renaming Service Freemium Classification Utilities
 *
 * Classifies renaming name candidates into strategic freemium structure:
 * - Free (11-12위): Lower-tier preview, no payment required (emerald theme)
 * - Locked (1-10위): Premium top names, require payment (yellow theme)
 * - Remaining: Stored but not initially displayed
 *
 * Adapts the proven naming service freemium-v2 pattern for renaming context.
 */

import type { ScoredCandidate } from '~/lib/naming/types';

// ============================================================
// Renaming-Specific Types
// ============================================================

/**
 * Renaming Freemium Tiers
 * Same structure as naming service for consistency
 */
export interface RenamingFreemiumTiers {
  free: ScoredCandidate[];    // 11-12위: Free preview names (emerald theme)
  locked: ScoredCandidate[];  // 1-10위: Premium names (yellow theme, top 10)
  remaining: ScoredCandidate[]; // 13+위: Additional names
}

/**
 * Psychological Metrics for Renaming Conversion
 * Emphasizes improvement from current name
 */
export interface RenamingPsychologicalMetrics {
  topScore: number;           // 최고 점수 (1등)
  secondScore: number;        // 2등 점수
  lockedTopScore: number;     // 잠긴 이름 최고 점수 (1등)
  freeTopScore: number;       // 무료 이름 최고 점수 (11등)
  scoreDifference: number;    // 1등 vs 11등 점수 차이
  percentageDiff: number;     // 퍼센트 차이
  lockedCount: number;        // 잠긴 프리미엄 이름 수 (10개)
  totalCount: number;         // 전체 후보 수
  conversionMessage: string;  // 전환 유도 메시지
  currentNameScore?: number;  // 현재 이름 점수 (optional, for comparison)
  improvementFromCurrent?: number; // 1등이 현재보다 몇 점 개선되는지
}

// ============================================================
// Classification Functions
// ============================================================

/**
 * Classify renaming candidates into strategic freemium tiers
 *
 * @param candidates - All renaming candidates sorted by score (descending)
 * @returns RenamingFreemiumTiers object with free (11-12) + locked (1-10) + remaining
 */
export function classifyRenamingCandidates(
  candidates: ScoredCandidate[]
): RenamingFreemiumTiers {
  // Sort by score descending (just in case)
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return {
    // 🔒 1-10위: 프리미엄 잠금 (Top 10 premium names)
    locked: sorted.slice(0, 10),

    // 🆓 11-12위: 무료 공개 (Free preview, lower tier)
    free: sorted.slice(10, 12),

    // 📦 13+위: 추가 이름 (Remaining names)
    remaining: sorted.slice(12),
  };
}

/**
 * Calculate psychological metrics for renaming conversion optimization
 *
 * @param tiers - Classified renaming freemium tiers
 * @param currentNameScore - Optional current name score for improvement messaging
 * @returns RenamingPsychologicalMetrics
 */
export function calculateRenamingPsychologicalMetrics(
  tiers: RenamingFreemiumTiers,
  currentNameScore?: number
): RenamingPsychologicalMetrics {
  const topScore = tiers.locked[0]?.scores.overall || 0;  // 1위 (프리미엄)
  const secondScore = tiers.locked[1]?.scores.overall || 0;  // 2위 (프리미엄)
  const lockedTopScore = tiers.locked[0]?.scores.overall || 0;  // 프리미엄 최고점
  const freeTopScore = tiers.free[0]?.scores.overall || 0;  // 11위 (무료)
  const scoreDifference = Math.round(topScore - freeTopScore);
  const percentageDiff = freeTopScore > 0
    ? Math.round(((topScore - freeTopScore) / freeTopScore) * 100)
    : 0;

  const lockedCount = tiers.locked.length;
  const totalCount = tiers.free.length + tiers.locked.length + tiers.remaining.length;

  // 현재 이름 대비 개선도 계산
  const improvementFromCurrent = currentNameScore
    ? Math.round(topScore - currentNameScore)
    : undefined;

  // 전환 유도 메시지 생성 (개명 특화)
  let conversionMessage = '';
  if (improvementFromCurrent && improvementFromCurrent >= 20) {
    conversionMessage = `1위 이름은 현재보다 ${improvementFromCurrent}점이나 개선된 완벽한 이름입니다!`;
  } else if (scoreDifference >= 15) {
    conversionMessage = `1위 이름은 무료 이름보다 ${scoreDifference}점이나 높은 최고의 선택입니다!`;
  } else if (scoreDifference >= 10) {
    conversionMessage = `프리미엄 10개 이름으로 인생의 새 출발을 준비하세요`;
  } else {
    conversionMessage = `1-10위 프리미엄 이름들은 개명에 최적화된 최상위 품질입니다`;
  }

  return {
    topScore,
    secondScore,
    lockedTopScore,
    freeTopScore,
    scoreDifference,
    percentageDiff,
    lockedCount,
    totalCount,
    conversionMessage,
    currentNameScore,
    improvementFromCurrent,
  };
}

/**
 * Get renaming rank label with emoji
 *
 * @param rank - Rank number (1-based)
 * @returns Formatted rank string
 */
export function getRenamingRankLabel(rank: number): string {
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
    case 10:
      return `${rank}등 (프리미엄)`;
    case 11:
      return '11등 (무료 체험)';
    case 12:
      return '12등 (무료 체험)';
    default:
      return `${rank}등`;
  }
}

/**
 * Get renaming conversion messages based on metrics
 *
 * @param metrics - Renaming psychological metrics
 * @returns Array of conversion message lines
 */
export function getRenamingConversionMessages(
  metrics: RenamingPsychologicalMetrics
): string[] {
  const messages: string[] = [];

  // 현재 이름 대비 개선 강조
  if (metrics.improvementFromCurrent && metrics.improvementFromCurrent >= 20) {
    messages.push(
      `현재 이름보다 **${metrics.improvementFromCurrent}점** 더 좋은 이름으로 인생을 바꾸세요!`,
      `프리미엄 최고 점수: **${metrics.topScore}점** (현재: ${metrics.currentNameScore}점)`
    );
  } else if (metrics.improvementFromCurrent && metrics.improvementFromCurrent >= 10) {
    messages.push(
      `새 이름으로 **${metrics.improvementFromCurrent}점** 향상된 운을 만나세요`,
      `프리미엄 최고 점수: **${metrics.topScore}점**`
    );
  }

  // 무료 vs 프리미엄 비교
  if (metrics.scoreDifference >= 15) {
    messages.push(
      `무료 이름도 좋지만, 1위 이름은 **${metrics.scoreDifference}점**이나 더 높습니다!`,
      `프리미엄 1-10위는 **${metrics.topScore}점**부터 시작합니다`
    );
  } else if (metrics.scoreDifference >= 10) {
    messages.push(
      `1-10위 프리미엄 이름은 **${metrics.topScore}점**부터 시작합니다`,
      `무료 이름보다 평균 **${metrics.scoreDifference}점** 더 높은 조화`
    );
  }

  // 볼륨 강조 (10개 프리미엄 이름)
  messages.push(
    `**${metrics.lockedCount}개**의 최고 점수 이름 중에서 새로운 인생의 이름을 선택하세요`
  );

  // 개명 특화 가치 강조
  messages.push(
    '개명은 인생의 전환점, 최고의 이름으로 새 출발하세요'
  );

  return messages;
}

/**
 * Calculate renaming value proposition
 *
 * @param price - Price in KRW (default: 120,000원 for renaming)
 * @returns Value message
 */
export function getRenamingValueProposition(price: number = 120000): string {
  const pricePerName = Math.round(price / 10); // 10개 프리미엄 이름 기준
  return `프리미엄 10개 이름, 이름 하나당 ${pricePerName.toLocaleString()}원으로 인생 재설계`;
}

/**
 * Check if user has premium access for specific renaming session
 *
 * @param isPremium - Premium status from store
 * @param sessionIdPurchased - Purchased session ID from store
 * @param currentSessionId - Current session ID
 * @returns boolean
 */
export function hasRenamingPremiumAccess(
  isPremium: boolean,
  sessionIdPurchased: string | null,
  currentSessionId: string | null
): boolean {
  return isPremium && sessionIdPurchased !== null && sessionIdPurchased === currentSessionId;
}
