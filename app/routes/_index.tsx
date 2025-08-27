import { Link, useLoaderData } from "@remix-run/react"
import { motion } from "framer-motion"
import { Sparkles, Crown, Users, ArrowRight, Clock, Shield, Award, LogIn, User as UserIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { getOptionalUser } from "~/utils/user-session.server"
import { db } from "~/utils/db.server"

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const sessionUser = await getOptionalUser(request)
    
    // If we have a session user, get the full user data from DB
    let user = null
    if (sessionUser && typeof sessionUser.userId === 'string') {
      user = await db.user.findUnique({
        where: { id: sessionUser.userId },
        select: {
          id: true,
          email: true,
          name: true,
        }
      })
    }
    
    return json({ user })
  } catch (error) {
    console.error('Error in index loader:', error)
    return json({ user: null })
  }
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>()
  const services = [
    {
      id: 'naming',
      title: '신생아 작명',
      description: '출산 예정 또는 신생아 부모를 위한 전문 작명',
      price: '70,000',
      originalPrice: '100,000',
      discount: '30%',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-500',
      features: ['AI 빅데이터 분석', '5개 이름 추천', '전문가 검토'],
      href: '/naming'
    },
    {
      id: 'renaming',
      title: '개명 서비스',
      description: '운세 개선을 위한 개명 상담',
      price: '120,000',
      originalPrice: '150,000',
      discount: '20%',
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      features: ['현재 운세 분석', '개명 효과 예측', '법적 절차 안내'],
      href: '/renaming'
    },
    {
      id: 'saju',
      title: '사주 궁합',
      description: '예비 부부, 커플 사주 궁합 분석',
      price: '80,000',
      originalPrice: '100,000',
      discount: '20%',
      icon: Users,
      color: 'from-pink-500 to-rose-500',
      features: ['궁합 분석', '결혼 운세', '개명 제안'],
      href: '/saju'
    }
  ]

  return (
    <div className="bg-gradient-to-b from-orange-50 to-orange-100">
      {/* 네비게이션 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-orange-500">사주명리</h1>
            </Link>
            
            {/* 네비게이션 메뉴 - 빈 상태로 유지 */}
            <nav className="flex items-center gap-4">
              {/* 메뉴 제거 */}
            </nav>
          </div>
        </div>
      </header>

      {/* 헤더 섹션 */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            사주로 찾는 완벽한 이름
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            신생아 작명부터 개명, 사주 궁합까지<br />
            전문가의 사주 분석으로 최적의 이름을 찾아보세요
          </p>
          
          {!user ? (
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600 flex items-center gap-2 mx-auto">
                <LogIn className="w-5 h-5" />
                로그인
              </Button>
            </Link>
          ) : (
            <Link to="/naming">
              <Button size="lg" className="text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600">
                서비스 선택하기
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* 특징 카드 섹션 */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Crown,
              title: '정확한 사주 분석',
              description: '생년월일시 바탕으로 천간지지와 오행을 정확하게 계산합니다'
            },
            {
              icon: Sparkles,
              title: '종합한 한자 데이터',
              description: '획수, 음수, 오행이 분류된 수천 개의 한자 데이터베이스'
            },
            {
              icon: Shield,
              title: '맞춤형 추천',
              description: '부모님이 원하는 가치관을 반영한 최적의 이름을 추천합니다'
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <feature.icon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 작명 과정 섹션 */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">작명 과정</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '1', title: '생년월일시 입력', desc: '아이의 출생 정보 입력' },
              { number: '2', title: '사주 분석', desc: '오행 분포와 음신 파악' },
              { number: '3', title: '가치관 선택', desc: '중요하게 생각하는 가치 선택' },
              { number: '4', title: '이름 추천', desc: '맞춤형 이름 목록 제공' }
            ].map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 서비스 카드 섹션 */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">서비스 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all hover:scale-105 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${service.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <service.icon className="w-12 h-12 text-orange-500" />
                    <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                      {service.discount} OFF
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 가격 정보 */}
                  <div>
                    <p className="text-sm text-gray-500 line-through">
                      ₩{service.originalPrice}
                    </p>
                    <p className="text-3xl font-bold text-orange-500">
                      ₩{service.price}
                      {service.id === 'group' && <span className="text-base font-normal">부터</span>}
                    </p>
                  </div>
                  
                  {/* 특징 리스트 */}
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA 버튼 */}
                  <Link to={service.href}>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      자세히 보기
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 타임세일 배너 */}
      <section className="bg-orange-500 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-2xl font-bold flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 animate-pulse" />
              LIMITED TIME OFFER - 최대 33% 할인 진행중!
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}