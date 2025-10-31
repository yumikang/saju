#!/usr/bin/env npx tsx
/**
 * Phase 2: Gender Hint Expansion from 2024 Name Statistics
 *
 * 목표: 275자 → 450-500자 확장
 *
 * 전략:
 * 1. 2024 TOP 100 남아/여아 이름에서 한글 음절 추출
 * 2. 각 음절에 대응하는 한자 찾기 (koreanReading 매칭)
 * 3. 각 한자의 남성/여성 사용 빈도 계산
 * 4. 70% threshold로 성별 분류
 *    - femaleRatio >= 0.7 → female
 *    - femaleRatio <= 0.3 → male
 *    - else → unisex
 *
 * 안전 규칙:
 * - seedProtected = true 절대 건드리지 않음
 * - genderHint가 이미 있는 문자는 건드리지 않음 (Phase 1 유지)
 * - 변경 사항 모두 로그에 기록
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface NameData {
  source: string;
  year: number;
  scrapedAt: string;
  maleNames: string[];
  femaleNames: string[];
}

interface HanjaStats {
  character: string;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  femaleRatio: number;
  genderClassification: 'male' | 'female' | 'unisex';
  maleNames: string[];
  femaleNames: string[];
}

interface ChangeLog {
  timestamp: string;
  phase: string;
  threshold: number;
  changes: Array<{
    character: string;
    koreanReading: string;
    previousGenderHint: string | null;
    newGenderHint: string;
    maleCount: number;
    femaleCount: number;
    femaleRatio: number;
    sampleNames: string[];
  }>;
  summary: {
    totalChanged: number;
    femaleAdded: number;
    maleAdded: number;
    unisexAdded: number;
  };
}

const FEMALE_RATIO_THRESHOLD = 0.7; // >= 70% female → female
const MALE_RATIO_THRESHOLD = 0.3; // <= 30% female → male
const MIN_USAGE_COUNT = 3; // 최소 3회 이상 사용된 한자만 분류

async function expandGenderHints() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Phase 2: Gender Hint Expansion           ║');
  console.log('║  From 2024 Name Statistics (275 → 450)    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  const changeLog: ChangeLog = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 2: 2024 Name Statistics',
    threshold: FEMALE_RATIO_THRESHOLD,
    changes: [],
    summary: {
      totalChanged: 0,
      femaleAdded: 0,
      maleAdded: 0,
      unisexAdded: 0,
    },
  };

  // Step 1: Load 2024 name data
  console.log('📂 Step 1: Load 2024 Name Data\n');

  const dataPath = path.join(process.cwd(), 'data', 'names', '2024-top100-names.json');
  const nameData: NameData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`  Source: ${nameData.source}`);
  console.log(`  Year: ${nameData.year}`);
  console.log(`  Male names: ${nameData.maleNames.length}`);
  console.log(`  Female names: ${nameData.femaleNames.length}\n`);

  // Step 2: Extract syllables from names
  console.log('🔤 Step 2: Extract Syllables from Names\n');

  const maleSyllables = new Set<string>();
  const femaleSyllables = new Set<string>();

  nameData.maleNames.forEach((name) => {
    Array.from(name).forEach((syllable) => maleSyllables.add(syllable));
  });

  nameData.femaleNames.forEach((name) => {
    Array.from(name).forEach((syllable) => femaleSyllables.add(syllable));
  });

  console.log(`  Male syllables: ${maleSyllables.size}`);
  console.log(`  Female syllables: ${femaleSyllables.size}`);
  console.log(`  Overlap: ${Array.from(maleSyllables).filter((s) => femaleSyllables.has(s)).length}\n`);

  // Step 3: Map syllables to hanjas
  console.log('🔍 Step 3: Map Syllables to Hanjas\n');

  const hanjaStatsMap = new Map<string, HanjaStats>();

  // Process male names
  console.log('  Processing male names...');
  for (const name of nameData.maleNames) {
    const syllables = Array.from(name);

    for (const syllable of syllables) {
      // Find hanjas with this Korean reading
      const hanjas = await prisma.hanjaDict.findMany({
        where: {
          koreanReading: syllable,
          isGoodForNaming: true, // Only usable chars
        },
        select: { character: true, koreanReading: true },
      });

      hanjas.forEach((h) => {
        const stats = hanjaStatsMap.get(h.character) || {
          character: h.character,
          maleCount: 0,
          femaleCount: 0,
          totalCount: 0,
          femaleRatio: 0,
          genderClassification: 'unisex' as const,
          maleNames: [],
          femaleNames: [],
        };

        stats.maleCount++;
        stats.totalCount++;
        if (!stats.maleNames.includes(name)) stats.maleNames.push(name);

        hanjaStatsMap.set(h.character, stats);
      });
    }
  }

  // Process female names
  console.log('  Processing female names...');
  for (const name of nameData.femaleNames) {
    const syllables = Array.from(name);

    for (const syllable of syllables) {
      // Find hanjas with this Korean reading
      const hanjas = await prisma.hanjaDict.findMany({
        where: {
          koreanReading: syllable,
          isGoodForNaming: true,
        },
        select: { character: true, koreanReading: true },
      });

      hanjas.forEach((h) => {
        const stats = hanjaStatsMap.get(h.character) || {
          character: h.character,
          maleCount: 0,
          femaleCount: 0,
          totalCount: 0,
          femaleRatio: 0,
          genderClassification: 'unisex' as const,
          maleNames: [],
          femaleNames: [],
        };

        stats.femaleCount++;
        stats.totalCount++;
        if (!stats.femaleNames.includes(name)) stats.femaleNames.push(name);

        hanjaStatsMap.set(h.character, stats);
      });
    }
  }

  console.log(`  Total hanjas analyzed: ${hanjaStatsMap.size}\n`);

  // Step 4: Calculate gender ratios and classify
  console.log('📊 Step 4: Calculate Gender Ratios\n');

  for (const [char, stats] of hanjaStatsMap) {
    if (stats.totalCount < MIN_USAGE_COUNT) continue;

    stats.femaleRatio = stats.femaleCount / stats.totalCount;

    if (stats.femaleRatio >= FEMALE_RATIO_THRESHOLD) {
      stats.genderClassification = 'female';
    } else if (stats.femaleRatio <= MALE_RATIO_THRESHOLD) {
      stats.genderClassification = 'male';
    } else {
      stats.genderClassification = 'unisex';
    }
  }

  const classifications = {
    female: Array.from(hanjaStatsMap.values()).filter(
      (s) => s.genderClassification === 'female' && s.totalCount >= MIN_USAGE_COUNT
    ),
    male: Array.from(hanjaStatsMap.values()).filter(
      (s) => s.genderClassification === 'male' && s.totalCount >= MIN_USAGE_COUNT
    ),
    unisex: Array.from(hanjaStatsMap.values()).filter(
      (s) => s.genderClassification === 'unisex' && s.totalCount >= MIN_USAGE_COUNT
    ),
  };

  console.log(`  Female hanjas: ${classifications.female.length}`);
  console.log(`  Male hanjas: ${classifications.male.length}`);
  console.log(`  Unisex hanjas: ${classifications.unisex.length}\n`);

  // Show top 10 examples
  console.log('  Top 10 Female Hanjas (by usage):\n');
  classifications.female
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 10)
    .forEach((s, i) => {
      console.log(
        `    ${i + 1}. ${s.character} - F:${s.femaleCount} M:${s.maleCount} (${(s.femaleRatio * 100).toFixed(0)}%) - ${s.femaleNames.slice(0, 3).join(', ')}`
      );
    });
  console.log();

  console.log('  Top 10 Male Hanjas (by usage):\n');
  classifications.male
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 10)
    .forEach((s, i) => {
      console.log(
        `    ${i + 1}. ${s.character} - F:${s.femaleCount} M:${s.maleCount} (${(s.femaleRatio * 100).toFixed(0)}%) - ${s.maleNames.slice(0, 3).join(', ')}`
      );
    });
  console.log();

  // Step 5: Update database
  console.log('⚙️  Step 5: Update Database\n');

  let updateCount = 0;

  for (const category of ['female', 'male', 'unisex'] as const) {
    const hanjas = classifications[category];

    for (const stats of hanjas) {
      // Check if this hanja can be updated
      const existing = await prisma.hanjaDict.findFirst({
        where: { character: stats.character },
        select: {
          id: true,
          character: true,
          koreanReading: true,
          genderHint: true,
          seedProtected: true,
        },
      });

      if (!existing) continue;

      // Safety checks
      if (existing.seedProtected) {
        // console.log(`  ⏭️  Skip ${stats.character}: seedProtected`);
        continue;
      }

      if (existing.genderHint !== null) {
        // console.log(`  ⏭️  Skip ${stats.character}: genderHint already set (Phase 1)`);
        continue;
      }

      // Update
      await prisma.hanjaDict.update({
        where: { id: existing.id },
        data: { genderHint: category },
      });

      changeLog.changes.push({
        character: stats.character,
        koreanReading: existing.koreanReading || '',
        previousGenderHint: existing.genderHint,
        newGenderHint: category,
        maleCount: stats.maleCount,
        femaleCount: stats.femaleCount,
        femaleRatio: stats.femaleRatio,
        sampleNames: [...stats.femaleNames.slice(0, 3), ...stats.maleNames.slice(0, 3)],
      });

      if (category === 'female') changeLog.summary.femaleAdded++;
      else if (category === 'male') changeLog.summary.maleAdded++;
      else if (category === 'unisex') changeLog.summary.unisexAdded++;

      updateCount++;

      if (updateCount % 50 === 0) {
        console.log(`  Progress: ${updateCount} hanjas updated`);
      }
    }
  }

  changeLog.summary.totalChanged = updateCount;

  console.log(`\n  ✅ Updated ${updateCount} hanjas\n`);

  // Step 6: Final verification
  console.log('📈 Step 6: Final Verification\n');

  const finalStats = {
    female: await prisma.hanjaDict.count({ where: { genderHint: 'female' } }),
    male: await prisma.hanjaDict.count({ where: { genderHint: 'male' } }),
    unisex: await prisma.hanjaDict.count({ where: { genderHint: 'unisex' } }),
  };

  const finalTotal = finalStats.female + finalStats.male + finalStats.unisex;

  console.log(`  Before Phase 2: 275자`);
  console.log(`  After Phase 2: ${finalTotal}자`);
  console.log(`  Added: +${finalTotal - 275}자\n`);

  console.log('  Breakdown:');
  console.log(`    Female: ${finalStats.female}자 (+${changeLog.summary.femaleAdded})`);
  console.log(`    Male: ${finalStats.male}자 (+${changeLog.summary.maleAdded})`);
  console.log(`    Unisex: ${finalStats.unisex}자 (+${changeLog.summary.unisexAdded})\n`);

  // Step 7: Save change log
  console.log('💾 Step 7: Save Change Log\n');

  const logDir = path.join(process.cwd(), 'data', 'logs');
  const logPath = path.join(
    logDir,
    `gender-expand-phase2-${new Date().toISOString().split('T')[0]}.json`
  );

  fs.writeFileSync(logPath, JSON.stringify(changeLog, null, 2), 'utf-8');
  console.log(`  Change log saved: ${logPath}\n`);

  // Sample changes
  console.log('📋 Sample Changes (first 10):\n');
  changeLog.changes.slice(0, 10).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.character} (${c.koreanReading})`);
    console.log(`     genderHint: null → ${c.newGenderHint}`);
    console.log(`     Ratio: F:${c.femaleCount} M:${c.maleCount} (${(c.femaleRatio * 100).toFixed(0)}%)`);
    console.log(`     Names: ${c.sampleNames.slice(0, 5).join(', ')}\n`);
  });

  console.log('════════════════════════════════════════════');
  console.log('✅ Phase 2 Complete!');
  console.log('════════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log(`  - Total expanded: ${changeLog.summary.totalChanged}자`);
  console.log(`  - Female: +${changeLog.summary.femaleAdded}`);
  console.log(`  - Male: +${changeLog.summary.maleAdded}`);
  console.log(`  - Unisex: +${changeLog.summary.unisexAdded}`);
  console.log(`  - Final total: ${finalTotal}자 (275 → ${finalTotal})\n`);

  console.log('🎯 Achievement:');
  if (finalTotal >= 450) {
    console.log(`  ✅ Target achieved! (450-500자 목표, 달성: ${finalTotal}자)\n`);
  } else {
    console.log(`  ⚠️  Below target (목표: 450-500자, 달성: ${finalTotal}자)\n`);
  }
}

expandGenderHints()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
