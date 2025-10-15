/**
 * Yin-Yang Balance Scorer (20% weight)
 *
 * Evaluates yin-yang harmony in the full name (성 + 이름).
 *
 * Scoring Logic:
 * - Ideal patterns (양음양, 음양음): 100 points - perfect alternation
 * - Good patterns (양양음, 음음양, 양음음, 음양양): 80 points - acceptable balance
 * - Concerning patterns (양양양, 음음음): 50 points - all same
 * - Bonus: +10 for harmony with last name
 */

import { YinYang } from '@prisma/client';
import { BaseScorer } from './base-scorer';
import type { NameCandidate, ScoringContext } from '../types';

export class YinYangScorer extends BaseScorer {
  readonly name = 'yinyang-balance';
  readonly weight = 0.20;

  protected async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    const { characters } = candidate;
    const char1 = characters[0];
    const char2 = characters[1];

    // Get last name yin-yang (from context or infer from hanja)
    const lastNameYinYang = this.getLastNameYinYang(context);

    // Build full pattern
    const pattern = [lastNameYinYang, char1.yinYang, char2.yinYang];
    const patternString = pattern.map(y => this.toKorean(y)).join('');

    // Evaluate pattern
    let score = this.scorePattern(patternString);

    // Bonus for harmony with last name
    if (this.hasHarmonyWithLastName(pattern)) {
      score += 10;
    }

    return score;
  }

  protected generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    const { characters } = candidate;
    const lastNameYinYang = this.getLastNameYinYang(context);

    const pattern = [
      lastNameYinYang,
      characters[0].yinYang,
      characters[1].yinYang,
    ].map(y => this.toKorean(y)).join('');

    if (score >= 90) {
      return `음양 배치가 ${pattern}로 이상적인 조화를 이룸`;
    } else if (score >= 80) {
      return `음양 배치가 ${pattern}로 양호한 균형`;
    } else if (score >= 60) {
      return `음양 배치가 ${pattern}로 보통 수준`;
    } else {
      return `음양 배치가 ${pattern}로 한쪽으로 치우침`;
    }
  }

  /**
   * Score yin-yang pattern
   */
  private scorePattern(pattern: string): number {
    // Ideal patterns: perfect alternation
    const idealPatterns = ['양음양', '음양음'];
    if (idealPatterns.includes(pattern)) {
      return 100;
    }

    // Good patterns: acceptable balance (2:1 ratio)
    const goodPatterns = ['양양음', '음음양', '양음음', '음양양'];
    if (goodPatterns.includes(pattern)) {
      return 80;
    }

    // Concerning patterns: all same (3:0 ratio)
    const concernPatterns = ['양양양', '음음음'];
    if (concernPatterns.includes(pattern)) {
      return 50;
    }

    // Default (shouldn't reach here)
    return 70;
  }

  /**
   * Check harmony with last name
   *
   * Harmony means last name differs from both first name characters
   */
  private hasHarmonyWithLastName(pattern: YinYang[]): boolean {
    const lastName = pattern[0];
    const firstName1 = pattern[1];
    const firstName2 = pattern[2];

    // Best: last name differs from both first name chars
    return lastName !== firstName1 && lastName !== firstName2;
  }

  /**
   * Get last name yin-yang
   *
   * In a full implementation, this would look up the last name hanja.
   * For now, we'll use a simplified mapping of common last names.
   */
  private getLastNameYinYang(context: ScoringContext): YinYang {
    // Common Korean last names yin-yang mapping
    // Based on stroke count (odd=양, even=음)
    const lastNameMap: Record<string, YinYang> = {
      // 음 (even strokes)
      '김': YinYang.YIN,   // 金 8획
      '이': YinYang.YIN,   // 李 7획 → but 이 is often considered 음
      '박': YinYang.YANG,  // 朴 6획
      '최': YinYang.YANG,  // 崔 11획
      '정': YinYang.YIN,   // 鄭 14획
      '강': YinYang.YANG,  // 姜 9획
      '조': YinYang.YANG,  // 趙 14획
      '윤': YinYang.YIN,   // 尹 4획
      '장': YinYang.YANG,  // 張 11획
      '임': YinYang.YIN,   // 林 8획
      '한': YinYang.YANG,  // 韓 17획
      '오': YinYang.YIN,   // 吳 7획
      '서': YinYang.YIN,   // 徐 10획
      '신': YinYang.YANG,  // 申 5획
      '권': YinYang.YIN,   // 權 22획
      '황': YinYang.YIN,   // 黃 12획
      '안': YinYang.YIN,   // 安 6획
      '송': YinYang.YANG,  // 宋 7획
      '전': YinYang.YIN,   // 全 6획
      '홍': YinYang.YANG,  // 洪 9획
    };

    const yinYang = lastNameMap[context.lastName];
    if (yinYang) return yinYang;

    // Default fallback: use first character to guess
    // If we have the lastNameHanja in context, we could look it up
    // For now, return a sensible default
    return YinYang.YIN;
  }

  /**
   * Convert YinYang enum to Korean string
   */
  private toKorean(yinYang: YinYang): string {
    return yinYang === YinYang.YANG ? '양' : '음';
  }
}
