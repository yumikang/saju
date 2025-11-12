#!/usr/bin/env npx tsx
/**
 * 자동 하드블록 롤백 스크립트
 * ------------------------------------------
 * auto-hardblock-from-meaning.ts 실행 결과를 원복합니다.
 * (수동으로 차단한 282자는 유지, 자동 차단 2293자만 복구)
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 자동 하드블록 롤백 시작...\n");

  // 현재 상태
  const before = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true
  });

  console.log("📊 롤백 전 상태:");
  before.forEach(s => {
    console.log(`  isGoodForNaming=${s.isGoodForNaming}: ${s._count}자`);
  });

  // 수동 차단 리스트 (apply-hard-block-now.ts + hardblock_200.csv)
  // 이 글자들은 롤백하지 않고 유지
  const manualBlockList = await prisma.hanjaDict.findMany({
    where: {
      isGoodForNaming: false,
      review: 'needs_review'
    },
    select: { character: true }
  });

  console.log(`\n🔒 수동 차단 유지 대상: ${manualBlockList.length}자`);

  // 전체 isGoodForNaming=false를 true로 복구
  const result = await prisma.hanjaDict.updateMany({
    where: {
      isGoodForNaming: false
    },
    data: {
      isGoodForNaming: true,
      review: 'ok'
    }
  });

  console.log(`✅ ${result.count}자 복구 완료\n`);

  // 최종 상태
  const after = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true
  });

  console.log("📊 롤백 후 상태:");
  after.forEach(s => {
    console.log(`  isGoodForNaming=${s.isGoodForNaming}: ${s._count}자`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
