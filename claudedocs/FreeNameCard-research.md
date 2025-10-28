# FreeNameCard Component Research

## Overview
Research for building a FreeNameCard component to display rank 11-12 name candidates (무료 tier) with emerald/green color scheme, animations, and responsive design.

---

## 1. Framer Motion - Animation Library

### Current Project Usage Patterns

Based on existing components in the codebase:

#### Animation Patterns from NameCard.tsx
```typescript
<motion.div
  data-testid="name-card"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

#### Animation Patterns from BlurredNameCard.tsx
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: rank * 0.1, duration: 0.3 }}
  whileHover={{ scale: 1.02 }}
  className="cursor-pointer"
>
```

#### Complex Animations from AnimatedLoader.tsx
```typescript
// Rotation animation
<motion.div
  className="absolute inset-0"
  animate={{ rotate: 360 }}
  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
>

// Scale + opacity animation
<motion.div
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

// Button hover animation
<motion.div
  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-4"
  whileHover={{ scale: 1.05 }}
>
```

#### Stagger Pattern from PricingCards.tsx
```typescript
// Container with staggered children
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {pricingTiers.map((tier, index) => (
    <motion.div
      key={tier.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
```

### Best Practices from Web Research

1. **Stagger Animations**: Use `staggerChildren` in parent transition object
```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}
```

2. **Hover Effects**: Use `whileHover` prop for interactive elements
```typescript
whileHover={{
  scale: 1.05,
  boxShadow: "0px 10px 30px rgba(0,0,0,0.1)"
}}
```

3. **Layout Animations**: Use `layout` prop for smooth position/size changes

### Recommended for FreeNameCard

```typescript
// Entrance animation with rank-based stagger
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.4,
    delay: (rank - 11) * 0.1  // 11th card = 0s, 12th = 0.1s
  }}
  whileHover={{
    scale: 1.02,
    boxShadow: "0px 8px 24px rgba(16, 185, 129, 0.15)" // emerald shadow
  }}
>
```

---

## 2. Remix - React Framework

### TypeScript Type Patterns from Codebase

#### Component Props Interface Pattern
```typescript
interface NameCardProps {
  candidate: ScoredCandidate;
  rank?: number;
  isFavorite?: boolean;
  onFavorite?: (candidateId: string) => void;
  onCharacterClick?: (characterId: string) => void;
  showFreeBadge?: boolean;
}
```

#### ScoredCandidate Type (from lib/naming/types.ts)
```typescript
export interface ScoredCandidate extends NameCandidate {
  scores: {
    overall: number;
    elementHarmony: DetailedScore;
    yinYangBalance: DetailedScore;
    numerology: DetailedScore;
    meaningHarmony: DetailedScore;
  };
  confidenceScore: number;
}

export interface DetailedScore {
  score: number;                  // 0-100
  weight: number;                 // 가중치
  weightedScore: number;          // score * weight
  explanation: string;            // 상세 설명
  subScores?: Record<string, number>; // 세부 점수
}
```

#### Component Export Pattern
```typescript
export function FreeNameCard({
  candidate,
  rank = 11,
  onCharacterClick,
}: FreeNameCardProps) {
  // component logic
}
```

### Best Practices from Research

1. **Strict TypeScript**: Enable strict mode in tsconfig.json
2. **Interface over Type**: Use `interface` for component props
3. **Functional Components**: Use hooks for state management
4. **Separation of Concerns**: Keep data fetching in loaders, UI in components

### Recommended Type Structure for FreeNameCard

```typescript
interface FreeNameCardProps {
  candidate: ScoredCandidate;
  rank: 11 | 12;  // Literal types for rank constraint
  onCharacterClick?: (characterId: string) => void;
  showBadge?: boolean;
  className?: string;
}
```

---

## 3. TailwindCSS - Utility CSS

### Responsive Patterns from Codebase

#### Mobile-First Grid Pattern (ResponsiveCard.tsx)
```typescript
const gridColumns = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};
```

#### Responsive Spacing Pattern
```typescript
className="p-4 sm:p-5 lg:p-6"
className="text-lg sm:text-xl"
className="h-48 sm:h-56 lg:h-64"
```

#### Green Color Scheme from NameCard.tsx
```typescript
// Border
"border-2 border-green-200 hover:border-green-400"

// Badge
"bg-green-100 text-green-800 border-green-300"
"border-green-500 text-green-700"

// Score
"text-green-600"

// Hover
"hover:text-orange-600"
```

### Emerald/Green Gradient Patterns (from Research)

#### Gradient Utilities
```typescript
// Basic gradient
"bg-gradient-to-r from-emerald-500 to-green-600"

// Multi-stop gradient
"bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200"

// With transparency
"bg-gradient-to-r from-emerald-500/90 to-green-600/80"
```

#### Responsive Gradient
```typescript
"bg-gradient-to-r md:bg-gradient-to-l hover:from-emerald-600"
```

#### Emerald Color Scale (Tailwind Default)
- emerald-50: #ecfdf5
- emerald-100: #d1fae5
- emerald-200: #a7f3d0
- emerald-300: #6ee7b7
- emerald-400: #34d399
- emerald-500: #10b981
- emerald-600: #059669
- emerald-700: #047857
- emerald-800: #065f46
- emerald-900: #064e3b

### Recommended Classes for FreeNameCard

```typescript
// Card container
"border-2 border-emerald-200 hover:border-emerald-400"
"bg-gradient-to-br from-emerald-50/30 to-white"

// Badge
"bg-emerald-100 text-emerald-800 border-emerald-300"
"bg-gradient-to-r from-emerald-500 to-green-600 text-white"

// Score display
"text-emerald-600"

// Hover states
"hover:shadow-emerald-200/50"
"hover:bg-emerald-50"
```

---

## 4. Lucide React - Icon Library

### Icons Used in Project

From existing components:
- Heart (favorite)
- Info (details)
- Lock (premium)
- TrendingUp (top rank)
- Check (features)
- Crown (premium)
- Clock (time)
- Users (group)
- ChevronRight (navigation)
- MoreVertical (menu)

### Icons for Free Tier

Recommended icons for FreeNameCard:
- **Gift** (`import { Gift } from 'lucide-react'`) - Perfect for free tier
- **Sparkles** - For highlighting special features
- **CheckCircle** - For verified/completed status
- **Award** - For achievement/quality indicator

### Usage Pattern from Codebase

```typescript
import { Gift, Sparkles, Info } from 'lucide-react';

// Icon in badge
<Badge>
  <Gift className="w-3 h-3 mr-1" />
  무료 체험
</Badge>

// Icon button
<button>
  <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
</button>
```

---

## 5. shadcn/ui - UI Component Library

### Card Component Pattern (from ui/card.tsx)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

<Card className="custom-classes">
  <CardHeader className="pb-4">
    <CardTitle className="text-3xl">
      {/* Title content */}
    </CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Main content */}
  </CardContent>
</Card>
```

### Badge Component Pattern (from ui/badge.tsx)

```typescript
import { Badge } from "~/components/ui/badge"

// Variants available
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

// Custom styling
<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
  Custom
</Badge>
```

### Class Variance Authority Pattern

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        // ... more variants
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

---

## 6. Recommended Component Structure

### File Organization
```
app/
  components/
    naming/
      FreeNameCard.tsx          # New component
      NameCard.tsx              # Existing (rank 5)
      BlurredNameCard.tsx       # Existing (ranks 1-10)
```

### Component Architecture

```typescript
/**
 * Free Name Card - 무료 공개 카드 (11-12위)
 *
 * Fully public: name, hanja, meanings, scores all visible
 * Emerald/green color scheme for "free" tier
 * Animated entrance and hover effects
 * Responsive mobile + desktop layout
 */

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { ElementBadge } from '~/components/ui/element-badge';
import { Gift, Info, Sparkles } from 'lucide-react';
import type { ScoredCandidate } from '~/lib/naming/types';

interface FreeNameCardProps {
  candidate: ScoredCandidate;
  rank: 11 | 12;
  onCharacterClick?: (characterId: string) => void;
  showBadge?: boolean;
  className?: string;
}

export function FreeNameCard({
  candidate,
  rank,
  onCharacterClick,
  showBadge = true,
  className,
}: FreeNameCardProps) {
  return (
    <motion.div
      data-testid="free-name-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: (rank - 11) * 0.1
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={className}
    >
      <Card className="
        border-2 border-emerald-200 hover:border-emerald-400
        bg-gradient-to-br from-emerald-50/30 to-white
        hover:shadow-xl hover:shadow-emerald-200/50
        transition-all duration-300
      ">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            {/* Left: Rank + Name */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {/* Rank Badge */}
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-800 border-emerald-300"
                >
                  {rank}위
                </Badge>

                {/* Free Badge */}
                {showBadge && (
                  <Badge className="
                    bg-gradient-to-r from-emerald-500 to-green-600
                    text-white border-0
                  ">
                    <Gift className="w-3 h-3 mr-1" />
                    무료 체험
                  </Badge>
                )}
              </div>

              {/* Name */}
              <CardTitle className="text-3xl mb-2 text-gray-900">
                {candidate.firstName.join('')}
              </CardTitle>

              {/* Hanja + Readings */}
              <div className="flex gap-3 text-gray-700">
                {candidate.characters.map((char, idx) => (
                  <button
                    key={idx}
                    onClick={() => onCharacterClick?.(char.id.toString())}
                    className="
                      hover:text-emerald-600 transition-colors
                      flex items-center gap-1 group
                    "
                  >
                    <span className="text-xl font-medium">{char.character}</span>
                    <span className="text-sm">({char.koreanReading})</span>
                    <Info className="
                      w-3 h-3 opacity-0 group-hover:opacity-100
                      transition-opacity
                    " />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Score */}
            <div className="flex flex-col items-end gap-2">
              <div className="
                bg-white/90 backdrop-blur-sm
                rounded-lg p-3 border-2 border-emerald-300
                shadow-md
              ">
                <div className="text-right">
                  <div className="text-4xl font-bold text-emerald-600">
                    {Math.round(candidate.scores.overall)}
                    <span className="text-lg">점</span>
                  </div>
                  <p className="text-xs text-gray-600">종합</p>
                </div>
              </div>

              {/* Quality Indicator */}
              <div className="flex items-center gap-1 text-emerald-600 text-xs">
                <Sparkles className="w-3 h-3" />
                <span>추천 이름</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreItem
              label="오행 조화"
              score={candidate.scores.elementHarmony.score}
              weight={candidate.scores.elementHarmony.weight}
            />
            <ScoreItem
              label="음양 균형"
              score={candidate.scores.yinYangBalance.score}
              weight={candidate.scores.yinYangBalance.weight}
            />
            <ScoreItem
              label="수리 길흉"
              score={candidate.scores.numerology.score}
              weight={candidate.scores.numerology.weight}
            />
            <ScoreItem
              label="의미 조화"
              score={candidate.scores.meaningHarmony.score}
              weight={candidate.scores.meaningHarmony.weight}
            />
          </div>

          {/* Element Badges */}
          <div>
            <p className="text-sm text-gray-600 mb-2">한자 오행</p>
            <div className="flex gap-2">
              {candidate.characters.map((char, idx) => (
                <ElementBadge key={idx} element={char.element} />
              ))}
            </div>
          </div>

          {/* Character Meanings */}
          <div>
            <p className="text-sm text-gray-600 mb-2">한자 뜻</p>
            <div className="space-y-1">
              {candidate.characters.map((char, idx) => (
                <p key={idx} className="text-sm text-gray-800">
                  <span className="font-semibold">{char.character}</span>
                  : {char.meaning}
                </p>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="
            flex items-center justify-between
            text-sm text-gray-600
            pt-2 border-t border-emerald-100
          ">
            <span>총 획수: {candidate.totalStrokes}획</span>
            <span>신뢰도: {Math.round(candidate.confidenceScore)}%</span>
          </div>

          {/* Free Tier CTA */}
          <div className="
            bg-gradient-to-r from-emerald-50 to-green-50
            rounded-lg p-3 text-center
          ">
            <p className="text-sm text-emerald-700 font-medium">
              이 이름이 마음에 드시나요? 상위 10개 이름도 확인해보세요!
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Score Item Subcomponent
 */
interface ScoreItemProps {
  label: string;
  score: number;
  weight: number;
}

function ScoreItem({ label, score, weight }: ScoreItemProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs text-gray-500">가중치 {weight}%</span>
      </div>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {Math.round(score)}
        <span className="text-sm">점</span>
      </div>
    </div>
  );
}
```

---

## 7. Key Differences from Other Card Types

### NameCard (Rank 5) vs FreeNameCard (Rank 11-12)

| Feature | NameCard | FreeNameCard |
|---------|----------|--------------|
| **Rank** | 5위 | 11-12위 |
| **Color Scheme** | Green | Emerald (softer green) |
| **Badge** | "무료 공개" | "무료 체험" with Gift icon |
| **Favorite** | Heart button | Not included |
| **Animation** | Basic fade-in | Rank-based stagger |
| **Gradient** | None | Subtle emerald gradient |
| **CTA** | None | Upgrade CTA at bottom |

### BlurredNameCard (Ranks 1-10) vs FreeNameCard

| Feature | BlurredNameCard | FreeNameCard |
|---------|-----------------|--------------|
| **Visibility** | Blurred content | Fully visible |
| **Color** | Yellow/Orange | Emerald/Green |
| **Purpose** | Premium preview | Free sample |
| **Click Action** | Payment modal | Character details |
| **Lock Icon** | Yes | No |

---

## 8. Responsive Design Strategy

### Breakpoints (Tailwind Default)
- **sm**: 640px (small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (small desktops)
- **xl**: 1280px (desktops)

### Mobile-First Layout
```typescript
// Card padding: mobile → tablet → desktop
"p-4 sm:p-5 lg:p-6"

// Title size: mobile → tablet → desktop
"text-2xl sm:text-3xl"

// Score grid: stack on mobile, 2-col on desktop
"grid grid-cols-1 sm:grid-cols-2 gap-3"

// Badge layout: wrap on mobile, inline on desktop
"flex flex-wrap gap-2 sm:flex-nowrap"
```

---

## 9. Animation Timing Recommendations

```typescript
// Card entrance
duration: 0.4s
delay: (rank - 11) * 0.1s  // 0s for rank 11, 0.1s for rank 12

// Hover scale
duration: 0.2s
scale: 1.02

// Border transition
transition-all duration-300

// Icon hover
transition-opacity duration-200
```

---

## 10. Color Palette Reference

### Emerald Theme for Free Tier

```css
/* Backgrounds */
bg-emerald-50/30   /* Very light, 30% opacity */
bg-emerald-50      /* Light background */
bg-emerald-100     /* Badge background */

/* Borders */
border-emerald-200 /* Default border */
border-emerald-300 /* Badge border */
border-emerald-400 /* Hover border */

/* Text */
text-emerald-600   /* Primary text (scores) */
text-emerald-700   /* Darker text */
text-emerald-800   /* Badge text */

/* Gradients */
from-emerald-500 to-green-600  /* Badge gradient */
from-emerald-50 to-green-50    /* CTA background */
from-emerald-50/30 to-white    /* Card background */

/* Shadows */
shadow-emerald-200/50  /* Hover shadow */
```

---

## 11. Testing Recommendations

### Visual Testing Points
1. ✅ Rank 11 appears first (0s delay)
2. ✅ Rank 12 appears second (0.1s delay)
3. ✅ Hover scale animation smooth
4. ✅ Emerald color scheme consistent
5. ✅ Mobile responsive (stack layout)
6. ✅ Desktop responsive (2-col grid)

### Interaction Testing
1. ✅ Character click triggers detail modal
2. ✅ Badge displays correctly
3. ✅ Score colors match thresholds
4. ✅ CTA message displays

### Accessibility
1. ✅ Proper semantic HTML
2. ✅ ARIA labels for icons
3. ✅ Keyboard navigation
4. ✅ Color contrast ratios meet WCAG AA

---

## 12. Implementation Checklist

- [ ] Create `/app/components/naming/FreeNameCard.tsx`
- [ ] Import required dependencies (framer-motion, lucide-react, ui components)
- [ ] Define TypeScript interfaces with proper types
- [ ] Implement main component with emerald color scheme
- [ ] Add entrance animation with rank-based stagger
- [ ] Add hover animation (scale + shadow)
- [ ] Implement ScoreItem subcomponent
- [ ] Add responsive classes for mobile/desktop
- [ ] Include Gift icon in badge
- [ ] Add Sparkles quality indicator
- [ ] Include upgrade CTA at bottom
- [ ] Test with rank 11 and 12 data
- [ ] Verify responsive behavior
- [ ] Check accessibility
- [ ] Write component tests

---

## References

### Project Files Analyzed
- `/app/components/naming/NameCard.tsx` - Base card pattern
- `/app/components/naming/BlurredNameCard.tsx` - Premium card pattern
- `/app/components/ui/card.tsx` - shadcn Card component
- `/app/components/ui/badge.tsx` - shadcn Badge component
- `/app/components/expert/PricingCards.tsx` - Animation patterns
- `/app/components/quick-naming/AnimatedLoader.tsx` - Complex animations
- `/app/components/mobile/ResponsiveCard.tsx` - Responsive patterns
- `/app/lib/naming/types.ts` - TypeScript type definitions
- `package.json` - Dependency versions

### External Resources
- Framer Motion: https://www.framer.com/motion/
- Remix TypeScript: https://remix.run/docs/en/main/guides/typescript
- TailwindCSS Responsive: https://tailwindcss.com/docs/responsive-design
- Lucide Icons: https://lucide.dev/
- shadcn/ui: https://ui.shadcn.com/

---

**Generated**: 2025-10-28
**Purpose**: FreeNameCard component implementation research
**Status**: ✅ Complete and ready for implementation
