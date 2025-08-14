import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNamingProcess } from '~/hooks/useRealtimeSocket';
import { cn } from '~/lib/utils';
import { 
  Star, 
  TrendingUp, 
  Heart, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Share2,
  Download,
  CheckCircle
} from 'lucide-react';
import type { NamingResult } from '~/socket/types';

/**
 * 작명 결과 표시 컴포넌트
 * AI가 생성한 이름들을 카드 형태로 표시
 */
export function NamingResults() {
  const { results, isCompleted } = useNamingProcess();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isCompleted || results.length === 0) return null;

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-4"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">작명 결과</h2>
          <p className="text-muted-foreground">
            총 {results.length}개의 이름이 생성되었습니다
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>
      </div>

      {/* 결과 카드 리스트 */}
      <div className="space-y-4">
        <AnimatePresence>
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="relative"
            >
              <NameCard
                result={result}
                index={index}
                isExpanded={expandedCards.has(index)}
                onToggle={() => toggleCard(index)}
                onCopy={() => copyToClipboard(result.fullName, index)}
                isCopied={copiedIndex === index}
                rank={index + 1}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-3 mt-6">
        <button className="btn-mobile flex-1 bg-primary text-primary-foreground">
          <Download className="w-4 h-4 mr-2" />
          결과 저장
        </button>
        <button className="btn-mobile flex-1 bg-secondary text-secondary-foreground">
          <Share2 className="w-4 h-4 mr-2" />
          공유하기
        </button>
      </div>
    </motion.div>
  );
}

/**
 * 개별 이름 카드 컴포넌트
 */
interface NameCardProps {
  result: NamingResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  isCopied: boolean;
  rank: number;
}

function NameCard({
  result,
  index,
  isExpanded,
  onToggle,
  onCopy,
  isCopied,
  rank
}: NameCardProps) {
  // 점수에 따른 등급 계산
  const getGrade = (score: number) => {
    if (score >= 90) return { label: '최우수', color: 'text-purple-600', bg: 'bg-purple-50' };
    if (score >= 80) return { label: '우수', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 70) return { label: '양호', color: 'text-green-600', bg: 'bg-green-50' };
    return { label: '보통', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const grade = getGrade(result.scores.overall);

  return (
    <motion.div
      layout
      className={cn(
        "card-mobile cursor-pointer transition-all",
        rank <= 3 && "border-primary/30",
        isExpanded && "shadow-lg"
      )}
      onClick={onToggle}
    >
      {/* 순위 배지 */}
      {rank <= 3 && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className="absolute -top-3 -right-3 z-10"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg",
            rank === 1 && "bg-gradient-to-br from-yellow-400 to-yellow-600",
            rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-500",
            rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-800"
          )}>
            {rank}
          </div>
        </motion.div>
      )}

      {/* 카드 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold">{result.fullName}</h3>
            {result.firstNameHanja && (
              <span className="text-lg text-muted-foreground">
                {result.firstNameHanja}
              </span>
            )}
          </div>
          
          {/* 점수 및 등급 */}
          <div className="flex items-center gap-3">
            <span className={cn("px-2 py-1 rounded text-xs font-medium", grade.bg, grade.color)}>
              {grade.label}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-lg">{result.scores.overall.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCopy}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCopied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600" />
            )}
          </motion.button>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </motion.div>
        </div>
      </div>

      {/* 점수 차트 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <ScoreItem
          label="균형"
          score={result.scores.balance}
          icon={<TrendingUp className="w-3 h-3" />}
          color="blue"
        />
        <ScoreItem
          label="음향"
          score={result.scores.sound}
          icon={<Sparkles className="w-3 h-3" />}
          color="green"
        />
        <ScoreItem
          label="의미"
          score={result.scores.meaning}
          icon={<Heart className="w-3 h-3" />}
          color="red"
        />
        <ScoreItem
          label="획수"
          score={result.totalStrokes}
          icon={<span className="text-xs">劃</span>}
          color="purple"
          isStroke
        />
      </div>

      {/* 확장 콘텐츠 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-4 border-t border-gray-200"
          >
            {/* 오행 분포 */}
            {result.elements && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">오행 분포</h4>
                <div className="flex gap-2">
                  {Object.entries(result.elements).map(([element, count]) => (
                    <div
                      key={element}
                      className="flex-1 text-center p-2 bg-gray-50 rounded"
                    >
                      <div className="text-xs text-muted-foreground">
                        {element === 'wood' && '목'}
                        {element === 'fire' && '화'}
                        {element === 'earth' && '토'}
                        {element === 'metal' && '금'}
                        {element === 'water' && '수'}
                      </div>
                      <div className="font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 설명 */}
            {result.explanation && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm leading-relaxed">{result.explanation}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * 점수 항목 컴포넌트
 */
interface ScoreItemProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple';
  isStroke?: boolean;
}

function ScoreItem({ label, score, icon, color, isStroke }: ScoreItemProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  return (
    <div className={cn("rounded-lg p-2 text-center", colorClasses[color])}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="font-bold text-lg">
        {isStroke ? score : `${score.toFixed(0)}`}
      </div>
    </div>
  );
}