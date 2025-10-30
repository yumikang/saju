#!/usr/bin/env npx tsx
/**
 * Gender Hint 마킹 스크립트
 *
 * "성별 힌트" 시스템 구축:
 * - female: 여아 전용 한자
 * - male: 남아 전용 한자
 * - unisex: 공통 한자
 *
 * 전략:
 * 1. female-hanja-seed.json (50자) → genderHint = 'female'
 * 2. male-hanja-seed.json (51자) → genderHint = 'male'
 * 3. unisex-hanja-seed.json (16자) → genderHint = 'unisex'
 *
 * 중복 처리: 나중에 적용되는 것이 우선 (unisex가 가장 마지막)
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface HanjaItem {
  char: string;
  element: string;
  korean: string;
  isGoodForNaming: boolean;
  seedProtected?: boolean;
  genderHint: 'female' | 'male' | 'unisex';
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Gender Hint 마킹 스크립트 v1.0          ║');
  console.log('║  목표: 성별 힌트 시스템 구축              ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  // Step 1: 현재 상태 확인
  console.log('========================================');
  console.log('Step 1: 현재 상태 확인');
  console.log('========================================\n');

  const beforeFemale = await prisma.hanjaDict.count({
    where: { genderHint: 'female' }
  });

  const beforeMale = await prisma.hanjaDict.count({
    where: { genderHint: 'male' }
  });

  const beforeUnisex = await prisma.hanjaDict.count({
    where: { genderHint: 'unisex' }
  });

  console.log(`현재 female: ${beforeFemale}자`);
  console.log(`현재 male: ${beforeMale}자`);
  console.log(`현재 unisex: ${beforeUnisex}자\n`);

  // Step 2: Female 한자 로드 및 적용
  console.log('========================================');
  console.log('Step 2: Female 한자 마킹');
  console.log('========================================\n');

  const femalePath = join(process.cwd(), 'scripts/etl/data/female-hanja-seed.json');
  const femaleData: HanjaItem[] = JSON.parse(readFileSync(femalePath, 'utf-8'));

  console.log(`Female 한자: ${femaleData.length}자`);
  console.log(`예시: ${femaleData.slice(0, 10).map(h => h.char).join(', ')} ...\n`);

  let femaleUpdated = 0;
  for (const item of femaleData) {
    const result = await prisma.hanjaDict.updateMany({
      where: { character: item.char },
      data: {
        genderHint: 'female',
        isGoodForNaming: item.isGoodForNaming,
        ...(item.seedProtected && { seedProtected: true })
      }
    });
    femaleUpdated += result.count;
  }

  console.log(`✅ Female 마킹 완료: ${femaleUpdated}자 업데이트\n`);

  // Step 3: Male 한자 로드 및 적용
  console.log('========================================');
  console.log('Step 3: Male 한자 마킹');
  console.log('========================================\n');

  const malePath = join(process.cwd(), 'scripts/etl/data/male-hanja-seed.json');
  const maleData: HanjaItem[] = JSON.parse(readFileSync(malePath, 'utf-8'));

  console.log(`Male 한자: ${maleData.length}자`);
  console.log(`예시: ${maleData.slice(0, 10).map(h => h.char).join(', ')} ...\n`);

  let maleUpdated = 0;
  for (const item of maleData) {
    const result = await prisma.hanjaDict.updateMany({
      where: { character: item.char },
      data: {
        genderHint: 'male',
        isGoodForNaming: item.isGoodForNaming,
        ...(item.seedProtected && { seedProtected: true })
      }
    });
    maleUpdated += result.count;
  }

  console.log(`✅ Male 마킹 완료: ${maleUpdated}자 업데이트\n`);

  // Step 4: Unisex 한자 로드 및 적용 (마지막에 적용 = 우선순위 최고)
  console.log('========================================');
  console.log('Step 4: Unisex 한자 마킹');
  console.log('========================================\n');

  const unisexPath = join(process.cwd(), 'scripts/etl/data/unisex-hanja-seed.json');
  const unisexData: HanjaItem[] = JSON.parse(readFileSync(unisexPath, 'utf-8'));

  console.log(`Unisex 한자: ${unisexData.length}자`);
  console.log(`리스트: ${unisexData.map(h => h.char).join(', ')}\n`);

  let unisexUpdated = 0;
  for (const item of unisexData) {
    const result = await prisma.hanjaDict.updateMany({
      where: { character: item.char },
      data: {
        genderHint: 'unisex',
        isGoodForNaming: item.isGoodForNaming,
        ...(item.seedProtected && { seedProtected: true })
      }
    });
    unisexUpdated += result.count;
  }

  console.log(`✅ Unisex 마킹 완료: ${unisexUpdated}자 업데이트\n`);

  // Step 5: 최종 결과
  console.log('========================================');
  console.log('Step 5: 최종 결과');
  console.log('========================================\n');

  const afterFemale = await prisma.hanjaDict.count({
    where: { genderHint: 'female' }
  });

  const afterMale = await prisma.hanjaDict.count({
    where: { genderHint: 'male' }
  });

  const afterUnisex = await prisma.hanjaDict.count({
    where: { genderHint: 'unisex' }
  });

  console.log('📊 Gender Hint 마킹 결과:\n');
  console.log(`  Female: ${beforeFemale} → ${afterFemale}자 (+${afterFemale - beforeFemale})`);
  console.log(`  Male:   ${beforeMale} → ${afterMale}자 (+${afterMale - beforeMale})`);
  console.log(`  Unisex: ${beforeUnisex} → ${afterUnisex}자 (+${afterUnisex - beforeUnisex})\n`);

  // Step 6: 중복 확인 (남녀 모두 나온 한자)
  console.log('========================================');
  console.log('Step 6: 중복 처리 확인');
  console.log('========================================\n');

  const femaleChars = new Set(femaleData.map(h => h.char));
  const maleChars = new Set(maleData.map(h => h.char));
  const unisexChars = new Set(unisexData.map(h => h.char));

  const femaleAndMale = [...femaleChars].filter(c => maleChars.has(c));
  const femaleAndUnisex = [...femaleChars].filter(c => unisexChars.has(c));
  const maleAndUnisex = [...maleChars].filter(c => unisexChars.has(c));

  console.log(`💡 중복 분석:\n`);
  console.log(`  Female ∩ Male:   ${femaleAndMale.length}자 (${femaleAndMale.join(', ') || '없음'})`);
  console.log(`  Female ∩ Unisex: ${femaleAndUnisex.length}자 (${femaleAndUnisex.join(', ') || '없음'})`);
  console.log(`  Male ∩ Unisex:   ${maleAndUnisex.length}자 (${maleAndUnisex.join(', ') || '없음'})\n`);

  // Step 7: 오행 분포
  console.log('========================================');
  console.log('Step 7: 성별별 오행 분포');
  console.log('========================================\n');

  const femaleElements = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: {
      genderHint: 'female',
      element: { not: null }
    },
    _count: true
  });

  const maleElements = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: {
      genderHint: 'male',
      element: { not: null }
    },
    _count: true
  });

  console.log('🎨 Female 한자 오행 분포:\n');
  femaleElements.forEach(item => {
    console.log(`  ${item.element}: ${item._count}자`);
  });

  console.log('\n🎨 Male 한자 오행 분포:\n');
  maleElements.forEach(item => {
    console.log(`  ${item.element}: ${item._count}자`);
  });

  console.log('\n');
  console.log('========================================');
  console.log('✅ Gender Hint 마킹 완료!');
  console.log('========================================');
  console.log('\n💡 다음 단계: repository 메서드에 genderHint 필터 적용\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
