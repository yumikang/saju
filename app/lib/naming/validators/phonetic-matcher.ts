/**
 * 음운 매칭기 (Phonetic Matcher)
 *
 * 한글 이름의 발음 분석 및 평가
 *
 * 기능:
 * - 한글 → IPA (국제음성기호) 변환
 * - 발음 유사도 계산
 * - 부르기 쉬운 정도 평가
 * - 음운학적 조화 분석
 *
 * MVP 버전: 실용적인 간소화된 구현
 */

/**
 * 한글 음소 분해 결과
 */
export interface HangulPhoneme {
  char: string;
  초성: string; // 초성 자음
  중성: string; // 중성 모음
  종성: string; // 종성 자음 (없으면 '')
  ipa: string; // IPA 표기
}

/**
 * 발음 분석 결과
 */
export interface PhoneticAnalysis {
  // 각 글자 분해
  phonemes: HangulPhoneme[];

  // IPA 전체 표기
  ipaFull: string;

  // 발음 난이도 (0-100, 낮을수록 어려움)
  pronunciationEase: number;

  // 음운 조화 점수 (0-100)
  phonologicalHarmony: number;

  // 전체 점수 (0-100)
  overallScore: number;

  // 문제점 목록
  issues: string[];

  // 강점 목록
  strengths: string[];

  // 상세 설명
  explanation: string;
}

/**
 * PhoneticMatcher
 */
export class PhoneticMatcher {
  // 초성 (19개)
  private readonly 초성목록 = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];

  // 중성 (21개)
  private readonly 중성목록 = [
    'ㅏ',
    'ㅐ',
    'ㅑ',
    'ㅒ',
    'ㅓ',
    'ㅔ',
    'ㅕ',
    'ㅖ',
    'ㅗ',
    'ㅘ',
    'ㅙ',
    'ㅚ',
    'ㅛ',
    'ㅜ',
    'ㅝ',
    'ㅞ',
    'ㅟ',
    'ㅠ',
    'ㅡ',
    'ㅢ',
    'ㅣ',
  ];

  // 종성 (28개, '' 포함)
  private readonly 종성목록 = [
    '',
    'ㄱ',
    'ㄲ',
    'ㄳ',
    'ㄴ',
    'ㄵ',
    'ㄶ',
    'ㄷ',
    'ㄹ',
    'ㄺ',
    'ㄻ',
    'ㄼ',
    'ㄽ',
    'ㄾ',
    'ㄿ',
    'ㅀ',
    'ㅁ',
    'ㅂ',
    'ㅄ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];

  // 초성 → IPA 매핑 (간소화)
  private readonly 초성IPA: Record<string, string> = {
    ㄱ: 'k',
    ㄲ: 'k͈',
    ㄴ: 'n',
    ㄷ: 't',
    ㄸ: 't͈',
    ㄹ: 'r/l',
    ㅁ: 'm',
    ㅂ: 'p',
    ㅃ: 'p͈',
    ㅅ: 's',
    ㅆ: 's͈',
    ㅇ: '',
    ㅈ: 'tɕ',
    ㅉ: 'tɕ͈',
    ㅊ: 'tɕʰ',
    ㅋ: 'kʰ',
    ㅌ: 'tʰ',
    ㅍ: 'pʰ',
    ㅎ: 'h',
  };

  // 중성 → IPA 매핑
  private readonly 중성IPA: Record<string, string> = {
    ㅏ: 'a',
    ㅐ: 'ɛ',
    ㅑ: 'ja',
    ㅒ: 'jɛ',
    ㅓ: 'ʌ',
    ㅔ: 'e',
    ㅕ: 'jʌ',
    ㅖ: 'je',
    ㅗ: 'o',
    ㅘ: 'wa',
    ㅙ: 'wɛ',
    ㅚ: 'ø',
    ㅛ: 'jo',
    ㅜ: 'u',
    ㅝ: 'wʌ',
    ㅞ: 'we',
    ㅟ: 'wi',
    ㅠ: 'ju',
    ㅡ: 'ɯ',
    ㅢ: 'ɰi',
    ㅣ: 'i',
  };

  // 종성 → IPA 매핑
  private readonly 종성IPA: Record<string, string> = {
    '': '',
    ㄱ: 'k̚',
    ㄲ: 'k̚',
    ㄳ: 'k̚',
    ㄴ: 'n',
    ㄵ: 'n',
    ㄶ: 'n',
    ㄷ: 't̚',
    ㄹ: 'l',
    ㄺ: 'k̚',
    ㄻ: 'm',
    ㄼ: 'l',
    ㄽ: 'l',
    ㄾ: 'l',
    ㄿ: 'p̚',
    ㅀ: 'l',
    ㅁ: 'm',
    ㅂ: 'p̚',
    ㅄ: 'p̚',
    ㅅ: 't̚',
    ㅆ: 't̚',
    ㅇ: 'ŋ',
    ㅈ: 't̚',
    ㅊ: 't̚',
    ㅋ: 'k̚',
    ㅌ: 't̚',
    ㅍ: 'p̚',
    ㅎ: 't̚',
  };

  /**
   * 한글 분해
   */
  private decomposeHangul(char: string): { 초성: string; 중성: string; 종성: string } {
    const code = char.charCodeAt(0);

    // 한글 범위 체크 (가 = 0xAC00, 힣 = 0xD7A3)
    if (code < 0xac00 || code > 0xd7a3) {
      return { 초성: '', 중성: '', 종성: '' };
    }

    const base = code - 0xac00;
    const 초성Index = Math.floor(base / 588);
    const 중성Index = Math.floor((base % 588) / 28);
    const 종성Index = base % 28;

    return {
      초성: this.초성목록[초성Index],
      중성: this.중성목록[중성Index],
      종성: this.종성목록[종성Index],
    };
  }

  /**
   * 한글 → IPA 변환
   */
  private toIPA(char: string): { phoneme: HangulPhoneme; ipa: string } {
    const { 초성, 중성, 종성 } = this.decomposeHangul(char);

    const 초성IPA = this.초성IPA[초성] || '';
    const 중성IPA = this.중성IPA[중성] || '';
    const 종성IPA = this.종성IPA[종성] || '';

    const ipa = 초성IPA + 중성IPA + 종성IPA;

    return {
      phoneme: {
        char,
        초성,
        중성,
        종성,
        ipa,
      },
      ipa,
    };
  }

  /**
   * 이름 발음 분석
   */
  analyzePhonetics(name: string): PhoneticAnalysis {
    const chars = name.split('');
    const phonemes: HangulPhoneme[] = [];
    const ipaParts: string[] = [];

    // 각 글자 분해 및 IPA 변환
    for (const char of chars) {
      const { phoneme, ipa } = this.toIPA(char);
      phonemes.push(phoneme);
      ipaParts.push(ipa);
    }

    const ipaFull = ipaParts.join('.');

    // 발음 난이도 계산
    const pronunciationEase = this.calculatePronunciationEase(phonemes);

    // 음운 조화 계산
    const phonologicalHarmony = this.calculatePhonologicalHarmony(phonemes);

    // 전체 점수
    const overallScore = (pronunciationEase * 0.6 + phonologicalHarmony * 0.4);

    // 문제점 및 강점 분석
    const { issues, strengths } = this.analyzeIssuesAndStrengths(phonemes, pronunciationEase, phonologicalHarmony);

    // 상세 설명
    const explanation = this.generateExplanation(phonemes, ipaFull, pronunciationEase, phonologicalHarmony, issues, strengths);

    return {
      phonemes,
      ipaFull,
      pronunciationEase,
      phonologicalHarmony,
      overallScore,
      issues,
      strengths,
      explanation,
    };
  }

  /**
   * 발음 난이도 계산
   *
   * 점수가 높을수록 발음하기 쉬움 (0-100)
   */
  private calculatePronunciationEase(phonemes: HangulPhoneme[]): number {
    let score = 100;

    for (const p of phonemes) {
      // 1. 경음 (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) - 외국인이 발음하기 어려움
      if (['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'].includes(p.초성)) {
        score -= 10;
      }

      // 2. 복잡한 종성 (겹받침)
      if (p.종성.length > 1) {
        score -= 8;
      }

      // 3. ㅢ, ㅚ, ㅟ 등 복잡한 모음
      if (['ㅢ', 'ㅚ', 'ㅟ', 'ㅞ'].includes(p.중성)) {
        score -= 5;
      }

      // 4. ㄹ 받침 (외국인에게 어려움)
      if (p.종성 === 'ㄹ') {
        score -= 3;
      }
    }

    // 5. 같은 자음 연속 (-5점)
    for (let i = 1; i < phonemes.length; i++) {
      if (phonemes[i].초성 === phonemes[i - 1].종성) {
        score -= 5;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 음운 조화 계산
   *
   * 한국어 고유의 음운 조화 원리:
   * - 양성 모음 (ㅏ, ㅗ, ㅑ, ㅛ) vs 음성 모음 (ㅓ, ㅜ, ㅕ, ㅠ, ㅡ)
   * - 같은 계열끼리 조화롭게 배치
   */
  private calculatePhonologicalHarmony(phonemes: HangulPhoneme[]): number {
    // 양성 모음
    const 양성모음 = ['ㅏ', 'ㅗ', 'ㅑ', 'ㅛ', 'ㅘ'];
    // 음성 모음
    const 음성모음 = ['ㅓ', 'ㅜ', 'ㅕ', 'ㅠ', 'ㅡ', 'ㅝ'];
    // 중성 모음
    const 중성모음 = ['ㅣ', 'ㅐ', 'ㅔ', 'ㅚ', 'ㅟ', 'ㅢ', 'ㅙ', 'ㅞ'];

    let 양성count = 0;
    let 음성count = 0;
    let 중성count = 0;

    for (const p of phonemes) {
      if (양성모음.includes(p.중성)) 양성count++;
      else if (음성모음.includes(p.중성)) 음성count++;
      else 중성count++;
    }

    const total = phonemes.length;

    // 조화로운 경우: 한 계열이 지배적
    const dominant = Math.max(양성count, 음성count);
    const harmony = dominant / total;

    // 중성 모음은 조화에 영향 없음 (패널티 없음)
    const score = harmony * 100;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 문제점 및 강점 분석
   */
  private analyzeIssuesAndStrengths(
    phonemes: HangulPhoneme[],
    ease: number,
    harmony: number
  ): { issues: string[]; strengths: string[] } {
    const issues: string[] = [];
    const strengths: string[] = [];

    // 발음 난이도 분석
    if (ease < 60) {
      issues.push('발음이 다소 어려울 수 있습니다');
    } else if (ease >= 80) {
      strengths.push('발음하기 쉬운 이름입니다');
    }

    // 경음 체크
    const 경음count = phonemes.filter((p) => ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'].includes(p.초성)).length;
    if (경음count > 0) {
      issues.push(`경음이 ${경음count}개 있어 발음이 강할 수 있습니다`);
    } else {
      strengths.push('경음이 없어 부드럽게 발음됩니다');
    }

    // 겹받침 체크
    const 겹받침count = phonemes.filter((p) => p.종성.length > 1).length;
    if (겹받침count > 0) {
      issues.push(`겹받침이 ${겹받침count}개 있어 발음이 복잡할 수 있습니다`);
    } else {
      strengths.push('겹받침이 없어 발음이 명확합니다');
    }

    // 음운 조화 분석
    if (harmony >= 80) {
      strengths.push('모음 조화가 뛰어납니다');
    } else if (harmony < 50) {
      issues.push('모음 조화가 다소 부족합니다');
    }

    // 이름 길이
    if (phonemes.length === 2) {
      strengths.push('적절한 길이로 기억하기 쉽습니다');
    } else if (phonemes.length > 3) {
      issues.push('이름이 다소 길 수 있습니다');
    }

    return { issues, strengths };
  }

  /**
   * 상세 설명 생성
   */
  private generateExplanation(
    phonemes: HangulPhoneme[],
    ipaFull: string,
    ease: number,
    harmony: number,
    issues: string[],
    strengths: string[]
  ): string {
    let explanation = '## 음운 분석\n\n';

    // 1. IPA 표기
    explanation += '### IPA 표기\n';
    explanation += `\`${ipaFull}\`\n\n`;

    // 2. 음소 분해
    explanation += '### 음소 분해\n';
    phonemes.forEach((p) => {
      explanation += `- **${p.char}**: 초성(${p.초성}) + 중성(${p.중성})`;
      if (p.종성) explanation += ` + 종성(${p.종성})`;
      explanation += ` → [${p.ipa}]\n`;
    });
    explanation += '\n';

    // 3. 발음 난이도
    explanation += '### 발음 난이도\n';
    explanation += `- 점수: ${ease.toFixed(1)}점 / 100점\n`;
    explanation += `- 등급: ${this.getEaseLevel(ease)}\n\n`;

    // 4. 음운 조화
    explanation += '### 음운 조화\n';
    explanation += `- 점수: ${harmony.toFixed(1)}점 / 100점\n`;
    explanation += `- 등급: ${this.getHarmonyLevel(harmony)}\n\n`;

    // 5. 강점
    if (strengths.length > 0) {
      explanation += '### ✅ 강점\n';
      strengths.forEach((s) => {
        explanation += `- ${s}\n`;
      });
      explanation += '\n';
    }

    // 6. 개선점
    if (issues.length > 0) {
      explanation += '### ⚠️ 개선 필요\n';
      issues.forEach((i) => {
        explanation += `- ${i}\n`;
      });
      explanation += '\n';
    }

    return explanation;
  }

  /**
   * 발음 난이도 등급
   */
  private getEaseLevel(score: number): string {
    if (score >= 90) return '매우 쉬움';
    if (score >= 75) return '쉬움';
    if (score >= 60) return '보통';
    if (score >= 40) return '어려움';
    return '매우 어려움';
  }

  /**
   * 음운 조화 등급
   */
  private getHarmonyLevel(score: number): string {
    if (score >= 90) return '완벽한 조화';
    if (score >= 70) return '좋은 조화';
    if (score >= 50) return '보통';
    if (score >= 30) return '약간 부조화';
    return '부조화';
  }

  /**
   * 빠른 점수 계산 (간단 버전)
   */
  quickScore(name: string): number {
    const analysis = this.analyzePhonetics(name);
    return analysis.overallScore;
  }
}

// 싱글톤 인스턴스
let phoneticMatcher: PhoneticMatcher;

export function getPhoneticMatcher(): PhoneticMatcher {
  if (!phoneticMatcher) {
    phoneticMatcher = new PhoneticMatcher();
  }
  return phoneticMatcher;
}

// ============================================================
// 테스트
// ============================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('🧪 음운 매칭기 테스트\n');

  const matcher = getPhoneticMatcher();

  // 테스트 케이스들
  const testNames = [
    { name: '민준', desc: '쉬운 발음' },
    { name: '서연', desc: '부드러운 발음' },
    { name: '짜증', desc: '경음 많음' },
    { name: '늙은이', desc: '겹받침 많음' },
    { name: '하늘', desc: '음운 조화' },
  ];

  testNames.forEach(({ name, desc }) => {
    console.log(`=== ${name} (${desc}) ===`);
    const result = matcher.analyzePhonetics(name);

    console.log(`IPA: ${result.ipaFull}`);
    console.log(`발음 난이도: ${result.pronunciationEase.toFixed(1)}점`);
    console.log(`음운 조화: ${result.phonologicalHarmony.toFixed(1)}점`);
    console.log(`전체 점수: ${result.overallScore.toFixed(1)}점`);

    if (result.strengths.length > 0) {
      console.log(`강점: ${result.strengths.join(', ')}`);
    }
    if (result.issues.length > 0) {
      console.log(`개선점: ${result.issues.join(', ')}`);
    }
    console.log();
  });
}
