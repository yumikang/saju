# Purple Premium Redesign - Code Examples

**Reference**: Visual examples and code snippets for implementation
**Purpose**: Copy-paste ready code for rapid development

---

## Color Palette Constants

Create this file for consistent color usage:

```typescript
// app/lib/design/purple-premium-colors.ts

/**
 * Purple Premium Design System
 * Section-based color strategy for freemium UI
 */

export const PURPLE_PREMIUM = {
  // Gradient backgrounds
  gradient: {
    base: 'bg-gradient-to-br from-purple-900/95 via-purple-700/90 to-purple-500/95',
    light: 'bg-gradient-to-br from-purple-500/90 via-violet-600/85 to-indigo-700/90',
    overlay: 'bg-gradient-to-r from-purple-300/20 via-white/10 to-purple-300/20',
  },

  // Glassmorphism effects
  glass: {
    light: {
      backdrop: 'backdrop-blur-sm',
      bg: 'bg-white/10',
      border: 'border-white/10',
    },
    medium: {
      backdrop: 'backdrop-blur-md',
      bg: 'bg-white/15',
      border: 'border-white/20',
    },
    strong: {
      backdrop: 'backdrop-blur-lg',
      bg: 'bg-white/25',
      border: 'border-white/30',
    },
  },

  // Text colors
  text: {
    primary: 'text-white',
    secondary: 'text-purple-100',
    muted: 'text-purple-200/70',
    accent: 'text-purple-300',
  },

  // UI elements
  ui: {
    border: 'border-white/20',
    borderHover: 'hover:border-white/40',
    shadow: 'shadow-2xl shadow-purple-900/20',
    shadowHover: 'hover:shadow-purple-500/30',
  },
} as const;

export const ORANGE_BRIDGE = {
  // Brand accent colors
  accent: {
    text: 'text-orange-400',
    textHover: 'hover:text-orange-300',
    bg: 'bg-orange-400',
    bgHover: 'hover:bg-orange-500',
  },

  // Border accents
  border: {
    base: 'border-orange-300',
    hover: 'hover:border-orange-400',
    gradient: 'border-orange-300/50',
  },

  // Icon colors
  icon: {
    base: 'text-orange-500',
    light: 'text-orange-400',
    dark: 'text-orange-600',
  },

  // CTA buttons
  cta: {
    gradient: 'bg-gradient-to-r from-orange-500 to-purple-600',
    gradientHover: 'hover:from-orange-600 hover:to-purple-700',
    text: 'text-white',
  },

  // Gradients (purple to orange)
  gradient: {
    toOrange: 'bg-gradient-to-r from-purple-500 via-orange-400 to-orange-500',
    toPurple: 'bg-gradient-to-r from-orange-500 via-orange-400 to-purple-500',
  },
} as const;

// Utility function to combine classes
export function premiumClasses(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
```

---

## Tailwind Config Extension

Minimal additions to `tailwind.config.js`:

```javascript
// tailwind.config.js

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Existing shadcn colors remain...
      colors: {
        // Add ONLY purple premium utilities
        'premium-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',  // primary
          600: '#9333ea',  // secondary
          700: '#7e22ce',  // accent
          800: '#6b21a8',
          900: '#581c87',  // gradient base
        },
      },

      // Custom gradient utilities
      backgroundImage: {
        'premium-gradient': 'linear-gradient(135deg, rgba(88,28,135,0.95) 0%, rgba(126,34,206,0.9) 50%, rgba(168,85,247,0.95) 100%)',
        'premium-glass': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
        'orange-purple': 'linear-gradient(90deg, rgba(251,146,60,1) 0%, rgba(147,51,234,1) 100%)',
      },

      // Animation utilities
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      // Backdrop blur utilities (ensure support)
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}
```

---

## Component 1: PremiumWrapper

```typescript
// app/components/naming/freemium-v2/PremiumWrapper.tsx

import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { PURPLE_PREMIUM } from '~/lib/design/purple-premium-colors';

export interface PremiumWrapperProps {
  children: React.ReactNode;
  className?: string;
  showGradientAnimation?: boolean;
  variant?: 'default' | 'compact';
}

/**
 * PremiumWrapper - Purple gradient section wrapper
 *
 * Wraps content in luxury purple gradient with glassmorphism effect.
 * Use this for the entire name results section (ranks 1-12).
 *
 * @example
 * <PremiumWrapper>
 *   <YourNameCards />
 * </PremiumWrapper>
 */
export function PremiumWrapper({
  children,
  className,
  showGradientAnimation = true,
  variant = 'default',
}: PremiumWrapperProps) {
  const padding = variant === 'compact' ? 'p-4 sm:p-6' : 'p-6 sm:p-8 lg:p-10';

  return (
    <div
      className={cn(
        // Purple gradient base
        'relative',
        PURPLE_PREMIUM.gradient.base,
        'bg-[length:200%_200%]',

        // Border and shadow
        PURPLE_PREMIUM.ui.border,
        PURPLE_PREMIUM.ui.shadow,

        // Spacing
        padding,

        // Rounded corners
        'rounded-2xl',

        // Animation prep
        showGradientAnimation && 'animate-gradient-shift',

        className
      )}
      data-testid="premium-wrapper"
      data-variant={variant}
    >
      {/* Glassmorphism overlay (optional animated) */}
      {showGradientAnimation && (
        <div
          className={cn(
            'absolute inset-0',
            'bg-premium-glass',
            'opacity-0 hover:opacity-100',
            'transition-opacity duration-500',
            'rounded-2xl',
            'pointer-events-none'
          )}
        />
      )}

      {/* Content container */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Subtle top glow effect */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
```

---

## Component 2: GlassCard

```typescript
// app/components/naming/freemium-v2/GlassCard.tsx

import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { PURPLE_PREMIUM, ORANGE_BRIDGE } from '~/lib/design/purple-premium-colors';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'free' | 'locked' | 'cta';
  blurIntensity?: 'light' | 'medium' | 'strong';
  withOrangeBorder?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * GlassCard - Reusable glassmorphism card
 *
 * Base card component with blur effects and purple/orange theming.
 *
 * @example
 * <GlassCard variant="locked" withOrangeBorder onClick={handleClick}>
 *   <LockedContent />
 * </GlassCard>
 */
export function GlassCard({
  children,
  variant = 'locked',
  blurIntensity = 'medium',
  withOrangeBorder = false,
  onClick,
  isLoading = false,
  className,
}: GlassCardProps) {
  const glass = PURPLE_PREMIUM.glass[blurIntensity];

  const borderClasses = withOrangeBorder
    ? cn(ORANGE_BRIDGE.border.base, ORANGE_BRIDGE.border.hover, 'border-2')
    : cn(PURPLE_PREMIUM.ui.border, PURPLE_PREMIUM.ui.borderHover, 'border');

  return (
    <motion.div
      className={cn(
        // Glass base
        'relative',
        glass.bg,
        glass.backdrop,

        // Border
        borderClasses,

        // Shadows
        PURPLE_PREMIUM.ui.shadow,

        // Hover effects
        'transition-all duration-200',
        onClick && [
          'cursor-pointer',
          PURPLE_PREMIUM.ui.shadowHover,
        ],

        // Rounded
        'rounded-xl overflow-hidden',

        className
      )}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      data-variant={variant}
      data-testid="glass-card"
    >
      {/* Inner glow effect */}
      <div className={cn(
        'absolute inset-0',
        glass.border,
        'border rounded-xl',
        'pointer-events-none'
      )} />

      {/* Content */}
      <div className="relative p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}
```

---

## Component 3: OrangeBridge

```typescript
// app/components/naming/freemium-v2/OrangeBridge.tsx

import { motion } from 'framer-motion';
import { Sparkles, Flame, Star, LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import { ORANGE_BRIDGE } from '~/lib/design/purple-premium-colors';

export interface OrangeBridgeProps {
  label?: string;
  icon?: 'sparkles' | 'flame' | 'star';
  direction?: 'horizontal' | 'vertical';
  animated?: boolean;
  className?: string;
}

/**
 * OrangeBridge - Brand continuity separator
 *
 * Decorative bridge component that transitions from purple to orange,
 * maintaining brand identity within the purple premium zone.
 *
 * @example
 * <OrangeBridge label="프리미엄 영역" icon="sparkles" />
 */
export function OrangeBridge({
  label,
  icon = 'sparkles',
  direction = 'horizontal',
  animated = true,
  className,
}: OrangeBridgeProps) {
  const icons: Record<string, LucideIcon> = {
    sparkles: Sparkles,
    flame: Flame,
    star: Star,
  };
  const Icon = icons[icon];

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={cn(
        'flex items-center gap-3 my-6',
        !isHorizontal && 'flex-col',
        className
      )}
      data-testid="orange-bridge"
    >
      {/* Left/Top gradient line */}
      <div
        className={cn(
          'flex-1',
          isHorizontal ? 'h-[2px]' : 'w-[2px] h-12',
          ORANGE_BRIDGE.gradient.toOrange
        )}
      />

      {/* Center icon/label */}
      {(label || icon) && (
        <motion.div
          className={cn(
            'flex items-center gap-2',
            'px-4 py-2',
            'bg-orange-100/90 backdrop-blur-sm',
            'border-2',
            ORANGE_BRIDGE.border.base,
            'rounded-full',
            'shadow-lg shadow-orange-500/20'
          )}
          animate={
            animated
              ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 10px 25px rgba(251, 146, 60, 0.2)',
                    '0 15px 35px rgba(251, 146, 60, 0.4)',
                    '0 10px 25px rgba(251, 146, 60, 0.2)',
                  ],
                }
              : undefined
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'easeInOut',
          }}
        >
          <Icon className={cn('w-4 h-4', ORANGE_BRIDGE.icon.base)} />
          {label && (
            <span className="text-sm font-medium text-orange-700">
              {label}
            </span>
          )}
        </motion.div>
      )}

      {/* Right/Bottom gradient line */}
      <div
        className={cn(
          'flex-1',
          isHorizontal ? 'h-[2px]' : 'w-[2px] h-12',
          ORANGE_BRIDGE.gradient.toPurple
        )}
      />
    </div>
  );
}
```

---

## Usage Example: FreeNameCard Redesign

```typescript
// app/components/naming/freemium-v2/FreeNameCard.tsx

import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { GlassCard } from './GlassCard';
import { cn } from '~/lib/utils';
import { PURPLE_PREMIUM, ORANGE_BRIDGE } from '~/lib/design/purple-premium-colors';
import type { ScoredCandidate } from '~/lib/naming/types';

export interface FreeNameCardProps {
  candidate: ScoredCandidate;
  rank: 11 | 12;
  onCharacterClick?: (characterId: number) => void;
  onUpgradeClick?: () => void;
}

export function FreeNameCard({
  candidate,
  rank,
  onCharacterClick,
  onUpgradeClick,
}: FreeNameCardProps) {
  const { firstName, characters, scores } = candidate;
  const fullName = firstName.join('');
  const animationDelay = (rank - 11) * 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: animationDelay,
        ease: 'easeOut',
      }}
    >
      <GlassCard
        variant="free"
        blurIntensity="medium"
        withOrangeBorder
        className="hover:scale-102"
      >
        {/* Header: Rank + Free badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Rank badge - orange border */}
            <Badge
              variant="outline"
              className={cn(
                ORANGE_BRIDGE.border.base,
                PURPLE_PREMIUM.text.primary,
                'bg-white/10 backdrop-blur-sm'
              )}
            >
              {rank}등
            </Badge>

            {/* Free badge - purple background */}
            <Badge className="bg-purple-600 text-white border-0">
              <Gift className="w-3 h-3 mr-1" />
              무료 체험
            </Badge>
          </div>

          {/* Quality indicator */}
          {scores.overall >= 80 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: animationDelay + 0.3 }}
            >
              <Sparkles className={cn('w-5 h-5', ORANGE_BRIDGE.icon.base)} />
            </motion.div>
          )}
        </div>

        {/* Name display */}
        <div className="mb-4">
          <h3 className={cn(
            'text-2xl sm:text-3xl font-bold mb-2',
            PURPLE_PREMIUM.text.primary
          )}>
            {fullName}
          </h3>

          {/* Characters with readings */}
          <div className={cn(
            'flex items-center gap-3 text-sm',
            PURPLE_PREMIUM.text.secondary
          )}>
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => onCharacterClick?.(char.id)}
                className={cn(
                  'flex items-center gap-1',
                  'hover:text-orange-300 transition-colors'
                )}
                type="button"
              >
                <span className="font-medium text-base">{char.character}</span>
                <span className="text-xs">({char.koreanReading})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overall score - glassmorphism panel */}
        <div className={cn(
          'mb-4 p-3 rounded-lg',
          'bg-white/10 backdrop-blur-sm',
          'border border-white/20'
        )}>
          <div className="flex items-center justify-between">
            <span className={cn('text-sm font-medium', PURPLE_PREMIUM.text.secondary)}>
              종합 점수
            </span>
            <div className="flex items-center gap-2">
              <span className={cn('text-3xl font-bold', PURPLE_PREMIUM.text.primary)}>
                {Math.round(scores.overall)}
              </span>
              <span className={cn('text-sm', PURPLE_PREMIUM.text.muted)}>
                / 100
              </span>
            </div>
          </div>
        </div>

        {/* Detailed scores grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <ScoreItem label="오행 조화" value={scores.elementHarmony.score} />
          <ScoreItem label="음양 균형" value={scores.yinYangBalance.score} />
          <ScoreItem label="수리 길흉" value={scores.numerology.score} />
          <ScoreItem label="의미 조화" value={scores.meaningHarmony.score} />
        </div>

        {/* Upgrade CTA - orange accent */}
        {onUpgradeClick && (
          <motion.button
            onClick={onUpgradeClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full py-2.5 px-4',
              ORANGE_BRIDGE.cta.gradient,
              ORANGE_BRIDGE.cta.gradientHover,
              ORANGE_BRIDGE.cta.text,
              'rounded-lg font-medium text-sm',
              'transition-all shadow-md hover:shadow-lg'
            )}
            type="button"
          >
            더 높은 점수의 프리미엄 이름 보기 →
          </motion.button>
        )}
      </GlassCard>
    </motion.div>
  );
}

// Score bar component with purple gradient
function ScoreItem({ label, value }: { label: string; value: number }) {
  const percentage = value;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className={PURPLE_PREMIUM.text.secondary}>{label}</span>
        <span className={cn('font-semibold', PURPLE_PREMIUM.text.primary)}>
          {Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-400 to-orange-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
```

---

## Usage Example: Layout Integration

```typescript
// app/components/naming/freemium-v2/FreemiumResultsLayout.tsx

import { PremiumWrapper } from './PremiumWrapper';
import { OrangeBridge } from './OrangeBridge';
import { FreeNameCard } from './FreeNameCard';
import { LockedNameCard } from './LockedNameCard';
import { FreemiumCTA } from './FreemiumCTA';
import { Gift, Lock } from 'lucide-react';
import { cn } from '~/lib/utils';
import { PURPLE_PREMIUM, ORANGE_BRIDGE } from '~/lib/design/purple-premium-colors';

export function FreemiumResultsLayout({
  tiers,
  metrics,
  // ... other props
}: FreemiumResultsLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-purple-100/30 to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header (keep orange theme - outside purple zone) */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            이름 추천 결과
          </h1>
        </header>

        {/* PURPLE PREMIUM ZONE START */}
        <PremiumWrapper showGradientAnimation>

          {/* Entry bridge */}
          <OrangeBridge
            label="프리미엄 이름 영역"
            icon="sparkles"
            animated
          />

          {/* Free Names Section (11-12위) */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className={cn(
                'text-2xl font-bold mb-2 flex items-center gap-2',
                PURPLE_PREMIUM.text.primary
              )}>
                <Gift className={ORANGE_BRIDGE.icon.base} />
                무료 체험 이름 (11-12위)
              </h2>
              <p className={PURPLE_PREMIUM.text.secondary}>
                지금 바로 확인할 수 있는 무료 샘플 이름입니다
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tiers.free.map((candidate, index) => (
                <FreeNameCard
                  key={`free-${index}`}
                  candidate={candidate}
                  rank={(11 + index) as 11 | 12}
                  onUpgradeClick={handlePaymentOpen}
                />
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <FreemiumCTA
            metrics={metrics}
            onPayment={handlePaymentOpen}
          />

          {/* Mid bridge */}
          <OrangeBridge
            label="최고 점수 이름"
            icon="star"
            animated
          />

          {/* Locked Names Section (1-10위) */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className={cn(
                'text-2xl font-bold mb-2 flex items-center gap-2',
                PURPLE_PREMIUM.text.primary
              )}>
                <Lock className={ORANGE_BRIDGE.icon.base} />
                프리미엄 이름 (1-10위)
              </h2>
              <p className={PURPLE_PREMIUM.text.secondary}>
                최고 점수부터 상위 10개 - 결제 후 잠금 해제
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tiers.locked.map((candidate, index) => (
                <LockedNameCard
                  key={`locked-${index}`}
                  candidate={candidate}
                  rank={index + 1}
                  onClick={handlePaymentOpen}
                />
              ))}
            </div>
          </section>

        </PremiumWrapper>
        {/* PURPLE PREMIUM ZONE END */}

        {/* Selection Guide (keep original blue theme - outside purple) */}
        <section className="mt-8">
          <Card className="bg-blue-50 border-blue-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-4">
              💡 이름 선택 가이드
            </h3>
            {/* ... guide content ... */}
          </Card>
        </section>

      </div>
    </div>
  );
}
```

---

## Accessibility Helpers

```typescript
// app/lib/design/accessibility.ts

/**
 * Ensure WCAG AA contrast ratio (4.5:1 for text, 3:1 for UI)
 */
export function ensureContrast(
  foreground: string,
  background: string,
  minRatio: number = 4.5
): boolean {
  // Implementation of contrast calculation
  // Use libraries like 'color' or 'chroma-js'
  return true; // Placeholder
}

/**
 * Add text shadow for enhanced readability on gradients
 */
export const READABLE_TEXT_SHADOW = {
  subtle: 'text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3)',
  medium: 'text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4)',
  strong: 'text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Respect prefers-reduced-motion
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

---

## Testing Utilities

```typescript
// app/lib/testing/purple-premium-test-utils.ts

import { render, screen } from '@testing-library/react';

/**
 * Test if purple gradient is applied
 */
export function hasPurpleGradient(element: HTMLElement): boolean {
  const styles = window.getComputedStyle(element);
  const bg = styles.backgroundImage;
  return bg.includes('purple') || bg.includes('violet') || bg.includes('indigo');
}

/**
 * Test if glassmorphism is applied
 */
export function hasGlassmorphism(element: HTMLElement): boolean {
  const styles = window.getComputedStyle(element);
  return (
    styles.backdropFilter.includes('blur') ||
    styles.webkitBackdropFilter.includes('blur')
  );
}

/**
 * Test if orange bridge is visible
 */
export function hasOrangeBridge(): boolean {
  const bridge = screen.queryByTestId('orange-bridge');
  return bridge !== null;
}

/**
 * Test contrast ratio (WCAG AA)
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  // Use color contrast library
  const ratio = level === 'AA' ? 4.5 : 7;
  // ... contrast calculation
  return true; // Placeholder
}
```

---

## Performance Optimization

```css
/* Add to global CSS for performance */

/* Optimize glassmorphism rendering */
.glass-card {
  will-change: transform, opacity;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* Optimize gradient animations */
.premium-gradient {
  background-size: 200% 200%;
  will-change: background-position;
}

/* Hardware acceleration for transforms */
.animated-element {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

/* Reduce blur on mobile for performance */
@media (max-width: 768px) {
  .backdrop-blur-lg {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}
```

---

## Browser Fallbacks

```typescript
// app/lib/design/browser-support.ts

/**
 * Check if backdrop-filter is supported
 */
export function supportsBackdropFilter(): boolean {
  if (typeof window === 'undefined') return true; // SSR

  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  );
}

/**
 * Fallback component for unsupported browsers
 */
export function GlassCardFallback({ children }: { children: React.ReactNode }) {
  const hasSupport = supportsBackdropFilter();

  if (hasSupport) {
    return <>{children}</>;
  }

  return (
    <div className="bg-purple-900/90 border border-white/30">
      {children}
    </div>
  );
}
```

---

## Quick Reference Cheat Sheet

```typescript
// Copy-paste ready class combinations

// Purple gradient background
"bg-gradient-to-br from-purple-900/95 via-purple-700/90 to-purple-500/95"

// Glassmorphism effect
"backdrop-blur-md bg-white/15 border border-white/20"

// Orange border accent
"border-2 border-orange-300 hover:border-orange-400"

// White text with shadow (readable on purple)
"text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"

// Orange CTA button
"bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"

// Score bar gradient
"bg-gradient-to-r from-purple-400 to-orange-400"

// Section header
"text-white text-2xl font-bold flex items-center gap-2"

// Orange icon accent
"text-orange-400 w-6 h-6"
```

---

**Ready to implement?** Use these code examples as templates and customize as needed!
