#!/usr/bin/env npx tsx
/**
 * Test API with popularity sort
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const results = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 },
      nameFrequency: { gte: 50 }
    },
    select: {
      character: true,
      meaning: true,
      inferredNameFrequency: true,
      strokes: true,
    },
    orderBy: [
      { inferredNameFrequency: 'desc' },
      { nameFrequency: 'desc' }
    ],
    take: 30
  });

  console.log('\n=== "유" 드롭다운 - 빈도수순 상위 30개 ===\n');

  results.forEach((h, idx) => {
    const marker = h.character === '有' ? '👉' : '  ';
    console.log(`${marker} ${idx + 1}. ${h.character} (${h.meaning}) - 빈도: ${h.inferredNameFrequency}, 획수: ${h.strokes}`);
  });

  const youIndex = results.findIndex(h => h.character === '有');
  if (youIndex >= 0) {
    console.log(`\n✅ 有는 ${youIndex + 1}번째에 있습니다!`);
  } else {
    console.log(`\n❌ 有가 상위 30개에 없습니다.`);
  }
}

main().finally(() => prisma.$disconnect());
