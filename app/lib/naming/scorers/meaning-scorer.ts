/**
 * Meaning Harmony Scorer (20% weight)
 *
 * Evaluates semantic compatibility and cultural appropriateness.
 *
 * Scoring Logic:
 * - Individual quality: Based on character fortune, popularity (30%)
 * - Meaning compatibility: Semantic coherence (20%)
 * - Cultural appropriateness: No negative connotations (20%)
 * - Parent value alignment: Match with user's desired values (30%)
 */

import { BaseScorer } from './base-scorer';
import type { NameCandidate, ScoringContext, HanjaCharacter } from '../types';
import { getPopularityLevel, getPopularityScore } from '../popular-hanja';
import { calculateNameValueAlignment } from './value-meaning-map';

export class MeaningScorer extends BaseScorer {
  readonly name = 'meaning-harmony';
  readonly weight = 0.20;

  // Characters to avoid in names (negative connotations)
  private readonly negativeCharacters = [
    '死', '亡', '病', '患', '災', '禍', '凶', '惡',
    '貧', '窮', '敗', '衰', '弱', '劣', '醜', '恥',
    '苦', '痛', '悲', '哀', '憂', '愁', '怨', '恨',
  ];

  protected async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { characters } = candidate;
    const char1 = characters[0];
    const char2 = characters[1];

    // 1. Individual character quality (30%)
    const char1Quality = this.scoreCharacterQuality(char1);
    const char2Quality = this.scoreCharacterQuality(char2);
    const averageQuality = (char1Quality + char2Quality) / 2;
    const qualityScore = averageQuality * 0.3;

    // 2. Meaning compatibility (20%)
    const compatibility = this.scoreMeaningCompatibility(char1, char2);
    const compatibilityScore = compatibility * 0.2;

    // 3. Cultural appropriateness (20%)
    const appropriateness = this.scoreCulturalAppropriateness(char1, char2);
    const appropriatenessScore = appropriateness * 0.2;

    // 4. Parent value alignment (30%)
    const valueAlignment = this.scoreValueAlignment(characters, context);
    const valueAlignmentScore = valueAlignment * 0.3;

    return qualityScore + compatibilityScore + appropriatenessScore + valueAlignmentScore;
  }

  protected generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const { characters } = candidate;
    const char1 = characters[0];
    const char2 = characters[1];

    // Check for issues
    const hasNegative = this.hasNegativeConnotation(char1, char2);
    if (hasNegative) {
      return `부정적 의미의 한자가 포함되어 권장하지 않음`;
    }

    const hasReviewNeeded = char1.review === 'needs_review' || char2.review === 'needs_review';
    if (hasReviewNeeded) {
      return `한자의 적합성을 재검토할 필요가 있음`;
    }

    // Positive explanations
    if (score >= 85) {
      return `${char1.meaning}와 ${char2.meaning}의 의미가 조화롭고 긍정적`;
    } else if (score >= 70) {
      return `의미가 무난하며 특별한 문제 없음`;
    } else if (score >= 60) {
      return `의미 조화에 다소 개선 여지 있음`;
    } else {
      return `의미 조화가 약하여 다른 조합 고려 권장`;
    }
  }

  /**
   * Score individual character quality
   */
  private scoreCharacterQuality(char: HanjaCharacter): number {
    let score = 50; // Base score

    // Fortune contribution (0-30 points)
    if (char.fortune) {
      switch (char.fortune) {
        case '대길':
          score += 30;
          break;
        case '길':
          score += 20;
          break;
        case '평':
          score += 10;
          break;
        case '흉':
          score += 0;
          break;
        case '대흉':
          score -= 10;
          break;
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔥 CRITICAL: 현대 인기도 기반 점수 (0-30 points)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const popularityLevel = getPopularityLevel(char.character);

    switch (popularityLevel) {
      case 'very':
        score += 30; // TOP 10 이름: 매우 인기 많음
        break;
      case 'popular':
        score += 25; // TOP 50 이름: 인기 많음
        break;
      case 'moderate':
        score += 20; // TOP 100 이름: 인기 있음
        break;
      case 'traditional':
        score += 15; // 전통 작명용: 보통
        break;
      case 'rare':
        score -= 30; // ❌ 드문 한자: 큰 페널티 (燠, 蹈 같은 문제 한자)
        break;
      case 'unknown':
        // nameFrequency 값으로 보정
        const nameFreq = char.nameFrequency || 0;
        const nameFreqScore = Math.min(10, nameFreq / 100);
        score += nameFreqScore;
        break;
    }

    return this.clamp(score, 0, 100);
  }

  /**
   * Score meaning compatibility between two characters
   */
  private scoreMeaningCompatibility(
    char1: HanjaCharacter,
    char2: HanjaCharacter
  ): number {
    let score = 70; // Base compatibility

    // Check for thematic coherence
    if (char1.category && char2.category) {
      const categories1 = new Set(char1.category);
      const categories2 = new Set(char2.category);

      // Shared categories = thematic coherence
      const sharedCategories = [...categories1].filter(c =>
        categories2.has(c)
      );

      if (sharedCategories.length > 0) {
        score += 20; // Bonus for coherent theme
      }
    }

    // Check for semantic conflict
    const hasConflict = this.checkSemanticConflict(
      char1.meaning,
      char2.meaning
    );

    if (hasConflict) {
      score -= 30; // Penalty for conflicting meanings
    }

    return this.clamp(score, 0, 100);
  }

  /**
   * Score cultural appropriateness
   */
  private scoreCulturalAppropriateness(
    char1: HanjaCharacter,
    char2: HanjaCharacter
  ): number {
    let score = 90; // Assume appropriate unless flagged

    // Check against negative connotation list
    if (this.negativeCharacters.includes(char1.character)) {
      score -= 50;
    }
    if (this.negativeCharacters.includes(char2.character)) {
      score -= 50;
    }

    // Check review status
    if (char1.review === 'needs_review') {
      score -= 20;
    }
    if (char2.review === 'needs_review') {
      score -= 20;
    }

    // Check if marked as not good for naming
    if (char1.isGoodForNaming === false) {
      score -= 30;
    }
    if (char2.isGoodForNaming === false) {
      score -= 30;
    }

    return this.clamp(score, 0, 100);
  }

  /**
   * Check if has negative connotation
   */
  private hasNegativeConnotation(
    char1: HanjaCharacter,
    char2: HanjaCharacter
  ): boolean {
    return (
      this.negativeCharacters.includes(char1.character) ||
      this.negativeCharacters.includes(char2.character)
    );
  }

  /**
   * Check for semantic conflicts in meanings
   */
  private checkSemanticConflict(meaning1?: string, meaning2?: string): boolean {
    if (!meaning1 || !meaning2) return false;

    // Define conflicting pairs
    const conflicts = [
      ['밝다', '어둡다'],
      ['크다', '작다'],
      ['높다', '낮다'],
      ['강하다', '약하다'],
      ['길다', '짧다'],
      ['넓다', '좁다'],
      ['빠르다', '느리다'],
      ['뜨겁다', '차갑다'],
      ['좋다', '나쁘다'],
      ['아름답다', '추하다'],
    ];

    return conflicts.some(([word1, word2]) =>
      (meaning1.includes(word1) && meaning2.includes(word2)) ||
      (meaning1.includes(word2) && meaning2.includes(word1))
    );
  }

  /**
   * Score alignment with parent values (부모 가치관)
   *
   * This is the KEY differentiator that makes scores vary based on user preferences.
   * If no parent values are selected, returns base score of 50 (neutral).
   */
  private scoreValueAlignment(
    characters: [HanjaCharacter, HanjaCharacter],
    context: ScoringContext
  ): number {
    // If no parent values selected, return neutral score
    if (!context.preferences?.parentValues || context.preferences.parentValues.length === 0) {
      return 50; // Neutral score when no values specified
    }

    // Calculate alignment using value-meaning map
    const alignmentScore = calculateNameValueAlignment(
      characters.map(char => ({
        character: char.character,
        meaning: char.meaning
      })),
      context.preferences.parentValues
    );

    // Normalize to 0-100 range
    // High alignment (80-100) = excellent match
    // Medium alignment (50-79) = good match
    // Low alignment (0-49) = weak match
    return alignmentScore;
  }
}
