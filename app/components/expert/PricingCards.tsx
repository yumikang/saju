"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Check, Crown, Users, Zap, Clock } from "lucide-react"
import { cn } from "~/lib/utils"

interface PricingTier {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number
  discount: number
  features: string[]
  icon: React.ElementType
  popular?: boolean
  type: 'premium' | 'group'
  participants?: number
}

const pricingTiers: PricingTier[] = [
  {
    id: 'premium-1on1',
    name: '프리미엄 1:1 상담',
    description: '최고급 맞춤형 작명 서비스',
    price: 800000,
    originalPrice: 1000000,
    discount: 20,
    icon: Crown,
    popular: true,
    type: 'premium',
    features: [
      '전문가 1:1 맞춤 상담',
      '사주팔자 완벽 분석',
      '3개 후보 이름 제공',
      '48시간 내 결과 전달',
      '무제한 수정 요청',
      '작명 보증서 발급'
    ]
  },
  {
    id: 'group-10',
    name: '그룹 상담 (10명)',
    description: '경제적인 그룹 작명 서비스',
    price: 100000,
    originalPrice: 150000,
    discount: 33,
    icon: Users,
    type: 'group',
    participants: 10,
    features: [
      '전문가 그룹 상담',
      '기본 사주 분석',
      '1개 추천 이름',
      '72시간 내 결과',
      '1회 수정 가능'
    ]
  },
  {
    id: 'group-5',
    name: '그룹 상담 (5명)',
    description: '소규모 그룹 작명 서비스',
    price: 200000,
    originalPrice: 300000,
    discount: 33,
    icon: Users,
    type: 'group',
    participants: 5,
    features: [
      '전문가 그룹 상담',
      '상세 사주 분석',
      '2개 추천 이름',
      '48시간 내 결과',
      '2회 수정 가능',
      '간단 보증서 발급'
    ]
  },
  {
    id: 'group-3',
    name: '그룹 상담 (3명)',
    description: '프리미엄 소그룹 서비스',
    price: 300000,
    originalPrice: 450000,
    discount: 33,
    icon: Users,
    type: 'group',
    participants: 3,
    features: [
      '전문가 그룹 상담',
      '심화 사주 분석',
      '3개 추천 이름',
      '36시간 내 결과',
      '3회 수정 가능',
      '상세 보증서 발급'
    ]
  }
]

interface PricingCardsProps {
  onSelect: (tier: PricingTier) => void
}

export function PricingCards({ onSelect }: PricingCardsProps) {
  return (
    <div className="space-y-8">
      {/* 타임세일 배너 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-lg p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-destructive animate-pulse" />
            <p className="font-semibold text-destructive">
              LIMITED TIME OFFER - 최대 33% 할인 진행중!
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm font-bold text-destructive"
          >
            남은 시간: 23:59:59
          </motion.div>
        </div>
      </motion.div>

      {/* 가격 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pricingTiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "relative h-full transition-all hover:scale-105",
              tier.popular && "border-primary shadow-lg"
            )}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    BEST SELLER
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4">
                  <tier.icon className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 가격 정보 */}
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground line-through">
                    ₩{tier.originalPrice.toLocaleString()}
                  </p>
                  <p className="text-3xl font-bold">
                    ₩{tier.price.toLocaleString()}
                  </p>
                  <p className="text-sm font-semibold text-destructive">
                    {tier.discount}% 할인
                  </p>
                  {tier.participants && (
                    <p className="text-xs text-muted-foreground">
                      1인당 ₩{(tier.price / tier.participants).toLocaleString()}
                    </p>
                  )}
                </div>
                
                {/* 특징 리스트 */}
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => onSelect(tier)}
                >
                  {tier.type === 'premium' ? '바로 시작하기' : '그룹 참여하기'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}