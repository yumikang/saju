# FreeNameCard - Code Examples & Patterns

Quick reference guide with copy-paste ready code examples for building the FreeNameCard component.

---

## 1. Component Imports

```typescript
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { ElementBadge } from '~/components/ui/element-badge';
import { Gift, Info, Sparkles } from 'lucide-react';
import type { ScoredCandidate } from '~/lib/naming/types';
```

---

## 2. TypeScript Interface

```typescript
interface FreeNameCardProps {
  candidate: ScoredCandidate;
  rank: 11 | 12;  // Literal type for rank constraint
  onCharacterClick?: (characterId: string) => void;
  showBadge?: boolean;
  className?: string;
}
```

---

## 3. Animation Patterns

### Basic Card Animation (Entrance + Hover)
```typescript
<motion.div
  data-testid="free-name-card"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.4,
    delay: (rank - 11) * 0.1  // Stagger based on rank
  }}
  whileHover={{
    scale: 1.02,
    transition: { duration: 0.2 }
  }}
>
```

### Icon Hover Animation
```typescript
<Info className="
  w-3 h-3
  opacity-0 group-hover:opacity-100
  transition-opacity duration-200
" />
```

---

## 4. Color Schemes

### Emerald Card Styles
```typescript
// Card container
<Card className="
  border-2 border-emerald-200 hover:border-emerald-400
  bg-gradient-to-br from-emerald-50/30 to-white
  hover:shadow-xl hover:shadow-emerald-200/50
  transition-all duration-300
">
```

### Badge Styles

#### Rank Badge
```typescript
<Badge
  variant="secondary"
  className="bg-emerald-100 text-emerald-800 border-emerald-300"
>
  {rank}위
</Badge>
```

#### Free Tier Badge
```typescript
<Badge className="
  bg-gradient-to-r from-emerald-500 to-green-600
  text-white border-0
">
  <Gift className="w-3 h-3 mr-1" />
  무료 체험
</Badge>
```

### Score Display Box
```typescript
<div className="
  bg-white/90 backdrop-blur-sm
  rounded-lg p-3
  border-2 border-emerald-300
  shadow-md
">
  <div className="text-4xl font-bold text-emerald-600">
    {Math.round(candidate.scores.overall)}
    <span className="text-lg">점</span>
  </div>
</div>
```

---

## 5. Layout Patterns

### Header Layout (Rank + Name + Score)
```typescript
<div className="flex items-start justify-between">
  {/* Left side: Rank + Name */}
  <div className="flex-1">
    <div className="flex items-center gap-2 mb-3">
      {/* Rank and Free badges */}
    </div>
    <CardTitle className="text-3xl mb-2 text-gray-900">
      {candidate.firstName.join('')}
    </CardTitle>
    <div className="flex gap-3 text-gray-700">
      {/* Hanja characters */}
    </div>
  </div>

  {/* Right side: Score */}
  <div className="flex flex-col items-end gap-2">
    {/* Score display box */}
  </div>
</div>
```

### Responsive Score Grid
```typescript
<div className="grid grid-cols-2 gap-3">
  <ScoreItem label="오행 조화" score={85} weight={40} />
  <ScoreItem label="음양 균형" score={78} weight={20} />
  <ScoreItem label="수리 길흉" score={92} weight={20} />
  <ScoreItem label="의미 조화" score={88} weight={20} />
</div>
```

---

## 6. Interactive Elements

### Clickable Character Button
```typescript
<button
  onClick={() => onCharacterClick?.(char.id.toString())}
  className="
    hover:text-emerald-600 transition-colors
    flex items-center gap-1 group
  "
>
  <span className="text-xl font-medium">{char.character}</span>
  <span className="text-sm">({char.koreanReading})</span>
  <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
</button>
```

---

## 7. Score Item Subcomponent

```typescript
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
    <div className="
      bg-emerald-50/50 rounded-lg p-3
      border border-emerald-100
    ">
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

## 8. CTA Section

### Upgrade CTA at Bottom
```typescript
<div className="
  bg-gradient-to-r from-emerald-50 to-green-50
  rounded-lg p-3 text-center
  border border-emerald-100
">
  <p className="text-sm text-emerald-700 font-medium">
    이 이름이 마음에 드시나요? 상위 10개 이름도 확인해보세요!
  </p>
</div>
```

---

## 9. Responsive Patterns

### Mobile-First Padding
```typescript
// Progressively increase padding
className="p-4 sm:p-5 lg:p-6"
```

### Mobile-First Typography
```typescript
// Title: mobile → tablet → desktop
className="text-2xl sm:text-3xl"

// Body text
className="text-sm sm:text-base"
```

### Responsive Grid
```typescript
// Stack on mobile, 2-column on tablet+
className="grid grid-cols-1 sm:grid-cols-2 gap-3"
```

---

## 10. Complete Component Template

```typescript
/**
 * Free Name Card - 무료 공개 카드 (11-12위)
 */
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
      transition={{ duration: 0.4, delay: (rank - 11) * 0.1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={className}
    >
      <Card className="
        border-2 border-emerald-200 hover:border-emerald-400
        bg-gradient-to-br from-emerald-50/30 to-white
        hover:shadow-xl hover:shadow-emerald-200/50
        transition-all duration-300
      ">
        <CardHeader className="pb-4">
          {/* Header content: badges, name, hanja, score */}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score grid */}
          {/* Element badges */}
          {/* Character meanings */}
          {/* Footer info */}
          {/* CTA */}
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

---

## 11. Utility Patterns from Codebase

### Class Name Helper (cn)
```typescript
import { cn } from "~/lib/utils"

// Conditional classes
className={cn(
  "base-classes",
  condition && "conditional-classes",
  className  // Allow external override
)}
```

### Safe Optional Chaining
```typescript
onClick={() => onCharacterClick?.(char.id.toString())}
```

### Array Mapping with Index
```typescript
{candidate.characters.map((char, idx) => (
  <button key={idx}>
    {/* Character content */}
  </button>
))}
```

---

## 12. Quality Indicators

### Score Color Function
```typescript
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600';  // Good
  if (score >= 60) return 'text-yellow-600';   // Average
  return 'text-orange-600';                     // Needs improvement
};
```

### Quality Badge
```typescript
<div className="flex items-center gap-1 text-emerald-600 text-xs">
  <Sparkles className="w-3 h-3" />
  <span>추천 이름</span>
</div>
```

---

## 13. Footer Information

### Stroke Count + Confidence
```typescript
<div className="
  flex items-center justify-between
  text-sm text-gray-600
  pt-2 border-t border-emerald-100
">
  <span>총 획수: {candidate.totalStrokes}획</span>
  <span>신뢰도: {Math.round(candidate.confidenceScore)}%</span>
</div>
```

---

## 14. Animation Timing Reference

```typescript
// Entrance
duration: 0.4s
delay: 0s (rank 11), 0.1s (rank 12)

// Hover
scale: 1.02
duration: 0.2s

// Transitions
transition-all duration-300  // Border, shadow
transition-colors            // Text color
transition-opacity           // Icon visibility
```

---

## 15. Color Reference (Emerald Theme)

```typescript
// Backgrounds
'bg-emerald-50'      // #ecfdf5 - Very light
'bg-emerald-50/30'   // 30% opacity
'bg-emerald-100'     // #d1fae5 - Badge background

// Borders
'border-emerald-200' // #a7f3d0 - Default
'border-emerald-300' // #6ee7b7 - Badge
'border-emerald-400' // #34d399 - Hover

// Text
'text-emerald-600'   // #10b981 - Primary (scores)
'text-emerald-700'   // #047857 - CTA text
'text-emerald-800'   // #065f46 - Badge text

// Gradients
'from-emerald-500 to-green-600'    // Badge
'from-emerald-50 to-green-50'      // CTA background
'from-emerald-50/30 to-white'      // Card background

// Shadows
'shadow-emerald-200/50'            // Hover effect
```

---

## 16. Testing Data Example

```typescript
// Mock candidate for testing
const mockCandidate: ScoredCandidate = {
  id: '1',
  firstName: ['지', '윤'],
  characters: [
    {
      id: 123,
      character: '智',
      strokes: 12,
      element: 'FIRE',
      yinYang: 'YANG',
      meaning: '지혜롭다',
      koreanReading: '지'
    },
    {
      id: 124,
      character: '潤',
      strokes: 15,
      element: 'WATER',
      yinYang: 'YIN',
      meaning: '윤택하다',
      koreanReading: '윤'
    }
  ],
  scores: {
    overall: 87.5,
    elementHarmony: { score: 85, weight: 40, weightedScore: 34, explanation: '...' },
    yinYangBalance: { score: 78, weight: 20, weightedScore: 15.6, explanation: '...' },
    numerology: { score: 92, weight: 20, weightedScore: 18.4, explanation: '...' },
    meaningHarmony: { score: 88, weight: 20, weightedScore: 17.6, explanation: '...' }
  },
  confidenceScore: 85,
  totalStrokes: 27
};

// Usage
<FreeNameCard
  candidate={mockCandidate}
  rank={11}
  onCharacterClick={(id) => console.log('Clicked:', id)}
/>
```

---

## 17. Common Pitfalls to Avoid

❌ **Don't**: Use `green-*` colors consistently
✅ **Do**: Mix `emerald-*` for free tier distinction

❌ **Don't**: Forget rank-based stagger delay
✅ **Do**: `delay: (rank - 11) * 0.1`

❌ **Don't**: Omit mobile-first responsive classes
✅ **Do**: Always start with base, then add `sm:`, `lg:`

❌ **Don't**: Hardcode character array indices
✅ **Do**: Use `.map()` with proper keys

❌ **Don't**: Forget optional chaining for callbacks
✅ **Do**: `onCharacterClick?.(id)`

---

**Quick Start**: Copy the complete component template and customize the sections you need!
