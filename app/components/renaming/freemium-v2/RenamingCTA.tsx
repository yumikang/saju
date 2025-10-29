/**
 * RenamingCTA Component - Simple Orange Theme
 *
 * Conversion call-to-action for renaming service.
 * Simple orange theme matching the naming service.
 */

import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import type { RenamingPsychologicalMetrics } from '~/lib/freemium/renaming-classification';

export interface RenamingCTAProps {
  metrics: RenamingPsychologicalMetrics;
  onPayment: () => void;
  price?: number;
}

export function RenamingCTA({
  metrics,
  onPayment,
  price = 120000,
}: RenamingCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="my-8"
    >
      <Card className="border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          최고 점수 <span className="text-orange-600">{metrics.topScore}점</span> 개명을 확인하세요
        </h3>
        {metrics.improvementFromCurrent && metrics.improvementFromCurrent > 0 && (
          <p className="text-green-600 font-semibold mb-3">
            현재 이름보다 최대 {metrics.improvementFromCurrent}점 개선 가능!
          </p>
        )}
        <p className="text-gray-600 mb-6">
          1-9위 프리미엄 개명 <strong className="text-orange-600">9개</strong>를 모두 확인할 수 있습니다
        </p>
        <Button
          onClick={onPayment}
          size="lg"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6"
        >
          ₩{price.toLocaleString()} 결제하고 프리미엄 개명 보기
        </Button>
        <p className="text-sm text-gray-500 mt-4">
          1회 결제 · 평생 이용 · 환불 보장
        </p>
      </Card>
    </motion.div>
  );
}
