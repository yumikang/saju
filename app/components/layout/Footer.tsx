import { Link } from "@remix-run/react"
import { Sparkles } from "lucide-react"

export function Footer() {
  const footerLinks = {
    서비스: [
      { label: "AI 퀵생성", href: "/quick" },
      { label: "전문가 1:1 상담", href: "/expert" },
    ],
    고객지원: [
      { label: "이용안내", href: "#" },
      { label: "자주 묻는 질문", href: "#" },
      { label: "고객센터", href: "#" },
    ],
    회사정보: [
      { label: "회사소개", href: "#" },
      { label: "이용약관", href: "#" },
      { label: "개인정보처리방침", href: "#" },
    ],
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-bold">사주작명</span>
            </div>
            <p className="text-gray-400 text-sm">
              전통 사주명리학과 AI 기술을 결합한
              <br />
              최고의 작명 서비스
            </p>
          </div>

          {/* 링크 섹션들 */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 정보 */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>사업자등록번호: 123-45-67890 | 대표: 홍길동</p>
          <p>서울특별시 강남구 테헤란로 123</p>
          <p className="mt-4">© 2025 사주작명. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}