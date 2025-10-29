import { PrismaClient, Element } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function main() {
  const elements: Element[] = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];
  
  console.log('\n=== 이름 작명 가능한 한자 통계 ===\n');
  
  for (const element of elements) {
    const total = await prisma.hanjaDict.count({ where: { element } });
    const good = await prisma.hanjaDict.count({ where: { element, isGoodForNaming: true } });
    const bad = total - good;
    const pct = ((good / total) * 100).toFixed(1);
    
    console.log(`${element}: ${good}/${total} (${pct}%) - ❌ ${bad}개 제외`);
  }
  
  const totalAll = await prisma.hanjaDict.count();
  const goodAll = await prisma.hanjaDict.count({ where: { isGoodForNaming: true } });
  const badAll = totalAll - goodAll;
  const pctAll = ((goodAll / totalAll) * 100).toFixed(1);
  
  console.log(`\n전체: ${goodAll}/${totalAll} (${pctAll}%) - ❌ ${badAll}개 제외\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
