"use client"

import { motion } from "framer-motion"
import { colors } from "~/styles/themes/colors"

interface AnimatedLoaderProps {
  stage: 'analyzing' | 'calculating' | 'generating'
  progress: number
}

export function AnimatedLoader({ stage, progress }: AnimatedLoaderProps) {
  const stages = {
    analyzing: {
      title: "사주 분석 중",
      description: "생년월일시 기반 오행 분석",
      icon: "☯️"
    },
    calculating: {
      title: "획수 계산 중",
      description: "성명학적 길흉 판단",
      icon: "📊"
    },
    generating: {
      title: "이름 생성 중",
      description: "AI 기반 최적 이름 추천",
      icon: "✨"
    }
  }

  const currentStage = stages[stage]

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-8">
      {/* 중앙 로더 */}
      <div className="relative w-32 h-32">
        {/* 오행 원소들 회전 */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          {Object.entries(colors.saju).map(([element, color], index) => (
            <motion.div
              key={element}
              className="absolute w-8 h-8 rounded-full"
              style={{
                backgroundColor: color,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${index * 72}deg) translateY(-40px)`
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.3
              }}
            />
          ))}
        </motion.div>
        
        {/* 중앙 아이콘 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-6xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {currentStage.icon}
        </motion.div>
      </div>

      {/* 단계 정보 */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={stage}
      >
        <h3 className="text-2xl font-bold">{currentStage.title}</h3>
        <p className="text-muted-foreground">{currentStage.description}</p>
      </motion.div>

      {/* 진행 바 */}
      <div className="w-full max-w-md">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-center mt-2 text-sm text-muted-foreground">
          {progress}% 완료
        </p>
      </div>

      {/* 데이터 플로우 애니메이션 */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg mt-8">
        {['음양', '오행', '획수'].map((item, index) => (
          <motion.div
            key={item}
            className="bg-card p-4 rounded-lg border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.2 }}
          >
            <motion.div
              className="text-center"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
            >
              <p className="text-sm text-muted-foreground">{item}</p>
              <p className="text-lg font-bold">
                {progress > (index + 1) * 33 ? '✓' : '...'}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}