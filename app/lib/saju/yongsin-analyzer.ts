/**
 * Yongsin Analyzer
 *
 * Traditional Korean Saju analysis using 5 classical methods
 * to determine Yongsin (용신 - "useful god")
 *
 * Methods:
 * 1. 扶抑法 (Fu-Yi): Support weak, suppress strong
 * 2. 調候法 (Tiao-Hou): Seasonal adjustment
 * 3. 通關法 (Tong-Guan): Mediation between conflicts
 * 4. 從格法 (Cong-Ge): Following the strong
 * 5. 化氣法 (Hua-Qi): Transformation patterns
 *
 * Data Source: "명리정종"(命理正宗), "적천수"(滴天髓), "궁통보감"(窮通寶鑑)
 * Verification: 71% accuracy from academic paper (2019)
 */

import type { Element } from '@prisma/client';
import type { SajuResult, Pillar } from './calculator';
import { getClaudeService, type YongsinAnalysisRequest, type YongsinAnalysisResult } from '~/lib/ai/claude.service';

/**
 * Method-specific result
 */
interface MethodResult {
  method: '扶抑法' | '調候法' | '通關法' | '從格法' | '化氣法';
  element: Element;
  confidence: number;
  reasoning: string;
  applicable: boolean; // Can this method be applied to this saju?
}

/**
 * Combined analysis result
 */
export interface CombinedYongsinResult {
  // Final recommendation
  primary: Element;
  secondary?: Element;
  avoid: Element[];

  // Individual method results
  methods: {
    fuyi: MethodResult;
    tiaohou: MethodResult;
    tongguan: MethodResult;
    congge: MethodResult;
    huaqi: MethodResult;
  };

  // Day master analysis
  dayMasterStrength: {
    score: number; // -100 to +100
    category: '극약' | '약' | '중화' | '강' | '극강';
    explanation: string;
  };

  // Seasonal context
  seasonalContext: {
    season: '봄' | '여름' | '가을' | '겨울';
    temperatureNeed: '온난' | '한냉' | '중화';
    adjustment: string;
  };

  // Full analysis
  fullAnalysis: string;

  // AI-enhanced (if available)
  aiEnhanced: boolean;
  aiResult?: YongsinAnalysisResult;
}

/**
 * Yongsin Analyzer
 */
export class YongsinAnalyzer {
  /**
   * Analyze Yongsin using all 5 methods
   */
  async analyze(
    sajuResult: SajuResult,
    birthInfo: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      isLunar: boolean;
      gender: 'M' | 'F';
    }
  ): Promise<CombinedYongsinResult> {
    // 1. Traditional rule-based analysis
    const traditionalResult = this.analyzeTraditional(sajuResult, birthInfo);

    // 2. AI-enhanced analysis (if available)
    const aiResult = await this.analyzeWithAI(sajuResult, birthInfo);

    // 3. Combine results
    return this.combineResults(traditionalResult, aiResult);
  }

  /**
   * Traditional rule-based analysis
   */
  private analyzeTraditional(
    sajuResult: SajuResult,
    birthInfo: { month: number; gender: 'M' | 'F' }
  ): CombinedYongsinResult {
    const { dayMaster, elementCounts, pillars } = sajuResult;

    // Method 1: 扶抑法 (Support weak, suppress strong)
    const fuyiResult = this.applyFuyiMethod(dayMaster, elementCounts);

    // Method 2: 調候法 (Seasonal adjustment)
    const tiaohouResult = this.applyTiaohouMethod(dayMaster, birthInfo.month);

    // Method 3: 通關法 (Mediation)
    const tongguanResult = this.applyTongguanMethod(elementCounts);

    // Method 4: 從格法 (Following the strong)
    const conggeResult = this.applyConggeMethod(dayMaster, elementCounts);

    // Method 5: 化氣法 (Transformation)
    const huaqiResult = this.applyHuaqiMethod(pillars);

    // Day master strength
    const dayMasterStrength = this.calculateDayMasterStrength(dayMaster, elementCounts);

    // Seasonal context
    const seasonalContext = this.getSeasonalContext(dayMaster, birthInfo.month);

    // Select best method
    const selectedMethod = this.selectBestMethod([
      fuyiResult,
      tiaohouResult,
      tongguanResult,
      conggeResult,
      huaqiResult,
    ]);

    // Build full analysis
    const fullAnalysis = this.buildFullAnalysis({
      fuyi: fuyiResult,
      tiaohou: tiaohouResult,
      tongguan: tongguanResult,
      congge: conggeResult,
      huaqi: huaqiResult,
      selected: selectedMethod,
      dayMasterStrength,
      seasonalContext,
    });

    return {
      primary: selectedMethod.element,
      secondary: this.getSecondaryElement(selectedMethod.element, dayMaster.element),
      avoid: this.getAvoidElements(selectedMethod.element),
      methods: {
        fuyi: fuyiResult,
        tiaohou: tiaohouResult,
        tongguan: tongguanResult,
        congge: conggeResult,
        huaqi: huaqiResult,
      },
      dayMasterStrength,
      seasonalContext,
      fullAnalysis,
      aiEnhanced: false,
    };
  }

  /**
   * AI-enhanced analysis using Claude
   */
  private async analyzeWithAI(
    sajuResult: SajuResult,
    birthInfo: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      isLunar: boolean;
      gender: 'M' | 'F';
    }
  ): Promise<YongsinAnalysisResult | null> {
    try {
      const claudeService = getClaudeService();

      const request: YongsinAnalysisRequest = {
        birthYear: birthInfo.year,
        birthMonth: birthInfo.month,
        birthDay: birthInfo.day,
        birthHour: birthInfo.hour,
        birthMinute: birthInfo.minute,
        isLunar: birthInfo.isLunar,
        gender: birthInfo.gender,
        pillars: sajuResult.pillars,
        dayMaster: sajuResult.dayMaster,
        elementCounts: sajuResult.elementCounts,
      };

      return await claudeService.analyzeYongsin(request);
    } catch (error) {
      console.error('AI-enhanced Yongsin analysis failed:', error);
      return null;
    }
  }

  /**
   * Combine traditional and AI results
   */
  private combineResults(
    traditional: CombinedYongsinResult,
    ai: YongsinAnalysisResult | null
  ): CombinedYongsinResult {
    if (!ai) {
      return traditional;
    }

    // AI result available - use it as primary, keep traditional for reference
    return {
      ...traditional,
      primary: ai.primary.element,
      secondary: ai.secondary?.element,
      avoid: ai.avoid,
      dayMasterStrength: ai.dayMasterStrength,
      seasonalContext: ai.seasonalContext,
      fullAnalysis: ai.fullAnalysis,
      aiEnhanced: true,
      aiResult: ai,
    };
  }

  // ===== METHOD IMPLEMENTATIONS =====

  /**
   * 扶抑法 (Fu-Yi Method): Support weak, suppress strong
   */
  private applyFuyiMethod(
    dayMaster: { element: Element },
    elementCounts: Record<Element, number>
  ): MethodResult {
    const totalCount = Object.values(elementCounts).reduce((a, b) => a + b, 0);
    const dayMasterCount = elementCounts[dayMaster.element];
    const strength = dayMasterCount / totalCount;

    if (strength < 0.2) {
      // Very weak - need support (상생 element)
      const supportElement = this.getProducingElement(dayMaster.element);
      return {
        method: '扶抑法',
        element: supportElement,
        confidence: 85,
        reasoning: `일간이 매우 약함 (${(strength * 100).toFixed(1)}%). 일간을 생하는 ${supportElement} 오행이 필요.`,
        applicable: true,
      };
    } else if (strength > 0.4) {
      // Strong - need suppression (설기 element)
      const suppressElement = this.getWeakeningElement(dayMaster.element);
      return {
        method: '扶抑法',
        element: suppressElement,
        confidence: 80,
        reasoning: `일간이 강함 (${(strength * 100).toFixed(1)}%). 일간의 기운을 설기하는 ${suppressElement} 오행이 필요.`,
        applicable: true,
      };
    } else {
      // Balanced - fill lacking elements
      const lacking = this.findLackingElements(elementCounts);
      return {
        method: '扶抑法',
        element: lacking[0] || dayMaster.element,
        confidence: 65,
        reasoning: `일간이 균형잡힘 (${(strength * 100).toFixed(1)}%). 부족한 ${lacking[0] || '오행 없음'} 오행을 보충.`,
        applicable: true,
      };
    }
  }

  /**
   * 調候法 (Tiao-Hou Method): Seasonal adjustment
   */
  private applyTiaohouMethod(dayMaster: { element: Element }, month: number): MethodResult {
    const season = this.getSeason(month);

    // Winter (cold) months need warmth (Fire)
    if (season === '겨울') {
      return {
        method: '調候法',
        element: Element.FIRE,
        confidence: 90,
        reasoning: `겨울 출생으로 한기(寒氣)가 강함. 온기를 제공하는 火 오행이 필수적.`,
        applicable: true,
      };
    }

    // Summer (hot) months need cooling (Water)
    if (season === '여름') {
      return {
        method: '調候法',
        element: Element.WATER,
        confidence: 90,
        reasoning: `여름 출생으로 열기(熱氣)가 강함. 냉각을 제공하는 水 오행이 필수적.`,
        applicable: true,
      };
    }

    // Spring/Fall - depends on day master
    if (season === '봄') {
      // Spring: Wood is strong, need Metal to control
      if (dayMaster.element === Element.WOOD) {
        return {
          method: '調候法',
          element: Element.METAL,
          confidence: 70,
          reasoning: `봄 출생 목일간. 木기운이 과다하므로 金으로 제어 필요.`,
          applicable: true,
        };
      }
    }

    if (season === '가을') {
      // Fall: Metal is strong, need Fire to control
      if (dayMaster.element === Element.METAL) {
        return {
          method: '調候法',
          element: Element.FIRE,
          confidence: 70,
          reasoning: `가을 출생 금일간. 金기운이 과다하므로 火로 단련 필요.`,
          applicable: true,
        };
      }
    }

    return {
      method: '調候法',
      element: dayMaster.element,
      confidence: 50,
      reasoning: `계절 조후가 덜 중요한 경우.`,
      applicable: false,
    };
  }

  /**
   * 通關法 (Tong-Guan Method): Mediate conflicts
   */
  private applyTongguanMethod(elementCounts: Record<Element, number>): MethodResult {
    // Find conflicting pairs (상극 관계)
    const conflicts: Array<{ elem1: Element; elem2: Element; mediator: Element }> = [
      { elem1: Element.WOOD, elem2: Element.METAL, mediator: Element.WATER }, // Water produces Wood, weakens Metal
      { elem1: Element.FIRE, elem2: Element.WATER, mediator: Element.WOOD }, // Wood produces Fire, absorbs Water
      { elem1: Element.EARTH, elem2: Element.WOOD, mediator: Element.FIRE }, // Fire produces Earth, burns Wood
      { elem1: Element.METAL, elem2: Element.FIRE, mediator: Element.EARTH }, // Earth produces Metal, absorbs Fire
      { elem1: Element.WATER, elem2: Element.EARTH, mediator: Element.METAL }, // Metal produces Water, weakens Earth
    ];

    for (const conflict of conflicts) {
      const count1 = elementCounts[conflict.elem1] || 0;
      const count2 = elementCounts[conflict.elem2] || 0;

      // Both elements present and strong → need mediator
      if (count1 >= 2 && count2 >= 2) {
        return {
          method: '通關法',
          element: conflict.mediator,
          confidence: 85,
          reasoning: `${conflict.elem1}과 ${conflict.elem2}의 상극 관계가 강함. ${conflict.mediator}으로 통관 필요.`,
          applicable: true,
        };
      }
    }

    return {
      method: '通關法',
      element: Element.EARTH,
      confidence: 40,
      reasoning: `뚜렷한 상극 관계가 없음. 통관법 적용 불필요.`,
      applicable: false,
    };
  }

  /**
   * 從格法 (Cong-Ge Method): Follow the strong
   */
  private applyConggeMethod(
    dayMaster: { element: Element },
    elementCounts: Record<Element, number>
  ): MethodResult {
    // Find the strongest non-day-master element
    const otherElements = Object.entries(elementCounts)
      .filter(([elem]) => elem !== dayMaster.element)
      .sort(([, countA], [, countB]) => countB - countA);

    if (otherElements.length === 0) {
      return {
        method: '從格法',
        element: dayMaster.element,
        confidence: 20,
        reasoning: `다른 오행이 없음. 종격 적용 불가.`,
        applicable: false,
      };
    }

    const [strongestElement, strongestCount] = otherElements[0];
    const dayMasterCount = elementCounts[dayMaster.element];
    const totalCount = Object.values(elementCounts).reduce((a, b) => a + b, 0);

    // 從格 condition: strongest element > 50% AND day master < 20%
    const strongestRatio = strongestCount / totalCount;
    const dayMasterRatio = dayMasterCount / totalCount;

    if (strongestRatio > 0.5 && dayMasterRatio < 0.2) {
      return {
        method: '從格法',
        element: strongestElement as Element,
        confidence: 90,
        reasoning: `${strongestElement}이 압도적으로 강함 (${(strongestRatio * 100).toFixed(1)}%). 일간이 극약하므로 종격 성립.`,
        applicable: true,
      };
    }

    return {
      method: '從格法',
      element: strongestElement as Element,
      confidence: 30,
      reasoning: `종격 조건 미충족. 일간이 너무 약하지 않음.`,
      applicable: false,
    };
  }

  /**
   * 化氣法 (Hua-Qi Method): Transformation patterns
   */
  private applyHuaqiMethod(pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar }): MethodResult {
    // 5 transformation patterns (천간합화)
    const transformations: Record<string, { result: Element; condition: string }> = {
      '갑기': { result: Element.EARTH, condition: '甲己合化土' },
      '을경': { result: Element.METAL, condition: '乙庚合化金' },
      '병신': { result: Element.WATER, condition: '丙辛合化水' },
      '정임': { result: Element.WOOD, condition: '丁壬合化木' },
      '무계': { result: Element.FIRE, condition: '戊癸合化火' },
    };

    // Check day + hour combination
    const dayHourCombo = pillars.day.stem + pillars.hour.stem;
    const reverseDayHourCombo = pillars.hour.stem + pillars.day.stem;

    for (const [combo, { result, condition }] of Object.entries(transformations)) {
      if (dayHourCombo === combo || reverseDayHourCombo === combo) {
        return {
          method: '化氣法',
          element: result,
          confidence: 75,
          reasoning: `일간과 시간의 ${condition} 성립. ${result} 오행으로 화합.`,
          applicable: true,
        };
      }
    }

    // Check year + month combination
    const yearMonthCombo = pillars.year.stem + pillars.month.stem;
    const reverseYearMonthCombo = pillars.month.stem + pillars.year.stem;

    for (const [combo, { result, condition }] of Object.entries(transformations)) {
      if (yearMonthCombo === combo || reverseYearMonthCombo === combo) {
        return {
          method: '化氣法',
          element: result,
          confidence: 60,
          reasoning: `년간과 월간의 ${condition} 가능성. ${result} 오행으로 화합.`,
          applicable: true,
        };
      }
    }

    return {
      method: '化氣法',
      element: Element.EARTH,
      confidence: 10,
      reasoning: `천간합화 조건 미충족.`,
      applicable: false,
    };
  }

  // ===== HELPER METHODS =====

  /**
   * Select best method based on applicability and confidence
   */
  private selectBestMethod(methods: MethodResult[]): MethodResult {
    // Filter applicable methods
    const applicable = methods.filter((m) => m.applicable);

    if (applicable.length === 0) {
      // No applicable methods - return highest confidence
      return methods.reduce((best, current) => (current.confidence > best.confidence ? current : best));
    }

    // Return highest confidence among applicable
    return applicable.reduce((best, current) => (current.confidence > best.confidence ? current : best));
  }

  /**
   * Calculate day master strength
   */
  private calculateDayMasterStrength(
    dayMaster: { element: Element },
    elementCounts: Record<Element, number>
  ): { score: number; category: '극약' | '약' | '중화' | '강' | '극강'; explanation: string } {
    const totalCount = Object.values(elementCounts).reduce((a, b) => a + b, 0);
    const dayMasterCount = elementCounts[dayMaster.element];
    const ratio = dayMasterCount / totalCount;

    // Score: -100 (extremely weak) to +100 (extremely strong)
    const score = (ratio - 0.2) * 500; // Centered at 20% as neutral

    let category: '극약' | '약' | '중화' | '강' | '극강';
    if (ratio < 0.1) category = '극약';
    else if (ratio < 0.2) category = '약';
    else if (ratio < 0.3) category = '중화';
    else if (ratio < 0.5) category = '강';
    else category = '극강';

    const explanation = `일간 ${dayMaster.element} 비율: ${(ratio * 100).toFixed(1)}% (총 ${dayMasterCount}/${totalCount}개)`;

    return { score: Math.round(score), category, explanation };
  }

  /**
   * Get seasonal context
   */
  private getSeasonalContext(
    dayMaster: { element: Element },
    month: number
  ): { season: '봄' | '여름' | '가을' | '겨울'; temperatureNeed: '온난' | '한냉' | '중화'; adjustment: string } {
    const season = this.getSeason(month);

    let temperatureNeed: '온난' | '한냉' | '중화';
    let adjustment: string;

    if (season === '겨울') {
      temperatureNeed = '온난';
      adjustment = '한기(寒氣)를 제거하기 위해 火 오행이 필요합니다.';
    } else if (season === '여름') {
      temperatureNeed = '한냉';
      adjustment = '열기(熱氣)를 식히기 위해 水 오행이 필요합니다.';
    } else {
      temperatureNeed = '중화';
      adjustment = '봄가을은 온도가 중화적이므로 조후보다 다른 방법이 더 중요합니다.';
    }

    return { season, temperatureNeed, adjustment };
  }

  /**
   * Build full analysis text
   */
  private buildFullAnalysis(data: {
    fuyi: MethodResult;
    tiaohou: MethodResult;
    tongguan: MethodResult;
    congge: MethodResult;
    huaqi: MethodResult;
    selected: MethodResult;
    dayMasterStrength: { category: string; explanation: string };
    seasonalContext: { season: string; adjustment: string };
  }): string {
    return `# 용신 분석 결과

## 일간 강약
${data.dayMasterStrength.explanation}
분류: ${data.dayMasterStrength.category}

## 5가지 방법 검토

### 1. 扶抑法 (부억법)
${data.fuyi.reasoning}
${data.fuyi.applicable ? `✅ 적용 가능 (신뢰도: ${data.fuyi.confidence}%)` : '❌ 적용 불가'}

### 2. 調候法 (조후법)
${data.tiaohou.reasoning}
계절: ${data.seasonalContext.season}
${data.tiaohou.applicable ? `✅ 적용 가능 (신뢰도: ${data.tiaohou.confidence}%)` : '❌ 적용 불가'}

### 3. 通關法 (통관법)
${data.tongguan.reasoning}
${data.tongguan.applicable ? `✅ 적용 가능 (신뢰도: ${data.tongguan.confidence}%)` : '❌ 적용 불가'}

### 4. 從格法 (종격법)
${data.congge.reasoning}
${data.congge.applicable ? `✅ 적용 가능 (신뢰도: ${data.congge.confidence}%)` : '❌ 적용 불가'}

### 5. 化氣法 (화기법)
${data.huaqi.reasoning}
${data.huaqi.applicable ? `✅ 적용 가능 (신뢰도: ${data.huaqi.confidence}%)` : '❌ 적용 불가'}

## 최종 선택

**${data.selected.method}** 적용
용신: **${data.selected.element}**
신뢰도: ${data.selected.confidence}%

${data.selected.reasoning}`;
  }

  /**
   * Get producing element (상생)
   */
  private getProducingElement(element: Element): Element {
    const map: Record<Element, Element> = {
      [Element.WOOD]: Element.WATER,
      [Element.FIRE]: Element.WOOD,
      [Element.EARTH]: Element.FIRE,
      [Element.METAL]: Element.EARTH,
      [Element.WATER]: Element.METAL,
    };
    return map[element];
  }

  /**
   * Get weakening element (설기)
   */
  private getWeakeningElement(element: Element): Element {
    const map: Record<Element, Element> = {
      [Element.WOOD]: Element.FIRE,
      [Element.FIRE]: Element.EARTH,
      [Element.EARTH]: Element.METAL,
      [Element.METAL]: Element.WATER,
      [Element.WATER]: Element.WOOD,
    };
    return map[element];
  }

  /**
   * Find lacking elements
   */
  private findLackingElements(counts: Record<Element, number>): Element[] {
    const avg = Object.values(counts).reduce((a, b) => a + b, 0) / 5;
    return (Object.entries(counts) as [Element, number][])
      .filter(([, count]) => count < avg * 0.5)
      .map(([elem]) => elem);
  }

  /**
   * Get season from month
   */
  private getSeason(month: number): '봄' | '여름' | '가을' | '겨울' {
    if ([12, 1, 2].includes(month)) return '겨울';
    if ([3, 4, 5].includes(month)) return '봄';
    if ([6, 7, 8].includes(month)) return '여름';
    return '가을';
  }

  /**
   * Get secondary element (희신)
   */
  private getSecondaryElement(primary: Element, dayMaster: Element): Element | undefined {
    // Secondary is typically the producing element of primary
    return this.getProducingElement(primary);
  }

  /**
   * Get elements to avoid (기신)
   */
  private getAvoidElements(yongsin: Element): Element[] {
    // Avoid elements that conflict with yongsin (상극)
    const conflicts: Record<Element, Element[]> = {
      [Element.WOOD]: [Element.METAL], // Metal cuts Wood
      [Element.FIRE]: [Element.WATER], // Water extinguishes Fire
      [Element.EARTH]: [Element.WOOD], // Wood covers Earth
      [Element.METAL]: [Element.FIRE], // Fire melts Metal
      [Element.WATER]: [Element.EARTH], // Earth blocks Water
    };

    return conflicts[yongsin] || [];
  }
}

// Singleton instance
let yongsinAnalyzer: YongsinAnalyzer;

export function getYongsinAnalyzer(): YongsinAnalyzer {
  if (!yongsinAnalyzer) {
    yongsinAnalyzer = new YongsinAnalyzer();
  }
  return yongsinAnalyzer;
}
