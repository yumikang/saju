/**
 * RenamingFreeCard Component - Strategic Freemium V2 for Renaming Service
 *
 * Displays rank 11-12 name candidates as free samples with full details.
 * Uses emerald color theme to distinguish from premium yellow cards.
 * Adapted for renaming service with current name comparison.
 *
 * Features:
 * - Current name vs new name comparison
 * - Full name, hanja, and score display with improvement metrics
 * - Emerald/green color scheme for free tier
 * - "무료 체험" badge with Gift icon
 * - Sparkles quality indicator
 * - Rank-based stagger animation (0s, 0.1s)
 * - Hover scale effect with emerald shadow
 * - Responsive mobile-first design
 * - Character detail click handlers
 * - Upgrade CTA at bottom
 */

import { motion } from 'framer-motion';
import { Gift, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import type { ScoredCandidate } from '~/lib/naming/types';

export interface RenamingFreeCardProps {
  /** Name candidate data (rank 11 or 12) */
  candidate: ScoredCandidate;

  /** Rank position (11 or 12 only) */
  rank: 11 | 12;

  /** Current name (for comparison) */
  currentName?: string;

  /** Current name score (for improvement display) */
  currentNameScore?: number;

  /** Optional click handler for character details */
  onCharacterClick?: (characterId: number) => void;

  /** Optional click handler for upgrade CTA */
  onUpgradeClick?: () => void;
}

/**
 * Score indicator subcomponent
 */
interface ScoreItemProps {
  label: string;
  value: number;
  maxValue?: number;
}

function ScoreItem({ label, value, maxValue = 100 }: ScoreItemProps) {
  const percentage = (value / maxValue) * 100;

  // Color based on score threshold
  const scoreColor =
    value >= 80 ? 'text-emerald-600' :
    value >= 60 ? 'text-yellow-600' :
    'text-orange-600';

  const bgColor =
    value >= 80 ? 'bg-emerald-100' :
    value >= 60 ? 'bg-yellow-100' :
    'bg-orange-100';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${scoreColor}`}>
          {Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${bgColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/**
 * RenamingFreeCard Component
 */
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

  // Animation delay based on rank (11: 0s, 12: 0.1s)
  const animationDelay = (rank - 11) * 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: animationDelay,
        ease: 'easeOut',
      }}
      whileHover={{ scale: 1.02 }}
      className="cursor-default"
    >
      <Card className="relative overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200/50">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-white to-white" />

        {/* Content */}
        <div className="relative p-4 sm:p-5 lg:p-6">
          {/* Header: Rank badge + Free badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700 bg-emerald-50"
              >
                {rank}등
              </Badge>
              <Badge
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0"
              >
                <Gift className="w-3 h-3 mr-1" />
                무료 체험
              </Badge>
            </div>

            {/* Quality indicator */}
            {scores.overall >= 80 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: animationDelay + 0.3 }}
              >
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </motion.div>
            )}
          </div>

          {/* Current vs New Name Comparison */}
          {currentName && (
            <div className="mb-4 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <div className="text-gray-500 text-xs mb-1">현재 이름</div>
                  <div className="font-medium text-gray-700">{currentName}</div>
                </div>
                <div className="px-3">
                  <div className="text-emerald-600">→</div>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-gray-500 text-xs mb-1">새 이름</div>
                  <div className="font-bold text-emerald-700">{fullName}</div>
                </div>
              </div>
              {improvement !== null && improvement > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: animationDelay + 0.2 }}
                  className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-center gap-1 text-emerald-700"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    현재보다 <span className="font-bold">{improvement}점</span> 개선
                  </span>
                </motion.div>
              )}
            </div>
          )}

          {/* Name display (without comparison context) */}
          {!currentName && (
            <div className="mb-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {fullName}
              </h3>

              {/* Characters with readings */}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => onCharacterClick?.(char.id)}
                    className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                    type="button"
                  >
                    <span className="font-medium text-base">{char.character}</span>
                    <span className="text-xs">({char.koreanReading})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Overall score - prominent display */}
          <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">종합 점수</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-600">
                  {Math.round(scores.overall)}
                </span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
            </div>
          </div>

          {/* Detailed scores grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <ScoreItem
              label="오행 조화"
              value={scores.elementHarmony.score}
            />
            <ScoreItem
              label="음양 균형"
              value={scores.yinYangBalance.score}
            />
            <ScoreItem
              label="수리 길흉"
              value={scores.numerology.score}
            />
            <ScoreItem
              label="의미 조화"
              value={scores.meaningHarmony.score}
            />
          </div>

          {/* Character details grid */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            {characters.map((char) => (
              <div
                key={char.id}
                className="p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div className="font-medium text-gray-900 mb-1">
                  {char.character} ({char.koreanReading})
                </div>
                <div className="text-gray-600 line-clamp-2">
                  {char.meaning}
                </div>
                <div className="mt-1 flex items-center gap-2 text-gray-500">
                  <span>{char.strokes}획</span>
                  <span>•</span>
                  <span>{char.element}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade CTA */}
          {onUpgradeClick && (
            <motion.button
              onClick={onUpgradeClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg"
              type="button"
            >
              더 높은 점수의 프리미엄 개명 보기 →
            </motion.button>
          )}
        </div>

        {/* Info badge at bottom */}
        <div className="border-t border-emerald-100 bg-emerald-50/50 px-4 py-2 text-center">
          <p className="text-xs text-emerald-700">
            💡 1위 최고 점수 개명은 프리미엄 잠금되어 있습니다
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
