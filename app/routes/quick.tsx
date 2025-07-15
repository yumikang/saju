import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar, Clock, User, CreditCard } from "lucide-react"
import { useToast } from "~/hooks/use-toast"

// 생년월일시 입력 컴포넌트
function BirthInfoForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    lastName: '',
    gender: '',
    birthDate: '',
    birthTime: '',
    parentValue: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium mb-2">성씨</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          placeholder="김"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          required
        />
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
        <label className="block text-sm font-medium mb-2">생년월일</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          value={formData.birthDate}
          onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
          required
        />
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
        사주 분석 시작하기
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
          <p className="text-gray-600 mt-2">천간지지와 오행을 계산하고 있습니다</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-center">사주 분석 결과</h3>
          
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
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

// 작명 결과 컴포넌트
function NamingResults({ onPayment, onSkip }: { onPayment: () => void, onSkip: () => void }) {
  const { toast } = useToast()
  
  const names = [
    { name: "김도윤", hanja: "金道允", meaning: "도를 따르고 허락받은 아이", score: 95 },
    { name: "김서준", hanja: "金瑞俊", meaning: "상서롭고 준수한 아이", score: 93 },
    { name: "김민준", hanja: "金敏俊", meaning: "민첩하고 준수한 아이", score: 91 },
    { name: "김지호", hanja: "金智浩", meaning: "지혜롭고 호탕한 아이", score: 90 },
    { name: "김현우", hanja: "金賢宇", meaning: "현명하고 우주같은 아이", score: 88 }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">AI 추천 이름</h2>
      
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
              다음에 하기
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
      speciality: "사주명리학",
      message: "아이의 사주를 보니 화(火) 기운이 부족합니다. 제가 추천하는 이름으로..."
    },
    {
      id: 2,
      name: "이정희 선생님",
      experience: "25년",
      rating: 4.8,
      reviews: 412,
      price: 120000,
      speciality: "성명학",
      message: "획수와 음양의 조화를 중시하여 최상의 이름을 지어드리겠습니다."
    },
    {
      id: 3,
      name: "박민수 선생님",
      experience: "20년",
      rating: 4.7,
      reviews: 389,
      price: 100000,
      speciality: "역학",
      message: "용신을 보완하는 한자를 선별하여 3개의 이름을 제안드립니다."
    },
    {
      id: 4,
      name: "최은영 선생님",
      experience: "15년",
      rating: 4.6,
      reviews: 298,
      price: 80000,
      speciality: "사주팔자",
      message: "부모님의 바람과 아이의 사주를 조화롭게 연결하는 이름을..."
    },
    {
      id: 5,
      name: "정현철 선생님",
      experience: "18년",
      rating: 4.8,
      reviews: 356,
      price: 90000,
      speciality: "작명학",
      message: "현대적 감각과 전통을 조화시킨 이름을 지어드립니다."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">전문가 맞춤 제안</h2>
        <p className="text-gray-600">
          전문 작명가들이 아이의 사주를 분석하고 개별 견적을 제안했습니다
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

      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          마음에 드는 전문가를 선택하여 1:1 맞춤 상담을 받아보세요
        </p>
        <Button variant="outline">더 많은 전문가 보기</Button>
      </div>
    </div>
  )
}

export default function QuickNaming() {
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
    // 결제 프로세스
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
              AI 사주 작명 서비스
            </h1>
            <BirthInfoForm onSubmit={handleFormSubmit} />
          </motion.div>
        )}

        {step === 'analysis' && (
          <SajuAnalysis data={formData} onComplete={handleAnalysisComplete} />
        )}

        {step === 'result' && (
          <NamingResults onPayment={handlePayment} onSkip={handleSkip} />
        )}

        {step === 'experts' && (
          <ExpertProposals />
        )}
      </div>
    </div>
  )
}