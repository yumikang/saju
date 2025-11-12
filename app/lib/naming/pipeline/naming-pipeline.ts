/**
 * NamingPipeline - 8-Step Korean Naming Service Architecture
 *
 * Orchestrates the complete naming process from Saju calculation to final recommendations.
 *
 * Architecture Pattern: Pipeline with Strategy + Dependency Injection
 * Performance Target: <10 seconds for full pipeline execution
 * Error Strategy: Graceful degradation with fallbacks at each step
 *
 * Pipeline Steps:
 * 1. Saju Calculation (생년월일시 → 사주팔자)
 * 2. Yongsin Analysis (5방법 + AI)
 * 3. Hanja Recommendation (용신 기반 필터링)
 * 4. Combination Generation (2자/3자 이름 조합)
 * 5. Validation (81수리/음양/음운)
 * 6. Scoring (종합 점수 계산)
 * 7. Filtering (최소 점수 이상)
 * 8. Ranking & Return (Top 10-20개)
 */

// ============================================================
// Feature Flags (안전 롤백용)
// ============================================================
export const FEATURES = {
  enableLinguisticScorerInLegacy: true,   // 언어적 자연스러움 패널티 (같은 음절 반복, 의미 중복)
  disableNumerologyInLegacy: true,        // 획수/81수리 영향 0% (데이터 부정확)
  stage3VerboseLog: true,                 // Stage 3 디버그 로그
};

import type { Element } from '@prisma/client';
import { SajuCalculator, type SajuResult } from '~/lib/saju/calculator';
import { YongsinAnalyzer, type CombinedYongsinResult } from '~/lib/saju/yongsin-analyzer';
import { YinYangValidator, type YinYangAnalysis } from '~/lib/naming/validators/yinyang-validator';
import { PhoneticMatcher, type PhoneticAnalysis } from '~/lib/naming/validators/phonetic-matcher';
import { calculateNameValueAlignment, type ParentValue } from '~/lib/naming/scorers/value-meaning-map';
import { checkCharacterSafety, calculateTabooDeduction } from '~/lib/naming/filters/taboo-rules';
import {
  calculateFourGrids,
  getDetailedFourGridsAnalysis,
  type FourGrids,
  type NumerologyEntry,
} from '~/lib/naming/utils/numerology-81';
import type {
  HanjaCharacter,
  NameCandidate,
  NamingRequest,
  NamingResponse,
  ScoringContext,
} from '~/lib/naming/types';
import { genderBoost } from '~/lib/naming/utils/gender-boost';
import { tieBreakSort } from '~/lib/naming/utils/tie-breaker';

// ============================================================
// Core Interfaces
// ============================================================

/**
 * Birth information for Saju calculation
 */
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number; // 0-23
  minute: number;
  isLunar: boolean;
  gender: 'M' | 'F';
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  // Performance
  maxCombinations: number; // Max combinations to generate (default: 10000)
  maxCandidates: number; // Max final candidates (default: 20)
  batchSize: number; // Batch processing size (default: 100)
  timeout: number; // Pipeline timeout in ms (default: 10000)

  // Scoring weights
  weights: {
    yongsin: number; // 35%
    yinyang: number; // 25%
    pronunciation: number; // 20%
    meaning: number; // 10%
    numerology: number; // 5%
    taboo: number; // 5%
  };

  // Filtering
  minScore: number; // Minimum acceptable score (default: 60)
  requireYongsinMatch: boolean; // Must match Yongsin element (default: true)
  avoidInauspicious: boolean; // Avoid 흉수 (default: true)

  // User preferences
  parentValues?: string[]; // Parent values for value alignment scoring

  // Caching
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
}

/**
 * Default pipeline configuration
 * OPTIMIZED: Reduced maxCombinations for performance (10000 → 1500)
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  maxCombinations: 1500,  // PERFORMANCE: Reduced from 10000 to 1500
  maxCandidates: 20,
  batchSize: 50,          // PERFORMANCE: Reduced from 100 to 50 for faster batching
  timeout: 10000,
  weights: {
    // 🎯 가중치 합 = 90% (금기는 별도 감점 처리)
    yongsin: 0.45,     // 오행 매칭 최우선
    yinyang: 0.15,     // 음양 균형
    pronunciation: 0.15, // 발음 자연스러움
    meaning: 0.15,     // 의미 + 부모 가치
    numerology: FEATURES.disableNumerologyInLegacy ? 0 : 0.03,  // 획수 (비활성화)
    taboo: 0,          // 금기는 가중합산 후 직접 감점 (가중치 사용 안 함)
  },
  minScore: 80,      // 🎯 최소 80점 이상만 추천 (우수한 이름만)
  requireYongsinMatch: true,
  avoidInauspicious: true,
  cacheEnabled: true,
  cacheTTL: 3600,
};

/**
 * Pipeline step result with telemetry
 */
interface StepResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number; // milliseconds
  stepName: string;
}

/**
 * Pipeline context - flows through all steps
 */
interface PipelineContext {
  // Input
  birthInfo: BirthInfo;
  lastName: string;
  lastNameStrokes: number;
  config: PipelineConfig;

  // Step 1: Saju
  sajuResult?: SajuResult;

  // Step 2: Yongsin
  yongsinResult?: CombinedYongsinResult;

  // Step 3: Hanja Pool
  hanjaPool?: HanjaCharacter[];

  // Step 4: Combinations
  combinations?: NameCombination[];

  // Step 5-7: Validated & Scored
  candidates?: ScoredNameCandidate[];

  // Telemetry
  startTime: number;
  stepDurations: Record<string, number>;
}

/**
 * Name combination before scoring
 */
interface NameCombination {
  firstName: string;
  firstChar: HanjaCharacter;
  secondChar: HanjaCharacter;
}

/**
 * Scored name candidate with detailed analysis
 */
export interface ScoredNameCandidate {
  // Core info
  firstName: string;
  fullName: string;
  hanja: string;

  // Characters
  firstChar: HanjaCharacter;
  secondChar: HanjaCharacter;

  // Scores
  totalScore: number;
  scores: {
    yongsin: number;
    yinyang: number;
    pronunciation: number;
    meaning: number;
    numerology: number;
    taboo: number;
  };

  // Detailed analysis
  analysis: {
    yongsinAnalysis: YongsinMatchAnalysis;
    yinyangAnalysis: YinYangAnalysis;
    phoneticAnalysis: PhoneticAnalysis;
    numerologyAnalysis: NumerologyAnalysis;
    tabooAnalysis: TabooAnalysis;
  };

  // Rankings
  rank?: number;

  // Tie-breaker fields
  nameFrequency?: number | null;
  usageFrequency?: number | null;
  strokeCount?: number | null;
  stableId?: string;
}

/**
 * Yongsin match analysis
 */
interface YongsinMatchAnalysis {
  primaryMatch: boolean;
  secondaryMatch: boolean;
  matchScore: number;
  explanation: string;
}

/**
 * Numerology analysis result
 */
interface NumerologyAnalysis {
  grids: FourGrids;
  scores: {
    원격: number;
    형격: number;
    이격: number;
    정격: number;
  };
  overallScore: number;
  hasInauspicious: boolean;
  explanation: string;
}

/**
 * Taboo character analysis
 */
interface TabooAnalysis {
  hasTaboo: boolean;
  tabooReasons: string[];
  deductionPoints: number;
}

// ============================================================
// Main Pipeline Class
// ============================================================

/**
 * NamingPipeline - Main orchestrator
 *
 * Design Principles:
 * - Single Responsibility: Each step handles one concern
 * - Dependency Injection: All services injected via constructor
 * - Error Handling: Each step returns Result type with fallback
 * - Performance: Batch processing and early filtering
 * - Observability: Detailed telemetry at each step
 */
export class NamingPipeline {
  constructor(
    private sajuCalculator: SajuCalculator,
    private yongsinAnalyzer: YongsinAnalyzer,
    private yinyangValidator: YinYangValidator,
    private phoneticMatcher: PhoneticMatcher,
    private hanjaService: HanjaService, // Abstract interface
    private cache?: CacheService // Optional caching
  ) {}

  /**
   * Execute full 8-step pipeline
   */
  async execute(
    birthInfo: BirthInfo,
    lastName: string,
    lastNameStrokes: number,
    config: Partial<PipelineConfig> = {}
  ): Promise<NamingResponse> {
    const startTime = Date.now();
    const finalConfig = { ...DEFAULT_PIPELINE_CONFIG, ...config };

    // Initialize context
    const context: PipelineContext = {
      birthInfo,
      lastName,
      lastNameStrokes,
      config: finalConfig,
      startTime,
      stepDurations: {},
    };

    try {
      // Check cache first
      if (finalConfig.cacheEnabled && this.cache) {
        const cached = await this.checkCache(context);
        if (cached) return cached;
      }

      // Execute pipeline steps sequentially
      await this.step1_calculateSaju(context);
      await this.step2_analyzeYongsin(context);
      await this.step3_recommendHanja(context);
      await this.step4_generateCombinations(context);
      await this.step5_validateCandidates(context);
      await this.step6_scoreCandidates(context);
      await this.step7_filterCandidates(context);
      const response = await this.step8_rankAndReturn(context);

      // Cache result
      if (finalConfig.cacheEnabled && this.cache) {
        await this.saveCache(context, response);
      }

      return response;
    } catch (error) {
      // Graceful degradation: return partial results if available
      return this.handlePipelineError(context, error as Error);
    }
  }

  // ===== STEP 1: SAJU CALCULATION =====

  /**
   * Step 1: Calculate Saju from birth date/time
   *
   * Performance: ~50-100ms (includes DB lookup for calendar data)
   * Fallback: None - this is critical step
   */
  private async step1_calculateSaju(context: PipelineContext): Promise<void> {
    const stepStart = Date.now();
    const stepName = 'step1_saju';

    try {
      const birthDate = new Date(
        context.birthInfo.year,
        context.birthInfo.month - 1,
        context.birthInfo.day
      );

      const birthTime = `${String(context.birthInfo.hour).padStart(2, '0')}:${String(context.birthInfo.minute).padStart(2, '0')}`;

      context.sajuResult = await this.sajuCalculator.calculate(
        birthDate,
        birthTime,
        context.birthInfo.isLunar
      );

      context.stepDurations[stepName] = Date.now() - stepStart;
    } catch (error) {
      throw new PipelineError(stepName, 'Failed to calculate Saju', error as Error);
    }
  }

  // ===== STEP 2: YONGSIN ANALYSIS =====

  /**
   * Step 2: Analyze Yongsin using 5 traditional methods + AI
   *
   * Performance: ~500-2000ms (AI call if available)
   * Fallback: Traditional methods only if AI fails
   */
  private async step2_analyzeYongsin(context: PipelineContext): Promise<void> {
    const stepStart = Date.now();
    const stepName = 'step2_yongsin';

    if (!context.sajuResult) {
      throw new PipelineError(stepName, 'Saju result not available');
    }

    try {
      context.yongsinResult = await this.yongsinAnalyzer.analyze(context.sajuResult, {
        year: context.birthInfo.year,
        month: context.birthInfo.month,
        day: context.birthInfo.day,
        hour: context.birthInfo.hour,
        minute: context.birthInfo.minute,
        isLunar: context.birthInfo.isLunar,
        gender: context.birthInfo.gender,
      });

      context.stepDurations[stepName] = Date.now() - stepStart;
    } catch (error) {
      throw new PipelineError(stepName, 'Failed to analyze Yongsin', error as Error);
    }
  }

  // ===== STEP 3: HANJA RECOMMENDATION =====

  /**
   * Step 3: Filter Hanja pool based on Yongsin
   *
   * Performance: ~100-200ms (DB query with filtering)
   * Fallback: Expand to secondary Yongsin if primary pool too small
   */
  private async step3_recommendHanja(context: PipelineContext): Promise<void> {
    const stepStart = Date.now();
    const stepName = 'step3_hanja';

    if (!context.yongsinResult) {
      throw new PipelineError(stepName, 'Yongsin result not available');
    }

    try {
      const primaryElement = context.yongsinResult.primary;
      const secondaryElement = context.yongsinResult.secondary;

      // Query Hanja with primary element (OPTIMIZED: limit pool size to reduce combinations)
      let hanjaPool = await this.hanjaService.findByElement(primaryElement, {
        minStrokes: 3,
        maxStrokes: 20,
        isGoodForNaming: true,
        gender: context.birthInfo.gender,
      });

      // Fallback: If pool too small, add secondary element
      if (hanjaPool.length < 30 && secondaryElement) {
        const secondaryPool = await this.hanjaService.findByElement(secondaryElement, {
          minStrokes: 3,
          maxStrokes: 20,
          isGoodForNaming: true,
          gender: context.birthInfo.gender,
        });
        hanjaPool = [...hanjaPool, ...secondaryPool];
      }

      // Deduplicate and LIMIT to top 40 characters (40 × 40 = 1,600 combinations max)
      const deduped = Array.from(new Map(hanjaPool.map((h) => [h.character, h])).values());
      context.hanjaPool = deduped.slice(0, 40);  // PERFORMANCE: Limit pool size

      context.stepDurations[stepName] = Date.now() - stepStart;
    } catch (error) {
      throw new PipelineError(stepName, 'Failed to recommend Hanja', error as Error);
    }
  }

  // ===== STEP 4: COMBINATION GENERATION =====

  /**
   * Step 4: Generate all valid 2-character name combinations
   *
   * Performance: ~200-500ms (depends on pool size)
   * Strategy: Early filtering to reduce combinations
   */
  private async step4_generateCombinations(context: PipelineContext): Promise<void> {
    const stepStart = Date.now();
    const stepName = 'step4_combinations';

    if (!context.hanjaPool || context.hanjaPool.length === 0) {
      throw new PipelineError(stepName, 'Hanja pool is empty');
    }

    try {
      const combinations: NameCombination[] = [];
      const pool = context.hanjaPool;
      const maxCombinations = Math.min(context.config.maxCombinations, 2000); // HARD LIMIT: 2000 max

      // Generate all pairs (with early exit optimization)
      outerLoop: for (let i = 0; i < pool.length; i++) {
        for (let j = 0; j < pool.length; j++) {
          // Early exit if we have enough combinations
          if (combinations.length >= maxCombinations) break outerLoop;

          // Skip if same character (unless it's a valid double name)
          if (i === j && !this.isValidDoubleCharacter(pool[i])) continue;

          combinations.push({
            firstName: pool[i].koreanReading + pool[j].koreanReading,
            firstChar: pool[i],
            secondChar: pool[j],
          });
        }
      }

      console.log(`[Pipeline] Generated ${combinations.length} combinations from ${pool.length} characters`);
      context.combinations = combinations;
      context.stepDurations[stepName] = Date.now() - stepStart;
    } catch (error) {
      throw new PipelineError(stepName, 'Failed to generate combinations', error as Error);
    }
  }

  // ===== STEP 5: VALIDATION =====

  /**
   * Step 5: Validate candidates (81수리, 음양, 음운)
   *
   * Performance: ~1-3s (batch processing)
   * Strategy: Parallel validation of multiple aspects
   */
  private async step5_validateCandidates(context: PipelineContext): Promise<void> {
    const stepStart = Date.now();
    const stepName = 'step5_validation';

    if (!context.combinations || context.combinations.length === 0) {
      throw new PipelineError(stepName, 'No combinations to validate');
    }

    try {
      // Process in batches for performance
      const candidates: ScoredNameCandidate[] = [];
      const batchSize = context.config.batchSize;

      for (let i = 0; i < context.combinations.length; i += batchSize) {
        const batch = context.combinations.slice(i, i + batchSize);
        const batchCandidates = await this.processBatch(batch, context);
        candidates.push(...batchCandidates);
      }

      context.candidates = candidates;
      context.stepDurations[stepName] = Date.now() - stepStart;
    } catch (error) {
      throw new PipelineError(stepName, 'Failed to validate candidates', error as Error);
    }
  }

  /**
   * Process a batch of combinations in parallel
   */
  private async processBatch(
    batch: NameCombination[],
    context: PipelineContext
  ): Promise<ScoredNameCandidate[]> {
    const candidates: ScoredNameCandidate[] = [];

    for (const combo of batch) {
      try {
        const candidate = await this.validateAndScoreSingle(combo, context);
        if (candidate.totalScore >= context.config.minScore) {
          candidates.push(candidate);
        }
      } catch (error) {
        // Skip invalid candidates
        continue;
      }
    }

    return candidates;
  }

  /**
   * Validate and score a single combination
   */
  private async validateAndScoreSingle(
    combo: NameCombination,
    context: PipelineContext
  ): Promise<ScoredNameCandidate> {
    const fullName = context.lastName + combo.firstName;
    const hanja = combo.firstChar.character + combo.secondChar.character;

    // 1. Numerology (81수리)
    const numerologyAnalysis = this.analyzeNumerology(
      context.lastNameStrokes,
      combo.firstChar.strokes,
      combo.secondChar.strokes
    );

    // 2. YinYang (음양)
    const yinyangAnalysis = this.yinyangValidator.analyzeYinYang(
      context.lastName,
      combo.firstName,
      context.lastNameStrokes,
      [combo.firstChar.strokes, combo.secondChar.strokes]
    );

    // 3. Phonetics (음운)
    const phoneticAnalysis = this.phoneticMatcher.analyzePhonetics(combo.firstName);

    // 4. Yongsin match
    const yongsinAnalysis = this.analyzeYongsinMatch(
      [combo.firstChar, combo.secondChar],
      context.yongsinResult!
    );

    // 5. Taboo check
    const tabooAnalysis = this.checkTaboo([combo.firstChar, combo.secondChar]);

    // 🎯 올바른 점수 계산 순서: 가중합산 → 감점 → 보너스 → 클램프

    // 1) 개별 점수 (taboo는 제외, 나중에 감점으로 적용)
    const scores = {
      yongsin: yongsinAnalysis.matchScore,
      yinyang: yinyangAnalysis.balanceScore,
      pronunciation: phoneticAnalysis.overallScore,
      meaning: this.calculateMeaningScore([combo.firstChar, combo.secondChar], context),
      numerology: numerologyAnalysis.overallScore,
      taboo: 100 - tabooAnalysis.deductionPoints, // 표시용 (가중합산에는 미포함)
    };

    // 2) 가중합산 (taboo 제외, 가중치 합 = 90%)
    // 용신 45% + 음양 15% + 발음 15% + 의미 15% = 90%
    let baseScore =
      scores.yongsin * 0.45 +
      scores.yinyang * 0.15 +
      scores.pronunciation * 0.15 +
      scores.meaning * 0.15;

    // 3) 언어적 자연스러움 패널티 (같은 음절 반복, 의미 중복)
    if (FEATURES.enableLinguisticScorerInLegacy) {
      const linguisticPenaltyScore = this.linguisticPenalty(
        combo.firstChar,
        combo.secondChar,
        context.birthInfo.gender
      );
      baseScore += linguisticPenaltyScore;

      if (FEATURES.stage3VerboseLog && linguisticPenaltyScore < 0) {
        console.log(
          `[LinguisticScorer] ${combo.firstName} (${combo.firstChar.character}${combo.secondChar.character}): ` +
          `패널티 ${linguisticPenaltyScore.toFixed(1)}점`
        );
      }
    }

    // 4) 성별 보정
    const hangulGenderBoost = genderBoost(combo.firstName, context.birthInfo.gender);
    baseScore += hangulGenderBoost;

    // 5) 금기 감점 (가중합산 후 직접 차감)
    const tabooDeduction = tabooAnalysis.deductionPoints;
    baseScore -= tabooDeduction;

    // 6) 완벽한 이름 보너스 (+10점, 3개 중 2개 충족)
    let bonusScore = 0;

    // 조건 1: 용신 한자가 실제로 들어갔는가? (주 용신 OR 보조 용신)
    const primaryElement = context.yongsinResult?.primary;
    const secondaryElement = context.yongsinResult?.secondary;
    const hasPrimaryChar = [combo.firstChar, combo.secondChar].some(c => c.element === primaryElement);
    const hasSecondaryChar = [combo.firstChar, combo.secondChar].some(c => c.element === secondaryElement);
    const hasYongsinChar = hasPrimaryChar || hasSecondaryChar;

    // 조건 2: 음양 균형이 우수한가?
    const hasGoodYinYang = yinyangAnalysis.balanceScore >= 85;

    // 조건 3: 부모 가치 한자가 들어갔는가?
    const parentValues = (context.config.parentValues || []) as ParentValue[];
    let hasParentValueChar = false;
    if (parentValues.length > 0) {
      const alignmentScore = calculateNameValueAlignment(
        [combo.firstChar, combo.secondChar].map(char => ({
          character: char.character,
          meaning: char.meaning
        })),
        parentValues
      );
      hasParentValueChar = alignmentScore >= 70; // 기준 완화: 80 → 70
    }

    // 3개 중 2개 이상 충족 시 보너스
    const bonusConditions = [hasYongsinChar, hasGoodYinYang, hasParentValueChar].filter(Boolean).length;
    if (bonusConditions >= 2) {
      bonusScore = 10;
      if (FEATURES.stage3VerboseLog) {
        console.log(
          `[PerfectBonus] ${combo.firstName} (${combo.firstChar.character}${combo.secondChar.character}): ` +
          `+10점 보너스 (용신:${hasYongsinChar}, 음양:${hasGoodYinYang}, 부모:${hasParentValueChar})`
        );
      }
    }

    // 7) 최종 점수 = 가중합 + 보너스, 클램프 [0, 100]
    let rawScore = baseScore + bonusScore;
    let finalTotalScore = Math.max(0, Math.min(100, rawScore));

    // 8) 소수점 반올림
    finalTotalScore = Math.round(finalTotalScore);

    // 🔍 DEBUG: 상세 점수 로그
    if (FEATURES.stage3VerboseLog) {
      console.log(
        `[ScoreDebug] ${combo.firstName} (${combo.firstChar.character}${combo.secondChar.character}):\n` +
        `  용신: ${scores.yongsin.toFixed(1)} (×0.45 = ${(scores.yongsin * 0.45).toFixed(1)})\n` +
        `  음양: ${scores.yinyang.toFixed(1)} (×0.15 = ${(scores.yinyang * 0.15).toFixed(1)})\n` +
        `  발음: ${scores.pronunciation.toFixed(1)} (×0.15 = ${(scores.pronunciation * 0.15).toFixed(1)})\n` +
        `  의미: ${scores.meaning.toFixed(1)} (×0.15 = ${(scores.meaning * 0.15).toFixed(1)})\n` +
        `  성별보정: ${hangulGenderBoost}\n` +
        `  금기감점: -${tabooDeduction}\n` +
        `  보너스: +${bonusScore}\n` +
        `  → 최종: ${finalTotalScore}점`
      );
    }

    // 🎯 Tie-breaker 필드 추가
    const strokeCount = combo.firstChar.strokes + combo.secondChar.strokes;
    const stableId = `${combo.firstChar.character}${combo.secondChar.character}`;

    return {
      firstName: combo.firstName,
      fullName,
      hanja,
      firstChar: combo.firstChar,
      secondChar: combo.secondChar,
      totalScore: finalTotalScore,
      scores,
      analysis: {
        yongsinAnalysis,
        yinyangAnalysis,
        phoneticAnalysis,
        numerologyAnalysis,
        tabooAnalysis,
      },
      // Tie-breaker fields
      nameFrequency: null, // TODO: Add name frequency data
      usageFrequency: null, // TODO: Add usage frequency data
      strokeCount,
      stableId,
    };
  }

  // ===== STEP 6: SCORING =====

  /**
   * Step 6: Calculate comprehensive scores
   *
   * Already done in step5 for efficiency
   */
  private async step6_scoreCandidates(context: PipelineContext): Promise<void> {
    const stepStart = Date.now();
    context.stepDurations['step6_scoring'] = Date.now() - stepStart;
    // Scoring already done in step5 for efficiency
  }

  // ===== STEP 7: FILTERING =====

  /**
   * Step 7: Filter candidates by minimum score and criteria
   */
  private async step7_filterCandidates(context: PipelineContext): Promise<void> {
    const stepStart = Date.now();
    const stepName = 'step7_filtering';

    if (!context.candidates) {
      throw new PipelineError(stepName, 'No candidates to filter');
    }

    try {
      let filtered = context.candidates.filter(
        (c) => c.totalScore >= context.config.minScore
      );

      // Additional filters
      if (context.config.requireYongsinMatch) {
        filtered = filtered.filter((c) => c.analysis.yongsinAnalysis.primaryMatch);
      }

      if (context.config.avoidInauspicious) {
        filtered = filtered.filter((c) => !c.analysis.numerologyAnalysis.hasInauspicious);
      }

      context.candidates = filtered;
      context.stepDurations[stepName] = Date.now() - stepStart;
    } catch (error) {
      throw new PipelineError(stepName, 'Failed to filter candidates', error as Error);
    }
  }

  // ===== STEP 8: RANKING & RETURN =====

  /**
   * Step 8: Sort by score and return top N
   */
  private async step8_rankAndReturn(context: PipelineContext): Promise<NamingResponse> {
    const stepStart = Date.now();
    const stepName = 'step8_ranking';

    if (!context.candidates) {
      throw new PipelineError(stepName, 'No candidates to rank');
    }

    try {
      // 🎯 Tie-breaker 정렬 적용 (totalScore → nameFreq → usageFreq → strokes → id)
      const sorted = tieBreakSort(context.candidates);

      // Take top N
      const topCandidates = sorted.slice(0, context.config.maxCandidates);

      // Assign ranks
      topCandidates.forEach((c, i) => {
        c.rank = i + 1;
      });

      context.stepDurations[stepName] = Date.now() - stepStart;

      const totalDuration = Date.now() - context.startTime;

      return {
        candidates: topCandidates.map(this.mapToNameCandidate),
        metadata: {
          totalGenerated: context.combinations?.length || 0,
          totalScored: context.candidates.length,
          executionTime: totalDuration,
          timestamp: new Date().toISOString(),
        },
        saju: {
          lackingElements: context.sajuResult!.lackingElements,
          favorableElements: context.sajuResult!.favorableElements,
          elementCounts: context.sajuResult!.elementCounts,
        },
      };
    } catch (error) {
      throw new PipelineError(stepName, 'Failed to rank candidates', error as Error);
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Calculate meaning similarity using Jaccard similarity
   *
   * @returns 0.0 (완전히 다름) ~ 1.0 (동일)
   */
  private meaningSimilarity(meaning1: string, meaning2: string): number {
    // Tokenize: 한글/영문/숫자만 추출하여 공백 기준 분할
    const tokenize = (s: string): Set<string> => {
      const cleaned = s.replace(/[^\p{L}\p{N}\s]/gu, '');
      const tokens = cleaned.split(/\s+/).filter(Boolean);
      return new Set(tokens);
    };

    const tokensA = tokenize(meaning1);
    const tokensB = tokenize(meaning2);

    // Jaccard similarity: |A ∩ B| / |A ∪ B|
    const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calculate linguistic naturalness penalty
   *
   * 패널티 항목:
   * 1. 같은 음절 반복 (서서, 준준) → -50점
   * 2. 의미 매우 유사 (similarity ≥ 0.7) → -20점
   * 3. 의미 부분 유사 (similarity ≥ 0.4) → -10점
   * 4. 음운 다양성 부족 (자음+모음 동일) → -6점
   */
  private linguisticPenalty(
    firstChar: HanjaCharacter,
    secondChar: HanjaCharacter,
    _gender?: 'M' | 'F' | null
  ): number {
    let penalty = 0;

    // 1. 같은 음절 반복 감지
    const syllable1 = firstChar.koreanReading;
    const syllable2 = secondChar.koreanReading;

    if (syllable1 === syllable2) {
      penalty -= 50;
      if (FEATURES.stage3VerboseLog) {
        console.log(`[LinguisticPenalty] ⚠️ 같은 음절 반복: ${syllable1} === ${syllable2} → -50점`);
      }
    }

    // 2. 의미 유사도 패널티
    const meaning1 = firstChar.meaning || '';
    const meaning2 = secondChar.meaning || '';

    if (meaning1 && meaning2) {
      const similarity = this.meaningSimilarity(meaning1, meaning2);

      if (similarity >= 0.7) {
        penalty -= 20;
        if (FEATURES.stage3VerboseLog) {
          console.log(`[LinguisticPenalty] 의미 매우 유사 (${similarity.toFixed(2)}): ${meaning1} / ${meaning2} → -20점`);
        }
      } else if (similarity >= 0.4) {
        penalty -= 10;
        if (FEATURES.stage3VerboseLog) {
          console.log(`[LinguisticPenalty] 의미 부분 유사 (${similarity.toFixed(2)}): ${meaning1} / ${meaning2} → -10점`);
        }
      }
    }

    // 3. 음운 다양성 (선택 사항 - 약한 패널티)
    if (syllable1 && syllable2 && syllable1.length > 0 && syllable2.length > 0) {
      // 초성(첫 글자)과 종성(마지막 글자) 비교
      const sameOnset = syllable1[0] === syllable2[0];
      const sameVowel = syllable1[syllable1.length - 1] === syllable2[syllable2.length - 1];

      if (sameOnset && sameVowel) {
        penalty -= 6;
        if (FEATURES.stage3VerboseLog) {
          console.log(`[LinguisticPenalty] 음운 다양성 부족: ${syllable1}/${syllable2} → -6점`);
        }
      }
    }

    return penalty;
  }

  /**
   * Analyze numerology (81수리)
   */
  private analyzeNumerology(
    lastNameStrokes: number,
    firstCharStrokes: number,
    secondCharStrokes: number
  ): NumerologyAnalysis {
    const grids = calculateFourGrids(lastNameStrokes, firstCharStrokes, secondCharStrokes);
    const detailed = getDetailedFourGridsAnalysis(grids);

    const scores = {
      원격: detailed.원격.score,
      형격: detailed.형격.score,
      이격: detailed.이격.score,
      정격: detailed.정격.score,
    };

    const overallScore = (scores.원격 + scores.형격 + scores.이격 + scores.정격) / 4;

    const hasInauspicious =
      detailed.원격.fortune === '흉' ||
      detailed.원격.fortune === '대흉' ||
      detailed.형격.fortune === '흉' ||
      detailed.형격.fortune === '대흉' ||
      detailed.이격.fortune === '흉' ||
      detailed.이격.fortune === '대흉' ||
      detailed.정격.fortune === '흉' ||
      detailed.정격.fortune === '대흉';

    return {
      grids,
      scores,
      overallScore,
      hasInauspicious,
      explanation: `원격(${detailed.원격.fortune}), 형격(${detailed.형격.fortune}), 이격(${detailed.이격.fortune}), 정격(${detailed.정격.fortune})`,
    };
  }

  /**
   * Analyze Yongsin element match
   */
  private analyzeYongsinMatch(
    characters: HanjaCharacter[],
    yongsinResult: CombinedYongsinResult
  ): YongsinMatchAnalysis {
    const primaryElement = yongsinResult.primary;
    const secondaryElement = yongsinResult.secondary;

    const primaryMatches = characters.filter((c) => c.element === primaryElement).length;
    const secondaryMatches = characters.filter((c) => c.element === secondaryElement).length;

    const primaryMatch = primaryMatches > 0;
    const secondaryMatch = secondaryMatches > 0;

    // 🎯 용신 매칭 점수 극단적 차별화 (명확한 구분)
    let matchScore = 0;
    if (primaryMatches === 2) matchScore = 100;           // 완벽: 주 용신 2개
    else if (primaryMatches === 1 && secondaryMatches === 1) matchScore = 100; // 완벽: 주 1개 + 보조 1개
    else if (primaryMatches === 1) matchScore = 60;       // 부분: 주 용신 1개만
    else if (secondaryMatches === 2) matchScore = 60;     // 부분: 보조 용신 2개
    else if (secondaryMatches === 1) matchScore = 60;     // 부분: 보조 용신 1개
    else matchScore = 20;                                  // 없음: 용신 매칭 없음

    const explanation = `용신 ${primaryElement} ${primaryMatches}개, 희신 ${secondaryElement || 'N/A'} ${secondaryMatches}개`;

    return {
      primaryMatch,
      secondaryMatch,
      matchScore,
      explanation,
    };
  }

  /**
   * Check for taboo characters
   *
   * 작명에 부적합한 의미를 가진 한자를 감지하고 감점 처리
   */
  /**
   * 중앙화된 TABOO_RULES 시스템 사용
   */
  private checkTaboo(characters: HanjaCharacter[]): TabooAnalysis {
    const tabooReasons: string[] = [];
    let totalDeduction = 0;

    for (const char of characters) {
      // 중앙화된 taboo-rules.ts 사용
      const safetyCheck = checkCharacterSafety(char.character, char.meaning);

      if (!safetyCheck.isSafe) {
        // 각 이슈별로 이유 추가
        for (const issue of safetyCheck.issues) {
          const reason = issue.matchedCharacter
            ? `${char.character}: ${issue.reason}`
            : `${char.character}: ${issue.category} 관련 (${issue.matchedKeyword})`;
          tabooReasons.push(reason);
        }

        // 감점 계산
        const deduction = calculateTabooDeduction(safetyCheck);
        totalDeduction += deduction;
      }

      // 추가: DB에서 명시적으로 거부된 한자 체크
      if (char.review === 'rejected' || char.isGoodForNaming === false) {
        if (!tabooReasons.some(r => r.includes(char.character))) {
          tabooReasons.push(`${char.character}: 작명 부적합 (DB 검증)`);
          totalDeduction += 100; // 명시적 거부는 완전 배제
        }
      }
    }

    return {
      hasTaboo: tabooReasons.length > 0,
      tabooReasons,
      deductionPoints: Math.min(100, totalDeduction),
    };
  }

  /**
   * Calculate meaning harmony score with parent value alignment
   */
  private calculateMeaningScore(characters: HanjaCharacter[], context: PipelineContext): number {
    // Base score: average of character quality (70% weight)
    const totalMeaningQuality = characters.reduce((sum, char) => {
      // Heuristic: longer, more detailed meanings are better
      const meaningLength = char.meaning.length;
      const qualityScore = Math.min(100, meaningLength * 10);
      return sum + qualityScore;
    }, 0);
    const baseScore = (totalMeaningQuality / characters.length) * 0.7;

    // Parent value alignment score (30% weight) - KEY DIFFERENTIATOR
    const parentValues = (context.config.parentValues || []) as ParentValue[];

    console.log(`[MeaningScore] Parent Values:`, parentValues.length > 0 ? parentValues : 'NONE');

    if (parentValues.length > 0) {
      const alignmentScore = calculateNameValueAlignment(
        characters.map(char => ({
          character: char.character,
          meaning: char.meaning
        })),
        parentValues
      );
      console.log(`[MeaningScore] ${characters[0].character}${characters[1].character}: baseScore=${baseScore.toFixed(1)}, alignmentScore=${alignmentScore.toFixed(1)}, final=${(baseScore + alignmentScore * 0.3).toFixed(1)}`);
      return baseScore + (alignmentScore * 0.3);
    }

    console.log(`[MeaningScore] ${characters[0].character}${characters[1].character}: baseScore=${baseScore.toFixed(1)}, NO PARENT VALUES, final=${(baseScore + 15).toFixed(1)}`);
    // No parent values = neutral 15 point bonus (50 * 0.3)
    return baseScore + 15;
  }

  /**
   * Check if character is valid for double names (e.g., 민민)
   */
  private isValidDoubleCharacter(char: HanjaCharacter): boolean {
    // Some characters are commonly used doubled (e.g., 빛빛)
    // For MVP: allow all, refine later
    return false; // Conservative: don't allow doubles by default
  }

  /**
   * Map ScoredNameCandidate to NameCandidate (for API response)
   */
  private mapToNameCandidate(scored: ScoredNameCandidate): NameCandidate {
    return {
      firstName: [scored.firstChar.koreanReading, scored.secondChar.koreanReading],
      characters: [scored.firstChar, scored.secondChar],
      score: scored.totalScore,
      breakdown: {
        element: scored.scores.yongsin,
        yinyang: scored.scores.yinyang,
        numerology: scored.scores.numerology,
        meaning: scored.scores.meaning,
      },
      analysis: {
        elementHarmony: {
          lacksComplement: !scored.analysis.yongsinAnalysis.primaryMatch,
          hasProducingCycle: scored.analysis.yongsinAnalysis.secondaryMatch,
          hasConflictingCycle: false, // TODO: implement
          strengthensFavorable: scored.analysis.yongsinAnalysis.primaryMatch,
          details: [scored.analysis.yongsinAnalysis.explanation],
        },
        yinyangBalance: {
          pattern: scored.analysis.yinyangAnalysis.pattern.join('-'),
          isBalanced: scored.analysis.yinyangAnalysis.balanceScore >= 75,
          distribution: {
            yang: scored.analysis.yinyangAnalysis.yangCount,
            yin: scored.analysis.yinyangAnalysis.yinCount,
          },
          details: [scored.analysis.yinyangAnalysis.explanation],
        },
        numerologyGrids: scored.analysis.numerologyAnalysis.grids as any, // Type compatibility
        meaningCompatibility: {
          theme: 'harmony', // TODO: implement theme detection
          isHarmonious: true,
          quality: 'good',
          details: [],
        },
        reasoning: [
          scored.analysis.yongsinAnalysis.explanation,
          scored.analysis.yinyangAnalysis.explanation,
          scored.analysis.numerologyAnalysis.explanation,
        ],
      },
    };
  }

  /**
   * Check cache for existing result
   */
  private async checkCache(context: PipelineContext): Promise<NamingResponse | null> {
    if (!this.cache) return null;

    const cacheKey = this.generateCacheKey(context);
    return await this.cache.get<NamingResponse>(cacheKey);
  }

  /**
   * Save result to cache
   */
  private async saveCache(context: PipelineContext, response: NamingResponse): Promise<void> {
    if (!this.cache) return;

    const cacheKey = this.generateCacheKey(context);
    await this.cache.set(cacheKey, response, context.config.cacheTTL);
  }

  /**
   * Generate cache key from birth info
   */
  private generateCacheKey(context: PipelineContext): string {
    const { birthInfo, lastName, lastNameStrokes } = context;
    return `naming:${birthInfo.year}${birthInfo.month}${birthInfo.day}${birthInfo.hour}${birthInfo.minute}${birthInfo.isLunar ? 'L' : 'S'}:${lastName}:${lastNameStrokes}`;
  }

  /**
   * Handle pipeline errors with graceful degradation
   */
  private handlePipelineError(context: PipelineContext, error: Error): NamingResponse {
    console.error('Pipeline error:', error);

    // Return partial results if available
    const candidates = context.candidates || [];
    const topCandidates = candidates
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, Math.min(10, candidates.length))
      .map(this.mapToNameCandidate);

    return {
      candidates: topCandidates,
      metadata: {
        totalGenerated: context.combinations?.length || 0,
        totalScored: candidates.length,
        executionTime: Date.now() - context.startTime,
        timestamp: new Date().toISOString(),
      },
      saju: context.sajuResult
        ? {
            lackingElements: context.sajuResult.lackingElements,
            favorableElements: context.sajuResult.favorableElements,
            elementCounts: context.sajuResult.elementCounts,
          }
        : {
            lackingElements: [],
            favorableElements: [],
            elementCounts: {} as any,
          },
    };
  }
}

// ============================================================
// Error Classes
// ============================================================

/**
 * Pipeline-specific error
 */
export class PipelineError extends Error {
  constructor(
    public step: string,
    message: string,
    public originalError?: Error
  ) {
    super(`[${step}] ${message}`);
    this.name = 'PipelineError';
  }
}

// ============================================================
// Service Interfaces (Dependency Injection)
// ============================================================

/**
 * Abstract Hanja service interface
 * Allows different implementations (DB, in-memory, mock)
 */
export interface HanjaService {
  findByElement(
    element: Element,
    options: {
      minStrokes?: number;
      maxStrokes?: number;
      isGoodForNaming?: boolean;
      gender?: 'M' | 'F';
    }
  ): Promise<HanjaCharacter[]>;
}

/**
 * Abstract cache service interface
 */
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// ============================================================
// Factory Function
// ============================================================

/**
 * Create NamingPipeline with default dependencies
 *
 * Usage:
 * ```ts
 * const pipeline = createNamingPipeline(hanjaService, cacheService);
 * const result = await pipeline.execute(birthInfo, lastName, lastNameStrokes);
 * ```
 */
export function createNamingPipeline(
  hanjaService: HanjaService,
  cacheService?: CacheService
): NamingPipeline {
  return new NamingPipeline(
    new SajuCalculator(),
    new YongsinAnalyzer(),
    new YinYangValidator(),
    new PhoneticMatcher(),
    hanjaService,
    cacheService
  );
}
