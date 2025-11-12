/**
 * Linguistic Scorer (30% weight)
 *
 * Evaluates linguistic naturalness and diversity of name combinations.
 *
 * Scoring Logic:
 * - Same syllable repetition (e.g., "서서", "준준"): -50 points
 * - Meaning similarity (semantic overlap): -10 to -20 points
 *   - Very similar (0.7+): -20 points
 *   - Partially similar (0.4-0.7): -10 points
 *   - Diverse (<0.4): 0 points
 * - Base score: 70 points
 *
 * This scorer addresses linguistic issues that data-driven metrics miss:
 * - Korean naming conventions (avoid syllable repetition)
 * - Semantic diversity (avoid redundant meanings like "깃들다+깃들다")
 */

import { BaseScorer } from './base-scorer';
import type { NameCandidate, ScoringContext } from '../types';
import { analyzeMeaningSimilarity } from '../utils/meaning-similarity';
import { scorePhoneticNaturalness, explainPhoneticNaturalness } from '../utils/phonetic-naturalness';

export class LinguisticScorer extends BaseScorer {
  readonly name = 'linguistic';
  readonly weight = 0.30;

  protected async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { characters, firstName } = candidate;

    console.log(`[LinguisticScorer] 평가 중: ${firstName[0]}${firstName[1]} (${characters[0].character}${characters[1].character})`);

    const issues: string[] = [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. 🆕 발음 자연스러움 (50% 가중치)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const phoneticScore = scorePhoneticNaturalness(firstName);
    const phoneticWeighted = phoneticScore * 0.5;

    if (phoneticScore < 70) {
      issues.push(explainPhoneticNaturalness(firstName, phoneticScore));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. 음절 반복 체크 (30% 가중치)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let repetitionScore = 100;
    if (firstName[0] === firstName[1]) {
      console.log(`[LinguisticScorer] ⚠️ 같은 음절 반복 감지: ${firstName[0]} === ${firstName[1]}`);
      repetitionScore = 0; // 완전 감점
      issues.push('같은 음절 반복');
    }
    const repetitionWeighted = repetitionScore * 0.3;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. 의미 유사도 체크 (20% 가중치)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const char1 = characters[0];
    const char2 = characters[1];

    let similarityScore = 100;
    if (char1.meaning && char2.meaning) {
      const similarity = analyzeMeaningSimilarity(char1.meaning, char2.meaning);

      if (similarity.similarity >= 0.7) {
        similarityScore = 20; // 매우 유사 → 20점
        issues.push('의미 매우 유사');
      } else if (similarity.similarity >= 0.4) {
        similarityScore = 60; // 부분 유사 → 60점
        issues.push('의미 부분 유사');
      }
      // else: diverse meanings, 100점
    }
    const similarityWeighted = similarityScore * 0.2;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 최종 점수 계산
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const finalScore = phoneticWeighted + repetitionWeighted + similarityWeighted;

    // Store issues for explanation
    (candidate as any).__linguisticIssues = issues;
    (candidate as any).__phoneticScore = phoneticScore;

    console.log(`[LinguisticScorer] 발음=${phoneticScore.toFixed(1)}, 반복=${repetitionScore}, 유사=${similarityScore.toFixed(1)} → 최종=${finalScore.toFixed(1)}`);

    return Math.max(0, Math.min(100, finalScore));
  }

  protected generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const { characters, firstName } = candidate;
    const issues = (candidate as any).__linguisticIssues || [];

    // No issues - perfect linguistic score
    if (issues.length === 0) {
      return '음절과 의미가 다양하여 언어적으로 자연스러움';
    }

    // Build explanation from issues
    const parts: string[] = [];

    if (issues.includes('같은 음절 반복')) {
      parts.push(
        `"${firstName[0]}${firstName[1]}" 같은 음절 반복으로 청각적으로 부자연스러움`
      );
    }

    if (issues.includes('의미 매우 유사')) {
      parts.push(
        `${characters[0].character}(${this.simplifyMeaning(characters[0].meaning)})와 ` +
        `${characters[1].character}(${this.simplifyMeaning(characters[1].meaning)})의 의미가 ` +
        `중복되어 의미 깊이 부족`
      );
    } else if (issues.includes('의미 부분 유사')) {
      parts.push(
        `${characters[0].character}와 ${characters[1].character}의 의미가 다소 유사하여 ` +
        `다양성 부족`
      );
    }

    return parts.join('. ') + '.';
  }

  /**
   * Simplify meaning for explanation (take first part before slash)
   */
  private simplifyMeaning(meaning: string): string {
    return meaning.split('/')[0].split(' ')[0];
  }
}
