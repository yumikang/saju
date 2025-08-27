import { NavLink } from "@remix-run/react";
import { 
  User, 
  CreditCard, 
  Package, 
  History,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/utils/cn";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    name: "프로필",
    href: "/account",
    icon: User,
    description: "개인 정보 관리"
  },
  {
    name: "결제 내역",
    href: "/account/payments",
    icon: CreditCard,
    description: "결제 및 환불 내역"
  },
  {
    name: "서비스 이용 내역",
    href: "/account/orders",
    icon: Package,
    description: "주문 및 서비스 결과"
  },
  {
    name: "작명 이력",
    href: "/naming/history",
    icon: History,
    description: "생성한 작명 결과"
  }
];

export function AccountNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 모바일 메뉴 토글 버튼 */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          aria-expanded={mobileMenuOpen}
        >
          <span className="sr-only">메뉴 열기</span>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* 데스크톱 네비게이션 사이드바 */}
      <nav className="hidden lg:block w-64 shrink-0" aria-label="계정 메뉴">
        <div className="sticky top-4">
          <h2 className="text-lg font-semibold mb-4">마이페이지</h2>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  end={item.href === "/account"}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-x-3 rounded-md p-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-700 hover:bg-gray-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive ? "text-primary-foreground" : "text-gray-400"
                        )}
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className={cn(
                            "text-xs mt-0.5",
                            isActive ? "text-primary-foreground/80" : "text-gray-500"
                          )}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 모바일 네비게이션 메뉴 */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">마이페이지</h2>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="sr-only">메뉴 닫기</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="p-4" aria-label="모바일 계정 메뉴">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      end={item.href === "/account"}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-x-3 rounded-md p-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-700 hover:bg-gray-100"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-primary-foreground" : "text-gray-400"
                            )}
                            aria-hidden="true"
                          />
                          <div className="flex-1">
                            <div>{item.name}</div>
                            {item.description && (
                              <div className={cn(
                                "text-xs mt-0.5",
                                isActive ? "text-primary-foreground/80" : "text-gray-500"
                              )}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}