#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // TRUE인데 inferredNameFrequency = 0인 한자
  const trueWithoutFreq = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      isSurname: false,
      OR: [
        { inferredNameFrequency: 0 },
        { inferredNameFrequency: null }
      ]
    }
  });

  console.log(`\nTRUE인데 inferredNameFrequency = 0 또는 null: ${trueWithoutFreq}개`);

  // 전체 TRUE 한자
  const totalTrue = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      isSurname: false
    }
  });

  console.log(`전체 TRUE: ${totalTrue}개`);
  console.log(`비율: ${((trueWithoutFreq / totalTrue) * 100).toFixed(1)}%`);

  // "유" 음절에서 TRUE인데 inferredNameFrequency = 0인 한자
  const yuStats = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isSurname: false,
      isGoodForNaming: true,
    },
    select: {
      character: true,
      meaning: true,
      inferredNameFrequency: true,
      nameFrequency: true,
    },
    orderBy: [
      { inferredNameFrequency: 'desc' }
    ],
    take: 10
  });

  console.log('\n"유" 음절 TRUE 한자 샘플:');
  yuStats.forEach(h => {
    console.log(`  ${h.character} (${h.meaning}) - inferred: ${h.inferredNameFrequency || 0}, name: ${h.nameFrequency || 0}`);
  });
}

main().finally(() => prisma.$disconnect());
