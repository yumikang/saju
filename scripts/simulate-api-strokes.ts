#!/usr/bin/env npx tsx
/**
 * API 응답 시뮬레이션: sort=strokes, limit=20
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== sort=strokes, limit=20 시뮬레이션 ===\n');

  // STAGE 1: inferredNameFrequency > 0인 한자만
  const verifiedResults = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 },
      nameFrequency: { gte: 50 }
    },
    select: {
      character: true,
      meaning: true,
      strokes: true,
      inferredNameFrequency: true,
    },
    orderBy: [
      { strokes: 'asc' },
      { id: 'asc' }
    ],
    take: 40  // targetLimit (20 * 2)
  });

  console.log(`STAGE 1 결과: ${verifiedResults.length}개\n`);

  verifiedResults.slice(0, 20).forEach((h, idx) => {
    const marker = h.character === '有' ? '👉' : '  ';
    console.log(`${marker} ${idx + 1}. ${h.character} (${h.meaning}) - ${h.strokes}획`);
  });

  const hasYou = verifiedResults.slice(0, 20).some(h => h.character === '有');
  console.log(`\n有가 상위 20개에 있나요? ${hasYou ? '✅ 있음' : '❌ 없음'}`);

  if (!hasYou) {
    const youIndex = verifiedResults.findIndex(h => h.character === '有');
    if (youIndex >= 0) {
      console.log(`有의 실제 위치: ${youIndex + 1}번째 (40개 중)`);
    }
  }
}

main().finally(() => prisma.$disconnect());
