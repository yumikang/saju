/**
 * RenamingResultsLayout Component - Simple Orange Theme
 *
 * Main layout for renaming results page.
 * Simple orange theme matching the naming service.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { RenamingFreeCard } from './RenamingFreeCard';
import { RenamingLockedCard } from './RenamingLockedCard';
import { RenamingCTA } from './RenamingCTA';
import { RenamingPaymentModal } from '../RenamingPaymentModal';
import type {
  RenamingFreemiumTiers,
  RenamingPsychologicalMetrics,
} from '~/lib/freemium/renaming-classification';

export interface RenamingResultsLayoutProps {
  tiers: RenamingFreemiumTiers;
  metrics: RenamingPsychologicalMetrics;
  sessionId: string;
  currentName?: string;
  title?: string;
  description?: string;
  paymentAmount?: number;
  customerName?: string;
  customerEmail?: string;
  onPaymentSuccess?: (orderId: string) => void;
  onCharacterClick?: (characterId: number) => void;
}

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
}: RenamingResultsLayoutProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePaymentOpen = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false);
  };

  const handlePaymentSuccess = (orderId: string) => {
    if (onPaymentSuccess) {
      onPaymentSuccess(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            <Sparkles className="inline w-7 h-7 sm:w-8 sm:h-8 text-orange-500 mr-2" />
            {title}
          </h1>
          <p className="text-sm text-gray-500">
            1위 최고 점수: <strong className="text-orange-600">{metrics.topScore}점</strong>
          </p>
          {metrics.improvementFromCurrent && metrics.improvementFromCurrent > 0 && (
            <p className="text-sm text-green-600 font-medium mt-1">
              현재 이름보다 최대 <strong>{metrics.improvementFromCurrent}점</strong> 개선 가능
            </p>
          )}
        </motion.div>

        {/* Free Name Section (10위) */}
        {tiers.free.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 sm:mb-12"
          >
            <div className="mb-4 sm:mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                무료 체험 개명 (10위)
              </h2>
              <p className="text-sm text-gray-600">
                지금 바로 확인할 수 있는 무료 샘플 개명입니다
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <RenamingFreeCard
                candidate={tiers.free[0]}
                rank={10}
                currentName={currentName}
                currentNameScore={metrics.currentNameScore}
                onCharacterClick={onCharacterClick}
                onUpgradeClick={handlePaymentOpen}
              />
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

        {/* Locked Premium Names Section (1-9위) */}
        {tiers.locked.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 sm:mb-12"
          >
            <div className="mb-4 sm:mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                프리미엄 개명 (1-9위)
              </h2>
              <p className="text-sm text-gray-600">
                최고 점수 {metrics.topScore}점부터 상위 9개 개명 - 결제 후 잠금 해제
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
