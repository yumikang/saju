/**
 * Calendar Data Service
 *
 * Provides access to the Korean lunar calendar (만세력) data
 * migrated from MySQL to PostgreSQL via Prisma.
 *
 * Database: calendar_data (96,429 records, 1841-2110)
 *
 * Key Features:
 * - Solar ↔ Lunar date conversion
 * - 24 solar terms (절기) lookup
 * - Stem-Branch (간지) calculation
 * - Zodiac animal (띠) identification
 * - Holiday information
 */

import { prisma } from '~/lib/db.server';
import type { CalendarData, ZodiacAnimal } from '@prisma/client';

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

export interface SajuGanji {
  year: {
    hanja: string;
    korean: string;
  };
  month: {
    hanja: string;
    korean: string;
  };
  day: {
    hanja: string;
    korean: string;
  };
}

export interface CalendarInfo {
  solar: SolarDate;
  lunar: LunarDate;
  ganji: SajuGanji;
  zodiacAnimal: ZodiacAnimal;
  solarTerm?: string;
  holiday: number;
  holidayName?: string;
}

export class CalendarDataService {
  /**
   * Get calendar data by solar date
   */
  async getBySolarDate(
    year: number,
    month: number,
    day: number
  ): Promise<CalendarInfo | null> {
    const data = await prisma.calendarData.findUnique({
      where: {
        solar_date_unique: {
          solarYear: year,
          solarMonth: month,
          solarDay: day,
        },
      },
    });

    if (!data) return null;

    return this.mapToCalendarInfo(data);
  }

  /**
   * Get calendar data by lunar date
   */
  async getByLunarDate(
    year: number,
    month: number,
    day: number,
    isLeapMonth: boolean = false
  ): Promise<CalendarInfo | null> {
    const data = await prisma.calendarData.findFirst({
      where: {
        lunarYear: year,
        lunarMonth: month,
        lunarDay: day,
        isLeapMonth: isLeapMonth,
      },
    });

    if (!data) return null;

    return this.mapToCalendarInfo(data);
  }

  /**
   * Convert lunar date to solar date
   */
  async lunarToSolar(
    lunarYear: number,
    lunarMonth: number,
    lunarDay: number,
    isLeapMonth: boolean = false
  ): Promise<SolarDate | null> {
    const info = await this.getByLunarDate(lunarYear, lunarMonth, lunarDay, isLeapMonth);
    return info ? info.solar : null;
  }

  /**
   * Convert solar date to lunar date
   */
  async solarToLunar(
    solarYear: number,
    solarMonth: number,
    solarDay: number
  ): Promise<LunarDate | null> {
    const info = await this.getBySolarDate(solarYear, solarMonth, solarDay);
    return info ? info.lunar : null;
  }

  /**
   * Get Lichun (입춘) date for a given year
   * 입춘은 사주에서 연도 전환의 기준이 되는 절기
   */
  async getLichun(year: number): Promise<Date | null> {
    const data = await prisma.calendarData.findFirst({
      where: {
        solarYear: year,
        solarTermKorean: '입춘',
      },
    });

    if (!data) return null;

    // calendar_data has the exact date, and cd_terms_time has the exact time
    // Format: "HH:mm" or "오전/오후 HH:mm"
    const timeStr = data.solarTermTime || '00:00';
    const [hours, minutes] = this.parseKoreanTime(timeStr);

    return new Date(data.solarYear, data.solarMonth - 1, data.solarDay, hours, minutes);
  }

  /**
   * Get all 24 solar terms for a given year
   */
  async getSolarTerms(year: number): Promise<Array<{
    name: string;
    date: Date;
  }>> {
    const data = await prisma.calendarData.findMany({
      where: {
        solarYear: year,
        solarTermKorean: {
          not: null,
        },
      },
      orderBy: [
        { solarMonth: 'asc' },
        { solarDay: 'asc' },
      ],
    });

    return data.map((d) => {
      const timeStr = d.solarTermTime || '00:00';
      const [hours, minutes] = this.parseKoreanTime(timeStr);

      return {
        name: d.solarTermKorean!,
        date: new Date(d.solarYear, d.solarMonth - 1, d.solarDay, hours, minutes),
      };
    });
  }

  /**
   * Get holidays in a date range
   */
  async getHolidays(
    startYear: number,
    startMonth: number,
    startDay: number,
    endYear: number,
    endMonth: number,
    endDay: number
  ): Promise<CalendarInfo[]> {
    const data = await prisma.calendarData.findMany({
      where: {
        AND: [
          {
            OR: [
              { solarYear: { gt: startYear } },
              {
                AND: [
                  { solarYear: startYear },
                  {
                    OR: [
                      { solarMonth: { gt: startMonth } },
                      {
                        AND: [
                          { solarMonth: startMonth },
                          { solarDay: { gte: startDay } },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            OR: [
              { solarYear: { lt: endYear } },
              {
                AND: [
                  { solarYear: endYear },
                  {
                    OR: [
                      { solarMonth: { lt: endMonth } },
                      {
                        AND: [
                          { solarMonth: endMonth },
                          { solarDay: { lte: endDay } },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { holidayType: { gt: 0 } },
        ],
      },
      orderBy: [
        { solarYear: 'asc' },
        { solarMonth: 'asc' },
        { solarDay: 'asc' },
      ],
    });

    return data.map((d) => this.mapToCalendarInfo(d));
  }

  /**
   * Get zodiac year range
   */
  async getZodiacYearRange(zodiacAnimal: ZodiacAnimal): Promise<{
    startYear: number;
    endYear: number;
    totalDays: number;
  } | null> {
    const result = await prisma.calendarData.aggregate({
      where: {
        zodiacAnimal: zodiacAnimal,
      },
      _min: {
        solarYear: true,
      },
      _max: {
        solarYear: true,
      },
      _count: {
        id: true,
      },
    });

    if (!result._min.solarYear || !result._max.solarYear) {
      return null;
    }

    return {
      startYear: result._min.solarYear,
      endYear: result._max.solarYear,
      totalDays: result._count.id,
    };
  }

  /**
   * Check if calendar data exists for a date range
   */
  async checkCoverage(
    startYear: number,
    endYear: number
  ): Promise<{
    hasCoverage: boolean;
    startYear: number;
    endYear: number;
    recordCount: number;
  }> {
    const count = await prisma.calendarData.count({
      where: {
        solarYear: {
          gte: startYear,
          lte: endYear,
        },
      },
    });

    const minMax = await prisma.calendarData.aggregate({
      where: {
        solarYear: {
          gte: startYear,
          lte: endYear,
        },
      },
      _min: {
        solarYear: true,
      },
      _max: {
        solarYear: true,
      },
    });

    return {
      hasCoverage: count > 0,
      startYear: minMax._min.solarYear || startYear,
      endYear: minMax._max.solarYear || endYear,
      recordCount: count,
    };
  }

  /**
   * Parse Korean time format
   * Examples: "오전 11:14", "오후 05:27", "11:14"
   */
  private parseKoreanTime(timeStr: string): [number, number] {
    if (!timeStr) return [0, 0];

    const isPM = timeStr.includes('오후');
    const isAM = timeStr.includes('오전');

    // Extract time part
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return [0, 0];

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    // Convert to 24-hour format
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    return [hours, minutes];
  }

  /**
   * Map database record to CalendarInfo
   */
  private mapToCalendarInfo(data: CalendarData): CalendarInfo {
    return {
      solar: {
        year: data.solarYear,
        month: data.solarMonth,
        day: data.solarDay,
      },
      lunar: {
        year: data.lunarYear,
        month: data.lunarMonth,
        day: data.lunarDay,
        isLeapMonth: data.isLeapMonth,
      },
      ganji: {
        year: {
          hanja: data.yearGanjiHanja || '',
          korean: data.yearGanjiKorean || '',
        },
        month: {
          hanja: data.monthGanjiHanja || '',
          korean: data.monthGanjiKorean || '',
        },
        day: {
          hanja: data.dayGanjiHanja || '',
          korean: data.dayGanjiKorean || '',
        },
      },
      zodiacAnimal: data.zodiacAnimal,
      solarTerm: data.solarTermKorean || undefined,
      holiday: data.holidayType,
      holidayName: data.solarHoliday || data.lunarHoliday || undefined,
    };
  }
}

// Singleton instance
let calendarDataService: CalendarDataService;

export function getCalendarDataService(): CalendarDataService {
  if (!calendarDataService) {
    calendarDataService = new CalendarDataService();
  }
  return calendarDataService;
}
