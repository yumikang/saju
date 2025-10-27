/**
 * 이름 추천 결과 페이지 (Freemium 2+8 모델)
 *
 * 2+8 freemium 전략:
 * - 1-2위: 무료 공개 (Free names)
 * - 3-10위: 프리미엄 잠금 (8 premium names, 결제 필요)
 */

import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState, useEffect } from 'react';
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
import { BlurredNameCard } from '~/components/naming/BlurredNameCard';
import { PremiumCTA } from '~/components/naming/PremiumCTA';
import { NameCard } from '~/components/naming/NameCard';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Lock, Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
 * 결과 페이지 컴포넌트
 */
export default function ResultsPage() {
  const { sajuId, lastName, tiers, metrics, totalCount } = useLoaderData<typeof loader>();

  // Zustand store
  const {
    isPremium,
    sajuIdPurchased,
    favorites,
    toggleFavorite,
    openPaymentModal,
    openCharacterDetail,
    setCurrentSaju,
  } = useNamingStore();

  // 세션 사주 ID 설정
  useEffect(() => {
    setCurrentSaju(sajuId);
  }, [sajuId, setCurrentSaju]);

  // 프리미엄 접근 확인
  const isPremiumUser = hasPremiumAccess(isPremium, sajuIdPurchased, sajuId);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          총 {totalCount}개의 이름을 찾았습니다
        </h1>
        <p className="text-lg text-gray-600">
          성씨 <span className="font-semibold text-orange-600">{lastName}</span>에
          가장 잘 맞는 이름 순으로 정렬되어 있습니다
        </p>
        {isPremiumUser && (
          <Badge variant="default" className="mt-3 bg-yellow-500">
            💎 프리미엄 회원 - 전체 이름 열람 가능
          </Badge>
        )}
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* 프리미엄 유저: 전체 공개 */}
      {/* ─────────────────────────────────────────────────── */}
      {isPremiumUser ? (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              전체 추천 이름 (1-10위)
            </h2>
            <p className="text-gray-600 mt-2">
              모든 이름의 상세 정보를 확인하실 수 있습니다
            </p>
          </div>

          <div className="space-y-4">
            {[...tiers.free, ...tiers.locked].map((candidate, idx) => (
              <NameCard
                key={candidate.id}
                candidate={candidate}
                rank={idx + 1}
                isFavorite={favorites.includes(candidate.id)}
                onFavorite={toggleFavorite}
                onCharacterClick={openCharacterDetail}
                showFreeBadge={idx < 2}
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────── */}
          {/* 무료 유저: 2+8 freemium 전략 */}
          {/* ─────────────────────────────────────────────────── */}

          {/* 🆓 무료 공개 1-2위 */}
          {tiers.free.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Gift className="w-6 h-6 text-green-500" />
                  무료 체험 이름 (1-2위)
                  <Badge variant="secondary" className="bg-green-50 border-green-300">
                    무료
                  </Badge>
                </h2>
                <div className="text-right">
                  <p className="text-sm text-gray-500">최고 점수</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.topScore}점
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {tiers.free.map((candidate, idx) => (
                  <NameCard
                    key={candidate.id}
                    candidate={candidate}
                    rank={idx + 1}
                    isFavorite={favorites.includes(candidate.id)}
                    onFavorite={toggleFavorite}
                    onCharacterClick={openCharacterDetail}
                    showFreeBadge={true}
                  />
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-center text-sm text-gray-600"
              >
                이 이름들도 훌륭하지만, 아래 프리미엄 이름들은 더욱 다양한 선택지를 제공합니다
              </motion.p>
            </section>
          )}

          {/* 💎 CTA: 프리미엄 이름 업그레이드 */}
          <PremiumCTA metrics={metrics} onPayment={openPaymentModal} />

          {/* 🔒 프리미엄 잠금 3-10위 */}
          {tiers.locked.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Lock className="w-6 h-6 text-orange-500" />
                  프리미엄 이름 (3-10위)
                  <Badge variant="outline" className="bg-orange-50 border-orange-300">
                    프리미엄
                  </Badge>
                </h2>
              </div>

              <div className="grid gap-4">
                {tiers.locked.map((candidate, idx) => (
                  <BlurredNameCard
                    key={candidate.id}
                    candidate={candidate}
                    rank={idx + 3}
                    onClick={openPaymentModal}
                  />
                ))}
              </div>

              <Card className="p-6 border-dashed border-2 bg-orange-50 mt-4">
                <div className="text-center text-gray-700">
                  <p className="text-lg">
                    <strong className="text-orange-600 text-2xl">
                      {tiers.locked.length}개
                    </strong>
                    의 프리미엄 이름을 69,000원에 모두 확인하세요
                  </p>
                  <p className="text-sm mt-2 text-gray-600">
                    이름 하나당 약 {Math.round(69000 / 8).toLocaleString()}원, 평생 사용할 이름을 지금 선택하세요
                  </p>
                </div>
              </Card>
            </section>
          )}
        </>
      )}

      {/* 안내 정보 */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">
          💡 결과 안내
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>모든 이름은 사주 오행 조화, 음양 균형, 수리 길흉을 종합하여 채점되었습니다</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>높은 점수일수록 사주와의 조화가 뛰어난 이름입니다</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>한자를 클릭하면 상세한 뜻과 오행 정보를 확인할 수 있습니다</span>
          </li>
          {!isPremiumUser && (
            <>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span className="text-green-600 font-semibold">
                  1-2위 무료 이름을 지금 바로 확인하실 수 있습니다
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span className="text-orange-600 font-semibold">
                  프리미엄 업그레이드 시 3-10위 이름 8개를 추가로 확인하실 수 있습니다 (69,000원)
                </span>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
