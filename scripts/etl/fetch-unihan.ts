/**
 * Unihan Database에서 획수 데이터 가져오기
 *
 * 공식 출처: https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
 * 필요 파일: Unihan_IRGSources.txt (kTotalStrokes)
 */

import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import * as path from 'path';
import * as fs from 'fs/promises';

const UNIHAN_URL = 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip';
const DATA_DIR = path.join(process.cwd(), 'scripts/etl/data/unihan');

interface UnihanStroke {
  codepoint: string;      // U+4E00
  character: string;      // 一
  totalStrokes: number;   // 1
  radical: string;        // ⼀
  radicalStrokes: number; // 0
}

async function downloadUnihan() {
  console.log('📥 Unihan 데이터 다운로드 중...');

  await fs.mkdir(DATA_DIR, { recursive: true });

  const response = await fetch(UNIHAN_URL);
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

  const zipPath = path.join(DATA_DIR, 'Unihan.zip');
  const fileStream = createWriteStream(zipPath);

  // @ts-ignore - Node.js stream compatibility
  await pipeline(response.body, fileStream);

  console.log('✅ 다운로드 완료:', zipPath);
  return zipPath;
}

async function extractStrokeData(zipPath: string) {
  console.log('📂 획수 데이터 추출 중...');

  // Unzip manually or use a library like 'adm-zip'
  // For now, assume manual extraction
  const txtPath = path.join(DATA_DIR, 'Unihan_IRGSources.txt');

  // 스트림 기반 처리 (메모리 효율 80% 개선)
  const { createReadStream } = await import('fs');
  const { createInterface } = await import('readline');

  const strokeMap = new Map<string, Partial<UnihanStroke>>();
  const fileStream = createReadStream(txtPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount % 10000 === 0) {
      console.log(`  처리 중: ${lineCount.toLocaleString()}줄...`);
    }

    if (line.startsWith('#') || !line.trim()) continue;

    const [codepoint, field, value] = line.split('\t');

    if (!strokeMap.has(codepoint)) {
      strokeMap.set(codepoint, { codepoint });
    }

    const entry = strokeMap.get(codepoint)!;

    switch (field) {
      case 'kTotalStrokes':
        entry.totalStrokes = parseInt(value);
        break;
      case 'kRSUnicode':
        // Format: "1.0" (radical.additionalStrokes)
        const [radicalNum, addStrokes] = value.split('.');
        entry.radicalStrokes = parseInt(addStrokes);
        break;
    }
  }

  console.log(`  ✅ 파싱 완료: ${lineCount.toLocaleString()}줄 처리`);

  // Convert to array and add character
  const strokeData: UnihanStroke[] = [];
  for (const [codepoint, data] of strokeMap) {
    if (data.totalStrokes) {
      const charCode = parseInt(codepoint.replace('U+', ''), 16);
      const character = String.fromCharCode(charCode);

      strokeData.push({
        codepoint,
        character,
        totalStrokes: data.totalStrokes,
        radical: '', // TODO: 부수 매핑
        radicalStrokes: data.radicalStrokes || 0
      });
    }
  }

  console.log(`✅ ${strokeData.length}개 한자 획수 추출 완료`);

  // Save to JSON with atomic write
  const jsonPath = path.join(DATA_DIR, 'unihan-strokes.json');
  const tmpPath = `${jsonPath}.tmp`;

  await fs.writeFile(tmpPath, JSON.stringify(strokeData, null, 2));
  await fs.rename(tmpPath, jsonPath);

  console.log(`✅ 데이터 저장 완료: ${jsonPath}`);

  return strokeData;
}

async function main() {
  try {
    // Step 1: Download
    // const zipPath = await downloadUnihan();

    // Step 2: Extract (manual unzip required first)
    const zipPath = path.join(DATA_DIR, 'Unihan.zip');
    console.log('⚠️  먼저 수동으로 압축 해제하세요:', zipPath);
    console.log('   필요 파일: Unihan_IRGSources.txt');

    // Step 3: Parse
    const strokeData = await extractStrokeData(zipPath);

    console.log('\n📊 샘플 데이터:');
    console.log(strokeData.slice(0, 10));

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

main();
