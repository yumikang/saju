/**
 * Renaming Service - Step 2: Current Name Analysis
 *
 * Route: /renaming/analysis
 * Purpose: Analyze current name's fortune and saju
 * Next: /renaming/results (stores analysisId in session + URL params)
 *
 * @created 2025-10-28
 * @refactor Phase 3: Step 2 route file
 */

import { useState, useEffect } from 'react';
import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '~/hooks/use-toast';
import { getRenamingFormData, setAnalysisId } from '~/lib/renaming/session.server';
import type { RenamingFormData, AnalysisData } from '~/lib/renaming/types';

/**
 * Loader: Verify session has formData
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const formData = await getRenamingFormData(request);

  // Redirect to step 1 if no form data
  if (!formData) {
    return redirect('/renaming');
  }

  return { formData };
}

/**
 * Main component: Current name analysis with API call
 */
export default function RenamingAnalysis() {
  const { formData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // API call to analyze current name
  useEffect(() => {
    const analyzeCurrentName = async () => {
      try {
        setIsAnalyzing(true);
        setError(null);

        // Extract firstName (remove lastName)
        let firstNameStr = formData.currentName;
        if (firstNameStr.startsWith(formData.lastName)) {
          firstNameStr = firstNameStr.substring(formData.lastName.length);
        }
        const firstName = firstNameStr.split('');

        // Convert calendar type
        const isLunar = formData.calendarType === 'lunar';

        // Format birthDate
        const birthDate = formData.birthDate;

        // API request
        const response = await fetch('/api/renaming/analyze-current', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate,
            birthTime: formData.birthTime,
            isLunar,
            currentName: {
              lastName: formData.lastName,
              firstName: firstName,
            },
            gender: formData.gender === 'M' ? 'male' : 'female',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '분석 중 오류가 발생했습니다');
        }

        const result = await response.json();

        if (result.success) {
          // Convert element counts to Korean
          const elementCounts = {
            목: result.data.saju.elementCounts.WOOD || 0,
            화: result.data.saju.elementCounts.FIRE || 0,
            토: result.data.saju.elementCounts.EARTH || 0,
            금: result.data.saju.elementCounts.METAL || 0,
            수: result.data.saju.elementCounts.WATER || 0,
          };

          const analysis: AnalysisData = {
            analysisId: result.data.analysisId,
            currentScore: Math.round(result.data.currentScore),
            elements: elementCounts,
            problems: result.data.problems,
            predictions: result.data.predictions,
          };

          setAnalysisData(analysis);

          toast({
            title: '분석 완료',
            description: '현재 이름의 운세 분석이 완료되었습니다.',
          });
        }
      } catch (err) {
        console.error('Analysis error:', err);
        const errorMessage = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다';
        setError(errorMessage);
        toast({
          title: '오류 발생',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeCurrentName();
  }, [formData, toast]);

  // Navigate to results with analysisId in URL
  const handleProceedToResults = () => {
    if (!analysisData) return;

    // Navigate with analysisId in URL for shareability and simplicity
    navigate(`/renaming/results?analysisId=${analysisData.analysisId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
        {isAnalyzing ? (
          <Card className="shadow-xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-orange-500" />
              <h2 className="text-2xl font-bold mb-2">현재 이름 운세 분석 중...</h2>
              <p className="text-gray-600">
                '{formData.currentName}'의 오행과 획수를 분석하고 있습니다
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="shadow-xl border-red-200">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">분석 오류</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600"
                variant="outline"
              >
                다시 시도하기
              </Button>
            </CardContent>
          </Card>
        ) : analysisData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-center">
            '{formData.currentName}' 운세 분석
          </h3>

          {/* 종합 운세 점수 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                종합 운세 점수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-500 mb-2">
                  {analysisData.currentScore}점
                </div>
                <div className="text-sm text-gray-600">100점 만점</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${analysisData.currentScore}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 오행 분포 */}
          <Card>
            <CardHeader>
              <CardTitle>오행 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(analysisData.elements).map(([element, count]) => (
                  <div key={element} className="text-center">
                    <div className="text-2xl font-bold">{element}</div>
                    <div className="text-3xl">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 분야별 운세 */}
          <Card>
            <CardHeader>
              <CardTitle>분야별 운세</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: '사업/직장운', value: analysisData.predictions.career },
                { label: '건강운', value: analysisData.predictions.health },
                { label: '인간관계운', value: analysisData.predictions.relationships },
                { label: '재물운', value: analysisData.predictions.wealth },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{item.value}점</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 개선 필요 사항 */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">개선 필요 사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisData.problems.map((problem, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {problem}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 다음 단계 버튼 */}
          <div className="text-center mt-8">
            <Button
              size="lg"
              onClick={handleProceedToResults}
              className="bg-orange-500 hover:bg-orange-600 px-12"
            >
              개명 제안 확인하기
              <TrendingUp className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
        ) : null}
    </div>
  );
}
