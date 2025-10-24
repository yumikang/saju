#!/usr/bin/env tsx

/**
 * ============================================================
 * Calendar Data Import Script - Schema 1 (1900-2100)
 * ============================================================
 *
 * Imports detailed calendar data from /Users/blee/Downloads/saju/saju/20060818.sql
 * This schema contains comprehensive data including:
 * - Moon phases and times
 * - 28 Lunar mansions (28수)
 * - Month stem-branch data
 * - Leap month information
 * - Solar terms with precise times
 *
 * Date range: 1900-01-01 to 2100-12-31
 *
 * Usage:
 *   npx tsx scripts/calendar-migration/01-import-schema1.ts
 *
 * Prerequisites:
 *   - MySQL server running with the SQL file imported
 *   - Environment variable MYSQL_URL_SCHEMA1 set (or use default localhost)
 * ============================================================
 */

import { PrismaClient, ZodiacAnimal } from '@prisma/client';
import mysql from 'mysql2/promise';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const prisma = new PrismaClient();

// Zodiac mapping from Korean to Prisma enum
const zodiacMap: Record<string, ZodiacAnimal> = {
  '쥐': 'RAT',
  '소': 'OX',
  '호랑이': 'TIGER',
  '토끼': 'RABBIT',
  '용': 'DRAGON',
  '뱀': 'SNAKE',
  '말': 'HORSE',
  '양': 'SHEEP',
  '원숭이': 'MONKEY',
  '닭': 'ROOSTER',
  '개': 'DOG',
  '돼지': 'PIG',
};

interface MySQLRow {
  cd_no: number;
  cd_sgi: number;
  cd_sy: number;
  cd_sm: string;
  cd_sd: string;
  cd_ly: number;
  cd_lm: string;
  cd_ld: string;
  cd_hyganjee: string | null;
  cd_kyganjee: string | null;
  cd_hmganjee: string | null;
  cd_kmganjee: string | null;
  cd_hdganjee: string | null;
  cd_kdganjee: string | null;
  cd_hweek: string | null;
  cd_kweek: string | null;
  cd_stars: string | null;
  cd_moon_state: string | null;
  cd_moon_time: string | null;
  cd_leap_month: number;
  cd_month_size: number;
  cd_hterms: string | null;
  cd_kterms: string | null;
  cd_terms_time: string | null;
  cd_keventday: string | null;
  cd_ddi: string;
  cd_sol_plan: string | null;
  cd_lun_plan: string | null;
  holiday: number;
}

/**
 * Parse INSERT statements from SQL file and extract data
 */
async function parseSQLFile(filePath: string): Promise<MySQLRow[]> {
  const rows: MySQLRow[] = [];
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log('📖 Reading SQL file...');

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;

    // Skip non-INSERT lines
    if (!line.startsWith('INSERT INTO calenda_data VALUES')) {
      continue;
    }

    // Extract values from INSERT statement
    const valuesMatch = line.match(/VALUES \((.+)\);?$/);
    if (!valuesMatch) continue;

    const values = valuesMatch[1];

    // Parse values (handle NULL and quoted strings)
    const parsed = parseInsertValues(values);
    if (parsed) {
      rows.push(parsed);
    }

    if (rows.length % 10000 === 0) {
      console.log(`  Parsed ${rows.length} records...`);
    }
  }

  console.log(`✅ Parsed ${rows.length} records from SQL file`);
  return rows;
}

/**
 * Parse INSERT VALUES clause
 */
function parseInsertValues(values: string): MySQLRow | null {
  try {
    // Split by comma, respecting quotes
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < values.length; i++) {
      const char = values[i];

      if ((char === "'" || char === '"') && (i === 0 || values[i - 1] !== '\\')) {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
          quoteChar = '';
        }
        current += char;
      } else if (char === ',' && !inQuote) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current) parts.push(current.trim());

    // Helper to parse value
    const parseValue = (val: string): string | number | null => {
      if (val === 'NULL' || val === "'NULL'") return null;
      if (val.startsWith("'") && val.endsWith("'")) {
        return val.slice(1, -1);
      }
      const num = Number(val);
      return isNaN(num) ? val : num;
    };

    const row: MySQLRow = {
      cd_no: Number(parseValue(parts[0])),
      cd_sgi: Number(parseValue(parts[1])),
      cd_sy: Number(parseValue(parts[2])),
      cd_sm: String(parseValue(parts[3])),
      cd_sd: String(parseValue(parts[4])),
      cd_ly: Number(parseValue(parts[5])),
      cd_lm: String(parseValue(parts[6])),
      cd_ld: String(parseValue(parts[7])),
      cd_hyganjee: parseValue(parts[8]) as string | null,
      cd_kyganjee: parseValue(parts[9]) as string | null,
      cd_hmganjee: parseValue(parts[10]) as string | null,
      cd_kmganjee: parseValue(parts[11]) as string | null,
      cd_hdganjee: parseValue(parts[12]) as string | null,
      cd_kdganjee: parseValue(parts[13]) as string | null,
      cd_hweek: parseValue(parts[14]) as string | null,
      cd_kweek: parseValue(parts[15]) as string | null,
      cd_stars: parseValue(parts[16]) as string | null,
      cd_moon_state: parseValue(parts[17]) as string | null,
      cd_moon_time: parseValue(parts[18]) as string | null,
      cd_leap_month: Number(parseValue(parts[19])),
      cd_month_size: Number(parseValue(parts[20])),
      cd_hterms: parseValue(parts[21]) as string | null,
      cd_kterms: parseValue(parts[22]) as string | null,
      cd_terms_time: parseValue(parts[23]) as string | null,
      cd_keventday: parseValue(parts[24]) as string | null,
      cd_ddi: String(parseValue(parts[25])),
      cd_sol_plan: parseValue(parts[26]) as string | null,
      cd_lun_plan: parseValue(parts[27]) as string | null,
      holiday: Number(parseValue(parts[28])),
    };

    return row;
  } catch (error) {
    console.error('Failed to parse row:', values);
    return null;
  }
}

/**
 * Import data from parsed rows into PostgreSQL
 */
async function importData(rows: MySQLRow[]) {
  console.log('\n🔄 Starting import to PostgreSQL...\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    try {
      await Promise.all(
        batch.map(async (row) => {
          try {
            // Map zodiac animal
            const zodiacAnimal = zodiacMap[row.cd_ddi];
            if (!zodiacAnimal) {
              console.warn(`Unknown zodiac: ${row.cd_ddi}`);
              errors++;
              return;
            }

            await prisma.calendarData.upsert({
              where: {
                solar_date_unique: {
                  solarYear: row.cd_sy,
                  solarMonth: parseInt(row.cd_sm),
                  solarDay: parseInt(row.cd_sd),
                },
              },
              update: {
                // Schema 1 has more detailed data, so update all fields
                monthGanjiHanja: row.cd_hmganjee,
                monthGanjiKorean: row.cd_kmganjee,
                weekdayHanja: row.cd_hweek,
                weekdayKorean: row.cd_kweek,
                lunarMansion: row.cd_stars,
                moonState: row.cd_moon_state,
                moonTime: row.cd_moon_time,
                isLeapMonth: row.cd_leap_month === 1,
                monthSize: row.cd_month_size,
                solarTermTime: row.cd_terms_time,
                specialDayKorean: row.cd_keventday,
                dataSource: 'schema1',
              },
              create: {
                dangiYear: row.cd_sgi,
                solarYear: row.cd_sy,
                solarMonth: parseInt(row.cd_sm),
                solarDay: parseInt(row.cd_sd),
                lunarYear: row.cd_ly,
                lunarMonth: parseInt(row.cd_lm),
                lunarDay: parseInt(row.cd_ld),
                yearGanjiHanja: row.cd_hyganjee,
                yearGanjiKorean: row.cd_kyganjee,
                monthGanjiHanja: row.cd_hmganjee,
                monthGanjiKorean: row.cd_kmganjee,
                dayGanjiHanja: row.cd_hdganjee,
                dayGanjiKorean: row.cd_kdganjee,
                weekdayHanja: row.cd_hweek,
                weekdayKorean: row.cd_kweek,
                lunarMansion: row.cd_stars,
                moonState: row.cd_moon_state,
                moonTime: row.cd_moon_time,
                isLeapMonth: row.cd_leap_month === 1,
                monthSize: row.cd_month_size,
                solarTermHanja: row.cd_hterms,
                solarTermKorean: row.cd_kterms,
                solarTermTime: row.cd_terms_time,
                specialDayKorean: row.cd_keventday,
                zodiacAnimal,
                solarHoliday: row.cd_sol_plan,
                lunarHoliday: row.cd_lun_plan,
                holidayType: row.holiday,
                dataSource: 'schema1',
              },
            });

            imported++;
          } catch (error) {
            console.error(`Error importing row ${row.cd_sy}-${row.cd_sm}-${row.cd_sd}:`, error);
            errors++;
          }
        })
      );

      if ((i + batchSize) % 1000 === 0 || i + batchSize >= rows.length) {
        console.log(`  Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length} (${imported} imported, ${errors} errors)`);
      }
    } catch (error) {
      console.error('Batch error:', error);
    }
  }

  console.log('\n✅ Import completed!');
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('============================================================');
  console.log('Calendar Data Import - Schema 1 (1900-2100)');
  console.log('============================================================\n');

  const sqlFilePath = '/Users/blee/Downloads/saju/saju/20060818.sql';

  try {
    // Parse SQL file
    const rows = await parseSQLFile(sqlFilePath);

    if (rows.length === 0) {
      console.error('❌ No data parsed from SQL file');
      process.exit(1);
    }

    console.log(`\n📊 Statistics:`);
    console.log(`  Total records: ${rows.length}`);
    console.log(`  Date range: ${rows[0].cd_sy}-${rows[0].cd_sm}-${rows[0].cd_sd} to ${rows[rows.length-1].cd_sy}-${rows[rows.length-1].cd_sm}-${rows[rows.length-1].cd_sd}`);
    console.log('');

    // Import to PostgreSQL
    await importData(rows);

    console.log('\n🎉 Schema 1 import completed successfully!\n');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
