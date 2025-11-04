/**
 * Scoring Context Builder
 *
 * ScoringContext 생성 시 사주 기반 자동 모드 추천 적용
 */

import type { ScoringContext } from '../types';
import type { SajuResult } from '../../saju/calculator';
import type { NamingPreferences } from '../types';
import { recommendScoringMode } from './mode-recommendation';
import type { ScoringMode } from '../types/scoring-mode';

export interface BuildScoringContextOptions {
  sajuResult: SajuResult;
  lastName: string;
  lastNameHanja?: string;
  lastNameStrokes: number;
  preferences?: NamingPreferences;

  /** 사용자가 직접 선택한 모드 (없으면 자동 추천) */
  userSelectedMode?: ScoringMode;

  /** 자동 추천 비활성화 (기본: false) */
  disableAutoRecommendation?: boolean;
}

/**
 * ScoringContext 생성 (자동 모드 추천 포함)
 *
 * @param options - Context 생성 옵션
 * @returns ScoringContext with recommended or user-selected mode
 */
export function buildScoringContext(options: BuildScoringContextOptions): ScoringContext {
  const {
    sajuResult,
    lastName,
    lastNameHanja,
    lastNameStrokes,
    preferences,
    userSelectedMode,
    disableAutoRecommendation = false,
  } = options;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 모드 결정 로직
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let scoringMode: ScoringMode;

  if (userSelectedMode) {
    // 1순위: 사용자가 직접 선택한 모드
    scoringMode = userSelectedMode;
    console.log(`[ScoringContext] 사용자 선택 모드: ${scoringMode}`);
  } else if (disableAutoRecommendation) {
    // 2순위: 자동 추천 비활성화 시 하이브리드 기본값
    scoringMode = 'hybrid';
    console.log(`[ScoringContext] 기본 모드: hybrid`);
  } else {
    // 3순위: 사주 기반 자동 추천
    const recommendation = recommendScoringMode(sajuResult);
    scoringMode = recommendation.recommendedMode;

    console.log(`[ScoringContext] 🎯 자동 추천 모드: ${scoringMode}`);
    console.log(`[ScoringContext] 추천 이유: ${recommendation.reason}`);
    console.log(`[ScoringContext] 오행 균형 점수: ${recommendation.elementBalance.score}점`);

    if (recommendation.elementBalance.lacks.length > 0) {
      console.log(`[ScoringContext] 부족 오행: ${recommendation.elementBalance.lacks.join(', ')}`);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ScoringContext 생성
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return {
    sajuResult,
    lastName,
    lastNameHanja,
    lastNameStrokes,
    preferences,
    scoringMode,
    config: {
      batchSize: 100,
    },
  };
}

/**
 * 모드 추천 정보 가져오기 (UI 표시용)
 *
 * @param sajuResult - 사주 분석 결과
 * @returns 추천 정보
 */
export function getModeRecommendationForUI(sajuResult: SajuResult) {
  return recommendScoringMode(sajuResult);
}
