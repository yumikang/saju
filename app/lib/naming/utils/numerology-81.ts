/**
 * 81수리 (81 Numerology System)
 *
 * 성명학에서 사용하는 81수리 길흉표
 * 각 숫자(1-81)는 특정한 운세와 의미를 가짐
 *
 * 참고: claudedocs/81-numerology-research.md
 */

import type { FortuneRating } from '../types';

export interface NumerologyEntry {
  number: number;
  fortune: FortuneRating;
  meaning: string;
  characteristics: string;
  score: number; // 0-100
}

/**
 * 완전한 81수리 길흉표
 */
export const NUMEROLOGY_81: Record<number, NumerologyEntry> = {
  1: { number: 1, fortune: '대길', meaning: '태초격', characteristics: '만물소생, 부귀영화의 시작', score: 100 },
  2: { number: 2, fortune: '흉', meaning: '분리격', characteristics: '분리이산, 고독고생', score: 20 },
  3: { number: 3, fortune: '대길', meaning: '발전격', characteristics: '만사형통, 명예와 성공', score: 95 },
  4: { number: 4, fortune: '흉', meaning: '파괴격', characteristics: '불안정, 고난파란', score: 15 },
  5: { number: 5, fortune: '대길', meaning: '복덕격', characteristics: '장수부귀, 복록이 깊음', score: 98 },
  6: { number: 6, fortune: '대길', meaning: '안정격', characteristics: '천복이 모임, 명예와 재물', score: 96 },
  7: { number: 7, fortune: '길', meaning: '강의격', characteristics: '강한 의지, 독립심', score: 85 },
  8: { number: 8, fortune: '길', meaning: '근면격', characteristics: '착실하고 발전', score: 88 },
  9: { number: 9, fortune: '흉', meaning: '박약격', characteristics: '불안정, 재난우려', score: 10 },
  10: { number: 10, fortune: '흉', meaning: '공허격', characteristics: '공허무력, 좌절', score: 5 },

  11: { number: 11, fortune: '대길', meaning: '부흥격', characteristics: '만물소생, 가문창성', score: 97 },
  12: { number: 12, fortune: '흉', meaning: '박약격', characteristics: '의지박약, 고독', score: 18 },
  13: { number: 13, fortune: '대길', meaning: '재능격', characteristics: '박학다재, 지혜충만', score: 94 },
  14: { number: 14, fortune: '흉', meaning: '파란격', characteristics: '이별고생, 고독우환', score: 12 },
  15: { number: 15, fortune: '대길', meaning: '덕망격', characteristics: '덕망높고 장수부귀', score: 99 },
  16: { number: 16, fortune: '대길', meaning: '후덕격', characteristics: '두목의 수, 명예권력', score: 96 },
  17: { number: 17, fortune: '길', meaning: '강의격', characteristics: '돌파력이 강함', score: 87 },
  18: { number: 18, fortune: '길', meaning: '철권격', characteristics: '강한 의지, 성공', score: 86 },
  19: { number: 19, fortune: '흉', meaning: '곤란격', characteristics: '재난곤란, 신고', score: 8 },
  20: { number: 20, fortune: '흉', meaning: '공허격', characteristics: '공허무력, 병약', score: 7 },

  21: { number: 21, fortune: '대길', meaning: '두목격', characteristics: '명예권력, 두령의 수', score: 98 },
  22: { number: 22, fortune: '흉', meaning: '박약격', characteristics: '고독고생, 좌절', score: 16 },
  23: { number: 23, fortune: '대길', meaning: '융성격', characteristics: '용성함, 명예권력', score: 95 },
  24: { number: 24, fortune: '대길', meaning: '금전격', characteristics: '금전풍부, 부귀영화', score: 97 },
  25: { number: 25, fortune: '길', meaning: '재능격', characteristics: '영민재지, 기회포착', score: 89 },
  26: { number: 26, fortune: '평', meaning: '변괴격', characteristics: '파란많음, 재난', score: 50 },
  27: { number: 27, fortune: '평', meaning: '비난격', characteristics: '비방중상, 곤란', score: 48 },
  28: { number: 28, fortune: '흉', meaning: '불운격', characteristics: '재난우환, 병약', score: 14 },
  29: { number: 29, fortune: '길', meaning: '지모격', characteristics: '지혜재능, 출중', score: 84 },
  30: { number: 30, fortune: '평', meaning: '투기격', characteristics: '부침불안, 행운', score: 52 },

  31: { number: 31, fortune: '대길', meaning: '지도격', characteristics: '지도자운, 명예권력', score: 98 },
  32: { number: 32, fortune: '대길', meaning: '행운격', characteristics: '요행행복, 뜻밖의 길', score: 93 },
  33: { number: 33, fortune: '대길', meaning: '승천격', characteristics: '용의 승천, 출세영화', score: 96 },
  34: { number: 34, fortune: '대흉', meaning: '파멸격', characteristics: '파멸파산, 재난이 큼', score: 0 },
  35: { number: 35, fortune: '길', meaning: '온화격', characteristics: '온순평화, 평안', score: 88 },
  36: { number: 36, fortune: '평', meaning: '파란격', characteristics: '파란곡절, 고생', score: 45 },
  37: { number: 37, fortune: '길', meaning: '권위격', characteristics: '권위와 신망', score: 87 },
  38: { number: 38, fortune: '평', meaning: '마찰격', characteristics: '마찰분쟁, 의지박약', score: 48 },
  39: { number: 39, fortune: '길', meaning: '영화격', characteristics: '영화부귀, 명예', score: 90 },
  40: { number: 40, fortune: '평', meaning: '퇴안격', characteristics: '안전하나 발전없음', score: 55 },

  41: { number: 41, fortune: '대길', meaning: '순풍격', characteristics: '순풍만범, 만사형통', score: 99 },
  42: { number: 42, fortune: '흉', meaning: '고난격', characteristics: '고난재액, 좌절', score: 13 },
  43: { number: 43, fortune: '평', meaning: '산재격', characteristics: '산재불안, 우려', score: 46 },
  44: { number: 44, fortune: '흉', meaning: '파멸격', characteristics: '파멸파산, 재난', score: 11 },
  45: { number: 45, fortune: '길', meaning: '순조격', characteristics: '순조발전, 성공', score: 91 },
  46: { number: 46, fortune: '평', meaning: '정체격', characteristics: '난관파란, 정체', score: 47 },
  47: { number: 47, fortune: '길', meaning: '개화격', characteristics: '활발개화, 성공', score: 89 },
  48: { number: 48, fortune: '길', meaning: '모사격', characteristics: '지모재능, 성취', score: 90 },
  49: { number: 49, fortune: '평', meaning: '변화격', characteristics: '길흉교차, 변화많음', score: 50 },
  50: { number: 50, fortune: '평', meaning: '침체격', characteristics: '부침곡절, 일장일단', score: 51 },

  51: { number: 51, fortune: '평', meaning: '부침격', characteristics: '성쇠교체, 부침', score: 53 },
  52: { number: 52, fortune: '길', meaning: '선견격', characteristics: '선견지명, 달성', score: 86 },
  53: { number: 53, fortune: '평', meaning: '허영격', characteristics: '내외불화, 곤란', score: 49 },
  54: { number: 54, fortune: '흉', meaning: '불운격', characteristics: '큰 불행, 재난', score: 9 },
  55: { number: 55, fortune: '평', meaning: '정중동격', characteristics: '외화내빈, 곤란', score: 48 },
  56: { number: 56, fortune: '흉', meaning: '불행격', characteristics: '불행재난, 좌절', score: 10 },
  57: { number: 57, fortune: '길', meaning: '노력격', characteristics: '노력성공, 행복', score: 85 },
  58: { number: 58, fortune: '평', meaning: '완고격', characteristics: '먼저 고생 후 행복', score: 54 },
  59: { number: 59, fortune: '흉', meaning: '무기력격', characteristics: '무기력, 재난', score: 6 },
  60: { number: 60, fortune: '흉', meaning: '암흑격', characteristics: '암흑고난, 불안', score: 7 },

  61: { number: 61, fortune: '길', meaning: '명예격', characteristics: '명예재산, 성공', score: 88 },
  62: { number: 62, fortune: '흉', meaning: '쇠약격', characteristics: '쇠약불안, 실패', score: 12 },
  63: { number: 63, fortune: '길', meaning: '풍부격', characteristics: '부귀영화, 만사형통', score: 92 },
  64: { number: 64, fortune: '흉', meaning: '파멸격', characteristics: '파멸고난, 재앙', score: 8 },
  65: { number: 65, fortune: '길', meaning: '부귀격', characteristics: '부귀영달, 행복', score: 93 },
  66: { number: 66, fortune: '흉', meaning: '암담격', characteristics: '암담불안, 고난', score: 11 },
  67: { number: 67, fortune: '길', meaning: '통달격', characteristics: '만사통달, 성공', score: 90 },
  68: { number: 68, fortune: '길', meaning: '발명격', characteristics: '발명창안, 성취', score: 87 },
  69: { number: 69, fortune: '흉', meaning: '동요격', characteristics: '불안동요, 곤란', score: 13 },
  70: { number: 70, fortune: '흉', meaning: '공허격', characteristics: '공허무력, 고독', score: 9 },

  71: { number: 71, fortune: '평', meaning: '허실격', characteristics: '허실혼합, 부침', score: 52 },
  72: { number: 72, fortune: '평', meaning: '고락격', characteristics: '선고후락, 파란', score: 50 },
  73: { number: 73, fortune: '평', meaning: '무난격', characteristics: '무난평화, 안정', score: 56 },
  74: { number: 74, fortune: '흉', meaning: '불행격', characteristics: '병약고난, 불행', score: 10 },
  75: { number: 75, fortune: '평', meaning: '보수격', characteristics: '보수안정, 평범', score: 57 },
  76: { number: 76, fortune: '흉', meaning: '파란격', characteristics: '파란고생, 재난', score: 14 },
  77: { number: 77, fortune: '평', meaning: '중길격', characteristics: '반길반흉, 노력', score: 51 },
  78: { number: 78, fortune: '평', meaning: '말년격', characteristics: '초고생 말년안', score: 53 },
  79: { number: 79, fortune: '흉', meaning: '우둔격', characteristics: '우둔곤란, 불행', score: 7 },
  80: { number: 80, fortune: '흉', meaning: '끝격', characteristics: '끝이 보임, 공허', score: 6 },
  81: { number: 81, fortune: '길', meaning: '환원격', characteristics: '원점회귀, 재시작', score: 80 },
};

/**
 * 길수 (Auspicious Numbers) 목록
 */
export const AUSPICIOUS_NUMBERS = [
  1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25,
  29, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63,
  65, 67, 68, 81,
];

/**
 * 흉수 (Inauspicious Numbers) 목록
 */
export const INAUSPICIOUS_NUMBERS = [
  2, 4, 9, 10, 12, 14, 19, 20, 22, 28, 34, 42, 44, 54, 56, 59,
  60, 62, 64, 66, 69, 70, 74, 76, 79, 80,
];

/**
 * 대흉수 (Very Inauspicious Numbers)
 */
export const VERY_INAUSPICIOUS_NUMBERS = [34]; // 34는 가장 흉한 수

/**
 * 획수를 1-81로 변환
 */
export function normalizeStrokes(strokes: number): number {
  if (strokes <= 0) return 1;
  if (strokes <= 81) return strokes;
  return ((strokes - 1) % 81) + 1;
}

/**
 * 획수로 수리 정보 가져오기
 */
export function getNumerologyInfo(strokes: number): NumerologyEntry {
  const normalized = normalizeStrokes(strokes);
  return NUMEROLOGY_81[normalized];
}

/**
 * 획수가 길수인지 확인
 */
export function isAuspicious(strokes: number): boolean {
  const normalized = normalizeStrokes(strokes);
  return AUSPICIOUS_NUMBERS.includes(normalized);
}

/**
 * 획수가 흉수인지 확인
 */
export function isInauspicious(strokes: number): boolean {
  const normalized = normalizeStrokes(strokes);
  return INAUSPICIOUS_NUMBERS.includes(normalized);
}

/**
 * 획수가 대흉수인지 확인
 */
export function isVeryInauspicious(strokes: number): boolean {
  const normalized = normalizeStrokes(strokes);
  return VERY_INAUSPICIOUS_NUMBERS.includes(normalized);
}

/**
 * 운세 등급별 점수 범위
 */
export const FORTUNE_SCORE_RANGES = {
  대길: [90, 100],
  길: [70, 89],
  평: [40, 69],
  흉: [10, 39],
  대흉: [0, 9],
} as const;

/**
 * 사격 (Four Grids) 계산
 */
export interface FourGrids {
  원격: number; // 초년운 (first char + second char)
  형격: number; // 청장년운 (last name + first char)
  이격: number; // 중말년운 (last name + second char)
  정격: number; // 말년운 (total)
}

export function calculateFourGrids(
  lastNameStrokes: number,
  firstCharStrokes: number,
  secondCharStrokes: number
): FourGrids {
  return {
    원격: firstCharStrokes + secondCharStrokes,
    형격: lastNameStrokes + firstCharStrokes,
    이격: lastNameStrokes + secondCharStrokes,
    정격: lastNameStrokes + firstCharStrokes + secondCharStrokes,
  };
}

/**
 * 사격의 개별 점수 계산
 */
export function scoreFourGrids(grids: FourGrids): {
  원격: number;
  형격: number;
  이격: number;
  정격: number;
} {
  return {
    원격: getNumerologyInfo(grids.원격).score,
    형격: getNumerologyInfo(grids.형격).score,
    이격: getNumerologyInfo(grids.이격).score,
    정격: getNumerologyInfo(grids.정격).score,
  };
}

/**
 * 사격의 전체 평균 점수 계산
 */
export function getAverageFourGridsScore(grids: FourGrids): number {
  const scores = scoreFourGrids(grids);
  return (scores.원격 + scores.형격 + scores.이격 + scores.정격) / 4;
}

/**
 * 사격의 상세 분석 (NumerologyGridsAnalysis 타입으로 반환)
 */
export function getDetailedFourGridsAnalysis(grids: FourGrids): any {
  const 원격Info = getNumerologyInfo(grids.원격);
  const 형격Info = getNumerologyInfo(grids.형격);
  const 이격Info = getNumerologyInfo(grids.이격);
  const 정격Info = getNumerologyInfo(grids.정격);

  // Overall fortune calculation
  const scores = scoreFourGrids(grids);
  const avgScore = (scores.원격 + scores.형격 + scores.이격 + scores.정격) / 4;

  let overallFortune = '평';
  if (avgScore >= 80) overallFortune = '대길';
  else if (avgScore >= 60) overallFortune = '길';
  else if (avgScore >= 40) overallFortune = '평';
  else if (avgScore >= 20) overallFortune = '흉';
  else overallFortune = '대흉';

  return {
    원격: {
      strokes: grids.원격,
      number: normalizeStrokes(grids.원격),
      fortune: 원격Info.fortune,
      meaning: 원격Info.meaning,
      score: 원격Info.score,
    },
    형격: {
      strokes: grids.형격,
      number: normalizeStrokes(grids.형격),
      fortune: 형격Info.fortune,
      meaning: 형격Info.meaning,
      score: 형격Info.score,
    },
    이격: {
      strokes: grids.이격,
      number: normalizeStrokes(grids.이격),
      fortune: 이격Info.fortune,
      meaning: 이격Info.meaning,
      score: 이격Info.score,
    },
    정격: {
      strokes: grids.정격,
      number: normalizeStrokes(grids.정격),
      fortune: 정격Info.fortune,
      meaning: 정격Info.meaning,
      score: 정격Info.score,
    },
    overallFortune,
  };
}

/**
 * 사격의 길흉 분석
 */
export function analyzeFourGrids(grids: FourGrids): {
  auspiciousCount: number;
  inauspiciousCount: number;
  details: string[];
} {
  const gridEntries = [
    { name: '원격', value: grids.원격 },
    { name: '형격', value: grids.형격 },
    { name: '이격', value: grids.이격 },
    { name: '정격', value: grids.정격 },
  ];

  let auspiciousCount = 0;
  let inauspiciousCount = 0;
  const details: string[] = [];

  for (const grid of gridEntries) {
    const info = getNumerologyInfo(grid.value);
    const normalized = normalizeStrokes(grid.value);

    if (isAuspicious(normalized)) {
      auspiciousCount++;
    } else if (isInauspicious(normalized)) {
      inauspiciousCount++;
    }

    details.push(
      `${grid.name}(${grid.value}획 → ${normalized}): ${info.fortune} - ${info.meaning}`
    );
  }

  return {
    auspiciousCount,
    inauspiciousCount,
    details,
  };
}

// ============================================================
// 테스트
// ============================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('🧪 81수리 테스트\n');

  // 샘플 획수 테스트
  const samples = [1, 13, 21, 34, 41, 81, 100];

  console.log('=== 획수별 길흉 ===');
  samples.forEach((strokes) => {
    const info = getNumerologyInfo(strokes);
    const normalized = normalizeStrokes(strokes);
    console.log(
      `${strokes}획 → ${normalized}: ${info.fortune} (${info.score}점) - ${info.meaning}`
    );
  });

  // 사격 계산 예제
  console.log('\n=== 사격 계산 예제 ===');
  console.log('성: 김(8획), 이름: 민(5획)준(7획)');

  const grids = calculateFourGrids(8, 5, 7);
  console.log('사격:', grids);

  const analysis = analyzeFourGrids(grids);
  console.log('\n길흉 분석:');
  analysis.details.forEach((d) => console.log('  -', d));
  console.log(`\n길수 개수: ${analysis.auspiciousCount}/4`);
  console.log(`흉수 개수: ${analysis.inauspiciousCount}/4`);
  console.log(`전체 점수: ${getAverageFourGridsScore(grids).toFixed(1)}점`);
}
