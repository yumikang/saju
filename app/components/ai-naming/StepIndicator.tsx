/**
 * Step Indicator Component
 *
 * Visual progress indicator for AI naming flow
 * Steps: 입력 → 생성 중 → 결과 → 상세 분석
 */

import { Check } from 'lucide-react';
import { cn } from '~/lib/utils';

interface StepIndicatorProps {
  currentStep: number; // 1-4
  steps?: string[]; // 커스텀 단계명
}

const DEFAULT_STEPS = ['정보 입력', 'AI 생성', '결과 확인', '상세 분석'];

export function StepIndicator({ currentStep, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                    isCompleted &&
                      'bg-purple-600 text-white',
                    isCurrent &&
                      'bg-purple-600 text-white ring-4 ring-purple-100',
                    !isCompleted &&
                      !isCurrent &&
                      'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div
                  className={cn(
                    'mt-2 text-xs font-medium text-center whitespace-nowrap',
                    isCurrent && 'text-purple-600',
                    isCompleted && 'text-gray-700',
                    !isCompleted && !isCurrent && 'text-gray-400'
                  )}
                >
                  {step}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 -mt-6">
                  <div
                    className={cn(
                      'h-full transition-all',
                      stepNumber < currentStep
                        ? 'bg-purple-600'
                        : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
