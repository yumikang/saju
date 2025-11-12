#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 有 한자 확인
  const yu = await prisma.hanjaDict.findFirst({
    where: { character: '有' }
  });

  console.log('=== 有 한자 정보 ===');
  console.log(JSON.stringify(yu, null, 2));

  // 유 읽기로 검색 (현재 필터 조건)
  const yuResults = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: '유',
      isGoodForNaming: true,
      nameFrequency: { gte: 50 }
    },
    take: 10,
    orderBy: [
      { nameFrequency: 'desc' },
      { usageFrequency: 'desc' }
    ]
  });

  console.log('\n=== 현재 필터 조건으로 검색된 "유" 한자들 ===');
  console.log(`총 ${yuResults.length}개`);
  yuResults.forEach(h => {
    console.log(`${h.character} (${h.koreanReading}): nameFreq=${h.nameFrequency}, isGood=${h.isGoodForNaming}, review=${h.review}`);
  });

  // 모든 유 한자 확인 (필터 없이)
  const allYu = await prisma.hanjaDict.findMany({
    where: { koreanReading: '유' },
    orderBy: { nameFrequency: 'desc' }
  });

  console.log('\n=== 모든 "유" 한자 (필터 없음) ===');
  console.log(`총 ${allYu.length}개`);
  allYu.slice(0, 20).forEach(h => {
    console.log(`${h.character}: nameFreq=${h.nameFrequency}, isGood=${h.isGoodForNaming}, review=${h.review}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
