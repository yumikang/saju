# FreeNameCard - Design Specification

Visual design reference and component specifications for the FreeNameCard component.

---

## Component Purpose

Display name candidates at ranks 11-12 (무료 tier) as a **free sample** to demonstrate the platform's quality and encourage users to upgrade for the top 10 premium names.

---

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  Card Container (Emerald theme)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ HEADER                                            │  │
│  │  ┌─────────────────────────┐  ┌───────────────┐  │  │
│  │  │ Left Side               │  │ Right Side    │  │  │
│  │  │ • Badges (11위, 무료)   │  │ • Score Box   │  │  │
│  │  │ • Name (지윤)           │  │   87점         │  │  │
│  │  │ • Hanja (智潤)          │  │ • Indicator   │  │  │
│  │  └─────────────────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ CONTENT                                           │  │
│  │                                                   │  │
│  │ ┌──────────┬──────────┐  Score Grid (2x2)       │  │
│  │ │ 오행 85  │ 음양 78  │                          │  │
│  │ ├──────────┼──────────┤                          │  │
│  │ │ 수리 92  │ 의미 88  │                          │  │
│  │ └──────────┴──────────┘                          │  │
│  │                                                   │  │
│  │ Element Badges: [火] [水]                        │  │
│  │                                                   │  │
│  │ Character Meanings:                              │  │
│  │ • 智: 지혜롭다                                    │  │
│  │ • 潤: 윤택하다                                    │  │
│  │                                                   │  │
│  │ ─────────────────────────────────────            │  │
│  │ 총 획수: 27획    신뢰도: 85%                     │  │
│  │                                                   │  │
│  │ ┌─────────────────────────────────────────────┐ │  │
│  │ │ CTA: 상위 10개 이름도 확인해보세요!         │ │  │
│  │ └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Color Specifications

### Primary Palette (Emerald Theme)

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Card Background** | emerald-50/30 → white | #ecfdf5 (30%) → #fff | Gradient background |
| **Border Default** | emerald-200 | #a7f3d0 | Card border |
| **Border Hover** | emerald-400 | #34d399 | Interactive state |
| **Badge BG** | emerald-100 | #d1fae5 | Rank badge |
| **Badge Text** | emerald-800 | #065f46 | Badge text |
| **Score Primary** | emerald-600 | #10b981 | High scores (≥80) |
| **Score Medium** | yellow-600 | #ca8a04 | Medium scores (60-79) |
| **Score Low** | orange-600 | #ea580c | Low scores (<60) |
| **Gradient Start** | emerald-500 | #10b981 | Free badge gradient |
| **Gradient End** | green-600 | #16a34a | Free badge gradient |
| **Shadow** | emerald-200/50 | #a7f3d0 (50%) | Hover shadow |

### Secondary Colors

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Text Primary** | gray-900 | #111827 | Name, headings |
| **Text Secondary** | gray-700 | #374151 | Hanja characters |
| **Text Muted** | gray-600 | #4b5563 | Labels, footer |
| **Text Light** | gray-500 | #6b7280 | Weight indicators |
| **Divider** | emerald-100 | #d1fae5 | Border between sections |
| **CTA Background** | emerald-50 → green-50 | #ecfdf5 → #f0fdf4 | Gradient CTA box |
| **CTA Text** | emerald-700 | #047857 | CTA message |

---

## Typography Scale

### Font Sizes

| Element | Mobile | Desktop | Weight | Color |
|---------|--------|---------|--------|-------|
| **Name** | 3xl (1.875rem) | 3xl | bold (700) | gray-900 |
| **Score Number** | 4xl (2.25rem) | 4xl | bold (700) | emerald-600 |
| **Score Unit** | lg (1.125rem) | lg | normal | emerald-600 |
| **Hanja Character** | xl (1.25rem) | xl | medium (500) | gray-700 |
| **Hanja Reading** | sm (0.875rem) | sm | normal | gray-700 |
| **Score Value** | 2xl (1.5rem) | 2xl | bold (700) | varies |
| **Score Label** | xs (0.75rem) | xs | normal | gray-600 |
| **Badge Text** | xs (0.75rem) | xs | semibold (600) | emerald-800 |
| **Meaning Text** | sm (0.875rem) | base (1rem) | normal | gray-800 |
| **Footer Text** | sm (0.875rem) | sm | normal | gray-600 |
| **CTA Text** | sm (0.875rem) | sm | medium (500) | emerald-700 |

### Line Heights
- Headings: `leading-none` (1)
- Body: `leading-normal` (1.5)
- Compact: `leading-tight` (1.25)

---

## Spacing System

### Card Structure
```
Card Outer Padding:
- Mobile: p-4 (1rem)
- Tablet: sm:p-5 (1.25rem)
- Desktop: lg:p-6 (1.5rem)

Internal Spacing:
- Section gap: space-y-4 (1rem)
- Grid gap: gap-3 (0.75rem)
- Badge gap: gap-2 (0.5rem)
- Header bottom: pb-4 (1rem)
```

### Component Spacing
```
Badges:
  padding: px-2.5 py-0.5
  gap: gap-2

Score Box:
  padding: p-3
  margin-bottom: mb-2

Score Items:
  padding: p-3
  internal: mb-1 (between label/value)

Character Meanings:
  gap: space-y-1
  margin: mb-2 (label)

Footer:
  padding-top: pt-2
  border-top: border-t
```

---

## Border & Radius

### Border Widths
- **Card**: `border-2` (2px)
- **Score Box**: `border-2` (2px)
- **Score Items**: `border` (1px)
- **CTA**: `border` (1px)

### Border Radius
- **Card**: `rounded-lg` (0.5rem)
- **Badges**: `rounded-full` (9999px)
- **Score Box**: `rounded-lg` (0.5rem)
- **Score Items**: `rounded-lg` (0.5rem)
- **CTA**: `rounded-lg` (0.5rem)

---

## Shadows

### Shadow Levels
```css
/* Default (Card) */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)

/* Hover (Card) */
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
+ shadow-emerald-200/50: Emerald tint at 50% opacity

/* Score Box */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
```

---

## Animation Specifications

### Entrance Animation

**Duration**: 0.4s
**Easing**: Default (ease-out)
**Transform**: translateY(20px) → translateY(0)
**Opacity**: 0 → 1
**Delay**:
- Rank 11: 0s
- Rank 12: 0.1s

### Hover Animation

**Duration**: 0.2s
**Easing**: Default (ease-out)
**Transform**: scale(1) → scale(1.02)
**Shadow**: shadow-sm → shadow-xl + emerald-200/50

### Border Transition

**Duration**: 300ms
**Properties**: all (border, shadow, background)
**Easing**: ease

### Icon Transition

**Duration**: 200ms
**Property**: opacity
**Initial**: opacity-0
**Hover**: opacity-100

---

## Interactive States

### Card States

| State | Border | Shadow | Scale | Cursor |
|-------|--------|--------|-------|--------|
| **Default** | emerald-200 | sm | 1.0 | default |
| **Hover** | emerald-400 | xl + emerald | 1.02 | default |
| **Active** | emerald-400 | xl + emerald | 1.02 | default |

### Button States (Character Click)

| State | Color | Opacity | Cursor |
|-------|-------|---------|--------|
| **Default** | gray-700 | 1.0 | default |
| **Hover** | emerald-600 | 1.0 | pointer |
| **Icon** | gray-400 | 0.0 | - |
| **Icon Hover** | gray-400 | 1.0 | - |

---

## Responsive Breakpoints

### Layout Changes

#### Mobile (< 640px)
- Card padding: `p-4`
- Single column layout
- Badges stack vertically
- Font size: base
- Score grid: 2x2

#### Tablet (≥ 640px)
- Card padding: `sm:p-5`
- Badges inline
- Font size: slightly larger
- Score grid: 2x2

#### Desktop (≥ 1024px)
- Card padding: `lg:p-6`
- Full layout with optimal spacing
- Font size: standard
- Score grid: 2x2

### Grid Behavior
```
Score Grid:
  Mobile: grid-cols-2 (always 2 columns)
  Tablet: grid-cols-2
  Desktop: grid-cols-2
```

---

## Icon Specifications

### Icon Sizes

| Icon | Size | Usage |
|------|------|-------|
| **Gift** | w-3 h-3 (12px) | Free badge |
| **Sparkles** | w-3 h-3 (12px) | Quality indicator |
| **Info** | w-3 h-3 (12px) | Character detail trigger |

### Icon Colors

| Icon | Color | Context |
|------|-------|---------|
| **Gift** | white | Inside gradient badge |
| **Sparkles** | emerald-600 | Quality indicator |
| **Info** | gray-400 | Default (transparent) |
| **Info (hover)** | gray-400 | Visible on hover |

---

## Badge Design

### Rank Badge (11위)
```
Background: emerald-100 (#d1fae5)
Border: emerald-300 (#6ee7b7)
Text: emerald-800 (#065f46)
Font: xs, semibold
Padding: px-2.5 py-0.5
Radius: rounded-full
```

### Free Badge (무료 체험)
```
Background: gradient from-emerald-500 to-green-600
Border: none (border-0)
Text: white
Icon: Gift (w-3 h-3 mr-1)
Font: xs, semibold
Padding: px-2.5 py-0.5
Radius: rounded-full
```

---

## Score Box Design

### Main Score Display
```
Container:
  Background: white/90 + backdrop-blur-sm
  Border: 2px emerald-300
  Padding: p-3
  Radius: rounded-lg
  Shadow: shadow-md

Number:
  Size: 4xl (2.25rem)
  Weight: bold (700)
  Color: emerald-600

Unit:
  Size: lg (1.125rem)
  Weight: normal
  Color: emerald-600

Label:
  Size: xs (0.75rem)
  Weight: normal
  Color: gray-600
```

### Score Item (Grid Cell)
```
Container:
  Background: emerald-50/50
  Border: 1px emerald-100
  Padding: p-3
  Radius: rounded-lg

Layout:
  • Label + Weight (top, space-between)
  • Score value (large, colored)

Colors:
  ≥80: emerald-600
  60-79: yellow-600
  <60: orange-600
```

---

## CTA Design

### Upgrade Message Box
```
Background: gradient from-emerald-50 to-green-50
Border: 1px emerald-100
Padding: p-3
Radius: rounded-lg
Text-align: center

Text:
  Size: sm (0.875rem)
  Weight: medium (500)
  Color: emerald-700

Message:
  "이 이름이 마음에 드시나요? 상위 10개 이름도 확인해보세요!"
```

---

## Accessibility

### Color Contrast

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| emerald-800 on emerald-100 | 8.2:1 | AAA |
| white on emerald-500 | 4.8:1 | AA |
| gray-900 on white | 19:1 | AAA |
| emerald-700 on emerald-50 | 7.5:1 | AAA |

### Interactive Elements

- All buttons have hover states
- Icons have aria-labels (if needed)
- Color is not the only indicator
- Focus states visible
- Touch targets ≥ 44x44px

### Keyboard Navigation

- Tab through character buttons
- Enter to trigger character detail
- Escape to dismiss modals (if any)

---

## Component Variants

### Standard Variant (Default)
- Full content display
- All badges shown
- CTA included

### Compact Variant (Optional)
- Reduced padding
- Smaller font sizes
- No CTA section

### Mobile Optimized
- Touch-friendly targets
- Larger tap areas
- Optimized spacing

---

## Design Comparison

### vs NameCard (Rank 5)

| Feature | NameCard | FreeNameCard |
|---------|----------|--------------|
| Color | Green | Emerald |
| Badge | "무료 공개" | "무료 체험" + Gift icon |
| Gradient | None | Subtle emerald |
| CTA | None | Upgrade message |
| Favorite | Heart button | Not included |

### vs BlurredNameCard (Ranks 1-10)

| Feature | BlurredNameCard | FreeNameCard |
|---------|-----------------|--------------|
| Visibility | Blurred | Fully visible |
| Color | Yellow/Orange | Emerald/Green |
| Click Action | Payment modal | Character details |
| Lock Icon | Yes | No |
| Purpose | Premium tease | Free sample |

---

## Implementation Checklist

### Visual Elements
- [ ] Emerald color scheme applied
- [ ] Gradient backgrounds configured
- [ ] Badges styled (rank + free)
- [ ] Score box with emerald border
- [ ] Score items with emerald backgrounds
- [ ] CTA box with gradient background
- [ ] Icons properly sized and colored

### Animations
- [ ] Card entrance with rank-based delay
- [ ] Hover scale effect (1.02)
- [ ] Emerald shadow on hover
- [ ] Icon opacity transition
- [ ] Smooth border transitions

### Responsive Design
- [ ] Mobile padding (p-4)
- [ ] Tablet padding (sm:p-5)
- [ ] Desktop padding (lg:p-6)
- [ ] Score grid always 2x2
- [ ] Text sizes responsive
- [ ] Touch-friendly on mobile

### Interactive
- [ ] Character buttons clickable
- [ ] Hover states working
- [ ] Icons show on hover
- [ ] Proper event handling
- [ ] Optional callbacks work

### Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Touch targets adequate
- [ ] Semantic HTML structure

---

## Design Tokens

```typescript
// colors.ts
export const freeNameCardTheme = {
  border: {
    default: 'border-emerald-200',
    hover: 'border-emerald-400',
  },
  background: {
    card: 'bg-gradient-to-br from-emerald-50/30 to-white',
    badge: 'bg-emerald-100',
    scoreBox: 'bg-white/90',
    scoreItem: 'bg-emerald-50/50',
    cta: 'bg-gradient-to-r from-emerald-50 to-green-50',
  },
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-600',
    badge: 'text-emerald-800',
    score: 'text-emerald-600',
    cta: 'text-emerald-700',
  },
  shadow: {
    default: 'shadow-sm',
    hover: 'shadow-xl shadow-emerald-200/50',
    scoreBox: 'shadow-md',
  },
};
```

---

**Design Status**: ✅ Complete and ready for implementation
**Last Updated**: 2025-10-28
**Designer Notes**: Emerald theme creates clear visual distinction from premium (yellow) and free (green) tiers while maintaining approachable, encouraging aesthetic for free users.
