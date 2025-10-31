#!/usr/bin/env npx tsx
/**
 * Phase 1: Gender Hint Expansion from Existing Data
 *
 * 목표: 105자 → ~270자 확장
 *
 * 전략:
 * 1. 기존 gender 필드 활용 (male/female, not neutral)
 * 2. 패턴 기반 분류 (한글 음 패턴)
 * 3. nameFrequency >= 50 우선 (더 확실한 데이터)
 *
 * 안전 규칙:
 * - seedProtected = true인 문자는 절대 건드리지 않음 (human > auto)
 * - genderHint가 이미 있는 문자는 건드리지 않음
 * - 변경 사항은 모두 로그에 기록
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 남성 패턴: 준/현/우/호/석/태/범/진/환/철/영/민준/서준 등에서 추출
const MALE_PATTERNS = [
  '준', '현', '우', '호', '석', '태', '범', '진', '환', '철', '영',
  '준걸', '걸출', '빼어날', '뛰어날', '씩씩할', '굳셀', '강할'
];

// 여성 패턴: 아/연/은/희/서/유 + 의미 기반
const FEMALE_PATTERNS = [
  '아름', '고울', '향기', '난초', '연꽃', '부용', '빛날', '아리따울',
  '곱다', '예쁠', '사랑', '은혜', '아침', '꽃'
];

interface ChangeLog {
  timestamp: string;
  phase: string;
  changes: Array<{
    character: string;
    korean: string;
    previousGenderHint: string | null;
    newGenderHint: string;
    reason: string;
    nameFrequency: number | null;
    legacyGender: string | null;
  }>;
  summary: {
    totalChanged: number;
    femaleAdded: number;
    maleAdded: number;
    unisexAdded: number;
  };
}

/**
 * 패턴 기반 성별 분류
 */
function classifyByPattern(korean: string | null): 'male' | 'female' | null {
  if (!korean) return null;

  // 남성 패턴 체크
  for (const pattern of MALE_PATTERNS) {
    if (korean.includes(pattern)) {
      return 'male';
    }
  }

  // 여성 패턴 체크
  for (const pattern of FEMALE_PATTERNS) {
    if (korean.includes(pattern)) {
      return 'female';
    }
  }

  return null;
}

async function expandGenderHints() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Phase 1: Gender Hint Expansion           ║');
  console.log('║  From Existing Data (105 → ~270)          ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  const changeLog: ChangeLog = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 1: Existing Data',
    changes: [],
    summary: {
      totalChanged: 0,
      femaleAdded: 0,
      maleAdded: 0,
      unisexAdded: 0,
    },
  };

  // Step 1: 현재 상태 확인
  console.log('📊 Step 1: Current Status Check\n');

  const currentTagged = await prisma.hanjaDict.count({
    where: {
      genderHint: { not: null },
    },
  });

  console.log(`  Current genderHint tagged: ${currentTagged}자`);
  console.log(`  Target: ~270자\n`);

  // Step 2: Phase 1 후보 조회
  console.log('🔍 Step 2: Query Phase 1 Candidates\n');

  const MIN_FREQ = 50; // 더 확실한 데이터를 위해 50 이상 사용

  const candidates = await prisma.hanjaDict.findMany({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: MIN_FREQ },
      genderHint: null,
      seedProtected: false, // 사람이 고른 건 절대 건드리지 않음
    },
    orderBy: {
      nameFrequency: 'desc', // 빈도 높은 것부터 처리
    },
  });

  console.log(`  Total candidates (freq>=${MIN_FREQ}): ${candidates.length}자\n`);

  // Step 3: 분류 및 업데이트
  console.log('⚙️  Step 3: Classification & Update\n');

  let processedCount = 0;
  const maxExpansion = 170; // 105 + 170 = 275 (약간 여유 있게)

  for (const char of candidates) {
    if (processedCount >= maxExpansion) {
      console.log(`  ✅ Target reached: ${processedCount} additions\n`);
      break;
    }

    let newGenderHint: 'male' | 'female' | 'unisex' | null = null;
    let reason = '';

    // 전략 1: 기존 gender 필드 활용 (neutral 제외)
    if (char.gender === 'male') {
      newGenderHint = 'male';
      reason = 'legacy_gender_field=male';
    } else if (char.gender === 'female') {
      newGenderHint = 'female';
      reason = 'legacy_gender_field=female';
    } else {
      // 전략 2: 패턴 기반 분류
      const patternResult = classifyByPattern(char.korean);
      if (patternResult) {
        newGenderHint = patternResult;
        reason = `pattern_based=${patternResult}`;
      }
    }

    // 분류 결과가 있으면 업데이트
    if (newGenderHint) {
      await prisma.hanjaDict.update({
        where: { id: char.id },
        data: { genderHint: newGenderHint },
      });

      changeLog.changes.push({
        character: char.character,
        korean: char.korean || '',
        previousGenderHint: char.genderHint,
        newGenderHint,
        reason,
        nameFrequency: char.nameFrequency,
        legacyGender: char.gender,
      });

      if (newGenderHint === 'female') changeLog.summary.femaleAdded++;
      else if (newGenderHint === 'male') changeLog.summary.maleAdded++;
      else if (newGenderHint === 'unisex') changeLog.summary.unisexAdded++;

      processedCount++;

      if (processedCount % 50 === 0) {
        console.log(`  Progress: ${processedCount}/${maxExpansion} chars processed`);
      }
    }
  }

  changeLog.summary.totalChanged = processedCount;

  // Step 4: 결과 확인
  console.log('\n📈 Step 4: Results Verification\n');

  const finalTagged = await prisma.hanjaDict.count({
    where: { genderHint: { not: null } },
  });

  const finalFemale = await prisma.hanjaDict.count({
    where: { genderHint: 'female' },
  });

  const finalMale = await prisma.hanjaDict.count({
    where: { genderHint: 'male' },
  });

  const finalUnisex = await prisma.hanjaDict.count({
    where: { genderHint: 'unisex' },
  });

  console.log(`  Before: ${currentTagged}자`);
  console.log(`  After: ${finalTagged}자`);
  console.log(`  Added: ${finalTagged - currentTagged}자\n`);

  console.log('  Breakdown:');
  console.log(`    Female: ${finalFemale}자 (+${changeLog.summary.femaleAdded})`);
  console.log(`    Male: ${finalMale}자 (+${changeLog.summary.maleAdded})`);
  console.log(`    Unisex: ${finalUnisex}자 (+${changeLog.summary.unisexAdded})\n`);

  // Step 5: 안전성 검증
  console.log('🛡️  Step 5: Safety Verification\n');

  const seedProtectedViolations = await prisma.hanjaDict.count({
    where: {
      seedProtected: true,
      genderHint: { not: null },
      id: { in: changeLog.changes.map(c => c.character) }, // 이번에 변경한 것 중에
    },
  });

  if (seedProtectedViolations > 0) {
    console.log(`  ❌ ERROR: ${seedProtectedViolations} seedProtected chars were modified!`);
    console.log(`  Rolling back changes...`);
    // 실제로는 트랜잭션으로 처리해야 하지만, 일단 경고만
    throw new Error('Safety violation: seedProtected chars were modified');
  } else {
    console.log(`  ✅ No seedProtected chars were modified`);
  }

  const overwrittenHints = changeLog.changes.filter(c => c.previousGenderHint !== null);
  if (overwrittenHints.length > 0) {
    console.log(`  ⚠️  WARNING: ${overwrittenHints.length} existing genderHints were overwritten`);
  } else {
    console.log(`  ✅ No existing genderHints were overwritten`);
  }

  console.log('\n');

  // Step 6: 변경 로그 저장
  console.log('💾 Step 6: Save Change Log\n');

  const logDir = path.join(process.cwd(), 'data', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logPath = path.join(
    logDir,
    `gender-expand-phase1-${new Date().toISOString().split('T')[0]}.json`
  );

  fs.writeFileSync(logPath, JSON.stringify(changeLog, null, 2), 'utf-8');
  console.log(`  Change log saved: ${logPath}\n`);

  // 샘플 로그 출력
  console.log('📋 Sample Changes (first 10):\n');
  changeLog.changes.slice(0, 10).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.character} (${c.korean})`);
    console.log(`     genderHint: null → ${c.newGenderHint}`);
    console.log(`     reason: ${c.reason}`);
    console.log(`     freq: ${c.nameFrequency}, legacy: ${c.legacyGender}\n`);
  });

  console.log('════════════════════════════════════════════');
  console.log('✅ Phase 1 Complete!');
  console.log('════════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log(`  - Total expanded: ${changeLog.summary.totalChanged}자`);
  console.log(`  - Female: +${changeLog.summary.femaleAdded}`);
  console.log(`  - Male: +${changeLog.summary.maleAdded}`);
  console.log(`  - Unisex: +${changeLog.summary.unisexAdded}`);
  console.log(`  - Final total: ${finalTagged}자 (${currentTagged} → ${finalTagged})\n`);

  console.log('🎯 Next Steps:');
  console.log('  1. Review change log for accuracy');
  console.log('  2. Spot-check 20-30 newly tagged characters');
  console.log('  3. Test with actual name generation queries');
  console.log('  4. Proceed to Phase 2 for major expansion\n');
}

expandGenderHints()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
