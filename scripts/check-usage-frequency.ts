#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // "유" 한자를 usageFrequency로 정렬
  const yuHanja = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isSurname: false,
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 }
    },
    select: {
      character: true,
      meaning: true,
      usageFrequency: true,
      nameFrequency: true,
      inferredNameFrequency: true,
    },
    orderBy: [
      { usageFrequency: 'desc' },
      { nameFrequency: 'desc' }
    ],
    take: 20
  });

  console.log('\n"유" 음절 (usageFrequency 높은 순):');
  yuHanja.forEach((h, idx) => {
    console.log(`${idx + 1}. ${h.character} (${h.meaning}) - usage: ${h.usageFrequency || 0}, name: ${h.nameFrequency}, inferred: ${h.inferredNameFrequency}`);
  });

  // 문제의 한자들 확인
  const strangeOnes = await prisma.hanjaDict.findMany({
    where: {
      character: { in: ['蚰', '鼬', '蚴'] }
    },
    select: {
      character: true,
      meaning: true,
      usageFrequency: true,
      nameFrequency: true,
      isGoodForNaming: true,
    }
  });

  console.log('\n\n문제의 한자들:');
  strangeOnes.forEach(h => {
    console.log(`  ${h.character} (${h.meaning}) - usage: ${h.usageFrequency || 0}, isGood: ${h.isGoodForNaming}`);
  });
}

main().finally(() => prisma.$disconnect());
