/**
 * Renaming Service - Step 4: Expert Proposals
 *
 * Route: /renaming/experts
 * Purpose: Show expert proposals for custom renaming consultation
 * Note: Static page with expert listings
 *
 * @created 2025-10-28
 * @refactor Phase 5: Step 4 route file
 */

import { motion } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { User, Sparkles } from 'lucide-react';

/**
 * Expert data (mock data for now)
 */
const EXPERTS = [
  {
    id: 1,
    name: '김영철 선생님',
    experience: '30년',
    rating: 4.9,
    reviews: 523,
    price: 200000,
    speciality: '개명 전문',
    message: '현재 이름의 문제점을 정확히 파악했습니다. 법적 절차까지 도와드리겠습니다.',
  },
  {
    id: 2,
    name: '이정희 선생님',
    experience: '25년',
    rating: 4.8,
    reviews: 412,
    price: 180000,
    speciality: '운세 개선',
    message: '개명 후 운세 변화를 단계별로 분석하여 최적의 타이밍을 제안해드립니다.',
  },
  {
    id: 3,
    name: '박민수 선생님',
    experience: '20년',
    rating: 4.7,
    reviews: 389,
    price: 150000,
    speciality: '사주명리',
    message: '개명 이유에 맞는 맞춤형 이름으로 인생의 전환점을 만들어드립니다.',
  },
];

/**
 * Main component: Expert proposals
 */
export default function RenamingExperts() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          <Sparkles className="inline w-8 h-8 text-yellow-500 mr-2" />
          개명 전문가 제안
        </h2>
        <p className="text-lg text-gray-600">
          개명 전문가들이 맞춤 분석과 개별 견적을 제안했습니다
        </p>
      </motion.div>

      {/* Expert Cards */}
      <div className="space-y-4">
        {EXPERTS.map((expert, index) => (
          <motion.div
            key={expert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      {/* Avatar */}
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>

                      {/* Expert Info */}
                      <div>
                        <h3 className="font-bold text-lg">{expert.name}</h3>
                        <p className="text-sm text-gray-600">
                          {expert.speciality} · 경력 {expert.experience}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-yellow-500">★ {expert.rating}</span>
                          <span className="text-gray-500">({expert.reviews}개 리뷰)</span>
                        </div>
                      </div>
                    </div>

                    {/* Expert Message */}
                    <p className="text-gray-700 italic mb-4">"{expert.message}"</p>
                  </div>

                  {/* Price and CTA */}
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-orange-500">
                      ₩{expert.price.toLocaleString()}
                    </p>
                    <Button className="mt-2 bg-orange-500 hover:bg-orange-600">상담 신청</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
