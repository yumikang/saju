#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== "유" 한자 통계 ===\n');

  const total = await prisma.hanjaDict.count({
    where: {
      koreanReading: { in: ['유', '류'] },
      isGoodForNaming: true,
      nameFrequency: { gte: 50 }
    }
  });

  const withFreq = await prisma.hanjaDict.count({
    where: {
      koreanReading: { in: ['유', '류'] },
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 },
      nameFrequency: { gte: 50 }
    }
  });

  const seedProtected = await prisma.hanjaDict.count({
    where: {
      koreanReading: { in: ['유', '류'] },
      seedProtected: true
    }
  });

  console.log('isGoodForNaming: true 인 "유" 한자:', total, '개');
  console.log('inferredNameFrequency > 0 인 한자:', withFreq, '개');
  console.log('seedProtected (사람이 선별) 한자:', seedProtected, '개');

  // 샘플 확인
  console.log('\n실제 드롭다운에 표시되는 한자 (상위 10개):');
  const samples = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isGoodForNaming: true,
      nameFrequency: { gte: 50 }
    },
    select: {
      character: true,
      meaning: true,
      inferredNameFrequency: true,
      seedProtected: true
    },
    orderBy: [
      { inferredNameFrequency: 'desc' },
      { nameFrequency: 'desc' },
      { character: 'asc' }
    ],
    take: 10
  });

  samples.forEach((h, idx) => {
    const seed = h.seedProtected ? '🌱' : '  ';
    console.log(`${seed} ${idx + 1}. ${h.character} (${h.meaning}) - 빈도: ${h.inferredNameFrequency}`);
  });
}

main().finally(() => prisma.$disconnect());
