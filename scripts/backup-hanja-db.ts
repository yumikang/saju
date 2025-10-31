#!/usr/bin/env npx tsx
/**
 * 한자 DB 백업 시스템 (3-Tier Backup)
 *
 * Tier 1: 전체 테이블 스냅샷
 * Tier 2: 작명 가능 한자만 선택적 백업
 * Tier 3: 변경 로그 (Audit Trail)
 *
 * 실행: npx tsx scripts/backup-hanja-db.ts
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// 백업 디렉토리 생성
const BACKUP_DIR = join(process.cwd(), 'backups');
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Tier 1: 전체 테이블 스냅샷
 */
async function createFullBackup() {
  console.log('\n📦 Tier 1: 전체 테이블 백업 시작...');
  const startTime = Date.now();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const allHanja = await prisma.hanjaDict.findMany({
    orderBy: { id: 'asc' }
  });

  const filename = `hanja-dict-full-${timestamp}.json`;
  const filepath = join(BACKUP_DIR, filename);

  writeFileSync(filepath, JSON.stringify(allHanja, null, 2), 'utf-8');

  const duration = Date.now() - startTime;
  const fileSize = (JSON.stringify(allHanja).length / 1024 / 1024).toFixed(2);

  console.log(`✅ 전체 백업 완료`);
  console.log(`   파일: ${filename}`);
  console.log(`   개수: ${allHanja.length}자`);
  console.log(`   크기: ${fileSize} MB`);
  console.log(`   소요: ${duration}ms\n`);

  return { timestamp, count: allHanja.length, filename };
}

/**
 * Tier 2: 작명 가능 한자만 선택적 백업
 */
async function createGoodHanjaBackup() {
  console.log('📦 Tier 2: 작명 가능 한자 백업 시작...');
  const startTime = Date.now();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const goodHanja = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true },
    orderBy: { id: 'asc' }
  });

  const filename = `hanja-good-only-${timestamp}.json`;
  const filepath = join(BACKUP_DIR, filename);

  writeFileSync(filepath, JSON.stringify(goodHanja, null, 2), 'utf-8');

  const duration = Date.now() - startTime;
  const fileSize = (JSON.stringify(goodHanja).length / 1024 / 1024).toFixed(2);

  console.log(`✅ 작명 가능 한자 백업 완료`);
  console.log(`   파일: ${filename}`);
  console.log(`   개수: ${goodHanja.length}자`);
  console.log(`   크기: ${fileSize} MB`);
  console.log(`   소요: ${duration}ms\n`);

  return { timestamp, count: goodHanja.length, filename };
}

/**
 * Tier 3: meaning 필드 현황 스냅샷 (변경 전 기준선)
 */
async function createMeaningSnapshot() {
  console.log('📦 Tier 3: meaning 필드 스냅샷 생성...');
  const startTime = Date.now();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const goodHanja = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true },
    select: {
      character: true,
      koreanReading: true,
      meaning: true,
      nameFrequency: true,
      element: true,
      seedProtected: true
    },
    orderBy: { nameFrequency: 'desc' }
  });

  const filename = `meaning-snapshot-${timestamp}.json`;
  const filepath = join(BACKUP_DIR, filename);

  const snapshot = {
    createdAt: new Date().toISOString(),
    totalCount: goodHanja.length,
    purpose: 'baseline for meaning field quality improvement',
    data: goodHanja
  };

  writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');

  const duration = Date.now() - startTime;

  console.log(`✅ meaning 스냅샷 완료`);
  console.log(`   파일: ${filename}`);
  console.log(`   개수: ${goodHanja.length}자`);
  console.log(`   소요: ${duration}ms\n`);

  return { timestamp, count: goodHanja.length, filename };
}

/**
 * 백업 메타데이터 생성
 */
async function createBackupMetadata(backups: any) {
  const metadata = {
    createdAt: new Date().toISOString(),
    dbStats: {
      total: await prisma.hanjaDict.count(),
      good: await prisma.hanjaDict.count({ where: { isGoodForNaming: true } }),
      bad: await prisma.hanjaDict.count({ where: { isGoodForNaming: false } })
    },
    backups,
    purpose: 'Pre-meaning-quality-improvement backup',
    rollbackCommand: 'npx tsx scripts/restore-hanja-db.ts [backup-filename]'
  };

  const filename = 'backup-metadata-latest.json';
  const filepath = join(BACKUP_DIR, filename);

  writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(`📝 백업 메타데이터 생성 완료: ${filename}\n`);
}

/**
 * 메인 실행
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  한자 DB 백업 시스템 (3-Tier Backup)      ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    const startTime = Date.now();

    // Tier 1: 전체 백업
    const fullBackup = await createFullBackup();

    // Tier 2: 작명 가능 한자 백업
    const goodBackup = await createGoodHanjaBackup();

    // Tier 3: meaning 필드 스냅샷
    const meaningSnapshot = await createMeaningSnapshot();

    // 메타데이터 생성
    await createBackupMetadata({
      fullBackup,
      goodBackup,
      meaningSnapshot
    });

    const totalDuration = Date.now() - startTime;

    console.log('═'.repeat(60));
    console.log('✅ 백업 완료!');
    console.log(`   총 소요 시간: ${totalDuration}ms (${(totalDuration/1000).toFixed(1)}초)`);
    console.log(`   백업 위치: ${BACKUP_DIR}`);
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 백업 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main();
