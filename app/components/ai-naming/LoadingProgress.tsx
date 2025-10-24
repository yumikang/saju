/**
 * Loading Progress Component
 *
 * Shows real-time progress for 8-step NamingPipeline execution
 */

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { PIPELINE_STEPS } from '~/lib/ai-naming/types';

interface LoadingProgressProps {
  currentStep: number; // 1-8
  message?: string;
}

export function LoadingProgress({ currentStep, message }: LoadingProgressProps) {
  // Calculate overall progress (0-100)
  const totalDuration = PIPELINE_STEPS.reduce((sum, step) => sum + step.duration, 0);
  const completedDuration = PIPELINE_STEPS.slice(0, currentStep - 1).reduce(
    (sum, step) => sum + step.duration,
    0
  );
  const currentStepDuration = PIPELINE_STEPS[currentStep - 1]?.duration || 0;
  const progress = Math.min(
    100,
    ((completedDuration + currentStepDuration / 2) / totalDuration) * 100
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-12 h-12 text-purple-600" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl">
            AI가 최적의 이름을 생성하고 있습니다
          </CardTitle>
          {message && (
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">전체 진행률</span>
              <span className="font-bold text-purple-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Step List */}
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <motion.div
                  key={step.id}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.id * 0.05 }}
                >
                  {/* Step Icon */}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? '✓' : step.id}
                  </div>

                  {/* Step Name */}
                  <div className="flex-1">
                    <div
                      className={`
                        text-sm font-medium
                        ${
                          isCurrent
                            ? 'text-purple-600'
                            : isCompleted
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }
                      `}
                    >
                      {step.name}
                    </div>
                  </div>

                  {/* Loading Spinner for Current Step */}
                  {isCurrent && (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Info Message */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              평균 소요 시간: <span className="font-semibold">5-10초</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
