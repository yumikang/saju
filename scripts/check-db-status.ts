#!/usr/bin/env npx tsx
/**
 * DB 상태 확인 스크립트
 * 현재 HanjaDict 테이블의 필터링 상태를 확인
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 HanjaDict 테이블 현재 상태\n');
  console.log('='.repeat(60));

  // 전체 한자 수
  const total = await prisma.hanjaDict.count();
  console.log(`\n총 한자 수: ${total}자`);

  // isGoodForNaming 분포
  const goodCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });
  const badCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false }
  });
  const nullCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: null }
  });

  console.log(`\n📌 isGoodForNaming 분포:`);
  console.log(`  ✅ true  : ${goodCount}자 (${(goodCount/total*100).toFixed(1)}%)`);
  console.log(`  🚫 false : ${badCount}자 (${(badCount/total*100).toFixed(1)}%)`);
  console.log(`  ❓ null  : ${nullCount}자 (${(nullCount/total*100).toFixed(1)}%)`);

  // 성씨 분포
  const surnameCount = await prisma.hanjaDict.count({
    where: { isSurname: true }
  });
  const nonSurnameCount = await prisma.hanjaDict.count({
    where: { isSurname: false }
  });

  console.log(`\n📌 isSurname 분포:`);
  console.log(`  성씨: ${surnameCount}자`);
  console.log(`  비성씨: ${nonSurnameCount}자`);

  // genderHint 분포
  const femaleCount = await prisma.hanjaDict.count({
    where: { genderHint: 'female' }
  });
  const maleCount = await prisma.hanjaDict.count({
    where: { genderHint: 'male' }
  });
  const unisexCount = await prisma.hanjaDict.count({
    where: { genderHint: 'unisex' }
  });
  const noGenderCount = await prisma.hanjaDict.count({
    where: { genderHint: null }
  });

  console.log(`\n📌 genderHint 분포:`);
  console.log(`  female: ${femaleCount}자`);
  console.log(`  male: ${maleCount}자`);
  console.log(`  unisex: ${unisexCount}자`);
  console.log(`  null: ${noGenderCount}자`);
  console.log(`  태깅율: ${((femaleCount+maleCount+unisexCount)/total*100).toFixed(1)}%`);

  // 작명 가능한 한자 (good + 비성씨)
  const usableCount = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      isSurname: false
    }
  });

  console.log(`\n🎯 작명 가능 한자 (isGoodForNaming=true + 비성씨):`);
  console.log(`  ${usableCount}자`);

  // Phase 1 필터링 상태 확인 (부적절 한자 제외 여부)
  console.log(`\n📌 Phase 1 필터링 상태:`);
  console.log(`  현재 DB: ${total}자`);
  console.log(`  예상값 (필터링 적용): 2,749자`);
  console.log(`  예상값 (원본 그대로): 9,102자`);

  if (total > 8000) {
    console.log(`  ⚠️  원본 데이터가 그대로 있는 것으로 보입니다!`);
    console.log(`  ⚠️  Phase 1 필터링(부적절 한자 제외)이 적용되지 않았습니다.`);
  } else if (total < 3000) {
    console.log(`  ✅ Phase 1 필터링이 적용된 것으로 보입니다.`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
