import { motion, AnimatePresence } from 'framer-motion';
import { useNamingProcess } from '~/hooks/useRealtimeSocket';
import { cn } from '~/lib/utils';
import { CheckCircle2, Circle, Loader2, XCircle, Clock, Sparkles } from 'lucide-react';

// 단계 정의
const NAMING_STEPS = [
  { id: 1, name: '사주 분석', icon: '☯️', description: '생년월일시를 분석합니다' },
  { id: 2, name: '오행 계산', icon: '🔥', description: '오행의 균형을 파악합니다' },
  { id: 3, name: '용신 분석', icon: '⚡', description: '용신과 기신을 분석합니다' },
  { id: 4, name: 'AI 생성', icon: '🤖', description: 'AI가 이름을 생성합니다' },
  { id: 5, name: '이름 평가', icon: '📊', description: '생성된 이름을 평가합니다' },
  { id: 6, name: '최종 검증', icon: '✅', description: '최종 검증을 진행합니다' }
];

/**
 * 작명 진행상황 표시 컴포넌트
 * 실시간으로 각 단계의 진행상황을 시각화
 */
export function NamingProgress() {
  const {
    status,
    progress,
    currentStep,
    totalSteps,
    stepName,
    message,
    isProcessing,
    isCompleted,
    hasError
  } = useNamingProcess();

  // 진행 중이 아니면 렌더링하지 않음
  if (status === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* 메인 프로그레스 카드 */}
        <div className="card-mobile relative overflow-hidden">
          {/* 배경 애니메이션 */}
          {isProcessing && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
              animate={{
                x: ['0%', '100%', '0%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
          
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={isProcessing ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  {isProcessing && <Loader2 className="w-5 h-5 text-primary" />}
                  {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {hasError && <XCircle className="w-5 h-5 text-red-600" />}
                </motion.div>
                <h3 className="text-lg font-semibold">
                  {isProcessing && '작명 진행 중'}
                  {isCompleted && '작명 완료'}
                  {hasError && '오류 발생'}
                  {status === 'cancelled' && '작명 취소됨'}
                </h3>
              </div>
              
              {/* 진행률 표시 */}
              <motion.div
                key={progress}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </motion.div>
            </div>

            {/* 전체 프로그레스 바 */}
            <div className="mb-6">
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {/* 반짝이는 효과 */}
                {isProcessing && (
                  <motion.div
                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100px', '500px']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                )}
              </div>
            </div>

            {/* 단계별 진행 표시 (Stepper) */}
            <div className="space-y-3">
              {NAMING_STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isComplete = currentStep > step.id || isCompleted;
                const isPending = currentStep < step.id && !isCompleted;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-all",
                      isActive && "bg-primary/10 border border-primary/20",
                      isComplete && "bg-green-50 border border-green-200",
                      isPending && "opacity-50"
                    )}
                  >
                    {/* 단계 아이콘 */}
                    <div className="flex-shrink-0 mt-0.5">
                      <motion.div
                        animate={isActive ? {
                          scale: [1, 1.2, 1],
                        } : {}}
                        transition={{
                          duration: 1,
                          repeat: isActive ? Infinity : 0
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-lg",
                          isActive && "bg-primary text-white",
                          isComplete && "bg-green-600 text-white",
                          isPending && "bg-gray-200"
                        )}
                      >
                        {isComplete ? '✓' : step.icon}
                      </motion.div>
                    </div>
                    
                    {/* 단계 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          isActive && "text-primary",
                          isComplete && "text-green-700"
                        )}>
                          {step.name}
                        </span>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1 text-xs text-primary"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>진행 중</span>
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isActive && message ? message : step.description}
                      </p>
                    </div>
                    
                    {/* 상태 표시 */}
                    <div className="flex-shrink-0">
                      {isComplete && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {isActive && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-5 h-5 text-primary" />
                        </motion.div>
                      )}
                      {isPending && (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 현재 메시지 */}
            {message && isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">{message}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 간단한 프로그레스 바 컴포넌트
 * 공간이 제한적일 때 사용
 */
export function NamingProgressBar() {
  const { progress, isProcessing, stepName } = useNamingProcess();
  
  if (!isProcessing) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full"
    >
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{stepName}</span>
          <span className="text-sm text-primary font-bold">{progress}%</span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 플로팅 프로그레스 인디케이터
 * 모바일에서 하단 고정으로 표시
 */
export function FloatingProgress() {
  const { isProcessing, progress, stepName, currentStep, totalSteps } = useNamingProcess();
  
  if (!isProcessing) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-40 lg:hidden"
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium">{stepName}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentStep}/{totalSteps}
            </span>
          </div>
          <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}