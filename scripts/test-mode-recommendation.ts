/**
 * Mode Recommendation Test
 *
 * 다양한 사주 케이스에 대한 모드 추천 테스트
 */

import { recommendScoringMode, MODE_DESCRIPTIONS, getRecommendationStrength } from '../app/lib/naming/utils/mode-recommendation';
import type { SajuResult } from '../app/lib/saju/calculator';
import { Element } from '@prisma/client';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 사주 기반 모드 추천 시스템 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 테스트 케이스 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 케이스 1: 오행 균형 매우 좋음 (5개 오행 골고루)
const balancedSaju: Partial<SajuResult> = {
  heavenlyStems: [
    { element: Element.WOOD } as any,
    { element: Element.FIRE } as any,
    { element: Element.EARTH } as any,
    { element: Element.METAL } as any,
  ],
  earthlyBranches: [
    { element: Element.WATER } as any,
    { element: Element.WOOD } as any,
    { element: Element.FIRE } as any,
    { element: Element.EARTH } as any,
  ],
  elementAnalysis: {
    favorableElement: Element.WOOD,
  } as any,
};

// 케이스 2: 목(木) 부족 (0개)
const woodLackSaju: Partial<SajuResult> = {
  heavenlyStems: [
    { element: Element.FIRE } as any,
    { element: Element.FIRE } as any,
    { element: Element.EARTH } as any,
    { element: Element.METAL } as any,
  ],
  earthlyBranches: [
    { element: Element.WATER } as any,
    { element: Element.EARTH } as any,
    { element: Element.FIRE } as any,
    { element: Element.METAL } as any,
  ],
  elementAnalysis: {
    favorableElement: Element.WOOD,
  } as any,
};

// 케이스 3: 화(火) 과다 (6개)
const fireExcessSaju: Partial<SajuResult> = {
  heavenlyStems: [
    { element: Element.FIRE } as any,
    { element: Element.FIRE } as any,
    { element: Element.FIRE } as any,
    { element: Element.FIRE } as any,
  ],
  earthlyBranches: [
    { element: Element.FIRE } as any,
    { element: Element.FIRE } as any,
    { element: Element.WATER } as any,
    { element: Element.EARTH } as any,
  ],
  elementAnalysis: {
    favorableElement: Element.WATER,
  } as any,
};

// 케이스 4: 중간 정도 균형
const moderateSaju: Partial<SajuResult> = {
  heavenlyStems: [
    { element: Element.WOOD } as any,
    { element: Element.WOOD } as any,
    { element: Element.FIRE } as any,
    { element: Element.EARTH } as any,
  ],
  earthlyBranches: [
    { element: Element.METAL } as any,
    { element: Element.WATER } as any,
    { element: Element.WOOD } as any,
    { element: Element.FIRE } as any,
  ],
  elementAnalysis: {
    favorableElement: Element.METAL,
  } as any,
};

const testCases = [
  {
    name: '케이스 1: 오행 균형 매우 좋음',
    saju: balancedSaju,
    expectedMode: 'meaning',
  },
  {
    name: '케이스 2: 목(木) 완전 부족',
    saju: woodLackSaju,
    expectedMode: 'balance',
  },
  {
    name: '케이스 3: 화(火) 과다',
    saju: fireExcessSaju,
    expectedMode: 'balance',
  },
  {
    name: '케이스 4: 중간 정도 균형',
    saju: moderateSaju,
    expectedMode: 'hybrid',
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 테스트 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

testCases.forEach(({ name, saju, expectedMode }) => {
  console.log(`🔹 ${name}\n`);

  const recommendation = recommendScoringMode(saju as SajuResult);
  const { recommendedMode, reason, confidence, elementBalance } = recommendation;

  // 오행 분포 출력
  console.log('📊 오행 분포:');
  const elementCounts: Record<string, number> = {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  };

  saju.heavenlyStems!.forEach((stem: any) => {
    const name = getElementName(stem.element);
    elementCounts[name]++;
  });

  saju.earthlyBranches!.forEach((branch: any) => {
    const name = getElementName(branch.element);
    elementCounts[name]++;
  });

  Object.entries(elementCounts).forEach(([element, count]) => {
    const bar = '█'.repeat(count);
    const percentage = ((count / 8) * 100).toFixed(0);
    console.log(`  ${element}: ${bar.padEnd(8)} (${count}/8, ${percentage}%)`);
  });

  console.log(`\n✅ 오행 균형 점수: ${elementBalance.score}점`);

  if (elementBalance.lacks.length > 0) {
    console.log(`⚠️  부족: ${elementBalance.lacks.join(', ')}`);
  }
  if (elementBalance.excess.length > 0) {
    console.log(`⚠️  과다: ${elementBalance.excess.join(', ')}`);
  }

  // 추천 결과
  console.log(`\n🎯 추천 모드: ${MODE_DESCRIPTIONS[recommendedMode].title}`);
  console.log(`   확신도: ${getRecommendationStrength(confidence)} (${(confidence * 100).toFixed(0)}%)`);
  console.log(`   이유: ${reason}`);

  // 예상과 일치하는지 체크
  const match = recommendedMode === expectedMode ? '✅' : '❌';
  console.log(`\n${match} 예상 모드: ${expectedMode}, 실제: ${recommendedMode}`);

  console.log('\n' + '─'.repeat(60) + '\n');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 모드별 설명 출력
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📚 모드별 설명\n');

Object.entries(MODE_DESCRIPTIONS).forEach(([mode, desc]) => {
  console.log(`${desc.title}`);
  console.log(`  설명: ${desc.description}`);
  console.log(`  추천: ${desc.recommended}`);
  console.log(`  가중치: ${desc.weights}\n`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Helper function
function getElementName(element: Element): string {
  const names: Record<Element, string> = {
    [Element.WOOD]: '목',
    [Element.FIRE]: '화',
    [Element.EARTH]: '토',
    [Element.METAL]: '금',
    [Element.WATER]: '수',
  };
  return names[element];
}
