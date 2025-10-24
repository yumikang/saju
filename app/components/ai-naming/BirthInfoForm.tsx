/**
 * Birth Information Form Component
 *
 * Collects birth data for AI naming service
 */

import { useState } from 'react';
import { Form } from '@remix-run/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { HanjaSelector } from '~/components/ui/hanja-selector';
import type { HanjaChar } from '~/lib/hanja-data';
import { cn } from '~/lib/utils';

interface BirthInfoFormProps {
  isSubmitting?: boolean;
  error?: string;
}

export function BirthInfoForm({ isSubmitting, error }: BirthInfoFormProps) {
  const [birthDate, setBirthDate] = useState<Date>();
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [lastName, setLastName] = useState('');
  const [selectedHanja, setSelectedHanja] = useState<HanjaChar | undefined>();

  return (
    <Card className="max-w-2xl mx-auto border-purple-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-purple-900">
          생년월일 정보 입력
        </CardTitle>
        <CardDescription className="text-base">
          정확한 AI 작명을 위해 모든 정보를 입력해주세요
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form method="post" className="space-y-6">
          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base font-semibold">
              성씨 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="예: 김"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={2}
              className="text-base"
            />
            <p className="text-sm text-gray-500">
              성씨의 한글 발음을 입력하세요
            </p>
          </div>

          {/* Hanja Selection */}
          {lastName && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                성씨 한자 선택 (선택사항)
              </Label>
              <HanjaSelector
                reading={lastName}
                selectedHanja={selectedHanja}
                onSelect={(hanja) => setSelectedHanja(hanja)}
                mode="surname"
                placeholder="성씨 한자를 선택하세요"
              />
              {selectedHanja && (
                <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                  <p className="text-sm text-purple-900 font-medium">
                    선택: {selectedHanja.char} ({selectedHanja.meaning}) - {selectedHanja.strokes}획
                  </p>
                </div>
              )}
              <p className="text-sm text-purple-600">
                💡 한자를 선택하면 더 정확한 81수리 계산이 가능합니다
              </p>
            </div>
          )}

          {/* Hidden Hanja Data */}
          {selectedHanja && (
            <>
              <input type="hidden" name="lastNameChar" value={selectedHanja.char} />
              <input type="hidden" name="lastNameStrokes" value={selectedHanja.strokes} />
            </>
          )}

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-base font-semibold">
              성별 <span className="text-red-500">*</span>
            </Label>
            <Select name="gender" required>
              <SelectTrigger id="gender" className="text-base">
                <SelectValue placeholder="성별을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">남자</SelectItem>
                <SelectItem value="F">여자</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calendar Type */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              달력 종류 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="calendarType"
                  value="solar"
                  checked={calendarType === 'solar'}
                  onChange={() => setCalendarType('solar')}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
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
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium">음력</span>
              </label>
            </div>
            {calendarType === 'lunar' && (
              <p className="text-sm text-purple-600">
                * 음력은 자동으로 양력으로 변환되어 계산됩니다
              </p>
            )}
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              생년월일 <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal text-base',
                    !birthDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
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
            <Label htmlFor="birthTime" className="text-base font-semibold">
              출생시간 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="birthTime"
              name="birthTime"
              type="time"
              required
              className="text-base"
            />
            <p className="text-sm text-gray-500">
              24시간 형식으로 입력하세요 (예: 14:30)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            size="lg"
            disabled={isSubmitting || !birthDate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                AI가 이름을 생성하고 있습니다...
              </>
            ) : (
              <>
                <span className="text-lg font-semibold">AI 작명 시작하기</span>
              </>
            )}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
