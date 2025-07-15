"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "~/components/ui/button"
import { AnimatedLoader } from "./AnimatedLoader"
import { useToast } from "~/hooks/use-toast"
import { Sparkles, Zap, Clock } from "lucide-react"

interface QuickNamingFlowProps {
  onComplete: (names: string[]) => void
}

export function QuickNamingFlow({ onComplete }: QuickNamingFlowProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [stage, setStage] = useState<'analyzing' | 'calculating' | 'generating'>('analyzing')
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const startQuickNaming = () => {
    setIsProcessing(true)
    setProgress(0)
    
    // 단계별 진행 시뮬레이션
    const stages: Array<'analyzing' | 'calculating' | 'generating'> = ['analyzing', 'calculating', 'generating']
    let currentStageIndex = 0
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10
        
        // 단계 변경
        if (newProgress > 33 && currentStageIndex === 0) {
          currentStageIndex = 1
          setStage('calculating')
        } else if (newProgress > 66 && currentStageIndex === 1) {
          currentStageIndex = 2
          setStage('generating')
        }
        
        // 완료
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            const mockNames = [
              "서연우", "김하준", "이서준", "박지우", "최민준"
            ]
            onComplete(mockNames)
            toast({
              title: "이름 생성 완료!",
              description: "AI가 추천한 5개의 이름이 준비되었습니다.",
            })
          }, 500)
        }
        
        return newProgress
      })
    }, 100)
  }

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {!isProcessing ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-8"
          >
            {/* 헤더 */}
            <div className="space-y-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto" />
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI 퀵 작명 서비스
              </h2>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                3초 만에 완성되는 프리미엄 작명
              </p>
            </div>

            {/* 특징 카드 */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              {[
                { icon: Zap, title: "초고속", desc: "3초 완성" },
                { icon: Sparkles, title: "AI 분석", desc: "빅데이터 기반" },
                { icon: Clock, title: "즉시 사용", desc: "바로 확인" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-6 rounded-xl border hover:border-primary transition-colors"
                >
                  <feature.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* 가격 및 시작 버튼 */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground line-through">
                  정가 1,000,000원
                </p>
                <p className="text-4xl font-bold text-primary">
                  700,000원
                </p>
                <p className="text-sm text-destructive font-semibold">
                  30% 타임세일 진행중! ⏰
                </p>
              </div>
              
              <Button
                size="lg"
                className="text-lg px-12 py-6"
                onClick={startQuickNaming}
              >
                <Zap className="mr-2" />
                지금 바로 시작하기
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatedLoader stage={stage} progress={progress} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}