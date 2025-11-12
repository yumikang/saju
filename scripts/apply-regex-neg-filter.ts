#!/usr/bin/env npx tsx
/**
 * 정규식 기반 부정어 필터 적용
 * ------------------------------------------
 * 화이트리스트 우선 → 정규식 매칭 → 동사형 가중치
 */

import { PrismaClient } from '@prisma/client';
import { SAFE_EXCEPTIONS } from '../app/lib/naming/filters/safe-exceptions';
import { isNegativeByRegex, looksLikeVerbish } from '../app/lib/naming/filters/neg-lex';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('🔍 정규식 기반 부정어 필터 시작...');
  if (DRY_RUN) {
    console.log('⚠️  DRY-RUN 모드: DB 변경하지 않음\n');
  } else {
    console.log('⚠️  실제 적용 모드: DB 업데이트 진행\n');
  }

  const safeSet = new Set(SAFE_EXCEPTIONS);

  const hanjas = await prisma.hanjaDict.findMany({
    where: {
      meaning: { not: null },
      isGoodForNaming: true
    },
    select: {
      id: true,
      character: true,
      meaning: true,
    },
  });

  console.log(`📊 검사 대상: ${hanjas.length}자\n`);

  let hardBlocked = 0;
  let skipped = 0;
  const blockedList: Array<{ char: string; meaning: string; reason: string }> = [];

  for (const h of hanjas) {
    const char = h.character;
    const meaning = h.meaning ?? "";

    // 1. 화이트리스트 우선 체크
    if (safeSet.has(char)) {
      skipped++;
      continue;
    }

    // 2. 정규식 매칭
    const negByRegex = isNegativeByRegex(meaning);
    if (!negByRegex) {
      skipped++;
      continue;
    }

    // 3. 동사형 확인 (행동적 부정은 하드블록)
    const verbish = looksLikeVerbish(meaning);
    const shouldBlock = negByRegex && verbish;

    if (shouldBlock) {
      if (!DRY_RUN) {
        await prisma.hanjaDict.update({
          where: { id: h.id },
          data: {
            isGoodForNaming: false,
            review: 'needs_review'
          },
        });
      }

      hardBlocked++;
      blockedList.push({
        char,
        meaning,
        reason: '부정행위(동사형)'
      });

      if (hardBlocked <= 50) {
        console.log(`${DRY_RUN ? '🔸' : '🚫'} 하드블록: ${char} - ${meaning}`);
      }
    } else {
      skipped++;
    }
  }

  if (hardBlocked > 50) {
    console.log(`... 외 ${hardBlocked - 50}자 더 차단됨\n`);
  }

  // 최종 통계
  console.log(`\n📊 ${DRY_RUN ? 'DRY-RUN' : '실행'} 결과:`);
  console.log(`  하드블록 ${DRY_RUN ? '예정' : '완료'}: ${hardBlocked}자`);
  console.log(`  통과: ${skipped}자`);

  if (!DRY_RUN) {
    const finalStats = await prisma.hanjaDict.groupBy({
      by: ['isGoodForNaming'],
      _count: true,
    });

    console.log(`\n📊 최종 DB 통계:`);
    finalStats.forEach((s) => {
      console.log(`  isGoodForNaming=${s.isGoodForNaming}: ${s._count}자`);
    });
  }

  // 샘플 출력
  if (blockedList.length > 0) {
    console.log(`\n📋 차단 대상 샘플 (처음 30개):`);
    blockedList.slice(0, 30).forEach(({ char, meaning }) => {
      console.log(`  ${char} - ${meaning}`);
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 오류 발생:', e);
  process.exit(1);
});
