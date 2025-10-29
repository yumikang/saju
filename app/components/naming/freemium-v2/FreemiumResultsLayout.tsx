/**
 * FreemiumResultsLayout Component - Strategic Freemium V2
 *
 * Main layout component for strategic freemium naming results page.
 * Orchestrates the complete user journey from free preview to premium conversion.
 *
 * Layout Structure:
 * 1. Header: Page title, total count, progress indicator
 * 2. Free Section: 10위 free sample name (FreeNameCard)
 * 3. Premium CTA: Conversion-optimized call-to-action (FreemiumCTA)
 * 4. Locked Section: 1-9위 premium locked names (LockedNameCard)
 * 5. Info Guide: Selection guide and benefits
 * 6. Payment Modal: TossPayments integration (FreemiumPaymentModal)
 *
 * Strategic Flow:
 * - Show quality sample (10위) to build trust
 * - Emphasize score gap with conversion CTA
 * - Display locked premium content (1-9위) to create desire
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {description || `총 ${metrics.totalCount}개의 이름을 추천합니다`}
          </p>
        </motion.div>

        {/* Free Names Section (10위) */}
        {tiers.free.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                무료 체험 이름 (10위)
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {tiers.free.map((candidate, index) => (
                <FreeNameCard
                  key={`free-${index}`}
                  candidate={candidate}
                  rank={10}
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

        {/* Locked Premium Names Section (1-9위) */}
        {tiers.locked.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                프리미엄 이름 (1-9위)
              </h2>
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
