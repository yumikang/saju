#!/usr/bin/env npx tsx
/**
 * 악기/사물 이름 한자 확인
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const testChars = ['鄽', '竽'];

  const result = await prisma.hanjaDict.findMany({
    where: { character: { in: testChars } },
    select: {
      character: true,
      meaning: true,
      isGoodForNaming: true,
      review: true
    }
  });

  console.log('🔍 악기/사물 이름 한자 확인:\n');
  result.forEach(h => {
    console.log(`${h.character} - ${h.meaning}`);
    console.log(`  isGoodForNaming: ${h.isGoodForNaming}`);
    console.log(`  review: ${h.review}\n`);
  });

  await prisma.$disconnect();
}

main();
