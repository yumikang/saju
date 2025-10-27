/**
 * ValueSelector Component
 *
 * 부모님의 가치관 선택 컴포넌트 (1-3개 다중 선택)
 *
 * Values:
 * - success: 성공과 출세
 * - health: 건강과 장수
 * - popularity: 인덕과 인기
 * - wealth: 재물과 풍요
 * - peace: 평화와 안정
 * - wisdom: 지혜와 학업
 */

import * as React from 'react';
import { cn } from '~/lib/utils';
import { Label } from '~/components/ui/label';

export type ParentValue = 'success' | 'health' | 'popularity' | 'wealth' | 'peace' | 'wisdom';

interface ValueOption {
  value: ParentValue;
  label: string;
  description: string;
  icon: string;
}

const VALUE_OPTIONS: ValueOption[] = [
  {
    value: 'success',
    label: '성공과 출세',
    description: '크게 성공하고 출세하는 사람',
    icon: '🏆',
  },
  {
    value: 'health',
    label: '건강과 장수',
    description: '건강하고 오래 사는 사람',
    icon: '💪',
  },
  {
    value: 'popularity',
    label: '인덕과 인기',
    description: '인덕이 있고 인기 있는 사람',
    icon: '🤝',
  },
  {
    value: 'wealth',
    label: '재물과 풍요',
    description: '재물이 풍요로운 사람',
    icon: '💰',
  },
  {
    value: 'peace',
    label: '평화와 안정',
    description: '평화롭고 안정적인 삶',
    icon: '🕊️',
  },
  {
    value: 'wisdom',
    label: '지혜와 학업',
    description: '지혜롭고 학문이 뛰어난 사람',
    icon: '📚',
  },
];

export interface ValueSelectorProps {
  value: ParentValue[];
  onChange: (values: ParentValue[]) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function ValueSelector({
  value = [],
  onChange,
  min = 1,
  max = 3,
  disabled = false,
  className,
}: ValueSelectorProps) {
  const [error, setError] = React.useState<string | null>(null);

  const handleToggle = (optionValue: ParentValue) => {
    if (disabled) return;

    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    // Validation
    if (newValue.length < min) {
      setError(`최소 ${min}개를 선택해주세요`);
      // 하지만 선택 해제는 허용
      if (value.includes(optionValue)) {
        onChange(newValue);
      }
      return;
    }

    if (newValue.length > max) {
      setError(`최대 ${max}개까지 선택 가능합니다`);
      return;
    }

    setError(null);
    onChange(newValue);
  };

  const isSelected = (optionValue: ParentValue) => value.includes(optionValue);
  const canSelect = value.length < max;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base">
          부모님이 중요하게 생각하는 가치 <span className="text-red-500">*</span>
        </Label>
        <span className="text-sm text-muted-foreground">
          {value.length}/{max}개 선택
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        아이가 어떤 사람으로 자라기를 바라시나요? (1~3개 선택)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VALUE_OPTIONS.map((option) => {
          const selected = isSelected(option.value);
          const canClick = !disabled && (selected || canSelect);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              disabled={!canClick}
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
                'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                selected
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                !canClick && !selected && 'opacity-50 cursor-not-allowed',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {/* Checkbox indicator */}
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 flex-shrink-0 transition-colors',
                  selected
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-300 bg-white'
                )}
              >
                {selected && (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{option.icon}</span>
                  <span className={cn('font-medium', selected && 'text-orange-700')}>
                    {option.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Selected values summary */}
      {value.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">선택한 가치:</p>
          <div className="flex flex-wrap gap-2">
            {value.map((v) => {
              const option = VALUE_OPTIONS.find((o) => o.value === v);
              if (!option) return null;

              return (
                <div
                  key={v}
                  data-testid="selected-value"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
