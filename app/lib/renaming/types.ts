/**
 * Shared TypeScript interfaces for renaming service
 * Centralized to prevent drift and ensure consistency across nested routes
 *
 * @created 2025-10-28
 * @refactor Phase 1: Preparation for URL-based nested routing
 */

// ============================================================
// Form Data Types
// ============================================================

export interface HanjaChar {
  id: string;
  character: string;
  meaning: string;
  reading: string;
  element?: string;
  strokeCount?: number;
}

export interface RenamingFormData {
  // Current name information
  currentName: string;
  currentNameHanja: (HanjaChar | null)[];

  // Last name (성씨)
  lastName: string;
  lastNameHanja: HanjaChar | null;

  // Personal information
  gender: 'M' | 'F';
  birthDate: string; // ISO 8601 format (YYYY-MM-DD)
  birthTime: string; // HH:MM format
  calendarType: 'solar' | 'lunar';

  // Renaming preferences
  renamingReason: string;
  desiredMeaning: string;
}

// ============================================================
// Analysis Data Types
// ============================================================

export interface AnalysisData {
  analysisId: string;
  currentScore: number;
  elements: {
    목: number;
    화: number;
    토: number;
    금: number;
    수: number;
  };
  problems: string[];
  predictions: {
    career: number;
    health: number;
    relationships: number;
    wealth: number;
  };
}

// ============================================================
// Session Storage Types
// ============================================================

export interface RenamingSession {
  formData: RenamingFormData;
  analysisId?: string;
  currentScore?: number;
  createdAt: string;
  expiresAt: string;
}

// ============================================================
// Navigation Types
// ============================================================

export type RenamingStep = 'input' | 'analysis' | 'results' | 'experts';

export interface StepMetadata {
  step: RenamingStep;
  url: string;
  label: string;
  order: number;
}

export const RENAMING_STEPS: Record<RenamingStep, StepMetadata> = {
  input: { step: 'input', url: '/renaming', label: '정보입력', order: 1 },
  analysis: { step: 'analysis', url: '/renaming/analysis', label: '현재분석', order: 2 },
  results: { step: 'results', url: '/renaming/results', label: '개명제안', order: 3 },
  experts: { step: 'experts', url: '/renaming/experts', label: '전문가제안', order: 4 },
};

// ============================================================
// Utility Type Guards
// ============================================================

export function isValidStep(step: string): step is RenamingStep {
  return step === 'input' || step === 'analysis' || step === 'results' || step === 'experts';
}

export function getStepMetadata(step: RenamingStep): StepMetadata {
  return RENAMING_STEPS[step];
}

export function getCurrentStepFromPath(pathname: string): RenamingStep {
  if (pathname === '/renaming') return 'input';
  if (pathname.includes('/analysis')) return 'analysis';
  if (pathname.includes('/results')) return 'results';
  if (pathname.includes('/experts')) return 'experts';
  return 'input'; // default fallback
}

// ============================================================
// API Response Types (for consistency with existing handlers)
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AnalyzeCurrentResponse {
  analysisId: string;
  currentScore: number;
  analysis: AnalysisData;
}

export interface RecommendResponse {
  candidates: any[]; // TODO: Define proper candidate type
  saju: any; // TODO: Define proper saju type
}
