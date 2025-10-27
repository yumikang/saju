/**
 * Freemium Step 3: Name Results
 *
 * GET /naming/freemium/results?sessionId=xxx
 *
 * Displays name recommendations with freemium structure (2+8):
 * - 1-2위: Free names (fully accessible)
 * - 3-10위: Locked premium names (require payment)
 * - Premium CTA for payment
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { NameCard } from '~/components/naming/NameCard';
import { BlurredNameCard } from '~/components/naming/BlurredNameCard';
import { PremiumCTA } from '~/components/naming/PremiumCTA';
import { PaymentModal } from '~/components/naming/PaymentModal';
import {
  classifyCandidates,
  calculatePsychologicalMetrics,
  type FreemiumTiers,
  type PsychologicalMetrics,
} from '~/lib/freemium/classification';
import type { ScoredCandidate } from '~/lib/naming/types';

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

export default function FreemiumResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<NameRecommendation[]>([]);
  const [tiers, setTiers] = useState<FreemiumTiers | null>(null);
  const [metrics, setMetrics] = useState<PsychologicalMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

        const result: Stage3Response = await response.json();

        if (result.success) {
          setRecommendations(result.recommendations);

          // Convert to ScoredCandidate format for classification
          const candidates: ScoredCandidate[] = result.recommendations.map((rec) => ({
            id: `${rec.rank}`,
            firstName: [rec.fullName.slice(1)], // Remove last name
            characters: rec.characters.map((char) => ({
              id: char.character,
              character: char.character,
              meaning: char.meaning,
              strokes: char.strokes,
              element: char.element,
              koreanReading: '', // Not provided in API response
            })),
            scores: {
              overall: rec.scores.overall,
              elementHarmony: {
                score: rec.scores.element,
                weight: 40,
                breakdown: { lackingElements: 0, elementBalance: 0, yongsinAlignment: 0 },
              },
              yinYangBalance: {
                score: rec.scores.yinyang,
                weight: 20,
                breakdown: { ganBalance: 0, jiBalance: 0, overallBalance: 0 },
              },
              numerology: {
                score: rec.scores.numerology,
                weight: 25,
                breakdown: { totalStrokes: 0, individualStrokes: [] },
              },
              meaningHarmony: {
                score: rec.scores.meaning,
                weight: 15,
                breakdown: { valueAlignment: 0, synergy: 0 },
              },
            },
            totalStrokes: rec.characters.reduce((sum, char) => sum + char.strokes, 0),
            confidenceScore: 85,
            aiExplanation: rec.aiExplanation,
          }));

          // Classify into freemium tiers
          const classified = classifyCandidates(candidates);
          setTiers(classified);

          // Calculate psychological metrics
          const metrics = calculatePsychologicalMetrics(classified);
          setMetrics(metrics);
        } else {
          setError(result.message || '이름 추천에 실패했습니다');
        }
      } catch (error) {
        console.error('[Name Results] Error:', error);
        setError('서버 연결에 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNameRecommendations();
  }, [sessionId]);

  // Handle payment button click
  const handlePayment = () => {
    setIsPaymentModalOpen(true);
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentId: string) => {
    // Redirect to payment success page
    navigate(`/naming/freemium/result?sessionId=${sessionId}&payment=success`);
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
  if (error || !tiers || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-red-200">
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">오류가 발생했습니다</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/naming/freemium')}
                className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                처음으로 돌아가기
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <Sparkles className="inline w-8 h-8 text-yellow-500 mr-2" />
            이름 추천 결과
          </h1>
          <p className="text-lg text-gray-600">
            총 {metrics.totalCount}개의 이름을 추천합니다
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              정보 입력
            </div>
            <div className="w-8 border-t-2 border-gray-400" />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              사주 분석
            </div>
            <div className="w-8 border-t-2 border-gray-400" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              이름 추천
            </div>
          </div>
        </motion.div>

        {/* Free Names (1-2위) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            🎁 무료 체험 이름 (1-2위)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiers.free.map((candidate, index) => (
              <NameCard
                key={candidate.id}
                candidate={candidate}
                rank={index + 1}
                showFreeBadge={true}
              />
            ))}
          </div>
        </motion.div>

        {/* Premium CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <PremiumCTA metrics={metrics} onPayment={handlePayment} />
        </motion.div>

        {/* Locked Names (3-10위) - Show locked names if available */}
        {tiers.locked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              🔒 프리미엄 이름 (3-10위)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {tiers.locked.map((candidate, index) => (
                <BlurredNameCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 3}
                  onClick={handlePayment}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-blue-50 border-blue-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 이름 선택 가이드</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  <strong>점수가 높을수록</strong> 사주와 조화가 잘 맞는 이름입니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  <strong>오행 조화</strong>는 사주의 부족한 오행을 보완합니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  <strong>의미 조화</strong>는 선택하신 가치관을 반영합니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  결제 후 <strong>3-10위 프리미엄 이름 8개</strong>를 모두
                  확인하실 수 있습니다
                </span>
              </li>
            </ul>
          </Card>
        </motion.div>

        {/* Payment Modal */}
        {isPaymentModalOpen && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            sessionId={sessionId!}
            amount={69000}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}
