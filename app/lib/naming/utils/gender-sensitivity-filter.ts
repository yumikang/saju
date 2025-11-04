/**
 * Gender Sensitivity Filter
 *
 * 성별 감성 충돌 방지 필터링 시스템
 *
 * 로직:
 * - 여아: 남성적 한자 사용 시 감점 또는 차단
 * - 남아: 여성적 한자 사용 시 감점 또는 차단
 */

import genderSensitiveData from '../data/gender-sensitive-hanja.json';

export type Gender = 'MALE' | 'FEMALE' | 'NEUTRAL';

export interface GenderSensitivityResult {
  isAppropriate: boolean;
  penalty: number; // 0 (적합) ~ -100 (완전 차단)
  issues: GenderSensitivityIssue[];
}

export interface GenderSensitivityIssue {
  char: string;
  reading: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 한자 → 심각도 매핑
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MASCULINE_HANJA_MAP = new Map<
  string,
  { reading: string; reason: string; severity: 'high' | 'medium' | 'low' }
>();

const FEMININE_HANJA_MAP = new Map<
  string,
  { reading: string; reason: string; severity: 'high' | 'medium' | 'low' }
>();

// 데이터 초기화
genderSensitiveData.masculine.hanja.forEach((item) => {
  let severity: 'high' | 'medium' | 'low' = 'low';

  if (genderSensitiveData.severity.high.masculine.includes(item.char)) {
    severity = 'high';
  } else if (genderSensitiveData.severity.medium.masculine.includes(item.char)) {
    severity = 'medium';
  }

  MASCULINE_HANJA_MAP.set(item.char, {
    reading: item.reading,
    reason: item.reason,
    severity,
  });
});

genderSensitiveData.feminine.hanja.forEach((item) => {
  let severity: 'high' | 'medium' | 'low' = 'low';

  if (genderSensitiveData.severity.high.feminine.includes(item.char)) {
    severity = 'high';
  } else if (genderSensitiveData.severity.medium.feminine.includes(item.char)) {
    severity = 'medium';
  }

  FEMININE_HANJA_MAP.set(item.char, {
    reading: item.reading,
    reason: item.reason,
    severity,
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 심각도 → 패널티 점수 매핑
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SEVERITY_PENALTY: Record<'high' | 'medium' | 'low', number> = {
  high: -100, // 완전 차단 (0점 처리)
  medium: -40, // 강한 감점
  low: -20, // 약한 감점
};

/**
 * 성별 감성 적합성 평가
 *
 * @param nameHanja - 이름 한자 배열 (예: ['智', '宇'])
 * @param gender - 성별
 * @returns 적합성 평가 결과
 */
export function evaluateGenderSensitivity(
  nameHanja: string[],
  gender: Gender
): GenderSensitivityResult {
  // NEUTRAL 성별은 필터링 제외
  if (gender === 'NEUTRAL') {
    return {
      isAppropriate: true,
      penalty: 0,
      issues: [],
    };
  }

  const issues: GenderSensitivityIssue[] = [];
  let totalPenalty = 0;

  nameHanja.forEach((char) => {
    if (gender === 'FEMALE') {
      // 여아: 남성적 한자 체크
      const masculineInfo = MASCULINE_HANJA_MAP.get(char);
      if (masculineInfo) {
        issues.push({
          char,
          reading: masculineInfo.reading,
          reason: masculineInfo.reason,
          severity: masculineInfo.severity,
        });
        totalPenalty += SEVERITY_PENALTY[masculineInfo.severity];
      }
    } else if (gender === 'MALE') {
      // 남아: 여성적 한자 체크
      const feminineInfo = FEMININE_HANJA_MAP.get(char);
      if (feminineInfo) {
        issues.push({
          char,
          reading: feminineInfo.reading,
          reason: feminineInfo.reason,
          severity: feminineInfo.severity,
        });
        totalPenalty += SEVERITY_PENALTY[feminineInfo.severity];
      }
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 적합성 판단
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // - high severity 문제 있으면 무조건 부적합
  // - medium/low severity 문제 있으면 부적합 (패널티가 있으면 부적합)
  const hasHighSeverity = issues.some((issue) => issue.severity === 'high');
  const isAppropriate = issues.length === 0; // 이슈가 하나라도 있으면 부적합

  return {
    isAppropriate,
    penalty: totalPenalty,
    issues,
  };
}

/**
 * 성별 감성 점수 조정
 *
 * @param baseScore - 기본 점수 (0-100)
 * @param nameHanja - 이름 한자 배열
 * @param gender - 성별
 * @returns 조정된 점수 (0-100)
 */
export function adjustScoreForGenderSensitivity(
  baseScore: number,
  nameHanja: string[],
  gender: Gender
): number {
  const result = evaluateGenderSensitivity(nameHanja, gender);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 패널티 적용
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (result.penalty === -100) {
    // high severity → 완전 차단
    return 0;
  }

  const adjustedScore = baseScore + result.penalty;
  return Math.max(0, Math.min(100, adjustedScore));
}

/**
 * 성별 감성 필터링 (완전 차단)
 *
 * @param nameHanja - 이름 한자 배열
 * @param gender - 성별
 * @returns true면 통과, false면 차단
 */
export function passesGenderSensitivityFilter(
  nameHanja: string[],
  gender: Gender
): boolean {
  const result = evaluateGenderSensitivity(nameHanja, gender);
  return result.isAppropriate;
}

/**
 * 성별 감성 이슈 로깅 (디버깅용)
 *
 * @param nameHanja - 이름 한자 배열
 * @param gender - 성별
 */
export function logGenderSensitivityIssues(nameHanja: string[], gender: Gender): void {
  const result = evaluateGenderSensitivity(nameHanja, gender);

  if (result.issues.length > 0) {
    console.log(`[GenderSensitivity] 이름: ${nameHanja.join('')}, 성별: ${gender}`);
    console.log(`[GenderSensitivity] 적합성: ${result.isAppropriate ? '✅' : '❌'}`);
    console.log(`[GenderSensitivity] 총 패널티: ${result.penalty}점`);

    result.issues.forEach((issue) => {
      const emoji = issue.severity === 'high' ? '🚨' : issue.severity === 'medium' ? '⚠️' : '⚡';
      console.log(`  ${emoji} ${issue.char} (${issue.reading}): ${issue.reason}`);
    });
  }
}
