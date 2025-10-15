/**
 * Base Scorer Abstract Class
 *
 * Defines common interface and shared logic for all scorers.
 * Each scorer must implement:
 * - calculateRawScore(): Core scoring logic (0-100)
 * - generateExplanation(): User-friendly explanation
 */

import type { ScoringContext, DetailedScore } from '../types';
import type { NameCandidate } from '../types';

export abstract class BaseScorer {
  /**
   * Scorer name (e.g., 'element-harmony')
   */
  abstract readonly name: string;

  /**
   * Weight in overall score (e.g., 0.40 for 40%)
   */
  abstract readonly weight: number;

  /**
   * Calculate raw score for this criterion
   *
   * @param candidate - Name candidate to score
   * @param context - Scoring context (saju, preferences, etc.)
   * @returns Raw score (0-100)
   */
  protected abstract calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number>;

  /**
   * Generate human-readable explanation of the score
   *
   * @param candidate - Name candidate
   * @param score - Normalized score (0-100)
   * @param context - Scoring context
   * @returns Explanation string
   */
  protected abstract generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string;

  /**
   * Main scoring method
   *
   * Calculates score, normalizes it, applies weight, and generates explanation.
   */
  async score(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<DetailedScore> {
    // Calculate raw score
    const rawScore = await this.calculateRawScore(candidate, context);

    // Normalize to 0-100 range
    const normalizedScore = this.normalize(rawScore);

    // Apply weight
    const weightedScore = normalizedScore * this.weight;

    // Generate explanation
    const explanation = this.generateExplanation(candidate, normalizedScore, context);

    return {
      score: normalizedScore,
      weight: this.weight,
      weightedScore,
      explanation,
    };
  }

  /**
   * Normalize score to 0-100 range
   */
  protected normalize(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Clamp value to range
   */
  protected clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation
   */
  protected lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
