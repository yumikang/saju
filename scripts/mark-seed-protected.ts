#!/usr/bin/env npx tsx
/**
 * Seed Protection 마킹 스크립트
 *
 * "사람이 고른 것 > 머신이 고른 것" 계층 시스템 구축
 *
 * 전략:
 * 1. good-hanja-seed.json의 110개 한자 → seedProtected = true
 * 2. 보너스 레어 한자 10개 → seedProtected = true
 * 3. 이 한자들은 빈도 낮아도 작명 추천에서 보호됨
 *
 * 최종 쿼리 로직:
 * OR [
 *   { seedProtected: true },  // 사람이 고른 것 무조건 통과
 *   { nameFrequency >= 50, isGoodForNaming: true }  // 머신이 고른 것
 * ]
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Seed Protection 마킹 스크립트 v1.0       ║');
  console.log('║  목표: 사람이 고른 한자 보호              ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  // Step 1: 현재 상태 확인
  console.log('========================================');
  console.log('Step 1: 현재 상태 확인');
  console.log('========================================\n');

  const beforeProtected = await prisma.hanjaDict.count({
    where: { seedProtected: true }
  });

  console.log(`현재 seedProtected: ${beforeProtected}자\n`);

  // Step 2: Seed 한자 목록 로드
  console.log('========================================');
  console.log('Step 2: Seed 한자 목록 로드');
  console.log('========================================\n');

  const seedPath = join(process.cwd(), 'scripts/etl/data/good-hanja-seed.json');
  const seedData = JSON.parse(readFileSync(seedPath, 'utf-8'));
  const goodSeedChars = seedData
    .filter((item: any) => item.isGoodForNaming === true)
    .map((item: any) => item.char);

  console.log(`Good Seed 한자: ${goodSeedChars.length}자`);
  console.log(`예시: ${goodSeedChars.slice(0, 15).join(', ')} ...\n`);

  // Step 3: 보너스 레어 한자 추가
  console.log('========================================');
  console.log('Step 3: 보너스 레어 한자 추가');
  console.log('========================================\n');

  const rareBeautifulChars = [
    '曄', // 빛날 엽
    '渼', // 물결 아름다울 미
    '姸', // 아름다울 연
    '嫺', // 공순할 한 (단아함)
    '璟', // 옥빛 경
    '玟', // 옥돌 민
    '玧', // 옥 윤
    '璇', // 아름다운 옥 선
    '斌', // 문무 갖출 빈
    '瑢', // 옥빛 용
  ];

  console.log(`보너스 레어 한자: ${rareBeautifulChars.length}자`);
  console.log(`리스트: ${rareBeautifulChars.join(', ')}\n`);

  // Step 4: 전체 보호 대상 합치기
  console.log('========================================');
  console.log('Step 4: 전체 보호 대상 합치기');
  console.log('========================================\n');

  const allProtectedChars = [...new Set([...goodSeedChars, ...rareBeautifulChars])];

  console.log(`총 보호 대상: ${allProtectedChars.length}자\n`);

  // Step 5: seedProtected = true로 마킹
  console.log('========================================');
  console.log('Step 5: seedProtected 마킹');
  console.log('========================================\n');

  console.log('🔍 대상: good-hanja-seed.json + 보너스 10자\n');

  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: allProtectedChars }
    },
    data: {
      seedProtected: true,
      isGoodForNaming: true  // 보호 대상은 당연히 Good
    }
  });

  console.log(`✅ 마킹 완료: ${result.count}자 업데이트\n`);

  // Step 6: 검증
  console.log('========================================');
  console.log('Step 6: 검증');
  console.log('========================================\n');

  const afterProtected = await prisma.hanjaDict.count({
    where: { seedProtected: true }
  });

  console.log(`seedProtected 한자: ${beforeProtected} → ${afterProtected}자 (+${afterProtected - beforeProtected})\n`);

  // Step 7: 빈도 분포 확인 (보호된 한자 중 빈도 낮은 것들)
  console.log('========================================');
  console.log('Step 7: 보호된 한자 빈도 분포');
  console.log('========================================\n');

  const protectedLowFreq = await prisma.hanjaDict.count({
    where: {
      seedProtected: true,
      OR: [
        { nameFrequency: { lt: 10 } },
        { nameFrequency: null }
      ]
    }
  });

  const protectedMidFreq = await prisma.hanjaDict.count({
    where: {
      seedProtected: true,
      nameFrequency: { gte: 10, lt: 50 }
    }
  });

  const protectedHighFreq = await prisma.hanjaDict.count({
    where: {
      seedProtected: true,
      nameFrequency: { gte: 50 }
    }
  });

  console.log('📊 보호된 한자 빈도 분포:\n');
  console.log(`  빈도 >= 50 (높음):    ${protectedHighFreq}자`);
  console.log(`  빈도 10-49 (중간):    ${protectedMidFreq}자`);
  console.log(`  빈도 < 10 (낮음):     ${protectedLowFreq}자`);
  console.log(`  🛡️ → 이 ${protectedLowFreq}자가 보호 시스템의 핵심!\n`);

  // Step 8: 샘플 보기 (빈도 낮지만 보호된 한자들)
  console.log('========================================');
  console.log('Step 8: 보호된 레어 한자 샘플');
  console.log('========================================\n');

  const samples = await prisma.hanjaDict.findMany({
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
    take: 15,
    orderBy: {
      nameFrequency: 'asc'
    }
  });

  console.log('📋 빈도 낮지만 보호된 한자 (빈도 오름차순):\n');
  samples.forEach(h => {
    console.log(`  ${h.character} (${h.meaning || '의미없음'}) - 빈도: ${h.nameFrequency || 0} [${h.element || '?'}]`);
  });

  console.log('\n');
  console.log('========================================');
  console.log('✅ Seed Protection 마킹 완료!');
  console.log('========================================');
  console.log('\n💡 다음 단계: repository WHERE 절을 OR 로직으로 업데이트\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
