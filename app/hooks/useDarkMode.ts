import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UseDarkModeReturn {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'saju-naming-theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function useDarkMode(): UseDarkModeReturn {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  // Get system preference
  const getSystemPreference = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MEDIA_QUERY).matches;
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((isDarkMode: boolean) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDarkMode ? '#020617' : '#ffffff'
      );
    }
  }, []);

  // Calculate if dark mode should be active
  const calculateIsDark = useCallback((currentTheme: Theme): boolean => {
    if (currentTheme === 'dark') return true;
    if (currentTheme === 'light') return false;
    return getSystemPreference();
  }, [getSystemPreference]);

  // Set theme
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, newTheme);
    }
    
    // Apply theme
    const shouldBeDark = calculateIsDark(newTheme);
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, [applyTheme, calculateIsDark]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }, [theme, setTheme]);

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get saved theme or default to system
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const initialTheme = savedTheme || 'system';
    
    setThemeState(initialTheme);
    const shouldBeDark = calculateIsDark(initialTheme);
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, [applyTheme, calculateIsDark]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      applyTheme(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme, applyTheme]);

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}

// Theme toggle button component
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '~/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useDarkMode();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'system':
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return '라이트 모드';
      case 'dark':
        return '다크 모드';
      case 'system':
        return '시스템 설정';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2",
        "px-3 py-2 rounded-lg",
        "bg-background border border-border",
        "hover:bg-muted transition-colors",
        "tap-highlight-transparent",
        "focus-visible-ring",
        className
      )}
      aria-label={`현재 테마: ${getLabel()}`}
    >
      {getIcon()}
      {showLabel && (
        <span className="text-sm font-medium">{getLabel()}</span>
      )}
    </button>
  );
}

// CSS variables hook for dynamic theming
export function useThemeColors() {
  const { isDark } = useDarkMode();
  
  return {
    primary: isDark ? 'hsl(24, 95%, 53%)' : 'hsl(24, 95%, 53%)',
    background: isDark ? 'hsl(222.2, 84%, 4.9%)' : 'hsl(0, 0%, 100%)',
    foreground: isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 84%, 4.9%)',
    muted: isDark ? 'hsl(217.2, 32.6%, 17.5%)' : 'hsl(210, 40%, 96.1%)',
    border: isDark ? 'hsl(217.2, 32.6%, 17.5%)' : 'hsl(214.3, 31.8%, 91.4%)',
  };
}