/**
 * HanjaMatcher Test Suite
 *
 * Tests the complete name matching pipeline with real data.
 */

import { Element } from '@prisma/client';
import { HanjaMatcher } from './matcher';
import { SajuCalculator } from '../saju/calculator';
import type { SajuResult } from '../saju/calculator';

// ============================================================
// Test Helpers
// ============================================================

/**
 * Create test saju for different scenarios
 */
function createTestSaju(scenario: 'balanced' | 'lacking-metal' | 'strong-fire'): SajuResult {
  const calculator = new SajuCalculator();

  // Use real dates for realistic tests
  const testDates = {
    'balanced': new Date('1990-05-15'),
    'lacking-metal': new Date('1995-08-20'),
    'strong-fire': new Date('1988-06-10'),
  };

  return calculator.calculate(
    testDates[scenario],
    '14:30',
    false
  );
}

// ============================================================
// Test Cases
// ============================================================

async function runTests() {
  console.log('🧪 HanjaMatcher 테스트 시작\n');
  console.log('═'.repeat(60));

  const matcher = new HanjaMatcher();

  // ═══════════════════════════════════════
  // Test 1: Basic functionality
  // ═══════════════════════════════════════
  console.log('\n📝 Test 1: 기본 매칭 기능');
  console.log('─'.repeat(60));

  const saju1 = createTestSaju('balanced');
  const start1 = Date.now();

  try {
    const results1 = await matcher.findOptimalNames(saju1, '김', {
      maxResults: 50,
      minScore: 65,
    });

    const elapsed1 = Date.now() - start1;

    console.log(`✓ 실행 시간: ${elapsed1}ms`);
    console.log(`✓ 생성된 후보: ${results1.length}개`);
    console.log(`✓ 평균 점수: ${(results1.reduce((sum, c) => sum + c.scores.overall, 0) / results1.length).toFixed(1)}점`);

    // Performance check
    if (elapsed1 > 5000) {
      console.warn(`⚠️  경고: 목표 시간(5초) 초과! (${elapsed1}ms)`);
    } else {
      console.log(`✅ 성능 목표 달성! (${elapsed1}ms < 5000ms)`);
    }

    // Quality check
    const highQualityCount = results1.filter(c => c.scores.overall >= 80).length;
    console.log(`✓ 고품질 후보 (80점 이상): ${highQualityCount}개`);

    // Show top 5
    console.log('\n🏆 상위 5개 이름:');
    results1.slice(0, 5).forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.firstName.join('')} (${c.scores.overall.toFixed(1)}점)`);
      console.log(`   한자: ${c.characters[0].character}(${c.characters[0].koreanReading}) + ${c.characters[1].character}(${c.characters[1].koreanReading})`);
      console.log(`   오행: ${c.scores.elementHarmony.score.toFixed(0)} | 음양: ${c.scores.yinYangBalance.score.toFixed(0)} | 수리: ${c.scores.numerology.score.toFixed(0)} | 의미: ${c.scores.meaningHarmony.score.toFixed(0)}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Test 1 실패:', error);
  }

  // ═══════════════════════════════════════
  // Test 2: Gender filtering
  // ═══════════════════════════════════════
  console.log('\n📝 Test 2: 성별 필터링');
  console.log('─'.repeat(60));

  const saju2 = createTestSaju('lacking-metal');
  const start2 = Date.now();

  try {
    const maleResults = await matcher.findOptimalNames(saju2, '이', {
      maxResults: 30,
      minScore: 60,
      gender: 'male',
    });

    const femaleResults = await matcher.findOptimalNames(saju2, '이', {
      maxResults: 30,
      minScore: 60,
      gender: 'female',
    });

    const elapsed2 = Date.now() - start2;

    console.log(`✓ 실행 시간: ${elapsed2}ms (2회 실행)`);
    console.log(`✓ 남성 이름: ${maleResults.length}개`);
    console.log(`✓ 여성 이름: ${femaleResults.length}개`);

    console.log('\n남성 이름 상위 3개:');
    maleResults.slice(0, 3).forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.firstName.join('')} (${c.scores.overall.toFixed(1)}점)`);
    });

    console.log('\n여성 이름 상위 3개:');
    femaleResults.slice(0, 3).forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.firstName.join('')} (${c.scores.overall.toFixed(1)}점)`);
    });
  } catch (error) {
    console.error('❌ Test 2 실패:', error);
  }

  // ═══════════════════════════════════════
  // Test 3: Element preference
  // ═══════════════════════════════════════
  console.log('\n📝 Test 3: 오행 선호도 지정');
  console.log('─'.repeat(60));

  const saju3 = createTestSaju('strong-fire');
  const start3 = Date.now();

  try {
    const results3 = await matcher.findOptimalNames(saju3, '박', {
      maxResults: 30,
      minScore: 65,
      preferredElements: [Element.WATER, Element.METAL],
    });

    const elapsed3 = Date.now() - start3;

    console.log(`✓ 실행 시간: ${elapsed3}ms`);
    console.log(`✓ 생성된 후보: ${results3.length}개`);

    // Check element distribution
    const elementCounts: Record<string, number> = {};
    results3.forEach(c => {
      const elem1 = c.characters[0].element.toString();
      const elem2 = c.characters[1].element.toString();
      elementCounts[elem1] = (elementCounts[elem1] || 0) + 1;
      elementCounts[elem2] = (elementCounts[elem2] || 0) + 1;
    });

    console.log('\n오행 분포:');
    Object.entries(elementCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([elem, count]) => {
        console.log(`  ${elem}: ${count}회`);
      });
  } catch (error) {
    console.error('❌ Test 3 실패:', error);
  }

  // ═══════════════════════════════════════
  // Test 4: Performance benchmark
  // ═══════════════════════════════════════
  console.log('\n📝 Test 4: 성능 벤치마크');
  console.log('─'.repeat(60));

  const benchmarkIterations = 5;
  const times: number[] = [];

  for (let i = 0; i < benchmarkIterations; i++) {
    const saju = createTestSaju('balanced');
    const start = Date.now();

    try {
      await matcher.findOptimalNames(saju, '최', {
        maxResults: 100,
        minScore: 60,
      });

      const elapsed = Date.now() - start;
      times.push(elapsed);
      console.log(`  ${i + 1}회: ${elapsed}ms`);
    } catch (error) {
      console.error(`  ${i + 1}회 실패:`, error);
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log('\n📊 벤치마크 결과:');
    console.log(`  평균: ${avgTime.toFixed(0)}ms`);
    console.log(`  최소: ${minTime}ms`);
    console.log(`  최대: ${maxTime}ms`);

    if (avgTime < 3000) {
      console.log('  ✅ 우수한 성능! (목표: <3초)');
    } else if (avgTime < 5000) {
      console.log('  ✓ 허용 범위 내 성능 (목표: <5초)');
    } else {
      console.log('  ⚠️  성능 개선 필요 (목표: <5초)');
    }
  }

  // ═══════════════════════════════════════
  // Test 5: Early termination effectiveness
  // ═══════════════════════════════════════
  console.log('\n📝 Test 5: 조기 종료 효과');
  console.log('─'.repeat(60));

  const saju5 = createTestSaju('lacking-metal');

  try {
    // With early termination
    const start5a = Date.now();
    const results5a = await matcher.findOptimalNames(saju5, '정', {
      maxResults: 100,
      minScore: 60,
      enableEarlyTermination: true,
    });
    const elapsed5a = Date.now() - start5a;

    // Without early termination
    const start5b = Date.now();
    const results5b = await matcher.findOptimalNames(saju5, '정', {
      maxResults: 100,
      minScore: 60,
      enableEarlyTermination: false,
    });
    const elapsed5b = Date.now() - start5b;

    console.log(`조기 종료 활성화: ${elapsed5a}ms (${results5a.length}개 후보)`);
    console.log(`조기 종료 비활성화: ${elapsed5b}ms (${results5b.length}개 후보)`);

    const speedup = ((elapsed5b - elapsed5a) / elapsed5b * 100).toFixed(1);
    console.log(`✓ 속도 개선: ${speedup}%`);
  } catch (error) {
    console.error('❌ Test 5 실패:', error);
  }

  // ═══════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('✅ 모든 테스트 완료!');
  console.log('═'.repeat(60));
}

// ============================================================
// Run tests
// ============================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runTests()
    .catch(console.error)
    .finally(() => {
      console.log('\n테스트 종료.');
      process.exit(0);
    });
}

export { runTests };
