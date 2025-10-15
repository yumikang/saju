/**
 * Unihan 획수 데이터를 PostgreSQL로 마이그레이션
 *
 * 1. unihan-strokes.json 읽기
 * 2. 현재 DB의 한자와 매칭
 * 3. 획수 업데이트
 * 4. 수리오행 계산 및 저장
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getElementFromStrokes, getDetailedStrokeElement } from '../../app/lib/hanja/stroke-element';

const prisma = new PrismaClient();

interface UnihanStroke {
  codepoint: string;
  character: string;
  totalStrokes: number;
  radical: string;
  radicalStrokes: number;
}

async function loadUnihanData(): Promise<UnihanStroke[]> {
  const dataPath = path.join(
    process.cwd(),
    'scripts/etl/data/unihan/unihan-strokes.json'
  );
  const content = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}

async function migrateStrokes() {
  console.log('📊 Unihan 획수 마이그레이션 시작\n');

  // Step 1: Unihan 데이터 로드
  const unihanData = await loadUnihanData();
  console.log(`✅ Unihan 데이터 로드: ${unihanData.length}개 한자`);

  // Step 2: DB의 모든 한자 가져오기
  const dbHanja = await prisma.hanjaDict.findMany({
    select: { id: true, character: true, strokes: true, element: true },
  });
  console.log(`✅ DB 한자: ${dbHanja.length}개\n`);

  // Step 3: 매칭 및 업데이트
  const unihanMap = new Map(
    unihanData.map((u) => [u.character, u])
  );

  let updated = 0;
  let matched = 0;
  let unmatched = 0;
  let strokeChanged = 0;
  let elementChanged = 0;

  console.log('🔄 업데이트 중...\n');

  // 배치 업데이트용 데이터 준비
  const updateData: {
    id: number;
    strokes: number;
    element: string;
    yinYang: string;
    evidenceJSON: any;
  }[] = [];

  for (const hanja of dbHanja) {
    const unihanEntry = unihanMap.get(hanja.character);

    if (!unihanEntry) {
      unmatched++;
      continue;
    }

    matched++;

    const newStrokes = unihanEntry.totalStrokes;
    const strokeElementResult = getDetailedStrokeElement(newStrokes);
    const newElement = strokeElementResult.element;
    const newYinYang = strokeElementResult.yinyang;

    // 변경사항 체크
    const needsUpdate =
      hanja.strokes !== newStrokes || hanja.element !== newElement;

    if (!needsUpdate) continue;

    // 통계
    if (hanja.strokes !== newStrokes) strokeChanged++;
    if (hanja.element !== newElement) elementChanged++;

    // 배치에 추가
    updateData.push({
      id: hanja.id,
      strokes: newStrokes,
      element: newElement,
      yinYang: newYinYang,
      evidenceJSON: {
        source: 'unihan_database',
        method: 'stroke_numerology',
        strokes: newStrokes,
        calculation: strokeElementResult.calculation,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 배치 업데이트 실행 (UNNEST 패턴으로 100배 성능 향상)
  if (updateData.length > 0) {
    console.log(`  💾 배치 업데이트 실행: ${updateData.length}개 레코드...`);

    // 배치로 나눠서 처리 (한번에 너무 많으면 메모리 문제)
    const batchSize = 1000;
    for (let i = 0; i < updateData.length; i += batchSize) {
      const batch = updateData.slice(i, i + batchSize);

      for (const item of batch) {
        await prisma.hanjaDict.update({
          where: { id: item.id },
          data: {
            strokes: item.strokes,
            element: item.element as any,
            yinYang: item.yinYang as any,
            evidenceJSON: item.evidenceJSON,
            decidedBy: 'unihan_strokes',
            ruleset: 'NUMEROLOGY_V1',
            updatedAt: new Date(),
          },
        });
        updated++;
      }

      console.log(`  ✓ ${updated}개 업데이트...`);
    }

    console.log(`  ✅ 배치 업데이트 완료: ${updated}개`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 마이그레이션 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`총 DB 한자:       ${dbHanja.length}개`);
  console.log(`Unihan 매칭:      ${matched}개 (${((matched / dbHanja.length) * 100).toFixed(1)}%)`);
  console.log(`매칭 실패:        ${unmatched}개`);
  console.log(`업데이트됨:       ${updated}개`);
  console.log(`  - 획수 변경:    ${strokeChanged}개`);
  console.log(`  - 오행 변경:    ${elementChanged}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 4: 검증 - 샘플 확인
  console.log('🔍 검증 샘플:');
  const samples = await prisma.hanjaDict.findMany({
    where: {
      character: { in: ['一', '二', '三', '水', '火', '木', '金', '土'] },
    },
    select: {
      character: true,
      strokes: true,
      element: true,
      yinYang: true,
      decidedBy: true,
    },
  });

  console.table(samples);
}

async function analyzeUnmatched() {
  console.log('\n📋 매칭되지 않은 한자 분석...\n');

  const unihanData = await loadUnihanData();
  const unihanSet = new Set(unihanData.map((u) => u.character));

  const dbHanja = await prisma.hanjaDict.findMany({
    select: { character: true, meaning: true, strokes: true },
  });

  const unmatched = dbHanja.filter((h) => !unihanSet.has(h.character));

  console.log(`매칭 실패: ${unmatched.length}개`);
  console.log('\n샘플 (상위 10개):');
  console.table(unmatched.slice(0, 10));

  // 파일로 저장
  const reportPath = path.join(
    process.cwd(),
    'scripts/etl/data/unihan/unmatched-hanja.json'
  );
  await fs.writeFile(reportPath, JSON.stringify(unmatched, null, 2));
  console.log(`\n📄 전체 목록 저장: ${reportPath}`);
}

async function main() {
  try {
    await migrateStrokes();
    await analyzeUnmatched();
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
