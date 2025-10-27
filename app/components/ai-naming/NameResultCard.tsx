/**
 * Name Result Card Component
 *
 * Display individual name candidate with scores and analysis
 */

import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import type { NameCandidate } from '~/lib/ai-naming/types';
import {
  getScoreColor,
  getFortuneColor,
  formatNameDisplay,
} from '~/lib/ai-naming/api';
import { cn } from '~/lib/utils';

interface NameResultCardProps {
  candidate: NameCandidate;
  lastName: string;
  rank: number;
  onClick?: () => void;
}

export function NameResultCard({
  candidate,
  lastName,
  rank,
  onClick,
}: NameResultCardProps) {
  const fullName = formatNameDisplay(lastName, candidate.firstName);
  const score = Math.round(candidate.score);
  const scoreColor = getScoreColor(score);

  // Get top characters
  const chars = candidate.characters;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            {/* Name and Rank */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                {rank}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {fullName}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {chars.map((char, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {char.character} ({char.koreanReading})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className="text-right">
              <div className={cn('text-3xl font-bold', scoreColor)}>
                {score}점
              </div>
              {score >= 90 && (
                <Sparkles className="w-5 h-5 text-yellow-500 mx-auto mt-1" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score Breakdown */}
          {candidate.breakdown && (
            <div className="grid grid-cols-2 gap-3">
              <ScoreItem
                label="오행 조화"
                score={Math.round(candidate.breakdown.element)}
              />
              <ScoreItem
                label="음양 균형"
                score={Math.round(candidate.breakdown.yinyang)}
              />
              <ScoreItem
                label="수리 운세"
                score={Math.round(candidate.breakdown.numerology)}
              />
              <ScoreItem
                label="의미 조화"
                score={Math.round(candidate.breakdown.meaning)}
              />
            </div>
          )}

          {/* Numerology Preview */}
          {candidate.analysis?.numerologyGrids && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                81수리 운세
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: '원격', key: '원격' as const },
                  { name: '형격', key: '형격' as const },
                  { name: '이격', key: '이격' as const },
                  { name: '정격', key: '정격' as const },
                ].map((grid) => {
                  const gridData = candidate.analysis.numerologyGrids[grid.key];
                  return gridData ? (
                    <div key={grid.name} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{grid.name}</div>
                      <div className="text-xs font-semibold text-gray-700">
                        {gridData.strokes}획
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs mt-1',
                          gridData.fortune === '대길' && 'bg-green-100 text-green-800',
                          gridData.fortune === '길' && 'bg-blue-100 text-blue-800',
                          gridData.fortune === '평' && 'bg-gray-100 text-gray-800',
                          gridData.fortune === '흉' && 'bg-orange-100 text-orange-800',
                          gridData.fortune === '대흉' && 'bg-red-100 text-red-800'
                        )}
                      >
                        {gridData.fortune}
                      </Badge>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Key Analysis Points */}
          {candidate.analysis?.reasoning && candidate.analysis.reasoning.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                주요 분석 포인트
              </div>
              <ul className="space-y-1">
                {candidate.analysis.reasoning.slice(0, 2).map((reason: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* View Details Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm py-2 hover:bg-purple-50 rounded-md transition-colors"
          >
            <span>상세 분석 보기</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Score Item Component
 */
function ScoreItem({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const scoreColor = getScoreColor(score);

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-600 mb-1">
        {label}
      </div>
      <div className={cn('text-lg font-bold', scoreColor)}>
        {score}점
      </div>
    </div>
  );
}
