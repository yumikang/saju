/**
 * FreemiumResultsLayout Component - Strategic Freemium V2
 *
 * Main layout component for strategic freemium naming results page.
 * Orchestrates the complete user journey from free preview to premium conversion.
 *
 * Layout Structure:
 * 1. Header: Page title, total count, progress indicator
 * 2. Free Section: 11-12위 free sample names (FreeNameCard)
 * 3. Premium CTA: Conversion-optimized call-to-action (FreemiumCTA)
 * 4. Locked Section: 1-10위 premium locked names (LockedNameCard)
 * 5. Info Guide: Selection guide and benefits
 * 6. Payment Modal: TossPayments integration (FreemiumPaymentModal)
 *
 * Strategic Flow:
 * - Show quality samples (11-12위) to build trust
 * - Emphasize score gap with conversion CTA
 * - Display locked premium content (1-10위) to create desire
 * - Enable one-click payment for instant access
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Sparkles, Check, Gift, Lock } from 'lucide-react';
import { FreeNameCard } from './FreeNameCard';
import { LockedNameCard } from './LockedNameCard';
import { FreemiumCTA } from './FreemiumCTA';
import { FreemiumPaymentModal } from './FreemiumPaymentModal';
import type { FreemiumTiers, PsychologicalMetrics } from '~/lib/freemium/classification';

export interface FreemiumResultsLayoutProps {
  /** Classified name tiers (free, locked, remaining) */
  tiers: FreemiumTiers;

  /** Psychological metrics for conversion */
  metrics: PsychologicalMetrics;

  /** Session ID for payment flow */
  sessionId: string;

  /** Optional header title */
  title?: string;

  /** Optional header description */
  description?: string;

  /** Optional payment amount (default: 69000) */
  paymentAmount?: number;

  /** Optional customer name */
  customerName?: string;

  /** Optional customer email */
  customerEmail?: string;

  /** Optional callback after successful payment */
  onPaymentSuccess?: (orderId: string) => void;

  /** Optional callback for character detail click */
  onCharacterClick?: (characterId: number) => void;

  /** Show progress steps (default: true) */
  showProgress?: boolean;

  /** Show info guide (default: true) */
  showGuide?: boolean;
}

/**
 * FreemiumResultsLayout Component
 */
export function FreemiumResultsLayout({
  tiers,
  metrics,
  sessionId,
  title = '이름 추천 결과',
  description,
  paymentAmount = 69000,
  customerName,
  customerEmail,
  onPaymentSuccess,
  onCharacterClick,
  showProgress = true,
  showGuide = true,
}: FreemiumResultsLayoutProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Handle payment modal open
  const handlePaymentOpen = () => {
    setIsPaymentModalOpen(true);
  };

  // Handle payment modal close
  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false);
  };

  // Handle payment success
  const handlePaymentSuccess = (orderId: string) => {
    if (onPaymentSuccess) {
      onPaymentSuccess(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-emerald-50 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            <Sparkles className="inline w-7 h-7 sm:w-8 sm:h-8 text-yellow-500 mr-2" />
            {title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-2">
            {description || `총 ${metrics.totalCount}개의 이름을 추천합니다`}
          </p>
          <p className="text-sm text-gray-500">
            1위 최고 점수: <strong className="text-yellow-600">{metrics.topScore}점</strong>
          </p>

          {/* Progress Steps */}
          {showProgress && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <span className="hidden sm:inline">정보 입력</span>
              </div>
              <div className="w-6 sm:w-8 border-t-2 border-gray-400" />
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <span className="hidden sm:inline">사주 분석</span>
              </div>
              <div className="w-6 sm:w-8 border-t-2 border-gray-400" />
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <span className="hidden sm:inline">이름 추천</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Free Names Section (11-12위) */}
        {tiers.free.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 sm:mb-12"
          >
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Gift className="w-6 h-6 text-emerald-500" />
                무료 체험 이름 (11-12위)
              </h2>
              <p className="text-sm text-gray-600">
                지금 바로 확인할 수 있는 무료 샘플 이름입니다
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {tiers.free.map((candidate, index) => (
                <FreeNameCard
                  key={`free-${index}`}
                  candidate={candidate}
                  rank={(11 + index) as 11 | 12}
                  onCharacterClick={onCharacterClick}
                  onUpgradeClick={handlePaymentOpen}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Premium CTA */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FreemiumCTA
            metrics={metrics}
            onPayment={handlePaymentOpen}
            price={paymentAmount}
          />
        </motion.section>

        {/* Locked Premium Names Section (1-10위) */}
        {tiers.locked.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 sm:mb-12"
          >
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Lock className="w-6 h-6 text-yellow-500" />
                프리미엄 이름 (1-10위)
              </h2>
              <p className="text-sm text-gray-600">
                최고 점수 {metrics.topScore}점부터 상위 10개 이름 - 결제 후 잠금 해제
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {tiers.locked.map((candidate, index) => (
                <LockedNameCard
                  key={`locked-${index}`}
                  candidate={candidate}
                  rank={index + 1}
                  onClick={handlePaymentOpen}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Selection Guide */}
        {showGuide && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-blue-50 border-blue-200 p-5 sm:p-6">
              <h3 className="font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center gap-2">
                💡 이름 선택 가이드
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>점수가 높을수록</strong> 사주와 조화가 잘 맞는 이름입니다
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>오행 조화</strong>는 사주의 부족한 오행을 보완합니다
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>음양 균형</strong>은 이름의 조화로운 에너지를 나타냅니다
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>수리 길흉</strong>은 획수 기반 운세 분석 결과입니다
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    결제 후 <strong>1-10위 최고 점수 이름 10개</strong>를 모두
                    확인하고 상세 분석을 받으실 수 있습니다
                  </span>
                </li>
              </ul>
            </Card>
          </motion.section>
        )}

        {/* Payment Modal */}
        <FreemiumPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentClose}
          sessionId={sessionId}
          amount={paymentAmount}
          metrics={metrics}
          customerName={customerName}
          customerEmail={customerEmail}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
}
