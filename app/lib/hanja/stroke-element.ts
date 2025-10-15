/**
 * 수리오행: 획수를 오행으로 변환
 *
 * 규칙 (출처: 성명학 표준):
 * 1, 6 → 수(水)
 * 2, 7 → 화(火)
 * 3, 8 → 목(木)
 * 4, 9 → 금(金)
 * 5, 10 → 토(土)
 *
 * 10 이상: 끝자리로 판단
 * 예: 13획 = 3 = 목, 27획 = 7 = 화
 */

import { Element, YinYang } from '@prisma/client';

export interface StrokeElementResult {
  element: Element;
  yinyang: YinYang;
  strokes: number;
  calculation: string;
}

/**
 * 획수를 오행으로 변환 (기본)
 */
export function getElementFromStrokes(strokes: number): Element {
  const n = strokes % 10 || 10;

  if (n === 1 || n === 6) return Element.WATER;
  if (n === 2 || n === 7) return Element.FIRE;
  if (n === 3 || n === 8) return Element.WOOD;
  if (n === 4 || n === 9) return Element.METAL;
  return Element.EARTH;  // 5 or 10
}

/**
 * 획수를 오행 + 음양으로 변환 (상세)
 */
export function getDetailedStrokeElement(strokes: number): StrokeElementResult {
  const lastDigit = strokes % 10 || 10;

  const mapping: Record<number, { element: Element; yinyang: YinYang }> = {
    1: { element: Element.WATER, yinyang: YinYang.YANG },  // 양수
    6: { element: Element.WATER, yinyang: YinYang.YIN },   // 음수
    2: { element: Element.FIRE, yinyang: YinYang.YANG },   // 양화
    7: { element: Element.FIRE, yinyang: YinYang.YIN },    // 음화
    3: { element: Element.WOOD, yinyang: YinYang.YANG },   // 양목
    8: { element: Element.WOOD, yinyang: YinYang.YIN },    // 음목
    4: { element: Element.METAL, yinyang: YinYang.YANG },  // 양금
    9: { element: Element.METAL, yinyang: YinYang.YIN },   // 음금
    5: { element: Element.EARTH, yinyang: YinYang.YANG },  // 양토
    10: { element: Element.EARTH, yinyang: YinYang.YIN },  // 음토
  };

  const result = mapping[lastDigit];

  return {
    ...result,
    strokes,
    calculation:
      strokes >= 10
        ? `${strokes}획 → 끝자리 ${lastDigit}획 → ${result.element}`
        : `${strokes}획 → ${result.element}`,
  };
}

/**
 * 특정 오행에 해당하는 획수 목록 (최대 20개)
 */
export function getStrokesForElement(element: Element): number[] {
  const baseNumbers: Record<Element, number[]> = {
    [Element.WATER]: [1, 6],
    [Element.FIRE]: [2, 7],
    [Element.WOOD]: [3, 8],
    [Element.METAL]: [4, 9],
    [Element.EARTH]: [5, 10],
  };

  const base = baseNumbers[element];
  const strokes: number[] = [];

  // 1-40획까지 생성 (작명에서 보통 30획 이하 사용)
  for (let i = 0; i < 4; i++) {
    strokes.push(base[0] + i * 10);
    strokes.push(base[1] + i * 10);
  }

  return strokes.sort((a, b) => a - b);
}

/**
 * 획수 범위 내에서 특정 오행 획수만 필터
 */
export function filterStrokesByElement(
  minStrokes: number,
  maxStrokes: number,
  element: Element
): number[] {
  const allStrokes = getStrokesForElement(element);
  return allStrokes.filter((s) => s >= minStrokes && s <= maxStrokes);
}

// ============================================================
// 테스트 및 예제
// ============================================================

// ESM에서는 import.meta.url로 main 모듈 체크
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('🧪 수리오행 테스트\n');

  // 기본 변환
  console.log('=== 기본 변환 ===');
  [1, 3, 5, 7, 13, 27, 35].forEach((n) => {
    const elem = getElementFromStrokes(n);
    console.log(`${n}획 → ${elem}`);
  });

  console.log('\n=== 음양 포함 ===');
  [1, 6, 3, 8, 13, 18].forEach((n) => {
    const result = getDetailedStrokeElement(n);
    console.log(`${result.calculation} (${result.yinyang})`);
  });

  console.log('\n=== 오행별 획수 목록 ===');
  console.log('수(水):', getStrokesForElement(Element.WATER));
  console.log('화(火):', getStrokesForElement(Element.FIRE));
  console.log('목(木):', getStrokesForElement(Element.WOOD));

  console.log('\n=== 범위 필터 ===');
  console.log(
    '5-15획 사이의 목(木):',
    filterStrokesByElement(5, 15, Element.WOOD)
  );
}
