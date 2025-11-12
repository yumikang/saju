/**
 * Type definitions for naming system
 */

import { Element, YinYang } from '@prisma/client';
import type { SajuResult } from '../saju/calculator';

// ============================================================
// Core Types
// ============================================================

export interface HanjaCharacter {
  id: number;
  character: string;
  strokes: number;
  element: Element;
  yinYang: YinYang;
  meaning: string;
  koreanReading: string;
  fortune?: '대길' | '길' | '평' | '흉' | '대흉';
  nameFrequency?: number;
  usageFrequency?: number;
  category?: string[];
  review?: 'approved' | 'needs_review' | 'rejected';
  isGoodForNaming?: boolean;
}

export interface NameCandidate {
  firstName: [string, string];
  characters: [HanjaCharacter, HanjaCharacter];
  score: number;
  breakdown: ScoreBreakdown;
  analysis: NameAnalysis;
}

export interface ScoreBreakdown {
  element: number;       // 40% - 오행 조화
  yinyang: number;       // 20% - 음양 균형
  numerology: number;    // 20% - 81수리
  meaning: number;       // 20% - 의미 조화
}

export interface DetailedScore {
  score: number;                  // 0-100
  weight: number;                 // 가중치
  weightedScore: number;          // score * weight
  explanation: string;            // 상세 설명
  subScores?: Record<string, number>; // 세부 점수
}

export interface ScoredCandidate extends NameCandidate {
  scores: {
    overall: number;
    elementHarmony: DetailedScore;
    yinYangBalance: DetailedScore;
    numerology: DetailedScore | null;  // DISABLED: 획수 데이터 부정확
    meaningHarmony: DetailedScore;
    linguistic: DetailedScore;  // NEW: 언어적 자연스러움 (같은 음절 반복, 의미 중복)
  };
  confidenceScore: number;
}

export interface ScoringContext {
  sajuResult: SajuResult;
  lastName: string;
  lastNameHanja?: string;
  lastNameStrokes: number;
  preferences?: NamingPreferences;
  config?: {
    batchSize?: number;
  };
  /** 점수 계산 모드 (균형형/의미형/하이브리드) */
  scoringMode?: import('./types/scoring-mode').ScoringMode;
}

export interface NameAnalysis {
  elementHarmony: ElementHarmonyAnalysis;
  yinyangBalance: YinYangBalanceAnalysis;
  numerologyGrids: NumerologyGridsAnalysis;
  meaningCompatibility: MeaningCompatibilityAnalysis;
  reasoning: string[];
}

// ============================================================
// Element Analysis
// ============================================================

export interface ElementHarmonyAnalysis {
  lacksComplement: boolean;
  hasProducingCycle: boolean;
  hasConflictingCycle: boolean;
  strengthensFavorable: boolean;
  details: string[];
}

// ============================================================
// Yin-Yang Analysis
// ============================================================

export interface YinYangBalanceAnalysis {
  pattern: string;  // e.g., "양-양-음" or "음-음-양"
  isBalanced: boolean;
  distribution: {
    yang: number;
    yin: number;
  };
  details: string[];
}

// ============================================================
// Numerology Analysis
// ============================================================

export interface NumerologyGridsAnalysis {
  원격: GridAnalysis;  // 초년운
  형격: GridAnalysis;  // 청장년운
  이격: GridAnalysis;  // 중말년운
  정격: GridAnalysis;  // 말년운
  overallFortune: string;
}

export interface GridAnalysis {
  strokes: number;
  number: number;  // 1-81
  fortune: FortuneRating;
  meaning: string;
  score: number;
}

export type FortuneRating = '대길' | '길' | '평' | '흉' | '대흉';

// ============================================================
// Meaning Analysis
// ============================================================

export interface MeaningCompatibilityAnalysis {
  theme: string;
  isHarmonious: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  details: string[];
}

// ============================================================
// Input/Output
// ============================================================

export interface NamingRequest {
  saju: SajuResult;
  lastName: string;
  gender?: 'male' | 'female' | 'neutral';
  preferences?: NamingPreferences;
  count?: number;
}

export type ParentValue = 'success' | 'health' | 'popularity' | 'wealth' | 'peace' | 'wisdom';

export interface NamingPreferences {
  avoidCharacters?: string[];
  preferredElements?: Element[];
  preferredMeanings?: string[];
  minStrokesPerChar?: number;
  maxStrokesPerChar?: number;
  parentValues?: ParentValue[];  // 부모가 선택한 가치관
}

export interface NamingResponse {
  candidates: NameCandidate[];
  metadata: {
    totalGenerated: number;
    totalScored: number;
    executionTime: number;
    timestamp: string;
  };
  saju: {
    lackingElements: Element[];
    favorableElements: Element[];
    elementCounts: Record<Element, number>;
  };
}

// ============================================================
// Configuration
// ============================================================

export interface ScoringWeights {
  element: number;
  yinyang: number;
  numerology: number;
  meaning: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  element: 0.4,
  yinyang: 0.2,
  numerology: 0.2,
  meaning: 0.2,
};

export interface NamingConfig {
  weights: ScoringWeights;
  filtering: {
    minTotalScore: number;
    maxCandidates: number;
    requireElementMatch: boolean;
    avoidInauspiciousNumbers: boolean;
  };
  performance: {
    batchSize: number;
    cacheEnabled: boolean;
    cacheTTL: number; // seconds
  };
}

export const DEFAULT_CONFIG: NamingConfig = {
  weights: DEFAULT_WEIGHTS,
  filtering: {
    minTotalScore: 60,
    maxCandidates: 50,
    requireElementMatch: true,
    avoidInauspiciousNumbers: true,
  },
  performance: {
    batchSize: 100,
    cacheEnabled: true,
    cacheTTL: 3600,
  },
};
