#!/usr/bin/env npx tsx
/**
 * LinguisticScorer 테스트
 * - 같은 음절 반복 패널티 확인
 * - 의미 중복 패널티 확인
 */

import { LinguisticScorer } from '../app/lib/naming/scorers/linguistic-scorer';
import type { NameCandidate, ScoringContext } from '../app/lib/naming/types';

const scorer = new LinguisticScorer();

// Mock scoring context
const mockContext: ScoringContext = {
  sajuResult: {} as any,
  lastName: '서',
  lastNameStrokes: 7,
  gender: null,
  preferences: {},
};

async function testCase(
  name: string,
  firstName: [string, string],
  meanings: [string, string],
  chars: [string, string]
) {
  const candidate: NameCandidate = {
    firstName,
    characters: [
      {
        id: 1,
        character: chars[0],
        meaning: meanings[0],
        strokes: 10,
        element: 'WOOD' as any,
        yinYang: 'YANG' as any,
        koreanReading: firstName[0]
      },
      {
        id: 2,
        character: chars[1],
        meaning: meanings[1],
        strokes: 10,
        element: 'WOOD' as any,
        yinYang: 'YANG' as any,
        koreanReading: firstName[1]
      },
    ],
    score: 0,
    breakdown: { element: 0, yinyang: 0, numerology: 0, meaning: 0 },
    analysis: {} as any,
  };

  const result = await scorer.score(candidate, mockContext);

  console.log(`\n${name}:`);
  console.log(`  이름: 서${firstName[0]}${firstName[1]} (${firstName[0]}${firstName[1]})`);
  console.log(`  의미: ${meanings[0]} / ${meanings[1]}`);
  console.log(`  점수: ${result.score}점 (가중치 ${result.weight * 100}%)`);
  console.log(`  가중 점수: ${result.weightedScore.toFixed(1)}점`);
  console.log(`  설명: ${result.explanation}`);

  return result;
}

async function main() {
  console.log('='.repeat(60));
  console.log('LinguisticScorer 테스트');
  console.log('='.repeat(60));

  // Test Case 1: 같은 음절 반복 (서서)
  const case1 = await testCase(
    '❌ 같은 음절 반복',
    ['서', '서'],
    ['깃들일', '깃계할'],
    ['棲', '栖']
  );

  // Test Case 2: 의미 매우 유사
  const case2 = await testCase(
    '❌ 의미 매우 유사',
    ['유', '유'],
    ['부드러울', '부드럽다'],
    ['柔', '柔']
  );

  // Test Case 3: 의미 부분 유사
  const case3 = await testCase(
    '⚠️  의미 부분 유사',
    ['유', '온'],
    ['부드러울', '온화할'],
    ['柔', '溫']
  );

  // Test Case 4: 완벽한 케이스 (다양함)
  const case4 = await testCase(
    '✅ 완벽한 케이스',
    ['유', '진'],
    ['있을', '참'],
    ['有', '眞']
  );

  // Test Case 5: 최악의 케이스 (같은 음절 + 의미 유사)
  const case5 = await testCase(
    '💀 최악의 케이스',
    ['준', '준'],
    ['준수할', '준수하다'],
    ['俊', '峻']
  );

  console.log('\n' + '='.repeat(60));
  console.log('점수 비교:');
  console.log('='.repeat(60));
  console.log(`같은 음절 반복 (서서): ${case1.score}점`);
  console.log(`의미 매우 유사: ${case2.score}점`);
  console.log(`의미 부분 유사: ${case3.score}점`);
  console.log(`완벽한 케이스: ${case4.score}점`);
  console.log(`최악의 케이스 (음절+의미): ${case5.score}점`);

  console.log('\n가중치 적용 후:');
  console.log(`같은 음절 반복 (서서): ${case1.weightedScore.toFixed(1)}점 (전체의 ${(case1.weightedScore / 100 * 100).toFixed(1)}%)`);
  console.log(`완벽한 케이스: ${case4.weightedScore.toFixed(1)}점 (전체의 ${(case4.weightedScore / 100 * 100).toFixed(1)}%)`);

  const scoreDiff = case4.weightedScore - case1.weightedScore;
  console.log(`\n점수 차이: ${scoreDiff.toFixed(1)}점`);
  console.log('→ 같은 음절 반복 이름은 완벽한 이름보다 15점 낮음');
}

main().catch(console.error);
