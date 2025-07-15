import { Link } from "@remix-run/react"
import { motion } from "framer-motion"
import { Menu, X, Sparkles } from "lucide-react"
import { useState } from "react"
import { Button } from "~/components/ui/button"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  console.log("Header component is rendering!")

  const navItems = [
    { label: "홈", href: "/" },
    { label: "신생아 작명", href: "/naming" },
    { label: "개명 서비스", href: "/renaming" },
    { label: "사주 궁합", href: "/saju" },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">사주작명</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA 버튼 */}
          <div className="hidden md:block">
            <Link to="/naming">
              <Button className="bg-orange-500 hover:bg-orange-600">
                서비스 선택
              </Button>
            </Link>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block py-2 text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/naming" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
                서비스 선택
              </Button>
            </Link>
          </motion.nav>
        )}
      </div>
    </header>
  )
}