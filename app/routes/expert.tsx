import { Link } from "@remix-run/react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { ArrowRight, Sparkles, Users } from "lucide-react"
import { motion } from "framer-motion"

export default function Expert() {
  return (
    <div className="bg-gradient-to-b from-orange-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h1 className="text-4xl font-bold mb-6">전문가 상담</h1>
          <p className="text-xl text-gray-600 mb-8">
            전문가들의 맞춤 견적을 받으려면<br />
            AI 퀵생성 서비스를 먼저 이용해주세요
          </p>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" />
                AI 퀵생성 서비스 이용 방법
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <p className="text-sm">AI 퀵생성으로<br />이름 생성</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <p className="text-sm">"다음에 하기"<br />버튼 선택</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <p className="text-sm">전문가 견적<br />확인 및 선택</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Users className="w-8 h-8 text-orange-500" />
                <h3 className="text-2xl font-bold">전문가 견적 시스템</h3>
              </div>
              <p className="text-gray-700 mb-6">
                AI 퀵생성 후 결제하지 않으면, 10명의 전문가가<br />
                개별 견적을 제안해드립니다 (8만원~15만원)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    30년 경력 전문가 참여
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    개별 맞춤 상담 메시지
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    평점 및 리뷰 확인 가능
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    다양한 가격대 선택
                  </li>
                </ul>
              </div>

              <Link to="/quick">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI 퀵생성 서비스 시작하기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}