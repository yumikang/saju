#!/usr/bin/env tsx

/**
 * ============================================================
 * Calendar Data Import Script - Schema 2 (1841-2110)
 * ============================================================
 *
 * Imports extended calendar data from /Users/blee/Downloads/lunar_data/20060811.sql
 * This schema contains extended date range with basic calendar data:
 * - Combined weekday field
 * - Dog days markers (복날)
 * - Lunar date flag
 *
 * Date range: 1841-01-01 to 2110-12-31
 *
 * Usage:
 *   npx tsx scripts/calendar-migration/02-import-schema2.ts
 *
 * Prerequisites:
 *   - Schema 1 import completed first (for better data quality)
 * ============================================================
 */

import { PrismaClient, ZodiacAnimal } from '@prisma/client';
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
  cd_hdganjee: string | null;
  cd_kdganjee: string | null;
  cd_hterms: string | null;
  cd_kterms: string | null;
  cd_week: string | null;
  cd_sol_plan: string | null;
  cd_lun_plan: string | null;
  cd_dogday: string | null;
  cd_ddi: string;
  cd_kk: number;
  holiday: number;
}

/**
 * Parse INSERT statements from SQL file
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

    // Parse values
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
      cd_hdganjee: parseValue(parts[10]) as string | null,
      cd_kdganjee: parseValue(parts[11]) as string | null,
      cd_hterms: parseValue(parts[12]) as string | null,
      cd_kterms: parseValue(parts[13]) as string | null,
      cd_week: parseValue(parts[14]) as string | null,
      cd_sol_plan: parseValue(parts[15]) as string | null,
      cd_lun_plan: parseValue(parts[16]) as string | null,
      cd_dogday: parseValue(parts[17]) as string | null,
      cd_ddi: String(parseValue(parts[18])),
      cd_kk: Number(parseValue(parts[19])),
      holiday: Number(parseValue(parts[20])),
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
  let updated = 0;
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

            // Check if record already exists (from Schema 1)
            const existing = await prisma.calendarData.findUnique({
              where: {
                solar_date_unique: {
                  solarYear: row.cd_sy,
                  solarMonth: parseInt(row.cd_sm),
                  solarDay: parseInt(row.cd_sd),
                },
              },
            });

            if (existing) {
              // Update only Schema 2-specific fields if they're missing
              await prisma.calendarData.update({
                where: {
                  solar_date_unique: {
                    solarYear: row.cd_sy,
                    solarMonth: parseInt(row.cd_sm),
                    solarDay: parseInt(row.cd_sd),
                  },
                },
                data: {
                  weekday: existing.weekday || row.cd_week,
                  dogDay: existing.dogDay || row.cd_dogday,
                  isLunarDate: row.cd_kk === 1,
                  dataSource: existing.dataSource === 'schema1' ? 'merged' : 'schema2',
                },
              });
              updated++;
            } else {
              // Create new record for dates not in Schema 1
              await prisma.calendarData.create({
                data: {
                  dangiYear: row.cd_sgi,
                  solarYear: row.cd_sy,
                  solarMonth: parseInt(row.cd_sm),
                  solarDay: parseInt(row.cd_sd),
                  lunarYear: row.cd_ly,
                  lunarMonth: parseInt(row.cd_lm),
                  lunarDay: parseInt(row.cd_ld),
                  yearGanjiHanja: row.cd_hyganjee,
                  yearGanjiKorean: row.cd_kyganjee,
                  dayGanjiHanja: row.cd_hdganjee,
                  dayGanjiKorean: row.cd_kdganjee,
                  weekday: row.cd_week,
                  solarTermHanja: row.cd_hterms,
                  solarTermKorean: row.cd_kterms,
                  dogDay: row.cd_dogday,
                  zodiacAnimal,
                  solarHoliday: row.cd_sol_plan,
                  lunarHoliday: row.cd_lun_plan,
                  holidayType: row.holiday,
                  isLunarDate: row.cd_kk === 1,
                  dataSource: 'schema2',
                },
              });
              imported++;
            }
          } catch (error) {
            console.error(`Error importing row ${row.cd_sy}-${row.cd_sm}-${row.cd_sd}:`, error);
            errors++;
          }
        })
      );

      if ((i + batchSize) % 1000 === 0 || i + batchSize >= rows.length) {
        console.log(`  Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length} (${imported} new, ${updated} updated, ${errors} errors)`);
      }
    } catch (error) {
      console.error('Batch error:', error);
    }
  }

  console.log('\n✅ Import completed!');
  console.log(`  New records: ${imported}`);
  console.log(`  Updated records: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('============================================================');
  console.log('Calendar Data Import - Schema 2 (1841-2110)');
  console.log('============================================================\n');

  const sqlFilePath = '/Users/blee/Downloads/lunar_data/20060811.sql';

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

    console.log('\n🎉 Schema 2 import completed successfully!\n');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
