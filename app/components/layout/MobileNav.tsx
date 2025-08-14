import { Link, useLocation } from '@remix-run/react';
import { Home, Baby, RefreshCw, Star, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: '홈', href: '/', icon: Home },
  { label: '작명', href: '/naming', icon: Baby },
  { label: '개명', href: '/renaming', icon: RefreshCw },
  { label: '사주', href: '/saju', icon: Star },
  { label: '내정보', href: '/dashboard', icon: User },
];

export function MobileNav() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState(location.pathname);

  // Close menu on route change
  useEffect(() => {
    if (location.pathname !== previousPath) {
      setIsMenuOpen(false);
      setPreviousPath(location.pathname);
    }
  }, [location.pathname, previousPath]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="mobile-nav">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1",
                  "py-2 px-1 rounded-lg transition-all",
                  "tap-highlight-transparent select-none-important",
                  "focus-visible-ring",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mb-1 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className="text-xs font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 h-0.5 w-12 bg-primary"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          "fixed top-4 right-4 z-50",
          "w-12 h-12 rounded-full",
          "bg-background shadow-lg",
          "flex items-center justify-center",
          "tap-highlight-transparent",
          "lg:hidden",
          "transition-transform active:scale-95"
        )}
        aria-label="Toggle menu"
      >
        <AnimatePresence mode="wait">
          {isMenuOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 w-80 max-w-[85vw]",
                "bg-background shadow-xl z-40",
                "flex flex-col",
                "lg:hidden"
              )}
            >
              {/* Menu Header */}
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">메뉴</h2>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto momentum-scrolling p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg",
                            "transition-colors tap-highlight-transparent",
                            "focus-visible-ring",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Additional Menu Items */}
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="px-4 mb-4 text-sm font-semibold text-muted-foreground">
                    추가 메뉴
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to="/settings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span>설정</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/help"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span>도움말</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/about"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span>서비스 소개</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </nav>

              {/* Menu Footer */}
              <div className="p-4 border-t border-border safe-bottom">
                <p className="text-xs text-muted-foreground text-center">
                  © 2024 사주 작명 서비스
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook to detect if user is on mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}