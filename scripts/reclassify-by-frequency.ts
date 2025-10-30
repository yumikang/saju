#!/usr/bin/env npx tsx
/**
 * 빈도 기반 재분류 스크립트
 *
 * 전략:
 * - nameFrequency >= 50: isGoodForNaming = true (실제로 많이 쓰임)
 * - nameFrequency 10-49: 수동 검토 필요 (보류)
 * - nameFrequency < 10: isGoodForNaming = false (거의 안 쓰임)
 *
 * 단, good-hanja-seed.json에 있는 한자는 보호 (빈도 낮아도 의미 좋음)
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  빈도 기반 재분류 스크립트 v1.0           ║');
  console.log('║  목표: 실제 사용되는 한자만 선별          ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  // Step 1: 현재 상태 확인
  console.log('========================================');
  console.log('Step 1: 현재 상태 확인');
  console.log('========================================\n');

  const beforeGood = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const beforeBad = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false }
  });

  console.log(`현재 Good: ${beforeGood}자`);
  console.log(`현재 Bad: ${beforeBad}자\n`);

  // Step 2: Seed 한자 목록 로드 (보호 대상)
  console.log('========================================');
  console.log('Step 2: Seed 한자 보호 목록 로드');
  console.log('========================================\n');

  const seedPath = join(process.cwd(), 'scripts/etl/data/good-hanja-seed.json');
  const seedData = JSON.parse(readFileSync(seedPath, 'utf-8'));
  const protectedChars = seedData
    .filter((item: any) => item.isGoodForNaming === true)
    .map((item: any) => item.char);

  console.log(`보호 대상 한자: ${protectedChars.length}자`);
  console.log(`예시: ${protectedChars.slice(0, 10).join(', ')} ...\n`);

  // Step 3: 빈도 < 10인 한자를 false로 변경 (단, seed는 제외)
  console.log('========================================');
  console.log('Step 3: 빈도 낮은 한자 재분류');
  console.log('========================================\n');

  console.log('🔍 대상: nameFrequency < 10 AND NOT in seed\n');

  // 먼저 후보 확인
  const candidates = await prisma.hanjaDict.findMany({
    where: {
      OR: [
        { nameFrequency: { lt: 10 } },
        { nameFrequency: null }
      ],
      character: { notIn: protectedChars },
      isSurname: false
    },
    select: {
      character: true,
      meaning: true,
      nameFrequency: true,
      isGoodForNaming: true
    }
  });

  console.log(`📝 재분류 후보: ${candidates.length}자\n`);

  // 현재 Good인 애들만 카운트
  const goodToFalse = candidates.filter(c => c.isGoodForNaming === true).length;
  console.log(`  현재 Good → false 변경: ${goodToFalse}자`);
  console.log(`  현재 false → 유지: ${candidates.length - goodToFalse}자\n`);

  // 실제 업데이트
  const result = await prisma.hanjaDict.updateMany({
    where: {
      OR: [
        { nameFrequency: { lt: 10 } },
        { nameFrequency: null }
      ],
      character: { notIn: protectedChars },
      isSurname: false
    },
    data: {
      isGoodForNaming: false
    }
  });

  console.log(`✅ 재분류 완료: ${result.count}자 업데이트\n`);

  // Step 4: 빈도 >= 10인 한자는 true로 설정
  console.log('========================================');
  console.log('Step 4: 빈도 높은 한자 승인');
  console.log('========================================\n');

  console.log('🔍 대상: nameFrequency >= 10 AND isSurname = false\n');

  const highFreqResult = await prisma.hanjaDict.updateMany({
    where: {
      nameFrequency: { gte: 10 },
      isSurname: false,
      isGoodForNaming: { not: true }  // 아직 true가 아닌 것만
    },
    data: {
      isGoodForNaming: true
    }
  });

  console.log(`✅ 승인 완료: ${highFreqResult.count}자 업데이트\n`);

  // Step 5: 최종 결과
  console.log('========================================');
  console.log('Step 5: 최종 결과');
  console.log('========================================\n');

  const afterGood = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const afterBad = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false }
  });

  const afterNull = await prisma.hanjaDict.count({
    where: { isGoodForNaming: null }
  });

  console.log('📊 재분류 결과:\n');
  console.log(`  Before: Good ${beforeGood}자 | Bad ${beforeBad}자`);
  console.log(`  After:  Good ${afterGood}자 | Bad ${afterBad}자 | Null ${afterNull}자\n`);

  console.log(`  변화: Good ${beforeGood} → ${afterGood} (${afterGood - beforeGood > 0 ? '+' : ''}${afterGood - beforeGood}자)\n`);

  // 빈도 분포
  const freqDist = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    where: {
      isGoodForNaming: true
    },
    _count: true
  });

  // Good 한자 중 빈도 분포
  const goodHighFreq = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: 50 }
    }
  });

  const goodMediumFreq = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: 10, lt: 50 }
    }
  });

  const goodLowFreq = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      OR: [
        { nameFrequency: { lt: 10 } },
        { nameFrequency: null }
      ]
    }
  });

  console.log('📈 Good 한자 빈도 분포:\n');
  console.log(`  빈도 >= 50 (높음): ${goodHighFreq}자`);
  console.log(`  빈도 10-49 (중간): ${goodMediumFreq}자`);
  console.log(`  빈도 < 10 (낮음, seed 보호): ${goodLowFreq}자\n`);

  // 오행 분포
  const elementDist = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: {
      isGoodForNaming: true,
      element: { not: null }
    },
    _count: true
  });

  console.log('🎨 Good 한자 오행 분포:\n');
  elementDist.forEach(item => {
    console.log(`  ${item.element}: ${item._count}자`);
  });

  // 성씨 제외한 작명 가능 한자
  const namingReady = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      isSurname: false
    }
  });

  console.log(`\n🎯 작명 가능 한자 (Good + 비성씨): ${namingReady}자\n`);

  console.log('========================================');
  console.log('✅ 빈도 기반 재분류 완료!');
  console.log('========================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
