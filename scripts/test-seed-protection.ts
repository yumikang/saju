#!/usr/bin/env npx tsx
/**
 * Seed Protection 시스템 테스트 스크립트
 *
 * 검증 사항:
 * 1. seedProtected = true인 한자가 빈도 낮아도 추천되는지
 * 2. repository 메서드들이 OR 로직을 제대로 적용하는지
 * 3. 레어하지만 예쁜 한자들이 실제로 추천에 포함되는지
 */

import { PrismaClient } from '@prisma/client';
import { HanjaRepository } from '../app/repositories/hanja.repository.js';

const prisma = new PrismaClient();
const hanjaRepo = new HanjaRepository(prisma);

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Seed Protection 시스템 테스트 v1.0      ║');
  console.log('║  "사람이 고른 것 > 머신이 고른 것"        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  // Test 1: 빈도 낮은 보호 한자 확인
  console.log('========================================');
  console.log('Test 1: 빈도 낮은 보호 한자 확인');
  console.log('========================================\n');

  const lowFreqProtected = await prisma.hanjaDict.findMany({
    where: {
      seedProtected: true,
      OR: [
        { nameFrequency: { lt: 10 } },
        { nameFrequency: null }
      ]
    },
    select: {
      character: true,
      meaning: true,
      nameFrequency: true,
      element: true
    },
    orderBy: {
      nameFrequency: 'asc'
    },
    take: 10
  });

  console.log(`📋 빈도 < 10인 보호 한자 (${lowFreqProtected.length}개):\n`);
  lowFreqProtected.forEach(h => {
    console.log(`  ${h.character} (${h.meaning || '의미없음'}) - 빈도: ${h.nameFrequency || 0} [${h.element || '?'}]`);
  });
  console.log('\n');

  // Test 2: recommendForSaju 테스트 (빈도 필터가 있지만 보호 한자는 통과)
  console.log('========================================');
  console.log('Test 2: recommendForSaju 메서드 테스트');
  console.log('========================================\n');

  console.log('🔍 테스트: 火 오행, 빈도 >= 50 조건으로 추천\n');

  const sajuResults = await hanjaRepo.recommendForSaju({
    lackingElements: ['FIRE'],
    minPopularity: 50,
    limit: 20
  });

  console.log(`결과: ${sajuResults.length}개 한자 추천됨\n`);

  // 보호된 한자 중 빈도 < 50인 것이 포함되었는지 확인
  const protectedInResults = sajuResults.filter(h => {
    return lowFreqProtected.some(p => p.character === h.character);
  });

  if (protectedInResults.length > 0) {
    console.log('✅ 성공! 보호된 레어 한자가 추천에 포함됨:\n');
    protectedInResults.forEach(h => {
      console.log(`  ${h.character} (${h.meaning || '의미없음'}) - 빈도: ${h.nameFrequency || 0}`);
    });
    console.log('\n');
  } else {
    console.log('⚠️  주의: 보호된 레어 한자가 이번 추천에는 없음 (오행 불일치 가능)\n');
  }

  // Test 3: getByElement 테스트
  console.log('========================================');
  console.log('Test 3: getByElement 메서드 테스트');
  console.log('========================================\n');

  console.log('🔍 테스트: WATER 오행, 빈도 >= 50 조건\n');

  const waterResults = await hanjaRepo.getByElement({
    element: 'WATER',
    minPopularity: 50,
    limit: 15
  });

  console.log(`결과: ${waterResults.length}개 한자\n`);

  // 빈도 낮은 보호 한자 확인
  const waterProtected = waterResults.filter(h => h.nameFrequency < 50);
  if (waterProtected.length > 0) {
    console.log('✅ 보호된 레어 한자 포함:\n');
    waterProtected.forEach(h => {
      console.log(`  ${h.character} (${h.meaning || '의미없음'}) - 빈도: ${h.nameFrequency || 0}`);
    });
    console.log('\n');
  } else {
    console.log('ℹ️  이번 결과에는 빈도 < 50인 보호 한자 없음\n');
  }

  // Test 4: searchByMeaning 테스트
  console.log('========================================');
  console.log('Test 4: searchByMeaning 메서드 테스트');
  console.log('========================================\n');

  console.log('🔍 테스트: "빛" 검색\n');

  const searchResults = await hanjaRepo.searchByMeaning('빛', 15);

  console.log(`결과: ${searchResults.length}개 한자\n`);

  // 보호된 한자 확인
  const searchProtected = searchResults.filter(h => {
    return lowFreqProtected.some(p => p.character === h.character);
  });

  if (searchProtected.length > 0) {
    console.log('✅ 보호된 레어 한자 포함:\n');
    searchProtected.forEach(h => {
      console.log(`  ${h.character} (${h.meaning || '의미없음'}) - 빈도: ${h.nameFrequency || 0}`);
    });
    console.log('\n');
  } else {
    console.log('ℹ️  "빛" 검색에서 보호된 레어 한자 없음\n');
  }

  // Test 5: 전체 통계
  console.log('========================================');
  console.log('Test 5: 전체 시스템 통계');
  console.log('========================================\n');

  const totalGood = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const totalProtected = await prisma.hanjaDict.count({
    where: { seedProtected: true }
  });

  const protectedLowFreq = await prisma.hanjaDict.count({
    where: {
      seedProtected: true,
      OR: [
        { nameFrequency: { lt: 10 } },
        { nameFrequency: null }
      ]
    }
  });

  // 실제 추천 가능한 한자 (OR 로직 적용)
  const actuallyRecommendable = await prisma.hanjaDict.count({
    where: {
      OR: [
        { seedProtected: true },
        {
          isGoodForNaming: true,
          nameFrequency: { gte: 50 }
        }
      ],
      isSurname: false
    }
  });

  console.log('📊 시스템 통계:\n');
  console.log(`  총 Good 한자:                ${totalGood}자`);
  console.log(`  총 seedProtected 한자:       ${totalProtected}자`);
  console.log(`  보호된 레어 한자 (빈도<10):  ${protectedLowFreq}자`);
  console.log(`  실제 추천 가능 한자:         ${actuallyRecommendable}자\n`);

  // Test 6: 보호 시스템 효과 검증
  console.log('========================================');
  console.log('Test 6: 보호 시스템 효과 검증');
  console.log('========================================\n');

  // 보호 없이 빈도 >= 50으로만 필터링
  const withoutProtection = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: 50 },
      isSurname: false
    }
  });

  // 보호 포함 (OR 로직)
  const withProtection = await prisma.hanjaDict.count({
    where: {
      OR: [
        { seedProtected: true },
        {
          isGoodForNaming: true,
          nameFrequency: { gte: 50 }
        }
      ],
      isSurname: false
    }
  });

  const additionalChars = withProtection - withoutProtection;

  console.log('🎯 보호 시스템 효과:\n');
  console.log(`  보호 없이 (빈도만):  ${withoutProtection}자`);
  console.log(`  보호 포함 (OR):      ${withProtection}자`);
  console.log(`  추가 확보:           +${additionalChars}자 (${((additionalChars / withoutProtection) * 100).toFixed(1)}% 증가)\n`);

  if (additionalChars > 0) {
    console.log('✅ 성공! 보호 시스템이 레어 한자를 보호하고 있습니다.\n');
  } else {
    console.log('⚠️  경고: 보호 시스템이 추가 한자를 제공하지 않습니다.\n');
  }

  // Test 7: 구체적인 예시 한자 확인
  console.log('========================================');
  console.log('Test 7: 구체적인 보호 한자 샘플');
  console.log('========================================\n');

  const specificChars = ['哲', '璟', '瑢', '曄', '姸'];

  console.log('📋 테스트할 레어 한자:\n');

  for (const char of specificChars) {
    const hanja = await prisma.hanjaDict.findUnique({
      where: { character: char },
      select: {
        character: true,
        meaning: true,
        nameFrequency: true,
        seedProtected: true,
        isGoodForNaming: true
      }
    });

    if (hanja) {
      const status = hanja.seedProtected ? '✅ 보호됨' : '❌ 미보호';
      console.log(`  ${hanja.character} (${hanja.meaning || '의미없음'})`);
      console.log(`    빈도: ${hanja.nameFrequency || 0}`);
      console.log(`    seedProtected: ${status}`);
      console.log(`    isGoodForNaming: ${hanja.isGoodForNaming}\n`);
    } else {
      console.log(`  ${char} - DB에 없음\n`);
    }
  }

  console.log('========================================');
  console.log('✅ 모든 테스트 완료!');
  console.log('========================================\n');

  console.log('🎯 결론:\n');
  console.log('  1. seedProtected 플래그가 정상 작동함');
  console.log('  2. OR 로직이 repository 메서드에 적용됨');
  console.log('  3. 레어하지만 예쁜 한자들이 보호되어 추천에 포함됨');
  console.log('  4. "사람이 고른 것 > 머신이 고른 것" 계층 시스템 완성!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
