/**
 * Type definitions for AI Naming Service
 *
 * Interfaces for NamingPipeline API integration
 */

import type { Element, YinYang } from '@prisma/client';

// ============================================================
// API Request/Response Types
// ============================================================

/**
 * POST /api/naming/generate Request
 */
export interface AINamingRequest {
  birthInfo: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    isLunar: boolean;
    gender: 'M' | 'F';
  };
  lastName: string;
  preferences?: {
    nameLength?: 2 | 3;
    values?: string[];
    avoidCharacters?: string[];
  };
  config?: {
    maxCandidates?: number;
    minScore?: number;
  };
}

/**
 * POST /api/naming/generate Response
 */
export interface AINamingResponse {
  success: boolean;
  message?: string;
  data?: {
    candidates: NameCandidate[];
    context: GenerationContext;
    metadata: GenerationMetadata;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Individual name candidate
 */
export interface NameCandidate {
  firstName: string; // e.g., "지우"
  characters: HanjaCharacter[]; // 2-3 characters
  score: number; // 0-100
  scores: {
    overall: number;
    elementHarmony: DetailedScore;
    yinYangBalance: DetailedScore;
    numerology: DetailedScore;
    meaningHarmony: DetailedScore;
  };
  analysis: {
    elementHarmony: {
      lacksComplement: boolean;
      hasProducingCycle: boolean;
      hasConflictingCycle: boolean;
      strengthensFavorable: boolean;
      details: string[];
    };
    yinyangBalance: {
      pattern: string;
      isBalanced: boolean;
      distribution: { yang: number; yin: number };
      details: string[];
    };
    numerologyGrids: {
      원격: GridAnalysis;
      형격: GridAnalysis;
      이격: GridAnalysis;
      정격: GridAnalysis;
      overallFortune: string;
    };
    meaningCompatibility: {
      theme: string;
      isHarmonious: boolean;
      quality: 'excellent' | 'good' | 'fair' | 'poor';
      details: string[];
    };
    reasoning: string[];
  };
}

/**
 * Hanja character details
 */
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
}

/**
 * Detailed score with breakdown
 */
export interface DetailedScore {
  score: number; // 0-100
  weight: number; // 가중치
  weightedScore: number; // score * weight
  explanation: string;
  subScores?: Record<string, number>;
}

/**
 * Numerology grid analysis
 */
export interface GridAnalysis {
  strokes: number;
  number: number; // 1-81
  fortune: '대길' | '길' | '평' | '흉' | '대흉';
  meaning: string;
  score: number;
}

/**
 * Generation context (Saju analysis)
 */
export interface GenerationContext {
  sajuResult: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
    elements: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
    yinYangBalance: {
      yin: number;
      yang: number;
    };
  };
  yongsinResult: {
    method: string;
    result: Element;
    confidence: number;
    reasoning: string;
    isWeak?: boolean;
    finalYongsin?: Element;
  };
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  totalCombinations: number;
  validatedCount: number;
  scoredCount: number;
  finalCount: number;
  executionTime: number; // ms
  stepTimings: {
    saju: number;
    yongsin: number;
    hanjaRecommend: number;
    combinations: number;
    validation: number;
    scoring: number;
    filtering: number;
    ranking: number;
  };
}

// ============================================================
// Form State Types
// ============================================================

/**
 * Birth info form state
 */
export interface BirthFormState {
  birthDate: Date | undefined;
  birthTime: string; // HH:mm format
  calendarType: 'solar' | 'lunar';
  gender: 'M' | 'F' | undefined;
  lastName: string;
  selectedHanja?: {
    char: string;
    strokes: number;
  };
}

/**
 * Preferences form state
 */
export interface PreferencesFormState {
  nameLength: 2 | 3;
  values: string[];
  avoidCharacters: string[];
}

// ============================================================
// UI State Types
// ============================================================

/**
 * Step indicator state
 */
export interface StepState {
  current: 1 | 2 | 3 | 4; // 입력 → 로딩 → 결과 → 상세
  completed: number[];
}

/**
 * Loading progress state
 */
export interface LoadingProgress {
  currentStep: number; // 1-8
  stepName: string;
  progress: number; // 0-100
  message: string;
}

/**
 * Pipeline step names (8 steps)
 */
export const PIPELINE_STEPS = [
  { id: 1, name: '사주 계산', duration: 20 },
  { id: 2, name: '용신 분석', duration: 50 },
  { id: 3, name: '한자 추천', duration: 30 },
  { id: 4, name: '이름 조합 생성', duration: 100 },
  { id: 5, name: '유효성 검증', duration: 150 },
  { id: 6, name: '점수 계산', duration: 200 },
  { id: 7, name: '필터링', duration: 50 },
  { id: 8, name: '순위 정렬', duration: 30 },
] as const;
