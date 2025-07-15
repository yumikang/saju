import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { CalendarIcon, Clock, User, CreditCard, Heart, Users, TrendingUp } from "lucide-react"
import { useToast } from "~/hooks/use-toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "~/lib/utils"
import { MultiHanjaSelector } from "~/components/ui/hanja-selector"
import { HanjaChar } from "~/lib/hanja-data"

// 커플 정보 입력 컴포넌트
function CoupleInfoForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    // 남성 정보
    maleData: {
      name: '',
      nameHanja: [] as (HanjaChar | null)[],
      birthDate: undefined as Date | undefined,
      birthTime: '',
      calendarType: 'solar' as 'solar' | 'lunar'
    },
    // 여성 정보
    femaleData: {
      name: '',
      nameHanja: [] as (HanjaChar | null)[],
      birthDate: undefined as Date | undefined,
      birthTime: '',
      calendarType: 'solar' as 'solar' | 'lunar'
    },
    // 관계 정보
    relationshipStatus: '',
    consultationType: '',
    concerns: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      {/* 남성 정보 */}
      <div className="border rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          남성 정보
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">이름</label>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="철수 (한글)"
                value={formData.maleData.name}
                onChange={(e) => {
                  const syllables = e.target.value.split('')
                  setFormData({
                    ...formData,
                    maleData: {
                      ...formData.maleData, 
                      name: e.target.value,
                      nameHanja: syllables.map(() => null)
                    }
                  })
                }}
                required
              />
              {formData.maleData.name && (
                <MultiHanjaSelector
                  syllables={formData.maleData.name.split('')}
                  selectedHanjas={formData.maleData.nameHanja}
                  onSelectionChange={(index, hanja) => {
                    const newHanjas = [...formData.maleData.nameHanja]
                    newHanjas[index] = hanja
                    setFormData({
                      ...formData,
                      maleData: {...formData.maleData, nameHanja: newHanjas}
                    })
                  }}
                  label="남성 이름 한자"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">생년월일</label>
            
            {/* 양력/음력 선택 */}
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="maleCalendarType"
                  value="solar"
                  checked={formData.maleData.calendarType === 'solar'}
                  onChange={(e) => setFormData({
                    ...formData,
                    maleData: {...formData.maleData, calendarType: e.target.value as 'solar' | 'lunar'}
                  })}
                />
                <span className="ml-2">양력</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="maleCalendarType"
                  value="lunar"
                  checked={formData.maleData.calendarType === 'lunar'}
                  onChange={(e) => setFormData({
                    ...formData,
                    maleData: {...formData.maleData, calendarType: e.target.value as 'solar' | 'lunar'}
                  })}
                />
                <span className="ml-2">음력</span>
              </label>
            </div>

            {/* 날짜 선택 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.maleData.birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.maleData.birthDate ? (
                    format(formData.maleData.birthDate, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span>날짜를 선택하세요</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.maleData.birthDate}
                  onSelect={(date) => setFormData({
                    ...formData,
                    maleData: {...formData.maleData, birthDate: date}
                  })}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">출생시간</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              value={formData.maleData.birthTime}
              onChange={(e) => setFormData({
                ...formData,
                maleData: {...formData.maleData, birthTime: e.target.value}
              })}
              required
            />
          </div>
        </div>
      </div>

      {/* 여성 정보 */}
      <div className="border rounded-lg p-6 bg-pink-50">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          여성 정보
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">이름</label>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="영희 (한글)"
                value={formData.femaleData.name}
                onChange={(e) => {
                  const syllables = e.target.value.split('')
                  setFormData({
                    ...formData,
                    femaleData: {
                      ...formData.femaleData, 
                      name: e.target.value,
                      nameHanja: syllables.map(() => null)
                    }
                  })
                }}
                required
              />
              {formData.femaleData.name && (
                <MultiHanjaSelector
                  syllables={formData.femaleData.name.split('')}
                  selectedHanjas={formData.femaleData.nameHanja}
                  onSelectionChange={(index, hanja) => {
                    const newHanjas = [...formData.femaleData.nameHanja]
                    newHanjas[index] = hanja
                    setFormData({
                      ...formData,
                      femaleData: {...formData.femaleData, nameHanja: newHanjas}
                    })
                  }}
                  label="여성 이름 한자"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">생년월일</label>
            
            {/* 양력/음력 선택 */}
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="femaleCalendarType"
                  value="solar"
                  checked={formData.femaleData.calendarType === 'solar'}
                  onChange={(e) => setFormData({
                    ...formData,
                    femaleData: {...formData.femaleData, calendarType: e.target.value as 'solar' | 'lunar'}
                  })}
                />
                <span className="ml-2">양력</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="femaleCalendarType"
                  value="lunar"
                  checked={formData.femaleData.calendarType === 'lunar'}
                  onChange={(e) => setFormData({
                    ...formData,
                    femaleData: {...formData.femaleData, calendarType: e.target.value as 'solar' | 'lunar'}
                  })}
                />
                <span className="ml-2">음력</span>
              </label>
            </div>

            {/* 날짜 선택 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.femaleData.birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.femaleData.birthDate ? (
                    format(formData.femaleData.birthDate, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span>날짜를 선택하세요</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.femaleData.birthDate}
                  onSelect={(date) => setFormData({
                    ...formData,
                    femaleData: {...formData.femaleData, birthDate: date}
                  })}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">출생시간</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              value={formData.femaleData.birthTime}
              onChange={(e) => setFormData({
                ...formData,
                femaleData: {...formData.femaleData, birthTime: e.target.value}
              })}
              required
            />
          </div>
        </div>
      </div>

      {/* 관계 정보 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">현재 관계</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            value={formData.relationshipStatus}
            onChange={(e) => setFormData({...formData, relationshipStatus: e.target.value})}
            required
          >
            <option value="">선택하세요</option>
            <option value="연인">연인 관계</option>
            <option value="약혼">약혼 상태</option>
            <option value="결혼예정">결혼 예정</option>
            <option value="부부">기혼 부부</option>
            <option value="소개팅">소개팅 상대</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">상담 목적</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            value={formData.consultationType}
            onChange={(e) => setFormData({...formData, consultationType: e.target.value})}
            required
          >
            <option value="">선택하세요</option>
            <option value="궁합">기본 궁합 분석</option>
            <option value="결혼">결혼 시기 및 운세</option>
            <option value="갈등">관계 갈등 해결</option>
            <option value="미래">미래 예측</option>
            <option value="개명">커플 개명 제안</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">주요 고민사항</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 h-20"
            placeholder="궁금한 점이나 고민사항을 자유롭게 작성해주세요"
            value={formData.concerns}
            onChange={(e) => setFormData({...formData, concerns: e.target.value})}
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
        <Heart className="w-4 h-4 mr-2" />
        사주 궁합 분석 시작하기
      </Button>
    </form>
  )
}

// 궁합 분석 결과 컴포넌트
function CompatibilityAnalysis({ data, onComplete }: { data: any, onComplete: () => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  const compatibility = {
    overall: 78,
    categories: {
      personality: 85,
      communication: 72,
      values: 80,
      lifestyle: 75,
      financial: 70
    },
    strengths: ['가치관 일치', '성격 보완', '소통 원활'],
    challenges: ['금전 관념 차이', '생활 패턴 차이'],
    advice: '서로의 차이점을 이해하고 보완하면 좋은 관계를 유지할 수 있습니다.'
  }

  useState(() => {
    setTimeout(() => {
      setIsAnalyzing(false)
      setTimeout(onComplete, 2000)
    }, 3000)
  })

  return (
    <div className="max-w-2xl mx-auto">
      {isAnalyzing ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold">사주 궁합 분석 중...</h3>
          <p className="text-gray-600 mt-2">두 분의 사주를 비교 분석하고 있습니다</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-center">궁합 분석 결과</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                종합 궁합 점수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-500 mb-2">{compatibility.overall}점</div>
                <div className="text-sm text-gray-600">100점 만점</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${compatibility.overall}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>분야별 궁합</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: '성격 궁합', value: compatibility.categories.personality },
                { label: '소통 능력', value: compatibility.categories.communication },
                { label: '가치관 일치', value: compatibility.categories.values },
                { label: '생활 패턴', value: compatibility.categories.lifestyle },
                { label: '금전 관념', value: compatibility.categories.financial }
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-600">장점</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {compatibility.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-600">주의사항</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {compatibility.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-600">전문가 조언</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{compatibility.advice}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

// 상세 궁합 결과 컴포넌트
function DetailedCompatibilityResults({ data, onPayment, onSkip }: { data: any, onPayment: () => void, onSkip: () => void }) {
  const { toast } = useToast()

  const detailedResults = [
    {
      title: "결혼 운세",
      score: 82,
      description: "2025년 가을이 가장 좋은 결혼 시기입니다",
      details: ["길일: 2025년 10월 15일", "주의사항: 금전 문제 사전 협의 필요"]
    },
    {
      title: "자녀 운세",
      score: 88,
      description: "건강한 자녀를 얻을 수 있는 좋은 궁합입니다",
      details: ["첫째: 남아 가능성 높음", "출산 적기: 2026년 봄"]
    },
    {
      title: "사업 운세",
      score: 75,
      description: "함께 사업을 하면 중간 정도의 성과를 거둘 수 있습니다",
      details: ["추천 업종: 서비스업", "주의사항: 역할 분담 명확히"]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">상세 궁합 분석</h2>
      
      <div className="grid gap-6 mb-8">
        {detailedResults.map((result, index) => (
          <motion.div
            key={result.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{result.title}</h3>
                    <p className="text-gray-600 mt-1">{result.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-500">{result.score}점</div>
                    <p className="text-sm text-gray-500">궁합 점수</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {result.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 가격 정보 */}
      <Card className="mb-8 border-orange-500">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">전문가 상세 분석 보고서</h3>
          <p className="text-gray-600 mb-4">
            결혼 시기, 자녀 계획, 개명 제안 등 종합적인 인생 설계를 확인하세요
          </p>
          <div className="mb-6">
            <p className="text-sm text-gray-500 line-through">정가 100,000원</p>
            <p className="text-4xl font-bold text-orange-500">80,000원</p>
            <p className="text-sm text-red-500">20% 할인</p>
          </div>
          <div className="flex gap-4">
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={onPayment}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              결제하고 상세보기
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onSkip}
            >
              전문가 상담받기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 사주 궁합 전문가 제안 컴포넌트
function SajuExpertProposals() {
  const experts = [
    {
      id: 1,
      name: "김영철 선생님",
      experience: "30년",
      rating: 4.9,
      reviews: 523,
      price: 150000,
      speciality: "궁합 전문",
      message: "두 분의 궁합을 보니 좋은 연분입니다. 결혼 시기와 주의사항을 자세히 알려드리겠습니다."
    },
    {
      id: 2,
      name: "이정희 선생님",
      experience: "25년",
      rating: 4.8,
      reviews: 412,
      price: 120000,
      speciality: "결혼 운세",
      message: "커플 개명을 통해 더 좋은 궁합으로 만들어드릴 수 있습니다."
    },
    {
      id: 3,
      name: "박민수 선생님",
      experience: "20년",
      rating: 4.7,
      reviews: 389,
      price: 100000,
      speciality: "사주 분석",
      message: "현재 관계의 문제점과 해결책을 구체적으로 제시해드리겠습니다."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">사주 궁합 전문가 제안</h2>
        <p className="text-gray-600">
          궁합 전문가들이 맞춤 분석과 개별 견적을 제안했습니다
        </p>
      </div>

      <div className="space-y-4">
        {experts.map((expert, index) => (
          <motion.div
            key={expert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{expert.name}</h3>
                        <p className="text-sm text-gray-600">
                          {expert.speciality} · 경력 {expert.experience}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-yellow-500">★ {expert.rating}</span>
                          <span className="text-gray-500">({expert.reviews}개 리뷰)</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 italic mb-4">"{expert.message}"</p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-orange-500">
                      ₩{expert.price.toLocaleString()}
                    </p>
                    <Button className="mt-2 bg-orange-500 hover:bg-orange-600">
                      상담 신청
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function Saju() {
  const [step, setStep] = useState<'input' | 'analysis' | 'result' | 'experts'>('input')
  const [formData, setFormData] = useState(null)

  const handleFormSubmit = (data: any) => {
    setFormData(data)
    setStep('analysis')
  }

  const handleAnalysisComplete = () => {
    setStep('result')
  }

  const handlePayment = () => {
    console.log('결제 진행')
  }

  const handleSkip = () => {
    setStep('experts')
  }

  return (
    <div className="bg-gradient-to-b from-orange-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* 진행 상태 표시 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {['정보입력', '궁합분석', '결과확인', '전문가제안'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${index <= ['input', 'analysis', 'result', 'experts'].indexOf(step)
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-500'}
                `}>
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">{label}</span>
                {index < 3 && <div className="w-8 sm:w-16 h-0.5 bg-gray-300 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* 단계별 컨텐츠 */}
        {step === 'input' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-center mb-8">
              사주 궁합 서비스
            </h1>
            <CoupleInfoForm onSubmit={handleFormSubmit} />
          </motion.div>
        )}

        {step === 'analysis' && (
          <CompatibilityAnalysis data={formData} onComplete={handleAnalysisComplete} />
        )}

        {step === 'result' && (
          <DetailedCompatibilityResults data={formData} onPayment={handlePayment} onSkip={handleSkip} />
        )}

        {step === 'experts' && (
          <SajuExpertProposals />
        )}
      </div>
    </div>
  )
}