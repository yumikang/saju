/**
 * 사주 계산 엔진 (TypeScript 직접 구현)
 *
 * 천간(天干): 갑을병정무기경신임계 (10개)
 * 지지(地支): 자축인묘진사오미신유술해 (12개)
 *
 * 참고:
 * - 천간 오행: 갑을=목, 병정=화, 무기=토, 경신=금, 임계=수
 * - 지지 장간: 각 지지는 1-3개의 천간을 포함
 */

import { Element } from '@prisma/client';
import { getCalendarDataService } from '~/lib/calendar/calendar-data.service';

export interface Pillar {
  stem: string;    // 천간
  branch: string;  // 지지
}

export interface SajuResult {
  pillars: {
    year: Pillar;   // 년주
    month: Pillar;  // 월주
    day: Pillar;    // 일주
    hour: Pillar;   // 시주
  };
  dayMaster: {
    stem: string;
    element: Element;
  };
  elementCounts: Record<Element, number>;
  lackingElements: Element[];
  favorableElements: Element[];
  yongsin: {
    primary: Element;
    secondary?: Element;
  };
}

export class SajuCalculator {
  // 천간 (10개)
  private readonly STEMS = [
    '갑', '을', '병', '정', '무',
    '기', '경', '신', '임', '계',
  ] as const;

  // 지지 (12개)
  private readonly BRANCHES = [
    '자', '축', '인', '묘', '진', '사',
    '오', '미', '신', '유', '술', '해',
  ] as const;

  // 천간 오행
  private readonly STEM_ELEMENTS: Record<string, Element> = {
    갑: Element.WOOD,
    을: Element.WOOD,
    병: Element.FIRE,
    정: Element.FIRE,
    무: Element.EARTH,
    기: Element.EARTH,
    경: Element.METAL,
    신: Element.METAL,
    임: Element.WATER,
    계: Element.WATER,
  };

  // 지지 장간 (숨은 천간)
  private readonly BRANCH_ELEMENTS: Record<string, Element[]> = {
    자: [Element.WATER],
    축: [Element.EARTH, Element.WATER, Element.METAL],
    인: [Element.WOOD, Element.FIRE, Element.EARTH],
    묘: [Element.WOOD],
    진: [Element.EARTH, Element.WOOD, Element.WATER],
    사: [Element.FIRE, Element.EARTH, Element.METAL],
    오: [Element.FIRE, Element.EARTH],
    미: [Element.EARTH, Element.WOOD, Element.FIRE],
    신: [Element.METAL, Element.WATER, Element.EARTH],
    유: [Element.METAL],
    술: [Element.EARTH, Element.METAL, Element.FIRE],
    해: [Element.WATER, Element.WOOD],
  };

  /**
   * 메인 계산 함수
   */
  async calculate(
    birthDate: Date,
    birthTime: string, // "HH:mm" 형식
    isLunar: boolean = false
  ): Promise<SajuResult> {
    // 1. 음력 변환 (필요시)
    const solarDate = isLunar ? await this.convertToSolar(birthDate) : birthDate;

    // 2. 절기 계산 (입춘)
    const lichun = await this.calculateLichun(solarDate.getFullYear());

    // 3. 사주 팔자 추출
    const pillars = {
      year: this.getYearPillar(solarDate, lichun),
      month: this.getMonthPillar(solarDate, lichun),
      day: this.getDayPillar(solarDate),
      hour: this.getHourPillar(birthTime, solarDate),
    };

    // 4. 일간 (Day Master)
    const dayMaster = {
      stem: pillars.day.stem,
      element: this.STEM_ELEMENTS[pillars.day.stem],
    };

    // 5. 오행 카운트
    const elementCounts = this.countElements(pillars);

    // 6. 용신 결정
    const yongsin = this.calculateYongsin(elementCounts, dayMaster.element);

    // 7. 부족/유리 오행
    const lackingElements = this.findLackingElements(elementCounts);
    const favorableElements = [yongsin.primary];
    if (yongsin.secondary) favorableElements.push(yongsin.secondary);

    return {
      pillars,
      dayMaster,
      elementCounts,
      lackingElements,
      favorableElements,
      yongsin,
    };
  }

  /**
   * 년주 계산
   */
  private getYearPillar(date: Date, lichun: Date): Pillar {
    let year = date.getFullYear();

    // 입춘 이전이면 전년도로 계산
    if (date < lichun) year--;

    const stemIndex = (year - 4) % 10;
    const branchIndex = (year - 4) % 12;

    return {
      stem: this.STEMS[stemIndex],
      branch: this.BRANCHES[branchIndex],
    };
  }

  /**
   * 월주 계산
   */
  private getMonthPillar(date: Date, lichun: Date): Pillar {
    // 절기별 월 계산 (간략 버전)
    // 실제로는 24절기 정확히 계산 필요

    const year = date >= lichun ? date.getFullYear() : date.getFullYear() - 1;
    const month = date.getMonth() + 1; // 1-12

    // 월지 (지지)
    const branchIndex = (month + 1) % 12; // 인월부터 시작
    const branch = this.BRANCHES[branchIndex];

    // 월간 (천간) - 년간에 따라 결정
    const yearStemIndex = (year - 4) % 10;
    const monthStemIndex = (yearStemIndex * 2 + month + 1) % 10;
    const stem = this.STEMS[monthStemIndex];

    return { stem, branch };
  }

  /**
   * 일주 계산 (가장 복잡함)
   */
  private getDayPillar(date: Date): Pillar {
    // 기준일: 1900년 1월 1일 = 갑자일
    const baseDate = new Date(1900, 0, 1);
    const diffDays = Math.floor(
      (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 60갑자 순환
    const stemIndex = diffDays % 10;
    const branchIndex = diffDays % 12;

    return {
      stem: this.STEMS[stemIndex < 0 ? stemIndex + 10 : stemIndex],
      branch: this.BRANCHES[branchIndex < 0 ? branchIndex + 12 : branchIndex],
    };
  }

  /**
   * 시주 계산
   */
  private getHourPillar(time: string, date: Date): Pillar {
    const [hours] = time.split(':').map(Number);

    // 시지 (지지) - 2시간 단위
    const branchIndex = Math.floor((hours + 1) / 2) % 12;
    const branch = this.BRANCHES[branchIndex];

    // 시간 (천간) - 일간에 따라 결정
    const dayPillar = this.getDayPillar(date);
    const dayStemIndex = this.STEMS.indexOf(dayPillar.stem as any);
    const hourStemIndex = (dayStemIndex * 2 + branchIndex) % 10;
    const stem = this.STEMS[hourStemIndex];

    return { stem, branch };
  }

  /**
   * 오행 카운트
   */
  private countElements(pillars: SajuResult['pillars']): Record<Element, number> {
    const counts: Record<Element, number> = {
      [Element.WOOD]: 0,
      [Element.FIRE]: 0,
      [Element.EARTH]: 0,
      [Element.METAL]: 0,
      [Element.WATER]: 0,
    };

    // 천간 (4개)
    for (const pillar of Object.values(pillars)) {
      counts[this.STEM_ELEMENTS[pillar.stem]]++;
    }

    // 지지 장간 (숨은 천간 포함)
    for (const pillar of Object.values(pillars)) {
      for (const elem of this.BRANCH_ELEMENTS[pillar.branch]) {
        counts[elem] += 0.5; // 지지는 절반 가중치
      }
    }

    return counts;
  }

  /**
   * 용신 결정 (간단 버전)
   */
  private calculateYongsin(
    counts: Record<Element, number>,
    dayMasterElement: Element
  ): { primary: Element; secondary?: Element } {
    const dayMasterCount = counts[dayMasterElement];
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    const strength = dayMasterCount / totalCount;

    // 일간이 약하면 생조, 강하면 설
    if (strength < 0.2) {
      // 매우 약함 → 생조 필요 (나를 생하는 오행)
      return {
        primary: this.getProducingElement(dayMasterElement),
        secondary: dayMasterElement,
      };
    } else if (strength > 0.4) {
      // 강함 → 설기 필요 (내가 생하는 오행)
      return {
        primary: this.getWeakeningElement(dayMasterElement),
      };
    } else {
      // 균형 → 부족한 오행 보충
      const lacking = this.findLackingElements(counts);
      return {
        primary: lacking[0] || dayMasterElement,
        secondary: lacking[1],
      };
    }
  }

  /**
   * 상생: 나를 생하는 오행
   */
  private getProducingElement(element: Element): Element {
    const map = {
      [Element.WOOD]: Element.WATER,   // 수생목
      [Element.FIRE]: Element.WOOD,    // 목생화
      [Element.EARTH]: Element.FIRE,   // 화생토
      [Element.METAL]: Element.EARTH,  // 토생금
      [Element.WATER]: Element.METAL,  // 금생수
    };
    return map[element];
  }

  /**
   * 설기: 내가 생하는 오행
   */
  private getWeakeningElement(element: Element): Element {
    const map = {
      [Element.WOOD]: Element.FIRE,    // 목생화
      [Element.FIRE]: Element.EARTH,   // 화생토
      [Element.EARTH]: Element.METAL,  // 토생금
      [Element.METAL]: Element.WATER,  // 금생수
      [Element.WATER]: Element.WOOD,   // 수생목
    };
    return map[element];
  }

  /**
   * 부족한 오행 찾기
   */
  private findLackingElements(counts: Record<Element, number>): Element[] {
    const avg = Object.values(counts).reduce((a, b) => a + b, 0) / 5;
    return (Object.entries(counts) as [Element, number][])
      .filter(([_, count]) => count < avg * 0.5)
      .map(([elem, _]) => elem);
  }

  /**
   * 입춘 계산 (CalendarData DB 사용)
   */
  private async calculateLichun(year: number): Promise<Date> {
    try {
      const calendarService = getCalendarDataService();
      const lichun = await calendarService.getLichun(year);

      if (lichun) {
        return lichun;
      }
    } catch (error) {
      console.warn(`⚠️  입춘 데이터 조회 실패 (${year}년):`, error);
    }

    // Fallback: approximate calculation if data not available
    // 입춘은 대략 2월 3-5일
    console.warn(`⚠️  입춘 데이터 없음 (${year}년) - 근사값 사용`);
    return new Date(year, 1, 4, 0, 0, 0);
  }

  /**
   * 음력→양력 변환 (CalendarData DB 사용)
   */
  private async convertToSolar(lunarDate: Date): Promise<Date> {
    try {
      const calendarService = getCalendarDataService();

      const solarDate = await calendarService.lunarToSolar(
        lunarDate.getFullYear(),
        lunarDate.getMonth() + 1,
        lunarDate.getDate(),
        false // isLeapMonth - could be parameter if needed
      );

      if (solarDate) {
        return new Date(solarDate.year, solarDate.month - 1, solarDate.day);
      }
    } catch (error) {
      console.warn(`⚠️  음력 변환 조회 실패:`, error);
    }

    // Fallback: return as-is with warning
    console.warn(
      `⚠️  음력 변환 실패 (${lunarDate.getFullYear()}-${lunarDate.getMonth() + 1}-${lunarDate.getDate()}) - 양력으로 간주`
    );
    return lunarDate;
  }
}

// ============================================================
// 테스트
// ============================================================

// ESM에서는 import.meta.url로 main 모듈 체크
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const calculator = new SajuCalculator();

  const birthDate = new Date(1990, 4, 15); // 1990년 5월 15일
  const birthTime = '14:30';

  const result = calculator.calculate(birthDate, birthTime, false);

  console.log('\n🔮 사주 계산 결과\n');
  console.log('년주:', result.pillars.year);
  console.log('월주:', result.pillars.month);
  console.log('일주:', result.pillars.day);
  console.log('시주:', result.pillars.hour);
  console.log('\n일간:', result.dayMaster);
  console.log('\n오행 분포:', result.elementCounts);
  console.log('부족 오행:', result.lackingElements);
  console.log('용신:', result.yongsin);
}
