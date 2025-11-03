/**
 * Element Harmony Scorer (30% weight, reduced from 40%)
 *
 * Evaluates five elements relationships between characters and saju compatibility.
 *
 * Scoring Logic:
 * - Production cycle (상생): +30 points per producing relationship
 * - Same element: +15 points
 * - Control cycle (상극): -20 points per controlling relationship
 * - Saju complement: +25 bonus if complements lacking/favorable elements
 * - Balance: +20 if good distribution
 */

import { Element } from '@prisma/client';
import { BaseScorer } from './base-scorer';
import type { NameCandidate, ScoringContext } from '../types';
import {
  getElementRelation,
  getRelationScore,
  analyzeElementEffect,
  calculateElementBalance,
} from '../utils/element-relations';

export class ElementScorer extends BaseScorer {
  readonly name = 'element-harmony';
  readonly weight = 0.30; // Reduced from 0.40 to balance with linguistic criteria

  protected async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { characters } = candidate;
    const { sajuResult } = context;

    const char1 = characters[0];
    const char2 = characters[1];

    let score = 50; // Base score

    // 1. Relationship between char1 and char2
    const relation = getElementRelation(char1.element, char2.element);
    const relationScore = getRelationScore(relation);

    // Convert relation score (-100 to 100) to contribution (0-40)
    score += (relationScore / 100) * 30;

    // 2. Analyze element effect on saju
    const effect = analyzeElementEffect(
      char1.element,
      char2.element,
      sajuResult.elementCounts,
      sajuResult.lackingElements
    );

    score += effect.score;

    // 3. Element distribution balance after adding name
    const updatedCounts = { ...sajuResult.elementCounts };
    updatedCounts[char1.element] = (updatedCounts[char1.element] || 0) + 1;
    updatedCounts[char2.element] = (updatedCounts[char2.element] || 0) + 1;

    const balance = calculateElementBalance(updatedCounts);
    const balanceContribution = (balance / 100) * 20;
    score += balanceContribution;

    // 4. Bonus for strengthening favorable elements (yongsin)
    const strengthensFavorable = this.strengthensFavorableElements(
      [char1.element, char2.element],
      sajuResult.favorableElements
    );

    if (strengthensFavorable) {
      score += 15;
    }

    return score;
  }

  protected generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const { characters } = candidate;
    const { sajuResult } = context;

    const char1 = characters[0];
    const char2 = characters[1];

    const parts: string[] = [];

    // Relationship explanation
    const relation = getElementRelation(char1.element, char2.element);

    switch (relation) {
      case 'producing':
        parts.push(
          `${char1.element}(${char1.character})와 ${char2.element}(${char2.character})은 상생 관계로 매우 조화로움`
        );
        break;
      case 'produced':
        parts.push(
          `${char2.element}(${char2.character})이 ${char1.element}(${char1.character})를 생하여 조화로움`
        );
        break;
      case 'conflicting':
        parts.push(
          `${char1.element}과 ${char2.element}은 상극 관계로 조화 부족`
        );
        break;
      case 'conflicted':
        parts.push(
          `${char2.element}이 ${char1.element}을 극하여 다소 불안정`
        );
        break;
      case 'same':
        parts.push(`같은 오행(${char1.element})으로 안정적`);
        break;
      case 'neutral':
        parts.push(`${char1.element}과 ${char2.element}은 중립적 관계`);
        break;
    }

    // Saju complement
    const effect = analyzeElementEffect(
      char1.element,
      char2.element,
      sajuResult.elementCounts,
      sajuResult.lackingElements
    );

    if (effect.complementsLacking) {
      const lacking = sajuResult.lackingElements
        .filter(e => e === char1.element || e === char2.element)
        .join(', ');
      parts.push(`사주에서 부족한 ${lacking} 오행을 보완`);
    }

    // Favorable elements
    if (this.strengthensFavorableElements(
      [char1.element, char2.element],
      sajuResult.favorableElements
    )) {
      parts.push(`용신(${sajuResult.yongsin.primary})을 강화하여 유리`);
    }

    return parts.length > 0 ? parts.join('. ') + '.' : '오행 조화가 무난함.';
  }

  /**
   * Check if name elements strengthen favorable elements
   */
  private strengthensFavorableElements(
    nameElements: Element[],
    favorable: Element[]
  ): boolean {
    // Direct match
    const directMatch = nameElements.some(e => favorable.includes(e));
    if (directMatch) return true;

    // Producing favorable elements
    return nameElements.some(nameElem =>
      favorable.some(favElem => {
        const relation = getElementRelation(nameElem, favElem);
        return relation === 'producing';
      })
    );
  }
}
