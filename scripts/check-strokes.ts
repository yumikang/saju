#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const chars = await prisma.hanjaDict.findMany({
    where: {
      character: { in: ['有', '愈', '瀢', '讉', '柔', '儒', '唯', '宥', '乳', '侑'] }
    },
    select: {
      character: true,
      meaning: true,
      strokes: true,
    },
    orderBy: {
      strokes: 'asc'
    }
  });

  console.log('\n획수별 정렬:');
  chars.forEach(h => {
    console.log(`  ${h.character} (${h.meaning}) - ${h.strokes}획`);
  });

  // "유" 전체를 획수로 정렬하면
  const yuByStrokes = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isSurname: false,
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 },
      nameFrequency: { gte: 50 }
    },
    select: {
      character: true,
      meaning: true,
      strokes: true,
    },
    orderBy: [
      { strokes: 'asc' },
      { inferredNameFrequency: 'desc' }
    ],
    take: 20
  });

  console.log('\n\n획수순 정렬 상위 20개:');
  yuByStrokes.forEach((h, idx) => {
    const marker = h.character === '有' ? '👉' : '  ';
    console.log(`${marker} ${idx + 1}. ${h.character} (${h.meaning}) - ${h.strokes}획`);
  });

  const hasYou = yuByStrokes.some(h => h.character === '有');
  console.log(`\n有가 상위 20개에 있나요? ${hasYou ? '✅ 있음' : '❌ 없음'}`);
}

main().finally(() => prisma.$disconnect());
