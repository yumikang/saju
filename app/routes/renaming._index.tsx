/**
 * Renaming Service - Step 1: Information Input
 *
 * Route: /renaming
 * Purpose: Collect user information for renaming analysis
 * Next: /renaming/analysis (stores formData in session)
 *
 * @created 2025-10-28
 * @refactor Phase 2: Step 1 route file
 */

import { useState } from 'react';
import { redirect, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useNavigation } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { CalendarIcon, RefreshCw, Sparkles, User } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '~/lib/utils';
import { MultiHanjaSelector, HanjaSelector } from '~/components/ui/hanja-selector';
import type { HanjaChar } from '~/lib/hanja-data';
import { setRenamingFormData } from '~/lib/renaming/session.server';
import type { RenamingFormData } from '~/lib/renaming/types';

/**
 * Action handler: Store form data in session and redirect to analysis
 */
export async function action({ request }: ActionFunctionArgs) {
  const formDataRaw = await request.formData();

  // Parse form data
  const currentNameHanjaStr = formDataRaw.get('currentNameHanja') as string;
  const lastNameHanjaStr = formDataRaw.get('lastNameHanja') as string;

  const formData: RenamingFormData = {
    currentName: formDataRaw.get('currentName') as string,
    currentNameHanja: currentNameHanjaStr ? JSON.parse(currentNameHanjaStr) : [],
    lastName: formDataRaw.get('lastName') as string,
    lastNameHanja: lastNameHanjaStr ? JSON.parse(lastNameHanjaStr) : null,
    gender: formDataRaw.get('gender') as 'M' | 'F',
    birthDate: formDataRaw.get('birthDate') as string,
    birthTime: formDataRaw.get('birthTime') as string,
    calendarType: formDataRaw.get('calendarType') as 'solar' | 'lunar',
    renamingReason: formDataRaw.get('renamingReason') as string,
    desiredMeaning: formDataRaw.get('desiredMeaning') as string,
  };

  // Store in session
  const cookieHeader = await setRenamingFormData(request, formData);

  // Redirect to analysis step
  return redirect('/renaming/analysis', {
    headers: {
      'Set-Cookie': cookieHeader,
    },
  });
}

/**
 * Main component: Information input form
 */
export default function RenamingIndex() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [formData, setFormData] = useState({
    currentName: '',
    currentNameHanja: [] as (HanjaChar | null)[],
    lastName: '',
    lastNameHanja: null as HanjaChar | null,
    gender: '',
    birthDate: undefined as Date | undefined,
    birthTime: '',
    calendarType: 'solar' as 'solar' | 'lunar',
    renamingReason: '',
    desiredMeaning: '',
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          <Sparkles className="inline w-8 h-8 text-yellow-500 mr-2" />
          개명 서비스
        </h1>
        <p className="text-lg text-gray-600">
          전문가 수준의 개명 분석을 받아보세요
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <Form method="post" className="space-y-6">
        {/* 현재 이름 */}
        <div>
          <label className="block text-sm font-medium mb-2">현재 이름</label>
          <div className="space-y-3">
            <input
              type="text"
              name="currentName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="철수 (한글)"
              value={formData.currentName}
              onChange={(e) => {
                const syllables = e.target.value.split('');
                setFormData({
                  ...formData,
                  currentName: e.target.value,
                  currentNameHanja: syllables.map(() => null),
                });
              }}
              required
            />
            {formData.currentName && (
              <>
                <MultiHanjaSelector
                  syllables={formData.currentName.split('')}
                  selectedHanjas={formData.currentNameHanja}
                  onSelectionChange={(index, hanja) => {
                    const newHanjas = [...formData.currentNameHanja];
                    newHanjas[index] = hanja;
                    setFormData({ ...formData, currentNameHanja: newHanjas });
                  }}
                  label="현재 이름 한자"
                  required
                />
                {/* Hidden field for form submission */}
                <input
                  type="hidden"
                  name="currentNameHanja"
                  value={JSON.stringify(formData.currentNameHanja)}
                />
              </>
            )}
          </div>
        </div>

        {/* 성씨 */}
        <div>
          <label className="block text-sm font-medium mb-2">성씨</label>
          <div className="space-y-3">
            <input
              type="text"
              name="lastName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="김 (한글)"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            {formData.lastName && (
              <>
                <HanjaSelector
                  reading={formData.lastName}
                  selectedHanja={formData.lastNameHanja || undefined}
                  onSelect={(hanja) => setFormData({ ...formData, lastNameHanja: hanja })}
                  placeholder="성씨 한자 선택"
                  mode="surname"
                  required
                />
                {/* Hidden field for form submission */}
                <input
                  type="hidden"
                  name="lastNameHanja"
                  value={JSON.stringify(formData.lastNameHanja)}
                />
              </>
            )}
          </div>
        </div>

        {/* 성별 */}
        <div>
          <label className="block text-sm font-medium mb-2">성별</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="M"
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
              />
              <span className="ml-2">남성</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="F"
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
              />
              <span className="ml-2">여성</span>
            </label>
          </div>
        </div>

        {/* 생년월일 */}
        <div>
          <label className="block text-sm font-medium mb-2">생년월일</label>

          {/* 양력/음력 선택 */}
          <div className="flex gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="calendarType"
                value="solar"
                checked={formData.calendarType === 'solar'}
                onChange={(e) =>
                  setFormData({ ...formData, calendarType: e.target.value as 'solar' | 'lunar' })
                }
              />
              <span className="ml-2">양력</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="calendarType"
                value="lunar"
                checked={formData.calendarType === 'lunar'}
                onChange={(e) =>
                  setFormData({ ...formData, calendarType: e.target.value as 'solar' | 'lunar' })
                }
              />
              <span className="ml-2">음력</span>
            </label>
          </div>

          {/* 날짜 선택 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.birthDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.birthDate ? (
                  format(formData.birthDate, 'yyyy년 MM월 dd일', { locale: ko })
                ) : (
                  <span>날짜를 선택하세요</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.birthDate}
                onSelect={(date) => setFormData({ ...formData, birthDate: date })}
                initialFocus
                locale={ko}
              />
            </PopoverContent>
          </Popover>

          {/* Hidden field for form submission */}
          {formData.birthDate && (
            <input
              type="hidden"
              name="birthDate"
              value={format(formData.birthDate, 'yyyy-MM-dd')}
            />
          )}
        </div>

        {/* 출생시간 */}
        <div>
          <label className="block text-sm font-medium mb-2">출생시간</label>
          <input
            type="time"
            name="birthTime"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            value={formData.birthTime}
            onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
            required
          />
        </div>

        {/* 개명 이유 */}
        <div>
          <label className="block text-sm font-medium mb-2">개명 이유</label>
          <select
            name="renamingReason"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            value={formData.renamingReason}
            onChange={(e) => setFormData({ ...formData, renamingReason: e.target.value })}
            required
          >
            <option value="">선택하세요</option>
            <option value="운세개선">운세 개선</option>
            <option value="사회생활">사회생활 개선</option>
            <option value="건강문제">건강 문제</option>
            <option value="인간관계">인간관계 개선</option>
            <option value="사업운">사업운 개선</option>
            <option value="결혼운">결혼운 개선</option>
            <option value="기타">기타</option>
          </select>
        </div>

        {/* 원하는 의미 */}
        <div>
          <label className="block text-sm font-medium mb-2">원하는 의미</label>
          <select
            name="desiredMeaning"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            value={formData.desiredMeaning}
            onChange={(e) => setFormData({ ...formData, desiredMeaning: e.target.value })}
            required
          >
            <option value="">선택하세요</option>
            <option value="성공">성공과 출세</option>
            <option value="건강">건강과 장수</option>
            <option value="인덕">인덕과 인기</option>
            <option value="재물">재물과 풍요</option>
            <option value="평화">평화와 안정</option>
            <option value="지혜">지혜와 학업</option>
          </select>
        </div>

        {/* Submit 버튼 */}
        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600"
          disabled={isSubmitting}
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isSubmitting && 'animate-spin')} />
          {isSubmitting ? '저장 중...' : '개명 분석 시작하기'}
        </Button>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
