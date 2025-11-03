#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // "이" 포함으로 FALSE가 된 한자 샘플
  const blocked = await prisma.hanjaDict.findMany({
    where: {
      meaning: { contains: '이' },
      isGoodForNaming: false,
      inferredNameFrequency: { gt: 0 }  // 출생 데이터 있던 것만
    },
    select: {
      character: true,
      meaning: true,
      koreanReading: true,
      inferredNameFrequency: true,
    },
    orderBy: {
      inferredNameFrequency: 'desc'
    },
    take: 30
  });

  console.log('\n"이" 포함으로 막힌 한자 샘플 (출생 데이터 있음):');
  blocked.forEach((h, idx) => {
    console.log(`${idx + 1}. ${h.character} (${h.meaning}) - ${h.koreanReading} - ${h.inferredNameFrequency}`);
  });

  // 좋은 한자가 막혔는지 확인
  const goodOnes = blocked.filter(h =>
    h.meaning && (
      h.meaning.includes('어질') ||
      h.meaning.includes('아들') ||
      h.meaning.includes('이치') ||
      h.meaning.includes('아이') ||
      h.meaning.includes('아름다울')
    )
  );

  if (goodOnes.length > 0) {
    console.log('\n⚠️ 좋은 한자도 막혔습니다:');
    goodOnes.forEach(h => {
      console.log(`  ${h.character} (${h.meaning})`);
    });
  }
}

main().finally(() => prisma.$disconnect());
