#!/usr/bin/env npx tsx
/**
 * Apply Gender Blacklists to Database
 *
 * 목적:
 * - FEMALE_BLACKLIST의 한자들을 강제로 'male'로 설정
 * - MALE_BLACKLIST의 한자들을 강제로 'female'로 설정
 * - 통계 기반 분류를 override하는 하드코딩된 규칙
 *
 * 안전 규칙:
 * - seedProtected = true는 건드리지 않음
 * - 변경 로그 기록
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BlacklistConfig {
  femaleBlacklist: {
    description: string;
    reason: string;
    characters: string[];
  };
  maleBlacklist: {
    description: string;
    reason: string;
    characters: string[];
  };
}

async function applyBlacklists() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Apply Gender Blacklists                   ║');
  console.log('║  Hard Override for Clear Cases             ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  // Load blacklist config
  const configPath = path.join(process.cwd(), 'config', 'gender-blacklists.json');
  const config: BlacklistConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  console.log('📋 Blacklist Summary:\n');
  console.log(`  Female blacklist (male-only): ${config.femaleBlacklist.characters.length} chars`);
  console.log(`  Male blacklist (female-only): ${config.maleBlacklist.characters.length} chars\n`);

  const changeLog = {
    timestamp: new Date().toISOString(),
    operation: 'apply-gender-blacklists',
    changes: [] as any[],
  };

  // Apply female blacklist (set to 'male')
  console.log('⚙️  Step 1: Apply Female Blacklist (→ male)\n');

  for (const char of config.femaleBlacklist.characters) {
    const existing = await prisma.hanjaDict.findFirst({
      where: { character: char },
      select: {
        id: true,
        character: true,
        koreanReading: true,
        genderHint: true,
        seedProtected: true,
      },
    });

    if (!existing) {
      console.log(`  ⏭️  Skip ${char}: not found in DB`);
      continue;
    }

    if (existing.seedProtected) {
      console.log(`  ⏭️  Skip ${char}: seedProtected`);
      continue;
    }

    if (existing.genderHint === 'male') {
      console.log(`  ✓ ${char}: already male`);
      continue;
    }

    // Update to male
    await prisma.hanjaDict.update({
      where: { id: existing.id },
      data: { genderHint: 'male' },
    });

    console.log(`  ✅ ${char} (${existing.koreanReading}): ${existing.genderHint || 'null'} → male`);

    changeLog.changes.push({
      character: char,
      koreanReading: existing.koreanReading,
      previousGenderHint: existing.genderHint,
      newGenderHint: 'male',
      reason: 'femaleBlacklist',
    });
  }

  console.log('\n');

  // Apply male blacklist (set to 'female')
  console.log('⚙️  Step 2: Apply Male Blacklist (→ female)\n');

  for (const char of config.maleBlacklist.characters) {
    const existing = await prisma.hanjaDict.findFirst({
      where: { character: char },
      select: {
        id: true,
        character: true,
        koreanReading: true,
        genderHint: true,
        seedProtected: true,
      },
    });

    if (!existing) {
      console.log(`  ⏭️  Skip ${char}: not found in DB`);
      continue;
    }

    if (existing.seedProtected) {
      console.log(`  ⏭️  Skip ${char}: seedProtected`);
      continue;
    }

    if (existing.genderHint === 'female') {
      console.log(`  ✓ ${char}: already female`);
      continue;
    }

    // Update to female
    await prisma.hanjaDict.update({
      where: { id: existing.id },
      data: { genderHint: 'female' },
    });

    console.log(`  ✅ ${char} (${existing.koreanReading}): ${existing.genderHint || 'null'} → female`);

    changeLog.changes.push({
      character: char,
      koreanReading: existing.koreanReading,
      previousGenderHint: existing.genderHint,
      newGenderHint: 'female',
      reason: 'maleBlacklist',
    });
  }

  console.log('\n');

  // Save log
  console.log('💾 Step 3: Save Change Log\n');

  const logDir = path.join(process.cwd(), 'data', 'logs');
  const logPath = path.join(
    logDir,
    `gender-blacklists-${new Date().toISOString().split('T')[0]}.json`
  );

  fs.writeFileSync(logPath, JSON.stringify(changeLog, null, 2), 'utf-8');
  console.log(`  Log saved: ${logPath}\n`);

  // Final stats
  console.log('📊 Final Statistics:\n');

  const finalStats = {
    female: await prisma.hanjaDict.count({ where: { genderHint: 'female' } }),
    male: await prisma.hanjaDict.count({ where: { genderHint: 'male' } }),
    unisex: await prisma.hanjaDict.count({ where: { genderHint: 'unisex' } }),
  };

  console.log(`  Female: ${finalStats.female}`);
  console.log(`  Male: ${finalStats.male}`);
  console.log(`  Unisex: ${finalStats.unisex}`);
  console.log(`  Total: ${finalStats.female + finalStats.male + finalStats.unisex}\n`);

  console.log(`  Changes applied: ${changeLog.changes.length}\n`);

  console.log('✅ Blacklist Application Complete!\n');
}

applyBlacklists()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
