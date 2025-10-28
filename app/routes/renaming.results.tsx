/**
 * Renaming Service - Step 3: Renaming Recommendations (Freemium-v2)
 *
 * Route: /renaming/results?analysisId=xxx
 * Purpose: Show renaming recommendations with freemium-v2 strategy
 *   - 11-12위: Free preview (emerald theme)
 *   - 1-10위: Premium locked (yellow theme, requires payment ₩120,000)
 * Next: Payment flow or /renaming/experts
 *
 * @created 2025-10-28
 * @refactor Phase 4: Step 3 route file with freemium-v2 integration
 */

import { useState, useEffect } from 'react';
import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { useToast } from '~/hooks/use-toast';
import { getRenamingFormData } from '~/lib/renaming/session.server';
import { RenamingResultsLayout } from '~/components/renaming/freemium-v2';
import {
  classifyRenamingCandidates,
  calculateRenamingPsychologicalMetrics,
  type RenamingFreemiumTiers,
  type RenamingPsychologicalMetrics,
} from '~/lib/freemium/renaming-classification';
import type { ScoredCandidate } from '~/lib/naming/types';
import type { RenamingFormData } from '~/lib/renaming/types';

/**
 * Loader: Get formData from session and analysisId from URL
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Get formData from session
  const formData = await getRenamingFormData(request);
  if (!formData) {
    return redirect('/renaming');
  }

  // Get analysisId from URL searchParams
  const url = new URL(request.url);
  const analysisId = url.searchParams.get('analysisId');

  if (!analysisId) {
    // Redirect to analysis step if no analysisId
    return redirect('/renaming/analysis');
  }

  return { formData, analysisId };
}

/**
 * Main component: Renaming recommendations with freemium-v2
 */
export default function RenamingResults() {
  const { formData, analysisId } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [tiers, setTiers] = useState<RenamingFreemiumTiers | null>(null);
  const [metrics, setMetrics] = useState<RenamingPsychologicalMetrics | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch renaming recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current name analysis to get currentScore
        const analysisResponse = await fetch(`/api/renaming/analysis/${analysisId}`);
        let analysisData = null;
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          if (analysisResult.success) {
            analysisData = analysisResult.data;
            setCurrentScore(Math.round(analysisData.currentScore));
          }
        }

        // Bad characters blacklist (unsuitable for renaming)
        const badCharacters = [
          '衝', '沖', '病', '死', '亡', '敗', '窮', '困', '苦', '哀',
          '愁', '悲', '憂', '怒', '恨', '殺', '傷', '害', '災', '禍',
          '厄', '凶', '惡', '賤', '貧', '疾', '痛', '弱', '破', '敗',
        ];

        // API request - renaming specific API
        const response = await fetch('/api/renaming/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisId, // Existing analysis result ID
            preferences: {
              minScore: 80, // High score for renaming (75 → 80)
              maxResults: 20, // Freemium-v2: Generate 20 for classification (1-10 locked + 11-12 free)
              gender: formData.gender === 'M' ? 'male' : 'female',
              avoidCharacters: badCharacters, // Exclude negative characters
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '개명 제안을 가져오는 중 오류가 발생했습니다');
        }

        const result = await response.json();

        if (result.success) {
          // Freemium-v2: Keep all candidates as ScoredCandidate[]
          const candidates = result.data.candidates as ScoredCandidate[];

          // Phase 2.3: Classification logic (1-10 locked, 11-12 free)
          const classified = classifyRenamingCandidates(candidates);

          // Phase 2.4: Psychological metrics calculation (with current name score)
          const psychMetrics = calculateRenamingPsychologicalMetrics(
            classified,
            currentScore || undefined
          );

          // Update state
          setTiers(classified);
          setMetrics(psychMetrics);

          toast({
            title: '개명 제안 완료',
            description: `총 ${psychMetrics.totalCount}개의 개명을 추천합니다 (1-10위 프리미엄, 11-12위 무료 체험)`,
          });
        }
      } catch (err) {
        console.error('Recommendation error:', err);
        const errorMessage =
          err instanceof Error ? err.message : '개명 제안을 가져오는 중 오류가 발생했습니다';
        setError(errorMessage);
        toast({
          title: '오류 발생',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [analysisId, formData, toast, currentScore]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold">개명 제안 생성 중...</h3>
          <p className="text-gray-600 mt-2">사주에 맞는 최적의 이름을 찾고 있습니다</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-red-600 mb-4">개명 제안 오류</h3>
            <p className="text-gray-700 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              다시 시도하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty results
  if (!tiers || !metrics || (tiers.free.length === 0 && tiers.locked.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-yellow-600 mb-4">추천 이름이 없습니다</h3>
            <p className="text-gray-700 mb-6">
              현재 조건에 맞는 이름을 찾을 수 없습니다. 다시 시도해보세요.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              다시 시도하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success - Render freemium-v2 results
  return (
    <RenamingResultsLayout
      tiers={tiers}
      metrics={metrics}
      sessionId={analysisId}
      currentName={formData.currentName}
      paymentAmount={120000}
      onPaymentSuccess={(orderId) => {
        // Phase 4.1: Payment success handler (navigate to success page later)
        console.log('Payment success:', orderId);
        toast({
          title: '결제 완료',
          description: '개명 추천 전체 결과를 확인할 수 있습니다.',
        });
        // TODO: Navigate to payment success or experts page
        // navigate(`/renaming/experts?orderId=${orderId}`);
      }}
    />
  );
}
