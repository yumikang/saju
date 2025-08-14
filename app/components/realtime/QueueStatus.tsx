import { motion, AnimatePresence } from 'framer-motion';
import { useQueueStatus } from '~/hooks/useRealtimeSocket';
import { cn } from '~/lib/utils';
import { Users, Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * 대기열 상태 표시 컴포넌트
 * 현재 대기 순서와 예상 시간을 시각화
 */
export function QueueStatus() {
  const {
    position,
    estimatedTime,
    totalInQueue,
    status,
    formattedEstimatedTime,
    waitingTime,
    isWaiting,
    isReady,
    isProcessing
  } = useQueueStatus();

  if (status === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className={cn(
          "card-mobile relative overflow-hidden",
          isReady && "border-green-500 bg-green-50",
          isProcessing && "border-primary bg-primary/5"
        )}>
          {/* 상태 아이콘 및 타이틀 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isWaiting && "bg-yellow-100 text-yellow-700",
                isReady && "bg-green-100 text-green-700",
                isProcessing && "bg-primary/20 text-primary"
              )}>
                {isWaiting && <Users className="w-5 h-5" />}
                {isReady && <CheckCircle className="w-5 h-5" />}
                {isProcessing && <Zap className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {isWaiting && '대기 중'}
                  {isReady && '준비 완료'}
                  {isProcessing && '처리 중'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isWaiting && `${totalInQueue}명 대기 중`}
                  {isReady && '곧 시작됩니다'}
                  {isProcessing && '작명이 진행 중입니다'}
                </p>
              </div>
            </div>

            {/* 대기 시간 */}
            {waitingTime > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">대기 시간</p>
                <p className="text-sm font-medium">{Math.floor(waitingTime / 60)}분</p>
              </div>
            )}
          </div>

          {/* 대기 순서 표시 */}
          {isWaiting && position > 0 && (
            <>
              {/* 순서 카드 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-1">내 순서</p>
                  <motion.p
                    key={position}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold text-primary"
                  >
                    {position}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-1">번째</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-1">예상 시간</p>
                  <p className="text-2xl font-bold text-primary">
                    {formattedEstimatedTime}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    대기 중
                  </p>
                </motion.div>
              </div>

              {/* 시각적 대기열 표시 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">대기열 현황</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalInQueue, 10) }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        i === position - 1 
                          ? "bg-primary text-white ring-2 ring-primary ring-offset-2" 
                          : "bg-white border border-gray-300 text-gray-600"
                      )}
                    >
                      {i + 1}
                    </motion.div>
                  ))}
                  {totalInQueue > 10 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      +{totalInQueue - 10}
                    </span>
                  )}
                </div>
              </div>

              {/* 진행 바 */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>진행률</span>
                  <span>{Math.max(0, 100 - (position * 10))}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.max(0, 100 - (position * 10))}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </>
          )}

          {/* 준비 완료 상태 */}
          {isReady && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-100 border border-green-300 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </motion.div>
                <div>
                  <p className="font-medium text-green-900">
                    이제 작명을 시작할 수 있습니다!
                  </p>
                  <p className="text-sm text-green-700">
                    준비가 완료되었습니다. 작명하기 버튼을 눌러주세요.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 간단한 대기열 배지 컴포넌트
 * 헤더나 작은 공간에 표시용
 */
export function QueueBadge() {
  const { position, isWaiting, isReady } = useQueueStatus();

  if (!isWaiting && !isReady) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          isWaiting && "bg-yellow-100 text-yellow-800",
          isReady && "bg-green-100 text-green-800"
        )}
      >
        {isWaiting && (
          <>
            <Users className="w-3.5 h-3.5" />
            <span>대기 {position}번</span>
          </>
        )}
        {isReady && (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>준비 완료</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 모바일용 미니 대기열 상태
 * 플로팅 또는 스티키 헤더용
 */
export function MiniQueueStatus() {
  const { position, formattedEstimatedTime, isWaiting } = useQueueStatus();

  if (!isWaiting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-yellow-50 border-b border-yellow-200 px-4 py-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-yellow-700" />
          <span className="text-sm font-medium text-yellow-900">
            대기 순서: {position}번
          </span>
        </div>
        <span className="text-sm text-yellow-700">
          예상: {formattedEstimatedTime}
        </span>
      </div>
    </motion.div>
  );
}