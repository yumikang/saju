/**
 * Tie-breaker Sorting
 *
 * 동점 이름들의 순위를 안정적으로 결정하는 정렬 로직
 */

export interface TieBreakable {
  totalScore: number;
  nameFrequency?: number | null;
  usageFrequency?: number | null;
  strokeCount?: number | null;
  stableId?: string;
}

/**
 * Tie-breaker 정렬 함수
 *
 * 정렬 우선순위:
 * 1. totalScore (desc) - 전체 점수 높은 순
 * 2. nameFrequency (desc) - 이름 사용 빈도 높은 순
 * 3. usageFrequency (desc) - 일반 사용 빈도 높은 순
 * 4. strokeCount (asc) - 획수 짧은 순
 * 5. stableId (asc) - 결정론적 ID 순
 *
 * @param arr - 정렬할 배열
 * @returns 정렬된 새 배열
 */
export function tieBreakSort<T extends TieBreakable>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    // 1) totalScore desc
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    // 2) nameFrequency desc
    const nfA = a.nameFrequency ?? 0;
    const nfB = b.nameFrequency ?? 0;
    if (nfB !== nfA) {
      return nfB - nfA;
    }

    // 3) usageFrequency desc
    const ufA = a.usageFrequency ?? 0;
    const ufB = b.usageFrequency ?? 0;
    if (ufB !== ufA) {
      return ufB - ufA;
    }

    // 4) strokeShorterFirst asc (nulls last)
    const sA = a.strokeCount ?? Number.POSITIVE_INFINITY;
    const sB = b.strokeCount ?? Number.POSITIVE_INFINITY;
    if (sA !== sB) {
      return sA - sB;
    }

    // 5) stableId asc (deterministic)
    const idA = a.stableId ?? '';
    const idB = b.stableId ?? '';
    if (idA < idB) return -1;
    if (idA > idB) return 1;
    return 0;
  });
}

/**
 * Generate stable ID from character IDs
 *
 * @param id1 - First character ID
 * @param id2 - Second character ID
 * @returns Stable deterministic string
 */
export function generateStableId(id1: number, id2: number): string {
  return `${id1}_${id2}`;
}
