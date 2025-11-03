#!/usr/bin/env npx tsx
/**
 * SQLite의 inferred_name_frequency 데이터를 PostgreSQL로 복사
 *
 * SQLite (dev.db)에서 빈도 데이터를 읽어서
 * PostgreSQL (saju_naming)로 복사합니다.
 */

import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { join } from 'path';

const sqliteDb = new Database(join(process.cwd(), 'prisma/dev.db'));
const prisma = new PrismaClient();

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  빈도 데이터 복사: SQLite → PostgreSQL    ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Step 1: SQLite에서 빈도 데이터 읽기
  console.log('========================================');
  console.log('Step 1: SQLite에서 빈도 데이터 읽기');
  console.log('========================================\n');

  const frequencyData = sqliteDb.prepare(`
    SELECT character, inferred_name_frequency, is_good_for_naming
    FROM hanja_dict
    WHERE inferred_name_frequency > 0 AND is_surname = 0
  `).all() as Array<{
    character: string;
    inferred_name_frequency: number;
    is_good_for_naming: number | null;
  }>;

  console.log(`빈도 데이터가 있는 한자: ${frequencyData.length}개`);

  // 통계
  const stats = {
    total: frequencyData.length,
    good: frequencyData.filter(h => h.is_good_for_naming === 1).length,
    neutral: frequencyData.filter(h => h.is_good_for_naming === null).length,
  };

  console.log(`  ✅ Good (true): ${stats.good}개`);
  console.log(`  ❓ Null: ${stats.neutral}개`);
  console.log('');

  // Step 2: PostgreSQL로 복사
  console.log('========================================');
  console.log('Step 2: PostgreSQL 업데이트');
  console.log('========================================\n');

  let updated = 0;
  let markedGood = 0;
  let errors = 0;

  for (const data of frequencyData) {
    try {
      // 빈도 업데이트
      await prisma.hanjaDict.update({
        where: { character: data.character },
        data: {
          inferredNameFrequency: data.inferred_name_frequency,
        },
      });
      updated++;

      // is_good_for_naming 업데이트 (NULL만, FALSE는 보호)
      if (data.is_good_for_naming === 1) {
        const result = await prisma.hanjaDict.updateMany({
          where: {
            character: data.character,
            isGoodForNaming: null,  // NULL만 업데이트
          },
          data: {
            isGoodForNaming: true,
          },
        });

        if (result.count > 0) {
          markedGood++;
        }
      }

      if (updated % 100 === 0) {
        console.log(`  진행 중: ${updated}/${frequencyData.length}`);
      }
    } catch (error: any) {
      console.error(`❌ Error updating ${data.character}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ 업데이트 완료: ${updated}개 한자`);
  console.log(`✅ isGoodForNaming = true 마킹: ${markedGood}개`);
  if (errors > 0) {
    console.log(`⚠️  에러: ${errors}개`);
  }
  console.log('');

  // Step 3: PostgreSQL 최종 통계
  console.log('========================================');
  console.log('Step 3: PostgreSQL 최종 통계');
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
  console.log('✅ 빈도 데이터 복사 완료!');
  console.log('========================================\n');

  sqliteDb.close();
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    sqliteDb.close();
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
