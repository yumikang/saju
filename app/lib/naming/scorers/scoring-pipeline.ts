/**
 * Scoring Pipeline
 *
 * Coordinates all scorers to calculate comprehensive scores for name candidates.
 * Runs scorers in parallel for performance.
 */

import type { NameCandidate, ScoredCandidate, ScoringContext } from '../types';
import { ElementScorer } from './element-scorer';
import { YinYangScorer } from './yinyang-scorer';
import { NumerologyScorer } from './numerology-scorer';
import { MeaningScorer } from './meaning-scorer';
import type { BaseScorer } from './base-scorer';

export class ScoringPipeline {
  private scorers: BaseScorer[];

  constructor(scorers?: BaseScorer[]) {
    // Use provided scorers or default scorers
    this.scorers = scorers || [
      new ElementScorer(),      // 40%
      new YinYangScorer(),      // 20%
      new NumerologyScorer(),   // 20%
      new MeaningScorer(),      // 20%
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

    // Map scores to named fields
    const [elementHarmony, yinYangBalance, numerology, meaningHarmony] = detailedScores;

    // Calculate overall score (weighted sum)
    const overall =
      elementHarmony.weightedScore +
      yinYangBalance.weightedScore +
      numerology.weightedScore +
      meaningHarmony.weightedScore;

    // Calculate confidence score
    const confidenceScore = this.calculateConfidence(detailedScores);

    return {
      ...candidate,
      scores: {
        overall: Number(overall.toFixed(1)), // Keep 1 decimal place for better differentiation
        elementHarmony,
        yinYangBalance,
        numerology,
        meaningHarmony,
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
