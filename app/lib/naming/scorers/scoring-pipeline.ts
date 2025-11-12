/**
 * Scoring Pipeline
 *
 * Coordinates all scorers to calculate comprehensive scores for name candidates.
 * Runs scorers in parallel for performance.
 */

import type { NameCandidate, ScoredCandidate, ScoringContext } from '../types';
import { ElementScorer } from './element-scorer';
import { YinYangScorer } from './yinyang-scorer';
// import { NumerologyScorer } from './numerology-scorer'; // DISABLED: 획수 데이터 신뢰도 문제
import { MeaningScorer } from './meaning-scorer';
import { LinguisticScorer } from './linguistic-scorer';
import type { BaseScorer } from './base-scorer';
import {
  type ScoringMode,
  type ScoringWeights,
  getModeConfiguration,
  calculateHybridWeights,
  applySafetyThreshold,
  HYBRID_MODE,
} from '../types/scoring-mode';

export class ScoringPipeline {
  private scorers: BaseScorer[];

  constructor(scorers?: BaseScorer[]) {
    // Use provided scorers or default scorers
    this.scorers = scorers || [
      new ElementScorer(),      // 30% (reduced from 40%)
      new YinYangScorer(),      // 20%
      // new NumerologyScorer(), // DISABLED: 획수 데이터 부정확 (蕕=12획→18획, 有=12획→6획)
      new MeaningScorer(),      // 20%
      new LinguisticScorer(),   // 30% (NEW: 언어적 자연스러움)
    ];

    // Validate weights sum to 1.0
    this.validateWeights();
  }

  /**
   * Score all candidates in batch
   */
  async scoreAll(
    candidates: NameCandidate[],
    context: ScoringContext
  ): Promise<ScoredCandidate[]> {
    // Process in batches for memory efficiency
    const batchSize = context.config?.batchSize || 100;
    const results: ScoredCandidate[] = [];

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const batchResults = await this.scoreBatch(batch, context);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Score a single batch of candidates in parallel
   */
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

  /**
   * Score a single candidate
   */
  async scoreCandidate(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<ScoredCandidate> {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Get mode configuration
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const mode = context.scoringMode || 'hybrid'; // Default: hybrid
    const modeConfig = getModeConfiguration(mode);

    // Run all scorers in parallel (they're independent)
    const detailedScores = await Promise.all(
      this.scorers.map(scorer => scorer.score(candidate, context))
    );

    // Map scores to named fields based on current 4 scorers
    const [elementHarmony, yinYangBalance, meaningHarmony, linguistic] = detailedScores;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Apply mode-specific weights
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let weights: ScoringWeights;

    if (mode === 'hybrid') {
      // Dynamic weight adjustment based on element score
      weights = calculateHybridWeights(elementHarmony.score);
    } else {
      // Use static weights from mode configuration
      weights = modeConfig.weights;
    }

    // Calculate mode-adjusted weighted scores
    const modeAdjustedScores = {
      element: elementHarmony.score * weights.element,
      yinyang: yinYangBalance.score * weights.yinyang,
      meaning: meaningHarmony.score * weights.meaning,
      linguistic: linguistic.score * weights.linguistic,
      // taboo: handled in filters, not a separate scorer
    };

    // Calculate base score with mode weights
    const baseScore = Object.values(modeAdjustedScores).reduce((sum, score) => sum + score, 0);

    // ====== TIE-BREAKER LOGIC ======
    // 동점 해소: 표면 점수가 같아도 정렬 순위가 달라지도록
    //
    // 1. 이름 사용 빈도 (실제 이름으로 많이 쓰이는 한자 우선)
    const [char1, char2] = candidate.characters;
    const nameFreqBoost =
      ((char1.nameFrequency || 0) + (char2.nameFrequency || 0)) * 0.001; // 0-0.2 범위

    // 2. 일반 사용 빈도 (자주 쓰이는 한자 우선)
    const usageFreqBoost =
      ((char1.usageFrequency || 0) + (char2.usageFrequency || 0)) * 0.0001; // 0-0.02 범위

    // 3. 확정 우선순위 (isGoodForNaming이 true인 한자 우선)
    const qualityBoost =
      (char1.isGoodForNaming ? 0.5 : 0) + (char2.isGoodForNaming ? 0.5 : 0); // 0-1 범위

    // 4. 🆕 획수 기반 미세 조정 (짧은 획수 우선, 0-0.1 범위)
    const strokeBoost =
      ((30 - (char1.strokes || 15)) + (30 - (char2.strokes || 15))) * 0.001; // 0-0.03 범위

    // 5. 🆕 결정론적 tie-breaker (ID 기반, 0-0.01 범위)
    // 빈도 데이터가 없어도 항상 다른 값을 보장
    const idHash = (char1.id + char2.id) % 100;
    const deterministicBoost = idHash * 0.0001; // 0-0.01 범위

    // 최종 점수 = 기본 점수 + tie-breaker (최대 ~1.5점 차이)
    let overall =
      baseScore +
      nameFreqBoost +
      usageFreqBoost +
      qualityBoost +
      strokeBoost +
      deterministicBoost;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Apply safety threshold
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 오행 점수가 기준 미달이면 79.9점으로 제한 (TOP 10 진입 차단)
    overall = applySafetyThreshold(
      overall,
      elementHarmony.score,
      modeConfig.elementThreshold
    );

    // Calculate confidence score
    const confidenceScore = this.calculateConfidence(detailedScores);

    return {
      ...candidate,
      scores: {
        overall: Number(overall.toFixed(1)), // Keep 1 decimal place for better differentiation
        elementHarmony,
        yinYangBalance,
        numerology: null, // DISABLED (획수 데이터 부정확)
        meaningHarmony,
        linguistic, // NEW: 언어적 자연스러움 (같은 음절 반복, 의미 중복)
      },
      confidenceScore,
    };
  }

  /**
   * Calculate confidence score based on score variance
   *
   * High confidence = all scores are similarly high/low
   * Low confidence = scores are very different from each other
   */
  private calculateConfidence(
    scores: Array<{ score: number; weight: number }>
  ): number {
    const rawScores = scores.map(s => s.score);

    // Calculate mean
    const mean = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;

    // Calculate variance
    const variance = rawScores.reduce((sum, score) =>
      sum + Math.pow(score - mean, 2), 0
    ) / rawScores.length;

    // Convert to confidence (lower variance = higher confidence)
    // variance of 0 = 1.0 confidence
    // variance of 2500 (stdev 50) = 0.0 confidence
    const confidence = Math.max(0, 1 - variance / 2500);

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Validate that scorer weights sum to 1.0
   */
  private validateWeights(): void {
    const weightSum = this.scorers.reduce((sum, scorer) => sum + scorer.weight, 0);

    if (Math.abs(weightSum - 1.0) > 0.01) {
      throw new Error(
        `Scorer weights must sum to 1.0, got ${weightSum}. ` +
        `Weights: ${this.scorers.map(s => `${s.name}=${s.weight}`).join(', ')}`
      );
    }
  }

  /**
   * Get all scorers
   */
  getScorers(): BaseScorer[] {
    return this.scorers;
  }

  /**
   * Get scorer by name
   */
  getScorer(name: string): BaseScorer | undefined {
    return this.scorers.find(s => s.name === name);
  }
}
