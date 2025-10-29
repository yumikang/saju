# UI 리뉴얼 디자인 스펙 (Modern/Minimal - Purple Gradient)

**작성일**: 2025-10-29
**참고**: afterdoc.ai (모던/미니멀)
**목표**: AI 티 제거 + 보라색 그라디언트 + 애니메이션 강화

---

## 🎨 1. 색상 시스템 (Purple Gradient)

### 1.1 Primary Colors (보라색 계열)

```typescript
// Tailwind CSS 확장 색상
colors: {
  // Primary Purple Gradient
  'primary': {
    50:  '#faf5ff',  // 매우 연한 라벤더
    100: '#f3e8ff',  // 연한 라벤더
    200: '#e9d5ff',  // 라벤더
    300: '#d8b4fe',  // 밝은 보라
    400: '#c084fc',  // 보라
    500: '#a855f7',  // 메인 보라
    600: '#9333ea',  // 진한 보라
    700: '#7e22ce',  // 더 진한 보라
    800: '#6b21a8',  // 매우 진한 보라
    900: '#581c87',  // 거의 검정 보라
  },

  // Secondary Indigo (보조색)
  'secondary': {
    50:  '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // 메인 인디고
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Accent Rose (강조색)
  'accent': {
    50:  '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',  // 핑크 강조
    600: '#db2777',
    700: '#be185d',
    800: '#9f1239',
    900: '#831843',
  }
}
```

### 1.2 Gradient Combinations

```css
/* Hero Gradient (메인 배경) */
.gradient-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* 인디고-보라 대각선 */
}

/* Card Gradient (카드 배경) */
.gradient-card {
  background: linear-gradient(to bottom right,
    rgba(168, 85, 247, 0.05) 0%,
    rgba(236, 72, 153, 0.05) 100%
  );
  /* 매우 연한 보라-핑크 */
}

/* Premium Badge Gradient */
.gradient-premium {
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  /* 보라-핑크 (프리미엄 표시) */
}

/* Free Badge Gradient */
.gradient-free {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  /* 인디고-보라 (무료 표시) */
}

/* Locked Overlay Gradient */
.gradient-locked {
  background: linear-gradient(to bottom,
    rgba(168, 85, 247, 0.8) 0%,
    rgba(126, 34, 206, 0.9) 100%
  );
  /* 잠금 오버레이 */
}

/* Subtle Background Gradient */
.gradient-bg {
  background: linear-gradient(180deg,
    #faf5ff 0%,    /* primary-50 */
    #ffffff 50%,   /* 흰색 */
    #eef2ff 100%   /* secondary-50 */
  );
  /* 페이지 배경 */
}
```

### 1.3 Glassmorphism (2025 트렌드)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(168, 85, 247, 0.1);
  box-shadow:
    0 8px 32px 0 rgba(168, 85, 247, 0.1),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
}

.glass-premium {
  background: rgba(168, 85, 247, 0.05);
  backdrop-filter: blur(40px) saturate(200%);
  border: 2px solid rgba(168, 85, 247, 0.2);
  box-shadow:
    0 12px 48px 0 rgba(168, 85, 247, 0.15),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.7);
}
```

---

## 🎯 2. 타이포그래피 시스템

### 2.1 폰트 스택

```typescript
fontFamily: {
  // Primary (한글 + 영문)
  sans: [
    'Pretendard Variable',
    'Pretendard',
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'sans-serif',
  ],

  // Display (제목용)
  display: [
    'SUIT Variable',
    'SUIT',
    'Pretendard Variable',
    'sans-serif',
  ],

  // Mono (점수 표시용)
  mono: [
    'JetBrains Mono',
    'Menlo',
    'Monaco',
    'Courier New',
    'monospace',
  ],
}
```

### 2.2 타이포그래피 스케일

```typescript
fontSize: {
  // Display (Hero 제목)
  'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],

  // Heading (섹션 제목)
  'heading-xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
  'heading-lg': ['1.875rem', { lineHeight: '1.3' }],
  'heading-md': ['1.5rem', { lineHeight: '1.4' }],
  'heading-sm': ['1.25rem', { lineHeight: '1.4' }],

  // Body (본문)
  'body-lg': ['1.125rem', { lineHeight: '1.6' }],
  'body-md': ['1rem', { lineHeight: '1.6' }],
  'body-sm': ['0.875rem', { lineHeight: '1.5' }],

  // Caption (보조 텍스트)
  'caption': ['0.75rem', { lineHeight: '1.4' }],
}
```

---

## 📦 3. 카드 디자인 시스템

### 3.1 Base Card (기본 카드)

```tsx
// Modern Card Component
<div className="
  group relative
  bg-white/70 backdrop-blur-xl
  border border-primary-100/50
  rounded-2xl
  p-6
  shadow-[0_8px_32px_rgba(168,85,247,0.08)]
  hover:shadow-[0_16px_48px_rgba(168,85,247,0.12)]
  transition-all duration-500 ease-out
  hover:-translate-y-1
">
  {/* 카드 컨텐츠 */}
</div>
```

**특징**:
- `rounded-2xl` (16px) - 부드러운 모서리
- `backdrop-blur-xl` - Glassmorphism
- `shadow-[...]` - 커스텀 보라색 그림자
- `hover:-translate-y-1` - 부드러운 호버 효과
- `transition-all duration-500` - 0.5초 부드러운 전환

### 3.2 Free Name Card (11-12위 무료)

```tsx
// FreeNameCard - 인디고-보라 테마
<div className="
  group relative overflow-hidden
  bg-gradient-to-br from-primary-50/80 to-secondary-50/80
  backdrop-blur-2xl
  border-2 border-primary-200/50
  rounded-3xl
  p-8
  shadow-[0_12px_40px_rgba(99,102,241,0.12)]
  hover:shadow-[0_20px_60px_rgba(99,102,241,0.18)]
  transition-all duration-700 ease-out
  hover:scale-[1.02]
">
  {/* Gradient Border Glow */}
  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/20 to-secondary-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-2xl" />

  {/* Free Badge */}
  <div className="absolute top-4 right-4">
    <div className="px-4 py-2 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-full text-white text-sm font-semibold shadow-lg flex items-center gap-2">
      <Gift className="w-4 h-4" />
      무료 체험
    </div>
  </div>

  {/* Content */}
</div>
```

### 3.3 Locked Premium Card (1-10위 프리미엄)

```tsx
// LockedNameCard - 보라-핑크 테마
<div className="
  group relative overflow-hidden
  bg-gradient-to-br from-white/60 to-primary-50/60
  backdrop-blur-3xl
  border-2 border-primary-300/50
  rounded-3xl
  p-8
  shadow-[0_16px_48px_rgba(168,85,247,0.15)]
  hover:shadow-[0_24px_64px_rgba(168,85,247,0.25)]
  transition-all duration-700 ease-out
  cursor-pointer
  hover:scale-[1.02]
">
  {/* Premium Glow */}
  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/30 via-accent-500/20 to-primary-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-3xl" />

  {/* Locked Overlay - Dual Layer Blur */}
  <div className="absolute inset-0 z-10">
    {/* Layer 1: Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/80 via-primary-600/85 to-accent-500/80 rounded-3xl backdrop-blur-md" />

    {/* Layer 2: Glass Pattern */}
    <div className="absolute inset-0 backdrop-blur-2xl bg-white/10 rounded-3xl" />

    {/* Lock Icon with Pulse */}
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
        }}
        className="relative"
      >
        <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl" />
        <Lock className="w-16 h-16 text-white relative z-10 drop-shadow-2xl" />
      </motion.div>
    </div>

    {/* Rank Badge */}
    <div className="absolute top-6 left-6 z-20">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-lg shadow-2xl">
        1
      </div>
    </div>
  </div>

  {/* Blurred Content (behind overlay) */}
  <div className="relative blur-sm">
    {/* 실제 이름 내용 (블러 처리됨) */}
  </div>
</div>
```

### 3.4 Premium CTA Card

```tsx
// FreemiumCTA - 매력적인 전환 카드
<div className="
  relative overflow-hidden
  bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500
  rounded-3xl
  p-10
  shadow-[0_24px_64px_rgba(168,85,247,0.3)]
">
  {/* Animated Background Pattern */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
    <motion.div
      animate={{
        backgroundPosition: ['0% 0%', '100% 100%'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%]"
    />
  </div>

  {/* Content */}
  <div className="relative z-10 text-white">
    {/* Pulsing Icon */}
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center"
    >
      <Lock className="w-10 h-10" />
    </motion.div>

    {/* Title */}
    <h3 className="text-3xl font-bold mb-4 text-center">
      최고 점수 이름은 잠겨 있습니다
    </h3>

    {/* CTA Button */}
    <button className="
      w-full py-6 px-8
      bg-white text-primary-600
      rounded-2xl
      font-bold text-lg
      shadow-[0_8px_32px_rgba(0,0,0,0.2)]
      hover:shadow-[0_12px_48px_rgba(0,0,0,0.3)]
      hover:scale-[1.02]
      transition-all duration-300
      flex items-center justify-center gap-3
    ">
      <Sparkles className="w-6 h-6" />
      1-10위 프리미엄 이름 보기
      <ArrowRight className="w-6 h-6" />
    </button>
  </div>
</div>
```

---

## ✨ 4. 애니메이션 시스템

### 4.1 Page Transitions (페이지 전환)

```typescript
// Framer Motion Variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom easing
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
```

### 4.2 Card Entrance (카드 등장)

```typescript
// Stagger Animation for Cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
```

### 4.3 Interactive Micro-animations

```typescript
// Hover Effects
const hoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
  },
  hover: {
    scale: 1.02,
    y: -8,
    boxShadow: '0 20px 60px rgba(168, 85, 247, 0.2)',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Button Press
const buttonVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// Floating Animation (Locked Icon)
const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      y: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
      rotate: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};
```

### 4.4 Score Progress Animation

```typescript
// Smooth Number Counting
import { useSpring, animated } from '@react-spring/web';

const ScoreCounter = ({ value }: { value: number }) => {
  const props = useSpring({
    number: value,
    from: { number: 0 },
    config: {
      duration: 1500,
      easing: t => t < 0.5
        ? 4 * t * t * t
        : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1, // easeInOutCubic
    },
  });

  return (
    <animated.span className="text-4xl font-bold text-primary-600 font-mono">
      {props.number.to(n => n.toFixed(0))}
    </animated.span>
  );
};

// Progress Bar Fill
const progressVariants = {
  initial: { width: '0%' },
  animate: (percentage: number) => ({
    width: `${percentage}%`,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.3,
    },
  }),
};
```

### 4.5 Gradient Animation (배경)

```css
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.gradient-animated {
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #667eea 75%,
    #764ba2 100%
  );
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}
```

---

## 🎭 5. 컴포넌트별 리디자인 상세

### 5.1 Step 1: Input Form (정보 입력)

**Before (현재)**:
- 주황색 그라디언트 배경
- 둥근 카드 디자인
- 기본 shadcn/ui 스타일

**After (리뉴얼)**:
```tsx
<div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-secondary-50">
  {/* Hero Section */}
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center mb-12 pt-16"
  >
    {/* Floating Icon */}
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="inline-block mb-6"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-3xl blur-2xl opacity-50" />
        <div className="relative bg-gradient-to-br from-primary-500 to-accent-500 p-6 rounded-3xl">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </div>
    </motion.div>

    {/* Title */}
    <h1 className="font-display text-display-lg font-bold bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 bg-clip-text text-transparent mb-4">
      AI 사주 작명
    </h1>
    <p className="text-body-lg text-gray-600">
      전문가 수준의 작명을 30초 만에
    </p>
  </motion.div>

  {/* Form Card - Glassmorphism */}
  <motion.div
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    className="max-w-2xl mx-auto px-4"
  >
    <div className="glass-card rounded-3xl p-8 sm:p-10">
      {/* Form Fields */}
    </div>
  </motion.div>
</div>
```

### 5.2 Step 2: Saju Analysis (사주 분석)

**After (리뉴얼)**:
```tsx
{/* 사주팔자 카드 - 3D Effect */}
<motion.div
  whileHover={{ rotateY: 5, rotateX: -5 }}
  transition={{ duration: 0.3 }}
  style={{ perspective: 1000 }}
  className="glass-card rounded-3xl p-6 transform-gpu"
>
  {/* 년주 */}
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative bg-gradient-to-br from-primary-100 to-primary-50 border-2 border-primary-200 rounded-2xl p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="text-4xl font-bold text-primary-900">甲</div>
        <div className="text-3xl font-bold text-primary-700 mt-2">子</div>
      </motion.div>
    </div>
  </div>
</motion.div>
```

### 5.3 Step 3: Name Results (이름 추천)

**Free Name Card (11-12위)**:
```tsx
<motion.div
  variants={cardVariants}
  whileHover="hover"
  className="group relative"
>
  {/* Card */}
  <div className="glass-card rounded-3xl p-8 border-2 border-primary-200/50 overflow-hidden">
    {/* Gradient Glow on Hover */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-primary-400/20 via-secondary-400/20 to-accent-400/20 -z-10 blur-3xl"
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />

    {/* Free Badge */}
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-full text-white text-sm font-semibold shadow-lg mb-4">
      <Gift className="w-4 h-4" />
      <span>무료 체험</span>
    </div>

    {/* Name Display */}
    <div className="flex items-baseline gap-3 mb-6">
      <span className="text-5xl font-bold bg-gradient-to-br from-primary-600 to-accent-600 bg-clip-text text-transparent">
        서연
      </span>
      <div className="flex gap-1">
        <span className="text-2xl text-primary-700">瑞</span>
        <span className="text-2xl text-primary-700">妍</span>
      </div>
    </div>

    {/* Score with Animation */}
    <div className="flex items-center gap-3 mb-6">
      <div className="text-sm text-gray-600 font-medium">종합 점수</div>
      <ScoreCounter value={87.5} />
      <div className="text-sm text-gray-500">/ 100</div>
    </div>

    {/* Progress Bars */}
    <div className="space-y-3">
      {scores.map((item, idx) => (
        <motion.div
          key={item.label}
          initial="initial"
          animate="animate"
          custom={item.value}
          variants={progressVariants}
        >
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{item.label}</span>
            <span className="text-primary-600 font-semibold">{item.value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ duration: 1, delay: idx * 0.1 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</motion.div>
```

**Locked Premium Card (1-10위)**:
```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="group relative cursor-pointer"
>
  {/* Card Container */}
  <div className="glass-premium rounded-3xl p-8 border-2 border-primary-300/50 overflow-hidden relative">
    {/* Premium Glow */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-primary-500/40 via-accent-500/30 to-primary-600/40 -z-10 blur-3xl"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
      }}
    />

    {/* Locked Overlay - Multi-layer */}
    <div className="absolute inset-0 z-10 rounded-3xl overflow-hidden">
      {/* Layer 1: Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 via-primary-700/92 to-accent-600/90" />

      {/* Layer 2: Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]" />
      </div>

      {/* Layer 3: Blur */}
      <div className="absolute inset-0 backdrop-blur-2xl bg-white/5" />

      {/* Floating Lock Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 8, -8, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-white/40 rounded-full blur-3xl scale-150" />

          {/* Icon */}
          <div className="relative bg-white/20 backdrop-blur-xl rounded-full p-6">
            <Lock className="w-16 h-16 text-white drop-shadow-2xl" />
          </div>
        </motion.div>
      </div>

      {/* Rank Badge */}
      <div className="absolute top-6 left-6 z-20">
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(236, 72, 153, 0.5)',
              '0 0 40px rgba(236, 72, 153, 0.8)',
              '0 0 20px rgba(236, 72, 153, 0.5)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 flex items-center justify-center"
        >
          <span className="text-white font-bold text-xl">1</span>
        </motion.div>
      </div>
    </div>

    {/* Content (Blurred) */}
    <div className="relative blur-md">
      {/* 실제 이름 컨텐츠 */}
    </div>
  </div>
</motion.div>
```

---

## 🎨 6. 구현 우선순위

### Phase 1: 색상 시스템 (1-2시간)
```bash
1. tailwind.config.ts 수정
   - Primary purple palette
   - Secondary indigo palette
   - Accent rose palette
   - Gradient presets

2. CSS 유틸리티 추가
   - Glassmorphism classes
   - Gradient backgrounds
   - Custom shadows
```

### Phase 2: 타이포그래피 (30분)
```bash
1. 폰트 임포트
   - Pretendard Variable
   - SUIT Variable

2. Font size scale 추가
```

### Phase 3: 카드 컴포넌트 리디자인 (3-4시간)
```bash
1. FreeNameCard 리디자인
2. LockedNameCard 리디자인
3. FreemiumCTA 리디자인
4. FreemiumPaymentModal 리디자인
```

### Phase 4: 애니메이션 강화 (2-3시간)
```bash
1. Framer Motion variants 추가
2. Number counter (react-spring)
3. Progress bar animations
4. Hover/tap interactions
5. Page transitions
```

### Phase 5: 페이지 레이아웃 (2시간)
```bash
1. Input Form 배경 그라디언트
2. Analysis 페이지 3D effects
3. Results 페이지 layout
```

**총 소요 시간**: **8-12시간**

---

## 📱 7. 반응형 디자인 (유지)

```typescript
// 현재 반응형 시스템 유지하되 강화
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}

// Gradient 크기도 반응형으로
className={cn(
  "text-3xl sm:text-4xl lg:text-5xl",
  "bg-gradient-to-br from-primary-600 to-accent-600",
  "bg-clip-text text-transparent"
)}
```

---

## 🎯 8. 최종 체크리스트

### 디자인 목표 달성도
- ✅ AI 티 제거 → Glassmorphism + 세련된 그라디언트
- ✅ 보라색 계열 → Purple-Indigo-Rose palette
- ✅ 애니메이션 강화 → Framer Motion + React Spring
- ✅ 모던/미니멀 → afterdoc.ai 스타일 반영

### 차별화 포인트
- 🎨 Glassmorphism (2025 트렌드)
- 🌈 3단계 보라색 그라디언트
- ✨ 부드러운 애니메이션 (0.5-1초 ease-out)
- 🔮 3D Hover Effects
- 💎 Premium Glow Effects

---

**다음 단계**: 실제 코드 구현 시작하시겠습니까?

1. tailwind.config.ts 수정부터 시작
2. 또는 특정 컴포넌트 (예: FreeNameCard) 먼저 리디자인

어떤 방식으로 진행하시겠습니까?
