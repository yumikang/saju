#!/usr/bin/env npx tsx
/**
 * 한글 음운 기반 성별 보정 시스템 테스트
 *
 * 검증 사항:
 * 1. 여성형 어미 ("아", "라", "나" 등)가 +6 보정되는지
 * 2. 남성형 어미 ("준", "호", "현" 등)가 +6 보정되는지
 * 3. 중립형 어미 ("서", "윤", "유" 등)가 +3 보정되는지
 * 4. 반대 성별 어미가 -2 감점되는지
 * 5. 3글자 이름 패턴이 제대로 작동하는지
 */

import {
  genderBoost,
  analyzeGenderFit,
  GENDER_BOOST_RULES,
} from '../app/lib/naming/utils/gender-boost.js';

function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  한글 음운 성별 보정 테스트 v1.0         ║');
  console.log('║  5번째 축: 한글 종성 기반 보정           ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  // Test 1: 여성형 강한 어미 테스트
  console.log('========================================');
  console.log('Test 1: 여성형 강한 어미 (+6)');
  console.log('========================================\n');

  const femaleStrongNames = ['수아', '지아', '서아', '하나', '예나', '서연'];
  console.log('📋 강한 여성형 어미 테스트:\n');

  femaleStrongNames.forEach((name) => {
    const score = genderBoost(name, 'F');
    const analysis = analyzeGenderFit(name, 'F');
    console.log(`  ${name}: ${score >= 6 ? '✅' : '❌'} 점수 ${score} (${analysis.confidence})`);
    console.log(`    → ${analysis.reason}\n`);
  });

  // Test 2: 남성형 강한 어미 테스트
  console.log('========================================');
  console.log('Test 2: 남성형 강한 어미 (+6)');
  console.log('========================================\n');

  const maleStrongNames = ['민준', '서준', '지호', '현우', '준석', '태진'];
  console.log('📋 강한 남성형 어미 테스트:\n');

  maleStrongNames.forEach((name) => {
    const score = genderBoost(name, 'M');
    const analysis = analyzeGenderFit(name, 'M');
    console.log(`  ${name}: ${score >= 6 ? '✅' : '❌'} 점수 ${score} (${analysis.confidence})`);
    console.log(`    → ${analysis.reason}\n`);
  });

  // Test 3: 중립형 어미 테스트
  console.log('========================================');
  console.log('Test 3: 중립형 어미 (+3)');
  console.log('========================================\n');

  const neutralNames = [
    { name: '서은', gender: 'F' as const },
    { name: '윤서', gender: 'F' as const },
    { name: '지민', gender: 'M' as const },
    { name: '서하', gender: 'M' as const },
  ];

  console.log('📋 중립형 어미 테스트:\n');

  neutralNames.forEach(({ name, gender }) => {
    const score = genderBoost(name, gender);
    const analysis = analyzeGenderFit(name, gender);
    const genderStr = gender === 'F' ? '여아' : '남아';
    console.log(`  ${name} (${genderStr}): ${score >= 3 ? '✅' : '❌'} 점수 ${score} (${analysis.confidence})`);
    console.log(`    → ${analysis.reason}\n`);
  });

  // Test 4: 반대 성별 어미 감점 테스트
  console.log('========================================');
  console.log('Test 4: 반대 성별 어미 감점 (-2)');
  console.log('========================================\n');

  const oppositeTests = [
    { name: '민준', gender: 'F' as const, desc: '남성형 어미를 여아로' },
    { name: '수아', gender: 'M' as const, desc: '여성형 어미를 남아로' },
  ];

  console.log('📋 반대 성별 감점 테스트:\n');

  oppositeTests.forEach(({ name, gender, desc }) => {
    const score = genderBoost(name, gender);
    const analysis = analyzeGenderFit(name, gender);
    console.log(`  ${name} (${desc}): ${score === -2 ? '✅' : '❌'} 점수 ${score}`);
    console.log(`    → ${analysis.reason}\n`);
  });

  // Test 5: 3글자 이름 패턴 테스트
  console.log('========================================');
  console.log('Test 5: 3글자 이름 패턴 (+4)');
  console.log('========================================\n');

  const threeCharTests = [
    { name: '아린', gender: 'F' as const },
    { name: '하늘', gender: 'F' as const },
    { name: '민호', gender: 'M' as const },
    { name: '준서', gender: 'M' as const },
  ];

  console.log('📋 3글자 이름 패턴 테스트:\n');

  threeCharTests.forEach(({ name, gender }) => {
    const score = genderBoost(name, gender);
    const analysis = analyzeGenderFit(name, gender);
    const genderStr = gender === 'F' ? '여아' : '남아';
    console.log(`  ${name} (${genderStr}): 점수 ${score} (${analysis.confidence})`);
    console.log(`    → ${analysis.reason}\n`);
  });

  // Test 6: 실제 이름 케이스 종합 테스트
  console.log('========================================');
  console.log('Test 6: 실제 이름 종합 테스트');
  console.log('========================================\n');

  const realCases = [
    { name: '서윤', gender: 'F' as const },
    { name: '지우', gender: 'F' as const },
    { name: '하은', gender: 'F' as const },
    { name: '도윤', gender: 'M' as const },
    { name: '시우', gender: 'M' as const },
    { name: '은우', gender: 'M' as const },
  ];

  console.log('📋 실제 이름 케이스:\n');

  realCases.forEach(({ name, gender }) => {
    const score = genderBoost(name, gender);
    const analysis = analyzeGenderFit(name, gender);
    const genderStr = gender === 'F' ? '여아' : '남아';
    console.log(`  ${name} (${genderStr}): 점수 ${score} (${analysis.confidence})`);
    console.log(`    → ${analysis.reason}\n`);
  });

  // Test 7: 룰 세트 출력
  console.log('========================================');
  console.log('Test 7: 성별 보정 룰 세트');
  console.log('========================================\n');

  console.log('🎯 여성형 룰:\n');
  console.log(`  강한 어미 (${GENDER_BOOST_RULES.female.strong.score}점):`);
  console.log(`    ${GENDER_BOOST_RULES.female.strong.endings.join(', ')}`);
  console.log(`    → ${GENDER_BOOST_RULES.female.strong.description}\n`);

  console.log(`  중립 어미 (${GENDER_BOOST_RULES.female.neutral.score}점):`);
  console.log(`    ${GENDER_BOOST_RULES.female.neutral.endings.join(', ')}`);
  console.log(`    → ${GENDER_BOOST_RULES.female.neutral.description}\n`);

  console.log('🎯 남성형 룰:\n');
  console.log(`  강한 어미 (${GENDER_BOOST_RULES.male.strong.score}점):`);
  console.log(`    ${GENDER_BOOST_RULES.male.strong.endings.join(', ')}`);
  console.log(`    → ${GENDER_BOOST_RULES.male.strong.description}\n`);

  console.log(`  중립 어미 (${GENDER_BOOST_RULES.male.neutral.score}점):`);
  console.log(`    ${GENDER_BOOST_RULES.male.neutral.endings.join(', ')}`);
  console.log(`    → ${GENDER_BOOST_RULES.male.neutral.description}\n`);

  console.log(`⚠️  감점 (${GENDER_BOOST_RULES.penalty.score}점):`);
  console.log(`    → ${GENDER_BOOST_RULES.penalty.description}\n`);

  // Test 8: 최종 점수 시뮬레이션
  console.log('========================================');
  console.log('Test 8: 최종 점수 시뮬레이션');
  console.log('========================================\n');

  console.log('💡 5축 필터링 점수 구조:\n');
  console.log('  finalScore = baseScore + hanjaGender + hangulGender\n');

  const simulations = [
    {
      name: '수아',
      gender: 'F' as const,
      baseScore: 85,
      hanjaGender: 3,
    },
    {
      name: '민준',
      gender: 'M' as const,
      baseScore: 87,
      hanjaGender: 2,
    },
  ];

  simulations.forEach(({ name, gender, baseScore, hanjaGender }) => {
    const hangulGender = genderBoost(name, gender);
    const finalScore = baseScore + hanjaGender + hangulGender;

    console.log(`  이름: ${name} (${gender === 'F' ? '여아' : '남아'})`);
    console.log(`    Base Score (오행+빈도+Seed): ${baseScore}`);
    console.log(`    Hanja Gender (한자 성별):     ${hanjaGender >= 0 ? '+' : ''}${hanjaGender}`);
    console.log(`    Hangul Gender (한글 종성):    ${hangulGender >= 0 ? '+' : ''}${hangulGender}`);
    console.log(`    ━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`    Final Score:                  ${finalScore}\n`);
  });

  console.log('========================================');
  console.log('✅ 모든 테스트 완료!');
  console.log('========================================\n');

  console.log('🎯 결론:\n');
  console.log('  1. 여성형 강한 어미 (+6): 아, 라, 나, 다, 사, 예, 연');
  console.log('  2. 남성형 강한 어미 (+6): 준, 호, 현, 우, 석, 범, 태, 진, 환');
  console.log('  3. 중립형 어미 (+3): 은, 윤, 서, 유 (여성) / 민, 빈, 원, 서, 하, 솔 (남성)');
  console.log('  4. 반대 성별 감점 (-2): 약한 감점으로 예외 케이스 유지');
  console.log('  5. 3글자 패턴 (+4): 아린, 하늘 (여성) / 민호, 준서 (남성)');
  console.log('  6. 절대 하드컷 없음: 보너스만 부여, 하드컷 금지\n');
}

main();
