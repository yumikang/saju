/**
 * Naming Input Form Page
 *
 * Step 1 of naming flow: Collect birth information
 * Integrates with POST /api/naming/analyze
 */

import { json, redirect, type ActionFunctionArgs, type MetaFunction } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { HanjaSelector } from '~/components/ui/hanja-selector';
import type { HanjaChar } from '~/lib/hanja-data';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '~/lib/utils';

export const meta: MetaFunction = () => {
  return [
    { title: '사주 작명 | 생년월일 입력' },
    { name: 'description', content: '생년월일 정보를 입력하여 사주를 분석합니다' },
  ];
};

/**
 * Action: Submit birth data to Phase 2 analyze API
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // Parse form data
  const birthDate = formData.get('birthDate') as string;
  const birthTime = formData.get('birthTime') as string;
  const isLunar = formData.get('calendarType') === 'lunar';
  const gender = formData.get('gender') as string;
  const lastName = formData.get('lastName') as string;
  const lastNameChar = formData.get('lastNameChar') as string | null;
  const lastNameStrokes = formData.get('lastNameStrokes') as string | null;

  // Validation
  if (!birthDate || !birthTime || !gender || !lastName) {
    return json({
      success: false,
      error: '모든 필드를 입력해주세요',
    }, { status: 400 });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthDate)) {
    return json({
      success: false,
      error: '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)',
    }, { status: 400 });
  }

  // Validate time format (HH:MM)
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(birthTime)) {
    return json({
      success: false,
      error: '올바른 시간 형식이 아닙니다 (HH:MM)',
    }, { status: 400 });
  }

  try {
    // Call Phase 2 API: POST /api/naming/analyze
    const response = await fetch(`${new URL(request.url).origin}/api/naming/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        birthDate,
        birthTime,
        isLunar,
        gender: gender as 'male' | 'female',
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return json({
        success: false,
        error: result.message || '사주 분석 중 오류가 발생했습니다',
      }, { status: response.status });
    }

    // Store lastName in session or pass as query param for next step
    const sajuDataId = result.data.sajuDataId;

    // Build redirect URL with lastName and optional Hanja data
    const params = new URLSearchParams({ lastName });
    if (lastNameChar) params.set('lastNameChar', lastNameChar);
    if (lastNameStrokes) params.set('lastNameStrokes', lastNameStrokes);

    // Redirect to analysis page with query params
    return redirect(`/naming/analysis/${sajuDataId}?${params.toString()}`);
  } catch (error) {
    console.error('[naming._index] Error calling analyze API:', error);
    return json({
      success: false,
      error: '서버와 통신 중 오류가 발생했습니다',
    }, { status: 500 });
  }
}

/**
 * Input Form Page Component
 */
export default function NamingInputPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Form state
  const [birthDate, setBirthDate] = useState<Date>();
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [lastName, setLastName] = useState('');
  const [selectedHanja, setSelectedHanja] = useState<HanjaChar | undefined>();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          사주 작명 서비스
        </h1>
        <p className="text-lg text-gray-600">
          생년월일과 출생시간을 입력하여 사주를 분석합니다
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>1단계: 생년월일 정보 입력</CardTitle>
          <CardDescription>
            정확한 사주 분석을 위해 모든 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            {/* Last Name */}
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
              <p className="text-sm text-gray-500">
                성씨의 한글 발음을 입력하세요
              </p>
            </div>

            {/* 한자 선택 */}
            {lastName && (
              <div className="space-y-2">
                <Label>한자 선택</Label>
                <HanjaSelector
                  reading={lastName}
                  selectedHanja={selectedHanja}
                  onSelect={(hanja) => setSelectedHanja(hanja)}
                  mode="surname"
                  placeholder="성씨 한자를 선택하세요"
                />
                {selectedHanja && (
                  <p className="text-sm text-gray-600">
                    선택: {selectedHanja.char} ({selectedHanja.meaning}) - {selectedHanja.strokes}획
                  </p>
                )}
                <p className="text-sm text-amber-600">
                  💡 한자를 선택하면 더 정확한 81수리 계산이 가능합니다
                </p>
              </div>
            )}

            {/* Hidden inputs for Hanja data */}
            {selectedHanja && (
              <>
                <input type="hidden" name="lastNameChar" value={selectedHanja.char} />
                <input type="hidden" name="lastNameStrokes" value={selectedHanja.strokes} />
              </>
            )}

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">성별 *</Label>
              <Select name="gender" required>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="성별을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남자</SelectItem>
                  <SelectItem value="female">여자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Type */}
            <div className="space-y-2">
              <Label>달력 종류 *</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="calendarType"
                    value="solar"
                    checked={calendarType === 'solar'}
                    onChange={() => setCalendarType('solar')}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium">양력</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="calendarType"
                    value="lunar"
                    checked={calendarType === 'lunar'}
                    onChange={() => setCalendarType('lunar')}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium">음력</span>
                </label>
              </div>
              {calendarType === 'lunar' && (
                <p className="text-sm text-orange-600 mt-1">
                  * 음력은 자동으로 양력으로 변환되어 계산됩니다
                </p>
              )}
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label>생년월일 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !birthDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? (
                      format(birthDate, 'yyyy년 MM월 dd일', { locale: ko })
                    ) : (
                      <span>날짜를 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                    locale={ko}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                  />
                </PopoverContent>
              </Popover>
              {/* Hidden input for form submission */}
              {birthDate && (
                <input
                  type="hidden"
                  name="birthDate"
                  value={format(birthDate, 'yyyy-MM-dd')}
                />
              )}
            </div>

            {/* Birth Time */}
            <div className="space-y-2">
              <Label htmlFor="birthTime">출생시간 *</Label>
              <Input
                id="birthTime"
                name="birthTime"
                type="time"
                required
              />
              <p className="text-sm text-gray-500">
                24시간 형식으로 입력하세요 (예: 14:30)
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
              disabled={isSubmitting || !birthDate}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  사주 분석 중...
                </>
              ) : (
                '다음 단계: 사주 분석'
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">
          📋 필요한 정보
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>정확한 생년월일과 출생시간이 필요합니다</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>음력 생일인 경우 음력을 선택해주세요</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>성씨는 작명에 사용될 성을 입력하세요</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
