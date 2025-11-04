/**
 * 발음 자연스러움 평가 시스템
 *
 * 한국 이름에서 자주 사용되는 음절과 조합 패턴을 기반으로
 * 발음의 자연스러움을 평가합니다.
 */

import syllableWhitelistData from '../data/syllable-whitelist.json';
import bigramSeedData from '../data/bigram-seed.json';
import awkwardBigramsData from '../data/awkward-bigrams.json';

/**
 * 화이트리스트: 자연스러운 음절 (패널티 미적용)
 */
const SYLLABLE_WHITELIST = new Set(syllableWhitelistData.syllables);

/**
 * 빅램(음절 쌍) 보너스 맵
 */
const BIGRAM_BONUS_MAP = new Map<string, number>();
bigramSeedData.bigrams.forEach(({ pair, weight }) => {
  const key = pair.join('');
  BIGRAM_BONUS_MAP.set(key, weight * 1.0); // weight * 1.0 = bonus score
});

/**
 * 낯선/부자연스러운 빅램 패널티 맵
 */
const AWKWARD_BIGRAM_MAP = new Map<string, number>();
awkwardBigramsData.awkwardPairs.forEach(({ pair, penalty }) => {
  const key = pair.join('');
  AWKWARD_BIGRAM_MAP.set(key, penalty);
});

/**
 * 한국 이름에서 매우 흔한 음절들 (TOP 200)
 * 2020-2024 출생신고 데이터 기반
 */
const VERY_COMMON_SYLLABLES = new Set([
  // ㄱ
  '가', '강', '건', '경', '계', '고', '곤', '곽', '관', '광', '교', '구', '국', '군', '궁', '권', '귀', '규', '근', '금', '기', '김', '길',
  // ㄴ
  '나', '남', '내', '노', '누', '뉴', '니',
  // ㄷ
  '다', '단', '달', '담', '당', '대', '덕', '도', '독', '동', '두', '득', '등',
  // ㄹ
  '라', '란', '람', '랑', '래', '량', '려', '련', '렬', '령', '례', '로', '록', '론', '료', '룡', '루', '류', '륜', '률', '리', '림', '린',
  // ㅁ
  '마', '만', '말', '망', '매', '맥', '면', '명', '모', '목', '몽', '무', '문', '물', '미', '민',
  // ㅂ
  '박', '반', '발', '방', '배', '백', '범', '법', '변', '별', '병', '보', '복', '본', '봉', '부', '분', '불', '비', '빈', '빛',
  // ㅅ
  '사', '산', '살', '삼', '상', '새', '샘', '서', '석', '선', '설', '섭', '성', '세', '소', '속', '손', '솔', '송', '수', '숙', '순', '술', '숭', '슬', '승', '시', '신', '실', '심',
  // ㅇ
  '아', '안', '암', '양', '언', '여', '연', '열', '염', '엽', '영', '예', '오', '온', '완', '요', '용', '우', '운', '울', '원', '월', '위', '유', '육', '윤', '율', '은', '을', '음', '의', '이', '인', '일', '임',
  // ㅈ
  '자', '작', '잔', '장', '재', '저', '전', '절', '점', '정', '제', '조', '종', '주', '준', '줄', '중', '지', '진', '질', '집',
  // ㅊ
  '차', '찬', '창', '채', '천', '철', '첨', '청', '초', '최', '추', '충', '춘', '출', '치',
  // ㅋ
  '쾌', '큰',
  // ㅌ
  '탁', '태', '택', '토', '통',
  // ㅍ
  '파', '판', '팔', '패', '평', '포', '표', '풍', '필',
  // ㅎ
  '하', '한', '함', '합', '항', '해', '행', '향', '헌', '현', '혁', '협', '형', '혜', '호', '홍', '화', '환', '활', '황', '회', '효', '후', '훈', '휘', '희', '흠', '흥'
]);

/**
 * 드문 음절들 (발음하기 어렵거나 이름에서 거의 사용되지 않음)
 */
const RARE_SYLLABLES = new Set([
  // 이중모음 + 복잡한 받침
  '뫼', '쇄', '쉐', '쾨', '튀', '퀴', '귀', '뷔',
  // 복잡한 자음 조합
  '깝', '꺾', '꼍', '뜻', '씩', '쫓', '찧', '퀭',
  // 거의 안 쓰이는 음절
  '갚', '껍', '껴', '꿰', '늬', '띄', '뜨', '뭉', '쁨', '쁴', '쭈', '쯤', '쩍', '찌', '퀘', '툼', '튼', '틔', '픔'
]);

/**
 * 부자연스러운 음절 조합 패턴
 * (첫 음절, 둘째 음절)의 조합이 어색한 케이스
 */
const AWKWARD_COMBINATIONS: Array<[RegExp, RegExp]> = [
  // 같은 자음 연속 (단, ㄱ-ㄱ, ㄷ-ㄷ, ㅂ-ㅂ 정도는 허용)
  [/^[ㅉㅊㅋㅌㅍㅎ]/, /^[ㅉㅊㅋㅌㅍㅎ]/], // 강한 자음 연속

  // 같은 모음 연속
  [/[ㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢ]$/, /[ㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢ]$/], // 복잡한 모음 연속
];

/**
 * 음절의 자연스러움 점수 계산
 *
 * @param syllable - 평가할 음절
 * @returns 0-100 점수 (100: 매우 자연스러움, 0: 매우 부자연스러움)
 */
export function scoreSyllableNaturalness(syllable: string): number {
  if (!syllable || syllable.length === 0) return 50;

  // 🆕 화이트리스트: 패널티 미적용, 자연스러운 음절로 취급
  if (SYLLABLE_WHITELIST.has(syllable)) {
    return 100;
  }

  // 매우 흔한 음절
  if (VERY_COMMON_SYLLABLES.has(syllable)) {
    return 100;
  }

  // 드문/부자연스러운 음절
  if (RARE_SYLLABLES.has(syllable)) {
    return 20;
  }

  // 기본 점수 (흔하지는 않지만 부자연스럽지도 않음)
  return 60;
}

/**
 * 두 음절 조합의 자연스러움 평가
 *
 * @param syllable1 - 첫 번째 음절
 * @param syllable2 - 두 번째 음절
 * @returns 0-100 점수
 */
export function scoreCombinationNaturalness(
  syllable1: string,
  syllable2: string
): number {
  let score = 70; // 기본 점수

  // 개별 음절 자연스러움
  const syll1Score = scoreSyllableNaturalness(syllable1);
  const syll2Score = scoreSyllableNaturalness(syllable2);

  // 두 음절 중 낮은 점수를 반영 (더 부자연스러운 쪽이 영향)
  const minSyllScore = Math.min(syll1Score, syll2Score);
  score = (score + minSyllScore) / 2;

  // 부자연스러운 조합 체크
  for (const [pattern1, pattern2] of AWKWARD_COMBINATIONS) {
    if (pattern1.test(syllable1) && pattern2.test(syllable2)) {
      score -= 20; // 패널티
      break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * 전체 이름의 발음 자연스러움 평가
 *
 * @param firstName - 이름 음절 배열 (예: ['지', '우'])
 * @returns 0-100 점수
 */
export function scorePhoneticNaturalness(firstName: string[]): number {
  if (firstName.length !== 2) {
    return 50; // 기본 점수
  }

  const [syll1, syll2] = firstName;

  // 🚫 반복 음절 완전 차단 (서서, 준준 등)
  if (syll1 === syll2) {
    return 0; // 완전 감점
  }

  // 조합 자연스러움
  let combinationScore = scoreCombinationNaturalness(syll1, syll2);

  const bigramKey = syll1 + syll2;

  // 🚫 낯선 빅램 패널티 (도호, 호도 등)
  const awkwardPenalty = AWKWARD_BIGRAM_MAP.get(bigramKey) || 0;
  combinationScore += awkwardPenalty;

  // 🆕 빅램 보너스: 자주 쓰이는 음절 쌍에 가점
  const bigramBonus = BIGRAM_BONUS_MAP.get(bigramKey) || 0;
  combinationScore += bigramBonus;

  // 추가 보너스: 둘 다 매우 흔한 음절이면 +10
  if (
    VERY_COMMON_SYLLABLES.has(syll1) &&
    VERY_COMMON_SYLLABLES.has(syll2)
  ) {
    combinationScore += 10;
  }

  return Math.min(100, combinationScore);
}

/**
 * 발음 자연스러움 설명 생성
 *
 * @param firstName - 이름 음절 배열
 * @param score - 자연스러움 점수
 * @returns 설명 문자열
 */
export function explainPhoneticNaturalness(
  firstName: string[],
  score: number
): string {
  const [syll1, syll2] = firstName;
  const name = syll1 + syll2;

  if (score >= 90) {
    return `"${name}" 매우 자연스러운 발음 조합`;
  } else if (score >= 70) {
    return `"${name}" 발음이 자연스러움`;
  } else if (score >= 50) {
    return `"${name}" 발음이 다소 낯설 수 있음`;
  } else {
    const issues: string[] = [];

    if (RARE_SYLLABLES.has(syll1)) {
      issues.push(`"${syll1}" 드문 음절`);
    }
    if (RARE_SYLLABLES.has(syll2)) {
      issues.push(`"${syll2}" 드문 음절`);
    }

    if (issues.length > 0) {
      return `"${name}" ${issues.join(', ')}로 발음이 부자연스러움`;
    }

    return `"${name}" 발음 조합이 낯설 수 있음`;
  }
}
