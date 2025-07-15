"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { PricingCards } from "./PricingCards"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar, MessageSquare, Shield, Award } from "lucide-react"

export function ExpertConsultation() {
  const [selectedTier, setSelectedTier] = useState<any>(null)

  return (
    <div className="space-y-12">
      {/* 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold">전문가 작명 서비스</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          30년 경력의 작명 전문가가 직접 상담하는 프리미엄 서비스
        </p>
      </motion.div>

      {/* 서비스 특징 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            icon: Calendar,
            title: "예약 상담",
            description: "원하는 시간에 상담 가능"
          },
          {
            icon: MessageSquare,
            title: "1:1 맞춤 상담",
            description: "개인별 심층 분석"
          },
          {
            icon: Shield,
            title: "작명 보증",
            description: "만족할 때까지 수정"
          },
          {
            icon: Award,
            title: "공인 증서",
            description: "작명 보증서 발급"
          }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="text-center h-full">
              <CardHeader>
                <feature.icon className="w-10 h-10 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 가격 선택 */}
      <PricingCards onSelect={setSelectedTier} />

      {/* 선택된 서비스 정보 */}
      {selectedTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>선택하신 서비스: {selectedTier.name}</CardTitle>
              <CardDescription>
                결제 금액: ₩{selectedTier.price.toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                결제하고 상담 예약하기
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}