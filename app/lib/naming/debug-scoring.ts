/**
 * Debug scoring system
 *
 * Check why all candidates are scoring below 60 points.
 */

import { PrismaClient, Element } from '@prisma/client';
import { ScoringPipeline } from './scorers';
import { SajuCalculator } from '../saju/calculator';
import type { NameCandidate, HanjaCharacter } from './types';

const prisma = new PrismaClient();

async function debugScoring() {
  console.log('🔍 점수화 시스템 디버깅\n');

  // 1. Check database data quality
  console.log('═══ 1. 데이터베이스 품질 체크 ═══');

  const sampleChars = await prisma.hanjaDict.findMany({
    where: {
      element: Element.WOOD,
      isGoodForNaming: true,
    },
    select: {
      character: true,
      koreanReading: true,
      meaning: true,
      strokes: true,
      element: true,
      yinYang: true,
      nameFrequency: true,
      usageFrequency: true,
    },
    take: 5,
  });

  console.log('\n샘플 한자 5개:');
  sampleChars.forEach(char => {
    console.log(`  ${char.character} (${char.koreanReading}): 획수=${char.strokes}, 오행=${char.element}, 음양=${char.yinYang}`);
    console.log(`    빈도: name=${char.nameFrequency}, usage=${char.usageFrequency}`);
    console.log(`    의미: ${char.meaning?.slice(0, 30)}...`);
  });

  // 2. Create a manual test candidate
  console.log('\n═══ 2. 수동 후보 점수 테스트 ═══');

  if (sampleChars.length >= 2) {
    const char1 = sampleChars[0];
    const char2 = sampleChars[1];

    const hanjaChar1: HanjaCharacter = {
      id: 1,
      character: char1.character,
      strokes: char1.strokes || 0,
      element: char1.element || Element.WOOD,
      yinYang: char1.yinYang,
      meaning: char1.meaning || '',
      koreanReading: char1.koreanReading || '',
      nameFrequency: char1.nameFrequency || 0,
      usageFrequency: char1.usageFrequency || 0,
    };

    const hanjaChar2: HanjaCharacter = {
      id: 2,
      character: char2.character,
      strokes: char2.strokes || 0,
      element: char2.element || Element.WOOD,
      yinYang: char2.yinYang,
      meaning: char2.meaning || '',
      koreanReading: char2.koreanReading || '',
      nameFrequency: char2.nameFrequency || 0,
      usageFrequency: char2.usageFrequency || 0,
    };

    const testCandidate: NameCandidate = {
      firstName: [hanjaChar1.koreanReading, hanjaChar2.koreanReading] as [string, string],
      characters: [hanjaChar1, hanjaChar2] as [HanjaCharacter, HanjaCharacter],
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

    // Calculate saju
    const calculator = new SajuCalculator();
    const saju = calculator.calculate(new Date('1990-05-15'), '14:30', false);

    // Get last name info
    const lastNameInfo = await prisma.hanjaDict.findUnique({
      where: { character: '김' },
      select: { strokes: true },
    });

    // Score the candidate
    const pipeline = new ScoringPipeline();
    const context = {
      sajuResult: saju,
      lastName: '김',
      lastNameStrokes: lastNameInfo?.strokes || 8,
    };

    console.log(`\n테스트 후보: ${testCandidate.firstName.join('')}`);
    console.log(`  한자: ${char1.character}(${char1.koreanReading}) + ${char2.character}(${char2.koreanReading})`);
    console.log(`  오행: ${char1.element} + ${char2.element}`);
    console.log(`  획수: ${char1.strokes} + ${char2.strokes}`);

    const scored = await pipeline.scoreCandidate(testCandidate, context);

    console.log('\n📊 점수 결과:');
    console.log(`  종합 점수: ${scored.scores.overall}`);
    console.log(`  오행 조화: ${scored.scores.elementHarmony.score} (가중: ${scored.scores.elementHarmony.weightedScore.toFixed(1)})`);
    console.log(`    → ${scored.scores.elementHarmony.explanation}`);
    console.log(`  음양 균형: ${scored.scores.yinYangBalance.score} (가중: ${scored.scores.yinYangBalance.weightedScore.toFixed(1)})`);
    console.log(`    → ${scored.scores.yinYangBalance.explanation}`);
    console.log(`  81수리: ${scored.scores.numerology.score} (가중: ${scored.scores.numerology.weightedScore.toFixed(1)})`);
    console.log(`    → ${scored.scores.numerology.explanation}`);
    console.log(`  의미 조화: ${scored.scores.meaningHarmony.score} (가중: ${scored.scores.meaningHarmony.weightedScore.toFixed(1)})`);
    console.log(`    → ${scored.scores.meaningHarmony.explanation}`);
    console.log(`  신뢰도: ${scored.confidenceScore}`);

    // 3. Test with lower threshold
    console.log('\n═══ 3. 낮은 기준으로 매칭 테스트 ═══');

    const { HanjaMatcher } = await import('./matcher');
    const matcher = new HanjaMatcher();

    const results = await matcher.findOptimalNames(saju, '김', {
      maxResults: 10,
      minScore: 30, // Very low threshold
    });

    console.log(`\n최소 점수 30점으로 테스트:`);
    console.log(`  생성된 후보: ${results.length}개`);

    if (results.length > 0) {
      console.log('\n상위 5개:');
      results.slice(0, 5).forEach((c, idx) => {
        console.log(`  ${idx + 1}. ${c.firstName.join('')} - ${c.scores.overall}점`);
      });

      // Find the score distribution
      const scores = results.map(r => r.scores.overall);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      console.log(`\n점수 분포:`);
      console.log(`  평균: ${avgScore.toFixed(1)}`);
      console.log(`  최고: ${maxScore}`);
      console.log(`  최저: ${minScore}`);
    }
  }

  console.log('\n✅ 디버깅 완료!');
}

debugScoring()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
