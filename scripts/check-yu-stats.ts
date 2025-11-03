#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // "유" 음절 통계
  const stats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true,
    where: {
      koreanReading: { in: ['유', '류'] },
      isSurname: false,
      nameFrequency: { gte: 50 }
    },
  });

  console.log('\n"유" 음절 (nameFrequency >= 50):');
  stats.forEach(stat => {
    const label = stat.isGoodForNaming === true ? 'TRUE'
                : stat.isGoodForNaming === false ? 'FALSE'
                : 'NULL';
    console.log(`  ${label}: ${stat._count}개`);
  });

  // 전체 (빈도 무관)
  const allStats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true,
    where: {
      koreanReading: { in: ['유', '류'] },
      isSurname: false,
    },
  });

  console.log('\n"유" 음절 (전체):');
  allStats.forEach(stat => {
    const label = stat.isGoodForNaming === true ? 'TRUE'
                : stat.isGoodForNaming === false ? 'FALSE'
                : 'NULL';
    console.log(`  ${label}: ${stat._count}개`);
  });

  // 샘플 5개
  const samples = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isSurname: false,
      nameFrequency: { gte: 50 }
    },
    select: {
      character: true,
      meaning: true,
      isGoodForNaming: true,
      nameFrequency: true,
    },
    orderBy: [
      { nameFrequency: 'desc' }
    ],
    take: 10,
  });

  console.log('\n샘플 (nameFrequency 높은 순):');
  samples.forEach(s => {
    const status = s.isGoodForNaming === true ? '✅'
                 : s.isGoodForNaming === false ? '🚫'
                 : '❓';
    console.log(`  ${status} ${s.character} (${s.meaning}) - nameFreq: ${s.nameFrequency}`);
  });
}

main().finally(() => prisma.$disconnect());
