/**
 * Name Card - 무료 공개 카드 (5위)
 *
 * 완전 공개: 이름, 한자, 의미, 점수 모두 표시
 * 한자 상세 클릭 가능, 즐겨찾기 가능
 */

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { ElementBadge } from '~/components/ui/element-badge';
import { Heart, Info } from 'lucide-react';
import type { ScoredCandidate } from '~/lib/naming/types';
import { getRankLabel } from '~/lib/freemium/classification';

interface NameCardProps {
  candidate: ScoredCandidate;
  rank?: number;
  isFavorite?: boolean;
  onFavorite?: (candidateId: string) => void;
  onCharacterClick?: (characterId: string) => void;
  showFreeBadge?: boolean;
}

export function NameCard({
  candidate,
  rank = 5,
  isFavorite = false,
  onFavorite,
  onCharacterClick,
  showFreeBadge = true,
}: NameCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(candidate.id);
    }
  };

  return (
    <motion.div
      data-testid="name-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="hover:shadow-xl transition-all border-2 border-green-200 hover:border-green-400">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            {/* 왼쪽: 순위 + 이름 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  {getRankLabel(rank)}
                </Badge>
                {showFreeBadge && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    🎁 무료 공개
                  </Badge>
                )}
              </div>

              {/* 이름 */}
              <CardTitle className="text-3xl mb-2">
                {candidate.firstName.join('')}
              </CardTitle>

              {/* 한자 + 음 */}
              <div className="flex gap-3 text-gray-700">
                {candidate.characters.map((char, idx) => (
                  <button
                    key={idx}
                    onClick={() => onCharacterClick?.(char.id)}
                    className="hover:text-orange-600 transition-colors flex items-center gap-1 group"
                  >
                    <span className="text-xl font-medium">{char.character}</span>
                    <span className="text-sm">({char.koreanReading})</span>
                    <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            {/* 오른쪽: 점수 + 즐겨찾기 */}
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <div className="text-4xl font-bold text-green-600">
                  {Math.round(candidate.scores.overall)}
                  <span className="text-lg">점</span>
                </div>
                <p className="text-xs text-gray-500">종합 점수</p>
              </div>

              {/* 즐겨찾기 버튼 */}
              {onFavorite && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavoriteClick}
                  className="hover:bg-red-50"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorite
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400'
                    }`}
                  />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 점수 상세 */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreItem
              label="오행 조화"
              score={candidate.scores.elementHarmony.score}
              weight={candidate.scores.elementHarmony.weight}
            />
            <ScoreItem
              label="음양 균형"
              score={candidate.scores.yinYangBalance.score}
              weight={candidate.scores.yinYangBalance.weight}
            />
            <ScoreItem
              label="수리 길흉"
              score={candidate.scores.numerology.score}
              weight={candidate.scores.numerology.weight}
            />
            <ScoreItem
              label="의미 조화"
              score={candidate.scores.meaningHarmony.score}
              weight={candidate.scores.meaningHarmony.weight}
            />
          </div>

          {/* 오행 배지 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">한자 오행</p>
            <div className="flex gap-2">
              {candidate.characters.map((char, idx) => (
                <ElementBadge key={idx} element={char.element} />
              ))}
            </div>
          </div>

          {/* 한자 의미 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">한자 뜻</p>
            <div className="space-y-1">
              {candidate.characters.map((char, idx) => (
                <p key={idx} className="text-sm text-gray-800">
                  <span className="font-semibold">{char.character}</span>
                  : {char.meaning}
                </p>
              ))}
            </div>
          </div>

          {/* 획수 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
            <span>총 획수: {candidate.totalStrokes}획</span>
            <span>신뢰도: {Math.round(candidate.confidenceScore)}%</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Score Item Component
 */
interface ScoreItemProps {
  label: string;
  score: number;
  weight: number;
}

function ScoreItem({ label, score, weight }: ScoreItemProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs text-gray-500">가중치 {weight}%</span>
      </div>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {Math.round(score)}
        <span className="text-sm">점</span>
      </div>
    </div>
  );
}
