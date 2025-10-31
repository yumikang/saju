/**
 * Freemium Step 3: Name Results (Freemium V2)
 *
 * GET /naming/freemium/results?sessionId=xxx
 *
 * Displays name recommendations with strategic freemium-v2 structure:
 * - 10위: Free preview name (emerald theme, fully detailed)
 * - 1-9위: Locked premium names (purple theme, dual-layer blur)
 * - Conversion-optimized CTA with score comparison
 * - TossPayments integration
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { FreemiumResultsLayout } from '~/components/naming/freemium-v2';
import {
  classifyCandidates,
  calculatePsychologicalMetrics,
  type FreemiumTiers,
  type PsychologicalMetrics,
} from '~/lib/freemium/classification';
import type { ScoredCandidate, HanjaCharacter } from '~/lib/naming/types';
import type { Element, YinYang } from '@prisma/client';

// API response types
interface NameRecommendation {
  rank: number;
  fullName: string;
  characters: Array<{
    character: string;
    koreanReading: string;
    meaning: string;
    strokes: number;
    element: string;
  }>;
  scores: {
    overall: number;
    element: number;
    yinyang: number;
    numerology: number;
    meaning: number;
    aiMeaning?: number;
  };
  aiExplanation: string;
}

interface Stage3Response {
  success: true;
  sessionId: string;
  stage: 3;
  recommendations: NameRecommendation[];
  hasMore: boolean;
  pricing: {
    auto: number;
    expertRange: [number, number];
  };
  nextStage: 4;
}

interface LoaderData {
  sessionId: string;
  tiers: FreemiumTiers;
  metrics: PsychologicalMetrics;
}

// In-memory cache for Stage 3 results
const resultsCache = new Map<string, { data: LoaderData; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Loader: Fetch name recommendations on server-side with caching
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    throw new Response('세션 ID가 없습니다', { status: 400 });
  }

  // Check cache first
  const cached = resultsCache.get(sessionId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log('[Results Loader] Returning cached data for session:', sessionId);
    return json<LoaderData>(cached.data);
  }

  console.log('[Results Loader] Fetching fresh data for session:', sessionId);

  try {
    // Call Stage 3 API
    const apiUrl = `${url.origin}/api/naming/freemium`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 3, sessionId }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Results Loader] API error:', response.status, text);
      throw new Response(`API 오류: ${response.status}`, { status: 500 });
    }

    const result: Stage3Response = await response.json();

    if (!result.success) {
      console.error('[Results Loader] Result not successful:', result);
      throw new Response('이름 추천에 실패했습니다', { status: 500 });
    }

  // Convert API response to ScoredCandidate format
  const candidates: ScoredCandidate[] = result.recommendations.map((rec) => {
    const chars = rec.characters.slice(0, 2);
    const char1Reading = chars[0]?.koreanReading || '';
    const char2Reading = chars[1]?.koreanReading || '';

    return {
      firstName: [char1Reading, char2Reading] as [string, string],
      characters: [
        {
          id: 1,
          character: chars[0]?.character || '',
          meaning: chars[0]?.meaning || '',
          strokes: chars[0]?.strokes || 0,
          element: (chars[0]?.element?.toUpperCase() || 'WOOD') as Element,
          yinYang: 'YANG' as YinYang,
          koreanReading: char1Reading,
        },
        {
          id: 2,
          character: chars[1]?.character || '',
          meaning: chars[1]?.meaning || '',
          strokes: chars[1]?.strokes || 0,
          element: (chars[1]?.element?.toUpperCase() || 'WOOD') as Element,
          yinYang: 'YIN' as YinYang,
          koreanReading: char2Reading,
        },
      ] as [HanjaCharacter, HanjaCharacter],
      score: rec.scores.overall,
      breakdown: {
        element: rec.scores.element,
        yinyang: rec.scores.yinyang,
        numerology: rec.scores.numerology,
        meaning: rec.scores.meaning,
      },
      analysis: {
        elementHarmony: {
          lacksComplement: false,
          hasProducingCycle: false,
          hasConflictingCycle: false,
          strengthensFavorable: false,
          details: [],
        },
        yinyangBalance: {
          pattern: '',
          isBalanced: true,
          distribution: { yang: 0, yin: 0 },
          details: [],
        },
        numerologyGrids: {
          grids: [],
          overallFortune: '길',
          details: [],
        },
        meaningCompatibility: {
          themeAlignment: 0,
          synergy: 0,
          details: [],
        },
        reasoning: [],
      },
      scores: {
        overall: rec.scores.overall,
        elementHarmony: {
          score: rec.scores.element,
          weight: 40,
          weightedScore: rec.scores.element * 0.4,
          explanation: '오행 조화 점수',
        },
        yinYangBalance: {
          score: rec.scores.yinyang,
          weight: 20,
          weightedScore: rec.scores.yinyang * 0.2,
          explanation: '음양 균형 점수',
        },
        numerology: {
          score: rec.scores.numerology,
          weight: 25,
          weightedScore: rec.scores.numerology * 0.25,
          explanation: '수리 길흉 점수',
        },
        meaningHarmony: {
          score: rec.scores.meaning,
          weight: 15,
          weightedScore: rec.scores.meaning * 0.15,
          explanation: '의미 조화 점수',
        },
      },
      confidenceScore: 85,
    } as unknown as ScoredCandidate;
  });

  // Classify into strategic freemium tiers (10위 free, 1-9위 premium)
  const tiers = classifyCandidates(candidates);

  // Calculate psychological metrics for conversion
  const metrics = calculatePsychologicalMetrics(tiers);

  const loaderData: LoaderData = {
    sessionId,
    tiers,
    metrics,
  };

  // Cache the result
  resultsCache.set(sessionId, { data: loaderData, timestamp: now });

  // Clean up old cache entries
  for (const [key, value] of resultsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      resultsCache.delete(key);
    }
  }

  return json<LoaderData>(loaderData);
  } catch (error) {
    console.error('[Results Loader] Exception caught:', error);
    throw new Response(
      error instanceof Error ? error.message : '이름 추천 처리 중 오류가 발생했습니다',
      { status: 500 }
    );
  }
}

/**
 * Component: Display Freemium V2 results
 */
export default function FreemiumResultsPage() {
  const { sessionId, tiers, metrics } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Handle payment success
  const handlePaymentSuccess = (orderId: string) => {
    navigate(`/naming/freemium/result?sessionId=${sessionId}&orderId=${orderId}&payment=success`);
  };

  return (
    <FreemiumResultsLayout
      tiers={tiers}
      metrics={metrics}
      sessionId={sessionId}
      title="이름 추천 결과"
      description={`총 ${metrics.totalCount}개의 이름을 추천합니다`}
      paymentAmount={69000}
      onPaymentSuccess={handlePaymentSuccess}
      showProgress={true}
      showGuide={true}
    />
  );
}
