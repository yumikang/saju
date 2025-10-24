#!/usr/bin/env tsx

/**
 * ============================================================
 * Calendar Data Validation Script
 * ============================================================
 *
 * Validates imported calendar data for:
 * - Date range coverage
 * - Data completeness
 * - Duplicate detection
 * - Data integrity checks
 *
 * Usage:
 *   npx tsx scripts/calendar-migration/03-validate-data.ts
 * ============================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Validation Results Interface
 */
interface ValidationResults {
  totalRecords: number;
  dateRange: { min: string; max: string };
  duplicates: number;
  missingZodiac: number;
  dataSourceStats: Record<string, number>;
  yearCoverage: { year: number; count: number }[];
  holidayCount: number;
  solarTermCount: number;
  leapMonthCount: number;
  issues: string[];
}

async function validateData(): Promise<ValidationResults> {
  console.log('🔍 Starting data validation...\n');

  const results: ValidationResults = {
    totalRecords: 0,
    dateRange: { min: '', max: '' },
    duplicates: 0,
    missingZodiac: 0,
    dataSourceStats: {},
    yearCoverage: [],
    holidayCount: 0,
    solarTermCount: 0,
    leapMonthCount: 0,
    issues: [],
  };

  // 1. Total records count
  console.log('📊 Counting total records...');
  results.totalRecords = await prisma.calendarData.count();
  console.log(`   Total: ${results.totalRecords.toLocaleString()} records\n`);

  // 2. Date range
  console.log('📅 Checking date range...');
  const minDate = await prisma.calendarData.findFirst({
    orderBy: { solarYear: 'asc' },
    select: { solarYear: true, solarMonth: true, solarDay: true },
  });
  const maxDate = await prisma.calendarData.findFirst({
    orderBy: { solarYear: 'desc' },
    select: { solarYear: true, solarMonth: true, solarDay: true },
  });

  if (minDate && maxDate) {
    results.dateRange.min = `${minDate.solarYear}-${String(minDate.solarMonth).padStart(2, '0')}-${String(minDate.solarDay).padStart(2, '0')}`;
    results.dateRange.max = `${maxDate.solarYear}-${String(maxDate.solarMonth).padStart(2, '0')}-${String(maxDate.solarDay).padStart(2, '0')}`;
    console.log(`   Range: ${results.dateRange.min} to ${results.dateRange.max}\n`);
  } else {
    results.issues.push('Could not determine date range');
  }

  // 3. Check for duplicates
  console.log('🔎 Checking for duplicates...');
  const duplicates = await prisma.$queryRaw<Array<{ solar_year: number; solar_month: number; solar_day: number; count: bigint }>>`
    SELECT cd_sy as solar_year, cd_sm as solar_month, cd_sd as solar_day, COUNT(*) as count
    FROM calendar_data
    GROUP BY cd_sy, cd_sm, cd_sd
    HAVING COUNT(*) > 1
  `;
  results.duplicates = duplicates.length;
  if (results.duplicates > 0) {
    console.log(`   ⚠️  Found ${results.duplicates} duplicate dates`);
    results.issues.push(`${results.duplicates} duplicate dates found`);
    duplicates.slice(0, 5).forEach((dup) => {
      console.log(`      ${dup.solar_year}-${dup.solar_month}-${dup.solar_day} (${dup.count} times)`);
    });
  } else {
    console.log(`   ✅ No duplicates found`);
  }
  console.log('');

  // 4. Data source statistics
  console.log('📚 Analyzing data sources...');
  const sourceStats = await prisma.calendarData.groupBy({
    by: ['dataSource'],
    _count: true,
  });
  sourceStats.forEach((stat) => {
    const source = stat.dataSource || 'unknown';
    results.dataSourceStats[source] = stat._count;
    console.log(`   ${source}: ${stat._count.toLocaleString()} records`);
  });
  console.log('');

  // 5. Year coverage
  console.log('📈 Analyzing year coverage...');
  const yearStats = await prisma.$queryRaw<Array<{ year: number; count: bigint }>>`
    SELECT cd_sy as year, COUNT(*) as count
    FROM calendar_data
    GROUP BY cd_sy
    ORDER BY cd_sy
  `;
  results.yearCoverage = yearStats.map((stat) => ({
    year: stat.year,
    count: Number(stat.count),
  }));

  // Check for years with unusual counts (< 365 or > 366)
  const unusualYears = results.yearCoverage.filter(
    (y) => y.count < 365 || y.count > 366
  );
  if (unusualYears.length > 0) {
    console.log(`   ⚠️  Found ${unusualYears.length} years with unusual day counts:`);
    unusualYears.slice(0, 5).forEach((year) => {
      console.log(`      ${year.year}: ${year.count} days`);
    });
    results.issues.push(`${unusualYears.length} years with unusual day counts`);
  } else {
    console.log(`   ✅ All years have valid day counts (365-366)`);
  }
  console.log('');

  // 6. Holiday statistics
  console.log('🎉 Counting holidays...');
  results.holidayCount = await prisma.calendarData.count({
    where: {
      holidayType: { gt: 0 },
    },
  });
  console.log(`   Total holidays: ${results.holidayCount.toLocaleString()}\n`);

  // 7. Solar terms count
  console.log('🌞 Counting solar terms (24절기)...');
  results.solarTermCount = await prisma.calendarData.count({
    where: {
      solarTermKorean: { not: null },
    },
  });
  console.log(`   Total solar terms: ${results.solarTermCount.toLocaleString()}\n`);

  // 8. Leap months
  console.log('🌙 Counting leap months (윤달)...');
  results.leapMonthCount = await prisma.calendarData.count({
    where: {
      isLeapMonth: true,
    },
  });
  console.log(`   Total leap month days: ${results.leapMonthCount.toLocaleString()}\n`);

  // 9. Data completeness checks
  console.log('✅ Checking data completeness...');

  const missingYearGanji = await prisma.calendarData.count({
    where: {
      OR: [{ yearGanjiHanja: null }, { yearGanjiKorean: null }],
    },
  });
  if (missingYearGanji > 0) {
    console.log(`   ⚠️  ${missingYearGanji} records missing year 간지`);
    results.issues.push(`${missingYearGanji} records missing year 간지`);
  }

  const missingDayGanji = await prisma.calendarData.count({
    where: {
      OR: [{ dayGanjiHanja: null }, { dayGanjiKorean: null }],
    },
  });
  if (missingDayGanji > 0) {
    console.log(`   ⚠️  ${missingDayGanji} records missing day 간지`);
    results.issues.push(`${missingDayGanji} records missing day 간지`);
  }

  console.log('');

  // 10. Sample data check
  console.log('🔬 Sample data verification...');
  const sampleDates = [
    { year: 1900, month: 1, day: 1 },
    { year: 2000, month: 1, day: 1 },
    { year: 2025, month: 10, day: 24 },
  ];

  for (const date of sampleDates) {
    const record = await prisma.calendarData.findUnique({
      where: {
        solar_date_unique: {
          solarYear: date.year,
          solarMonth: date.month,
          solarDay: date.day,
        },
      },
    });

    if (record) {
      console.log(`   ✅ ${date.year}-${date.month}-${date.day}:`);
      console.log(`      Lunar: ${record.lunarYear}-${record.lunarMonth}-${record.lunarDay}`);
      console.log(`      Zodiac: ${record.zodiacAnimal}`);
      console.log(`      Year 간지: ${record.yearGanjiKorean}`);
      console.log(`      Day 간지: ${record.dayGanjiKorean}`);
    } else {
      console.log(`   ❌ ${date.year}-${date.month}-${date.day}: NOT FOUND`);
      results.issues.push(`Sample date ${date.year}-${date.month}-${date.day} not found`);
    }
  }

  return results;
}

/**
 * Print validation summary
 */
function printSummary(results: ValidationResults) {
  console.log('\n============================================================');
  console.log('VALIDATION SUMMARY');
  console.log('============================================================\n');

  console.log('📊 Overall Statistics:');
  console.log(`   Total Records: ${results.totalRecords.toLocaleString()}`);
  console.log(`   Date Range: ${results.dateRange.min} to ${results.dateRange.max}`);
  console.log(`   Years Covered: ${results.yearCoverage.length}`);
  console.log('');

  console.log('📚 Data Sources:');
  Object.entries(results.dataSourceStats).forEach(([source, count]) => {
    console.log(`   ${source}: ${count.toLocaleString()} (${((count / results.totalRecords) * 100).toFixed(2)}%)`);
  });
  console.log('');

  console.log('📈 Content Statistics:');
  console.log(`   Holidays: ${results.holidayCount.toLocaleString()}`);
  console.log(`   Solar Terms (24절기): ${results.solarTermCount.toLocaleString()}`);
  console.log(`   Leap Month Days: ${results.leapMonthCount.toLocaleString()}`);
  console.log('');

  if (results.issues.length > 0) {
    console.log('⚠️  Issues Found:');
    results.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    console.log('');
  }

  if (results.issues.length === 0 && results.duplicates === 0) {
    console.log('✅ All validation checks passed!\n');
  } else {
    console.log('⚠️  Some issues were found. Please review the details above.\n');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('============================================================');
  console.log('Calendar Data Validation');
  console.log('============================================================\n');

  try {
    const results = await validateData();
    printSummary(results);

    if (results.issues.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
