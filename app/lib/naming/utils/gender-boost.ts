/**
 * 한글 음운 기반 성별 보정 시스템
 *
 * "5번째 축": 한글 종성 기반 성별 보정
 * - DB는 건드리지 않고 런타임에서 점수 보정만
 * - 절대 하드컷 금지, 보너스만 부여
 * - 감점은 약하게 (-2), 가점은 강하게 (+6 또는 +3)
 *
 * 설계 철학:
 * - DB는 보수적으로 (한자 단위 성별)
 * - 결과는 한국어 감성으로 (한글 종성 보정)
 */

/**
 * 한글 종성 기반 성별 보정 점수 계산
 *
 * @param koreanName - 한글 이름 (예: "수아", "민준", "하린")
 * @param targetGender - 목표 성별 ("M" | "F" | null)
 * @returns 보정 점수 (-2 ~ +6)
 *
 * @example
 * genderBoost("수아", "F")  // +6 (여성형 어미)
 * genderBoost("민준", "M")  // +6 (남성형 어미)
 * genderBoost("서연", "F")  // +3 (중립형 어미)
 */
export function genderBoost(
  koreanName: string,
  targetGender: 'M' | 'F' | null
): number {
  if (!koreanName || !targetGender) return 0;

  let score = 0;

  // 1음절: 마지막 글자
  const last1 = koreanName.slice(-1);
  // 2음절: 마지막 2글자 (3글자 이름용)
  const last2 = koreanName.slice(-2);

  // ========================================
  // 여성형 보정
  // ========================================
  if (targetGender === 'F') {
    // 강한 여성형 어미 (+6)
    const strongFemale = ['아', '라', '나', '다', '사', '예', '연'];
    if (strongFemale.includes(last1)) {
      score += 6;
    }

    // 중립형 어미 (+3) - 요즘은 성별 중립에 가까움
    const neutralFemale = ['은', '윤', '서', '유'];
    if (neutralFemale.includes(last1) && !strongFemale.includes(last1)) {
      score += 3;
    }

    // 3글자 이름: 마지막 2음절 패턴 체크
    if (koreanName.length === 3) {
      const femalePatterns = ['아린', '아람', '하늘', '지은', '서윤'];
      if (femalePatterns.includes(last2)) {
        score += 4; // 2음절 패턴은 +4
      }
    }

    // 남성형 어미로 끝나면 약간 감점 (-2)
    const maleEndings = ['준', '호', '현', '우', '석', '범', '태', '진', '환'];
    if (maleEndings.includes(last1)) {
      score -= 2;
    }
  }

  // ========================================
  // 남성형 보정
  // ========================================
  if (targetGender === 'M') {
    // 강한 남성형 어미 (+6)
    const strongMale = ['준', '호', '현', '우', '석', '범', '태', '진', '환'];
    if (strongMale.includes(last1)) {
      score += 6;
    }

    // 중립형 어미 (+3)
    const neutralMale = ['민', '빈', '원', '서', '하', '솔'];
    if (neutralMale.includes(last1) && !strongMale.includes(last1)) {
      score += 3;
    }

    // 3글자 이름: 마지막 2음절 패턴 체크
    if (koreanName.length === 3) {
      const malePatterns = ['민호', '준서', '지훈', '현우', '서준'];
      if (malePatterns.includes(last2)) {
        score += 4;
      }
    }

    // 여성형 어미로 끝나면 약간 감점 (-2)
    const femaleEndings = ['아', '라', '나', '다', '사', '예', '연'];
    if (femaleEndings.includes(last1)) {
      score -= 2;
    }
  }

  return score;
}

/**
 * 이름 후보에 대한 상세 성별 분석
 *
 * @param koreanName - 한글 이름
 * @param targetGender - 목표 성별
 * @returns 분석 결과 (점수, 이유)
 */
export function analyzeGenderFit(
  koreanName: string,
  targetGender: 'M' | 'F' | null
): {
  score: number;
  reason: string;
  confidence: 'strong' | 'moderate' | 'weak' | 'neutral';
} {
  const score = genderBoost(koreanName, targetGender);
  const last1 = koreanName.slice(-1);

  let reason = '';
  let confidence: 'strong' | 'moderate' | 'weak' | 'neutral' = 'neutral';

  if (targetGender === 'F') {
    if (score >= 6) {
      reason = `"${last1}"로 끝나는 강한 여성형 이름`;
      confidence = 'strong';
    } else if (score >= 3) {
      reason = `"${last1}"로 끝나는 중립형 이름 (여성 선호)`;
      confidence = 'moderate';
    } else if (score < 0) {
      reason = `"${last1}"로 끝나는 남성형 어미 (여성 이름으로는 약함)`;
      confidence = 'weak';
    } else {
      reason = '성별 중립적인 이름';
      confidence = 'neutral';
    }
  }

  if (targetGender === 'M') {
    if (score >= 6) {
      reason = `"${last1}"로 끝나는 강한 남성형 이름`;
      confidence = 'strong';
    } else if (score >= 3) {
      reason = `"${last1}"로 끝나는 중립형 이름 (남성 선호)`;
      confidence = 'moderate';
    } else if (score < 0) {
      reason = `"${last1}"로 끝나는 여성형 어미 (남성 이름으로는 약함)`;
      confidence = 'weak';
    } else {
      reason = '성별 중립적인 이름';
      confidence = 'neutral';
    }
  }

  return { score, reason, confidence };
}

/**
 * 성별 보정 룰 세트 (관리자용)
 *
 * 나중에 관리자 페이지에서 이 룰을 수정할 수 있도록
 * 별도 파일로 분리하거나 DB에 저장 가능
 */
export const GENDER_BOOST_RULES = {
  female: {
    strong: {
      endings: ['아', '라', '나', '다', '사', '예', '연'],
      score: 6,
      description: '2000년대~현재 강한 여아 이름 어미',
    },
    neutral: {
      endings: ['은', '윤', '서', '유'],
      score: 3,
      description: '중립형 어미 (요즘은 성별 중립에 가까움)',
    },
    patterns: {
      threeChar: ['아린', '아람', '하늘', '지은', '서윤'],
      score: 4,
      description: '3글자 이름 여성형 패턴',
    },
  },
  male: {
    strong: {
      endings: ['준', '호', '현', '우', '석', '범', '태', '진', '환'],
      score: 6,
      description: '강한 남아 이름 어미',
    },
    neutral: {
      endings: ['민', '빈', '원', '서', '하', '솔'],
      score: 3,
      description: '중립형 어미 (남성 선호)',
    },
    patterns: {
      threeChar: ['민호', '준서', '지훈', '현우', '서준'],
      score: 4,
      description: '3글자 이름 남성형 패턴',
    },
  },
  penalty: {
    score: -2,
    description: '반대 성별 어미일 때 약한 감점',
  },
};

/**
 * 성별 중립 이름 목록
 *
 * "하린, 서연, 윤서, 시윤, 지안" 같은 이름들은
 * 남녀 모두 사용하므로 강한 가점을 주지 않음
 */
export const NEUTRAL_NAMES = [
  '하린',
  '서연',
  '윤서',
  '시윤',
  '지안',
  '예린',
  '은서',
  '서하',
  '지우',
  '하은',
];

/**
 * 중립 이름인지 확인
 */
export function isNeutralName(koreanName: string): boolean {
  return NEUTRAL_NAMES.includes(koreanName);
}

/**
 * 중립 이름이면 보정 점수를 약화
 */
export function genderBoostWithNeutralCheck(
  koreanName: string,
  targetGender: 'M' | 'F' | null
): number {
  const baseScore = genderBoost(koreanName, targetGender);

  // 중립 이름이면 점수를 절반으로
  if (isNeutralName(koreanName)) {
    return Math.floor(baseScore / 2);
  }

  return baseScore;
}
