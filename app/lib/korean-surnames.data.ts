/**
 * 한국 주요 성씨 상위 50개
 * 출처: 통계청 2015년 인구주택총조사
 * 커버리지: 약 87.5% (전체 인구 기준)
 */
export const KOREAN_SURNAMES_DATA = [
  // TOP 10 (64% 커버)
  { rank: 1,  korean: '김', hanja: ['金'], population: 10_689_959 },
  { rank: 2,  korean: '이', hanja: ['李'], population: 7_306_828 },
  { rank: 3,  korean: '박', hanja: ['朴'], population: 4_192_074 },
  { rank: 4,  korean: '최', hanja: ['崔'], population: 2_333_927 },
  { rank: 5,  korean: '정', hanja: ['鄭', '丁'], population: 2_010_117 },
  { rank: 6,  korean: '강', hanja: ['姜', '康'], population: 1_176_847 },
  { rank: 7,  korean: '조', hanja: ['趙', '曺'], population: 1_055_567 },
  { rank: 8,  korean: '윤', hanja: ['尹'], population: 1_020_012 },
  { rank: 9,  korean: '장', hanja: ['張', '蔣'], population: 992_721 },
  { rank: 10, korean: '임', hanja: ['林', '任'], population: 826_404 },

  // TOP 20 (76% 커버)
  { rank: 11, korean: '한', hanja: ['韓'], population: 715_556 },
  { rank: 12, korean: '오', hanja: ['吳', '伍'], population: 711_865 },
  { rank: 13, korean: '서', hanja: ['徐'], population: 698_289 },
  { rank: 14, korean: '신', hanja: ['申', '辛'], population: 691_729 },
  { rank: 15, korean: '권', hanja: ['權'], population: 679_865 },
  { rank: 16, korean: '황', hanja: ['黃'], population: 644_294 },
  { rank: 17, korean: '안', hanja: ['安'], population: 637_786 },
  { rank: 18, korean: '송', hanja: ['宋'], population: 556_465 },
  { rank: 19, korean: '전', hanja: ['全', '田'], population: 513_887 },
  { rank: 20, korean: '홍', hanja: ['洪'], population: 477_734 },

  // TOP 30 (82% 커버)
  { rank: 21, korean: '유', hanja: ['劉', '柳', '兪'], population: 453_545 },
  { rank: 22, korean: '고', hanja: ['高', '顧'], population: 435_839 },
  { rank: 23, korean: '문', hanja: ['文'], population: 426_927 },
  { rank: 24, korean: '양', hanja: ['梁', '楊'], population: 416_605 },
  { rank: 25, korean: '손', hanja: ['孫'], population: 415_182 },
  { rank: 26, korean: '배', hanja: ['裵', '裴'], population: 392_850 },
  { rank: 27, korean: '백', hanja: ['白'], population: 351_275 },
  { rank: 28, korean: '허', hanja: ['許'], population: 331_834 },
  { rank: 29, korean: '남', hanja: ['南'], population: 257_178 },
  { rank: 30, korean: '심', hanja: ['沈'], population: 254_369 },

  // TOP 40 (85% 커버)
  { rank: 31, korean: '노', hanja: ['盧', '魯'], population: 252_255 },
  { rank: 32, korean: '하', hanja: ['河', '夏'], population: 213_260 },
  { rank: 33, korean: '곽', hanja: ['郭'], population: 209_872 },
  { rank: 34, korean: '성', hanja: ['成', '星'], population: 209_360 },
  { rank: 35, korean: '차', hanja: ['車'], population: 204_473 },
  { rank: 36, korean: '주', hanja: ['朱', '周'], population: 194_593 },
  { rank: 37, korean: '우', hanja: ['禹', '于'], population: 179_830 },
  { rank: 38, korean: '구', hanja: ['具', '丘'], population: 163_820 },
  { rank: 39, korean: '나', hanja: ['羅'], population: 155_789 },
  { rank: 40, korean: '민', hanja: ['閔'], population: 153_252 },

  // TOP 50 (87.5% 커버) ⭐
  { rank: 41, korean: '진', hanja: ['陳', '秦', '晉'], population: 145_412 },
  { rank: 42, korean: '지', hanja: ['池', '智'], population: 139_478 },
  { rank: 43, korean: '엄', hanja: ['嚴'], population: 139_208 },
  { rank: 44, korean: '원', hanja: ['元', '原'], population: 122_552 },
  { rank: 45, korean: '채', hanja: ['蔡'], population: 115_692 },
  { rank: 46, korean: '천', hanja: ['千', '天'], population: 115_385 },
  { rank: 47, korean: '방', hanja: ['方', '房'], population: 110_978 },
  { rank: 48, korean: '공', hanja: ['孔', '公'], population: 105_181 },
  { rank: 49, korean: '현', hanja: ['玄'], population: 101_635 },
  { rank: 50, korean: '함', hanja: ['咸'], population: 100_849 },
] as const;

/**
 * 빠른 조회를 위한 Map (한글 → 한자 배열)
 */
export const SURNAME_MAP = new Map(
  KOREAN_SURNAMES_DATA.map(item => [item.korean, item.hanja])
);

/**
 * 한자 → 성씨 정보 Map (역방향 조회)
 */
export const HANJA_TO_SURNAME_MAP = new Map(
  KOREAN_SURNAMES_DATA.flatMap(item =>
    item.hanja.map(hanja => [hanja, { korean: item.korean, rank: item.rank, population: item.population }])
  )
);

/**
 * 전체 성씨 목록 (검색용)
 */
export const ALL_SURNAMES = Array.from(SURNAME_MAP.keys());

/**
 * 통계 정보
 */
export const SURNAME_STATS = {
  totalCount: KOREAN_SURNAMES_DATA.length,
  coverage: 0.875, // 87.5%
  totalPopulation: KOREAN_SURNAMES_DATA.reduce((sum, item) =>
    sum + (item.population || 0), 0
  ),
};

/**
 * 성씨 여부 확인
 */
export function isKoreanSurname(korean: string): boolean {
  return SURNAME_MAP.has(korean);
}

/**
 * 성씨 한자 목록 가져오기
 */
export function getSurnameHanja(korean: string): string[] | undefined {
  return SURNAME_MAP.get(korean);
}

/**
 * 한자가 성씨인지 확인
 */
export function isSurnameHanja(hanja: string): boolean {
  return HANJA_TO_SURNAME_MAP.has(hanja);
}

/**
 * 한자로 성씨 정보 가져오기
 */
export function getSurnameInfo(hanja: string) {
  return HANJA_TO_SURNAME_MAP.get(hanja);
}
