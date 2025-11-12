#!/usr/bin/env npx tsx
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  const dataPath = path.join(process.cwd(), 'scripts/etl/data/unihan/unihan-strokes.json');
  const content = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(content);

  const testChars = ['蕕', '瘉', '踰', '有', '儒'];

  console.log('\n=== Unihan 획수 데이터 확인 ===\n');

  for (const char of testChars) {
    const item = data.find((x: any) => x.character === char);
    if (item) {
      console.log(`${char}:`);
      console.log(`  totalStrokes: ${item.totalStrokes}`);
      console.log(`  radical: ${item.radical}`);
      console.log(`  radicalStrokes: ${item.radicalStrokes}`);
      console.log();
    } else {
      console.log(`${char}: ❌ 찾을 수 없음\n`);
    }
  }
}

main();
