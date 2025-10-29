/**
 * RenamingLockedCard Component - Simple Orange Theme
 *
 * Displays rank 1-10 name candidates as locked premium content.
 * Simple orange theme matching the naming service.
 */

import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { Lock } from 'lucide-react';
import type { ScoredCandidate } from '~/lib/naming/types';

export interface RenamingLockedCardProps {
  candidate: ScoredCandidate;
  rank: number;
  currentNameScore?: number;
  onClick: () => void;
}

export function RenamingLockedCard({
  candidate,
  rank,
  currentNameScore,
  onClick,
}: RenamingLockedCardProps) {
  const { firstName, characters, scores } = candidate;
  const fullName = firstName.join('');

  // Calculate improvement from current name
  const improvement = currentNameScore
    ? Math.round(scores.overall - currentNameScore)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="border-orange-300 hover:border-orange-500 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-orange-50 to-white p-5 relative">
        {/* Lock Icon */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-orange-500 p-2 rounded-full">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Header - Visible Score (with padding to avoid lock icon) */}
        <div className="flex items-center justify-between mb-4 pr-12">
          <span className="text-sm font-semibold text-orange-600">{rank}위 · 프리미엄</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-orange-600">{Math.round(scores.overall)}점</span>
            {improvement && improvement > 0 && (
              <div className="text-xs text-green-600 font-medium">+{improvement}점 ↑</div>
            )}
          </div>
        </div>

        {/* Blurred Name */}
        <div className="mb-4">
          <h3 className="text-3xl font-bold text-gray-400" style={{ filter: 'blur(8px)' }}>
            {fullName}
          </h3>
        </div>

        {/* Blurred Characters */}
        <div className="flex gap-3 mb-4" style={{ filter: 'blur(6px)' }}>
          {characters.map((char, idx) => (
            <div key={idx} className="flex-1 p-3 bg-gray-100 rounded-lg">
              <div className="font-semibold text-lg text-gray-400">{char.character}</div>
              <div className="text-xs text-gray-400 mt-1">{char.meaning}</div>
              <div className="text-xs text-gray-400 mt-1">{char.strokes}획 · {char.element}</div>
            </div>
          ))}
        </div>

        {/* Blurred Scores */}
        <div className="grid grid-cols-2 gap-2 mb-4" style={{ filter: 'blur(4px)' }}>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-xs text-gray-400">오행</div>
            <div className="text-sm font-bold text-gray-400">{Math.round(scores.elementHarmony.score)}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-xs text-gray-400">음양</div>
            <div className="text-sm font-bold text-gray-400">{Math.round(scores.yinYangBalance.score)}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-xs text-gray-400">수리</div>
            <div className="text-sm font-bold text-gray-400">{Math.round(scores.numerology.score)}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-xs text-gray-400">의미</div>
            <div className="text-sm font-bold text-gray-400">{Math.round(scores.meaningHarmony.score)}</div>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm text-center transition-colors">
          <Lock className="w-4 h-4 inline mr-2" />
          클릭하여 1-9위 프리미엄 개명 보기
        </div>
      </Card>
    </motion.div>
  );
}
