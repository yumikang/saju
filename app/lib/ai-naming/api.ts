/**
 * API utilities for AI Naming Service
 *
 * Client-side functions for calling NamingPipeline API
 */

import type { AINamingRequest, AINamingResponse } from './types';

/**
 * Generate names using NamingPipeline
 *
 * POST /api/naming/generate
 */
export async function generateNames(
  request: AINamingRequest
): Promise<AINamingResponse> {
  try {
    const response = await fetch('/api/naming/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || '서버 오류가 발생했습니다',
          details: data.error,
        },
      };
    }

    return data;
  } catch (error) {
    console.error('[generateNames] Network error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        details: error,
      },
    };
  }
}

/**
 * Parse date and time to birth info
 */
export function parseBirthInfo(
  birthDate: Date,
  birthTime: string,
  isLunar: boolean,
  gender: 'M' | 'F'
) {
  const [hour, minute] = birthTime.split(':').map(Number);

  return {
    year: birthDate.getFullYear(),
    month: birthDate.getMonth() + 1,
    day: birthDate.getDate(),
    hour,
    minute,
    isLunar,
    gender,
  };
}

/**
 * Format name candidate for display
 */
export function formatNameDisplay(
  lastName: string,
  firstName: string
): string {
  return `${lastName}${firstName}`;
}

/**
 * Get score color class based on score value
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get score badge variant
 */
export function getScoreBadgeVariant(
  score: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 70) return 'secondary';
  if (score >= 60) return 'outline';
  return 'destructive';
}

/**
 * Format execution time
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}초`;
}

/**
 * Get fortune color
 */
export function getFortuneColor(
  fortune: '대길' | '길' | '평' | '흉' | '대흉'
): string {
  switch (fortune) {
    case '대길':
      return 'text-green-600 bg-green-50';
    case '길':
      return 'text-blue-600 bg-blue-50';
    case '평':
      return 'text-gray-600 bg-gray-50';
    case '흉':
      return 'text-orange-600 bg-orange-50';
    case '대흉':
      return 'text-red-600 bg-red-50';
  }
}

/**
 * Get quality badge variant
 */
export function getQualityVariant(
  quality: 'excellent' | 'good' | 'fair' | 'poor'
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (quality) {
    case 'excellent':
      return 'default';
    case 'good':
      return 'secondary';
    case 'fair':
      return 'outline';
    case 'poor':
      return 'destructive';
  }
}
