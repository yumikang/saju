# 🎨 보라 프리미엄 존 구현 패턴 가이드

**작성일**: 2025-10-29
**참조**: Tailwind CSS, Framer Motion, Radix UI 공식 문서
**목적**: 즉시 사용 가능한 코드 패턴 제공

---

## 📚 목차

1. [Glassmorphism 패턴](#1-glassmorphism-패턴)
2. [Framer Motion 애니메이션](#2-framer-motion-애니메이션)
3. [접근성 패턴](#3-접근성-패턴)
4. [성능 최적화](#4-성능-최적화)
5. [브라우저 호환성](#5-브라우저-호환성)

---

## 1. Glassmorphism 패턴

### 1.1 기본 Glass Card

```tsx
// components/ui/GlassCard.tsx
import { cn } from '~/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
}

export function GlassCard({
  children,
  className,
  intensity = 'medium'
}: GlassCardProps) {
  const intensityClasses = {
    light: 'backdrop-blur-sm bg-white/5',
    medium: 'backdrop-blur-md bg-white/10',
    strong: 'backdrop-blur-lg bg-white/20',
  };

  return (
    <div className={cn(
      // Glass effect
      intensityClasses[intensity],

      // Border with gradient
      'border border-white/20',

      // Shadow
      'shadow-2xl',

      // Border radius
      'rounded-2xl',

      // Padding
      'p-6',

      // Hover effect
      'hover:bg-white/15',
      'hover:border-white/30',
      'transition-all duration-300',

      // Fallback for unsupported browsers
      'supports-[backdrop-filter]:bg-white/10',
      'bg-white/90', // Fallback background

      className
    )}>
      {children}
    </div>
  );
}
```

**사용 예시**:
```tsx
<GlassCard intensity="medium">
  <h3 className="text-white font-bold text-xl mb-4">프리미엄 이름</h3>
  <p className="text-gray-200">상세 설명...</p>
</GlassCard>
```

### 1.2 프리미엄 Glass Card (그라디언트 배경 포함)

```tsx
// components/premium/PremiumGlassCard.tsx
export function PremiumGlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      {/* Gradient glow background (보라→핑크) */}
      <div className="
        absolute -inset-0.5
        bg-gradient-to-br from-purple-500/50 via-purple-600/30 to-pink-500/50
        rounded-2xl blur-lg
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
      " />

      {/* Glass card */}
      <div className="
        relative
        backdrop-blur-md
        bg-gradient-to-br from-white/15 to-white/5
        border border-white/20
        rounded-2xl
        shadow-2xl
        p-8
        hover:shadow-purple-500/20
        transition-all duration-300
      ">
        {children}
      </div>
    </div>
  );
}
```

### 1.3 주황 악센트 Glass Card

```tsx
// Orange bridge accent pattern
export function OrangeBridgeGlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      relative
      backdrop-blur-md
      bg-gradient-to-br from-white/15 to-white/5
      border-2 border-white/20
      hover:border-orange-500/40  {/* 주황 악센트 */}
      rounded-2xl
      shadow-2xl
      p-6
      transition-all duration-300
      group
    ">
      {/* 주황 글로우 (호버 시) */}
      <div className="
        absolute -inset-0.5
        bg-gradient-to-br from-orange-500/30 to-purple-500/20
        rounded-2xl blur-md
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        -z-10
      " />

      {children}
    </div>
  );
}
```

### 1.4 Backdrop Blur 강도 참조

```typescript
// Tailwind backdrop-blur utilities
const blurIntensities = {
  none: 'backdrop-blur-none',    // 0px
  sm: 'backdrop-blur-sm',        // 4px - subtle
  md: 'backdrop-blur-md',        // 12px - recommended for cards
  lg: 'backdrop-blur-lg',        // 16px - strong effect
  xl: 'backdrop-blur-xl',        // 24px - very strong
  '2xl': 'backdrop-blur-2xl',    // 40px - extreme (performance impact!)
  '3xl': 'backdrop-blur-3xl',    // 64px - very extreme (avoid)
};

// 권장 사용:
// - 카드: md (12px)
// - 모달 오버레이: lg (16px)
// - 헤더: sm (4px)
```

---

## 2. Framer Motion 애니메이션

### 2.1 페이지 전환 (부드러운 Fade + Slide)

```tsx
// app/layout.tsx or page wrapper
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.4,
          ease: [0.075, 0.82, 0.165, 1], // Premium easing
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 2.2 카드 Stagger Animation

```tsx
// components/premium/PremiumNameList.tsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,      // 0.1초 간격으로 순차 등장
      delayChildren: 0.2,        // 0.2초 딜레이 후 시작
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.075, 0.82, 0.165, 1],
    },
  },
};

export function PremiumNameList({ names }: { names: Name[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {names.map((name) => (
        <motion.div key={name.id} variants={item}>
          <PremiumNameCard name={name} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 2.3 부드러운 호버 효과

```tsx
// Hover animation with spring physics
import { motion } from 'framer-motion';

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20,
        },
      }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
    >
      {children}
    </motion.div>
  );
}
```

### 2.4 숫자 카운터 애니메이션

```tsx
// Number counting animation
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface CounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 1.5 }: CounterProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

// Usage:
<div className="text-4xl font-bold text-purple-500">
  <AnimatedCounter value={87.5} />점
</div>
```

### 2.5 Easing Curves 참조

```typescript
// Premium easing curves for different scenarios
const easingCurves = {
  // 진입 애니메이션 (부드럽고 빠름)
  enter: [0.075, 0.82, 0.165, 1],

  // 퇴장 애니메이션 (빠르고 자연스러움)
  exit: [0.4, 0, 1, 1],

  // 양방향 전환 (균형잡힌)
  inOut: [0.87, 0, 0.13, 1],

  // 부드러운 페이드
  smooth: [0.25, 0.46, 0.45, 0.94],

  // 탄성 효과 (interactive elements)
  bounce: [0.68, -0.55, 0.265, 1.55],
};

// Duration recommendations
const durations = {
  micro: 0.1,        // 아이콘 회전, 작은 변화
  fast: 0.2,         // 버튼 hover, 포커스
  normal: 0.3,       // 카드 hover, 드롭다운
  smooth: 0.4,       // 페이지 전환, 모달
  slow: 0.6,         // 복잡한 애니메이션
  verySlow: 1.0,     // 점수 카운터, 프로그레스 바
};
```

### 2.6 Scroll-Triggered Animation

```tsx
// Intersection Observer + Framer Motion
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const [ref, inView] = useInView({
    triggerOnce: true,  // 한 번만 트리거
    threshold: 0.1,     // 10% 보일 때 트리거
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        ease: [0.075, 0.82, 0.165, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Usage:
<ScrollReveal>
  <PremiumSection />
</ScrollReveal>
```

---

## 3. 접근성 패턴

### 3.1 Focus Visible 스타일

```tsx
// components/ui/FocusableCard.tsx
export function FocusableCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      tabIndex={0}
      className="
        outline-none
        focus-visible:ring-2
        focus-visible:ring-purple-500
        focus-visible:ring-offset-2
        focus-visible:ring-offset-slate-900
        rounded-2xl
        transition-shadow duration-200
      "
    >
      {children}
    </div>
  );
}
```

### 3.2 Keyboard Navigation (Radix UI 패턴)

```tsx
// components/premium/PremiumDialog.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function PremiumDialog({
  children,
  trigger
}: {
  children: React.ReactNode;
  trigger: React.ReactNode;
}) {
  return (
    <Dialog.Root>
      {/* Trigger (Space/Enter로 열기) */}
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay (Esc로 닫기) */}
        <Dialog.Overlay className="
          fixed inset-0
          bg-black/50
          backdrop-blur-sm
          data-[state=open]:animate-in
          data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0
          data-[state=open]:fade-in-0
        " />

        {/* Content (자동 포커스 관리) */}
        <Dialog.Content className="
          fixed left-[50%] top-[50%]
          translate-x-[-50%] translate-y-[-50%]
          max-w-lg w-full
          backdrop-blur-xl
          bg-gradient-to-br from-white/20 to-white/10
          border border-white/30
          rounded-2xl
          shadow-2xl
          p-8
          focus:outline-none
          data-[state=open]:animate-in
          data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0
          data-[state=open]:fade-in-0
          data-[state=closed]:zoom-out-95
          data-[state=open]:zoom-in-95
        ">
          {/* Title (필수 - 스크린 리더용) */}
          <Dialog.Title className="text-2xl font-bold text-white mb-4">
            프리미엄 이름
          </Dialog.Title>

          {/* Description (선택 - 추가 컨텍스트) */}
          <Dialog.Description className="text-gray-200 mb-6">
            최고 점수 이름을 확인하세요
          </Dialog.Description>

          {/* Content */}
          {children}

          {/* Close button (Esc 또는 클릭으로 닫기) */}
          <Dialog.Close asChild>
            <button
              className="
                absolute top-4 right-4
                p-2 rounded-full
                bg-white/10 hover:bg-white/20
                transition-colors
                focus-visible:ring-2
                focus-visible:ring-purple-500
              "
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### 3.3 색상 대비 검증

```typescript
// utils/contrast-checker.ts
/**
 * WCAG AA 대비율 검증
 * 일반 텍스트: 4.5:1
 * 큰 텍스트(18pt+): 3:1
 */

const colorContrast = {
  // ✅ 권장 조합 (WCAG AA 통과)
  goodContrast: [
    { bg: 'slate-900', fg: 'white', ratio: 18.5 },          // 매우 좋음
    { bg: 'purple-900', fg: 'white', ratio: 11.8 },         // 좋음
    { bg: 'white', fg: 'gray-900', ratio: 21.0 },           // 매우 좋음
    { bg: 'purple-50', fg: 'purple-900', ratio: 10.2 },     // 좋음
    { bg: 'slate-900', fg: 'gray-200', ratio: 14.3 },       // 좋음
  ],

  // ❌ 피해야 할 조합 (대비 부족)
  poorContrast: [
    { bg: 'slate-900', fg: 'purple-400', ratio: 2.8 },      // 불충분
    { bg: 'white', fg: 'gray-400', ratio: 2.5 },            // 불충분
    { bg: 'purple-500', fg: 'pink-500', ratio: 1.2 },       // 매우 부족
  ],
};

// 실제 사용 예시:
// 보라 배경 (slate-900) 위 흰색 텍스트 → ✅ 18.5:1
<div className="bg-slate-900 text-white">
  높은 대비율로 읽기 쉬움
</div>

// 주황 악센트는 큰 요소에만 (border, icon)
<div className="border-2 border-orange-500">
  {/* border는 3:1 기준 적용 */}
</div>
```

### 3.4 Screen Reader 전용 텍스트

```tsx
// components/ui/VisuallyHidden.tsx
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="
      absolute
      w-[1px] h-[1px]
      p-0 m-[-1px]
      overflow-hidden
      clip-[rect(0,0,0,0)]
      whitespace-nowrap
      border-0
    ">
      {children}
    </span>
  );
}

// Usage:
<button>
  <Lock className="w-5 h-5" />
  <VisuallyHidden>프리미엄 이름 잠금 해제</VisuallyHidden>
</button>
```

---

## 4. 성능 최적화

### 4.1 Backdrop Blur 성능 팁

```tsx
// ❌ 나쁜 예: 너무 많은 blur 요소
<div className="backdrop-blur-2xl"> {/* 40px blur - 느림 */}
  <div className="backdrop-blur-xl"> {/* 중첩 blur - 매우 느림 */}
    <div className="backdrop-blur-lg"> {/* 3중 중첩 - 극도로 느림 */}
      Content
    </div>
  </div>
</div>

// ✅ 좋은 예: 적절한 blur 사용
<div className="backdrop-blur-md"> {/* 12px blur - 적당 */}
  <div className="bg-white/10"> {/* blur 없이 투명도만 */}
    <div className="bg-white/5"> {/* blur 없이 투명도만 */}
      Content
    </div>
  </div>
</div>

// Performance tips:
// 1. blur는 최상위 컨테이너에만
// 2. 12px (md) 이하 사용 권장
// 3. 페이지당 3-5개 blur 요소로 제한
// 4. will-change 사용하여 GPU 가속
```

### 4.2 GPU 가속 최적화

```tsx
// components/ui/OptimizedGlassCard.tsx
export function OptimizedGlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        backdrop-blur-md
        bg-white/10
        rounded-2xl
        p-6
        will-change-transform  {/* GPU 가속 힌트 */}
        transform-gpu          {/* GPU transform 사용 */}
      "
      style={{
        // CSS containment for better performance
        contain: 'layout style paint',
      }}
    >
      {children}
    </div>
  );
}
```

### 4.3 애니메이션 성능

```tsx
// ❌ 나쁜 예: width/height 애니메이션 (reflow 유발)
<motion.div
  animate={{ width: 300, height: 200 }}
  transition={{ duration: 0.5 }}
>

// ✅ 좋은 예: transform 사용 (GPU 가속)
<motion.div
  animate={{ scale: 1.5 }}  // transform: scale()
  transition={{ duration: 0.5 }}
>

// Performance-friendly properties:
// ✅ transform (scale, rotate, translate)
// ✅ opacity
// ❌ width, height (reflow)
// ❌ top, left (reflow)
// ❌ margin, padding (reflow)
```

### 4.4 이미지 최적화 (Next.js Image)

```tsx
import Image from 'next/image';

// 배경 이미지가 있는 glass effect
<div className="relative h-[400px]">
  {/* Background image with proper optimization */}
  <Image
    src="/images/premium-bg.jpg"
    alt=""
    fill
    priority  // Above-the-fold image
    quality={85}
    className="object-cover"
  />

  {/* Glass overlay */}
  <div className="
    absolute inset-0
    backdrop-blur-md
    bg-gradient-to-br from-purple-900/80 to-slate-900/90
  ">
    <div className="relative z-10 p-8">
      {children}
    </div>
  </div>
</div>
```

---

## 5. 브라우저 호환성

### 5.1 Backdrop Filter 지원

```typescript
// Browser support for backdrop-filter (2025):
const browserSupport = {
  chrome: '76+',    // ✅ Full support
  firefox: '103+',  // ✅ Full support
  safari: '9+',     // ✅ Full support (prefixed in older)
  edge: '79+',      // ✅ Full support
  ie: 'Never',      // ❌ Not supported
};

// Coverage: ~96% of global users (as of 2025)
```

### 5.2 Fallback 전략

```tsx
// Method 1: CSS @supports
<div className="
  bg-white/90                              {/* Fallback: solid bg */}
  supports-[backdrop-filter]:bg-white/10   {/* Modern: glass bg */}
  backdrop-blur-md
">

// Method 2: Progressive enhancement
<div className="glass-card">
  {children}
</div>

// CSS:
.glass-card {
  /* Fallback for old browsers */
  background: rgba(255, 255, 255, 0.9);

  /* Modern browsers */
  @supports (backdrop-filter: blur(12px)) {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
  }
}
```

### 5.3 Feature Detection

```tsx
// utils/feature-detection.ts
export function supportsBackdropFilter(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  );
}

// Usage in component:
import { supportsBackdropFilter } from '~/utils/feature-detection';

export function AdaptiveGlassCard({ children }: { children: React.ReactNode }) {
  const hasBackdropSupport = supportsBackdropFilter();

  return (
    <div className={cn(
      'rounded-2xl p-6',
      hasBackdropSupport
        ? 'backdrop-blur-md bg-white/10 border-white/20'
        : 'bg-white/95 border-gray-200 shadow-xl'
    )}>
      {children}
    </div>
  );
}
```

### 5.4 모바일 브라우저 최적화

```tsx
// Mobile-specific optimizations
export function MobileOptimizedGlass({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      backdrop-blur-sm  {/* Lighter blur for mobile performance */}
      md:backdrop-blur-md
      bg-white/15       {/* More opaque on mobile */}
      md:bg-white/10
      rounded-2xl
      p-6
    ">
      {children}
    </div>
  );
}

// iOS Safari specific fix
// Add to global CSS:
@supports (-webkit-backdrop-filter: blur(12px)) {
  .glass-card {
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
  }
}
```

---

## 6. 종합 구현 예시

### 6.1 완전한 프리미엄 카드

```tsx
// components/premium/CompletePremiumCard.tsx
import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface PremiumCardProps {
  name: string;
  rank: number;
  score: number;
  isLocked: boolean;
  onUnlock?: () => void;
}

export function CompletePremiumCard({
  name,
  rank,
  score,
  isLocked,
  onUnlock,
}: PremiumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.075, 0.82, 0.165, 1],
      }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div className="
        absolute -inset-0.5
        bg-gradient-to-br from-purple-500/40 via-pink-500/20 to-orange-500/30
        rounded-2xl blur-lg
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
      " />

      {/* Glass card */}
      <motion.div
        whileHover={{
          scale: 1.02,
          y: -4,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
          },
        }}
        className="
          relative
          backdrop-blur-md
          bg-gradient-to-br from-white/15 to-white/5
          border-2 border-white/20
          hover:border-orange-500/40  {/* Orange accent */}
          rounded-2xl
          shadow-2xl
          p-8
          cursor-pointer
          focus-within:ring-2
          focus-within:ring-purple-500
          focus-within:ring-offset-2
          focus-within:ring-offset-slate-900
          transition-all duration-300
        "
      >
        {/* Rank badge with orange border */}
        <div className="absolute top-4 right-4">
          <div className="
            w-12 h-12
            rounded-full
            bg-gradient-to-br from-purple-500 to-pink-500
            border-2 border-orange-500/50  {/* Orange accent */}
            flex items-center justify-center
            text-white font-bold text-lg
            shadow-lg
          ">
            {rank}
          </div>
        </div>

        {/* Crown icon (orange accent) */}
        <div className="mb-4">
          <Crown className="w-8 h-8 text-orange-500" />
        </div>

        {/* Name */}
        <h3 className="text-3xl font-bold text-white mb-2">
          {name}
        </h3>

        {/* Score */}
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-5xl font-bold text-white font-mono">
            {score}
          </span>
          <span className="text-gray-300">/ 100</span>
        </div>

        {/* CTA button */}
        {isLocked ? (
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="
                w-full
                py-3 px-6
                bg-gradient-to-r from-orange-500 to-purple-500  {/* Orange bridge */}
                hover:from-orange-600 hover:to-purple-600
                text-white font-semibold
                rounded-lg
                shadow-lg
                flex items-center justify-center gap-2
                transition-all duration-200
                focus-visible:ring-2
                focus-visible:ring-purple-500
                focus-visible:ring-offset-2
                focus-visible:ring-offset-slate-900
              ">
                <Lock className="w-5 h-5" />
                <span>잠금 해제</span>
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="
                fixed inset-0
                bg-black/50 backdrop-blur-sm
                data-[state=open]:animate-in
                data-[state=closed]:animate-out
              " />

              <Dialog.Content className="
                fixed left-[50%] top-[50%]
                translate-x-[-50%] translate-y-[-50%]
                max-w-lg w-full
                backdrop-blur-xl
                bg-gradient-to-br from-slate-900/95 to-purple-900/95
                border-2 border-white/20
                rounded-2xl
                shadow-2xl
                p-8
                focus:outline-none
              ">
                <Dialog.Title className="text-2xl font-bold text-white mb-4">
                  프리미엄 이름 잠금 해제
                </Dialog.Title>

                <Dialog.Description className="text-gray-200 mb-6">
                  최고 점수 {score}점의 이름을 확인하세요
                </Dialog.Description>

                {/* Payment content here */}
                <button
                  onClick={onUnlock}
                  className="
                    w-full py-3 px-6
                    bg-gradient-to-r from-orange-500 to-purple-500
                    hover:from-orange-600 hover:to-purple-600
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                  "
                >
                  69,000원 결제하기
                </button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ) : (
          <button className="
            w-full py-3 px-6
            bg-white/10 hover:bg-white/20
            border border-white/30
            text-white font-semibold
            rounded-lg
            transition-all duration-200
            flex items-center justify-center gap-2
          ">
            <Sparkles className="w-5 h-5" />
            <span>자세히 보기</span>
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
```

---

## 7. Quick Reference

### 7.1 색상 조합 체크리스트

```typescript
// ✅ 권장 조합
const goodCombos = {
  // 보라 배경
  purpleBg: {
    background: 'slate-900 or purple-900',
    text: 'white or gray-100',
    accent: 'orange-500 or purple-500',
    border: 'white/20 or orange-500/40',
  },

  // 주황 배경 (기존 브랜드)
  orangeBg: {
    background: 'white or orange-50',
    text: 'gray-900 or gray-800',
    accent: 'orange-500 or purple-600',
    border: 'orange-200 or gray-200',
  },
};

// ❌ 피해야 할 조합
const badCombos = [
  'purple-500 text on orange-500 bg',  // 진동 효과
  'orange-300 text on white bg',       // 대비 부족
  'purple-900 text on slate-900 bg',   // 대비 부족
];
```

### 7.2 애니메이션 타이밍

```typescript
const timing = {
  micro: '100ms',       // 아이콘 회전
  fast: '200ms',        // 버튼 hover
  normal: '300ms',      // 카드 hover
  smooth: '400-500ms',  // 페이지 전환
  slow: '600ms',        // 복잡한 애니메이션
  counter: '1500ms',    // 숫자 카운터
};
```

### 7.3 Blur 강도 가이드

```typescript
const blurGuide = {
  'backdrop-blur-sm (4px)': '헤더, 서브틀한 효과',
  'backdrop-blur-md (12px)': '카드, 권장 기본값',
  'backdrop-blur-lg (16px)': '모달 오버레이',
  'backdrop-blur-xl (24px)': '강한 효과 (성능 주의)',
};
```

---

## 8. 트러블슈팅

### 8.1 Blur가 작동하지 않을 때

```typescript
// 1. CSS supports 확인
if (!CSS.supports('backdrop-filter', 'blur(1px)')) {
  console.warn('Backdrop filter not supported');
  // Fallback to solid background
}

// 2. Tailwind config 확인
// tailwind.config.ts에 backdrop-blur 유틸리티 있는지 확인

// 3. 부모 요소 확인
// backdrop-blur는 부모에 배경이 있어야 작동
<div className="bg-gradient-to-br from-purple-900 to-slate-900">
  <div className="backdrop-blur-md bg-white/10">
    {/* 이제 blur 작동 */}
  </div>
</div>
```

### 8.2 애니메이션이 끊길 때

```typescript
// 1. GPU 가속 확인
<div className="will-change-transform transform-gpu">

// 2. Layout shift 방지
<div className="min-h-[400px]"> {/* 고정 높이 */}
  <motion.div animate={{ y: 0 }}>

// 3. Reflow 유발 속성 피하기
// ❌ animate={{ width: 300 }}
// ✅ animate={{ scale: 1.5 }}
```

### 8.3 접근성 경고 해결

```typescript
// 1. Focus indicator 누락
// ✅ focus-visible:ring-2 추가

// 2. ARIA label 누락
<button aria-label="프리미엄 이름 잠금 해제">
  <Lock />
</button>

// 3. Keyboard navigation
// Radix UI 사용 시 자동 처리
```

---

**문서 버전**: v1.0
**최종 업데이트**: 2025-10-29
**참조**: Tailwind CSS, Framer Motion, Radix UI
