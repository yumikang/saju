/**
 * LockedNameCard Component - Premium Tier (Ranks 1-10)
 *
 * Displays rank 1-10 name candidates as locked premium content.
 * Uses dual-layer blur effect with visible score to create desire.
 *
 * Features:
 * - Dual-layer blur effect (content blur + overlay blur)
 * - Overall score prominently visible (z-20)
 * - Lock icon in top-right corner
 * - Yellow/orange premium theme
 * - Click handler opens payment modal
 * - Rank-based stagger animation
 * - Hover scale effect with shadow
 * - CTA message at bottom
 */

import { motion } from 'framer-motion';
import { Lock, TrendingUp } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import type { ScoredCandidate } from '~/lib/naming/types';
import { getRankLabel } from '~/lib/freemium/classification';

export interface LockedNameCardProps {
  /** Name candidate data (ranks 1-10) */
  candidate: ScoredCandidate;

  /** Rank position (1-10) */
  rank: number;

  /** Click handler to open payment modal */
  onClick: () => void;
}

/**
 * LockedNameCard Component
 */
export function LockedNameCard({
  candidate,
  rank,
  onClick,
}: LockedNameCardProps) {
  const { firstName, characters, scores } = candidate;
  const fullName = firstName.join('');

  // Animation delay based on rank (stagger effect)
  const animationDelay = rank * 0.1;

  return (
    <motion.div
      data-testid="locked-name-card"
      data-locked="true"
      data-rank={rank}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: animationDelay,
        duration: 0.3,
        ease: 'easeOut',
      }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="p-6 relative overflow-hidden border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-200 hover:shadow-2xl">

        {/* Layer 1: Background gradient (z-0) */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/80 via-orange-50/60 to-red-50/40" />

        {/* Layer 2: Blur overlay (z-10) - glassmorphism effect */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-10" />

        {/* Layer 3: Lock icon (z-20) - always visible */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-yellow-500 text-white p-2 rounded-full shadow-lg">
            <Lock className="w-5 h-5" data-icon="lock" />
          </div>
        </div>

        {/* Layer 4: Blurred content (relative, default z-index) */}
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">

              {/* Rank badges - blurred */}
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

              {/* Name - heavily blurred (8px) */}
              <div style={{ filter: 'blur(8px)' }} className="mb-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  {fullName}
                </h3>
              </div>

              {/* Hanja characters - medium blur (6px) */}
              <div style={{ filter: 'blur(6px)' }} className="flex gap-2 text-gray-600">
                <span>
                  {characters[0].character}
                  ({characters[0].koreanReading})
                </span>
                <span>+</span>
                <span>
                  {characters[1].character}
                  ({characters[1].koreanReading})
                </span>
              </div>
            </div>

            {/* Layer 5: Overall score - VISIBLE (z-20) */}
            <div className="absolute top-0 right-16 z-20">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border-2 border-yellow-300">
                <div className="text-right">
                  <div className="text-4xl font-bold text-yellow-600">
                    {Math.round(scores.overall)}
                    <span className="text-lg">점</span>
                  </div>
                  <p className="text-xs text-gray-600">종합</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed scores - light blur (4px) to tease */}
          <div
            style={{ filter: 'blur(4px)' }}
            className="grid grid-cols-4 gap-2 mb-4 text-xs"
          >
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">
                {Math.round(scores.elementHarmony.score)}
              </div>
              <div className="text-gray-600">오행</div>
            </div>
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">
                {Math.round(scores.yinYangBalance.score)}
              </div>
              <div className="text-gray-600">음양</div>
            </div>
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">
                {Math.round(scores.numerology.score)}
              </div>
              <div className="text-gray-600">수리</div>
            </div>
            <div className="text-center p-2 bg-white/50 rounded">
              <div className="font-medium">
                {Math.round(scores.meaningHarmony.score)}
              </div>
              <div className="text-gray-600">의미</div>
            </div>
          </div>
        </div>

        {/* Layer 6: CTA message (z-20) - always visible, primary call-to-action */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <motion.div
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-4 text-center shadow-xl border-2 border-yellow-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className="font-bold text-sm mb-1">
              🔓 클릭하여 {rank}등 이름 확인하기
            </p>
            <p className="text-xs opacity-90">
              10개 프리미엄 이름 (1-10위) · 단 ₩69,000
            </p>
          </motion.div>
        </div>

      </Card>
    </motion.div>
  );
}
