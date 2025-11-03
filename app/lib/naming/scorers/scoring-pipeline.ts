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
    // Run all scorers in parallel (they're independent)
    const detailedScores = await Promise.all(
      this.scorers.map(scorer => scorer.score(candidate, context))
    );

    // Map scores to named fields based on current 4 scorers
    const [elementHarmony, yinYangBalance, meaningHarmony, linguistic] = detailedScores;

    // Calculate overall score (weighted sum)
    const overall = detailedScores.reduce((sum, score) => sum + score.weightedScore, 0);

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
