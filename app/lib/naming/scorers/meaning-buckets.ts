/**
 * Meaning Buckets System (의미 버킷 시스템)
 *
 * 중립적 의미의 한자들을 버킷으로 분류하고,
 * 부모의 가치관에 따라 차등 점수를 부여합니다.
 *
 * 예시:
 * - "한가할" 閒: peace/health 지향이면 +점수, success/wealth 지향이면 -점수
 * - "빠를" 快: success 지향이면 +점수, peace 지향이면 중립/소폭-
 */

import type { ParentValue } from '~/components/naming/ValueSelector';

/**
 * 의미 버킷 정의
 */
export interface MeaningBucket {
  name: string;                    // 버킷 이름
  description: string;              // 설명
  tokens: string[];                 // 키워드 토큰
  positiveValues: ParentValue[];    // 가점 받는 가치들
  negativeValues: ParentValue[];    // 감점 받는 가치들
  baseScore: number;                // 기본 점수 (중립)
  positiveBonus: number;            // 긍정 가치 매칭 시 가점
  negativePenalty: number;          // 부정 가치 매칭 시 감점
}

/**
 * 중립적 의미 버킷 목록
 */
export const MEANING_BUCKETS: MeaningBucket[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. CALM (한가함, 평온, 여유)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'calm',
    description: '한가함, 평온, 여유, 고요함',
    tokens: ['한가', '여유', '평온', '고요', '정적', '안온', '휴식', '느긋', '유유자적'],
    positiveValues: ['peace', 'health'],
    negativeValues: ['success', 'wealth'],
    baseScore: 2,          // 기본은 약한 가점
    positiveBonus: 8,      // peace/health 선택 시 +8점
    negativePenalty: -5    // success/wealth 선택 시 -5점
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. ENERGETIC (활발함, 빠름, 역동)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'energetic',
    description: '활발함, 빠름, 역동적',
    tokens: ['빠를', '민첩', '활발', '활기', '역동', '신속', '경쾌', '날쌔'],
    positiveValues: ['success', 'popularity'],
    negativeValues: ['peace'],
    baseScore: 3,          // 기본 약간 긍정
    positiveBonus: 7,      // success/popularity 선택 시 +7점
    negativePenalty: -3    // peace 선택 시 -3점
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. NOBLE (고귀함, 귀족적, 우아)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'noble',
    description: '고귀함, 귀족적, 우아함',
    tokens: ['고귀', '귀족', '우아', '품위', '품격', '격조', '고상', '기품'],
    positiveValues: ['success', 'wisdom'],
    negativeValues: [],
    baseScore: 4,          // 기본적으로 긍정
    positiveBonus: 6,      // success/wisdom 선택 시 +6점
    negativePenalty: 0     // 부정 없음
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. PRACTICAL (실용적, 현실적)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'practical',
    description: '실용적, 현실적, 실속있는',
    tokens: ['실용', '실속', '현실', '유용', '효율', '편리', '쓸모', '실질'],
    positiveValues: ['wealth', 'wisdom'],
    negativeValues: [],
    baseScore: 3,          // 기본 긍정
    positiveBonus: 5,      // wealth/wisdom 선택 시 +5점
    negativePenalty: 0     // 부정 없음
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. SIMPLE (소박함, 단순함)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'simple',
    description: '소박함, 단순함, 꾸밈없음',
    tokens: ['소박', '단순', '꾸밈없', '수수', '담백', '청빈', '검소', '순박'],
    positiveValues: ['peace', 'health'],
    negativeValues: ['wealth', 'success'],
    baseScore: 1,          // 기본 중립~약간 긍정
    positiveBonus: 7,      // peace/health 선택 시 +7점
    negativePenalty: -4    // wealth/success 선택 시 -4점
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. STRONG (강함, 힘)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'strong',
    description: '강함, 힘, 강건함',
    tokens: ['강할', '굳셀', '힘', '강인', '강건', '용맹', '씩씩', '억센'],
    positiveValues: ['success', 'health'],
    negativeValues: [],
    baseScore: 5,          // 기본적으로 긍정
    positiveBonus: 7,      // success/health 선택 시 +7점
    negativePenalty: 0     // 부정 없음
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. GENTLE (부드러움, 온화)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'gentle',
    description: '부드러움, 온화함, 온순함',
    tokens: ['부드러울', '온화', '온순', '유순', '상냥', '따뜻', '온유', '자애'],
    positiveValues: ['peace', 'popularity', 'health'],
    negativeValues: [],
    baseScore: 4,          // 기본 긍정
    positiveBonus: 6,      // peace/popularity/health 선택 시 +6점
    negativePenalty: 0     // 부정 없음
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. SOLITARY (고독, 홀로, 독립)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'solitary',
    description: '고독, 홀로, 독립적',
    tokens: ['홀로', '혼자', '고독', '독립', '외로', '적막', '쓸쓸', '고고'],
    positiveValues: ['wisdom'],
    negativeValues: ['popularity', 'peace'],
    baseScore: -2,         // 기본 약간 부정
    positiveBonus: 5,      // wisdom 선택 시 +5점
    negativePenalty: -6    // popularity/peace 선택 시 -6점
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. COMPETITIVE (경쟁적, 승부)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'competitive',
    description: '경쟁적, 승부욕',
    tokens: ['다툴', '경쟁', '겨룰', '승부', '대결', '시합', '경기', '겨루'],
    positiveValues: ['success'],
    negativeValues: ['peace', 'popularity'],
    baseScore: 0,          // 기본 중립
    positiveBonus: 6,      // success 선택 시 +6점
    negativePenalty: -5    // peace/popularity 선택 시 -5점
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. GRAND (웅장함, 거대)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: 'grand',
    description: '웅장함, 거대함, 장엄',
    tokens: ['웅장', '거대', '장대', '거창', '장엄', '장려', '굉장', '막대'],
    positiveValues: ['success', 'wealth'],
    negativeValues: ['peace'],
    baseScore: 3,          // 기본 약간 긍정
    positiveBonus: 7,      // success/wealth 선택 시 +7점
    negativePenalty: -3    // peace 선택 시 -3점
  }
];

/**
 * 의미에 매칭되는 버킷 찾기
 */
export function findMatchingBucket(meaning: string): MeaningBucket | null {
  if (!meaning) return null;

  for (const bucket of MEANING_BUCKETS) {
    const hasMatch = bucket.tokens.some(token => meaning.includes(token));
    if (hasMatch) {
      return bucket;
    }
  }

  return null;
}

/**
 * 버킷 기반 가치 점수 계산
 *
 * @param meaning - 한자 의미
 * @param parentValues - 부모가 선택한 가치들
 * @returns 상황 가중치 점수 (-10 ~ +10)
 */
export function calculateBucketScore(
  meaning: string,
  parentValues: ParentValue[]
): number {
  const bucket = findMatchingBucket(meaning);

  if (!bucket) {
    return 0; // 매칭되는 버킷 없음
  }

  // 부모 가치가 없으면 기본 점수 반환
  if (!parentValues || parentValues.length === 0) {
    return bucket.baseScore;
  }

  let score = bucket.baseScore;

  // 긍정 가치 매칭 확인
  const hasPositiveMatch = parentValues.some(value =>
    bucket.positiveValues.includes(value)
  );

  // 부정 가치 매칭 확인
  const hasNegativeMatch = parentValues.some(value =>
    bucket.negativeValues.includes(value)
  );

  if (hasPositiveMatch) {
    score += bucket.positiveBonus;
  }

  if (hasNegativeMatch) {
    score += bucket.negativePenalty; // negativePenalty는 이미 음수
  }

  return score;
}

/**
 * 이름 전체에 대한 버킷 점수 계산
 *
 * @param characters - 이름 한자들
 * @param parentValues - 부모가 선택한 가치들
 * @returns 평균 버킷 점수 (-10 ~ +10)
 */
export function calculateNameBucketScore(
  characters: Array<{ meaning: string }>,
  parentValues: ParentValue[]
): number {
  const scores = characters.map(char =>
    calculateBucketScore(char.meaning, parentValues)
  );

  // 평균 점수
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / characters.length;

  return averageScore;
}

/**
 * 버킷 점수를 0-100 범위로 정규화
 *
 * @param bucketScore - 버킷 점수 (-10 ~ +10)
 * @returns 정규화된 점수 (0-100)
 */
export function normalizeBucketScore(bucketScore: number): number {
  // -10 ~ +10 범위를 0 ~ 100으로 매핑
  // -10 → 0
  //   0 → 50
  // +10 → 100
  return ((bucketScore + 10) / 20) * 100;
}
