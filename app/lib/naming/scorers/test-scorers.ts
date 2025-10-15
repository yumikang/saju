/**
 * Test file for scoring system
 *
 * Demonstrates how to use the scoring pipeline to evaluate name candidates.
 */

import { Element, YinYang } from '@prisma/client';
import { ScoringPipeline } from './scoring-pipeline';
import type { NameCandidate, ScoringContext, HanjaCharacter } from '../types';
import type { SajuResult } from '../../saju/calculator';

// ============================================================
// Test Data
// ============================================================

/**
 * Create mock saju result for testing
 */
function createMockSaju(): SajuResult {
  return {
    pillars: {
      year: { stem: '갑', branch: '자' },
      month: { stem: '병', branch: '인' },
      day: { stem: '무', branch: '진' },
      hour: { stem: '임', branch: '오' },
    },
    dayMaster: {
      stem: '무',
      element: Element.EARTH,
    },
    elementCounts: {
      [Element.WOOD]: 2,
      [Element.FIRE]: 2,
      [Element.EARTH]: 2,
      [Element.METAL]: 0.5,
      [Element.WATER]: 1.5,
    },
    lackingElements: [Element.METAL],
    favorableElements: [Element.METAL, Element.WATER],
    yongsin: {
      primary: Element.METAL,
      secondary: Element.WATER,
    },
  };
}

/**
 * Create mock hanja character
 */
function createMockHanja(overrides: Partial<HanjaCharacter>): HanjaCharacter {
  return {
    id: 1,
    character: '秀',
    strokes: 7,
    element: Element.METAL,
    yinYang: YinYang.YANG,
    meaning: '빼어나다, 뛰어나다',
    koreanReading: '수',
    fortune: '길',
    nameFrequency: 100,
    usageFrequency: 500,
    category: ['virtue', 'excellence'],
    review: 'approved',
    isGoodForNaming: true,
    ...overrides,
  };
}

/**
 * Create mock name candidate
 */
function createMockCandidate(
  char1: Partial<HanjaCharacter>,
  char2: Partial<HanjaCharacter>
): NameCandidate {
  const hanja1 = createMockHanja(char1);
  const hanja2 = createMockHanja(char2);

  return {
    firstName: [hanja1.koreanReading, hanja2.koreanReading] as [string, string],
    characters: [hanja1, hanja2] as [HanjaCharacter, HanjaCharacter],
    score: 0,
    breakdown: {
      element: 0,
      yinyang: 0,
      numerology: 0,
      meaning: 0,
    },
    analysis: {
      elementHarmony: {
        lacksComplement: false,
        hasProducingCycle: false,
        hasConflictingCycle: false,
        strengthensFavorable: false,
        details: [],
      },
      yinyangBalance: {
        pattern: '',
        isBalanced: false,
        distribution: { yang: 0, yin: 0 },
        details: [],
      },
      numerologyGrids: {
        원격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
        형격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
        이격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
        정격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
        overallFortune: '',
      },
      meaningCompatibility: {
        theme: '',
        isHarmonious: false,
        quality: 'fair',
        details: [],
      },
      reasoning: [],
    },
  };
}

// ============================================================
// Tests
// ============================================================

async function runTests() {
  console.log('🧪 작명 점수화 시스템 테스트\n');

  const pipeline = new ScoringPipeline();
  const saju = createMockSaju();

  // Test Case 1: 상생 관계 (水生木) + 용신 보완
  console.log('=== Test 1: 상생 관계 (金生水) + 용신 보완 ===');
  const candidate1 = createMockCandidate(
    {
      character: '秀',
      element: Element.METAL,  // 금
      yinYang: YinYang.YANG,
      strokes: 7,
      koreanReading: '수',
      meaning: '빼어나다',
    },
    {
      character: '澤',
      element: Element.WATER,  // 수 (금생수)
      yinYang: YinYang.YIN,
      strokes: 17,
      koreanReading: '택',
      meaning: '연못, 은택',
    }
  );

  const context1: ScoringContext = {
    sajuResult: saju,
    lastName: '김',
    lastNameHanja: '金',
    lastNameStrokes: 8,
    preferences: {},
  };

  const scored1 = await pipeline.scoreCandidate(candidate1, context1);
  console.log('이름:', scored1.firstName.join(''));
  console.log('종합 점수:', scored1.scores.overall, '/100');
  console.log('오행 조화:', scored1.scores.elementHarmony.score, '-', scored1.scores.elementHarmony.explanation);
  console.log('음양 균형:', scored1.scores.yinYangBalance.score, '-', scored1.scores.yinYangBalance.explanation);
  console.log('81수리:', scored1.scores.numerology.score, '-', scored1.scores.numerology.explanation);
  console.log('의미 조화:', scored1.scores.meaningHarmony.score, '-', scored1.scores.meaningHarmony.explanation);
  console.log('신뢰도:', scored1.confidenceScore);

  // Test Case 2: 상극 관계 (水克火)
  console.log('\n=== Test 2: 상극 관계 (水克火) ===');
  const candidate2 = createMockCandidate(
    {
      character: '澤',
      element: Element.WATER,  // 수
      yinYang: YinYang.YIN,
      strokes: 17,
      koreanReading: '택',
      meaning: '연못',
    },
    {
      character: '炫',
      element: Element.FIRE,  // 화 (수극화)
      yinYang: YinYang.YANG,
      strokes: 9,
      koreanReading: '현',
      meaning: '빛나다',
    }
  );

  const scored2 = await pipeline.scoreCandidate(candidate2, context1);
  console.log('이름:', scored2.firstName.join(''));
  console.log('종합 점수:', scored2.scores.overall, '/100');
  console.log('오행 조화:', scored2.scores.elementHarmony.score, '-', scored2.scores.elementHarmony.explanation);
  console.log('음양 균형:', scored2.scores.yinYangBalance.score, '-', scored2.scores.yinYangBalance.explanation);

  // Test Case 3: 부정적 한자 포함
  console.log('\n=== Test 3: 부정적 의미 한자 ===');
  const candidate3 = createMockCandidate(
    {
      character: '死',
      element: Element.METAL,
      yinYang: YinYang.YIN,
      strokes: 6,
      koreanReading: '사',
      meaning: '죽다',
      fortune: '대흉',
    },
    {
      character: '病',
      element: Element.EARTH,
      yinYang: YinYang.YANG,
      strokes: 10,
      koreanReading: '병',
      meaning: '병들다',
      fortune: '흉',
    }
  );

  const scored3 = await pipeline.scoreCandidate(candidate3, context1);
  console.log('이름:', scored3.firstName.join(''));
  console.log('종합 점수:', scored3.scores.overall, '/100');
  console.log('의미 조화:', scored3.scores.meaningHarmony.score, '-', scored3.scores.meaningHarmony.explanation);

  // Test Case 4: Batch scoring
  console.log('\n=== Test 4: 일괄 점수 계산 ===');
  const candidates = [candidate1, candidate2, candidate3];
  const scoredAll = await pipeline.scoreAll(candidates, context1);

  console.log('총 후보:', scoredAll.length);
  scoredAll.forEach((c, i) => {
    console.log(`${i + 1}. ${c.firstName.join('')}: ${c.scores.overall}점`);
  });

  // Sort by score
  const sorted = scoredAll.sort((a, b) => b.scores.overall - a.scores.overall);
  console.log('\n최고 점수:', sorted[0].firstName.join(''), '-', sorted[0].scores.overall, '점');
  console.log('최저 점수:', sorted[sorted.length - 1].firstName.join(''), '-', sorted[sorted.length - 1].scores.overall, '점');

  console.log('\n✅ 모든 테스트 완료!');
}

// Run tests if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runTests().catch(console.error);
}

export { runTests, createMockSaju, createMockHanja, createMockCandidate };
