#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // "유" 한자 중 이상한 의미들
  const strangeHanja = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isSurname: false,
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 }
    },
    select: {
      character: true,
      meaning: true,
      inferredNameFrequency: true,
      nameFrequency: true,
      isGoodForNaming: true,
    },
    orderBy: [
      { inferredNameFrequency: 'desc' },
      { nameFrequency: 'desc' }
    ],
    take: 20
  });

  console.log('\n"유" 음절 상위 20개:');
  strangeHanja.forEach((h, idx) => {
    console.log(`${idx + 1}. ${h.character} (${h.meaning}) - inferred: ${h.inferredNameFrequency}, name: ${h.nameFrequency}`);
  });

  // 벌레 관련 한자 찾기
  const bugHanja = await prisma.hanjaDict.findMany({
    where: {
      meaning: {
        contains: '벌레'
      },
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 }
    },
    select: {
      character: true,
      meaning: true,
      koreanReading: true,
      inferredNameFrequency: true,
    }
  });

  console.log('\n\n벌레 관련 한자가 TRUE로 마킹됨:');
  bugHanja.forEach(h => {
    console.log(`  ${h.character} (${h.meaning}) - ${h.koreanReading} - ${h.inferredNameFrequency}`);
  });

  // 동물/벌레 키워드로 검색
  const animalKeywords = ['벌레', '충', '짐승', '쥐', '개미', '파리', '모기', '거미'];

  for (const keyword of animalKeywords) {
    const count = await prisma.hanjaDict.count({
      where: {
        meaning: { contains: keyword },
        isGoodForNaming: true,
        inferredNameFrequency: { gt: 0 }
      }
    });

    if (count > 0) {
      console.log(`\n"${keyword}" 포함: ${count}개`);
    }
  }
}

main().finally(() => prisma.$disconnect());
