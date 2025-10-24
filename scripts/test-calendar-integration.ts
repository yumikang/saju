/**
 * Test Calendar Integration with SajuCalculator
 *
 * This script tests the newly integrated CalendarDataService
 * with the SajuCalculator to verify:
 * 1. Lichun (입춘) calculation from DB
 * 2. Lunar-to-Solar conversion from DB
 * 3. Saju calculation with real calendar data
 */

import { SajuCalculator } from '../app/lib/saju/calculator';
import { getCalendarDataService } from '../app/lib/calendar/calendar-data.service';

async function testLichunCalculation() {
  console.log('\n🔮 Testing Lichun Calculation\n');

  const calendarService = getCalendarDataService();

  // Test for multiple years
  const years = [2020, 2021, 2022, 2023, 2024, 2025];

  for (const year of years) {
    const lichun = await calendarService.getLichun(year);
    if (lichun) {
      console.log(
        `${year}년 입춘: ${lichun.getFullYear()}-${String(lichun.getMonth() + 1).padStart(2, '0')}-${String(lichun.getDate()).padStart(2, '0')} ${String(lichun.getHours()).padStart(2, '0')}:${String(lichun.getMinutes()).padStart(2, '0')}`
      );
    } else {
      console.log(`${year}년 입춘: ❌ 데이터 없음`);
    }
  }
}

async function testLunarToSolarConversion() {
  console.log('\n\n🌙 Testing Lunar-to-Solar Conversion\n');

  const calendarService = getCalendarDataService();

  // Test cases: [lunar year, lunar month, lunar day, expected solar year, expected solar month, expected solar day]
  const testCases = [
    { lunar: { year: 2024, month: 1, day: 1 }, desc: '2024년 음력 1월 1일 (설날)' },
    { lunar: { year: 2024, month: 8, day: 15 }, desc: '2024년 음력 8월 15일 (추석)' },
    { lunar: { year: 2025, month: 1, day: 1 }, desc: '2025년 음력 1월 1일 (설날)' },
  ];

  for (const testCase of testCases) {
    const { year, month, day } = testCase.lunar;
    const solarDate = await calendarService.lunarToSolar(year, month, day);

    if (solarDate) {
      console.log(
        `✅ ${testCase.desc}\n   → 양력: ${solarDate.year}-${String(solarDate.month).padStart(2, '0')}-${String(solarDate.day).padStart(2, '0')}`
      );
    } else {
      console.log(`❌ ${testCase.desc}\n   → 변환 실패`);
    }
  }
}

async function testSolarToLunarConversion() {
  console.log('\n\n☀️  Testing Solar-to-Lunar Conversion\n');

  const calendarService = getCalendarDataService();

  // Test cases
  const testCases = [
    { solar: { year: 2024, month: 2, day: 10 }, desc: '2024-02-10 (설날)' },
    { solar: { year: 2024, month: 9, day: 17 }, desc: '2024-09-17 (추석)' },
    { solar: { year: 2025, month: 1, day: 29 }, desc: '2025-01-29 (설날)' },
  ];

  for (const testCase of testCases) {
    const { year, month, day } = testCase.solar;
    const lunarDate = await calendarService.solarToLunar(year, month, day);

    if (lunarDate) {
      console.log(
        `✅ ${testCase.desc}\n   → 음력: ${lunarDate.year}-${String(lunarDate.month).padStart(2, '0')}-${String(lunarDate.day).padStart(2, '0')}${lunarDate.isLeapMonth ? ' (윤달)' : ''}`
      );
    } else {
      console.log(`❌ ${testCase.desc}\n   → 변환 실패`);
    }
  }
}

async function testSajuCalculation() {
  console.log('\n\n📊 Testing Saju Calculation with Calendar Integration\n');

  const calculator = new SajuCalculator();

  // Test case 1: Solar date
  console.log('Test 1: 양력 1990년 5월 15일 14:30');
  const birthDate1 = new Date(1990, 4, 15);
  const result1 = await calculator.calculate(birthDate1, '14:30', false);

  console.log('년주:', result1.pillars.year);
  console.log('월주:', result1.pillars.month);
  console.log('일주:', result1.pillars.day);
  console.log('시주:', result1.pillars.hour);
  console.log('일간:', result1.dayMaster);
  console.log('용신:', result1.yongsin);

  // Test case 2: Lunar date
  console.log('\n\nTest 2: 음력 2024년 1월 1일 09:00 (설날)');
  const birthDate2 = new Date(2024, 0, 1);
  const result2 = await calculator.calculate(birthDate2, '09:00', true);

  console.log('년주:', result2.pillars.year);
  console.log('월주:', result2.pillars.month);
  console.log('일주:', result2.pillars.day);
  console.log('시주:', result2.pillars.hour);
  console.log('일간:', result2.dayMaster);
  console.log('용신:', result2.yongsin);

  // Test case 3: Date near Lichun
  console.log('\n\nTest 3: 양력 2024년 2월 3일 16:00 (입춘 근처)');
  const birthDate3 = new Date(2024, 1, 3);
  const result3 = await calculator.calculate(birthDate3, '16:00', false);

  console.log('년주:', result3.pillars.year);
  console.log('월주:', result3.pillars.month);
  console.log('일주:', result3.pillars.day);
  console.log('시주:', result3.pillars.hour);
  console.log('일간:', result3.dayMaster);
  console.log('용신:', result3.yongsin);
}

async function testGetSolarTerms() {
  console.log('\n\n📅 Testing Get Solar Terms (24절기)\n');

  const calendarService = getCalendarDataService();

  const year = 2024;
  const solarTerms = await calendarService.getSolarTerms(year);

  console.log(`${year}년 24절기:\n`);
  solarTerms.forEach((term) => {
    const date = term.date;
    console.log(
      `${term.name.padEnd(6, ' ')}: ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    );
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Calendar Integration Test');
  console.log('='.repeat(60));

  try {
    await testLichunCalculation();
    await testLunarToSolarConversion();
    await testSolarToLunarConversion();
    await testGetSolarTerms();
    await testSajuCalculation();

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n\n❌ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
