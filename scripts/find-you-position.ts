#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // "유" 읽기로 검색되는 모든 한자
  const allYu = await prisma.hanjaDict.findMany({
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
      id: true,
    },
    orderBy: [
      { inferredNameFrequency: 'desc' },
      { nameFrequency: 'desc' }
    ],
  });

  console.log(`\n전체 "유" 한자: ${allYu.length}개\n`);

  // 有의 위치 찾기
  const youIndex = allYu.findIndex(h => h.character === '有');

  if (youIndex >= 0) {
    console.log(`有의 위치: ${youIndex + 1}번째 (0-based index: ${youIndex})`);
    console.log(`有: ${allYu[youIndex].meaning} (ID: ${allYu[youIndex].id})\n`);

    // 주변 한자들 보기
    console.log('주변 한자:');
    const start = Math.max(0, youIndex - 3);
    const end = Math.min(allYu.length, youIndex + 4);

    for (let i = start; i < end; i++) {
      const marker = i === youIndex ? '👉' : '  ';
      console.log(`${marker} ${i + 1}. ${allYu[i].character} (${allYu[i].meaning}) - ID: ${allYu[i].id}`);
    }
  } else {
    console.log('❌ 有가 목록에 없습니다!');
  }

  // 정렬이 제대로 안 되는 이유 확인
  console.log('\n\n정렬 데이터 확인 (상위 5개):');
  const withFreq = await prisma.hanjaDict.findMany({
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
      nameFrequency: true,
      usageFrequency: true,
      id: true,
    },
    orderBy: [
      { inferredNameFrequency: 'desc' },
      { nameFrequency: 'desc' }
    ],
    take: 5
  });

  withFreq.forEach((h, idx) => {
    console.log(`${idx + 1}. ${h.character} (${h.meaning})`);
    console.log(`   inferred: ${h.inferredNameFrequency}, name: ${h.nameFrequency}, usage: ${h.usageFrequency}, id: ${h.id}`);
  });
}

main().finally(() => prisma.$disconnect());
