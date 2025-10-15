# Korean Naming Algorithm Architecture (사주 작명 시스템)

**Document Version**: 1.0
**Date**: 2025-10-15
**Status**: Architecture Design

---

## Executive Summary

This document defines the comprehensive architecture for an intelligent Korean baby naming recommendation system that combines traditional 사주 (Saju/四柱) philosophy with modern algorithmic scoring. The system analyzes 8,787 hanja characters to generate optimal 2-character first names, scoring candidates across four dimensions: five elements harmony (40%), yin-yang balance (20%), numerological fortune (20%), and semantic meaning (20%).

**Key Challenges**:
- Combinatorial complexity: 8,787² = 77M+ combinations
- Multi-criteria optimization with weighted scoring
- Real-time performance requirements (<5s response time)
- Extensibility for future scoring criteria

**Solution Approach**:
- Three-phase filtering pipeline (pre-filter → generate → score)
- Parallel batch processing with database query optimization
- Configurable scoring weights with A/B testing support
- Modular architecture for easy extension

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Module Structure](#3-module-structure)
4. [Data Structures & Interfaces](#4-data-structures--interfaces)
5. [Algorithm Flow](#5-algorithm-flow)
6. [Scoring System](#6-scoring-system)
7. [Performance Optimization](#7-performance-optimization)
8. [Configuration & Extensibility](#8-configuration--extensibility)
9. [Testing Strategy](#9-testing-strategy)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. System Overview

### 1.1 Inputs
```typescript
interface NamingInput {
  // Saju calculation results
  sajuResult: SajuResult; // From SajuCalculator

  // User preferences
  lastName: string;        // 성 (family name)
  lastNameHanja: string;   // 성의 한자
  gender?: 'M' | 'F';      // Optional gender preference

  // Constraints (optional)
  preferences?: {
    avoidCharacters?: string[];     // 피할 한자
    preferredElements?: Element[];  // 선호 오행
    meaningKeywords?: string[];     // 의미 키워드
    minTotalStrokes?: number;       // 최소 총 획수
    maxTotalStrokes?: number;       // 최대 총 획수
  };

  // Configuration
  config?: {
    topN?: number;                  // 반환할 후보 수 (default: 30)
    scoringWeights?: ScoringWeights; // 커스텀 가중치
  };
}
```

### 1.2 Outputs
```typescript
interface NamingRecommendation {
  // Basic info
  firstName: string;              // 이름 (한글)
  firstNameHanja: string;         // 이름 (한자)
  fullName: string;               // 성명 (한글)
  fullNameHanja: string;          // 성명 (한자)

  // Character details
  characters: [HanjaCharacter, HanjaCharacter];

  // Scoring breakdown
  scores: {
    overall: number;              // 종합 점수 (0-100)
    rank: number;                 // 순위 (1-N)
    grade: 'S' | 'A' | 'B' | 'C' | 'D';

    // Individual scores
    elementHarmony: DetailedScore;   // 40% weight
    yinYangBalance: DetailedScore;   // 20% weight
    numerology: DetailedScore;       // 20% weight
    meaningHarmony: DetailedScore;   // 20% weight
  };

  // Analysis
  analysis: {
    strengths: string[];           // 장점
    concerns: string[];            // 고려사항
    recommendation: string;        // 추천 의견

    // Saju compatibility
    complementsLackingElements: boolean;
    strengthensFavorableElements: boolean;

    // Detailed breakdowns
    fourGrids: FourGridsAnalysis;
    elementDistribution: Record<Element, number>;
    yinYangPattern: string;
  };

  // Metadata
  generatedAt: Date;
  confidenceScore: number;        // 신뢰도 (0-1)
}

interface DetailedScore {
  score: number;                  // 0-100
  weight: number;                 // 가중치
  weightedScore: number;          // score * weight
  explanation: string;            // 상세 설명
  subScores?: Record<string, number>; // 세부 점수
}
```

### 1.3 Core Requirements

**Functional Requirements**:
- FR1: Generate 30-50 high-quality name candidates within 5 seconds
- FR2: Score each candidate across 4 weighted criteria
- FR3: Provide detailed reasoning for each recommendation
- FR4: Support custom preferences and constraints
- FR5: Ensure cultural appropriateness and avoid negative connotations

**Non-Functional Requirements**:
- NFR1: Performance: <5s for top 30 results, <10s for top 50
- NFR2: Scalability: Support 100+ concurrent users
- NFR3: Extensibility: Easy addition of new scoring criteria
- NFR4: Maintainability: Modular, testable architecture
- NFR5: Accuracy: 90%+ expert validation rate for top recommendations

---

## 2. High-Level Architecture

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
│              (Saju Result + Last Name + Preferences)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Naming Orchestrator                           │
│  • Input validation                                              │
│  • Configuration resolution                                      │
│  • Result aggregation & ranking                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Candidate Generator     │   │   Scoring Pipeline       │
│  • Pre-filtering         │   │  • Element harmony       │
│  • Combination creation  │   │  • Yin-yang balance      │
│  • Batch processing      │   │  • Numerology (81수리)   │
└─────────┬────────────────┘   │  • Meaning harmony       │
          │                    └─────────┬────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Character Filter        │   │   Scorer Services        │
│  • Element-based         │   │  ├─ ElementScorer        │
│  • Stroke-based          │   │  ├─ YinYangScorer        │
│  • Popularity-based      │   │  ├─ NumerologyScorer     │
│  • Gender-based          │   │  └─ MeaningScorer        │
└─────────┬────────────────┘   └─────────┬────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Access Layer                            │
│  • HanjaRepository (PostgreSQL)                                  │
│  • Caching Layer (Redis)                                         │
│  • Batch Query Optimizer                                         │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database (PostgreSQL)                        │
│  hanja_dict: 8,787 characters                                    │
│  Indexes: element, strokes, yinyang, nameFrequency              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Layers

**Layer 1: Orchestration**
- Entry point for naming requests
- Coordinates generator, scorer, and ranker
- Handles caching and result formatting

**Layer 2: Business Logic**
- Candidate generation with intelligent filtering
- Multi-criteria scoring with configurable weights
- Ranking and recommendation generation

**Layer 3: Scoring Services**
- Independent scorer modules for each criterion
- Pluggable architecture for extensibility
- Shared utilities for common calculations

**Layer 4: Data Access**
- Repository pattern for database operations
- Query optimization and batch processing
- Caching for frequently accessed data

**Layer 5: Storage**
- PostgreSQL database with optimized indexes
- Redis cache for hot data
- Pre-computed lookup tables

---

## 3. Module Structure

### 3.1 Directory Organization

```
app/lib/naming/
├── index.ts                          # Public API exports
│
├── orchestrator/
│   ├── naming-orchestrator.ts        # Main coordinator
│   ├── orchestrator-config.ts        # Configuration defaults
│   └── orchestrator-cache.ts         # Result caching logic
│
├── generator/
│   ├── candidate-generator.ts        # Core generation logic
│   ├── character-filter.ts           # Pre-filtering strategies
│   ├── combination-builder.ts        # Pairing logic
│   └── batch-processor.ts            # Parallel processing
│
├── scorers/
│   ├── base-scorer.ts                # Abstract base class
│   ├── element-scorer.ts             # Five elements harmony (40%)
│   ├── yinyang-scorer.ts             # Yin-yang balance (20%)
│   ├── numerology-scorer.ts          # 81 numerology (20%)
│   ├── meaning-scorer.ts             # Semantic harmony (20%)
│   └── scorer-utils.ts               # Shared calculations
│
├── ranker/
│   ├── result-ranker.ts              # Sorting and ranking
│   ├── diversity-filter.ts           # Avoid similar results
│   └── recommendation-builder.ts     # Detailed analysis
│
├── analysis/
│   ├── element-analyzer.ts           # Element relationship logic
│   ├── numerology-analyzer.ts        # 81수리 interpretations
│   ├── yinyang-analyzer.ts           # Yin-yang pattern analysis
│   └── meaning-analyzer.ts           # Semantic compatibility
│
├── utils/
│   ├── scoring-weights.ts            # Weight configurations
│   ├── validation.ts                 # Input validation
│   ├── constants.ts                  # Shared constants
│   └── helpers.ts                    # Utility functions
│
└── types/
    ├── naming-types.ts               # Core type definitions
    ├── scorer-types.ts               # Scorer interfaces
    └── config-types.ts               # Configuration types
```

### 3.2 Module Responsibilities

#### Orchestrator (`naming-orchestrator.ts`)
```typescript
/**
 * Main coordinator that orchestrates the entire naming process
 *
 * Responsibilities:
 * - Validate input and resolve configuration
 * - Coordinate generator → scorer → ranker pipeline
 * - Manage caching and performance monitoring
 * - Format and return final results
 */
export class NamingOrchestrator {
  async generateNames(input: NamingInput): Promise<NamingRecommendation[]>;
  private validateInput(input: NamingInput): void;
  private resolveConfig(input: NamingInput): ResolvedConfig;
  private getCached(key: string): Promise<NamingRecommendation[] | null>;
  private cacheResults(key: string, results: NamingRecommendation[]): Promise<void>;
}
```

#### Candidate Generator (`candidate-generator.ts`)
```typescript
/**
 * Generates name candidates through intelligent filtering and pairing
 *
 * Strategy:
 * 1. Pre-filter characters based on favorable elements (narrow to ~500-1000)
 * 2. Apply stroke and gender filters (narrow to ~300-500)
 * 3. Generate combinations in batches (500-1000 pairs)
 * 4. Early termination if sufficient high-quality candidates found
 */
export class CandidateGenerator {
  async generateCandidates(
    input: NamingInput,
    config: ResolvedConfig
  ): Promise<NameCandidate[]>;

  private preFilterCharacters(criteria: FilterCriteria): Promise<HanjaDict[]>;
  private generatePairs(chars: HanjaDict[]): NameCandidate[];
  private batchProcess(candidates: NameCandidate[]): Promise<NameCandidate[]>;
}
```

#### Base Scorer (`base-scorer.ts`)
```typescript
/**
 * Abstract base class for all scorers
 *
 * Defines common interface and shared logic:
 * - Score normalization (0-100)
 * - Weight application
 * - Explanation generation
 */
export abstract class BaseScorer {
  abstract weight: number;
  abstract name: string;

  abstract calculateRawScore(candidate: NameCandidate): Promise<number>;
  abstract generateExplanation(candidate: NameCandidate, score: number): string;

  async score(candidate: NameCandidate): Promise<DetailedScore> {
    const rawScore = await this.calculateRawScore(candidate);
    const normalizedScore = this.normalize(rawScore);
    const weightedScore = normalizedScore * this.weight;
    const explanation = this.generateExplanation(candidate, normalizedScore);

    return {
      score: normalizedScore,
      weight: this.weight,
      weightedScore,
      explanation,
    };
  }

  protected normalize(score: number): number;
}
```

#### Result Ranker (`result-ranker.ts`)
```typescript
/**
 * Ranks and filters final results
 *
 * Responsibilities:
 * - Sort by overall score
 * - Apply diversity filtering (avoid too similar names)
 * - Assign ranks and grades
 * - Generate final recommendations
 */
export class ResultRanker {
  rankResults(
    candidates: ScoredCandidate[],
    config: ResolvedConfig
  ): NamingRecommendation[];

  private sortByScore(candidates: ScoredCandidate[]): ScoredCandidate[];
  private applyDiversityFilter(candidates: ScoredCandidate[]): ScoredCandidate[];
  private assignGrades(candidates: ScoredCandidate[]): NamingRecommendation[];
  private buildRecommendation(candidate: ScoredCandidate, rank: number): NamingRecommendation;
}
```

---

## 4. Data Structures & Interfaces

### 4.1 Core Types

```typescript
// naming-types.ts

/**
 * Internal representation of a name candidate
 */
export interface NameCandidate {
  firstName: string;              // 한글 이름
  firstNameHanja: string;         // 한자 이름
  char1: HanjaDict;               // 첫 번째 한자
  char2: HanjaDict;               // 두 번째 한자

  // Pre-computed values for scoring
  totalStrokes: number;
  elementDistribution: Record<Element, number>;
  yinYangPattern: YinYang[];
}

/**
 * Candidate with calculated scores
 */
export interface ScoredCandidate extends NameCandidate {
  scores: {
    overall: number;
    elementHarmony: DetailedScore;
    yinYangBalance: DetailedScore;
    numerology: DetailedScore;
    meaningHarmony: DetailedScore;
  };

  // Additional analysis
  fourGrids: FourGridsAnalysis;
  complementsSaju: boolean;
  confidenceScore: number;
}

/**
 * Four grids numerology analysis (사격)
 */
export interface FourGridsAnalysis {
  wonGyeok: NumerologyGrid;    // 원격: 초년운 (이름 전체)
  hyeongGyeok: NumerologyGrid;  // 형격: 청장년운 (성 + 이름첫자)
  iGyeok: NumerologyGrid;       // 이격: 중말년운 (이름 두 자)
  jeongGyeok: NumerologyGrid;   // 정격: 말년운 (성 + 이름끝자)
}

export interface NumerologyGrid {
  strokes: number;
  mod81: number;
  fortune: '대길' | '길' | '평' | '흉' | '대흉';
  score: number;
  meaning: string;
}

/**
 * Filtering criteria for candidate generation
 */
export interface FilterCriteria {
  // Element filters
  favorableElements: Element[];    // From saju
  avoidElements?: Element[];

  // Stroke filters
  minStrokes?: number;
  maxStrokes?: number;
  targetStrokeRanges?: [number, number][]; // For specific grids

  // Characteristic filters
  gender?: 'M' | 'F';
  minPopularity?: number;
  maxPopularity?: number;

  // Content filters
  avoidCharacters?: string[];
  meaningKeywords?: string[];
  requiredCategories?: string[];
}

/**
 * Resolved configuration for naming process
 */
export interface ResolvedConfig {
  // Output control
  topN: number;                    // Number of results to return
  diversityThreshold: number;      // Min difference between results

  // Scoring weights
  weights: ScoringWeights;

  // Performance tuning
  maxCandidates: number;           // Max candidates to evaluate
  batchSize: number;               // Batch processing size
  parallelism: number;             // Concurrent operations

  // Feature flags
  enableCaching: boolean;
  enableEarlyTermination: boolean;
  enableDiversityFilter: boolean;

  // A/B testing
  experimentId?: string;
  variantId?: string;
}

/**
 * Scoring weights configuration
 */
export interface ScoringWeights {
  elementHarmony: number;      // Default: 0.40
  yinYangBalance: number;      // Default: 0.20
  numerology: number;          // Default: 0.20
  meaningHarmony: number;      // Default: 0.20
}

/**
 * Element relationship definitions
 */
export enum ElementRelationship {
  PRODUCING = 'producing',     // 상생
  WEAKENING = 'weakening',     // 설기
  CONTROLLING = 'controlling', // 상극
  SAME = 'same',              // 동일
  NEUTRAL = 'neutral'         // 중립
}
```

### 4.2 Scorer Interfaces

```typescript
// scorer-types.ts

/**
 * Common interface for all scorers
 */
export interface IScorer {
  name: string;
  weight: number;

  score(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<DetailedScore>;
}

/**
 * Context passed to scorers
 */
export interface ScoringContext {
  sajuResult: SajuResult;
  lastName: string;
  lastNameHanja: string;
  lastNameStrokes: number;
  preferences?: NamingInput['preferences'];
  config: ResolvedConfig;
}

/**
 * Element harmony scoring details
 */
export interface ElementHarmonyDetails {
  // Element relationships
  relationships: Array<{
    from: Element;
    to: Element;
    type: ElementRelationship;
    score: number;
  }>;

  // Saju compatibility
  complementsLacking: boolean;
  strengthensFavorable: boolean;

  // Scoring breakdown
  productionScore: number;      // 상생 점수
  controlScore: number;         // 상극 점수 (negative)
  balanceScore: number;         // 균형 점수
  sajuCompatibilityScore: number; // 사주 보완 점수
}

/**
 * Yin-yang balance scoring details
 */
export interface YinYangBalanceDetails {
  pattern: string;              // e.g., "양음양"
  yinCount: number;
  yangCount: number;

  // Balance evaluation
  isIdeal: boolean;             // Perfect balance
  isGood: boolean;              // Acceptable balance
  hasConcern: boolean;          // Imbalanced

  // Scoring factors
  balanceScore: number;
  patternScore: number;
  lastNameCompatibility: number;
}

/**
 * Numerology scoring details
 */
export interface NumerologyDetails {
  fourGrids: FourGridsAnalysis;

  // Grid scores
  gridScores: {
    wonGyeok: number;
    hyeongGyeok: number;
    iGyeok: number;
    jeongGyeok: number;
  };

  // Overall assessment
  auspiciousCount: number;      // Number of 길 or 대길
  inauspiciousCount: number;    // Number of 흉 or 대흉
  averageGridScore: number;
}

/**
 * Meaning harmony scoring details
 */
export interface MeaningHarmonyDetails {
  // Individual character evaluation
  char1Quality: number;         // Based on fortune, popularity
  char2Quality: number;

  // Compatibility
  meaningCompatibility: number;  // Semantic coherence
  culturalAppropriateness: number;

  // Content analysis
  positiveTraits: string[];
  concernedTraits: string[];
  thematicCoherence: number;
}
```

### 4.3 Configuration Types

```typescript
// config-types.ts

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ResolvedConfig = {
  topN: 30,
  diversityThreshold: 0.1,

  weights: {
    elementHarmony: 0.40,
    yinYangBalance: 0.20,
    numerology: 0.20,
    meaningHarmony: 0.20,
  },

  maxCandidates: 1000,
  batchSize: 100,
  parallelism: 4,

  enableCaching: true,
  enableEarlyTermination: true,
  enableDiversityFilter: true,
};

/**
 * Preset configurations for different use cases
 */
export const PRESET_CONFIGS = {
  // Prioritize traditional principles
  traditional: {
    weights: {
      elementHarmony: 0.50,
      yinYangBalance: 0.25,
      numerology: 0.20,
      meaningHarmony: 0.05,
    },
  },

  // Prioritize meaning and sound
  modern: {
    weights: {
      elementHarmony: 0.20,
      yinYangBalance: 0.15,
      numerology: 0.15,
      meaningHarmony: 0.50,
    },
  },

  // Balanced approach
  balanced: DEFAULT_CONFIG.weights,
} as const;

/**
 * A/B testing configuration
 */
export interface ExperimentConfig {
  experimentId: string;
  variants: Array<{
    variantId: string;
    weight: number;           // Traffic allocation
    config: Partial<ResolvedConfig>;
  }>;
  startDate: Date;
  endDate?: Date;
  metrics: string[];          // Metrics to track
}
```

---

## 5. Algorithm Flow

### 5.1 Overall Pipeline

```typescript
/**
 * Main naming algorithm flow
 */
async function generateNames(input: NamingInput): Promise<NamingRecommendation[]> {
  // Phase 1: Setup
  const config = resolveConfig(input);
  const cacheKey = generateCacheKey(input, config);

  // Check cache
  if (config.enableCaching) {
    const cached = await getFromCache(cacheKey);
    if (cached) return cached;
  }

  // Phase 2: Candidate Generation
  const generator = new CandidateGenerator(hanjaRepository);
  const candidates = await generator.generateCandidates(input, config);
  // Result: 500-1000 candidates after intelligent filtering

  // Phase 3: Scoring
  const scoringPipeline = new ScoringPipeline([
    new ElementScorer(),
    new YinYangScorer(),
    new NumerologyScorer(),
    new MeaningScorer(),
  ]);

  const scoredCandidates = await scoringPipeline.scoreAll(
    candidates,
    buildScoringContext(input, config)
  );
  // Result: All candidates with detailed scores

  // Phase 4: Ranking & Selection
  const ranker = new ResultRanker();
  const recommendations = ranker.rankResults(scoredCandidates, config);
  // Result: Top N recommendations with analysis

  // Phase 5: Cache & Return
  if (config.enableCaching) {
    await saveToCache(cacheKey, recommendations);
  }

  return recommendations;
}
```

### 5.2 Candidate Generation (Detailed)

```typescript
/**
 * Three-phase filtering strategy to reduce search space
 */
class CandidateGenerator {
  async generateCandidates(
    input: NamingInput,
    config: ResolvedConfig
  ): Promise<NameCandidate[]> {

    // PHASE 1: Element-based pre-filtering (8,787 → ~500-1000)
    // =====================================================
    const favorableElements = this.determineFavorableElements(input.sajuResult);
    const elementFiltered = await this.hanjaRepository.findMany({
      element: { in: favorableElements },        // Primary filter
      nameFrequency: { gte: 1 },                // Must be used in names
      gender: input.gender || undefined,         // Gender preference
      character: { notIn: input.preferences?.avoidCharacters || [] },
      take: 1000,                               // Safety limit
      orderBy: [
        { nameFrequency: 'desc' },              // Prefer popular
        { usageFrequency: 'desc' },
      ],
    });

    // PHASE 2: Stroke-based filtering (~500-1000 → ~300-500)
    // =====================================================
    const strokeFiltered = this.filterByStrokes(
      elementFiltered,
      input.lastName,
      input.preferences
    );
    // Logic: Calculate which stroke ranges produce auspicious grids
    // Keep only characters that can form at least 2 auspicious grids

    // PHASE 3: Combination generation (~300-500 → ~500-1000 pairs)
    // =====================================================
    const pairs = this.generatePairs(strokeFiltered, config);

    // PHASE 4: Quick quality filter (optional early termination)
    // =====================================================
    if (config.enableEarlyTermination) {
      const quickScored = this.quickScore(pairs);
      const topPairs = quickScored
        .filter(p => p.quickScore > 70)  // Only high-potential
        .slice(0, config.maxCandidates);

      if (topPairs.length >= config.topN * 2) {
        return topPairs; // Early exit with good candidates
      }
    }

    return pairs.slice(0, config.maxCandidates);
  }

  /**
   * Determine favorable elements based on saju
   */
  private determineFavorableElements(saju: SajuResult): Element[] {
    const priorities: Element[] = [];

    // Priority 1: Primary yongsin (용신)
    priorities.push(saju.yongsin.primary);

    // Priority 2: Secondary yongsin
    if (saju.yongsin.secondary) {
      priorities.push(saju.yongsin.secondary);
    }

    // Priority 3: Elements that produce yongsin (상생)
    const producing = getProducingElement(saju.yongsin.primary);
    if (!priorities.includes(producing)) {
      priorities.push(producing);
    }

    // Priority 4: Lacking elements (if not controlled by yongsin)
    for (const lacking of saju.lackingElements) {
      if (!priorities.includes(lacking) &&
          !isControlledBy(lacking, saju.yongsin.primary)) {
        priorities.push(lacking);
      }
    }

    return priorities;
  }

  /**
   * Filter by stroke counts that produce auspicious grids
   */
  private filterByStrokes(
    characters: HanjaDict[],
    lastName: string,
    preferences?: NamingInput['preferences']
  ): HanjaDict[] {
    const lastNameStrokes = getLastNameStrokes(lastName);

    // Calculate auspicious stroke ranges for each grid
    const auspiciousRanges = this.calculateAuspiciousStrokeRanges(
      lastNameStrokes,
      preferences
    );

    return characters.filter(char => {
      // Check if this character can contribute to auspicious grids
      const canFormAuspiciousGrids = auspiciousRanges.some(range => {
        return char.strokes >= range.min && char.strokes <= range.max;
      });

      return canFormAuspiciousGrids;
    });
  }

  /**
   * Generate character pairs with strategic ordering
   */
  private generatePairs(
    characters: HanjaDict[],
    config: ResolvedConfig
  ): NameCandidate[] {
    const pairs: NameCandidate[] = [];

    // Strategy 1: Diverse element combinations (avoid same element)
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i];
        const char2 = characters[j];

        // Skip if same element (unless specifically preferred)
        if (char1.element === char2.element && !config.allowSameElement) {
          continue;
        }

        // Create both orderings
        pairs.push(this.createCandidate(char1, char2));
        pairs.push(this.createCandidate(char2, char1));

        // Early termination check
        if (pairs.length >= config.maxCandidates * 2) {
          return pairs.slice(0, config.maxCandidates);
        }
      }
    }

    return pairs;
  }

  /**
   * Quick scoring for early termination
   */
  private quickScore(candidates: NameCandidate[]): Array<NameCandidate & { quickScore: number }> {
    return candidates.map(candidate => {
      // Fast heuristic scoring (no DB lookups)
      let score = 50; // Base score

      // Element diversity: +20
      if (candidate.char1.element !== candidate.char2.element) {
        score += 20;
      }

      // Yin-yang balance: +15
      if (this.hasGoodYinYangPattern(candidate)) {
        score += 15;
      }

      // Popularity: +15
      score += Math.min(15,
        (candidate.char1.nameFrequency + candidate.char2.nameFrequency) / 200
      );

      return { ...candidate, quickScore: score };
    });
  }
}
```

### 5.3 Scoring Pipeline

```typescript
/**
 * Parallel scoring pipeline with dependency management
 */
class ScoringPipeline {
  constructor(private scorers: IScorer[]) {}

  async scoreAll(
    candidates: NameCandidate[],
    context: ScoringContext
  ): Promise<ScoredCandidate[]> {

    // Process in batches for memory efficiency
    const batchSize = context.config.batchSize;
    const results: ScoredCandidate[] = [];

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const batchResults = await this.scoreBatch(batch, context);
      results.push(...batchResults);
    }

    return results;
  }

  private async scoreBatch(
    batch: NameCandidate[],
    context: ScoringContext
  ): Promise<ScoredCandidate[]> {

    // Score all candidates in batch in parallel
    const scoredBatch = await Promise.all(
      batch.map(candidate => this.scoreCandidate(candidate, context))
    );

    return scoredBatch;
  }

  private async scoreCandidate(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<ScoredCandidate> {

    // Run all scorers in parallel (they're independent)
    const [elementScore, yinYangScore, numerologyScore, meaningScore] =
      await Promise.all([
        this.scorers[0].score(candidate, context), // ElementScorer
        this.scorers[1].score(candidate, context), // YinYangScorer
        this.scorers[2].score(candidate, context), // NumerologyScorer
        this.scorers[3].score(candidate, context), // MeaningScorer
      ]);

    // Calculate overall score (weighted sum)
    const overall =
      elementScore.weightedScore +
      yinYangScore.weightedScore +
      numerologyScore.weightedScore +
      meaningScore.weightedScore;

    // Additional analysis
    const fourGrids = calculateFourGrids(
      candidate,
      context.lastNameStrokes
    );

    const complementsSaju = this.checkSajuComplement(
      candidate,
      context.sajuResult
    );

    const confidenceScore = this.calculateConfidence(
      elementScore,
      yinYangScore,
      numerologyScore,
      meaningScore
    );

    return {
      ...candidate,
      scores: {
        overall,
        elementHarmony: elementScore,
        yinYangBalance: yinYangScore,
        numerology: numerologyScore,
        meaningHarmony: meaningScore,
      },
      fourGrids,
      complementsSaju,
      confidenceScore,
    };
  }
}
```

### 5.4 Ranking & Selection

```typescript
/**
 * Result ranking with diversity filtering
 */
class ResultRanker {
  rankResults(
    candidates: ScoredCandidate[],
    config: ResolvedConfig
  ): NamingRecommendation[] {

    // Step 1: Sort by overall score (descending)
    const sorted = candidates.sort((a, b) =>
      b.scores.overall - a.scores.overall
    );

    // Step 2: Apply diversity filter if enabled
    const diverse = config.enableDiversityFilter
      ? this.applyDiversityFilter(sorted, config.diversityThreshold)
      : sorted;

    // Step 3: Take top N
    const topN = diverse.slice(0, config.topN);

    // Step 4: Build recommendations with detailed analysis
    const recommendations = topN.map((candidate, index) =>
      this.buildRecommendation(candidate, index + 1, config)
    );

    return recommendations;
  }

  /**
   * Ensure diversity in results (avoid too similar names)
   */
  private applyDiversityFilter(
    candidates: ScoredCandidate[],
    threshold: number
  ): ScoredCandidate[] {
    const diverse: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      // Check similarity with already selected candidates
      const tooSimilar = diverse.some(selected =>
        this.similarity(candidate, selected) > threshold
      );

      if (!tooSimilar) {
        diverse.push(candidate);
      }
    }

    return diverse;
  }

  /**
   * Calculate similarity between two candidates
   */
  private similarity(a: ScoredCandidate, b: ScoredCandidate): number {
    let similarity = 0;

    // Same first character: +0.5
    if (a.char1.character === b.char1.character) {
      similarity += 0.5;
    }

    // Same second character: +0.5
    if (a.char2.character === b.char2.character) {
      similarity += 0.5;
    }

    // Same sound (reading): +0.3
    if (a.char1.koreanReading === b.char1.koreanReading) {
      similarity += 0.15;
    }
    if (a.char2.koreanReading === b.char2.koreanReading) {
      similarity += 0.15;
    }

    return similarity;
  }

  /**
   * Build detailed recommendation with analysis
   */
  private buildRecommendation(
    candidate: ScoredCandidate,
    rank: number,
    config: ResolvedConfig
  ): NamingRecommendation {

    // Determine grade based on score
    const grade = this.assignGrade(candidate.scores.overall);

    // Generate analysis
    const strengths = this.identifyStrengths(candidate);
    const concerns = this.identifyConcerns(candidate);
    const recommendation = this.generateRecommendation(
      candidate,
      grade,
      strengths,
      concerns
    );

    return {
      // Basic info
      firstName: candidate.firstName,
      firstNameHanja: candidate.firstNameHanja,
      fullName: `${config.context.lastName}${candidate.firstName}`,
      fullNameHanja: `${config.context.lastNameHanja}${candidate.firstNameHanja}`,

      // Character details
      characters: [candidate.char1, candidate.char2],

      // Scoring
      scores: {
        overall: Math.round(candidate.scores.overall),
        rank,
        grade,
        ...candidate.scores,
      },

      // Analysis
      analysis: {
        strengths,
        concerns,
        recommendation,
        complementsLackingElements: candidate.complementsSaju,
        strengthensFavorableElements: this.strengthensFavorable(candidate, config),
        fourGrids: candidate.fourGrids,
        elementDistribution: candidate.elementDistribution,
        yinYangPattern: this.formatYinYangPattern(candidate.yinYangPattern),
      },

      // Metadata
      generatedAt: new Date(),
      confidenceScore: candidate.confidenceScore,
    };
  }

  private assignGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }
}
```

---

## 6. Scoring System

### 6.1 Element Harmony Scorer (40% weight)

```typescript
/**
 * Element harmony scorer - evaluates five elements relationships
 *
 * Scoring Logic:
 * - Production cycle (상생): +30 points per producing relationship
 * - Same element: +15 points
 * - Control cycle (상극): -20 points per controlling relationship
 * - Saju complement: +25 bonus if complements lacking/favorable elements
 * - Balance: +20 if good distribution
 */
class ElementScorer extends BaseScorer {
  name = 'element-harmony';
  weight = 0.40;

  async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    let score = 50; // Base score

    const { char1, char2 } = candidate;
    const { sajuResult } = context;

    // 1. Relationship between char1 and char2
    const relationship = getElementRelationship(char1.element, char2.element);

    switch (relationship) {
      case ElementRelationship.PRODUCING:
        score += 30; // 상생: 매우 좋음
        break;
      case ElementRelationship.SAME:
        score += 15; // 동일: 보통
        break;
      case ElementRelationship.CONTROLLING:
        score -= 20; // 상극: 나쁨
        break;
      case ElementRelationship.NEUTRAL:
        score += 10; // 중립: 약간 좋음
        break;
    }

    // 2. Complement lacking elements
    const complementsLacking = this.complementsLackingElements(
      [char1.element, char2.element],
      sajuResult.lackingElements
    );

    if (complementsLacking) {
      score += 25; // Major bonus for addressing saju deficiencies
    }

    // 3. Strengthen favorable elements (yongsin)
    const strengthensFavorable = this.strengthensFavorableElements(
      [char1.element, char2.element],
      sajuResult.favorableElements
    );

    if (strengthensFavorable) {
      score += 20; // Bonus for enhancing yongsin
    }

    // 4. Element distribution balance
    const distribution = candidate.elementDistribution;
    const balanceScore = this.evaluateBalance(distribution);
    score += balanceScore; // 0-20 points

    // 5. Avoid excessive same element
    if (char1.element === char2.element) {
      const count = sajuResult.elementCounts[char1.element];
      if (count > 2) {
        score -= 15; // Penalty for making imbalance worse
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const { char1, char2 } = candidate;
    const relationship = getElementRelationship(char1.element, char2.element);

    const parts: string[] = [];

    // Relationship explanation
    if (relationship === ElementRelationship.PRODUCING) {
      parts.push(
        `${char1.element}(${char1.character})와 ${char2.element}(${char2.character})은 ` +
        `상생 관계로 매우 조화로움`
      );
    } else if (relationship === ElementRelationship.CONTROLLING) {
      parts.push(
        `${char1.element}과 ${char2.element}은 상극 관계로 조화 부족`
      );
    }

    // Saju complement
    const complementsLacking = this.complementsLackingElements(
      [char1.element, char2.element],
      context.sajuResult.lackingElements
    );

    if (complementsLacking) {
      parts.push(
        `사주에서 부족한 ${context.sajuResult.lackingElements.join(', ')} 오행을 보완`
      );
    }

    return parts.join('. ') + '.';
  }

  private complementsLackingElements(
    nameElements: Element[],
    lacking: Element[]
  ): boolean {
    return lacking.some(elem => nameElements.includes(elem));
  }

  private strengthensFavorableElements(
    nameElements: Element[],
    favorable: Element[]
  ): boolean {
    // Check if name elements produce or match favorable elements
    return nameElements.some(nameElem =>
      favorable.some(favElem =>
        nameElem === favElem ||
        getProducingElement(nameElem) === favElem
      )
    );
  }

  private evaluateBalance(distribution: Record<Element, number>): number {
    // Calculate variance - lower is better
    const values = Object.values(distribution);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) =>
      sum + Math.pow(val - mean, 2), 0
    ) / values.length;

    // Convert to score: 0 variance = 20 points, high variance = 0 points
    return Math.max(0, 20 - variance * 5);
  }
}
```

### 6.2 Yin-Yang Balance Scorer (20% weight)

```typescript
/**
 * Yin-yang balance scorer - evaluates yin-yang harmony
 *
 * Scoring Logic:
 * - Ideal patterns (양음양, 음양음): 100 points
 * - Good patterns (양양음, 음음양): 80 points
 * - Concerning patterns (양양양, 음음음): 50 points
 * - Bonus: +10 for harmony with last name
 */
class YinYangScorer extends BaseScorer {
  name = 'yinyang-balance';
  weight = 0.20;

  async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { char1, char2 } = candidate;
    const lastNameYinYang = getLastNameYinYang(context.lastNameHanja);

    // Build full pattern
    const pattern = [lastNameYinYang, char1.yinYang, char2.yinYang];
    const patternString = pattern.join('');

    // Evaluate pattern
    let score = this.scorePattern(patternString);

    // Bonus for harmony with last name
    if (this.hasHarmonyWithLastName(pattern)) {
      score += 10;
    }

    return score;
  }

  private scorePattern(pattern: string): number {
    // Ideal patterns: perfect balance
    const idealPatterns = ['양음양', '음양음'];
    if (idealPatterns.includes(pattern)) {
      return 100;
    }

    // Good patterns: acceptable balance
    const goodPatterns = ['양양음', '음음양', '양음음', '음양양'];
    if (goodPatterns.includes(pattern)) {
      return 80;
    }

    // Concerning patterns: all same
    const concernPatterns = ['양양양', '음음음'];
    if (concernPatterns.includes(pattern)) {
      return 50;
    }

    // Default
    return 70;
  }

  private hasHarmonyWithLastName(pattern: YinYang[]): boolean {
    // Harmony: last name differs from both first name characters
    const lastName = pattern[0];
    const firstName1 = pattern[1];
    const firstName2 = pattern[2];

    return (lastName !== firstName1 && lastName !== firstName2);
  }

  generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const lastNameYinYang = getLastNameYinYang(context.lastNameHanja);
    const pattern = [
      lastNameYinYang,
      candidate.char1.yinYang,
      candidate.char2.yinYang
    ].join('');

    if (score >= 90) {
      return `음양 배치가 ${pattern}로 이상적인 조화를 이룸`;
    } else if (score >= 80) {
      return `음양 배치가 ${pattern}로 양호한 균형`;
    } else {
      return `음양 배치가 ${pattern}로 한쪽으로 치우침`;
    }
  }
}
```

### 6.3 Numerology Scorer (20% weight)

```typescript
/**
 * Numerology (81수리) scorer - evaluates four grids
 *
 * Scoring Logic:
 * - Calculate 4 grids: 원격, 형격, 이격, 정격
 * - Each grid scored by fortune: 대길=100, 길=80, 평=60, 흉=40, 대흉=20
 * - Overall score = average of 4 grid scores
 * - Bonus: +10 if 3+ grids are auspicious
 */
class NumerologyScorer extends BaseScorer {
  name = 'numerology';
  weight = 0.20;

  async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const fourGrids = calculateFourGrids(
      candidate,
      context.lastNameStrokes
    );

    // Score each grid
    const gridScores = {
      wonGyeok: this.scoreGrid(fourGrids.wonGyeok),
      hyeongGyeok: this.scoreGrid(fourGrids.hyeongGyeok),
      iGyeok: this.scoreGrid(fourGrids.iGyeok),
      jeongGyeok: this.scoreGrid(fourGrids.jeongGyeok),
    };

    // Calculate average
    const average = Object.values(gridScores).reduce((a, b) => a + b, 0) / 4;

    // Bonus for multiple auspicious grids
    const auspiciousCount = Object.values(fourGrids).filter(
      grid => grid.fortune === '대길' || grid.fortune === '길'
    ).length;

    const bonus = auspiciousCount >= 3 ? 10 : 0;

    return Math.min(100, average + bonus);
  }

  private scoreGrid(grid: NumerologyGrid): number {
    switch (grid.fortune) {
      case '대길': return 100;
      case '길': return 80;
      case '평': return 60;
      case '흉': return 40;
      case '대흉': return 20;
      default: return 50;
    }
  }

  generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const fourGrids = calculateFourGrids(
      candidate,
      context.lastNameStrokes
    );

    const auspicious = Object.entries(fourGrids)
      .filter(([_, grid]) => grid.fortune === '대길' || grid.fortune === '길')
      .map(([name, _]) => this.translateGridName(name));

    if (auspicious.length >= 3) {
      return `${auspicious.join(', ')} 등 ${auspicious.length}개 격이 길수로 매우 좋음`;
    } else if (auspicious.length >= 2) {
      return `${auspicious.join(', ')} 2개 격이 길수로 양호함`;
    } else {
      return `수리 배치가 보통 수준이며 개선 여지 있음`;
    }
  }

  private translateGridName(name: string): string {
    const map: Record<string, string> = {
      wonGyeok: '원격(초년운)',
      hyeongGyeok: '형격(청장년운)',
      iGyeok: '이격(중말년운)',
      jeongGyeok: '정격(말년운)',
    };
    return map[name] || name;
  }
}

/**
 * Calculate four grids numerology
 */
function calculateFourGrids(
  candidate: NameCandidate,
  lastNameStrokes: number
): FourGridsAnalysis {
  const char1Strokes = candidate.char1.strokes;
  const char2Strokes = candidate.char2.strokes;

  // 원격 (초년운): 이름 전체
  const wonGyeok = calculateGrid(char1Strokes + char2Strokes);

  // 형격 (청장년운): 성 + 이름 첫자
  const hyeongGyeok = calculateGrid(lastNameStrokes + char1Strokes);

  // 이격 (중말년운): 이름 두 자
  const iGyeok = calculateGrid(char1Strokes + char2Strokes);

  // 정격 (말년운): 성 + 이름 끝자
  const jeongGyeok = calculateGrid(lastNameStrokes + char2Strokes);

  return { wonGyeok, hyeongGyeok, iGyeok, jeongGyeok };
}

function calculateGrid(strokes: number): NumerologyGrid {
  const mod81 = strokes % 81 || 81;
  const interpretation = NUMEROLOGY_81_MAP[mod81];

  return {
    strokes,
    mod81,
    fortune: interpretation.fortune,
    score: scoreFromFortune(interpretation.fortune),
    meaning: interpretation.meaning,
  };
}
```

### 6.4 Meaning Harmony Scorer (20% weight)

```typescript
/**
 * Meaning harmony scorer - evaluates semantic compatibility
 *
 * Scoring Logic:
 * - Individual quality: Based on character fortune, popularity (40%)
 * - Meaning compatibility: Semantic coherence (30%)
 * - Cultural appropriateness: No negative connotations (30%)
 */
class MeaningScorer extends BaseScorer {
  name = 'meaning-harmony';
  weight = 0.20;

  async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { char1, char2 } = candidate;

    // 1. Individual character quality (40%)
    const char1Quality = this.scoreCharacterQuality(char1);
    const char2Quality = this.scoreCharacterQuality(char2);
    const averageQuality = (char1Quality + char2Quality) / 2;
    const qualityScore = averageQuality * 0.4;

    // 2. Meaning compatibility (30%)
    const compatibility = this.scoreMeaningCompatibility(char1, char2);
    const compatibilityScore = compatibility * 0.3;

    // 3. Cultural appropriateness (30%)
    const appropriateness = this.scoreCulturalAppropriateness(char1, char2);
    const appropriatenessScore = appropriateness * 0.3;

    return qualityScore + compatibilityScore + appropriatenessScore;
  }

  private scoreCharacterQuality(char: HanjaDict): number {
    let score = 50; // Base score

    // Fortune contribution
    if (char.fortune === '대길') score += 30;
    else if (char.fortune === '길') score += 20;
    else if (char.fortune === '평') score += 10;
    // 흉: no bonus

    // Popularity contribution (normalized to 0-20)
    const popularityScore = Math.min(20, (char.nameFrequency || 0) / 50);
    score += popularityScore;

    return score;
  }

  private scoreMeaningCompatibility(
    char1: HanjaDict,
    char2: HanjaDict
  ): number {
    let score = 70; // Base compatibility

    // Check for thematic coherence
    const categories1 = new Set(char1.category || []);
    const categories2 = new Set(char2.category || []);

    // Shared categories = thematic coherence
    const sharedCategories = [...categories1].filter(c =>
      categories2.has(c)
    );

    if (sharedCategories.length > 0) {
      score += 20; // Bonus for coherent theme
    }

    // Check for semantic conflict
    const hasConflict = this.checkSemanticConflict(
      char1.meaning,
      char2.meaning
    );

    if (hasConflict) {
      score -= 30; // Penalty for conflicting meanings
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreCulturalAppropriateness(
    char1: HanjaDict,
    char2: HanjaDict
  ): number {
    let score = 90; // Assume appropriate unless flagged

    // Check against negative connotation list
    const negativeWords = ['死', '病', '貧', '敗', '災', '惡'];

    if (negativeWords.includes(char1.character)) {
      score -= 50;
    }
    if (negativeWords.includes(char2.character)) {
      score -= 50;
    }

    // Check review status
    if (char1.review === 'needs_review' || char2.review === 'needs_review') {
      score -= 20;
    }

    return Math.max(0, score);
  }

  private checkSemanticConflict(meaning1?: string, meaning2?: string): boolean {
    if (!meaning1 || !meaning2) return false;

    // Define conflicting pairs
    const conflicts = [
      ['밝다', '어둡다'],
      ['크다', '작다'],
      ['높다', '낮다'],
      ['강하다', '약하다'],
      // Add more as needed
    ];

    return conflicts.some(([word1, word2]) =>
      (meaning1.includes(word1) && meaning2.includes(word2)) ||
      (meaning1.includes(word2) && meaning2.includes(word1))
    );
  }

  generateExplanation(
    candidate: NameCandidate,
    score: number
  ): string {
    const { char1, char2 } = candidate;

    if (score >= 85) {
      return `${char1.meaning}와 ${char2.meaning}의 의미가 조화롭고 긍정적`;
    } else if (score >= 70) {
      return `의미가 무난하며 특별한 문제 없음`;
    } else {
      return `의미 조화에 다소 개선 여지 있음`;
    }
  }
}
```

---

## 7. Performance Optimization

### 7.1 Database Optimization

```typescript
/**
 * Optimized database queries with strategic indexing
 */

// Schema indexes (already in place)
// - hanja_dict.element (B-tree)
// - hanja_dict.strokes (B-tree)
// - hanja_dict.yinYang (B-tree)
// - hanja_dict.nameFrequency (B-tree, DESC)
// - hanja_dict.usageFrequency (B-tree, DESC)

/**
 * Batch query optimization
 */
class OptimizedHanjaRepository extends HanjaRepository {

  /**
   * Fetch multiple characters by IDs in single query
   */
  async findManyByIds(ids: string[]): Promise<Map<string, HanjaDict>> {
    const characters = await this.prisma.hanjaDict.findMany({
      where: { id: { in: ids } },
    });

    return new Map(characters.map(c => [c.id, c]));
  }

  /**
   * Pre-filtered query with compound conditions
   */
  async findForNaming(criteria: {
    elements: Element[];
    minStrokes: number;
    maxStrokes: number;
    gender?: string;
    minPopularity?: number;
  }): Promise<HanjaDict[]> {

    // Single query with multiple conditions
    return this.prisma.hanjaDict.findMany({
      where: {
        element: { in: criteria.elements },
        strokes: {
          gte: criteria.minStrokes,
          lte: criteria.maxStrokes,
        },
        ...(criteria.gender && { gender: criteria.gender }),
        ...(criteria.minPopularity && {
          nameFrequency: { gte: criteria.minPopularity },
        }),
      },
      orderBy: [
        { nameFrequency: 'desc' },
        { usageFrequency: 'desc' },
      ],
      take: 1000, // Limit for performance
    });
  }

  /**
   * Cached popular characters query
   */
  @cache('popular-chars', 3600) // 1 hour cache
  async getPopularForElement(element: Element): Promise<HanjaDict[]> {
    return this.prisma.hanjaDict.findMany({
      where: {
        element,
        nameFrequency: { gte: 10 },
      },
      orderBy: { nameFrequency: 'desc' },
      take: 100,
    });
  }
}
```

### 7.2 Caching Strategy

```typescript
/**
 * Multi-layer caching for performance
 */
class NamingCache {
  constructor(
    private redis: Redis,
    private memory: LRUCache<string, any>
  ) {}

  /**
   * Layer 1: Memory cache (fastest, smallest)
   * - Top 100 most common saju configurations
   * - Popular character lookups
   * - TTL: 5 minutes
   */
  async getFromMemory<T>(key: string): Promise<T | null> {
    return this.memory.get(key) || null;
  }

  /**
   * Layer 2: Redis cache (fast, larger)
   * - All naming results
   * - Character metadata
   * - TTL: 1 hour for results, 24 hours for metadata
   */
  async getFromRedis<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Comprehensive cache key generation
   */
  generateCacheKey(input: NamingInput, config: ResolvedConfig): string {
    const parts = [
      'naming',
      input.lastName,
      this.hashSaju(input.sajuResult),
      input.gender || 'any',
      this.hashPreferences(input.preferences),
      config.topN,
      this.hashWeights(config.weights),
    ];

    return parts.join(':');
  }

  private hashSaju(saju: SajuResult): string {
    // Create consistent hash of saju data
    const key = [
      saju.dayMaster.element,
      ...Object.values(saju.elementCounts).map(c => c.toFixed(1)),
      saju.yongsin.primary,
      saju.yongsin.secondary || '',
    ].join('-');

    return createHash('md5').update(key).digest('hex').substring(0, 8);
  }

  /**
   * Cache warming for common queries
   */
  async warmCache(): Promise<void> {
    // Pre-compute results for most common scenarios
    const commonLastNames = ['김', '이', '박', '최', '정'];
    const commonYongsin = [Element.WATER, Element.WOOD, Element.FIRE];

    for (const lastName of commonLastNames) {
      for (const yongsin of commonYongsin) {
        const mockInput = this.createMockInput(lastName, yongsin);
        await this.generateAndCache(mockInput);
      }
    }
  }
}
```

### 7.3 Parallel Processing

```typescript
/**
 * Parallel batch processing for candidates
 */
class BatchProcessor {
  constructor(
    private readonly batchSize: number = 100,
    private readonly maxConcurrency: number = 4
  ) {}

  /**
   * Process candidates in parallel batches
   */
  async processCandidates(
    candidates: NameCandidate[],
    processor: (candidate: NameCandidate) => Promise<ScoredCandidate>
  ): Promise<ScoredCandidate[]> {

    const results: ScoredCandidate[] = [];

    // Split into batches
    const batches = this.createBatches(candidates, this.batchSize);

    // Process batches with limited concurrency
    for (let i = 0; i < batches.length; i += this.maxConcurrency) {
      const batchGroup = batches.slice(i, i + this.maxConcurrency);

      const batchResults = await Promise.all(
        batchGroup.map(batch => this.processBatch(batch, processor))
      );

      results.push(...batchResults.flat());
    }

    return results;
  }

  private async processBatch(
    batch: NameCandidate[],
    processor: (candidate: NameCandidate) => Promise<ScoredCandidate>
  ): Promise<ScoredCandidate[]> {
    return Promise.all(batch.map(processor));
  }

  private createBatches<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }
}
```

### 7.4 Performance Monitoring

```typescript
/**
 * Performance monitoring and optimization
 */
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Track operation timing
   */
  async track<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.recordMetric(operation, duration);

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation: ${operation} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric(`${operation}:error`, duration);
      throw error;
    }
  }

  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const values = this.metrics.get(operation)!;
    values.push(duration);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation: string): {
    count: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(operation);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}
```

### 7.5 Optimization Strategy Summary

| Optimization | Impact | Complexity | Priority |
|--------------|--------|------------|----------|
| Database indexes | 10-100x faster queries | Low | HIGH |
| Redis caching | 50-500x faster (cache hit) | Medium | HIGH |
| Batch processing | 2-4x throughput | Medium | HIGH |
| Pre-filtering | 100x fewer candidates | Low | HIGH |
| Parallel scoring | 2-4x faster | Medium | MEDIUM |
| Memory caching | 10-50x faster (hot data) | Low | MEDIUM |
| Query optimization | 2-10x faster | Medium | MEDIUM |
| Early termination | 2-5x faster (avg case) | Low | LOW |

**Performance Targets**:
- Cold request (no cache): <5 seconds
- Warm request (partial cache): <2 seconds
- Hot request (full cache): <500ms
- Throughput: 100+ concurrent users

---

## 8. Configuration & Extensibility

### 8.1 Configuration System

```typescript
/**
 * Centralized configuration management
 */
export class NamingConfig {
  private static instance: NamingConfig;
  private config: ConfigSchema;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): NamingConfig {
    if (!this.instance) {
      this.instance = new NamingConfig();
    }
    return this.instance;
  }

  /**
   * Load configuration from environment and defaults
   */
  private loadConfig(): ConfigSchema {
    return {
      // Scoring weights
      weights: {
        elementHarmony: parseFloat(env.WEIGHT_ELEMENT || '0.40'),
        yinYangBalance: parseFloat(env.WEIGHT_YINYANG || '0.20'),
        numerology: parseFloat(env.WEIGHT_NUMEROLOGY || '0.20'),
        meaningHarmony: parseFloat(env.WEIGHT_MEANING || '0.20'),
      },

      // Performance tuning
      performance: {
        maxCandidates: parseInt(env.MAX_CANDIDATES || '1000'),
        batchSize: parseInt(env.BATCH_SIZE || '100'),
        parallelism: parseInt(env.PARALLELISM || '4'),
        cacheEnabled: env.CACHE_ENABLED !== 'false',
        cacheTTL: parseInt(env.CACHE_TTL || '3600'),
      },

      // Feature flags
      features: {
        enableEarlyTermination: true,
        enableDiversityFilter: true,
        enableMeaningAnalysis: true,
        enableABTesting: env.AB_TESTING_ENABLED === 'true',
      },

      // Quality thresholds
      quality: {
        minOverallScore: parseInt(env.MIN_SCORE || '60'),
        minConfidence: parseFloat(env.MIN_CONFIDENCE || '0.7'),
        diversityThreshold: parseFloat(env.DIVERSITY || '0.1'),
      },
    };
  }

  /**
   * Get resolved config for request
   */
  getResolvedConfig(input: NamingInput): ResolvedConfig {
    // Start with defaults
    let config = { ...DEFAULT_CONFIG };

    // Apply environment config
    config = this.mergeConfig(config, this.config);

    // Apply user preferences
    if (input.config?.scoringWeights) {
      config.weights = input.config.scoringWeights;
    }

    if (input.config?.topN) {
      config.topN = input.config.topN;
    }

    // Apply A/B test variant if active
    if (this.config.features.enableABTesting) {
      const variant = this.getActiveVariant(input);
      if (variant) {
        config = this.mergeConfig(config, variant.config);
        config.experimentId = variant.experimentId;
        config.variantId = variant.variantId;
      }
    }

    // Validate and normalize
    this.validateConfig(config);

    return config;
  }

  private validateConfig(config: ResolvedConfig): void {
    // Ensure weights sum to 1.0
    const weightSum = Object.values(config.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      throw new Error(`Scoring weights must sum to 1.0, got ${weightSum}`);
    }

    // Validate ranges
    if (config.topN < 1 || config.topN > 100) {
      throw new Error('topN must be between 1 and 100');
    }

    if (config.diversityThreshold < 0 || config.diversityThreshold > 1) {
      throw new Error('diversityThreshold must be between 0 and 1');
    }
  }
}
```

### 8.2 Adding New Scoring Criteria

```typescript
/**
 * Example: Adding a new "Sound Harmony" scorer
 */

// Step 1: Define scorer class
class SoundHarmonyScorer extends BaseScorer {
  name = 'sound-harmony';
  weight = 0.15; // New weight (adjust others to sum to 1.0)

  async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { char1, char2 } = candidate;

    // Implement sound harmony logic
    const reading1 = char1.koreanReading || '';
    const reading2 = char2.koreanReading || '';

    let score = 50;

    // Check for smooth consonant transitions
    if (this.hasSmoothTransition(reading1, reading2)) {
      score += 30;
    }

    // Check for vowel harmony
    if (this.hasVowelHarmony(reading1, reading2)) {
      score += 20;
    }

    return score;
  }

  generateExplanation(candidate: NameCandidate, score: number): string {
    if (score >= 80) {
      return '발음이 매우 자연스럽고 부드러움';
    } else if (score >= 60) {
      return '발음이 무난함';
    } else {
      return '발음이 다소 어색할 수 있음';
    }
  }

  private hasSmoothTransition(r1: string, r2: string): boolean {
    // Implement phonetic analysis
    return true; // Placeholder
  }

  private hasVowelHarmony(r1: string, r2: string): boolean {
    // Implement vowel harmony check
    return true; // Placeholder
  }
}

// Step 2: Register scorer in pipeline
const scoringPipeline = new ScoringPipeline([
  new ElementScorer(),      // 35% (adjusted)
  new YinYangScorer(),      // 20%
  new NumerologyScorer(),   // 15% (adjusted)
  new MeaningScorer(),      // 15% (adjusted)
  new SoundHarmonyScorer(), // 15% (new!)
]);

// Step 3: Update types
interface DetailedScores {
  elementHarmony: DetailedScore;
  yinYangBalance: DetailedScore;
  numerology: DetailedScore;
  meaningHarmony: DetailedScore;
  soundHarmony: DetailedScore; // Add new field
}

// Step 4: Update config
interface ScoringWeights {
  elementHarmony: number;
  yinYangBalance: number;
  numerology: number;
  meaningHarmony: number;
  soundHarmony: number; // Add new weight
}
```

### 8.3 A/B Testing Support

```typescript
/**
 * A/B testing framework for algorithm improvements
 */
class ABTestingManager {
  private experiments: Map<string, ExperimentConfig> = new Map();

  /**
   * Define new experiment
   */
  createExperiment(config: ExperimentConfig): void {
    // Validate variant weights sum to 1.0
    const weightSum = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      throw new Error('Variant weights must sum to 1.0');
    }

    this.experiments.set(config.experimentId, config);
  }

  /**
   * Get variant for user
   */
  getVariant(
    experimentId: string,
    userId: string
  ): ExperimentConfig['variants'][0] | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    // Check if experiment is active
    const now = new Date();
    if (now < experiment.startDate ||
        (experiment.endDate && now > experiment.endDate)) {
      return null;
    }

    // Consistent hash-based assignment
    const hash = this.hashUserId(userId, experimentId);
    let cumulative = 0;

    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (hash < cumulative) {
        return variant;
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  /**
   * Track experiment metrics
   */
  async trackMetric(
    experimentId: string,
    variantId: string,
    metric: string,
    value: number
  ): Promise<void> {
    await this.metricsStore.record({
      experimentId,
      variantId,
      metric,
      value,
      timestamp: new Date(),
    });
  }

  private hashUserId(userId: string, experimentId: string): number {
    const hash = createHash('md5')
      .update(`${userId}:${experimentId}`)
      .digest('hex');

    // Convert to number between 0 and 1
    return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  }
}

// Example: Test new element harmony weight
abTesting.createExperiment({
  experimentId: 'element-weight-test',
  variants: [
    {
      variantId: 'control',
      weight: 0.5,
      config: {
        weights: {
          elementHarmony: 0.40, // Current
          yinYangBalance: 0.20,
          numerology: 0.20,
          meaningHarmony: 0.20,
        },
      },
    },
    {
      variantId: 'increased-element',
      weight: 0.5,
      config: {
        weights: {
          elementHarmony: 0.50, // Increased
          yinYangBalance: 0.17,
          numerology: 0.17,
          meaningHarmony: 0.16,
        },
      },
    },
  ],
  startDate: new Date('2025-10-15'),
  endDate: new Date('2025-11-15'),
  metrics: ['user_satisfaction', 'adoption_rate', 'avg_score'],
});
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
/**
 * Unit tests for scorers
 */
describe('ElementScorer', () => {
  let scorer: ElementScorer;
  let context: ScoringContext;

  beforeEach(() => {
    scorer = new ElementScorer();
    context = createMockContext();
  });

  describe('Production cycle (상생)', () => {
    it('should give high score for water→wood combination', async () => {
      const candidate = createCandidate({
        char1: { element: Element.WATER },
        char2: { element: Element.WOOD },
      });

      const score = await scorer.calculateRawScore(candidate, context);
      expect(score).toBeGreaterThan(75);
    });

    it('should explain production relationship', async () => {
      const candidate = createCandidate({
        char1: { element: Element.WATER, character: '水' },
        char2: { element: Element.WOOD, character: '木' },
      });

      const result = await scorer.score(candidate, context);
      expect(result.explanation).toContain('상생');
    });
  });

  describe('Control cycle (상극)', () => {
    it('should give low score for water×fire combination', async () => {
      const candidate = createCandidate({
        char1: { element: Element.WATER },
        char2: { element: Element.FIRE },
      });

      const score = await scorer.calculateRawScore(candidate, context);
      expect(score).toBeLessThan(60);
    });
  });

  describe('Saju complement', () => {
    it('should give bonus for complementing lacking elements', async () => {
      context.sajuResult.lackingElements = [Element.WATER];

      const candidate = createCandidate({
        char1: { element: Element.WATER },
        char2: { element: Element.WOOD },
      });

      const score = await scorer.calculateRawScore(candidate, context);
      expect(score).toBeGreaterThan(80);
    });
  });
});

describe('NumerologyScorer', () => {
  it('should calculate four grids correctly', async () => {
    const candidate = createCandidate({
      char1: { strokes: 8 },
      char2: { strokes: 10 },
    });

    const context = createMockContext({ lastNameStrokes: 7 });

    const result = await new NumerologyScorer().score(candidate, context);

    expect(result.subScores).toHaveProperty('wonGyeok');
    expect(result.subScores).toHaveProperty('hyeongGyeok');
    expect(result.subScores).toHaveProperty('iGyeok');
    expect(result.subScores).toHaveProperty('jeongGyeok');
  });

  it('should give high score for multiple auspicious grids', async () => {
    // Create candidate with known auspicious strokes
    const candidate = createCandidate({
      char1: { strokes: 8 },  // 8 = 길
      char2: { strokes: 5 },  // 5 = 대길
    });

    const score = await new NumerologyScorer().calculateRawScore(
      candidate,
      createMockContext({ lastNameStrokes: 8 })
    );

    expect(score).toBeGreaterThan(80);
  });
});
```

### 9.2 Integration Tests

```typescript
/**
 * Integration tests for full pipeline
 */
describe('Naming Pipeline', () => {
  let orchestrator: NamingOrchestrator;

  beforeEach(async () => {
    orchestrator = new NamingOrchestrator(
      new HanjaRepository(prisma),
      new NamingCache(redis, memoryCache)
    );
  });

  it('should generate 30 recommendations within 5 seconds', async () => {
    const input = createTestInput();

    const start = Date.now();
    const results = await orchestrator.generateNames(input);
    const duration = Date.now() - start;

    expect(results).toHaveLength(30);
    expect(duration).toBeLessThan(5000);
  });

  it('should return results sorted by score', async () => {
    const input = createTestInput();
    const results = await orchestrator.generateNames(input);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].scores.overall).toBeGreaterThanOrEqual(
        results[i].scores.overall
      );
    }
  });

  it('should respect diversity filtering', async () => {
    const input = createTestInput();
    const results = await orchestrator.generateNames(input);

    // Check no two results share both characters
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const similarity =
          (results[i].characters[0] === results[j].characters[0] ? 0.5 : 0) +
          (results[i].characters[1] === results[j].characters[1] ? 0.5 : 0);

        expect(similarity).toBeLessThan(1.0);
      }
    }
  });

  it('should use cache on repeated requests', async () => {
    const input = createTestInput();

    // First request (cold)
    const start1 = Date.now();
    const results1 = await orchestrator.generateNames(input);
    const duration1 = Date.now() - start1;

    // Second request (warm)
    const start2 = Date.now();
    const results2 = await orchestrator.generateNames(input);
    const duration2 = Date.now() - start2;

    expect(results1).toEqual(results2);
    expect(duration2).toBeLessThan(duration1 / 2); // At least 2x faster
  });
});
```

### 9.3 Performance Tests

```typescript
/**
 * Performance benchmarks
 */
describe('Performance Benchmarks', () => {
  it('should handle 100 concurrent requests', async () => {
    const promises = Array.from({ length: 100 }, () =>
      orchestrator.generateNames(createTestInput())
    );

    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;

    const avgDuration = duration / 100;
    expect(avgDuration).toBeLessThan(1000); // Avg <1s with caching
  });

  it('should scale linearly with candidate count', async () => {
    const configs = [
      { maxCandidates: 100, expected: 500 },
      { maxCandidates: 500, expected: 2000 },
      { maxCandidates: 1000, expected: 4000 },
    ];

    for (const { maxCandidates, expected } of configs) {
      const input = createTestInput({ config: { maxCandidates } });

      const start = Date.now();
      await orchestrator.generateNames(input);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(expected);
    }
  });
});
```

### 9.4 Quality Validation Tests

```typescript
/**
 * Quality validation with expert review
 */
describe('Quality Validation', () => {
  const expertReviews = loadExpertReviews(); // Pre-reviewed test cases

  it('should match expert ratings for known names', async () => {
    let matches = 0;

    for (const review of expertReviews) {
      const results = await orchestrator.generateNames(review.input);
      const topResult = results[0];

      // Allow ±10 points tolerance
      if (Math.abs(topResult.scores.overall - review.expertScore) <= 10) {
        matches++;
      }
    }

    const accuracy = matches / expertReviews.length;
    expect(accuracy).toBeGreaterThan(0.85); // 85%+ accuracy
  });

  it('should rank expert-approved names in top 10', async () => {
    let topTenHits = 0;

    for (const review of expertReviews) {
      if (review.expertApproved) {
        const results = await orchestrator.generateNames(review.input);
        const approved = results.find(r =>
          r.firstNameHanja === review.approvedName
        );

        if (approved && approved.scores.rank <= 10) {
          topTenHits++;
        }
      }
    }

    const coverage = topTenHits / expertReviews.filter(r => r.expertApproved).length;
    expect(coverage).toBeGreaterThan(0.70); // 70%+ in top 10
  });
});
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Core infrastructure and data access layer

- [ ] Set up module structure and directory organization
- [ ] Implement base types and interfaces
- [ ] Create `BaseScorer` abstract class
- [ ] Implement `HanjaRepository` with optimized queries
- [ ] Set up Redis caching layer
- [ ] Write unit tests for utilities

**Deliverables**:
- Complete type definitions
- Working repository with tests
- Basic caching implementation

### Phase 2: Core Algorithms (Week 3-4)
**Goal**: Implement all scoring algorithms

- [ ] Implement `ElementScorer` with full logic
- [ ] Implement `YinYangScorer`
- [ ] Implement `NumerologyScorer` with 81수리 interpretations
- [ ] Implement `MeaningScorer`
- [ ] Create `ScoringPipeline` coordinator
- [ ] Write comprehensive unit tests for each scorer

**Deliverables**:
- All 4 scorers fully functional
- 90%+ test coverage for scorers
- Documented scoring logic

### Phase 3: Candidate Generation (Week 5-6)
**Goal**: Intelligent filtering and candidate generation

- [ ] Implement `CharacterFilter` with element-based filtering
- [ ] Implement stroke-based filtering logic
- [ ] Create `CombinationBuilder` for pairing
- [ ] Implement `BatchProcessor` for parallel processing
- [ ] Add early termination optimization
- [ ] Write integration tests

**Deliverables**:
- Working candidate generator
- Performance <3s for 1000 candidates
- Integration tests passing

### Phase 4: Orchestration & Ranking (Week 7)
**Goal**: Complete end-to-end pipeline

- [ ] Implement `NamingOrchestrator`
- [ ] Create `ResultRanker` with diversity filtering
- [ ] Implement `RecommendationBuilder`
- [ ] Add cache integration
- [ ] Write end-to-end integration tests

**Deliverables**:
- Complete working pipeline
- Top 30 results in <5s (cold)
- All integration tests passing

### Phase 5: Configuration & Extensibility (Week 8)
**Goal**: Configuration system and extensibility

- [ ] Implement `NamingConfig` class
- [ ] Add environment variable support
- [ ] Create preset configurations
- [ ] Implement A/B testing framework
- [ ] Document extension patterns

**Deliverables**:
- Flexible configuration system
- A/B testing ready
- Extension documentation

### Phase 6: Performance Optimization (Week 9-10)
**Goal**: Meet performance targets

- [ ] Optimize database queries with profiling
- [ ] Implement cache warming
- [ ] Add performance monitoring
- [ ] Tune batch sizes and parallelism
- [ ] Load testing with 100+ concurrent users
- [ ] Fix performance bottlenecks

**Deliverables**:
- <5s cold, <2s warm, <500ms hot
- 100+ concurrent users supported
- Performance metrics dashboard

### Phase 7: Quality Validation (Week 11)
**Goal**: Validate with expert review

- [ ] Collect expert-reviewed test cases (50+)
- [ ] Run quality validation tests
- [ ] Tune scoring weights based on feedback
- [ ] Adjust algorithm parameters
- [ ] Document validation results

**Deliverables**:
- 85%+ expert validation accuracy
- Tuned scoring weights
- Quality metrics report

### Phase 8: Production Readiness (Week 12)
**Goal**: Deploy to production

- [ ] Security audit
- [ ] Error handling and logging
- [ ] Monitoring and alerting
- [ ] Documentation (API, architecture, maintenance)
- [ ] Training for support team
- [ ] Gradual rollout plan

**Deliverables**:
- Production-ready system
- Complete documentation
- Monitoring dashboard
- Rollout plan

---

## Appendix

### A. Element Relationships Reference

```typescript
/**
 * Five elements production cycle (상생)
 */
const PRODUCTION_CYCLE: Record<Element, Element> = {
  [Element.WOOD]: Element.FIRE,    // 목생화
  [Element.FIRE]: Element.EARTH,   // 화생토
  [Element.EARTH]: Element.METAL,  // 토생금
  [Element.METAL]: Element.WATER,  // 금생수
  [Element.WATER]: Element.WOOD,   // 수생목
};

/**
 * Five elements control cycle (상극)
 */
const CONTROL_CYCLE: Record<Element, Element> = {
  [Element.WOOD]: Element.EARTH,   // 목극토
  [Element.EARTH]: Element.WATER,  // 토극수
  [Element.WATER]: Element.FIRE,   // 수극화
  [Element.FIRE]: Element.METAL,   // 화극금
  [Element.METAL]: Element.WOOD,   // 금극목
};

/**
 * Determine relationship between two elements
 */
function getElementRelationship(from: Element, to: Element): ElementRelationship {
  if (from === to) {
    return ElementRelationship.SAME;
  }

  if (PRODUCTION_CYCLE[from] === to) {
    return ElementRelationship.PRODUCING;
  }

  if (CONTROL_CYCLE[from] === to) {
    return ElementRelationship.CONTROLLING;
  }

  if (PRODUCTION_CYCLE[to] === from) {
    return ElementRelationship.WEAKENING;
  }

  return ElementRelationship.NEUTRAL;
}
```

### B. 81 Numerology Interpretations

See `NUMEROLOGY_81_MAP` constant in `numerology-analyzer.ts` for complete mappings.

Key auspicious numbers: 1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 21, 23, 24, 31, 32, 33, 41, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81

Key inauspicious numbers: 2, 4, 10, 20, 34, 40, 42, 43, 44, 50, 54, 56, 59, 60, 62, 64, 66, 69, 70, 76, 78

### C. Sample API Usage

```typescript
// Example: Generate names for a baby
const sajuCalculator = new SajuCalculator();
const sajuResult = sajuCalculator.calculate(
  new Date(2024, 3, 15), // Birth date
  "14:30",               // Birth time
  false                  // Solar calendar
);

const orchestrator = new NamingOrchestrator(
  new HanjaRepository(prisma),
  new NamingCache(redis, memoryCache)
);

const recommendations = await orchestrator.generateNames({
  sajuResult,
  lastName: "김",
  lastNameHanja: "金",
  gender: "M",
  preferences: {
    avoidCharacters: ["死", "病"],
    preferredElements: [Element.WATER, Element.WOOD],
    meaningKeywords: ["지혜", "용기"],
  },
  config: {
    topN: 30,
    scoringWeights: PRESET_CONFIGS.balanced,
  },
});

// Use recommendations
console.log(`Top recommendation: ${recommendations[0].fullName}`);
console.log(`Score: ${recommendations[0].scores.overall}/100`);
console.log(`Grade: ${recommendations[0].scores.grade}`);
console.log(`Analysis: ${recommendations[0].analysis.recommendation}`);
```

### D. Database Schema

```sql
-- Key indexes for performance
CREATE INDEX idx_hanja_dict_element ON hanja_dict(element);
CREATE INDEX idx_hanja_dict_strokes ON hanja_dict(strokes);
CREATE INDEX idx_hanja_dict_yinyang ON hanja_dict(yin_yang);
CREATE INDEX idx_hanja_dict_name_freq ON hanja_dict(name_frequency DESC);
CREATE INDEX idx_hanja_dict_usage_freq ON hanja_dict(usage_frequency DESC);

-- Composite index for common query pattern
CREATE INDEX idx_hanja_dict_element_strokes
ON hanja_dict(element, strokes, name_frequency DESC);
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-15 | System Architect | Initial architecture design |

---

**End of Document**
