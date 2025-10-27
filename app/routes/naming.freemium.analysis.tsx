/**
 * Freemium Step 2: Saju Analysis
 *
 * GET /naming/freemium/analysis?sessionId=xxx
 *
 * Displays Saju analysis results:
 * - Four pillars (년월일시)
 * - Element counts and lacking elements
 * - Yongsin analysis
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { ElementBadge } from '~/components/ui/element-badge';
import { ArrowRight, Loader2, Sparkles, TrendingUp } from 'lucide-react';

// Element colors
const ELEMENT_COLORS = {
  WOOD: 'bg-green-100 text-green-800 border-green-300',
  FIRE: 'bg-red-100 text-red-800 border-red-300',
  EARTH: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  METAL: 'bg-gray-100 text-gray-800 border-gray-300',
  WATER: 'bg-blue-100 text-blue-800 border-blue-300',
};

const ELEMENT_KOREAN = {
  WOOD: '목(木)',
  FIRE: '화(火)',
  EARTH: '토(土)',
  METAL: '금(金)',
  WATER: '수(水)',
};

interface SajuPillar {
  gan: string;
  ji: string;
}

interface SajuData {
  pillars: {
    year: SajuPillar;
    month: SajuPillar;
    day: SajuPillar;
    hour: SajuPillar;
  };
  elementCounts: {
    WOOD: number;
    FIRE: number;
    EARTH: number;
    METAL: number;
    WATER: number;
  };
  lackingElements: string[];
  yongsin: {
    primary: string;
    secondary?: string;
  };
}

export default function FreemiumAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [isLoading, setIsLoading] = useState(true);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch Saju analysis on mount
  useEffect(() => {
    if (!sessionId) {
      setError('세션 ID가 없습니다');
      setIsLoading(false);
      return;
    }

    const fetchSajuAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/naming/freemium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 2, sessionId }),
        });

        const result = await response.json();

        if (result.success) {
          setSaju(result.saju);
        } else {
          setError(result.message || '사주 분석에 실패했습니다');
        }
      } catch (error) {
        console.error('[Saju Analysis] Error:', error);
        setError('서버 연결에 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSajuAnalysis();
  }, [sessionId]);

  // Handle continue button
  const handleContinue = () => {
    navigate(`/naming/freemium/results?sessionId=${sessionId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-blue-500" />
              <h2 className="text-2xl font-bold mb-2">사주를 분석하고 있습니다...</h2>
              <p className="text-gray-600">
                생년월일시를 바탕으로 사주팔자를 계산 중입니다
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !saju) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-red-200">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">오류가 발생했습니다</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate('/naming/freemium')} variant="outline">
                처음으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <Sparkles className="inline w-8 h-8 text-blue-500 mr-2" />
            사주팔자 분석 완료
          </h1>
          <p className="text-lg text-gray-600">
            아기의 사주를 분석했습니다
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              정보 입력
            </div>
            <div className="w-8 border-t-2 border-gray-400" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              사주 분석
            </div>
            <div className="w-8 border-t-2 border-gray-300" />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">
                3
              </div>
              이름 추천
            </div>
          </div>
        </motion.div>

        {/* Saju Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl mb-6">
            <CardHeader>
              <CardTitle>사주팔자 (四柱八字)</CardTitle>
              <CardDescription>생년월일시에 따른 네 기둥</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {/* Year */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">년주 (年柱)</div>
                  <div className="bg-gradient-to-b from-purple-100 to-purple-50 border-2 border-purple-300 rounded-lg p-4">
                    <div className="text-3xl font-bold text-purple-900">
                      {saju.pillars.year.gan}
                    </div>
                    <div className="text-2xl font-bold text-purple-700 mt-2">
                      {saju.pillars.year.ji}
                    </div>
                  </div>
                </div>

                {/* Month */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">월주 (月柱)</div>
                  <div className="bg-gradient-to-b from-blue-100 to-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-900">
                      {saju.pillars.month.gan}
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mt-2">
                      {saju.pillars.month.ji}
                    </div>
                  </div>
                </div>

                {/* Day */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">일주 (日柱)</div>
                  <div className="bg-gradient-to-b from-green-100 to-green-50 border-2 border-green-300 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-900">
                      {saju.pillars.day.gan}
                    </div>
                    <div className="text-2xl font-bold text-green-700 mt-2">
                      {saju.pillars.day.ji}
                    </div>
                  </div>
                </div>

                {/* Hour */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">시주 (時柱)</div>
                  <div className="bg-gradient-to-b from-orange-100 to-orange-50 border-2 border-orange-300 rounded-lg p-4">
                    <div className="text-3xl font-bold text-orange-900">
                      {saju.pillars.hour.gan}
                    </div>
                    <div className="text-2xl font-bold text-orange-700 mt-2">
                      {saju.pillars.hour.ji}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Element Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl mb-6">
            <CardHeader>
              <CardTitle>오행 분석 (五行)</CardTitle>
              <CardDescription>목·화·토·금·수 에너지 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(saju.elementCounts).map(([element, count]) => (
                  <div key={element} className="flex items-center gap-3">
                    <div className="w-20 text-sm font-medium">
                      {ELEMENT_KOREAN[element as keyof typeof ELEMENT_KOREAN]}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / 8) * 100}%` }}
                        transition={{ delay: 0.3 + Object.keys(saju.elementCounts).indexOf(element) * 0.1, duration: 0.5 }}
                        className={`h-full ${ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS].split(' ')[0]} flex items-center justify-end pr-3`}
                      >
                        <span className="text-sm font-bold">{count.toFixed(1)}</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lacking Elements */}
              {saju.lackingElements.length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-1">
                        보완이 필요한 오행
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {saju.lackingElements.map((element) => (
                          <span
                            key={element}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${
                              ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS]
                            }`}
                          >
                            {ELEMENT_KOREAN[element as keyof typeof ELEMENT_KOREAN]}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-orange-700 mt-2">
                        이름에서 이 오행을 보완하면 좋습니다
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Yongsin Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl mb-6">
            <CardHeader>
              <CardTitle>용신 분석 (用神)</CardTitle>
              <CardDescription>사주의 핵심 에너지</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="inline-block bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-full w-32 h-32 flex items-center justify-center">
                  <div className="text-5xl font-bold text-yellow-900">
                    {saju.yongsin.primary}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mt-6 mb-2">
                  주 용신: {saju.yongsin.primary}
                </h3>
                {saju.yongsin.secondary && (
                  <p className="text-gray-600">
                    보조 용신: {saju.yongsin.secondary}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
                  용신은 사주의 균형을 맞추는 가장 중요한 오행입니다.
                  이름에 용신을 잘 반영하면 좋은 이름이 됩니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={handleContinue}
            className="w-full max-w-md h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            이름 추천 받기
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            사주 분석을 바탕으로 최적의 이름을 추천해드립니다
          </p>
        </motion.div>
      </div>
    </div>
  );
}
