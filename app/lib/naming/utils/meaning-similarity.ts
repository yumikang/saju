/**
 * Korean Hanja Meaning Similarity Algorithm
 *
 * Computes semantic similarity between Korean hanja meaning strings using:
 * 1. Korean token-based Jaccard similarity
 * 2. Meaning preprocessing (space/slash normalization)
 * 3. Penalty mapping based on similarity ranges
 *
 * Example:
 * - meaning1: "깃들일" (棲)
 * - meaning2: "깃계할" (栖)
 * Expected output: { similarity: 0.5, penalty: -10, explanation: "부분 유사" }
 */

/**
 * 의미 문자열 전처리
 *
 * 목적: 공백, 슬래시로 의미를 토큰화
 * 규칙:
 * - 슬래시(/) 기준 분할: "살피다/살펴보다" → ["살피다", "살펴보다"]
 * - 공백 제거: 각 토큰 좌우 공백 트림
 * - 중복 제거 및 빈 문자열 필터링
 *
 * @param meaning - 원본 의미 문자열 (예: "깃들일" 또는 "살피다/살펴보다")
 * @returns 정규화된 토큰 배열
 *
 * Pseudo-code:
 * ```
 * function preprocessMeaning(meaning: string): string[] {
 *   // Step 1: 슬래시로 1차 분할
 *   parts = meaning.split('/')
 *
 *   // Step 2: 각 부분의 공백 제거
 *   tokens = []
 *   for part in parts:
 *     trimmed = part.trim()
 *     if trimmed.length > 0:
 *       tokens.append(trimmed)
 *
 *   // Step 3: 중복 제거 (Set 이용)
 *   return Array.from(new Set(tokens))
 * }
 * ```
 */
export function preprocessMeaning(meaning: string): string[] {
  // 슬래시 기준 분할
  const parts = meaning.split('/');

  // 공백 제거 및 빈 문자열 필터링
  const tokens = parts
    .map(part => part.trim())
    .filter(part => part.length > 0);

  // 중복 제거
  return Array.from(new Set(tokens));
}

/**
 * Jaccard Similarity 계산 (한국어 토큰 기반)
 *
 * 공식: |A ∩ B| / |A ∪ B|
 * - A: meaning1의 토큰 집합
 * - B: meaning2의 토큰 집합
 *
 * 예시:
 * - meaning1 = "깃들일" → tokens1 = ["깃들일"]
 * - meaning2 = "깃계할" → tokens2 = ["깃계할"]
 * - 교집합: 0 (공통 토큰 없음)
 * - 합집합: 2
 * - similarity = 0 / 2 = 0.0
 *
 * @param meaning1 - 첫 번째 의미 문자열
 * @param meaning2 - 두 번째 의미 문자열
 * @returns Jaccard 유사도 (0.0 ~ 1.0)
 *
 * Pseudo-code:
 * ```
 * function calculateJaccardSimilarity(meaning1: string, meaning2: string): number {
 *   // Step 1: 전처리
 *   tokens1 = Set(preprocessMeaning(meaning1))
 *   tokens2 = Set(preprocessMeaning(meaning2))
 *
 *   // Step 2: 교집합 계산
 *   intersection = tokens1 ∩ tokens2
 *   intersectionSize = intersection.size
 *
 *   // Step 3: 합집합 계산
 *   union = tokens1 ∪ tokens2
 *   unionSize = union.size
 *
 *   // Step 4: 엣지 케이스 처리
 *   if unionSize === 0:
 *     return 1.0  // 둘 다 빈 문자열
 *
 *   // Step 5: Jaccard 계산
 *   return intersectionSize / unionSize
 * }
 * ```
 */
export function calculateJaccardSimilarity(meaning1: string, meaning2: string): number {
  // 전처리
  const tokens1 = new Set(preprocessMeaning(meaning1));
  const tokens2 = new Set(preprocessMeaning(meaning2));

  // 교집합
  const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
  const intersectionSize = intersection.size;

  // 합집합
  const union = new Set([...tokens1, ...tokens2]);
  const unionSize = union.size;

  // 엣지 케이스: 둘 다 빈 문자열
  if (unionSize === 0) {
    return 1.0;
  }

  // Jaccard 유사도
  return intersectionSize / unionSize;
}

/**
 * 유사도 점수에 따른 패널티 매핑
 *
 * 규칙:
 * - 0.7 이상: 매우 유사 (high similarity) → -20점
 * - 0.4~0.7: 부분 유사 (partial similarity) → -10점
 * - 0.4 미만: 다양함 (diverse) → 0점
 *
 * 논리:
 * 의미가 유사할수록 서로 다른 한자들 사이에 중복성이 높으므로
 * 이름에서 다양성을 해치는 것으로 판단하여 패널티 부여
 *
 * @param similarity - Jaccard 유사도 (0.0 ~ 1.0)
 * @returns 적용할 패널티 점수 (-20 ~ 0)
 *
 * Pseudo-code:
 * ```
 * function calculateSimilarityPenalty(similarity: number): number {
 *   if similarity >= 0.7:
 *     return -20  // 매우 유사
 *   else if similarity >= 0.4:
 *     return -10  // 부분 유사
 *   else:
 *     return 0    // 다양함
 * }
 * ```
 */
export function calculateSimilarityPenalty(similarity: number): number {
  if (similarity >= 0.7) {
    return -20; // 매우 유사
  } else if (similarity >= 0.4) {
    return -10; // 부분 유사
  } else {
    return 0; // 다양함
  }
}

/**
 * 유사도 점수를 설명 문자열로 변환
 *
 * @param similarity - Jaccard 유사도
 * @returns 가독성 있는 설명 문자열
 *
 * Pseudo-code:
 * ```
 * function describeSimilarity(similarity: number): string {
 *   if similarity >= 0.7:
 *     return "매우 유사"
 *   else if similarity >= 0.4:
 *     return "부분 유사"
 *   else:
 *     return "다양함"
 * }
 * ```
 */
export function describeSimilarity(similarity: number): string {
  if (similarity >= 0.7) {
    return '매우 유사';
  } else if (similarity >= 0.4) {
    return '부분 유사';
  } else {
    return '다양함';
  }
}

/**
 * 한자 의미 유사도 분석 결과 타입
 */
export interface MeaningSimilarityResult {
  similarity: number; // Jaccard 유사도 (0.0 ~ 1.0)
  penalty: number; // 패널티 점수 (-20 ~ 0)
  explanation: string; // 설명 문자열
  tokens1: string[]; // meaning1의 토큰
  tokens2: string[]; // meaning2의 토큰
}

/**
 * 메인 함수: 두 의미 문자열의 유사도 계산 및 패널티 반환
 *
 * 워크플로우:
 * 1. 입력 검증 (null/undefined 체크)
 * 2. 의미 문자열 전처리 (토큰화)
 * 3. Jaccard 유사도 계산
 * 4. 유사도에 따른 패널티 계산
 * 5. 설명 문자열 생성
 * 6. 결과 반환
 *
 * @param meaning1 - 첫 번째 한자의 의미 (예: "깃들일")
 * @param meaning2 - 두 번째 한자의 의미 (예: "깃계할")
 * @returns 유사도 분석 결과 객체
 *
 * 예시:
 * ```
 * const result = analyzeMeaningSimilarity("깃들일", "깃계할");
 * // {
 * //   similarity: 0.0,
 * //   penalty: 0,
 * //   explanation: "다양함",
 * //   tokens1: ["깃들일"],
 * //   tokens2: ["깃계할"]
 * // }
 * ```
 *
 * Pseudo-code:
 * ```
 * function analyzeMeaningSimilarity(
 *   meaning1: string,
 *   meaning2: string
 * ): MeaningSimilarityResult {
 *   // Step 1: 입력 검증
 *   if meaning1 is null/undefined or meaning2 is null/undefined:
 *     return default result (similarity 0, penalty 0)
 *
 *   // Step 2: 토큰화
 *   tokens1 = preprocessMeaning(meaning1)
 *   tokens2 = preprocessMeaning(meaning2)
 *
 *   // Step 3: Jaccard 유사도 계산
 *   similarity = calculateJaccardSimilarity(meaning1, meaning2)
 *
 *   // Step 4: 패널티 계산
 *   penalty = calculateSimilarityPenalty(similarity)
 *
 *   // Step 5: 설명 생성
 *   explanation = describeSimilarity(similarity)
 *
 *   // Step 6: 결과 반환
 *   return {
 *     similarity: similarity,
 *     penalty: penalty,
 *     explanation: explanation,
 *     tokens1: tokens1,
 *     tokens2: tokens2
 *   }
 * }
 * ```
 */
export function analyzeMeaningSimilarity(
  meaning1?: string,
  meaning2?: string
): MeaningSimilarityResult {
  // 입력 검증: null/undefined만 체크 (빈 문자열은 유효함)
  if (meaning1 === null || meaning1 === undefined ||
      meaning2 === null || meaning2 === undefined) {
    return {
      similarity: 0,
      penalty: 0,
      explanation: '입력 부족',
      tokens1: [],
      tokens2: [],
    };
  }

  // 토큰화
  const tokens1 = preprocessMeaning(meaning1);
  const tokens2 = preprocessMeaning(meaning2);

  // Jaccard 유사도 계산
  const similarity = calculateJaccardSimilarity(meaning1, meaning2);

  // 패널티 계산
  const penalty = calculateSimilarityPenalty(similarity);

  // 설명 생성
  const explanation = describeSimilarity(similarity);

  return {
    similarity,
    penalty,
    explanation,
    tokens1,
    tokens2,
  };
}

/**
 * 배치 처리: 여러 의미 쌍의 유사도를 일괄 계산
 *
 * 사용 사례: 한자 이름 후보 추천 시 의미 다양성 평가
 *
 * @param pairs - 의미 쌍 배열 [(meaning1, meaning2), ...]
 * @returns 유사도 결과 배열
 *
 * Pseudo-code:
 * ```
 * function analyzeMeaningSimilarityBatch(
 *   pairs: Array<[string, string]>
 * ): MeaningSimilarityResult[] {
 *   results = []
 *   for (meaning1, meaning2) in pairs:
 *     result = analyzeMeaningSimilarity(meaning1, meaning2)
 *     results.append(result)
 *   return results
 * }
 * ```
 */
export function analyzeMeaningSimilarityBatch(
  pairs: Array<[string, string]>
): MeaningSimilarityResult[] {
  return pairs.map(([meaning1, meaning2]) =>
    analyzeMeaningSimilarity(meaning1, meaning2)
  );
}

/**
 * 이름 후보 두 글자의 의미 다양성 평가
 *
 * 사용 사례:
 * - 작명 시 이름 두 글자의 의미가 얼마나 다양한지 평가
 * - 점수: 유사도가 낮을수록 (다양할수록) 좋음
 *
 * @param char1Meaning - 첫 번째 글자의 의미
 * @param char2Meaning - 두 번째 글자의 의미
 * @returns 다양성 점수 (0-100, 높을수록 다양함)
 *
 * Pseudo-code:
 * ```
 * function calculateMeaningDiversityScore(
 *   char1Meaning: string,
 *   char2Meaning: string
 * ): number {
 *   result = analyzeMeaningSimilarity(char1Meaning, char2Meaning)
 *   // 유사도가 낮을수록 다양성 점수가 높음
 *   // similarity 0.0 → diversity 100
 *   // similarity 1.0 → diversity 0
 *   diversityScore = (1.0 - result.similarity) * 100
 *   return Math.round(diversityScore)
 * }
 * ```
 */
export function calculateMeaningDiversityScore(
  char1Meaning?: string,
  char2Meaning?: string
): number {
  // null/undefined만 체크 (빈 문자열은 유효함)
  if (char1Meaning === null || char1Meaning === undefined ||
      char2Meaning === null || char2Meaning === undefined) {
    return 50; // 중립적 점수
  }

  const result = analyzeMeaningSimilarity(char1Meaning, char2Meaning);
  const diversityScore = (1.0 - result.similarity) * 100;
  return Math.round(diversityScore);
}
