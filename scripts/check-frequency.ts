#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const chars = ['神', '斗', '梓', '浦', '池', '楚', '翤', '枇'];
  const result = await prisma.hanjaDict.findMany({
    where: { character: { in: chars } },
    select: { character: true, meaning: true, nameFrequency: true, usageFrequency: true }
  });

  console.log('빈도 데이터 샘플:');
  result.forEach(h => {
    console.log(`  ${h.character} - ${h.meaning} [이름:${h.nameFrequency}, 사용:${h.usageFrequency}]`);
  });

  await prisma.$disconnect();
}

main();
