/**
 * 이름 추천 결과 페이지 (Strategic Freemium V2)
 *
 * 전략적 freemium 구조:
 * - 11-12위: 무료 공개 (Free preview names with emerald theme)
 * - 1-10위: 프리미엄 잠금 (Top 10 premium names with yellow/orange theme)
 *
 * Uses new freemium-v2 component system for optimized conversion
 */

import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import { PrismaClient } from '@prisma/client';
import type { ScoredCandidate } from '~/lib/naming/types';
import { useNamingStore } from '~/store/naming.store';
import {
  classifyCandidates,
  calculatePsychologicalMetrics,
  hasPremiumAccess,
  type FreemiumTiers,
  type PsychologicalMetrics,
} from '~/lib/freemium/classification';
import { FreemiumResultsLayout } from '~/components/naming/freemium-v2';
import { Badge } from '~/components/ui/badge';
import { Sparkles } from 'lucide-react';

const prisma = new PrismaClient();

export const meta: MetaFunction = () => {
  return [
    { title: '이름 추천 결과 | 사주 작명' },
    { name: 'description', content: '사주에 맞는 최적의 이름을 확인하세요' },
  ];
};

/**
 * Loader: 추천 결과 가져오기 및 분류
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    throw new Response('사주 데이터 ID가 필요합니다', { status: 400 });
  }

  // 사주 데이터 확인
  const sajuData = await prisma.sajuData.findUnique({
    where: { id },
  });

  if (!sajuData) {
    throw new Response('사주 데이터를 찾을 수 없습니다', { status: 404 });
  }

  // URL에서 lastName 추출
  const url = new URL(request.url);
  const lastName = url.searchParams.get('lastName') || '';

  // Phase 2 API 호출: POST /api/naming/recommend
  const response = await fetch(`${url.origin}/api/naming/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sajuDataId: id,
      lastName,
      preferences: {
        minScore: 65,
        maxResults: 50,
      },
    }),
  });

  if (!response.ok) {
    throw new Response('이름 추천을 가져올 수 없습니다', { status: response.status });
  }

  const result = await response.json();

  if (!result.success) {
    throw new Response(result.message || '이름 추천 실패', { status: 500 });
  }

  const candidates = result.data.candidates as ScoredCandidate[];

  // 점수순 정렬 (내림차순)
  const sortedCandidates = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  // Freemium 분류
  const tiers = classifyCandidates(sortedCandidates);
  const metrics = calculatePsychologicalMetrics(tiers);

  return json({
    sajuId: id,
    lastName,
    tiers,
    metrics,
    totalCount: sortedCandidates.length,
  });
}

/**
 * 결과 페이지 컴포넌트 - Freemium V2
 */
export default function ResultsPage() {
  const { sajuId, lastName, tiers, metrics, totalCount } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Zustand store
  const {
    isPremium,
    sajuIdPurchased,
    openCharacterDetail,
    setCurrentSaju,
  } = useNamingStore();

  // 세션 사주 ID 설정
  useEffect(() => {
    setCurrentSaju(sajuId);
  }, [sajuId, setCurrentSaju]);

  // 프리미엄 접근 확인
  const isPremiumUser = hasPremiumAccess(isPremium, sajuIdPurchased, sajuId);

  // Handle payment success
  const handlePaymentSuccess = (orderId: string) => {
    // Reload to reflect premium status
    window.location.reload();
  };

  // Premium user sees all names unlocked
  if (isPremiumUser) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            총 {totalCount}개의 이름을 찾았습니다
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            성씨 <span className="font-semibold text-orange-600">{lastName}</span>에
            가장 잘 맞는 이름 순으로 정렬되어 있습니다
          </p>
          <Badge variant="default" className="bg-yellow-500">
            💎 프리미엄 회원 - 전체 이름 열람 가능
          </Badge>
        </div>

        <FreemiumResultsLayout
          tiers={tiers}
          metrics={metrics}
          sessionId={sajuId}
          title={`${lastName}씨 추천 이름`}
          description={`총 ${totalCount}개의 이름 - 프리미엄 잠금 해제됨`}
          paymentAmount={69000}
          onPaymentSuccess={handlePaymentSuccess}
          onCharacterClick={openCharacterDetail}
          showProgress={false}
          showGuide={true}
        />
      </div>
    );
  }

  // Free user sees strategic freemium flow
  return (
    <FreemiumResultsLayout
      tiers={tiers}
      metrics={metrics}
      sessionId={sajuId}
      title={`${lastName}씨 추천 이름`}
      description={`총 ${totalCount}개의 이름을 찾았습니다`}
      paymentAmount={69000}
      onPaymentSuccess={handlePaymentSuccess}
      onCharacterClick={openCharacterDetail}
      showProgress={false}
      showGuide={true}
    />
  );
}
