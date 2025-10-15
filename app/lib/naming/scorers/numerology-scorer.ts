/**
 * Numerology (81수리) Scorer (20% weight)
 *
 * Evaluates four grids (사격) based on traditional Korean numerology.
 *
 * Scoring Logic:
 * - Calculate 4 grids: 원격(초년운), 형격(청장년운), 이격(중말년운), 정격(말년운)
 * - Each grid scored by fortune: 대길=100, 길=80, 평=60, 흉=40, 대흉=20
 * - Overall score = weighted average of 4 grid scores
 * - Bonus: +10 if 3+ grids are auspicious (대길 or 길)
 */

import { BaseScorer } from './base-scorer';
import type { NameCandidate, ScoringContext, NumerologyGridsAnalysis } from '../types';
import {
  calculateFourGrids,
  scoreFourGrids,
  analyzeFourGrids,
  getDetailedFourGridsAnalysis,
  type FortuneRating,
} from '../utils/numerology-81';

export class NumerologyScorer extends BaseScorer {
  readonly name = 'numerology';
  readonly weight = 0.20;

  protected async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { characters } = candidate;
    const { lastNameStrokes } = context;

    // Calculate four grids
    const fourGrids = calculateFourGrids(
      lastNameStrokes,
      characters[0].strokes,
      characters[1].strokes
    );

    // Score all grids
    const gridScores = scoreFourGrids(fourGrids);

    // Calculate weighted average
    // Different grids have different importance
    const weights = {
      원격: 0.20, // 초년운 - least important (childhood)
      형격: 0.30, // 청장년운 - very important (prime years)
      이격: 0.30, // 중말년운 - very important (middle to late life)
      정격: 0.20, // 말년운 - important (old age)
    };

    const weightedScore =
      gridScores.원격 * weights.원격 +
      gridScores.형격 * weights.형격 +
      gridScores.이격 * weights.이격 +
      gridScores.정격 * weights.정격;

    // Bonus for multiple auspicious grids
    const analysis = analyzeFourGrids(fourGrids);
    const bonus = analysis.auspiciousCount >= 3 ? 10 : 0;

    return Math.min(100, weightedScore + bonus);
  }

  protected generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const { characters } = candidate;
    const { lastNameStrokes } = context;

    // Calculate and analyze grids
    const fourGrids = calculateFourGrids(
      lastNameStrokes,
      characters[0].strokes,
      characters[1].strokes
    );

    const detailedAnalysis = getDetailedFourGridsAnalysis(fourGrids);
    const analysis = analyzeFourGrids(fourGrids);

    // Build explanation based on auspicious count
    if (analysis.auspiciousCount >= 3) {
      const auspiciousGrids = this.getAuspiciousGridNames(detailedAnalysis);
      return `${auspiciousGrids.join(', ')} 등 ${analysis.auspiciousCount}개 격이 길수로 매우 좋음`;
    } else if (analysis.auspiciousCount >= 2) {
      const auspiciousGrids = this.getAuspiciousGridNames(detailedAnalysis);
      return `${auspiciousGrids.join(', ')} 2개 격이 길수로 양호함`;
    } else if (analysis.auspiciousCount === 1) {
      const auspiciousGrids = this.getAuspiciousGridNames(detailedAnalysis);
      return `${auspiciousGrids[0]} 격이 길수이나 다른 격은 보통`;
    } else if (analysis.inauspiciousCount >= 2) {
      return `수리 배치에 흉수가 ${analysis.inauspiciousCount}개로 개선 필요`;
    } else {
      return `수리 배치가 보통 수준`;
    }
  }

  /**
   * Get names of auspicious grids
   */
  private getAuspiciousGridNames(grids: NumerologyGridsAnalysis): string[] {
    const names: string[] = [];

    if (this.isAuspicious(grids.원격.fortune)) {
      names.push('원격(초년운)');
    }
    if (this.isAuspicious(grids.형격.fortune)) {
      names.push('형격(청장년운)');
    }
    if (this.isAuspicious(grids.이격.fortune)) {
      names.push('이격(중말년운)');
    }
    if (this.isAuspicious(grids.정격.fortune)) {
      names.push('정격(말년운)');
    }

    return names;
  }

  /**
   * Check if fortune is auspicious
   */
  private isAuspicious(fortune: FortuneRating): boolean {
    return fortune === '대길' || fortune === '길';
  }
}
