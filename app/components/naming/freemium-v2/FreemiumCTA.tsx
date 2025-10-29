/**
 * FreemiumCTA Component - Simple Orange Theme
 *
 * Conversion-optimized call-to-action for premium unlock.
 */

import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import type { PsychologicalMetrics } from '~/lib/freemium/classification';

export interface FreemiumCTAProps {
  metrics: PsychologicalMetrics;
  onPayment: () => void;
  price: number;
}

export function FreemiumCTA({
  metrics,
  onPayment,
  price,
}: FreemiumCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="my-8"
    >
      <Card className="border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          최고 점수 <span className="text-orange-600">{metrics.topScore}점</span> 이름을 확인하세요
        </h3>

        <p className="text-gray-600 mb-6">
          1-9위 프리미엄 이름 <strong className="text-orange-600">9개</strong>를 모두 확인할 수 있습니다
        </p>

        <Button
          onClick={onPayment}
          size="lg"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6"
        >
          ₩{price.toLocaleString()} 결제하고 프리미엄 이름 보기
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          1회 결제 · 평생 이용 · 환불 보장
        </p>
      </Card>
    </motion.div>
  );
}
