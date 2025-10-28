/**
 * Freemium V2 Results Route
 *
 * GET /naming/freemium-v2/results?sessionId=xxx
 *
 * New strategic freemium results page using freemium-v2 components.
 * Displays name recommendations with optimized conversion flow:
 * - 11-12위: Free preview names (emerald theme, fully detailed)
 * - Conversion CTA: Score comparison and value proposition
 * - 1-10위: Locked premium names (yellow theme, dual-layer blur)
 * - Payment modal: TossPayments integration
 *
 * Key Improvements over V1:
 * - Clean component architecture with separation of concerns
 * - Purpose-built components for strategic freemium
 * - Enhanced conversion psychology
 * - Better responsive design
 * - Improved accessibility
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { Card } from '~/components/ui/card';
import { Loader2 } from 'lucide-react';
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

/**
 * Freemium V2 Results Page Component
 */
export default function FreemiumV2ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [isLoading, setIsLoading] = useState(true);
  const [tiers, setTiers] = useState<FreemiumTiers | null>(null);
  const [metrics, setMetrics] = useState<PsychologicalMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch name recommendations on mount
  useEffect(() => {
    if (!sessionId) {
      setError('세션 ID가 없습니다');
      setIsLoading(false);
      return;
    }

    const fetchNameRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/naming/freemium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 3, sessionId }),
        });

        if (!response.ok) {
          throw new Error('서버 응답 오류');
        }

        const result: Stage3Response = await response.json();

        if (!result.success) {
          throw new Error('이름 추천에 실패했습니다');
        }

        // Convert API response to ScoredCandidate format
        const candidates: ScoredCandidate[] = result.recommendations.map((rec) => {
          const firstName = rec.fullName.slice(1); // Remove last name
          const chars = rec.characters.slice(0, 2); // Ensure exactly 2 characters

          return {
            firstName: [firstName, firstName] as [string, string],
            characters: [
              {
                id: 1,
                character: chars[0]?.character || '',
                meaning: chars[0]?.meaning || '',
                strokes: chars[0]?.strokes || 0,
                element: (chars[0]?.element?.toUpperCase() || 'WOOD') as Element,
                yinYang: 'YANG' as YinYang,
                koreanReading: '',
              },
              {
                id: 2,
                character: chars[1]?.character || '',
                meaning: chars[1]?.meaning || '',
                strokes: chars[1]?.strokes || 0,
                element: (chars[1]?.element?.toUpperCase() || 'WOOD') as Element,
                yinYang: 'YIN' as YinYang,
                koreanReading: '',
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

        // Classify into strategic freemium tiers (11-12위 free, 1-10위 premium)
        const classified = classifyCandidates(candidates);
        setTiers(classified);

        // Calculate psychological metrics for conversion
        const psychMetrics = calculatePsychologicalMetrics(classified);
        setMetrics(psychMetrics);
      } catch (error: any) {
        console.error('[Freemium V2 Results] Error:', error);
        setError(error.message || '서버 연결에 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNameRecommendations();
  }, [sessionId]);

  // Handle payment success
  const handlePaymentSuccess = (orderId: string) => {
    // Redirect to payment success page
    navigate(
      `/naming/freemium-v2/result?sessionId=${sessionId}&orderId=${orderId}&payment=success`
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <div className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-orange-500" />
              <h2 className="text-2xl font-bold mb-2">최적의 이름을 찾고 있습니다...</h2>
              <p className="text-gray-600">
                사주 분석을 바탕으로 완벽한 이름을 추천 중입니다
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tiers || !metrics || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-red-200">
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">
                오류가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/naming/freemium')}
                className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                처음으로 돌아가기
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Success state - render results layout
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
