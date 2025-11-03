#!/usr/bin/env npx tsx
/**
 * 2024년 출생신고 데이터로 한자 빈도 추론
 *
 * 로직:
 * 1. CSV에서 이름 + 빈도수 읽기
 * 2. 이름을 음절로 분리 (예: "서윤" → ["서", "윤"])
 * 3. 각 음절에 해당하는 모든 한자에 빈도수 누적
 * 4. inferred_name_frequency 업데이트
 * 5. 임계값 이상이면 is_good_for_naming = true
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Use SQLite database for this script
// Override DATABASE_URL to point to SQLite
process.env.DATABASE_URL = 'file:./prisma/dev.db';

const prisma = new PrismaClient();

// 설정
const config = {
  csvPath: join(process.cwd(), '출생 이름 통계 - 시트1.csv'),
  minFrequencyForGood: 100, // 이 값 이상이면 is_good_for_naming = true
};

// CSV 파싱
interface NameRecord {
  rank: number;
  name: string;
  count: number;
  gender: 'male' | 'female';
}

/**
 * CSV 파싱 (남자 100개 + 여자 100개)
 */
function parseCSV(csvContent: string): NameRecord[] {
  const lines = csvContent.split('\n');
  const records: NameRecord[] = [];

  let currentGender: 'male' | 'female' | null = null;

  for (const line of lines) {
    // 성별 섹션 감지
    if (line.startsWith('남자 이름 순위')) {
      currentGender = 'male';
      continue;
    }
    if (line.startsWith('여자 이름 순위')) {
      currentGender = 'female';
      continue;
    }

    // 헤더나 빈 줄 스킵
    if (!currentGender || line.startsWith('순위,') || line.trim() === '' || line === ',,') {
      continue;
    }

    // 데이터 파싱
    const parts = line.split(',');
    if (parts.length >= 3) {
      const rank = parseInt(parts[0]);
      const name = parts[1];
      const countStr = parts[2].replace(/[",]/g, ''); // 쉼표, 따옴표 제거
      const count = parseInt(countStr);

      if (!isNaN(rank) && name && !isNaN(count)) {
        records.push({ rank, name, count, gender: currentGender });
      }
    }
  }

  return records;
}

/**
 * 한글 이름을 음절로 분리
 */
function splitIntoSyllables(name: string): string[] {
  return name.split('');
}

/**
 * 메인 처리 함수
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  출생신고 데이터 기반 빈도 추론            ║');
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

  // 샘플 출력
  console.log('\n샘플 (상위 3개):');
  nameRecords.slice(0, 3).forEach(r => {
    console.log(`  ${r.name} (${r.gender}): ${r.count.toLocaleString()}명`);
  });
  console.log('');

  // Step 2: 음절 추출 및 빈도 집계
  console.log('========================================');
  console.log('Step 2: 음절별 빈도 집계');
  console.log('========================================\n');

  // 음절 → 총 빈도수 맵
  const syllableFrequency = new Map<string, number>();

  for (const record of nameRecords) {
    const syllables = splitIntoSyllables(record.name);
    for (const syllable of syllables) {
      const current = syllableFrequency.get(syllable) || 0;
      syllableFrequency.set(syllable, current + record.count);
    }
  }

  console.log(`고유 음절 수: ${syllableFrequency.size}개`);

  // 상위 10개 음절
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

  // 모든 음절에 해당하는 한자 가져오기 (N+1 회피)
  const hanjaMatches = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: syllables },
      isSurname: false, // 성씨 제외
    },
    select: {
      character: true,
      koreanReading: true,
    },
  });

  console.log(`매칭된 한자: ${hanjaMatches.length}개`);

  // 한자 → 누적 빈도
  const hanjaFrequency = new Map<string, number>();

  for (const hanja of hanjaMatches) {
    if (!hanja.koreanReading) continue;

    const freq = syllableFrequency.get(hanja.koreanReading) || 0;
    hanjaFrequency.set(hanja.character, freq);
  }

  console.log(`빈도가 부여된 한자: ${hanjaFrequency.size}개\n`);

  // 분포 분석
  const freqRanges = {
    veryHigh: 0,  // >= 5000
    high: 0,      // 1000-4999
    medium: 0,    // 500-999
    low: 0,       // 100-499
    veryLow: 0,   // < 100
  };

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

  let updated = 0;
  let markedGood = 0;

  for (const [char, freq] of hanjaFrequency.entries()) {
    // inferred_name_frequency 업데이트
    await prisma.hanjaDict.update({
      where: { character: char },
      data: {
        inferredNameFrequency: freq,
      },
    });
    updated++;

    // is_good_for_naming 마킹 (기존 true는 보호)
    if (freq >= config.minFrequencyForGood) {
      const result = await prisma.hanjaDict.updateMany({
        where: {
          character: char,
          OR: [
            { isGoodForNaming: null },
            { isGoodForNaming: false },
          ],
        },
        data: {
          isGoodForNaming: true,
        },
      });

      if (result.count > 0) {
        markedGood++;
      }
    }

    // 진행 상황 출력
    if (updated % 100 === 0) {
      console.log(`  진행 중: ${updated}/${hanjaFrequency.size}`);
    }
  }

  console.log(`\n✅ 업데이트 완료: ${updated}개 한자`);
  console.log(`✅ is_good_for_naming = true 마킹: ${markedGood}개\n`);

  // Step 5: 최종 통계
  console.log('========================================');
  console.log('Step 5: 최종 통계');
  console.log('========================================\n');

  const finalStats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true,
    where: {
      isSurname: false,
    },
  });

  console.log('작명 가능 한자 (비성씨) 분류:');

  let totalGood = 0;
  let totalBad = 0;
  let totalNull = 0;

  for (const stat of finalStats) {
    if (stat.isGoodForNaming === true) {
      totalGood = stat._count;
      console.log(`  ✅ Good (true): ${stat._count}개`);
    } else if (stat.isGoodForNaming === false) {
      totalBad = stat._count;
      console.log(`  🚫 Bad (false): ${stat._count}개`);
    } else {
      totalNull = stat._count;
      console.log(`  ❓ Null: ${stat._count}개`);
    }
  }

  const total = totalGood + totalBad + totalNull;
  const goodPercent = ((totalGood / total) * 100).toFixed(1);

  console.log(`\n📊 작명 적합 비율: ${totalGood}/${total} (${goodPercent}%)\n`);

  // 상위 빈도 한자 샘플
  const topHanja = await prisma.hanjaDict.findMany({
    where: {
      inferredNameFrequency: { gt: 0 },
      isSurname: false,
    },
    select: {
      character: true,
      meaning: true,
      koreanReading: true,
      inferredNameFrequency: true,
      isGoodForNaming: true,
    },
    orderBy: {
      inferredNameFrequency: 'desc',
    },
    take: 15,
  });

  console.log('상위 15개 한자 (빈도순):');
  topHanja.forEach((h, idx) => {
    const status = h.isGoodForNaming ? '✅' : h.isGoodForNaming === false ? '🚫' : '❓';
    const reading = h.koreanReading || '?';
    const meaning = h.meaning || '?';
    console.log(`  ${idx + 1}. ${h.character} (${reading}) ${status} - ${h.inferredNameFrequency?.toLocaleString()} | ${meaning}`);
  });

  console.log('\n========================================');
  console.log('✅ 빈도 추론 완료!');
  console.log('========================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
