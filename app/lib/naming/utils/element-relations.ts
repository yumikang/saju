/**
 * 오행 상생상극 (Five Elements Relations)
 *
 * 상생 (Producing Cycle): 水生木, 木生火, 火生土, 土生金, 金生水
 * 상극 (Conflicting Cycle): 水克火, 火克金, 金克木, 木克土, 土克水
 */

import { Element } from '@prisma/client';

// ============================================================
// 상생 관계 (Producing Cycle)
// ============================================================

/**
 * 나를 생하는 오행 (Mother Element)
 * @example getProducingElement(WOOD) → WATER (수생목)
 */
export function getProducingElement(element: Element): Element {
  const map: Record<Element, Element> = {
    [Element.WOOD]: Element.WATER,   // 수생목
    [Element.FIRE]: Element.WOOD,    // 목생화
    [Element.EARTH]: Element.FIRE,   // 화생토
    [Element.METAL]: Element.EARTH,  // 토생금
    [Element.WATER]: Element.METAL,  // 금생수
  };
  return map[element];
}

/**
 * 내가 생하는 오행 (Child Element)
 * @example getProducedElement(WOOD) → FIRE (목생화)
 */
export function getProducedElement(element: Element): Element {
  const map: Record<Element, Element> = {
    [Element.WOOD]: Element.FIRE,    // 목생화
    [Element.FIRE]: Element.EARTH,   // 화생토
    [Element.EARTH]: Element.METAL,  // 토생금
    [Element.METAL]: Element.WATER,  // 금생수
    [Element.WATER]: Element.WOOD,   // 수생목
  };
  return map[element];
}

/**
 * 두 오행이 상생 관계인지 확인
 */
export function isProducingCycle(from: Element, to: Element): boolean {
  return getProducedElement(from) === to;
}

// ============================================================
// 상극 관계 (Conflicting Cycle)
// ============================================================

/**
 * 나를 극하는 오행 (Dominating Element)
 * @example getDominatingElement(WOOD) → METAL (금극목)
 */
export function getDominatingElement(element: Element): Element {
  const map: Record<Element, Element> = {
    [Element.WOOD]: Element.METAL,   // 금극목
    [Element.FIRE]: Element.WATER,   // 수극화
    [Element.EARTH]: Element.WOOD,   // 목극토
    [Element.METAL]: Element.FIRE,   // 화극금
    [Element.WATER]: Element.EARTH,  // 토극수
  };
  return map[element];
}

/**
 * 내가 극하는 오행 (Dominated Element)
 * @example getDominatedElement(WOOD) → EARTH (목극토)
 */
export function getDominatedElement(element: Element): Element {
  const map: Record<Element, Element> = {
    [Element.WOOD]: Element.EARTH,   // 목극토
    [Element.FIRE]: Element.METAL,   // 화극금
    [Element.EARTH]: Element.WATER,  // 토극수
    [Element.METAL]: Element.WOOD,   // 금극목
    [Element.WATER]: Element.FIRE,   // 수극화
  };
  return map[element];
}

/**
 * 두 오행이 상극 관계인지 확인
 */
export function isConflictingCycle(from: Element, to: Element): boolean {
  return getDominatedElement(from) === to;
}

// ============================================================
// 관계 분석
// ============================================================

export type ElementRelation =
  | 'same'          // 같은 오행
  | 'producing'     // 상생 (내가 상대를 생함)
  | 'produced'      // 역상생 (상대가 나를 생함)
  | 'conflicting'   // 상극 (내가 상대를 극함)
  | 'conflicted'    // 역상극 (상대가 나를 극함)
  | 'neutral';      // 관계 없음

/**
 * 두 오행의 관계 분석
 */
export function getElementRelation(from: Element, to: Element): ElementRelation {
  if (from === to) return 'same';
  if (isProducingCycle(from, to)) return 'producing';
  if (isProducingCycle(to, from)) return 'produced';
  if (isConflictingCycle(from, to)) return 'conflicting';
  if (isConflictingCycle(to, from)) return 'conflicted';
  return 'neutral';
}

/**
 * 관계의 점수화 (-100 ~ 100)
 */
export function getRelationScore(relation: ElementRelation): number {
  const scores: Record<ElementRelation, number> = {
    same: 50,           // 같은 오행: 중립적 긍정
    producing: 100,     // 상생: 최고
    produced: 80,       // 역상생: 좋음
    conflicting: -100,  // 상극: 최악
    conflicted: -80,    // 역상극: 나쁨
    neutral: 0,         // 중립
  };
  return scores[relation];
}

// ============================================================
// 오행 균형 분석
// ============================================================

/**
 * 오행 분포의 균형도 계산 (0-100)
 * 이상적 균형: 각 오행이 20% (5개 오행이므로)
 */
export function calculateElementBalance(counts: Record<Element, number>): number {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  const ideal = total / 5; // 20%

  // 각 오행의 편차 계산
  const deviations = Object.values(counts).map(count =>
    Math.abs(count - ideal) / ideal
  );

  // 평균 편차를 점수로 변환 (편차가 작을수록 높은 점수)
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / 5;
  const balance = Math.max(0, 100 - avgDeviation * 50);

  return Math.round(balance);
}

/**
 * 부족한 오행 찾기
 */
export function findLackingElements(
  counts: Record<Element, number>,
  threshold: number = 0.5
): Element[] {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const avg = total / 5;

  return (Object.entries(counts) as [Element, number][])
    .filter(([_, count]) => count < avg * threshold)
    .map(([elem, _]) => elem);
}

/**
 * 과한 오행 찾기
 */
export function findExcessiveElements(
  counts: Record<Element, number>,
  threshold: number = 1.5
): Element[] {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const avg = total / 5;

  return (Object.entries(counts) as [Element, number][])
    .filter(([_, count]) => count > avg * threshold)
    .map(([elem, _]) => elem);
}

// ============================================================
// 오행 보충 전략
// ============================================================

/**
 * 부족한 오행을 보충하기 위한 최적 오행 추천
 *
 * 전략:
 * 1. 직접 보충 (부족한 오행 자체)
 * 2. 간접 보충 (부족한 오행을 생하는 오행)
 */
export function getComplementaryElements(lacking: Element[]): {
  direct: Element[];
  indirect: Element[];
} {
  const direct = [...lacking];
  const indirect = lacking.map(elem => getProducingElement(elem));

  return {
    direct,
    indirect: [...new Set(indirect)], // 중복 제거
  };
}

/**
 * 이름 한자 조합의 오행 효과 분석
 */
export function analyzeElementEffect(
  char1: Element,
  char2: Element,
  sajuCounts: Record<Element, number>,
  lackingElements: Element[]
): {
  complementsLacking: boolean;
  hasProducingChain: boolean;
  hasConflict: boolean;
  score: number;
  details: string[];
} {
  const details: string[] = [];
  let score = 0;

  // 1. 부족한 오행 보충 검사
  const complementsLacking =
    lackingElements.includes(char1) || lackingElements.includes(char2);

  if (complementsLacking) {
    score += 50;
    const matched = [char1, char2].filter(e => lackingElements.includes(e));
    details.push(`부족한 오행(${matched.join(', ')}) 보충`);
  }

  // 2. 상생 관계 검사
  const relation = getElementRelation(char1, char2);
  const hasProducingChain = relation === 'producing' || relation === 'produced';

  if (hasProducingChain) {
    score += 30;
    if (relation === 'producing') {
      details.push(`${char1}생${char2} 상생 관계`);
    } else {
      details.push(`${char2}생${char1} 상생 관계`);
    }
  }

  // 3. 상극 관계 검사
  const hasConflict = relation === 'conflicting' || relation === 'conflicted';

  if (hasConflict) {
    score -= 40;
    if (relation === 'conflicting') {
      details.push(`${char1}극${char2} 상극 관계 (주의)`);
    } else {
      details.push(`${char2}극${char1} 상극 관계 (주의)`);
    }
  }

  // 4. 같은 오행 보너스 (과하지 않을 경우)
  if (char1 === char2 && lackingElements.includes(char1)) {
    score += 20;
    details.push(`같은 오행(${char1})으로 강력 보충`);
  }

  return {
    complementsLacking,
    hasProducingChain,
    hasConflict,
    score: Math.max(0, Math.min(100, score)),
    details,
  };
}

// ============================================================
// 테스트 및 예제
// ============================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('🧪 오행 상생상극 테스트\n');

  // 상생 관계
  console.log('=== 상생 (Producing Cycle) ===');
  console.log('수생목:', Element.WATER, '→', getProducedElement(Element.WATER));
  console.log('목생화:', Element.WOOD, '→', getProducedElement(Element.WOOD));
  console.log('화생토:', Element.FIRE, '→', getProducedElement(Element.FIRE));
  console.log('토생금:', Element.EARTH, '→', getProducedElement(Element.EARTH));
  console.log('금생수:', Element.METAL, '→', getProducedElement(Element.METAL));

  // 상극 관계
  console.log('\n=== 상극 (Conflicting Cycle) ===');
  console.log('수극화:', Element.WATER, '→', getDominatedElement(Element.WATER));
  console.log('화극금:', Element.FIRE, '→', getDominatedElement(Element.FIRE));
  console.log('금극목:', Element.METAL, '→', getDominatedElement(Element.METAL));
  console.log('목극토:', Element.WOOD, '→', getDominatedElement(Element.WOOD));
  console.log('토극수:', Element.EARTH, '→', getDominatedElement(Element.EARTH));

  // 관계 분석
  console.log('\n=== 관계 분석 ===');
  console.log('木 → 火:', getElementRelation(Element.WOOD, Element.FIRE),
    '(점수:', getRelationScore(getElementRelation(Element.WOOD, Element.FIRE)), ')');
  console.log('木 → 土:', getElementRelation(Element.WOOD, Element.EARTH),
    '(점수:', getRelationScore(getElementRelation(Element.WOOD, Element.EARTH)), ')');
  console.log('木 → 金:', getElementRelation(Element.WOOD, Element.METAL),
    '(점수:', getRelationScore(getElementRelation(Element.WOOD, Element.METAL)), ')');

  // 오행 분포 예제
  console.log('\n=== 오행 분포 분석 ===');
  const exampleCounts = {
    [Element.WOOD]: 0.5,
    [Element.FIRE]: 2,
    [Element.EARTH]: 3,
    [Element.METAL]: 2.5,
    [Element.WATER]: 1,
  };

  console.log('오행 분포:', exampleCounts);
  console.log('균형도:', calculateElementBalance(exampleCounts), '점');
  console.log('부족 오행:', findLackingElements(exampleCounts));
  console.log('과한 오행:', findExcessiveElements(exampleCounts));

  const lacking = findLackingElements(exampleCounts);
  const complementary = getComplementaryElements(lacking);
  console.log('보충 추천:');
  console.log('  - 직접 보충:', complementary.direct);
  console.log('  - 간접 보충:', complementary.indirect);
}
