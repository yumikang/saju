/**
 * Blurred Name Card - 3-10위 프리미엄 프리뷰 (2+8 구조)
 *
 * 블러 효과로 이름/한자를 가리고, 점수만 선명하게 표시
 * 클릭 시 결제 모달 오픈
 */

import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Lock, TrendingUp } from 'lucide-react';
import type { ScoredCandidate } from '~/lib/naming/types';
import { getRankLabel } from '~/lib/freemium/classification';

interface BlurredNameCardProps {
  candidate: ScoredCandidate;
  rank: number;
  onClick: () => void;
}

export function BlurredNameCard({
  candidate,
  rank,
  onClick,
}: BlurredNameCardProps) {
  return (
    <motion.div
      data-testid="name-card"
      data-locked="true"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="p-6 relative overflow-hidden border-2 border-yellow-200 hover:border-yellow-400 transition-all hover:shadow-2xl">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/80 via-orange-50/60 to-red-50/40" />

        {/* 블러 오버레이 */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-10" />

        {/* 잠금 아이콘 */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-yellow-500 text-white p-2 rounded-full shadow-lg">
            <Lock className="w-5 h-5" data-icon="lock" />
          </div>
        </div>

        {/* 컨텐츠 (블러 뒤에) */}
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* 순위 배지 */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                  {getRankLabel(rank)}
                </Badge>
                {rank === 1 && (
                  <Badge variant="outline" className="border-yellow-500">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    최고 점수
                  </Badge>
                )}
              </div>

              {/* 블러된 이름 */}
              <div style={{ filter: 'blur(8px)' }} className="mb-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  {candidate.firstName.join('')}
                </h3>
              </div>

              {/* 블러된 한자 */}
              <div style={{ filter: 'blur(6px)' }} className="flex gap-2 text-gray-600">
                <span>
                  {candidate.characters[0].character}
                  ({candidate.characters[0].koreanReading})
                </span>
                <span>+</span>
                <span>
                  {candidate.characters[1].character}
                  ({candidate.characters[1].koreanReading})
                </span>
              </div>
            </div>

            {/* 점수만 선명하게 (블러 위에 z-20) */}
            <div className="absolute top-0 right-16 z-20">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border-2 border-yellow-300">
                <div className="text-right">
                  <div className="text-4xl font-bold text-yellow-600">
                    {Math.round(candidate.scores.overall)}
                    <span className="text-lg">점</span>
                  </div>
                  <p className="text-xs text-gray-600">종합</p>
                </div>
              </div>
            </div>
          </div>

          {/* 점수 상세 (블러) */}
          <div
            style={{ filter: 'blur(4px)' }}
            className="grid grid-cols-4 gap-2 mb-4 text-xs"
          >
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">{Math.round(candidate.scores.elementHarmony.score)}</div>
              <div className="text-gray-600">오행</div>
            </div>
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">{Math.round(candidate.scores.yinYangBalance.score)}</div>
              <div className="text-gray-600">음양</div>
            </div>
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">{Math.round(candidate.scores.numerology.score)}</div>
              <div className="text-gray-600">수리</div>
            </div>
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">{Math.round(candidate.scores.meaningHarmony.score)}</div>
              <div className="text-gray-600">의미</div>
            </div>
          </div>
        </div>

        {/* 잠금 메시지 (블러 위에 z-20) */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <motion.div
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-4 text-center shadow-xl border-2 border-yellow-400"
            whileHover={{ scale: 1.05 }}
          >
            <p className="font-bold text-sm mb-1">
              🔓 클릭하여 {rank}등 이름 확인하기
            </p>
            <p className="text-xs opacity-90">
              8개 프리미엄 이름 (3-10위) · 단 ₩69,000
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
