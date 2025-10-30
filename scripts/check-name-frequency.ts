#!/usr/bin/env npx tsx
/**
 * nameFrequency 분포 확인 스크립트
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 nameFrequency 분포 분석\n');

  // 전체 통계
  const total = await prisma.hanjaDict.count();
  console.log(`총 한자: ${total}자\n`);

  // nameFrequency 분포
  const freqHigh = await prisma.hanjaDict.count({
    where: { nameFrequency: { gte: 50 } }
  });

  const freqMedium = await prisma.hanjaDict.count({
    where: {
      nameFrequency: { gte: 10, lt: 50 }
    }
  });

  const freqLow = await prisma.hanjaDict.count({
    where: {
      nameFrequency: { gt: 0, lt: 10 }
    }
  });

  const freqZero = await prisma.hanjaDict.count({
    where: {
      OR: [
        { nameFrequency: 0 },
        { nameFrequency: null }
      ]
    }
  });

  console.log('📈 nameFrequency 분포:');
  console.log(`  >= 50 (높음):   ${freqHigh}자`);
  console.log(`  10-49 (중간):   ${freqMedium}자`);
  console.log(`  1-9 (낮음):     ${freqLow}자`);
  console.log(`  0 or null:      ${freqZero}자\n`);

  // isGoodForNaming 별 통계
  const goodStats = await prisma.hanjaDict.aggregate({
    where: { isGoodForNaming: true },
    _count: true,
    _avg: { nameFrequency: true },
    _max: { nameFrequency: true },
    _min: { nameFrequency: true }
  });

  const badStats = await prisma.hanjaDict.aggregate({
    where: { isGoodForNaming: false },
    _count: true,
    _avg: { nameFrequency: true },
    _max: { nameFrequency: true },
    _min: { nameFrequency: true }
  });

  console.log('✅ isGoodForNaming = true:');
  console.log(`  개수: ${goodStats._count}자`);
  console.log(`  평균 빈도: ${goodStats._avg.nameFrequency?.toFixed(1) || 0}`);
  console.log(`  최대 빈도: ${goodStats._max.nameFrequency || 0}`);
  console.log(`  최소 빈도: ${goodStats._min.nameFrequency || 0}\n`);

  console.log('🚫 isGoodForNaming = false:');
  console.log(`  개수: ${badStats._count}자`);
  console.log(`  평균 빈도: ${badStats._avg.nameFrequency?.toFixed(1) || 0}`);
  console.log(`  최대 빈도: ${badStats._max.nameFrequency || 0}`);
  console.log(`  최소 빈도: ${badStats._min.nameFrequency || 0}\n`);

  // Good 중에서 빈도 0인 한자
  const goodButZeroFreq = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      OR: [
        { nameFrequency: 0 },
        { nameFrequency: null }
      ]
    }
  });

  console.log(`⚠️  문제: Good인데 빈도 0: ${goodButZeroFreq}자\n`);

  // Good 중에서 낮은 빈도 (1-9)
  const goodButLowFreq = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gt: 0, lt: 10 }
    }
  });

  console.log(`⚠️  문제: Good인데 빈도 1-9: ${goodButLowFreq}자\n`);

  // 샘플: Good인데 빈도 0인 한자 10개
  const samples = await prisma.hanjaDict.findMany({
    where: {
      isGoodForNaming: true,
      OR: [
        { nameFrequency: 0 },
        { nameFrequency: null }
      ]
    },
    take: 10
  });

  console.log('📋 샘플 (Good인데 빈도 0):');
  samples.forEach(h => {
    console.log(`  ${h.character} (${h.meaning || '의미없음'}) - 빈도: ${h.nameFrequency || 0}`);
  });

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
