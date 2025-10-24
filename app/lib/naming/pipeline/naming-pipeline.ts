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

import type { Element } from '@prisma/client';
import { SajuCalculator, type SajuResult } from '~/lib/saju/calculator';
import { YongsinAnalyzer, type CombinedYongsinResult } from '~/lib/saju/yongsin-analyzer';
import { YinYangValidator, type YinYangAnalysis } from '~/lib/naming/validators/yinyang-validator';
import { PhoneticMatcher, type PhoneticAnalysis } from '~/lib/naming/validators/phonetic-matcher';
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

  // Caching
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
}

/**
 * Default pipeline configuration
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  maxCombinations: 10000,
  maxCandidates: 20,
  batchSize: 100,
  timeout: 10000,
  weights: {
    yongsin: 0.35,
    yinyang: 0.25,
    pronunciation: 0.20,
    meaning: 0.10,
    numerology: 0.05,
    taboo: 0.05,
  },
  minScore: 60,
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

      // Query Hanja with primary element
      let hanjaPool = await this.hanjaService.findByElement(primaryElement, {
        minStrokes: 3,
        maxStrokes: 20,
        isGoodForNaming: true,
        gender: context.birthInfo.gender,
      });

      // Fallback: If pool too small, add secondary element
      if (hanjaPool.length < 50 && secondaryElement) {
        const secondaryPool = await this.hanjaService.findByElement(secondaryElement, {
          minStrokes: 3,
          maxStrokes: 20,
          isGoodForNaming: true,
          gender: context.birthInfo.gender,
        });
        hanjaPool = [...hanjaPool, ...secondaryPool];
      }

      // Deduplicate
      context.hanjaPool = Array.from(new Map(hanjaPool.map((h) => [h.character, h])).values());

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

      // Generate all pairs (with early limit)
      for (let i = 0; i < pool.length && combinations.length < context.config.maxCombinations; i++) {
        for (let j = 0; j < pool.length && combinations.length < context.config.maxCombinations; j++) {
          // Skip if same character (unless it's a valid double name)
          if (i === j && !this.isValidDoubleCharacter(pool[i])) continue;

          combinations.push({
            firstName: pool[i].koreanReading + pool[j].koreanReading,
            firstChar: pool[i],
            secondChar: pool[j],
          });
        }
      }

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

    // Calculate weighted scores
    const scores = {
      yongsin: yongsinAnalysis.matchScore,
      yinyang: yinyangAnalysis.balanceScore,
      pronunciation: phoneticAnalysis.overallScore,
      meaning: this.calculateMeaningScore([combo.firstChar, combo.secondChar]),
      numerology: numerologyAnalysis.overallScore,
      taboo: 100 - tabooAnalysis.deductionPoints,
    };

    const totalScore =
      scores.yongsin * context.config.weights.yongsin +
      scores.yinyang * context.config.weights.yinyang +
      scores.pronunciation * context.config.weights.pronunciation +
      scores.meaning * context.config.weights.meaning +
      scores.numerology * context.config.weights.numerology +
      scores.taboo * context.config.weights.taboo;

    return {
      firstName: combo.firstName,
      fullName,
      hanja,
      firstChar: combo.firstChar,
      secondChar: combo.secondChar,
      totalScore,
      scores,
      analysis: {
        yongsinAnalysis,
        yinyangAnalysis,
        phoneticAnalysis,
        numerologyAnalysis,
        tabooAnalysis,
      },
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
      // Sort by total score descending
      const sorted = context.candidates.sort((a, b) => b.totalScore - a.totalScore);

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

    let matchScore = 0;
    if (primaryMatches === 2) matchScore = 100;
    else if (primaryMatches === 1 && secondaryMatches === 1) matchScore = 95;
    else if (primaryMatches === 1) matchScore = 85;
    else if (secondaryMatches === 2) matchScore = 80;
    else if (secondaryMatches === 1) matchScore = 70;
    else matchScore = 50;

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
  private checkTaboo(characters: HanjaCharacter[]): TabooAnalysis {
    const tabooReasons: string[] = [];
    let deductionPoints = 0;

    // 부정적 의미 키워드 (카테고리별)
    const negativeKeywords = {
      death: ['죽', '사', '시체', '망', '상', '요절'],
      illness: ['병', '질병', '아픔', '고통', '괴로', '신음'],
      disaster: ['재앙', '화', '난', '액', '흉', '불길', '참혹'],
      unhappiness: ['불행', '슬픔', '비애', '우울', '한탄', '비참'],
      violence: ['살', '죽이', '베', '찌르', '때리', '해치'],
      decay: ['썩', '부패', '문드러', '허물어', '무너'],
      poverty: ['가난', '빈곤', '궁핍', '곤궁'],
      ugliness: ['추', '못생', '흉', '보기흉'],
      animals: ['벌레', '쥐', '뱀', '독충', '구더기'],
      crime: ['도적', '훔치', '속이', '거짓', '사기'],
      war: ['전쟁', '싸움', '칼', '무기', '살육'],
      negative: ['나쁜', '악', '흉악', '저주', '원한', '미움'],
    };

    for (const char of characters) {
      const meaning = char.meaning.toLowerCase();

      // 각 카테고리별로 체크
      for (const [category, keywords] of Object.entries(negativeKeywords)) {
        for (const keyword of keywords) {
          if (meaning.includes(keyword)) {
            let severity = 30; // 기본 감점

            // 심각도에 따라 차등 감점
            if (category === 'death' || category === 'violence') {
              severity = 50; // 죽음, 폭력 관련은 더 강하게 감점
            } else if (category === 'illness' || category === 'disaster') {
              severity = 40; // 질병, 재앙도 강하게 감점
            }

            tabooReasons.push(`${char.character}: ${category} 관련 (${char.meaning})`);
            deductionPoints += severity;
            break; // 한 카테고리에서 발견되면 다음 카테고리는 체크 안 함
          }
        }
      }

      // 한자 자체가 부정적인 경우 (리뷰 상태 체크)
      if (char.review === 'rejected') {
        tabooReasons.push(`${char.character}: 작명 부적합 (리뷰 거부됨)`);
        deductionPoints += 20;
      }
    }

    return {
      hasTaboo: tabooReasons.length > 0,
      tabooReasons,
      deductionPoints: Math.min(100, deductionPoints), // 최대 100점 감점
    };
  }

  /**
   * Calculate meaning harmony score
   */
  private calculateMeaningScore(characters: HanjaCharacter[]): number {
    // Simple implementation: average of character quality
    // TODO: Enhance with semantic similarity analysis
    const totalMeaningQuality = characters.reduce((sum, char) => {
      // Heuristic: longer, more detailed meanings are better
      const meaningLength = char.meaning.length;
      const qualityScore = Math.min(100, meaningLength * 10);
      return sum + qualityScore;
    }, 0);

    return totalMeaningQuality / characters.length;
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
