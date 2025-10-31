#!/usr/bin/env npx tsx
/**
 * 데이터 품질 종합 분석 스크립트
 *
 * Week 1 (Day 3-5) 데이터 개선 작업 종합 분석
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     데이터 품질 종합 분석 리포트                      ║');
  console.log('║     Week 1 Data Enhancement Summary                    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n');

  // ========================================
  // 1. 전체 데이터베이스 현황
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 1. 전체 데이터베이스 현황');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalHanja = await prisma.hanjaDict.count();
  const goodForNaming = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });
  const surnames = await prisma.hanjaDict.count({
    where: { isSurname: true }
  });
  const tabooChars = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false, isSurname: false }
  });

  console.log(`📚 전체 한자:           ${totalHanja.toLocaleString()}자`);
  console.log(`✅ 작명 적합 한자:      ${goodForNaming.toLocaleString()}자 (${(goodForNaming/totalHanja*100).toFixed(1)}%)`);
  console.log(`🚫 성씨 한자:           ${surnames.toLocaleString()}자`);
  console.log(`⚠️  불용한자:           ${tabooChars.toLocaleString()}자`);
  console.log('');

  // ========================================
  // 2. Day 3: Seed Protection 시스템
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛡️  2. Day 3: Seed Protection 시스템');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const seedProtected = await prisma.hanjaDict.count({
    where: { seedProtected: true }
  });

  const seedLowFreq = await prisma.hanjaDict.count({
    where: {
      seedProtected: true,
      nameFrequency: { lt: 10 }
    }
  });

  const seedByElement = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: { seedProtected: true },
    _count: true
  });

  console.log('🎯 목적: 레어하지만 아름다운 한자 보호');
  console.log('📋 구현: OR 로직 (seedProtected = true OR nameFrequency >= 50)\n');

  console.log(`✅ 보호된 한자:         ${seedProtected}자`);
  console.log(`   - 빈도 <10인 레어:   ${seedLowFreq}자 (보호 효과)`);
  console.log('');

  console.log('🎨 오행별 Seed 분포:');
  seedByElement
    .sort((a, b) => b._count - a._count)
    .forEach(item => {
      console.log(`   ${item.element?.padEnd(6)}: ${item._count}자`);
    });
  console.log('');

  // Top seed protected characters with low frequency
  const rareSeed = await prisma.hanjaDict.findMany({
    where: {
      seedProtected: true,
      nameFrequency: { lt: 10 }
    },
    select: {
      character: true,
      meaning: true,
      nameFrequency: true,
      element: true
    },
    orderBy: { nameFrequency: 'asc' },
    take: 10
  });

  console.log('💎 레어 보호 한자 예시 (빈도 낮지만 보호):');
  rareSeed.forEach(h => {
    console.log(`   ${h.character} (${h.meaning}) - 빈도: ${h.nameFrequency || 0}, 오행: ${h.element}`);
  });
  console.log('');

  // ========================================
  // 3. Day 4: Gender Hint 시스템
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👫 3. Day 4: Gender Hint 시스템');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const femaleHint = await prisma.hanjaDict.count({
    where: { genderHint: 'female' }
  });

  const maleHint = await prisma.hanjaDict.count({
    where: { genderHint: 'male' }
  });

  const unisexHint = await prisma.hanjaDict.count({
    where: { genderHint: 'unisex' }
  });

  const noHint = await prisma.hanjaDict.count({
    where: { genderHint: null }
  });

  console.log('🎯 목적: 성별 적합 한자 큐레이션');
  console.log('📋 구현: genderHint 필드 (female/male/unisex)\n');

  console.log(`👧 Female:              ${femaleHint}자`);
  console.log(`👦 Male:                ${maleHint}자`);
  console.log(`🤝 Unisex:              ${unisexHint}자`);
  console.log(`❓ No Hint:             ${noHint.toLocaleString()}자`);
  console.log(`   큐레이션 비율:      ${((femaleHint + maleHint + unisexHint) / totalHanja * 100).toFixed(1)}%\n`);

  // Gender hint by element
  const femaleByElement = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: { genderHint: 'female' },
    _count: true
  });

  const maleByElement = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: { genderHint: 'male' },
    _count: true
  });

  console.log('🎨 오행별 성별 분포:');
  console.log('   Female:');
  femaleByElement.forEach(item => {
    console.log(`     ${item.element?.padEnd(6)}: ${item._count}자`);
  });
  console.log('   Male:');
  maleByElement.forEach(item => {
    console.log(`     ${item.element?.padEnd(6)}: ${item._count}자`);
  });
  console.log('');

  // Sample female and male characters
  const femaleSample = await prisma.hanjaDict.findMany({
    where: { genderHint: 'female' },
    select: { character: true, meaning: true, seedProtected: true },
    take: 10
  });

  const maleSample = await prisma.hanjaDict.findMany({
    where: { genderHint: 'male' },
    select: { character: true, meaning: true, seedProtected: true },
    take: 10
  });

  console.log('👧 Female 한자 샘플:');
  console.log('   ' + femaleSample.map(h => `${h.character}(${h.meaning?.slice(0, 4)})${h.seedProtected ? '🛡️' : ''}`).join(', '));

  console.log('\n👦 Male 한자 샘플:');
  console.log('   ' + maleSample.map(h => `${h.character}(${h.meaning?.slice(0, 4)})${h.seedProtected ? '🛡️' : ''}`).join(', '));
  console.log('');

  // ========================================
  // 4. 필터링 효과 분석
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 4. 4축 필터링 효과 분석');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Female accessible hanja (axis 1-4)
  const femaleAccessible = await prisma.hanjaDict.count({
    where: {
      AND: [
        // Seed protection OR good for naming
        {
          OR: [
            { seedProtected: true },
            { isGoodForNaming: true }
          ]
        },
        // Not surname
        { isSurname: false },
        // Female or unisex or null
        {
          OR: [
            { genderHint: { in: ['female', 'unisex'] } },
            { genderHint: null }
          ]
        }
      ]
    }
  });

  // Male accessible hanja (axis 1-4)
  const maleAccessible = await prisma.hanjaDict.count({
    where: {
      AND: [
        // Seed protection OR good for naming
        {
          OR: [
            { seedProtected: true },
            { isGoodForNaming: true }
          ]
        },
        // Not surname
        { isSurname: false },
        // Male or unisex or null
        {
          OR: [
            { genderHint: { in: ['male', 'unisex'] } },
            { genderHint: null }
          ]
        }
      ]
    }
  });

  console.log('🎯 4축 필터링 (오행 + 빈도/Seed + 성씨제외 + 성별):\n');
  console.log(`👧 여아 가능 한자:      ${femaleAccessible.toLocaleString()}자`);
  console.log(`👦 남아 가능 한자:      ${maleAccessible.toLocaleString()}자`);
  console.log(`📊 전체 대비 비율:      ${(femaleAccessible/totalHanja*100).toFixed(1)}% (여) / ${(maleAccessible/totalHanja*100).toFixed(1)}% (남)\n`);

  // High quality hanja (seed + high frequency)
  const highQualityFemale = await prisma.hanjaDict.count({
    where: {
      AND: [
        {
          OR: [
            { seedProtected: true },
            { nameFrequency: { gte: 100 } }
          ]
        },
        { isSurname: false },
        {
          OR: [
            { genderHint: { in: ['female', 'unisex'] } },
            { genderHint: null }
          ]
        }
      ]
    }
  });

  const highQualityMale = await prisma.hanjaDict.count({
    where: {
      AND: [
        {
          OR: [
            { seedProtected: true },
            { nameFrequency: { gte: 100 } }
          ]
        },
        { isSurname: false },
        {
          OR: [
            { genderHint: { in: ['male', 'unisex'] } },
            { genderHint: null }
          ]
        }
      ]
    }
  });

  console.log('💎 고품질 한자 (Seed OR 빈도≥100):');
  console.log(`   여아: ${highQualityFemale}자`);
  console.log(`   남아: ${highQualityMale}자\n`);

  // ========================================
  // 5. Day 5: 한글 음운 보정 (5축)
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎵 5. Day 5: 한글 음운 기반 성별 보정 (5축)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🎯 목적: 런타임 한글 종성 기반 성별 적합도 보정');
  console.log('📋 구현: genderBoost() 함수 in naming pipeline\n');

  console.log('📊 보정 규칙:');
  console.log('   👧 여아 강한 어미 (+6): 아, 라, 나, 다, 사, 예, 연');
  console.log('   👦 남아 강한 어미 (+6): 준, 호, 현, 우, 석, 범, 태, 진, 환');
  console.log('   🤝 중립형 어미 (+3):   은, 윤, 서, 유, 민, 빈, 원, 하, 솔');
  console.log('   ⚠️  반대 성별 (-2):     약한 감점\n');

  console.log('💡 특징:');
  console.log('   - DB 변경 없음 (런타임 보정)');
  console.log('   - 한글 이름 최종 후보에 적용');
  console.log('   - 절대 하드컷 금지, 보너스만 부여');
  console.log('   - finalScore = baseScore + hangulGenderBoost\n');

  // ========================================
  // 6. 5축 필터링 시스템 종합
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 6. 5축 필터링 시스템 종합');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('┌─────┬────────────────┬──────────────┬────────────┐');
  console.log('│ 축  │ 시스템         │ 구현         │ 레벨       │');
  console.log('├─────┼────────────────┼──────────────┼────────────┤');
  console.log('│ 1축 │ 오행           │ 사주 용신    │ DB Query   │');
  console.log('│ 2축 │ 빈도/Seed      │ 116자 보호   │ DB Query   │');
  console.log('│ 3축 │ 성씨 제외      │ 132자 제외   │ DB Query   │');
  console.log('│ 4축 │ Gender Hint    │ 105자 큐레   │ DB Query   │');
  console.log('│ 5축 │ 한글 음운      │ 종성 보정    │ Runtime    │');
  console.log('└─────┴────────────────┴──────────────┴────────────┘\n');

  console.log('🔄 데이터 흐름:');
  console.log('   1. DB Query: 1~4축 필터링 → 후보 한자 선정');
  console.log('   2. 조합 생성: 2자 이름 조합 생성');
  console.log('   3. 기본 점수: 오행 + 음양 + 수리 + 의미 계산');
  console.log('   4. 5축 보정: 한글 종성 기반 보정 (+6/+3/-2)');
  console.log('   5. 최종 점수: baseScore + genderBoost\n');

  // ========================================
  // 7. 데이터 품질 지표
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 7. 데이터 품질 지표');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const avgNameFreq = await prisma.hanjaDict.aggregate({
    where: { isGoodForNaming: true },
    _avg: { nameFrequency: true }
  });

  const highFreqCount = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: 100 }
    }
  });

  const mediumFreqCount = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: 50, lt: 100 }
    }
  });

  const lowFreqCount = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { lt: 50 }
    }
  });

  console.log('📈 빈도 분포 (isGoodForNaming = true):');
  console.log(`   평균 빈도:          ${avgNameFreq._avg.nameFrequency?.toFixed(1) || 0}`);
  console.log(`   고빈도 (≥100):      ${highFreqCount}자 (${(highFreqCount/goodForNaming*100).toFixed(1)}%)`);
  console.log(`   중빈도 (50-99):     ${mediumFreqCount}자 (${(mediumFreqCount/goodForNaming*100).toFixed(1)}%)`);
  console.log(`   저빈도 (<50):       ${lowFreqCount}자 (${(lowFreqCount/goodForNaming*100).toFixed(1)}%)`);
  console.log(`   → Seed 보호 효과:  저빈도 중 ${seedLowFreq}자 보호됨\n`);

  // Element distribution
  const elementDist = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: { isGoodForNaming: true },
    _count: true
  });

  console.log('🎨 오행 분포 (isGoodForNaming = true):');
  elementDist
    .sort((a, b) => b._count - a._count)
    .forEach(item => {
      const pct = (item._count / goodForNaming * 100).toFixed(1);
      console.log(`   ${item.element?.padEnd(6)}: ${item._count.toString().padStart(4)}자 (${pct}%)`);
    });
  console.log('');

  // ========================================
  // 8. 개선 효과 요약
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ 8. 개선 효과 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 정량적 개선:');
  console.log(`   ✅ Seed 보호:        ${seedProtected}자 (레어 한자 보호)`);
  console.log(`   ✅ Gender 큐레이션:  ${femaleHint + maleHint + unisexHint}자 (성별 적합)`);
  console.log(`   ✅ 여아 풀:          ${femaleAccessible.toLocaleString()}자 (4축 필터링 후)`);
  console.log(`   ✅ 남아 풀:          ${maleAccessible.toLocaleString()}자 (4축 필터링 후)`);
  console.log(`   ✅ 런타임 보정:      5축 (한글 음운 +6/+3/-2)\n`);

  console.log('🎯 정성적 개선:');
  console.log('   1. 🛡️  레어 보호: 빈도 낮아도 아름다운 한자 보호');
  console.log('   2. 👫 성별 적합: DB 레벨 + 런타임 이중 보정');
  console.log('   3. 🎵 한글 감성: 2000년대 이후 트렌드 반영');
  console.log('   4. 🚫 절대 컷: 하드컷 금지, 보너스만 부여');
  console.log('   5. 📈 품질 향상: 사람 큐레이션 + 머신 필터링\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ 데이터 품질 종합 분석 완료\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
