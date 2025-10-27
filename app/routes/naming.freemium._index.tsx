/**
 * Freemium Step 1: Input Form
 *
 * GET /naming/freemium
 *
 * Collects user input:
 * - 성씨 (Last name with Hanja)
 * - 성별 (Gender)
 * - 생년월일시 (Birth date and time)
 * - 부모 가치관 (Parent values, 1-3 선택)
 */

import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { HanjaSelector } from '~/components/ui/hanja-selector';
import { Calendar } from '~/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { ValueSelector, type ParentValue } from '~/components/naming/ValueSelector';
import type { HanjaChar } from '~/lib/hanja-data';
import { ArrowRight, Calendar as CalendarIcon, Clock, User, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';

export default function FreemiumInputPage() {
  const navigate = useNavigate();

  // Form state
  const [lastName, setLastName] = useState('');
  const [lastNameHanja, setLastNameHanja] = useState<HanjaChar | null>(null);
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  const [birthDate, setBirthDate] = useState<Date>();
  const [birthTime, setBirthTime] = useState({ hour: '', minute: '' });
  const [isLunar, setIsLunar] = useState(false);
  const [selectedValues, setSelectedValues] = useState<ParentValue[]>([]);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isFormValid = () => {
    return (
      lastName.length > 0 &&
      lastNameHanja !== null &&
      gender !== '' &&
      birthDate !== undefined &&
      birthTime.hour !== '' &&
      birthTime.minute !== '' &&
      selectedValues.length >= 1 &&
      selectedValues.length <= 3
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError('모든 필수 항목을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format data for API
      const requestData = {
        stage: 1,
        data: {
          lastName,
          lastNameStrokes: lastNameHanja!.strokes,
          gender,
          birthDate: birthDate!.toISOString().split('T')[0], // YYYY-MM-DD
          birthTime: `${birthTime.hour.padStart(2, '0')}:${birthTime.minute.padStart(2, '0')}`,
          isLunar,
          selectedValues,
        },
      };

      // Call Stage 1 API
      const response = await fetch('/api/naming/freemium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to Step 2 (Saju Analysis)
        navigate(`/naming/freemium/analysis?sessionId=${result.sessionId}`);
      } else {
        setError(result.message || '오류가 발생했습니다');
      }
    } catch (error) {
      console.error('[Freemium Input] Error:', error);
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <Sparkles className="inline w-8 h-8 text-yellow-500 mr-2" />
            AI 작명 서비스
          </h1>
          <p className="text-lg text-gray-600">
            전문가 수준의 작명을 무료로 체험하세요
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              정보 입력
            </div>
            <div className="w-8 border-t-2 border-gray-300" />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">
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

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>기본 정보 입력</CardTitle>
              <CardDescription>
                아기의 사주를 분석하기 위한 정보를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 성씨 */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    성씨 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    maxLength={2}
                    placeholder="예: 김, 이, 박"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {/* 성씨 한자 선택 */}
                {lastName && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <Label>
                      성씨 한자 선택 <span className="text-red-500">*</span>
                    </Label>
                    <HanjaSelector
                      reading={lastName}
                      selectedHanja={lastNameHanja || undefined}
                      onSelect={setLastNameHanja}
                      mode="surname"
                      required
                    />
                  </motion.div>
                )}

                {/* 성별 */}
                <div className="space-y-2">
                  <Label>
                    성별 <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={gender === 'M' ? 'default' : 'outline'}
                      onClick={() => setGender('M')}
                      className={cn(
                        'h-12',
                        gender === 'M' && 'bg-blue-500 hover:bg-blue-600'
                      )}
                    >
                      <User className="w-4 h-4 mr-2" />
                      남아
                    </Button>
                    <Button
                      type="button"
                      variant={gender === 'F' ? 'default' : 'outline'}
                      onClick={() => setGender('F')}
                      className={cn(
                        'h-12',
                        gender === 'F' && 'bg-pink-500 hover:bg-pink-600'
                      )}
                    >
                      <User className="w-4 h-4 mr-2" />
                      여아
                    </Button>
                  </div>
                </div>

                {/* 생년월일 */}
                <div className="space-y-2">
                  <Label>
                    생년월일 <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-12',
                          !birthDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? (
                          birthDate.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        ) : (
                          '날짜를 선택하세요'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* 음력/양력 선택 */}
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isLunar}
                        onChange={() => setIsLunar(false)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">양력</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isLunar}
                        onChange={() => setIsLunar(true)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">음력</span>
                    </label>
                  </div>
                </div>

                {/* 출생 시간 */}
                <div className="space-y-2">
                  <Label>
                    출생 시간 <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <Select
                      value={birthTime.hour}
                      onValueChange={(value) =>
                        setBirthTime({ ...birthTime, hour: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="시" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i}시
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-gray-600">:</span>
                    <Select
                      value={birthTime.minute}
                      onValueChange={(value) =>
                        setBirthTime({ ...birthTime, minute: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="분" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i}분
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 부모 가치관 선택 */}
                <div className="space-y-2">
                  <Label>
                    자녀에게 바라는 가치관 (1-3개 선택) <span className="text-red-500">*</span>
                  </Label>
                  <ValueSelector
                    value={selectedValues}
                    onChange={setSelectedValues}
                    min={1}
                    max={3}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isSubmitting ? (
                    '처리 중...'
                  ) : (
                    <>
                      다음 단계로
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* 안내 메시지 */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  입력하신 정보는 안전하게 보호되며, 24시간 후 자동으로 삭제됩니다
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="text-center p-4">
            <div className="text-3xl mb-2">🎁</div>
            <h3 className="font-semibold mb-1">무료 체험</h3>
            <p className="text-xs text-gray-600">
              전문가 수준의 이름 추천을 무료로
            </p>
          </Card>
          <Card className="text-center p-4">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">즉시 확인</h3>
            <p className="text-xs text-gray-600">
              AI 분석으로 30초 만에 결과 확인
            </p>
          </Card>
          <Card className="text-center p-4">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold mb-1">높은 정확도</h3>
            <p className="text-xs text-gray-600">
              사주 전문가가 검증한 알고리즘
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
