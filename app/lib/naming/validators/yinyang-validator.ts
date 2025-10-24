/**
 * 음양 검증기 (YinYang Validator)
 *
 * 성명학에서 음양 균형은 매우 중요한 요소
 * 획수의 홀짝으로 음양을 판단하고 조화를 평가
 *
 * 학술 근거: 2019년 논문 - 71% 검증 방법론
 *
 * 원리:
 * - 홀수 획수 = 양(陽) - 능동적, 외향적, 강함
 * - 짝수 획수 = 음(陰) - 수동적, 내향적, 부드러움
 * - 균형잡힌 음양 배치가 조화로운 삶을 만듦
 */

/**
 * 음양 타입
 */
export type YinYang = '양' | '음';

/**
 * 음양 패턴
 */
export interface YinYangPattern {
  pattern: YinYang[];
  balance: number; // 0-100 (균형도)
  harmony: '조화' | '보통' | '부조화';
  recommendation: string;
}

/**
 * 음양 분석 결과
 */
export interface YinYangAnalysis {
  // 각 글자의 음양
  characters: Array<{
    char: string;
    strokes: number;
    yinyang: YinYang;
  }>;

  // 전체 패턴
  pattern: YinYang[];

  // 음양 개수
  yangCount: number;
  yinCount: number;

  // 균형 점수 (0-100)
  balanceScore: number;

  // 조화 등급
  harmony: '완벽한 조화' | '좋은 조화' | '보통' | '약간 불균형' | '불균형';

  // 패턴 평가
  patternEvaluation: {
    isAlternating: boolean; // 교대 패턴 (양음양음...)
    hasExtremeBias: boolean; // 극단적 편향 (모두 양 or 모두 음)
    recommendation: string;
  };

  // 상세 설명
  explanation: string;
}

/**
 * YinYangValidator
 */
export class YinYangValidator {
  /**
   * 획수로 음양 판단
   */
  private getYinYang(strokes: number): YinYang {
    return strokes % 2 === 1 ? '양' : '음';
  }

  /**
   * 이름 음양 분석
   */
  analyzeYinYang(
    lastName: string,
    firstName: string,
    lastNameStrokes: number,
    firstNameStrokes: number[] // 이름 각 글자의 획수
  ): YinYangAnalysis {
    // 각 글자의 음양 계산
    const characters: Array<{ char: string; strokes: number; yinyang: YinYang }> = [];

    // 성씨
    characters.push({
      char: lastName,
      strokes: lastNameStrokes,
      yinyang: this.getYinYang(lastNameStrokes),
    });

    // 이름 각 글자
    const firstNameChars = firstName.split('');
    firstNameChars.forEach((char, index) => {
      characters.push({
        char,
        strokes: firstNameStrokes[index],
        yinyang: this.getYinYang(firstNameStrokes[index]),
      });
    });

    // 음양 패턴
    const pattern = characters.map((c) => c.yinyang);

    // 음양 개수
    const yangCount = pattern.filter((y) => y === '양').length;
    const yinCount = pattern.filter((y) => y === '음').length;

    // 균형 점수 계산
    const balanceScore = this.calculateBalanceScore(pattern, yangCount, yinCount);

    // 조화 등급
    const harmony = this.getHarmonyLevel(balanceScore);

    // 패턴 평가
    const patternEvaluation = this.evaluatePattern(pattern, yangCount, yinCount);

    // 상세 설명
    const explanation = this.generateExplanation(
      characters,
      pattern,
      yangCount,
      yinCount,
      harmony,
      patternEvaluation
    );

    return {
      characters,
      pattern,
      yangCount,
      yinCount,
      balanceScore,
      harmony,
      patternEvaluation,
      explanation,
    };
  }

  /**
   * 균형 점수 계산 (71% 방법론)
   *
   * 학술 논문 기반:
   * - 교대 패턴이 가장 좋음 (양음양 or 음양음): 95-100점
   * - 양2:음1 or 양1:음2 비율: 75-90점
   * - 극단적 편향 (모두 양 or 모두 음): 0-30점
   */
  private calculateBalanceScore(pattern: YinYang[], yangCount: number, yinCount: number): number {
    const totalCount = pattern.length;

    // 1. 극단적 편향 체크 (모두 같음)
    if (yangCount === 0 || yinCount === 0) {
      return 10; // 매우 불균형
    }

    // 2. 교대 패턴 체크 (양음양음... or 음양음양...)
    const isAlternating = this.checkAlternatingPattern(pattern);
    if (isAlternating) {
      return 95; // 완벽한 조화
    }

    // 3. 비율 기반 점수
    const ratio = Math.min(yangCount, yinCount) / Math.max(yangCount, yinCount);

    // ratio: 0.33 (1:2) ~ 1.0 (1:1)
    // 1:1 비율이 가장 좋음
    if (ratio >= 0.8) {
      // 거의 균등 (예: 양2 음2, 양3 음2)
      return 85 + ratio * 15; // 85-100점
    } else if (ratio >= 0.5) {
      // 적당한 균형 (예: 양2 음1)
      return 70 + ratio * 15; // 70-85점
    } else if (ratio >= 0.33) {
      // 약간 편향 (예: 양3 음1)
      return 50 + ratio * 20; // 50-70점
    } else {
      // 많이 편향 (예: 양4 음1)
      return Math.max(20, ratio * 50); // 20-50점
    }
  }

  /**
   * 교대 패턴 체크 (양음양음... or 음양음양...)
   */
  private checkAlternatingPattern(pattern: YinYang[]): boolean {
    if (pattern.length < 2) return false;

    for (let i = 1; i < pattern.length; i++) {
      if (pattern[i] === pattern[i - 1]) {
        return false; // 같은 음양이 연속되면 교대 패턴 아님
      }
    }

    return true; // 모두 교대
  }

  /**
   * 조화 등급 판단
   */
  private getHarmonyLevel(
    score: number
  ): '완벽한 조화' | '좋은 조화' | '보통' | '약간 불균형' | '불균형' {
    if (score >= 90) return '완벽한 조화';
    if (score >= 75) return '좋은 조화';
    if (score >= 60) return '보통';
    if (score >= 40) return '약간 불균형';
    return '불균형';
  }

  /**
   * 패턴 평가
   */
  private evaluatePattern(
    pattern: YinYang[],
    yangCount: number,
    yinCount: number
  ): {
    isAlternating: boolean;
    hasExtremeBias: boolean;
    recommendation: string;
  } {
    const isAlternating = this.checkAlternatingPattern(pattern);
    const hasExtremeBias = yangCount === 0 || yinCount === 0;

    let recommendation = '';

    if (hasExtremeBias) {
      recommendation = '모두 같은 음양이라 매우 불균형합니다. 반대 음양의 글자를 추가하세요.';
    } else if (isAlternating) {
      recommendation = '완벽한 교대 패턴! 음양이 조화롭게 배치되어 있습니다.';
    } else if (Math.abs(yangCount - yinCount) <= 1) {
      recommendation = '음양의 개수가 균형잡혀 있어 좋습니다.';
    } else {
      const dominant = yangCount > yinCount ? '양' : '음';
      const weak = yangCount > yinCount ? '음' : '양';
      recommendation = `${dominant}이 강합니다. ${weak} 글자를 더 추가하면 균형이 개선됩니다.`;
    }

    return {
      isAlternating,
      hasExtremeBias,
      recommendation,
    };
  }

  /**
   * 상세 설명 생성
   */
  private generateExplanation(
    characters: Array<{ char: string; strokes: number; yinyang: YinYang }>,
    pattern: YinYang[],
    yangCount: number,
    yinCount: number,
    harmony: string,
    patternEvaluation: { isAlternating: boolean; hasExtremeBias: boolean; recommendation: string }
  ): string {
    let explanation = '## 음양 분석\n\n';

    // 1. 각 글자 음양
    explanation += '### 각 글자의 음양\n';
    characters.forEach((c) => {
      explanation += `- **${c.char}** (${c.strokes}획): ${c.yinyang}\n`;
    });

    // 2. 패턴
    explanation += `\n### 음양 패턴\n`;
    explanation += `패턴: ${pattern.join(' - ')}\n\n`;

    // 3. 비율
    explanation += `### 음양 비율\n`;
    explanation += `- 양(陽): ${yangCount}개\n`;
    explanation += `- 음(陰): ${yinCount}개\n`;
    explanation += `- 비율: ${yangCount}:${yinCount}\n\n`;

    // 4. 조화 평가
    explanation += `### 조화 평가\n`;
    explanation += `- 등급: **${harmony}**\n`;
    explanation += `- 교대 패턴: ${patternEvaluation.isAlternating ? '✅ 예' : '❌ 아니오'}\n`;
    explanation += `- 극단적 편향: ${patternEvaluation.hasExtremeBias ? '⚠️ 예' : '✅ 아니오'}\n\n`;

    // 5. 추천사항
    explanation += `### 추천사항\n`;
    explanation += `${patternEvaluation.recommendation}\n\n`;

    // 6. 음양의 의미
    explanation += `### 음양의 의미\n`;
    explanation += `- **양(陽)**: 능동적, 외향적, 강인함, 리더십, 활동성\n`;
    explanation += `- **음(陰)**: 수동적, 내향적, 부드러움, 포용력, 안정성\n\n`;
    explanation += `균형잡힌 음양 배치는 성격과 운세의 조화를 가져옵니다.\n`;

    return explanation;
  }

  /**
   * 빠른 음양 점수 계산 (간단 버전)
   */
  quickScore(strokesList: number[]): number {
    const pattern = strokesList.map((s) => this.getYinYang(s));
    const yangCount = pattern.filter((y) => y === '양').length;
    const yinCount = pattern.filter((y) => y === '음').length;

    return this.calculateBalanceScore(pattern, yangCount, yinCount);
  }

  /**
   * 음양 패턴 추천
   */
  recommendPatterns(nameLength: number): Array<{ pattern: YinYang[]; score: number; description: string }> {
    const patterns: Array<{ pattern: YinYang[]; score: number; description: string }> = [];

    if (nameLength === 2) {
      // 2자 이름 (성 제외)
      patterns.push({
        pattern: ['양', '음'],
        score: 95,
        description: '양음 교대 - 완벽한 조화',
      });
      patterns.push({
        pattern: ['음', '양'],
        score: 95,
        description: '음양 교대 - 완벽한 조화',
      });
      patterns.push({
        pattern: ['양', '양'],
        score: 60,
        description: '양양 - 강하지만 부드러움 부족',
      });
      patterns.push({
        pattern: ['음', '음'],
        score: 60,
        description: '음음 - 부드럽지만 추진력 부족',
      });
    } else if (nameLength === 3) {
      // 3자 이름 (성 포함)
      patterns.push({
        pattern: ['양', '음', '양'],
        score: 95,
        description: '양음양 교대 - 완벽한 조화',
      });
      patterns.push({
        pattern: ['음', '양', '음'],
        score: 95,
        description: '음양음 교대 - 완벽한 조화',
      });
      patterns.push({
        pattern: ['양', '양', '음'],
        score: 80,
        description: '양양음 - 강하다가 부드럽게',
      });
      patterns.push({
        pattern: ['음', '음', '양'],
        score: 80,
        description: '음음양 - 부드럽다가 강하게',
      });
    } else if (nameLength === 4) {
      // 4자 이름 (성 포함)
      patterns.push({
        pattern: ['양', '음', '양', '음'],
        score: 100,
        description: '양음양음 완벽한 교대 - 최고의 조화',
      });
      patterns.push({
        pattern: ['음', '양', '음', '양'],
        score: 100,
        description: '음양음양 완벽한 교대 - 최고의 조화',
      });
      patterns.push({
        pattern: ['양', '양', '음', '음'],
        score: 85,
        description: '양양음음 - 균형잡힌 조화',
      });
    }

    return patterns.sort((a, b) => b.score - a.score);
  }
}

// 싱글톤 인스턴스
let yinYangValidator: YinYangValidator;

export function getYinYangValidator(): YinYangValidator {
  if (!yinYangValidator) {
    yinYangValidator = new YinYangValidator();
  }
  return yinYangValidator;
}

// ============================================================
// 테스트
// ============================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('🧪 음양 검증기 테스트\n');

  const validator = getYinYangValidator();

  // 테스트 케이스 1: 김민준 (8, 5, 7)
  console.log('=== 테스트 1: 김민준 (8획, 5획, 7획) ===');
  const result1 = validator.analyzeYinYang('김', '민준', 8, [5, 7]);
  console.log(`패턴: ${result1.pattern.join('-')}`);
  console.log(`양: ${result1.yangCount}, 음: ${result1.yinCount}`);
  console.log(`균형 점수: ${result1.balanceScore.toFixed(1)}점`);
  console.log(`조화: ${result1.harmony}`);
  console.log(`추천: ${result1.patternEvaluation.recommendation}\n`);

  // 테스트 케이스 2: 이서연 (7, 9, 10)
  console.log('=== 테스트 2: 이서연 (7획, 9획, 10획) ===');
  const result2 = validator.analyzeYinYang('이', '서연', 7, [9, 10]);
  console.log(`패턴: ${result2.pattern.join('-')}`);
  console.log(`양: ${result2.yangCount}, 음: ${result2.yinCount}`);
  console.log(`균형 점수: ${result2.balanceScore.toFixed(1)}점`);
  console.log(`조화: ${result2.harmony}`);
  console.log(`추천: ${result2.patternEvaluation.recommendation}\n`);

  // 테스트 케이스 3: 박지우 (5, 7, 6) - 교대 패턴
  console.log('=== 테스트 3: 박지우 (5획, 7획, 6획) ===');
  const result3 = validator.analyzeYinYang('박', '지우', 5, [7, 6]);
  console.log(`패턴: ${result3.pattern.join('-')}`);
  console.log(`양: ${result3.yangCount}, 음: ${result3.yinCount}`);
  console.log(`균형 점수: ${result3.balanceScore.toFixed(1)}점`);
  console.log(`조화: ${result3.harmony}`);
  console.log(`추천: ${result3.patternEvaluation.recommendation}\n`);

  // 테스트 케이스 4: 최민수 (8, 5, 9) - 모두 홀수/짝수
  console.log('=== 테스트 4: 정현우 (8획, 8획, 6획) - 모두 짝수 ===');
  const result4 = validator.analyzeYinYang('정', '현우', 8, [8, 6]);
  console.log(`패턴: ${result4.pattern.join('-')}`);
  console.log(`양: ${result4.yangCount}, 음: ${result4.yinCount}`);
  console.log(`균형 점수: ${result4.balanceScore.toFixed(1)}점`);
  console.log(`조화: ${result4.harmony}`);
  console.log(`추천: ${result4.patternEvaluation.recommendation}\n`);

  // 추천 패턴
  console.log('=== 3자 이름 추천 패턴 ===');
  const patterns = validator.recommendPatterns(3);
  patterns.forEach((p, i) => {
    console.log(`${i + 1}. ${p.pattern.join('-')} (${p.score}점) - ${p.description}`);
  });
}
