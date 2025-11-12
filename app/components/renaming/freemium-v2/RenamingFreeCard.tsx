/**
 * RenamingFreeCard Component - Simple Orange Theme
 *
 * Displays rank 11-12 name candidates as free samples with full details.
 * Simple orange theme matching the naming service.
 */

import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import type { ScoredCandidate } from '~/lib/naming/types';

export interface RenamingFreeCardProps {
  candidate: ScoredCandidate;
  rank: 10;
  currentName?: string;
  currentNameScore?: number;
  onCharacterClick?: (characterId: number) => void;
  onUpgradeClick?: () => void;
}

export function RenamingFreeCard({
  candidate,
  rank,
  currentName,
  currentNameScore,
  onCharacterClick,
  onUpgradeClick,
}: RenamingFreeCardProps) {
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
      transition={{ duration: 0.4 }}
    >
      <Card className="border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-lg p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-orange-600">{rank}위 · 무료</span>
          <span className="text-2xl font-bold text-orange-600">{scores.overall.toFixed(1)}점</span>
        </div>

        {/* Name with current name comparison */}
        {currentName && (
          <div className="mb-3 text-sm text-gray-600">
            <span>{currentName}</span>
            <span className="mx-2 text-orange-500">→</span>
            <span className="font-bold text-gray-900">{fullName}</span>
            {improvement && improvement > 0 && (
              <span className="ml-2 text-green-600 font-medium">(+{improvement}점 ↑)</span>
            )}
          </div>
        )}

        {/* Name (without comparison) */}
        {!currentName && (
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{fullName}</h3>
        )}

        {/* Characters */}
        <div className="flex gap-3 mb-4">
          {characters.map((char, idx) => (
            <button
              key={idx}
              onClick={() => onCharacterClick?.(char.id)}
              className="flex-1 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="font-semibold text-lg text-gray-900">{char.character}</div>
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
            1-9위 프리미엄 개명 보기 →
          </button>
        )}
      </Card>
    </motion.div>
  );
}
