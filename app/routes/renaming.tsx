import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { CalendarIcon, Clock, User, CreditCard, RefreshCw, TrendingUp } from "lucide-react"
import { useToast } from "~/hooks/use-toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "~/lib/utils"
import { MultiHanjaSelector, HanjaSelector } from "~/components/ui/hanja-selector"
import { HanjaChar } from "~/lib/hanja-data"

// 타입 정의
interface RenamingFormData {
  currentName: string
  currentNameHanja: (HanjaChar | null)[]
  lastName: string
  lastNameHanja: HanjaChar | null
  gender: string
  birthDate: Date | undefined
  birthTime: string
  calendarType: 'solar' | 'lunar'
  renamingReason: string
  desiredMeaning: string
}

interface AnalysisData {
  analysisId: string
  currentScore: number
  elements: {
    목: number
    화: number
    토: number
    금: number
    수: number
  }
  problems: string[]
  predictions: {
    career: number
    health: number
    relationships: number
    wealth: number
  }
}

interface RecommendationItem {
  name: string
  hanja: string
  meaning: string
  score: number
  improvement: string
  details?: unknown
}

// 개명 정보 입력 컴포넌트
function RenamingInfoForm({ onSubmit }: { onSubmit: (data: RenamingFormData) => void }) {
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
    desiredMeaning: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium mb-2">현재 이름</label>
        <div className="space-y-3">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            placeholder="철수 (한글)"
            value={formData.currentName}
            onChange={(e) => {
              const syllables = e.target.value.split('')
              setFormData({
                ...formData, 
                currentName: e.target.value,
                currentNameHanja: syllables.map(() => null)
              })
            }}
            required
          />
          {formData.currentName && (
            <MultiHanjaSelector
              syllables={formData.currentName.split('')}
              selectedHanjas={formData.currentNameHanja}
              onSelectionChange={(index, hanja) => {
                const newHanjas = [...formData.currentNameHanja]
                newHanjas[index] = hanja
                setFormData({...formData, currentNameHanja: newHanjas})
              }}
              label="현재 이름 한자"
              required
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">성씨</label>
        <div className="space-y-3">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            placeholder="김 (한글)"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
          {formData.lastName && (
            <HanjaSelector
              reading={formData.lastName}
              selectedHanja={formData.lastNameHanja || undefined}
              onSelect={(hanja) => setFormData({...formData, lastNameHanja: hanja})}
              placeholder="성씨 한자 선택"
              mode="surname"
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
            <span className="ml-2">남성</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="F"
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              required
            />
            <span className="ml-2">여성</span>
          </label>
        </div>
      </div>

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

      <div>
        <label className="block text-sm font-medium mb-2">개명 이유</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          value={formData.renamingReason}
          onChange={(e) => setFormData({...formData, renamingReason: e.target.value})}
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

      <div>
        <label className="block text-sm font-medium mb-2">원하는 의미</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          value={formData.desiredMeaning}
          onChange={(e) => setFormData({...formData, desiredMeaning: e.target.value})}
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

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
        <RefreshCw className="w-4 h-4 mr-2" />
        개명 분석 시작하기
      </Button>
    </form>
  )
}

// 현재 이름 운세 분석 컴포넌트
function CurrentNameAnalysis({ data, onComplete }: { data: RenamingFormData, onComplete: (analysisId: string) => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // API 호출하여 현재 이름 분석
  useEffect(() => {
    const analyzeCurrentName = async () => {
      try {
        setIsAnalyzing(true)
        setError(null)

        // 현재 이름 한글 추출 (성씨 제거)
        // currentName이 "철수"처럼 이름만 있거나 "김철수"처럼 성+이름일 수 있음
        let firstNameStr = data.currentName
        if (firstNameStr.startsWith(data.lastName)) {
          firstNameStr = firstNameStr.substring(data.lastName.length)
        }
        const firstName = firstNameStr.split('')

        // 음력/양력 변환
        const isLunar = data.calendarType === 'lunar'

        // 생년월일 포맷 (YYYY-MM-DD)
        const birthDate = data.birthDate
          ? new Date(data.birthDate).toISOString().split('T')[0]
          : ''

        // API 요청
        const response = await fetch('/api/renaming/analyze-current', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate,
            birthTime: data.birthTime,
            isLunar,
            currentName: {
              lastName: data.lastName,
              firstName: firstName
            },
            gender: data.gender === 'M' ? 'male' : 'female'
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || '분석 중 오류가 발생했습니다')
        }

        const result = await response.json()

        if (result.success) {
          // 오행 카운트를 한글로 변환
          const elementCounts = {
            목: result.data.saju.elementCounts.WOOD || 0,
            화: result.data.saju.elementCounts.FIRE || 0,
            토: result.data.saju.elementCounts.EARTH || 0,
            금: result.data.saju.elementCounts.METAL || 0,
            수: result.data.saju.elementCounts.WATER || 0
          }

          setAnalysisData({
            analysisId: result.data.analysisId,
            currentScore: Math.round(result.data.currentScore),
            elements: elementCounts,
            problems: result.data.problems,
            predictions: result.data.predictions
          })

          toast({
            title: "분석 완료",
            description: "현재 이름의 운세 분석이 완료되었습니다.",
          })
        }
      } catch (err) {
        console.error('Analysis error:', err)
        setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다')
        toast({
          title: "오류 발생",
          description: err instanceof Error ? err.message : '분석 중 오류가 발생했습니다',
          variant: "destructive"
        })
      } finally {
        setIsAnalyzing(false)
      }
    }

    analyzeCurrentName()
  }, [data, toast])

  return (
    <div className="max-w-2xl mx-auto">
      {isAnalyzing ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold">현재 이름 운세 분석 중...</h3>
          <p className="text-gray-600 mt-2">'{data.currentName}'의 오행과 획수를 분석하고 있습니다</p>
        </motion.div>
      ) : error ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-red-600 mb-4">분석 오류</h3>
              <p className="text-gray-700 mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                다시 시도하기
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : analysisData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-center">'{data.currentName}' 운세 분석</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                종합 운세 점수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-500 mb-2">{analysisData.currentScore}점</div>
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

          <Card>
            <CardHeader>
              <CardTitle>분야별 운세</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: '사업/직장운', value: analysisData.predictions.career },
                { label: '건강운', value: analysisData.predictions.health },
                { label: '인간관계운', value: analysisData.predictions.relationships },
                { label: '재물운', value: analysisData.predictions.wealth }
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
              onClick={() => onComplete(analysisData.analysisId)}
              className="bg-orange-500 hover:bg-orange-600 px-12"
            >
              개명 제안 확인하기
              <TrendingUp className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

// 개명 제안 결과 컴포넌트
function RenamingResults({ data, analysisId, onPayment, onSkip }: { data: RenamingFormData, analysisId: string, onPayment: () => void, onSkip: () => void }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [currentScore, setCurrentScore] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // API 호출하여 개명 제안 받기
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 분석 데이터 조회하여 currentScore 가져오기
        const analysisResponse = await fetch(`/api/renaming/analysis/${analysisId}`)
        let analysisData = null
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json()
          if (analysisResult.success) {
            analysisData = analysisResult.data
            setCurrentScore(Math.round(analysisData.currentScore))
          }
        }

        // 생년월일 포맷 (YYYY-MM-DD)
        const birthDate = data.birthDate
          ? new Date(data.birthDate).toISOString().split('T')[0]
          : ''

        // 음력/양력 변환
        const isLunar = data.calendarType === 'lunar'

        // 부정적 의미의 한자 블랙리스트 (개명에 부적합)
        const badCharacters = [
          '衝', '沖', '病', '死', '亡', '敗', '窮', '困', '苦', '哀',
          '愁', '悲', '憂', '怒', '恨', '殺', '傷', '害', '災', '禍',
          '厄', '凶', '惡', '賤', '貧', '疾', '痛', '弱', '破', '敗'
        ]

        // API 요청 - 기존 /api/naming/recommend 사용
        const response = await fetch('/api/naming/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthData: {
              birthDate,
              birthTime: data.birthTime,
              isLunar,
              gender: data.gender === 'M' ? 'male' : 'female'
            },
            lastName: data.lastName,
            preferences: {
              minScore: 80, // 개명은 높은 점수만 (75 → 80)
              maxResults: 10, // 더 많은 후보 생성 (5 → 10)
              gender: data.gender === 'M' ? 'male' : 'female',
              avoidCharacters: badCharacters // 부정적 한자 제외
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || '개명 제안을 가져오는 중 오류가 발생했습니다')
        }

        const result = await response.json()

        if (result.success) {
          // 결과 데이터 변환
          const transformedNames = result.data.candidates.slice(0, 5).map((candidate: {
            firstName: string[]
            characters: Array<{ character: string; meaning: string | null }>
            scores: { overall: number }
          }) => {
            const firstName = candidate.firstName.join('')
            const firstHanja = candidate.characters[0].character
            const secondHanja = candidate.characters[1].character
            const fullName = data.lastName + firstName
            const fullHanja = data.lastName + firstHanja + secondHanja
            const score = Math.round(candidate.scores.overall)
            const improvement = currentScore > 0 ? `+${score - currentScore}` : `${score}`

            // 의미 조합
            const meaning = `${candidate.characters[0].meaning || ''} ${candidate.characters[1].meaning || ''}`.trim()

            return {
              name: fullName,
              hanja: fullHanja,
              meaning: meaning || '좋은 의미의 이름',
              score,
              improvement,
              details: candidate
            }
          })

          setRecommendations(transformedNames)

          toast({
            title: "개명 제안 완료",
            description: `${transformedNames.length}개의 이름을 추천합니다.`,
          })
        }
      } catch (err) {
        console.error('Recommendation error:', err)
        setError(err instanceof Error ? err.message : '개명 제안을 가져오는 중 오류가 발생했습니다')
        toast({
          title: "오류 발생",
          description: err instanceof Error ? err.message : '개명 제안을 가져오는 중 오류가 발생했습니다',
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [analysisId, data, toast])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold">개명 제안 생성 중...</h3>
          <p className="text-gray-600 mt-2">사주에 맞는 최적의 이름을 찾고 있습니다</p>
        </motion.div>
      </div>
    )
  }

  // 에러 발생
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-red-600 mb-4">개명 제안 오류</h3>
            <p className="text-gray-700 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              다시 시도하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 성공 - 실제 추천 결과 표시
  const names = recommendations.length > 0 ? recommendations : []

  // 추천 결과가 없는 경우
  if (names.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-yellow-600 mb-4">추천 이름이 없습니다</h3>
            <p className="text-gray-700 mb-6">
              현재 조건에 맞는 이름을 찾을 수 없습니다. 전문가 상담을 받아보세요.
            </p>
            <Button
              onClick={onSkip}
              className="bg-orange-500 hover:bg-orange-600"
            >
              전문가 상담받기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">개명 제안 결과</h2>

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
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-2xl font-bold">{item.name}</h3>
                      <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {item.improvement}점 개선
                      </span>
                    </div>
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
          <h3 className="text-2xl font-bold mb-4">상세 개명 분석 보고서</h3>
          <p className="text-gray-600 mb-4">
            각 이름의 운세 변화 예측, 법적 개명 절차, 개명 후 주의사항을 확인하세요
          </p>
          <div className="mb-6">
            <p className="text-sm text-gray-500 line-through">정가 150,000원</p>
            <p className="text-4xl font-bold text-orange-500">120,000원</p>
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

// 개명 전문가 제안 컴포넌트
function RenamingExpertProposals() {
  const experts = [
    {
      id: 1,
      name: "김영철 선생님",
      experience: "30년",
      rating: 4.9,
      reviews: 523,
      price: 200000,
      speciality: "개명 전문",
      message: "현재 이름의 문제점을 정확히 파악했습니다. 법적 절차까지 도와드리겠습니다."
    },
    {
      id: 2,
      name: "이정희 선생님",
      experience: "25년",
      rating: 4.8,
      reviews: 412,
      price: 180000,
      speciality: "운세 개선",
      message: "개명 후 운세 변화를 단계별로 분석하여 최적의 타이밍을 제안해드립니다."
    },
    {
      id: 3,
      name: "박민수 선생님",
      experience: "20년",
      rating: 4.7,
      reviews: 389,
      price: 150000,
      speciality: "사주명리",
      message: "개명 이유에 맞는 맞춤형 이름으로 인생의 전환점을 만들어드립니다."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">개명 전문가 제안</h2>
        <p className="text-gray-600">
          개명 전문가들이 맞춤 분석과 개별 견적을 제안했습니다
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

export default function Renaming() {
  const [step, setStep] = useState<'input' | 'analysis' | 'result' | 'experts'>('input')
  const [formData, setFormData] = useState<RenamingFormData | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)

  const handleFormSubmit = (data: RenamingFormData) => {
    setFormData(data)
    setStep('analysis')
  }

  const handleAnalysisComplete = (id: string) => {
    setAnalysisId(id)
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
            {['정보입력', '현재분석', '개명제안', '전문가제안'].map((label, index) => (
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
              개명 서비스
            </h1>
            <RenamingInfoForm onSubmit={handleFormSubmit} />
          </motion.div>
        )}

        {step === 'analysis' && (
          <CurrentNameAnalysis data={formData} onComplete={handleAnalysisComplete} />
        )}

        {step === 'result' && analysisId && (
          <RenamingResults data={formData} analysisId={analysisId} onPayment={handlePayment} onSkip={handleSkip} />
        )}

        {step === 'experts' && (
          <RenamingExpertProposals />
        )}
      </div>
    </div>
  )
}