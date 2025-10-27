/**
 * Premium CTA - 결제 유도 컴포넌트
 *
 * 심리학적 전환 최적화:
 * - 점수 차이 강조
 * - 가치 제안
 * - 신뢰 요소
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
} from 'lucide-react';
import type { PsychologicalMetrics } from '~/lib/freemium/classification';

interface PremiumCTAProps {
  metrics: PsychologicalMetrics;
  onPayment: () => void;
}

export function PremiumCTA({ metrics, onPayment }: PremiumCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-4 border-yellow-400 shadow-2xl">
        {/* 배경 그라데이션 애니메이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-orange-300/20 to-red-300/20"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        <div className="relative p-8">
          {/* 아이콘 헤더 */}
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
              <Lock className="w-12 h-12 text-white" />
            </motion.div>
          </div>

          {/* 메인 메시지 */}
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold mb-3 text-gray-900">
              1위 최고 점수{' '}
              <span className="text-yellow-600">{metrics.topScore}점</span>
              입니다!
            </h3>
            <p className="text-lg text-gray-700 mb-2">
              1-10위 프리미엄 이름은{' '}
              <strong className="text-orange-600">
                무료 이름보다 평균 {metrics.scoreDifference}점 더 높은
              </strong>{' '}
              완벽한 조화
            </p>
            <p className="text-sm text-gray-600">
              평생 사용할 이름, 10개 중에서 선택하세요
            </p>
          </div>

          {/* 가격 & 혜택 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border-2 border-yellow-200">
            {/* 가격 */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-gray-500 line-through text-xl">
                  ₩99,000
                </span>
                <Badge variant="destructive" className="bg-red-500">
                  30% 할인
                </Badge>
              </div>
              <div className="text-5xl font-bold text-orange-600 mb-2">
                ₩69,000
              </div>
              <p className="text-sm text-gray-600">
                1회 결제로 평생 이용
              </p>
            </div>

            {/* 혜택 리스트 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-1 rounded-full">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    <Sparkles className="w-4 h-4 inline mr-1 text-yellow-500" />
                    프리미엄 10개 이름 (1-10위) 공개
                  </p>
                  <p className="text-sm text-gray-600">
                    최고 점수 이름 10개 + 상세 분석
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-1 rounded-full">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    전체 {metrics.totalCount}개 이름 + 상세 분석
                  </p>
                  <p className="text-sm text-gray-600">
                    한자 뜻, 오행 조화, 수리 길흉까지
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-1 rounded-full">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    <Infinity className="w-4 h-4 inline mr-1" />
                    평생 무제한 열람
                  </p>
                  <p className="text-sm text-gray-600">
                    언제든 다시 확인 가능
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg py-6 shadow-xl"
              onClick={onPayment}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              지금 바로 프리미엄 이름 보기 - ₩69,000
            </Button>
          </motion.div>

          {/* 신뢰 요소 */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-600" />
              <span>100% 환불 보장</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              <span>1회 결제</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Infinity className="w-4 h-4 text-blue-600" />
              <span>평생 이용</span>
            </div>
          </div>

          {/* 가치 제안 */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 이름 하나당 약 {Math.round(69000 / 10).toLocaleString()}원,
              평생 사용할 소중한 이름을 위한 투자
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
