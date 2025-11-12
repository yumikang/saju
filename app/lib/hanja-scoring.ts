/**
 * 한자 점수 계산 시스템
 * 드롭다운 정렬 우선순위를 결정
 */

export interface HanjaForScoring {
  character: string;
  meaning: string;
  seedProtected: boolean;
  isGoodForNaming: boolean | null;
  genderHint?: string | null;
  inferredNameFrequency: number;
  nameFrequency: number;
}

// 긍정적 의미 키워드
const POSITIVE_MEANING_KEYWORDS = [
  // 기본/핵심 (매우 중요)
  '있을', '이룰', '될', '할', '갈', '오를',
  // 빛/밝음
  '빛', '밝', '찬란', '환', '영', '휘',
  // 기쁨/평안
  '기쁨', '즐거', '평안', '화', '온화', '평화', '안', '편안',
  // 성장/성취
  '자랄', '성장', '성취', '이길', '크', '높', '번영', '융성',
  // 지혜/덕
  '지혜', '슬기', '어질', '덕', '인', '의', '예', '지', '신',
  // 도움/베풂
  '도울', '베풀', '은혜', '너그러', '관대', '용서',
  // 아름다움
  '아름다', '고울', '빼어날', '수려', '곱', '아름다울',
  // 넉넉함/풍요
  '넉넉', '풍부', '많을',
  // 강함/굳셈
  '굳셀', '강', '건', '튼튼', '용', '씩씩',
  // 순수/진실
  '순수', '진실', '참', '바를',
];

// 금기 키워드 (taboo flag) - 강한 패널티
const TABOO_KEYWORDS = [
  // 인체/생리
  '젖', '똥', '오줌', '피', '냄새', '고름', '땀', '침',
  // 질병/재앙
  '병', '질병', '암', '독', '재앙', '화', '죽음', '살', '주검', '시체',
  // 슬픔/부정
  '흉', '슬픔', '근심', '우울', '비', '애', '한',
];

// 소프트패널티 키워드 (이름에 잘 안 쓰이는 것들)
const SOFT_PENALTY_KEYWORDS = [
  // 사물/토목
  '토담', '토대', '벽', '담', '둑',
  // 특수 명사/지명
  '고을이름', '물이름', '산이름', '나무이름',
  // 추상적/모호한 의미
  '머뭇거릴', '이지러질', '구부릴',
  // 식물 세부
  '가라지', '잡초',
  // 동물 세부
  '떼지어', '놀',
];

/**
 * 의미가 긍정적인지 판단
 */
function hasPositiveMeaning(meaning: string): boolean {
  return POSITIVE_MEANING_KEYWORDS.some(keyword => meaning.includes(keyword));
}

/**
 * 금기 키워드가 있는지 판단
 */
function hasTabooKeyword(meaning: string): boolean {
  return TABOO_KEYWORDS.some(keyword => meaning.includes(keyword));
}

/**
 * 소프트패널티 키워드가 있는지 판단
 */
function hasSoftPenalty(meaning: string): boolean {
  return SOFT_PENALTY_KEYWORDS.some(keyword => meaning.includes(keyword));
}

/**
 * 성별 일치 여부
 */
function matchesGender(hanja: HanjaForScoring, contextGender: 'M' | 'F' | null): boolean {
  if (!contextGender || !hanja.genderHint) return false;

  if (contextGender === 'M') {
    return hanja.genderHint === 'male' || hanja.genderHint === 'masculine';
  } else {
    return hanja.genderHint === 'female' || hanja.genderHint === 'feminine';
  }
}

/**
 * 한자 점수 계산
 *
 * 점수 체계:
 * - seedProtected (사람이 선별): +1000
 * - 성별 일치: +200
 * - 긍정적 의미: +120
 * - 검증됨 (TRUE): +100
 * - unisex 선호: +80
 * - 빈도수: +1 per count
 * - 소프트패널티: -300
 * - 금기 키워드: -500
 */
export function calculateHanjaScore(
  hanja: HanjaForScoring,
  contextGender: 'M' | 'F' | null = null
): number {
  let score = 0;

  // +1000: 사람이 선별한 한자 (최우선)
  if (hanja.seedProtected) {
    score += 1000;
  }

  // +200: 성별 일치
  if (matchesGender(hanja, contextGender)) {
    score += 200;
  }

  // +120: 긍정적 의미
  if (hasPositiveMeaning(hanja.meaning)) {
    score += 120;
  }

  // +100: 검증된 한자
  if (hanja.isGoodForNaming === true) {
    score += 100;
  }

  // +80: unisex (공통 사용 가능)
  if (hanja.genderHint === 'unisex') {
    score += 80;
  }

  // +1: 빈도수 (현재는 균등분배라 영향 미미)
  score += (hanja.inferredNameFrequency || 0) * 1;

  // -300: 소프트패널티 (이름에 잘 안 쓰이는 것들)
  if (hasSoftPenalty(hanja.meaning)) {
    score -= 300;
  }

  // -500: 금기 키워드 (강한 차단)
  if (hasTabooKeyword(hanja.meaning)) {
    score -= 500;
  }

  return score;
}

/**
 * 한자 배열을 점수순으로 정렬
 */
export function sortHanjaByScore<T extends HanjaForScoring>(
  hanjas: T[],
  contextGender: 'M' | 'F' | null = null
): T[] {
  return hanjas
    .map(hanja => ({
      hanja,
      score: calculateHanjaScore(hanja, contextGender)
    }))
    .sort((a, b) => {
      // 1차: 점수 내림차순
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 2차: 빈도수 내림차순
      if (b.hanja.inferredNameFrequency !== a.hanja.inferredNameFrequency) {
        return b.hanja.inferredNameFrequency - a.hanja.inferredNameFrequency;
      }
      // 3차: 한자 문자 순 (일관성)
      return a.hanja.character.localeCompare(b.hanja.character);
    })
    .map(item => item.hanja);
}
