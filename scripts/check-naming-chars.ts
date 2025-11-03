import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function main() {
  // 1. 전체 통계
  const total = await prisma.hanjaDict.count();
  const goodForNaming = await prisma.hanjaDict.count({ where: { isGoodForNaming: true } });

  // 2. nameFrequency가 있는 것들 (실제 이름에 사용된 적 있는 한자)
  const hasNameFreq = await prisma.hanjaDict.count({
    where: { nameFrequency: { gt: 0 } }
  });
  const goodAndNameFreq = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true, nameFrequency: { gt: 0 } }
  });

  // 3. 실제 인명용 한자 (nameFrequency > 100인 한자들)
  const popularNaming = await prisma.hanjaDict.count({
    where: { nameFrequency: { gt: 100 } }
  });
  const goodAndPopular = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true, nameFrequency: { gt: 100 } }
  });

  // 4. 매우 인기있는 한자 (nameFrequency > 1000)
  const veryPopular = await prisma.hanjaDict.count({
    where: { nameFrequency: { gt: 1000 } }
  });
  const goodAndVeryPopular = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true, nameFrequency: { gt: 1000 } }
  });

  console.log('\n=== 한자 DB 상세 분석 ===\n');
  console.log(`전체 한자: ${total}개`);
  console.log(`  └─ isGoodForNaming=true: ${goodForNaming}개 (${((goodForNaming/total)*100).toFixed(1)}%)\n`);

  console.log(`실제 이름 사용 이력 있음 (nameFrequency > 0): ${hasNameFreq}개`);
  console.log(`  └─ 그 중 isGoodForNaming=true: ${goodAndNameFreq}개 (${((goodAndNameFreq/hasNameFreq)*100).toFixed(1)}%)\n`);

  console.log(`인기 있는 작명용 한자 (nameFrequency > 100): ${popularNaming}개`);
  console.log(`  └─ 그 중 isGoodForNaming=true: ${goodAndPopular}개 (${((goodAndPopular/popularNaming)*100).toFixed(1)}%)\n`);

  console.log(`매우 인기 많은 한자 (nameFrequency > 1000): ${veryPopular}개`);
  console.log(`  └─ 그 중 isGoodForNaming=true: ${goodAndVeryPopular}개 (${((goodAndVeryPopular/veryPopular)*100).toFixed(1)}%)\n`);

  // 5. 샘플 확인 - 인기 있는 한자 중 제외된 것들
  const excludedPopular = await prisma.hanjaDict.findMany({
    where: {
      isGoodForNaming: false,
      nameFrequency: { gt: 1000 }
    },
    select: { character: true, meaning: true, nameFrequency: true, review: true },
    orderBy: { nameFrequency: 'desc' },
    take: 20
  });

  if (excludedPopular.length > 0) {
    console.log(`⚠️  인기 있는데 제외된 한자 (nameFrequency > 1000):`);
    excludedPopular.forEach(c => {
      console.log(`  ${c.character} (${c.meaning}) - 사용빈도: ${c.nameFrequency}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
