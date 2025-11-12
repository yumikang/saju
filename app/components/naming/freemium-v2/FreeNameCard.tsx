/**
 * FreeNameCard Component - Simple Orange Theme
 *
 * Displays rank 10 name candidate as free sample with full details.
 */

import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import type { ScoredCandidate } from '~/lib/naming/types';

export interface FreeNameCardProps {
  candidate: ScoredCandidate;
  rank: 10;
  onCharacterClick?: (characterId: number) => void;
  onUpgradeClick?: () => void;
}

export function FreeNameCard({
  candidate,
  rank,
  onCharacterClick,
  onUpgradeClick,
}: FreeNameCardProps) {
  const { firstName, characters, scores } = candidate;
  const fullName = firstName.join('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-lg p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-orange-600">10위 · 무료</span>
          <span className="text-2xl font-bold text-orange-600">{scores.overall.toFixed(1)}점</span>
        </div>

        {/* Name */}
        <h3 className="text-3xl font-bold text-gray-900 mb-4">{fullName}</h3>

        {/* Characters */}
        <div className="flex gap-3 mb-4">
          {characters.map((char, idx) => (
            <button
              key={idx}
              onClick={() => onCharacterClick?.(char.id)}
              className="flex-1 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="font-semibold text-lg text-gray-900">{char.character}</span>
                <span className="text-sm text-gray-600">({char.koreanReading})</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">{char.meaning}</div>
              <div className="text-xs text-gray-500 mt-1">{char.strokes}획 · {char.element}</div>
            </button>
          ))}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">오행</div>
            <div className="text-sm font-bold text-orange-600">{Math.round(scores.elementHarmony.score)}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">음양</div>
            <div className="text-sm font-bold text-orange-600">{Math.round(scores.yinYangBalance.score)}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded opacity-50">
            <div className="text-xs text-gray-600">수리 (참고)</div>
            <div className="text-sm font-bold text-orange-600">{Math.round(scores.numerology.score)}</div>
            <div className="text-[10px] text-amber-600">미반영</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">의미</div>
            <div className="text-sm font-bold text-orange-600">{Math.round(scores.meaningHarmony.score)}</div>
          </div>
        </div>

        {/* CTA */}
        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            더 높은 점수의 프리미엄 이름 보기 →
          </button>
        )}
      </Card>
    </motion.div>
  );
}
