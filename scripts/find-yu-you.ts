#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 有 한자 찾기
  const you = await prisma.hanjaDict.findFirst({
    where: {
      character: '有'
    },
    select: {
      character: true,
      meaning: true,
      koreanReading: true,
      isGoodForNaming: true,
      isSurname: true,
      nameFrequency: true,
      usageFrequency: true,
      inferredNameFrequency: true,
    }
  });

  console.log('\n有 한자 상태:');
  if (you) {
    console.log(`  문자: ${you.character}`);
    console.log(`  의미: ${you.meaning}`);
    console.log(`  읽기: ${you.koreanReading}`);
    console.log(`  isGoodForNaming: ${you.isGoodForNaming}`);
    console.log(`  isSurname: ${you.isSurname}`);
    console.log(`  nameFrequency: ${you.nameFrequency}`);
    console.log(`  usageFrequency: ${you.usageFrequency}`);
    console.log(`  inferredNameFrequency: ${you.inferredNameFrequency}`);
  } else {
    console.log('  ❌ DB에 없음!');
  }

  // "유" 읽기로 검색되는 모든 한자 (API 조건과 동일)
  const yuChars = await prisma.hanjaDict.findMany({
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
      inferredNameFrequency: true,
    },
    orderBy: [
      { inferredNameFrequency: 'desc' },
      { nameFrequency: 'desc' }
    ],
    take: 10
  });

  console.log('\n\n현재 API에서 반환되는 상위 10개:');
  yuChars.forEach((h, idx) => {
    console.log(`${idx + 1}. ${h.character} (${h.meaning})`);
  });

  // 有가 목록에 있는지 확인
  const hasYou = yuChars.some(h => h.character === '有');
  console.log(`\n有가 목록에 있나요? ${hasYou ? '✅ 있음' : '❌ 없음'}`);
}

main().finally(() => prisma.$disconnect());
