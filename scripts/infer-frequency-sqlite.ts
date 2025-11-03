#!/usr/bin/env npx tsx
/**
 * 2024년 출생신고 데이터로 한자 빈도 추론 (SQLite 직접 사용)
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'prisma/dev.db');
const db = new Database(dbPath);

// 설정
const config = {
  csvPath: join(process.cwd(), '출생 이름 통계 - 시트1.csv'),
  minFrequencyForGood: 100, // 이 값 이상이면 is_good_for_naming = true
};

interface NameRecord {
  rank: number;
  name: string;
  count: number;
  gender: 'male' | 'female';
}

// CSV 파싱
function parseCSV(csvContent: string): NameRecord[] {
  const lines = csvContent.split('\n');
  const records: NameRecord[] = [];
  let currentGender: 'male' | 'female' | null = null;

  for (const line of lines) {
    if (line.startsWith('남자 이름 순위')) {
      currentGender = 'male';
      continue;
    }
    if (line.startsWith('여자 이름 순위')) {
      currentGender = 'female';
      continue;
    }
    if (!currentGender || line.startsWith('순위,') || line.trim() === '' || line === ',,') {
      continue;
    }

    const parts = line.split(',');
    if (parts.length >= 3) {
      const rank = parseInt(parts[0]);
      const name = parts[1];
      const countStr = parts[2].replace(/[",]/g, '');
      const count = parseInt(countStr);

      if (!isNaN(rank) && name && !isNaN(count)) {
        records.push({ rank, name, count, gender: currentGender });
      }
    }
  }

  return records;
}

// 한글 이름을 음절로 분리
function splitIntoSyllables(name: string): string[] {
  return name.split('');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  출생신고 데이터 기반 빈도 추론 (SQLite)  ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Step 1: CSV 읽기
  console.log('========================================');
  console.log('Step 1: CSV 파싱');
  console.log('========================================\n');

  const csvContent = readFileSync(config.csvPath, 'utf-8');
  const nameRecords = parseCSV(csvContent);

  console.log(`총 이름 레코드: ${nameRecords.length}개`);
  console.log(`  남자: ${nameRecords.filter(r => r.gender === 'male').length}개`);
  console.log(`  여자: ${nameRecords.filter(r => r.gender === 'female').length}개`);

  console.log('\n샘플 (상위 3개):');
  nameRecords.slice(0, 3).forEach(r => {
    console.log(`  ${r.name} (${r.gender}): ${r.count.toLocaleString()}명`);
  });
  console.log('');

  // Step 2: 음절별 빈도 집계
  console.log('========================================');
  console.log('Step 2: 음절별 빈도 집계');
  console.log('========================================\n');

  const syllableFrequency = new Map<string, number>();

  for (const record of nameRecords) {
    const syllables = splitIntoSyllables(record.name);
    for (const syllable of syllables) {
      const current = syllableFrequency.get(syllable) || 0;
      syllableFrequency.set(syllable, current + record.count);
    }
  }

  console.log(`고유 음절 수: ${syllableFrequency.size}개`);

  const topSyllables = Array.from(syllableFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n가장 많이 쓰인 음절 TOP 10:');
  topSyllables.forEach(([syllable, count], idx) => {
    console.log(`  ${idx + 1}. ${syllable}: ${count.toLocaleString()}`);
  });
  console.log('');

  // Step 3: DB에서 해당 음절의 한자 가져오기
  console.log('========================================');
  console.log('Step 3: 한자 매핑 및 빈도 누적');
  console.log('========================================\n');

  const syllables = Array.from(syllableFrequency.keys());
  const placeholders = syllables.map(() => '?').join(',');

  const hanjaMatches = db.prepare(`
    SELECT character, korean_reading
    FROM hanja_dict
    WHERE korean_reading IN (${placeholders})
      AND is_surname = 0
  `).all(...syllables) as Array<{ character: string; korean_reading: string }>;

  console.log(`매칭된 한자: ${hanjaMatches.length}개`);

  const hanjaFrequency = new Map<string, number>();

  for (const hanja of hanjaMatches) {
    const freq = syllableFrequency.get(hanja.korean_reading) || 0;
    hanjaFrequency.set(hanja.character, freq);
  }

  console.log(`빈도가 부여된 한자: ${hanjaFrequency.size}개\n`);

  // 분포 분석
  const freqRanges = { veryHigh: 0, high: 0, medium: 0, low: 0, veryLow: 0 };

  for (const freq of hanjaFrequency.values()) {
    if (freq >= 5000) freqRanges.veryHigh++;
    else if (freq >= 1000) freqRanges.high++;
    else if (freq >= 500) freqRanges.medium++;
    else if (freq >= 100) freqRanges.low++;
    else freqRanges.veryLow++;
  }

  console.log('빈도 분포:');
  console.log(`  >= 5,000: ${freqRanges.veryHigh}개`);
  console.log(`  1,000-4,999: ${freqRanges.high}개`);
  console.log(`  500-999: ${freqRanges.medium}개`);
  console.log(`  100-499: ${freqRanges.low}개`);
  console.log(`  < 100: ${freqRanges.veryLow}개\n`);

  // Step 4: DB 업데이트
  console.log('========================================');
  console.log('Step 4: DB 업데이트');
  console.log('========================================\n');

  db.exec('BEGIN TRANSACTION');

  try {
    let updated = 0;
    let markedGood = 0;

    const updateFreq = db.prepare(`
      UPDATE hanja_dict
      SET inferred_name_frequency = ?
      WHERE character = ?
    `);

    const updateGood = db.prepare(`
      UPDATE hanja_dict
      SET is_good_for_naming = 1
      WHERE character = ?
        AND is_good_for_naming IS NULL  -- FALSE는 보호 (부정적 한자)
    `);

    for (const [char, freq] of hanjaFrequency.entries()) {
      updateFreq.run(freq, char);
      updated++;

      if (freq >= config.minFrequencyForGood) {
        const result = updateGood.run(char);
        if (result.changes > 0) {
          markedGood++;
        }
      }

      if (updated % 100 === 0) {
        console.log(`  진행 중: ${updated}/${hanjaFrequency.size}`);
      }
    }

    db.exec('COMMIT');

    console.log(`\n✅ 업데이트 완료: ${updated}개 한자`);
    console.log(`✅ is_good_for_naming = true 마킹: ${markedGood}개\n`);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  // Step 5: 최종 통계
  console.log('========================================');
  console.log('Step 5: 최종 통계');
  console.log('========================================\n');

  const stats = db.prepare(`
    SELECT
      CASE
        WHEN is_good_for_naming = 1 THEN 'good'
        WHEN is_good_for_naming = 0 THEN 'bad'
        ELSE 'null'
      END as status,
      COUNT(*) as count
    FROM hanja_dict
    WHERE is_surname = 0
    GROUP BY is_good_for_naming
  `).all() as Array<{ status: string; count: number }>;

  console.log('작명 가능 한자 (비성씨) 분류:');

  let totalGood = 0;
  let totalBad = 0;
  let totalNull = 0;

  for (const stat of stats) {
    if (stat.status === 'good') {
      totalGood = stat.count;
      console.log(`  ✅ Good (true): ${stat.count}개`);
    } else if (stat.status === 'bad') {
      totalBad = stat.count;
      console.log(`  🚫 Bad (false): ${stat.count}개`);
    } else {
      totalNull = stat.count;
      console.log(`  ❓ Null: ${stat.count}개`);
    }
  }

  const total = totalGood + totalBad + totalNull;
  const goodPercent = ((totalGood / total) * 100).toFixed(1);

  console.log(`\n📊 작명 적합 비율: ${totalGood}/${total} (${goodPercent}%)\n`);

  // 상위 빈도 한자 샘플
  const topHanja = db.prepare(`
    SELECT character, meaning, korean_reading, inferred_name_frequency, is_good_for_naming
    FROM hanja_dict
    WHERE inferred_name_frequency > 0 AND is_surname = 0
    ORDER BY inferred_name_frequency DESC
    LIMIT 15
  `).all() as Array<{
    character: string;
    meaning: string | null;
    korean_reading: string | null;
    inferred_name_frequency: number;
    is_good_for_naming: number | null;
  }>;

  console.log('상위 15개 한자 (빈도순):');
  topHanja.forEach((h, idx) => {
    const status = h.is_good_for_naming === 1 ? '✅' : h.is_good_for_naming === 0 ? '🚫' : '❓';
    const reading = h.korean_reading || '?';
    const meaning = h.meaning || '?';
    console.log(`  ${idx + 1}. ${h.character} (${reading}) ${status} - ${h.inferred_name_frequency.toLocaleString()} | ${meaning}`);
  });

  console.log('\n========================================');
  console.log('✅ 빈도 추론 완료!');
  console.log('========================================\n');

  db.close();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  db.close();
  process.exit(1);
});
