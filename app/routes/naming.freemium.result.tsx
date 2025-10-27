/**
 * Freemium Payment Success Page
 *
 * GET /naming/freemium/result?sessionId=xxx&payment=success
 *
 * Shows all unlocked names after payment:
 * - 1-4위: Previously blurred, now unlocked
 * - 5위: Was free
 * - 6-10위: Previously locked, now unlocked
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { motion } from 'framer-motion';
import { prisma } from '~/lib/db.server';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { NameCard } from '~/components/naming/NameCard';
import type { ScoredCandidate } from '~/lib/naming/types';
import { Download, CheckCircle, Sparkles } from 'lucide-react';

// ============================================================
// Loader
// ============================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  const paymentStatus = url.searchParams.get('payment');

  // 1. Validate sessionId
  if (!sessionId) {
    throw new Response('Session ID required', { status: 400 });
  }

  // 2. Fetch session with payment
  const session = await prisma.namingSession.findUnique({
    where: { id: sessionId },
    include: { payment: true },
  });

  if (!session) {
    throw new Response('Session not found', { status: 404 });
  }

  // 3. Check session expiry
  if (session.expiresAt < new Date()) {
    throw new Response('Session expired', { status: 410 });
  }

  // 4. Verify payment unlocked
  if (!session.payment || !session.payment.unlocked) {
    // Redirect back to results page if payment not completed
    return json(
      { error: 'Payment not completed' },
      {
        status: 403,
        headers: {
          Location: `/naming/freemium/results?sessionId=${sessionId}`,
        },
      }
    );
  }

  // 5. Extract top 10 names from session data
  const top5 = (session.top5 as any[]) || [];
  const remaining15 = (session.remaining15 as any[]) || [];
  const top10Names = [...top5, ...remaining15.slice(0, 5)];

  // 6. Return data
  return json({
    session: {
      id: session.id,
      lastName: session.lastName,
      gender: session.gender,
      birthDate: session.birthDate,
      birthTime: session.birthTime,
      selectedValues: session.selectedValues,
    },
    payment: {
      amount: session.payment.amount,
      completedAt: session.payment.unlockedAt,
    },
    unlockedNames: top10Names,
    paymentSuccess: paymentStatus === 'success',
  });
}

// ============================================================
// Component
// ============================================================

export default function PaymentSuccessPage() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Handle PDF download
  const handleDownloadPDF = () => {
    window.location.href = `/api/pdf/freemium/${data.session.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Celebration */}
        {data.paymentSuccess && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8 text-center shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-20 h-20 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-4xl font-bold mb-3">
                결제 완료!
              </h1>
              <p className="text-xl mb-2">
                모든 프리미엄 이름이 잠금 해제되었습니다
              </p>
              <p className="text-sm opacity-90">
                결제 금액: {data.payment.amount.toLocaleString()}원
              </p>
            </Card>
          </motion.div>
        )}

        {/* PDF Download CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  <Sparkles className="inline w-6 h-6 text-yellow-500 mr-2" />
                  전체 결과 PDF 다운로드
                </h2>
                <p className="text-gray-600">
                  10개의 프리미엄 이름과 사주 분석을 PDF로 저장하세요
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 h-14"
              >
                <Download className="w-5 h-5 mr-2" />
                PDF 다운로드
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Unlocked Names Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🎁 잠금 해제된 프리미엄 이름 (1-10위)
            </h2>
            <p className="text-gray-600">
              사주 분석을 바탕으로 선별한 최고의 이름들입니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.unlockedNames.map((candidate: ScoredCandidate, index) => (
              <motion.div
                key={candidate.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <NameCard
                  candidate={candidate}
                  rank={index + 1}
                  showFreeBadge={index === 4} // 5위만 무료 배지 표시
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Summary Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <Card className="p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">📌 안내사항</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  결제하신 내역은 <strong>평생 보관</strong>되며 언제든 다시 확인하실 수 있습니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  PDF 파일을 저장하여 가족과 공유하거나 인쇄하실 수 있습니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  각 이름을 클릭하면 한자의 상세 정보를 확인할 수 있습니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>
                  궁금하신 사항은 고객센터로 문의해주세요
                </span>
              </li>
            </ul>
          </Card>
        </motion.div>

        {/* Back to Home Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="px-8"
          >
            홈으로 돌아가기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
