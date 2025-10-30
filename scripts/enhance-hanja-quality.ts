#!/usr/bin/env npx tsx
/**
 * 한자 품질 개선 스크립트
 *
 * 목표: DB 8,787자 중에서 작명에 적합한 2,000자 선별
 *
 * 전략:
 * 1. 블랙리스트 적용 (부정적 의미 한자 제외)
 * 2. Good Seed 적용 (240자 - 검증된 좋은 한자)
 * 3. 의미 기반 스캔 (500-700자 - 긍정적 의미 자동 검출)
 * 4. 오행 기반 승인 (300-400자 - 오행 정보 있는 한자 우선)
 * 5. 빈도 기반 승인 (500-700자 - 실제로 많이 쓰이는 한자)
 *
 * 실행: npx tsx scripts/enhance-hanja-quality.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// 통계 추적
interface Stats {
  step: string;
  before: number;
  after: number;
  changed: number;
  duration: number;
}

const stats: Stats[] = [];

// 한글 오행 → Prisma Element enum 매핑
const elementMap: Record<string, string> = {
  '火': 'FIRE',
  '木': 'WOOD',
  '土': 'EARTH',
  '金': 'METAL',
  '水': 'WATER',
};

/**
 * Step 0: 스키마 확인 및 컬럼 추가
 */
async function step0_prepareSchema() {
  console.log('\n========================================');
  console.log('Step 0: 스키마 준비');
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    // is_good_for_naming 컬럼 존재 확인 (PostgreSQL)
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'hanja_dict'
        AND column_name = 'is_good_for_naming'
    `;

    const hasColumn = result.length > 0;

    if (!hasColumn) {
      console.log('⚠️  is_good_for_naming 컬럼이 없습니다. 추가합니다...');

      await prisma.$executeRaw`
        ALTER TABLE hanja_dict
        ADD COLUMN is_good_for_naming BOOLEAN DEFAULT NULL
      `;

      console.log('✅ is_good_for_naming 컬럼 추가 완료');
    } else {
      console.log('✅ is_good_for_naming 컬럼이 이미 존재합니다.');
    }

    // 인덱스 생성
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS hanja_dict_is_good_for_naming_idx
        ON hanja_dict(is_good_for_naming)
      `;
      console.log('✅ is_good_for_naming 인덱스 생성 완료');
    } catch (error) {
      console.log('ℹ️  인덱스가 이미 존재합니다.');
    }

    const duration = Date.now() - startTime;
    console.log(`\n⏱️  소요 시간: ${duration}ms\n`);

  } catch (error) {
    console.error('❌ 스키마 준비 실패:', error);
    throw error;
  }
}

/**
 * Step 1: 블랙리스트 적용
 */
async function step1_applyBlacklist() {
  console.log('\n========================================');
  console.log('Step 1: 블랙리스트 적용');
  console.log('========================================\n');

  const startTime = Date.now();

  const blacklist = [
    '死', '病', '惡', '凶', '殃', '災', '害', '屍', '殺', '癌',
    '毒', '怨', '恨', '悲', '傷', '痛', '貧', '賤', '醜', '劣',
    '邪', '魔', '鬼', '妖', '盜', '奸', '淫', '狂', '瘋', '癩'
  ];

  console.log(`🚫 블랙리스트 한자: ${blacklist.length}자`);
  console.log(`   ${blacklist.join(', ')}\n`);

  const before = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false }
  });

  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: blacklist }
    },
    data: {
      isGoodForNaming: false
    }
  });

  const after = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false }
  });

  const duration = Date.now() - startTime;

  stats.push({
    step: 'Blacklist',
    before,
    after,
    changed: result.count,
    duration
  });

  console.log(`✅ 블랙리스트 적용 완료: ${result.count}자 업데이트`);
  console.log(`📊 isGoodForNaming=false 총 개수: ${before} → ${after}`);
  console.log(`⏱️  소요 시간: ${duration}ms\n`);
}

/**
 * Step 2: Good Seed 적용
 */
async function step2_applyGoodSeed() {
  console.log('\n========================================');
  console.log('Step 2: Good Seed 적용 (240자)');
  console.log('========================================\n');

  const startTime = Date.now();

  // JSON 파일 읽기
  const seedPath = join(process.cwd(), 'scripts/etl/data/good-hanja-seed.json');
  const seedData = JSON.parse(readFileSync(seedPath, 'utf-8'));

  console.log(`📦 Seed 데이터: ${seedData.length}자\n`);

  const before = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  let updated = 0;
  let skipped = 0;

  for (const item of seedData) {
    try {
      // 한자가 DB에 존재하는지 확인
      const existing = await prisma.hanjaDict.findFirst({
        where: { character: item.char }
      });

      if (!existing) {
        skipped++;
        console.log(`⏭️  스킵: ${item.char} (DB에 없음)`);
        continue;
      }

      // 업데이트
      await prisma.hanjaDict.updateMany({
        where: { character: item.char },
        data: {
          element: elementMap[item.element] || item.element,
          meaning: item.korean,
          isGoodForNaming: item.isGoodForNaming
        }
      });

      updated++;

      if (updated % 50 === 0) {
        console.log(`   진행 중: ${updated}/${seedData.length}`);
      }

    } catch (error) {
      console.error(`❌ 실패: ${item.char}`, error);
    }
  }

  const after = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const duration = Date.now() - startTime;

  stats.push({
    step: 'Good Seed',
    before,
    after,
    changed: updated,
    duration
  });

  console.log(`\n✅ Good Seed 적용 완료`);
  console.log(`   업데이트: ${updated}자`);
  console.log(`   스킵: ${skipped}자 (DB에 없음)`);
  console.log(`📊 isGoodForNaming=true 총 개수: ${before} → ${after}`);
  console.log(`⏱️  소요 시간: ${duration}ms\n`);
}

/**
 * Step 3: 의미 기반 자동 스캔
 */
async function step3_scanByMeaning() {
  console.log('\n========================================');
  console.log('Step 3: 의미 기반 자동 스캔 (500-700자 목표)');
  console.log('========================================\n');

  const startTime = Date.now();

  const goodMeanings = [
    '밝', '빛', '영', '덕', '성', '순', '정', '화', '기쁠',
    '클 ', '큰 ', '아름다', '온화', '평안', '안정', '길',
    '복', '귀', '높', '빼어', '뛰어', '맑', '깨끗', '곱',
    '착', '어질', '지혜', '슬기', '충', '효', '예', '의',
    '신', '흥', '번영', '풍', '부', '강', '건', '용',
    '씩씩', '굳', '지킬', '튼튼', '견고', '향기', '꽃',
    '나무', '푸른', '맑을', '깨끗할', '넓', '드넓', '장엄',
    '존엄', '고상', '우아', '단아', '빼어날', '수려'
  ];

  console.log(`🔍 긍정적 의미 키워드: ${goodMeanings.length}개`);
  console.log(`   ${goodMeanings.slice(0, 10).join(', ')} ...\n`);

  const before = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  // meaning 필드가 있고, 긍정적 키워드 포함, 성씨 아님, 아직 지정 안 됨
  const conditions = goodMeanings.map(keyword => ({
    meaning: { contains: keyword }
  }));

  const candidates = await prisma.hanjaDict.findMany({
    where: {
      OR: conditions,
      isSurname: false,
      isGoodForNaming: null
    },
    take: 800
  });

  console.log(`📝 후보: ${candidates.length}자\n`);

  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: candidates.map(h => h.character) }
    },
    data: {
      isGoodForNaming: true
    }
  });

  const after = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const duration = Date.now() - startTime;

  stats.push({
    step: 'Meaning Scan',
    before,
    after,
    changed: result.count,
    duration
  });

  console.log(`✅ 의미 기반 스캔 완료: ${result.count}자 승인`);
  console.log(`📊 isGoodForNaming=true 총 개수: ${before} → ${after}`);
  console.log(`⏱️  소요 시간: ${duration}ms\n`);
}

/**
 * Step 4: 오행 기반 자동 승인
 */
async function step4_approveByElement() {
  console.log('\n========================================');
  console.log('Step 4: 오행 기반 자동 승인 (300-400자 목표)');
  console.log('========================================\n');

  const startTime = Date.now();

  const before = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  // 오행이 있고, 성씨 아니고, 블랙리스트도 아니고, 아직 지정 안 됨
  const result = await prisma.hanjaDict.updateMany({
    where: {
      element: { not: null },
      isSurname: false,
      isGoodForNaming: null  // 아직 정해지지 않은 것만
    },
    data: {
      isGoodForNaming: true
    }
  });

  const after = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const duration = Date.now() - startTime;

  stats.push({
    step: 'Element Based',
    before,
    after,
    changed: result.count,
    duration
  });

  console.log(`✅ 오행 기반 승인 완료: ${result.count}자 승인`);
  console.log(`📊 isGoodForNaming=true 총 개수: ${before} → ${after}`);
  console.log(`⏱️  소요 시간: ${duration}ms\n`);
}

/**
 * Step 5: 빈도 기반 자동 승인
 */
async function step5_approveByFrequency() {
  console.log('\n========================================');
  console.log('Step 5: 빈도 기반 자동 승인 (500-700자 목표)');
  console.log('========================================\n');

  const startTime = Date.now();

  const before = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  // name_frequency가 높고, 성씨 아니고, 블랙리스트도 아니고, 아직 지정 안 됨
  const candidates = await prisma.hanjaDict.findMany({
    where: {
      nameFrequency: { gte: 50 },
      isSurname: false,
      isGoodForNaming: null
    },
    orderBy: { nameFrequency: 'desc' },
    take: 800
  });

  console.log(`📝 후보: ${candidates.length}자 (빈도 50 이상)\n`);

  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: candidates.map(h => h.character) }
    },
    data: {
      isGoodForNaming: true
    }
  });

  const after = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const duration = Date.now() - startTime;

  stats.push({
    step: 'Frequency Based',
    before,
    after,
    changed: result.count,
    duration
  });

  console.log(`✅ 빈도 기반 승인 완료: ${result.count}자 승인`);
  console.log(`📊 isGoodForNaming=true 총 개수: ${before} → ${after}`);
  console.log(`⏱️  소요 시간: ${duration}ms\n`);
}

/**
 * Step 6: 최종 검증 및 리포트
 */
async function step6_generateReport() {
  console.log('\n========================================');
  console.log('Step 6: 최종 검증 및 리포트');
  console.log('========================================\n');

  // 전체 통계
  const total = await prisma.hanjaDict.count();
  const goodCount = await prisma.hanjaDict.count({ where: { isGoodForNaming: true } });
  const badCount = await prisma.hanjaDict.count({ where: { isGoodForNaming: false } });
  const unknownCount = await prisma.hanjaDict.count({ where: { isGoodForNaming: null } });

  // 오행 분포
  const elementDist = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: { isGoodForNaming: true },
    _count: true
  });

  // 성씨 제외된 good 한자
  const goodNonSurname = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      isSurname: false
    }
  });

  console.log('📊 최종 통계\n');
  console.log(`총 한자: ${total}자`);
  console.log(`  ✅ Good (isGoodForNaming=true): ${goodCount}자 (${(goodCount/total*100).toFixed(1)}%)`);
  console.log(`  🚫 Bad  (isGoodForNaming=false): ${badCount}자 (${(badCount/total*100).toFixed(1)}%)`);
  console.log(`  ❓ Unknown (isGoodForNaming=null): ${unknownCount}자 (${(unknownCount/total*100).toFixed(1)}%)`);
  console.log(`\n작명 가능 한자 (Good + 비성씨): ${goodNonSurname}자\n`);

  console.log('🎨 오행 분포 (Good 한자 중):');
  elementDist.forEach(item => {
    if (item.element) {
      console.log(`  ${item.element}: ${item._count}자`);
    }
  });

  console.log('\n⏱️  단계별 소요 시간:\n');
  stats.forEach(stat => {
    console.log(`  ${stat.step.padEnd(20)}: ${stat.changed.toString().padStart(4)}자 변경 (${stat.duration}ms)`);
  });

  const totalDuration = stats.reduce((sum, s) => sum + s.duration, 0);
  console.log(`\n  총 소요 시간: ${totalDuration}ms (${(totalDuration/1000).toFixed(1)}초)\n`);

  // 목표 달성 여부
  console.log('🎯 목표 달성 현황:\n');
  if (goodNonSurname >= 2000) {
    console.log(`  ✅ 2,000자 목표 달성! (${goodNonSurname}자)`);
  } else {
    console.log(`  ⚠️  2,000자 목표 미달성 (${goodNonSurname}자 / 2,000자)`);
    console.log(`  ℹ️  추가 ${2000 - goodNonSurname}자 필요`);
  }

  console.log('\n========================================');
  console.log('✅ 한자 품질 개선 완료!');
  console.log('========================================\n');
}

/**
 * 메인 실행
 */
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  한자 품질 개선 스크립트 v1.0              ║');
  console.log('║  목표: 작명 적합 한자 2,000자 선별        ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await step0_prepareSchema();
    await step1_applyBlacklist();
    await step2_applyGoodSeed();
    await step3_scanByMeaning();
    await step4_approveByElement();
    await step5_approveByFrequency();
    await step6_generateReport();

    console.log('\n✅ 모든 작업이 성공적으로 완료되었습니다!\n');
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main();
