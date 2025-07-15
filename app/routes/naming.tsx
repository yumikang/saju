import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { CalendarIcon, Clock, User, CreditCard, Baby } from "lucide-react"
import { useToast } from "~/hooks/use-toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "~/lib/utils"
import { MultiHanjaSelector } from "~/components/ui/hanja-selector"
import { HanjaChar } from "~/lib/hanja-data"

// 신생아 정보 입력 컴포넌트
function BabyInfoForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    lastName: '',
    lastNameHanja: null as HanjaChar | null,
    gender: '',
    birthDate: undefined as Date | undefined,
    birthTime: '',
    parentValue: '',
    calendarType: 'solar' as 'solar' | 'lunar',
    dueDate: undefined as Date | undefined,
    isExpected: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium mb-2">성씨</label>
        <div className="space-y-3">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            placeholder="김 (한글)"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({...formData, lastName: e.target.value, lastNameHanja: null})
            }}
            required
          />
          {formData.lastName && (
            <MultiHanjaSelector
              syllables={[formData.lastName]}
              selectedHanjas={[formData.lastNameHanja]}
              onSelectionChange={(index, hanja) => {
                setFormData({...formData, lastNameHanja: hanja})
              }}
              label="성씨 한자"
              required
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">성별</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="M"
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              required
            />
            <span className="ml-2">남아</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="F"
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              required
            />
            <span className="ml-2">여아</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">출생 상태</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="isExpected"
              value="false"
              checked={!formData.isExpected}
              onChange={() => setFormData({...formData, isExpected: false})}
            />
            <span className="ml-2">출생 완료</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="isExpected"
              value="true"
              checked={formData.isExpected}
              onChange={() => setFormData({...formData, isExpected: true})}
            />
            <span className="ml-2">출산 예정</span>
          </label>
        </div>
      </div>

      {!formData.isExpected ? (
        <>
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
                  onChange={(e) => setFormData({...formData, calendarType: e.target.value as 'solar' | 'lunar'})}
                />
                <span className="ml-2">양력</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="calendarType"
                  value="lunar"
                  checked={formData.calendarType === 'lunar'}
                  onChange={(e) => setFormData({...formData, calendarType: e.target.value as 'solar' | 'lunar'})}
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
                    !formData.birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.birthDate ? (
                    format(formData.birthDate, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span>날짜를 선택하세요</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={(date) => setFormData({...formData, birthDate: date})}
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
              value={formData.birthTime}
              onChange={(e) => setFormData({...formData, birthTime: e.target.value})}
              required
            />
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-2">출산 예정일</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dueDate ? (
                  format(formData.dueDate, "yyyy년 MM월 dd일", { locale: ko })
                ) : (
                  <span>출산 예정일을 선택하세요</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.dueDate}
                onSelect={(date) => setFormData({...formData, dueDate: date})}
                initialFocus
                locale={ko}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">부모님이 중요하게 생각하는 가치</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          value={formData.parentValue}
          onChange={(e) => setFormData({...formData, parentValue: e.target.value})}
          required
        >
          <option value="">선택하세요</option>
          <option value="지혜">지혜로운 사람</option>
          <option value="성공">성공하는 사람</option>
          <option value="건강">건강한 사람</option>
          <option value="인덕">인덕이 있는 사람</option>
          <option value="창의">창의적인 사람</option>
        </select>
      </div>

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
        <Baby className="w-4 h-4 mr-2" />
        신생아 작명 시작하기
      </Button>
    </form>
  )
}

// 사주 분석 결과 컴포넌트
function SajuAnalysis({ data, onComplete }: { data: any, onComplete: () => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  // 모의 사주 데이터
  const sajuData = {
    elements: {
      목: 2,
      화: 1,
      토: 3,
      금: 1,
      수: 1
    },
    lacking: ['화', '금', '수'],
    yongsin: '화'
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
          <h3 className="text-xl font-bold">사주팔자 분석 중...</h3>
          <p className="text-gray-600 mt-2">
            {data.isExpected ? '출산 예정일 기준으로 사주를 분석하고 있습니다' : '천간지지와 오행을 계산하고 있습니다'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-center">
            {data.isExpected ? '예상 사주 분석 결과' : '사주 분석 결과'}
          </h3>
          
          <Card>
            <CardHeader>
              <CardTitle>오행 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(sajuData.elements).map(([element, count]) => (
                  <div key={element} className="text-center">
                    <div className="text-2xl font-bold">{element}</div>
                    <div className="text-3xl">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>분석 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                부족한 오행: <span className="font-bold text-orange-500">{sajuData.lacking.join(', ')}</span>
              </p>
              <p className="text-gray-600 mt-2">
                용신: <span className="font-bold text-orange-500">{sajuData.yongsin}</span>
              </p>
              {data.isExpected && (
                <p className="text-sm text-blue-600 mt-2">
                  * 출산 후 정확한 출생시간으로 재분석을 권장합니다
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

// 신생아 작명 결과 컴포넌트
function NamingResults({ data, onPayment, onSkip }: { data: any, onPayment: () => void, onSkip: () => void }) {
  const { toast } = useToast()
  
  const names = [
    { name: `${data.lastName}도윤`, hanja: `${data.lastName}道允`, meaning: "도를 따르고 허락받은 아이", score: 95 },
    { name: `${data.lastName}서준`, hanja: `${data.lastName}瑞俊`, meaning: "상서롭고 준수한 아이", score: 93 },
    { name: `${data.lastName}민준`, hanja: `${data.lastName}敏俊`, meaning: "민첩하고 준수한 아이", score: 91 },
    { name: `${data.lastName}지호`, hanja: `${data.lastName}智浩`, meaning: "지혜롭고 호탕한 아이", score: 90 },
    { name: `${data.lastName}현우`, hanja: `${data.lastName}賢宇`, meaning: "현명하고 우주같은 아이", score: 88 }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">
        {data.isExpected ? '예상 작명 결과' : '신생아 작명 결과'}
      </h2>
      
      <div className="grid gap-4 mb-8">
        {names.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">{item.name}</h3>
                    <p className="text-gray-600">{item.hanja}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.meaning}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-500">{item.score}점</div>
                    <p className="text-sm text-gray-500">종합점수</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 가격 정보 */}
      <Card className="mb-8 border-orange-500">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">상세 분석 보고서</h3>
          <p className="text-gray-600 mb-4">
            각 이름의 상세한 사주 분석, 획수 풀이, 음양오행 조화도를 확인하세요
          </p>
          <div className="mb-6">
            <p className="text-sm text-gray-500 line-through">정가 100,000원</p>
            <p className="text-4xl font-bold text-orange-500">70,000원</p>
            <p className="text-sm text-red-500">30% 할인 (오늘만!)</p>
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

// 전문가 제안 컴포넌트
function ExpertProposals() {
  const experts = [
    {
      id: 1,
      name: "김영철 선생님",
      experience: "30년",
      rating: 4.9,
      reviews: 523,
      price: 150000,
      speciality: "신생아 작명",
      message: "아이의 사주를 보니 화(火) 기운이 부족합니다. 출산 후 정확한 시간으로 재분석해드리겠습니다."
    },
    {
      id: 2,
      name: "이정희 선생님",
      experience: "25년",
      rating: 4.8,
      reviews: 412,
      price: 120000,
      speciality: "성명학",
      message: "전통적 가치관과 현대적 감각을 조화시킨 이름을 지어드리겠습니다."
    },
    {
      id: 3,
      name: "박민수 선생님",
      experience: "20년",
      rating: 4.7,
      reviews: 389,
      price: 100000,
      speciality: "역학",
      message: "부모님이 중요하게 생각하는 가치를 반영한 3개의 이름을 제안드립니다."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">전문가 맞춤 제안</h2>
        <p className="text-gray-600">
          신생아 작명 전문가들이 개별 견적을 제안했습니다
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

export default function Naming() {
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
            {['정보입력', '사주분석', '이름추천', '전문가제안'].map((label, index) => (
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
              신생아 작명 서비스
            </h1>
            <BabyInfoForm onSubmit={handleFormSubmit} />
          </motion.div>
        )}

        {step === 'analysis' && (
          <SajuAnalysis data={formData} onComplete={handleAnalysisComplete} />
        )}

        {step === 'result' && (
          <NamingResults data={formData} onPayment={handlePayment} onSkip={handleSkip} />
        )}

        {step === 'experts' && (
          <ExpertProposals />
        )}
      </div>
    </div>
  )
}