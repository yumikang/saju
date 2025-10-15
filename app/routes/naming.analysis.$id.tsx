/**
 * 사주 분석 결과 페이지
 *
 * Phase 2 analyze API가 저장한 사주 데이터를 표시하고
 * 성씨를 입력받아 이름 추천 API를 호출합니다
 */

import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from '@remix-run/node';
import { Form, useLoaderData, useActionData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { PrismaClient, Element } from '@prisma/client';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ElementBadge, ElementDistribution } from '~/components/ui/element-badge';
import { Loader2, ArrowRight } from 'lucide-react';

const prisma = new PrismaClient();

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `사주 분석 결과 | 사주 작명` },
    { name: 'description', content: '사주팔자 분석 결과를 확인하세요' },
  ];
};

/**
 * Loader: 사주 데이터 가져오기
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    throw new Response('사주 데이터 ID가 필요합니다', { status: 400 });
  }

  // 데이터베이스에서 사주 데이터 조회
  const sajuData = await prisma.sajuData.findUnique({
    where: { id },
  });

  if (!sajuData) {
    throw new Response('사주 데이터를 찾을 수 없습니다', { status: 404 });
  }

  // URL에서 lastName 추출 (이전 페이지에서 전달됨)
  const url = new URL(request.url);
  const lastName = url.searchParams.get('lastName') || '';

  // 오행 카운트 재구성
  const elementCounts = {
    [Element.WOOD]: sajuData.woodCount,
    [Element.FIRE]: sajuData.fireCount,
    [Element.EARTH]: sajuData.earthCount,
    [Element.METAL]: sajuData.metalCount,
    [Element.WATER]: sajuData.waterCount,
  };

  // 부족한 오행 계산 (평균의 50% 미만)
  const avg = Object.values(elementCounts).reduce((a, b) => a + b, 0) / 5;
  const lackingElements = Object.entries(elementCounts)
    .filter(([_, count]) => count < avg * 0.5)
    .map(([elem, _]) => elem as Element);

  return json({
    sajuData: {
      id: sajuData.id,
      birthDate: sajuData.birthDate,
      birthTime: sajuData.birthTime,
      isLunar: sajuData.isLunar,
      gender: sajuData.gender,
      pillars: {
        year: { stem: sajuData.yearGan, branch: sajuData.yearJi },
        month: { stem: sajuData.monthGan, branch: sajuData.monthJi },
        day: { stem: sajuData.dayGan, branch: sajuData.dayJi },
        hour: { stem: sajuData.hourGan, branch: sajuData.hourJi },
      },
      elementCounts,
      lackingElements,
      favorableElements: [sajuData.primaryYongsin as Element],
      yongsin: {
        primary: sajuData.primaryYongsin as Element,
        secondary: sajuData.secondaryYongsin as Element | null,
      },
    },
    lastName,
  });
}

/**
 * Action: 이름 추천 요청
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  const formData = await request.formData();
  const lastName = formData.get('lastName') as string;

  // Validation
  if (!lastName) {
    return json({
      success: false,
      error: '성씨를 입력해주세요',
    }, { status: 400 });
  }

  if (!id) {
    return json({
      success: false,
      error: '사주 데이터 ID가 필요합니다',
    }, { status: 400 });
  }

  try {
    // Phase 2 API 호출: POST /api/naming/recommend
    const response = await fetch(`${new URL(request.url).origin}/api/naming/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sajuDataId: id,
        lastName,
        preferences: {
          minScore: 65,
          maxResults: 50,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return json({
        success: false,
        error: result.message || '이름 추천 중 오류가 발생했습니다',
      }, { status: response.status });
    }

    // 결과 페이지로 리다이렉트 (lastName을 query param으로 전달)
    return redirect(`/naming/results/${id}?lastName=${encodeURIComponent(lastName)}`);
  } catch (error) {
    console.error('[naming.analysis] Error calling recommend API:', error);
    return json({
      success: false,
      error: '서버와 통신 중 오류가 발생했습니다',
    }, { status: 500 });
  }
}

/**
 * 사주 분석 페이지 컴포넌트
 */
export default function AnalysisPage() {
  const { sajuData, lastName: initialLastName } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [lastName, setLastName] = useState(initialLastName);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          사주팔자 분석 결과
        </h1>
        <p className="text-lg text-gray-600">
          생년월일을 기반으로 한 사주 분석이 완료되었습니다
        </p>
      </div>

      {/* 사주팔자 (Pillars) */}
      <Card>
        <CardHeader>
          <CardTitle>사주팔자 (四柱八字)</CardTitle>
          <CardDescription>
            년주, 월주, 일주, 시주의 천간과 지지
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg">
            {[
              { label: '년주 (年柱)', pillar: sajuData.pillars.year },
              { label: '월주 (月柱)', pillar: sajuData.pillars.month },
              { label: '일주 (日柱)', pillar: sajuData.pillars.day },
              { label: '시주 (時柱)', pillar: sajuData.pillars.hour },
            ].map(({ label, pillar }) => (
              <div key={label} className="text-center space-y-2">
                <div className="text-xs text-gray-500 font-medium">{label}</div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gray-900">{pillar.stem}</div>
                  <div className="text-xl font-semibold text-gray-700">{pillar.branch}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 오행 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>오행 분포 (五行)</CardTitle>
          <CardDescription>
            사주에 나타나는 다섯 가지 기운의 균형
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ElementDistribution elementCounts={sajuData.elementCounts} />
        </CardContent>
      </Card>

      {/* 분석 결과 */}
      <Card>
        <CardHeader>
          <CardTitle>분석 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 부족한 오행 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              부족한 오행 (補充)
            </h4>
            {sajuData.lackingElements.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sajuData.lackingElements.map((element) => (
                  <ElementBadge key={element} element={element} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">모든 오행이 균형을 이루고 있습니다</p>
            )}
          </div>

          {/* 용신 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              용신 (用神) - 필요한 기운
            </h4>
            <div className="flex flex-wrap gap-2">
              <ElementBadge element={sajuData.yongsin.primary} />
              {sajuData.yongsin.secondary && (
                <ElementBadge element={sajuData.yongsin.secondary} />
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              * 작명 시 용신에 해당하는 오행의 한자를 사용하면 좋습니다
            </p>
          </div>

          {/* 유리한 오행 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              유리한 오행 (吉)
            </h4>
            <div className="flex flex-wrap gap-2">
              {sajuData.favorableElements.map((element) => (
                <ElementBadge key={element} element={element} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이름 추천 요청 */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle>2단계: 이름 추천 받기</CardTitle>
          <CardDescription>
            성씨를 입력하시면 사주에 맞는 이름을 추천해드립니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lastName">성씨 *</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="예: 김"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={2}
              />
              <p className="text-sm text-gray-600">
                작명할 이름의 성씨를 입력하세요 (1-2자)
              </p>
            </div>

            {/* Error Message */}
            {actionData && !actionData.success && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{actionData.error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
              disabled={isSubmitting || !lastName}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  이름 추천 생성 중...
                </>
              ) : (
                <>
                  다음 단계: 이름 추천 보기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* 안내 */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">
          💡 다음 단계
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>성씨를 입력하면 사주에 맞는 30-50개의 이름이 추천됩니다</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>각 이름은 오행 조화, 음양 균형, 수리 길흉을 고려하여 채점됩니다</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>추천 결과에서 마음에 드는 이름을 선택하실 수 있습니다</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
