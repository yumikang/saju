/**
 * AI Naming Service - Main Input Page
 *
 * Step 1: Collect birth information
 * Calls POST /api/naming/generate with NamingPipeline
 */

import { json, type ActionFunctionArgs, type MetaFunction } from '@remix-run/node';
import { useActionData, useNavigation } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BirthInfoForm } from '~/components/ai-naming/BirthInfoForm';
import { LoadingProgress } from '~/components/ai-naming/LoadingProgress';
import { NameResultCard } from '~/components/ai-naming/NameResultCard';
import { StepIndicator } from '~/components/ai-naming/StepIndicator';
import { parseBirthInfo } from '~/lib/ai-naming/api';
import type { AINamingResponse } from '~/lib/ai-naming/types';
import { Sparkles, TrendingUp, Award, Shield } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'AI 사주 작명 | 8단계 지능형 작명 시스템' },
    {
      name: 'description',
      content: 'AI가 8단계 분석으로 최적의 이름을 추천합니다. 사주분석부터 용신, 오행, 음양, 81수리까지 종합 분석.',
    },
  ];
};

/**
 * Server Action: Generate names via NamingPipeline
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // Parse form data
  const birthDate = formData.get('birthDate') as string;
  const birthTime = formData.get('birthTime') as string;
  const isLunar = formData.get('calendarType') === 'lunar';
  const gender = formData.get('gender') as 'M' | 'F';
  const lastName = formData.get('lastName') as string;
  const lastNameChar = formData.get('lastNameChar') as string | null;
  const lastNameStrokes = formData.get('lastNameStrokes') as string | null;

  // Validation
  if (!birthDate || !birthTime || !gender || !lastName) {
    return json<AINamingResponse>(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '모든 필수 필드를 입력해주세요',
        },
      },
      { status: 400 }
    );
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthDate)) {
    return json<AINamingResponse>(
      {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)',
        },
      },
      { status: 400 }
    );
  }

  // Validate time format
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(birthTime)) {
    return json<AINamingResponse>(
      {
        success: false,
        error: {
          code: 'INVALID_TIME',
          message: '올바른 시간 형식이 아닙니다 (HH:MM)',
        },
      },
      { status: 400 }
    );
  }

  try {
    // Parse birth info
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute] = birthTime.split(':').map(Number);

    // Call NamingPipeline API
    const response = await fetch(`${new URL(request.url).origin}/api/naming/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        birthInfo: {
          year,
          month,
          day,
          hour,
          minute,
          isLunar,
          gender,
        },
        lastName,
        preferences: {
          nameLength: 2, // Default to 2-character names
        },
        config: {
          maxCandidates: 10,
          minScore: 60,
        },
      }),
    });

    const result: AINamingResponse = await response.json();

    if (!response.ok || !result.success) {
      return json<AINamingResponse>(
        {
          success: false,
          error: {
            code: result.error?.code || 'API_ERROR',
            message: result.error?.message || 'AI 작명 중 오류가 발생했습니다',
          },
        },
        { status: response.status }
      );
    }

    // Return successful result with lastName for display
    return json<AINamingResponse & { lastName: string }>(
      {
        ...result,
        lastName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ai-naming] Error calling generate API:', error);
    return json<AINamingResponse>(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '서버와 통신 중 오류가 발생했습니다',
          details: error,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Main Component
 */
export default function AINamingPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Simulate loading progress for better UX
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isSubmitting) {
      // Simulate 8-step progress
      const intervals = [200, 500, 300, 800, 1200, 1500, 400, 300];
      let step = 1;

      const updateStep = () => {
        if (step < 8) {
          step++;
          setCurrentStep(step);
          setTimeout(updateStep, intervals[step - 1]);
        }
      };

      setTimeout(updateStep, intervals[0]);
    } else {
      setCurrentStep(1);
    }
  }, [isSubmitting]);

  // Show results if available
  const hasResults = actionData?.success && actionData.data?.candidates;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          AI 사주 작명 서비스
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          8단계 지능형 분석으로 최적의 이름을 찾아드립니다
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
          {[
            {
              icon: TrendingUp,
              title: '8단계 AI 분석',
              description: '사주부터 용신, 오행, 음양, 81수리까지',
            },
            {
              icon: Award,
              title: '초고속 생성',
              description: '평균 5-10초 내 결과 제공',
            },
            {
              icon: Shield,
              title: '정확한 점수',
              description: '종합 분석으로 신뢰도 높은 추천',
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-lg border border-purple-100 shadow-sm"
            >
              <feature.icon className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Step Indicator */}
      {!hasResults && (
        <StepIndicator currentStep={isSubmitting ? 2 : 1} />
      )}

      {/* Loading State */}
      {isSubmitting && (
        <LoadingProgress
          currentStep={currentStep}
          message="잠시만 기다려주세요. AI가 최적의 이름을 찾고 있습니다."
        />
      )}

      {/* Input Form */}
      {!isSubmitting && !hasResults && (
        <BirthInfoForm
          isSubmitting={isSubmitting}
          error={actionData?.error?.message}
        />
      )}

      {/* Results */}
      {hasResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Results Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              추천 이름 결과
            </h2>
            <p className="text-gray-600">
              총 {actionData.data.candidates.length}개의 이름을 찾았습니다 (
              {Math.round(actionData.data.metadata.executionTime)}ms)
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-4">
            {actionData.data.candidates.map((candidate, idx) => (
              <NameResultCard
                key={idx}
                candidate={candidate}
                lastName={actionData.lastName}
                rank={idx + 1}
              />
            ))}
          </div>

          {/* Try Again Button */}
          <div className="text-center pt-8">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              다른 조건으로 다시 시도하기
            </button>
          </div>
        </motion.div>
      )}

      {/* Info Section */}
      {!hasResults && !isSubmitting && (
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI 작명 프로세스
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2 text-purple-600">1.</span>
                <span>생년월일시 기반 사주팔자 계산</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 text-purple-600">2.</span>
                <span>5가지 방법 + AI로 용신 분석</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 text-purple-600">3.</span>
                <span>용신에 맞는 한자 추천</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 text-purple-600">4.</span>
                <span>수천 개 이름 조합 자동 생성</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 text-purple-600">5.</span>
                <span>81수리, 음양, 음운 검증</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 text-purple-600">6.</span>
                <span>종합 점수 계산 및 순위화</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
