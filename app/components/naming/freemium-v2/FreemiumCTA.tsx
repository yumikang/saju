/**
 * FreemiumCTA Component - Strategic Freemium V2
 *
 * Conversion-optimized call-to-action between free (11-12위) and locked (1-10위) sections.
 * Psychological optimization strategies:
 * - Score difference emphasis (1위 vs 11위)
 * - Value proposition (10 premium names)
 * - Trust elements (환불 보장, 평생 이용)
 * - Scarcity framing (limited time discount)
 *
 * Features:
 * - Animated gradient background
 * - Pulsing lock icon
 * - Score comparison display
 * - Price with discount badge
 * - Benefit list with checkmarks
 * - Trust badges
 * - Value per name calculation
 * - Yellow/orange premium theme
 */

import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  Lock,
  Sparkles,
  Check,
  CreditCard,
  Shield,
  Infinity,
  TrendingUp,
} from 'lucide-react';
import type { PsychologicalMetrics } from '~/lib/freemium/classification';

export interface FreemiumCTAProps {
  /** Psychological metrics from classification */
  metrics: PsychologicalMetrics;

  /** Payment button click handler */
  onPayment: () => void;

  /** Optional custom price (default: 69000) */
  price?: number;
}

/**
 * FreemiumCTA Component
 */
export function FreemiumCTA({
  metrics,
  onPayment,
  price = 69000,
}: FreemiumCTAProps) {
  const pricePerName = Math.round(price / 10);
  const originalPrice = 99000;
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="my-8"
    >
      <Card className="relative overflow-hidden border-4 border-yellow-400 shadow-2xl">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-orange-300/20 to-red-300/20 opacity-50" />
        </div>

        <div className="relative p-6 sm:p-8">
          {/* Pulsing lock icon header */}
          <div className="flex justify-center mb-6">
            <motion.div
              className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full shadow-xl"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </motion.div>
          </div>

          {/* Main message - score comparison */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3 bg-yellow-100 px-4 py-2 rounded-full">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-800">
                최고 점수 이름은 잠겨 있습니다
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">
              1위 최고 점수{' '}
              <span className="text-yellow-600">{metrics.topScore}점</span>
              입니다!
            </h3>

            <p className="text-base sm:text-lg text-gray-700 mb-2">
              지금 보신 <strong className="text-emerald-600">11-12위 무료 이름</strong>도 좋지만,
            </p>
            <p className="text-base sm:text-lg text-gray-700 mb-2">
              <strong className="text-orange-600">
                1-10위 프리미엄 이름은 평균 {metrics.scoreDifference}점 더 높은
              </strong>{' '}
              완벽한 조화입니다
            </p>

            <p className="text-sm text-gray-600 mt-3">
              💡 평생 사용할 소중한 이름, 최고 점수 10개 중에서 선택하세요
            </p>
          </div>

          {/* Price & Benefits section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 sm:p-6 mb-6 border-2 border-yellow-200">
            {/* Price display */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-gray-500 line-through text-lg sm:text-xl">
                  ₩{originalPrice.toLocaleString()}
                </span>
                <Badge variant="destructive" className="bg-red-500">
                  {discountPercent}% 할인
                </Badge>
              </div>
              <div className="text-4xl sm:text-5xl font-bold text-orange-600 mb-2">
                ₩{price.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">
                1회 결제로 평생 이용 · 이름당 약 ₩{pricePerName.toLocaleString()}
              </p>
            </div>

            {/* Benefits list */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-1 rounded-full flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    <Sparkles className="w-4 h-4 inline mr-1 text-yellow-500" />
                    프리미엄 10개 이름 (1-10위) 잠금 해제
                  </p>
                  <p className="text-sm text-gray-600">
                    최고 점수 {metrics.topScore}점부터 상위 10개 이름 공개
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-1 rounded-full flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    전체 {metrics.totalCount}개 이름 + 상세 분석
                  </p>
                  <p className="text-sm text-gray-600">
                    한자 뜻, 오행 조화, 음양 균형, 수리 길흉까지
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-1 rounded-full flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    <Infinity className="w-4 h-4 inline mr-1" />
                    평생 무제한 열람
                  </p>
                  <p className="text-sm text-gray-600">
                    언제든 다시 확인하고 가족과 상의 가능
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6 shadow-xl"
              onClick={onPayment}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              지금 바로 1-10위 프리미엄 이름 보기 · ₩{price.toLocaleString()}
            </Button>
          </motion.div>

          {/* Trust elements */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-600" />
              <span>100% 환불 보장</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              <span>1회 결제</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <Infinity className="w-4 h-4 text-blue-600" />
              <span>평생 이용</span>
            </div>
          </div>

          {/* Value proposition footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 평생 사용할 소중한 이름을 위한 투자, 이름 하나당 약 ₩{pricePerName.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
