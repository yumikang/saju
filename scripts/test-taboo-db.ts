import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  const testChars = ['瘂', '病', '死', '殘', '窮', '乞', '貧', '美', '善', '秀'];

  const results = await prisma.hanjaDict.findMany({
    where: { character: { in: testChars } },
    select: {
      character: true,
      meaning: true,
      isGoodForNaming: true,
      review: true
    }
  });

  console.log('\n=== 테스트 한자 DB 상태 ===\n');
  results.forEach(r => {
    const status = r.isGoodForNaming ? '✅ GOOD' : '❌ BAD';
    console.log(`${status} ${r.character} (${r.meaning}) - review: ${r.review}`);
  });
  console.log(`\n총 ${results.length}개 한자 조회됨\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
