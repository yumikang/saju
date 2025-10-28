/**
 * RenamingResultsLayout Component - Strategic Freemium V2 for Renaming Service
 *
 * Main layout component for strategic freemium renaming results page.
 * Orchestrates the complete user journey from free preview to premium conversion.
 * Adapted for renaming service with current name comparison.
 *
 * Layout Structure:
 * 1. Header: Page title, total count, progress indicator
 * 2. Free Section: 11-12위 free sample names (RenamingFreeCard)
 * 3. Premium CTA: Conversion-optimized call-to-action (RenamingCTA)
 * 4. Locked Section: 1-10위 premium locked names (RenamingLockedCard)
 * 5. Info Guide: Selection guide and benefits
 * 6. Payment Modal: TossPayments integration (RenamingPaymentModal)
 *
 * Strategic Flow:
 * - Show quality samples (11-12위) with current name comparison to build trust
 * - Emphasize improvement from current name with conversion CTA
 * - Display locked premium content (1-10위) to create desire
 * - Enable one-click payment for instant access
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Sparkles, Check, Gift, Lock } from 'lucide-react';
import { RenamingFreeCard } from './RenamingFreeCard';
import { RenamingLockedCard } from './RenamingLockedCard';
import { RenamingCTA } from './RenamingCTA';
import { RenamingPaymentModal } from '../RenamingPaymentModal';
import type {
  RenamingFreemiumTiers,
  RenamingPsychologicalMetrics,
} from '~/lib/freemium/renaming-classification';

export interface RenamingResultsLayoutProps {
  /** Classified name tiers (free, locked, remaining) */
  tiers: RenamingFreemiumTiers;

  /** Psychological metrics for conversion */
  metrics: RenamingPsychologicalMetrics;

  /** Session ID for payment flow */
  sessionId: string;

  /** Current name (optional, for comparison) */
  currentName?: string;

  /** Optional header title */
  title?: string;

  /** Optional header description */
  description?: string;

  /** Optional payment amount (default: 120000) */
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
 * RenamingResultsLayout Component
 */
export function RenamingResultsLayout({
  tiers,
  metrics,
  sessionId,
  currentName,
  title = '개명 추천 결과',
  description,
  paymentAmount = 120000,
  customerName,
  customerEmail,
  onPaymentSuccess,
  onCharacterClick,
  showProgress = true,
  showGuide = true,
}: RenamingResultsLayoutProps) {
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
            {description || `총 ${metrics.totalCount}개의 개명을 추천합니다`}
          </p>
          <p className="text-sm text-gray-500">
            1위 최고 점수: <strong className="text-yellow-600">{metrics.topScore}점</strong>
          </p>
          {metrics.improvementFromCurrent && metrics.improvementFromCurrent > 0 && (
            <p className="text-sm text-green-600 font-medium mt-1">
              현재 이름보다 최대 <strong>{metrics.improvementFromCurrent}점</strong> 개선 가능
            </p>
          )}

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
                <span className="hidden sm:inline">개명 추천</span>
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
                무료 체험 개명 (11-12위)
              </h2>
              <p className="text-sm text-gray-600">
                지금 바로 확인할 수 있는 무료 샘플 개명입니다
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {tiers.free.map((candidate, index) => (
                <RenamingFreeCard
                  key={`free-${index}`}
                  candidate={candidate}
                  rank={(11 + index) as 11 | 12}
                  currentName={currentName}
                  currentNameScore={metrics.currentNameScore}
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
          <RenamingCTA
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
                프리미엄 개명 (1-10위)
              </h2>
              <p className="text-sm text-gray-600">
                최고 점수 {metrics.topScore}점부터 상위 10개 개명 - 결제 후 잠금 해제
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {tiers.locked.map((candidate, index) => (
                <RenamingLockedCard
                  key={`locked-${index}`}
                  candidate={candidate}
                  rank={index + 1}
                  currentNameScore={metrics.currentNameScore}
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
                💡 개명 선택 가이드
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>점수가 높을수록</strong> 사주와 조화가 잘 맞는 개명입니다
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>현재 이름 대비 개선도</strong>를 확인하여 더 나은 이름으로 선택하세요
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
                    결제 후 <strong>1-10위 최고 점수 개명 10개</strong>를 모두
                    확인하고 상세 분석과 개명 신청 가이드를 받으실 수 있습니다
                  </span>
                </li>
              </ul>
            </Card>
          </motion.section>
        )}

        {/* Payment Modal */}
        <RenamingPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentClose}
          sessionId={sessionId}
          amount={paymentAmount}
          userName={customerName}
          userEmail={customerEmail}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
}
