#!/usr/bin/env npx tsx
/**
 * 정규식 매칭 디버깅
 */
import { PrismaClient } from '@prisma/client';
import { isNegativeByRegex, looksLikeVerbish } from '../app/lib/naming/filters/neg-lex';

const prisma = new PrismaClient();

async function main() {
  // 부정적 의미를 가질 것 같은 한자들 샘플 확인
  const testChars = ['偵', '盜', '竊', '詐', '欺', '殺', '恨', '憎', '嫉', '妬'];

  const hanjas = await prisma.hanjaDict.findMany({
    where: {
      character: { in: testChars },
      isGoodForNaming: true
    },
    select: {
      character: true,
      meaning: true,
    },
  });

  console.log('🔍 부정적 의미 한자 샘플 테스트:\n');

  hanjas.forEach(h => {
    const char = h.character;
    const meaning = h.meaning ?? "";
    const negByRegex = isNegativeByRegex(meaning);
    const verbish = looksLikeVerbish(meaning);

    console.log(`${char} - ${meaning}`);
    console.log(`  → negByRegex: ${negByRegex}, verbish: ${verbish}, shouldBlock: ${negByRegex && verbish}\n`);
  });

  await prisma.$disconnect();
}

main();
