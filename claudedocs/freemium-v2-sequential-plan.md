# Freemium V2 Naming Results System - Sequential Thinking Analysis

## Executive Summary

**Goal**: Build a completely new freemium-v2 naming results system that replaces old components with a strategic 11-12위 free / 1-10위 premium model optimized for conversion.

**Strategic Model**:
- **Free Tier (11-12위)**: 2 names, fully accessible preview
- **Premium Tier (1-10위)**: 10 names, ₩69,000, locked with blur effect
- **Conversion Focus**: Clean, modern design optimized for payment conversion

**Key Success Metrics**:
- Type-safe implementation (TypeScript)
- Seamless TossPayments integration
- Optimized conversion rate through psychological design
- Integration with existing classification logic

---

## Phase 1: Foundation Analysis & Architecture

### 1.1 Current System Assessment

**Existing Components (to be replaced)**:
```
✓ NameCard.tsx          → Free name display (11-12위)
✓ BlurredNameCard.tsx   → Locked premium preview (1-10위)
✓ PremiumCTA.tsx        → Conversion call-to-action
✓ PaymentModal.tsx      → TossPayments integration
✓ naming.freemium.results.tsx → Results page layout
```

**Existing Classification Logic** (`app/lib/freemium/classification.ts`):
```typescript
✓ classifyCandidates()           → Splits into free/locked/remaining tiers
✓ calculatePsychologicalMetrics() → Conversion optimization metrics
✓ getRankLabel()                  → Rank display formatting
✓ hasPremiumAccess()             → Access control
✓ getConversionMessages()        → Dynamic messaging
✓ getValueProposition()          → Price per name calculation
```

**Key Insights**:
- Classification logic is solid and doesn't need changes
- Current components follow good patterns but need modernization
- TossPayments integration is working in PaymentModal
- Psychological metrics are well-calculated

### 1.2 Architecture Decisions

**Component Hierarchy**:
```
naming.freemium-v2.results.tsx (NEW ROUTE)
├── FreemiumResultsLayout (NEW)
│   ├── Header Section
│   ├── FreeNameCard x2 (NEW - 11-12위)
│   ├── FreemiumCTA (NEW)
│   ├── LockedNameCard x10 (NEW - 1-10위)
│   └── FreemiumPaymentModal (NEW)
```

**Data Flow**:
```
API (/api/naming/freemium)
  → Stage 3 Response (recommendations)
  → classifyCandidates() → FreemiumTiers
  → calculatePsychologicalMetrics() → PsychologicalMetrics
  → Component Rendering
  → Payment Intent (/api/payment/naming)
  → TossPayments Checkout
  → Success/Fail Redirect
```

**State Management Strategy**:
```typescript
// Local component state (React useState)
- recommendations: NameRecommendation[]
- tiers: FreemiumTiers | null
- metrics: PsychologicalMetrics | null
- isPaymentModalOpen: boolean
- isLoading: boolean
- error: string | null

// URL state (searchParams)
- sessionId: string
- payment: 'success' | undefined

// Payment flow state
- Managed by TossPayments redirect
- No complex state management needed
```

**Type Safety Approach**:
```typescript
// Reuse existing types
- ScoredCandidate (from ~/lib/naming/types)
- FreemiumTiers (from ~/lib/freemium/classification)
- PsychologicalMetrics (from ~/lib/freemium/classification)

// New types needed
- NameRecommendation (API response format)
- Stage3Response (API wrapper)
- FreemiumPaymentModalProps (new modal)
```

---

## Phase 2: Component Design & Dependencies

### 2.1 Component Dependency Graph

```
┌─────────────────────────────────────────────────┐
│  naming.freemium-v2.results.tsx (Route)         │
│  Dependencies: API, classification.ts            │
│  Order: 6 (Last - orchestrates everything)      │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
┌───────────┐  ┌──────────┐  ┌────────────┐
│FreeNameCard│  │FreemiumCTA│  │LockedNameCard│
│Order: 1    │  │Order: 3   │  │Order: 2       │
│(simple)    │  │(medium)   │  │(medium)       │
└───────────┘  └──────────┘  └───────────────┘
                      │
                      ↓
              ┌──────────────────┐
              │FreemiumPaymentModal│
              │Order: 4 (complex)  │
              └──────────────────┘
                      │
                      ↓
              ┌──────────────────┐
              │FreemiumResultsLayout│
              │Order: 5 (wrapper)  │
              └──────────────────┘
```

### 2.2 Component Specifications

#### **Component 1: FreeNameCard** (Priority: HIGH, Complexity: LOW)

**Purpose**: Display free preview names (11-12위) with full information

**Props**:
```typescript
interface FreeNameCardProps {
  candidate: ScoredCandidate;
  rank: number;              // 11 or 12
  onCharacterClick?: (characterId: string) => void;
}
```

**Design Requirements**:
- ✅ Green color scheme (success/free theme)
- ✅ Full information visible: name, hanja, scores, meanings
- ✅ Clean, modern card layout with shadow
- ✅ Clickable hanja characters for details
- ✅ Rank badge with emoji (11등/12등)
- ✅ "무료 공개" badge
- ✅ Score breakdown grid (4 categories)
- ✅ Element badges for each character
- ✅ Stroke count and confidence score

**Key Differences from Old NameCard**:
- Remove favorite functionality (not needed in freemium flow)
- Simplified layout focusing on information clarity
- Better mobile responsiveness
- Updated color scheme for modern look

**Dependencies**:
- `~/components/ui/card`
- `~/components/ui/badge`
- `~/components/ui/element-badge`
- `~/lib/naming/types` (ScoredCandidate)
- `~/lib/freemium/classification` (getRankLabel)
- `framer-motion` (animations)
- `lucide-react` (icons)

---

#### **Component 2: LockedNameCard** (Priority: HIGH, Complexity: MEDIUM)

**Purpose**: Display locked premium names (1-10위) with strategic blur effect

**Props**:
```typescript
interface LockedNameCardProps {
  candidate: ScoredCandidate;
  rank: number;              // 1-10
  scoreDifference: number;   // vs free names
  onClick: () => void;       // Open payment modal
}
```

**Design Requirements**:
- ✅ Yellow/gold color scheme (premium theme)
- ✅ Strategic blur: name/hanja blurred, score visible
- ✅ Lock icon badge (top-right)
- ✅ Rank badge (1-10위, with special badges for top 3)
- ✅ "프리미엄" label
- ✅ Score prominently displayed (unblurred)
- ✅ Hover effect: scale + shadow increase
- ✅ Click handler opens payment modal
- ✅ CTA message at bottom: "클릭하여 확인"
- ✅ Price display: "₩69,000"

**Blur Strategy**:
```css
Name/Hanja:        filter: blur(8px)
Score Details:     filter: blur(4px)
Overall Score:     NO BLUR (z-index: 20)
CTA Section:       NO BLUR (z-index: 20)
Lock Icon:         NO BLUR (z-index: 20)
```

**Psychological Design**:
- Show score to create desire
- Blur content to create mystery
- One-click to payment (friction-free)
- Emphasize "10개 프리미엄" volume
- Price anchored as per-name value

**Dependencies**:
- `~/components/ui/card`
- `~/components/ui/badge`
- `~/lib/naming/types` (ScoredCandidate)
- `~/lib/freemium/classification` (getRankLabel)
- `framer-motion` (animations + hover)
- `lucide-react` (Lock, TrendingUp icons)

---

#### **Component 3: FreemiumCTA** (Priority: HIGH, Complexity: MEDIUM)

**Purpose**: Conversion-optimized call-to-action for premium purchase

**Props**:
```typescript
interface FreemiumCTAProps {
  metrics: PsychologicalMetrics;
  onPayment: () => void;
}
```

**Design Requirements**:
- ✅ Gradient background (yellow → orange → red)
- ✅ Animated gradient flow
- ✅ Lock icon with pulse animation
- ✅ Main headline: "1위 최고 점수 {score}점"
- ✅ Score difference emphasis: "+{diff}점 더 높은"
- ✅ Price display: ₩99,000 → ₩69,000 (30% 할인)
- ✅ Benefits list (3-4 items with checkmarks)
- ✅ Large CTA button with gradient
- ✅ Trust signals: 환불 보장, 1회 결제, 평생 이용
- ✅ Value proposition: per-name price

**Conversion Psychology**:
```
1. Anchor High Score:     "1위 {topScore}점"
2. Create Contrast:       "무료보다 +{diff}점"
3. Scarcity:              "단 10개 프리미엄"
4. Value Framing:         "이름당 ₩6,900"
5. Urgency:               "평생 사용할 이름"
6. Social Proof:          "전문가 검증"
7. Risk Reversal:         "환불 보장"
```

**Animation Strategy**:
- Gradient flows continuously
- Lock icon pulses periodically
- CTA button scales on hover
- Entrance animation: scale + fade

**Dependencies**:
- `~/components/ui/card`
- `~/components/ui/button`
- `~/components/ui/badge`
- `~/lib/freemium/classification` (PsychologicalMetrics)
- `framer-motion` (animations)
- `lucide-react` (icons: Lock, Sparkles, Check, etc.)

---

#### **Component 4: FreemiumPaymentModal** (Priority: HIGH, Complexity: HIGH)

**Purpose**: TossPayments integration for seamless checkout

**Props**:
```typescript
interface FreemiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  amount: number;           // 69000
  metrics: PsychologicalMetrics;  // For dynamic messaging
  onSuccess?: (paymentId: string) => void;
}
```

**Design Requirements**:
- ✅ Modal dialog (center overlay)
- ✅ Product summary: "프리미엄 이름 10개"
- ✅ Price: ₩69,000
- ✅ Benefits list (from metrics)
- ✅ TossPayments logo/trust signal
- ✅ Primary CTA: "₩69,000 결제하기"
- ✅ Secondary: "취소"
- ✅ Loading state during processing
- ✅ Error handling with toast notifications

**Payment Flow**:
```
1. User clicks payment button
2. Call /api/payment/naming (POST)
   Body: { sessionId, amount, customerName?, customerEmail? }
3. API returns { success, checkoutUrl, orderId }
4. Redirect to TossPayments checkout (window.location.href)
5. User completes payment on TossPayments
6. TossPayments redirects to:
   - Success: /api/payment/success?orderId=xxx&paymentKey=yyy
   - Fail: /api/payment/fail?code=xxx&message=yyy
7. API confirms payment and updates database
8. Redirect to results page with payment=success param
9. Show unlocked premium names
```

**Error Handling**:
```typescript
try {
  // Step 1: Create payment intent
  const response = await fetch('/api/payment/naming', {...});
  if (!response.ok) throw new Error('결제 요청 생성 실패');

  const result = await response.json();
  if (!result.success) throw new Error(result.message);

  // Step 2: Redirect to TossPayments
  window.location.href = result.checkoutUrl;
} catch (error) {
  toast.error(error.message || '결제 요청에 실패했습니다');
}
```

**Dependencies**:
- `~/components/ui/dialog`
- `~/components/ui/button`
- `~/lib/payment/toss.client` (formatAmount, requestPayment)
- `~/lib/freemium/classification` (PsychologicalMetrics)
- `sonner` (toast notifications)
- `lucide-react` (icons)

**Special Considerations**:
- Must handle both freemium flow (sessionId) and legacy flow (sajuId)
- Redirect URL must be absolute (window.location.origin)
- Close modal before redirect
- No state persistence needed (TossPayments handles it)

---

#### **Component 5: FreemiumResultsLayout** (Priority: MEDIUM, Complexity: LOW)

**Purpose**: Wrapper layout component for consistent structure

**Props**:
```typescript
interface FreemiumResultsLayoutProps {
  children: React.ReactNode;
  stage: 'loading' | 'error' | 'results';
  sessionId?: string;
  metrics?: PsychologicalMetrics;
}
```

**Design Requirements**:
- ✅ Progress indicator (Step 3 of 3)
- ✅ Header with title and icon
- ✅ Gradient background (orange-50 → white)
- ✅ Max-width container (max-w-4xl)
- ✅ Responsive padding
- ✅ Loading state skeleton
- ✅ Error state with retry button
- ✅ Results state with proper spacing

**Layout Structure**:
```tsx
<div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
  <div className="max-w-4xl mx-auto py-12 px-4">
    {/* Header with progress */}
    <Header stage={3} />

    {/* Content based on stage */}
    {stage === 'loading' && <LoadingSkeleton />}
    {stage === 'error' && <ErrorCard />}
    {stage === 'results' && children}
  </div>
</div>
```

**Dependencies**:
- `~/components/ui/card`
- `framer-motion` (animations)
- `lucide-react` (Sparkles, Loader2 icons)

---

#### **Component 6: naming.freemium-v2.results.tsx** (Priority: HIGH, Complexity: HIGH)

**Purpose**: Main route orchestrating the entire freemium results experience

**Route**: `GET /naming/freemium-v2/results?sessionId=xxx`

**Data Flow**:
```typescript
1. Extract sessionId from URL params
2. Fetch recommendations from API (/api/naming/freemium, stage: 3)
3. Transform API response to ScoredCandidate[]
4. Classify candidates using classifyCandidates()
5. Calculate metrics using calculatePsychologicalMetrics()
6. Render layout with components
7. Handle payment modal state
8. Handle payment success redirect
```

**State Management**:
```typescript
const [isLoading, setIsLoading] = useState(true);
const [recommendations, setRecommendations] = useState<NameRecommendation[]>([]);
const [tiers, setTiers] = useState<FreemiumTiers | null>(null);
const [metrics, setMetrics] = useState<PsychologicalMetrics | null>(null);
const [error, setError] = useState<string | null>(null);
const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
const [isPremium, setIsPremium] = useState(false); // After payment
```

**Component Composition**:
```tsx
<FreemiumResultsLayout
  stage={isLoading ? 'loading' : error ? 'error' : 'results'}
  sessionId={sessionId}
  metrics={metrics}
>
  {/* Free Names Section */}
  <section>
    <h2>🎁 무료 체험 이름 (11-12위)</h2>
    <div className="grid md:grid-cols-2 gap-6">
      {tiers.free.map((candidate, i) => (
        <FreeNameCard
          key={candidate.id}
          candidate={candidate}
          rank={i + 11}
        />
      ))}
    </div>
  </section>

  {/* Premium CTA */}
  {!isPremium && (
    <FreemiumCTA
      metrics={metrics}
      onPayment={() => setIsPaymentModalOpen(true)}
    />
  )}

  {/* Locked Names Section */}
  {!isPremium && (
    <section>
      <h2>🔒 프리미엄 이름 (1-10위)</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {tiers.locked.map((candidate, i) => (
          <LockedNameCard
            key={candidate.id}
            candidate={candidate}
            rank={i + 1}
            scoreDifference={metrics.scoreDifference}
            onClick={() => setIsPaymentModalOpen(true)}
          />
        ))}
      </div>
    </section>
  )}

  {/* Unlocked Premium Names (after payment) */}
  {isPremium && (
    <section>
      <h2>✨ 프리미엄 이름 (1-10위)</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {tiers.locked.map((candidate, i) => (
          <FreeNameCard  // Use FreeNameCard for unlocked view
            key={candidate.id}
            candidate={candidate}
            rank={i + 1}
          />
        ))}
      </div>
    </section>
  )}

  {/* Payment Modal */}
  {isPaymentModalOpen && (
    <FreemiumPaymentModal
      isOpen={isPaymentModalOpen}
      onClose={() => setIsPaymentModalOpen(false)}
      sessionId={sessionId!}
      amount={69000}
      metrics={metrics}
      onSuccess={(paymentId) => {
        setIsPremium(true);
        setIsPaymentModalOpen(false);
      }}
    />
  )}

  {/* Info Card */}
  <Card className="bg-blue-50 border-blue-200 p-6">
    <h3>💡 이름 선택 가이드</h3>
    <ul>...</ul>
  </Card>
</FreemiumResultsLayout>
```

**API Integration**:
```typescript
// Fetch recommendations
const response = await fetch('/api/naming/freemium', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ stage: 3, sessionId }),
});

const result: Stage3Response = await response.json();

// Transform to ScoredCandidate format
const candidates: ScoredCandidate[] = result.recommendations.map(rec => ({
  id: `${rec.rank}`,
  firstName: [rec.fullName.slice(1)],
  characters: rec.characters.map(char => ({
    id: char.character,
    character: char.character,
    meaning: char.meaning,
    strokes: char.strokes,
    element: char.element,
    koreanReading: '', // Not provided by API
  })),
  scores: {
    overall: rec.scores.overall,
    elementHarmony: { score: rec.scores.element, weight: 40, breakdown: {...} },
    yinYangBalance: { score: rec.scores.yinyang, weight: 20, breakdown: {...} },
    numerology: { score: rec.scores.numerology, weight: 25, breakdown: {...} },
    meaningHarmony: { score: rec.scores.meaning, weight: 15, breakdown: {...} },
  },
  totalStrokes: rec.characters.reduce((sum, char) => sum + char.strokes, 0),
  confidenceScore: 85,
  aiExplanation: rec.aiExplanation,
}));

// Classify
const classified = classifyCandidates(candidates);
const metrics = calculatePsychologicalMetrics(classified);
```

**Payment Success Handling**:
```typescript
// Check URL for payment success
const [searchParams] = useSearchParams();
const paymentSuccess = searchParams.get('payment') === 'success';

useEffect(() => {
  if (paymentSuccess) {
    setIsPremium(true);
    toast.success('결제가 완료되었습니다! 프리미엄 이름을 확인하세요.');
  }
}, [paymentSuccess]);
```

**Dependencies**:
- All 5 components above
- `~/lib/freemium/classification` (all utilities)
- `~/lib/naming/types` (ScoredCandidate)
- `@remix-run/react` (routing)
- `framer-motion` (animations)
- `sonner` (toast)

---

## Phase 3: Implementation Sequence

### 3.1 Implementation Order (Bottom-Up)

**Day 1: Foundation Components (Low Risk)**
```
✅ Task 1.1: Create FreeNameCard component
   - File: app/components/naming/freemium-v2/FreeNameCard.tsx
   - Time: 2 hours
   - Dependencies: UI primitives, types
   - Testing: Storybook or isolated render

✅ Task 1.2: Create LockedNameCard component
   - File: app/components/naming/freemium-v2/LockedNameCard.tsx
   - Time: 2.5 hours
   - Dependencies: UI primitives, types, blur effects
   - Testing: Storybook with different ranks

✅ Task 1.3: Create FreemiumResultsLayout component
   - File: app/components/naming/freemium-v2/FreemiumResultsLayout.tsx
   - Time: 1.5 hours
   - Dependencies: UI primitives, progress indicator
   - Testing: Loading/error/success states
```

**Day 2: Conversion Components (Medium Risk)**
```
✅ Task 2.1: Create FreemiumCTA component
   - File: app/components/naming/freemium-v2/FreemiumCTA.tsx
   - Time: 3 hours
   - Dependencies: PsychologicalMetrics, animations
   - Testing: Different metric scenarios

✅ Task 2.2: Create FreemiumPaymentModal component
   - File: app/components/naming/freemium-v2/FreemiumPaymentModal.tsx
   - Time: 4 hours
   - Dependencies: TossPayments client, API
   - Testing: Mock payment flow
```

**Day 3: Route Integration (High Risk)**
```
✅ Task 3.1: Create naming.freemium-v2.results.tsx route
   - File: app/routes/naming.freemium-v2.results.tsx
   - Time: 4 hours
   - Dependencies: All components, API
   - Testing: Full user flow

✅ Task 3.2: Integration testing
   - Time: 2 hours
   - Test API → classification → rendering → payment

✅ Task 3.3: Handle edge cases
   - Time: 2 hours
   - Missing sessionId, API errors, payment failures
```

**Day 4: Testing & Polish**
```
✅ Task 4.1: Component unit tests
   - File: app/components/naming/freemium-v2/__tests__/*.test.tsx
   - Time: 3 hours
   - Coverage: All 5 components

✅ Task 4.2: End-to-end testing
   - Time: 2 hours
   - Playwright: Full user journey

✅ Task 4.3: Mobile responsiveness
   - Time: 2 hours
   - Test all screen sizes

✅ Task 4.4: Performance optimization
   - Time: 1 hour
   - Lazy loading, animations
```

### 3.2 File Structure

```
app/
├── routes/
│   └── naming.freemium-v2.results.tsx       ← NEW (main route)
│
├── components/
│   └── naming/
│       └── freemium-v2/                      ← NEW FOLDER
│           ├── FreeNameCard.tsx              ← NEW
│           ├── LockedNameCard.tsx            ← NEW
│           ├── FreemiumCTA.tsx               ← NEW
│           ├── FreemiumPaymentModal.tsx      ← NEW
│           ├── FreemiumResultsLayout.tsx     ← NEW
│           ├── index.ts                      ← NEW (exports)
│           └── __tests__/                    ← NEW
│               ├── FreeNameCard.test.tsx
│               ├── LockedNameCard.test.tsx
│               ├── FreemiumCTA.test.tsx
│               ├── FreemiumPaymentModal.test.tsx
│               └── FreemiumResultsLayout.test.tsx
│
└── lib/
    └── freemium/
        └── classification.ts                 ← EXISTING (no changes)
```

---

## Phase 4: UI/UX Considerations

### 4.1 Design Tokens

**Color Palette**:
```css
/* Free Tier (11-12위) */
--free-primary: #10b981;      /* green-500 */
--free-light: #d1fae5;        /* green-100 */
--free-border: #86efac;       /* green-300 */

/* Premium Tier (1-10위) */
--premium-primary: #f59e0b;   /* orange-500 */
--premium-gold: #fbbf24;      /* yellow-400 */
--premium-light: #fef3c7;     /* yellow-100 */
--premium-border: #fcd34d;    /* yellow-300 */

/* CTA */
--cta-gradient: linear-gradient(to right, #f59e0b, #ef4444);
--cta-hover: linear-gradient(to right, #d97706, #dc2626);

/* Background */
--bg-gradient: linear-gradient(to bottom, #fff7ed, #ffffff);
```

**Typography**:
```css
/* Headings */
h1: text-4xl font-bold (36px)
h2: text-2xl font-bold (24px)
h3: text-xl font-semibold (20px)

/* Body */
body: text-base (16px)
small: text-sm (14px)
tiny: text-xs (12px)

/* Score Display */
score-large: text-5xl font-bold (48px)
score-medium: text-4xl font-bold (36px)
score-small: text-2xl font-bold (24px)
```

**Spacing**:
```css
/* Container */
max-width: 1024px (max-w-4xl)
padding: 48px 16px (py-12 px-4)

/* Card Gaps */
section-gap: 32px (space-y-8)
card-gap: 24px (gap-6)
card-padding: 24px (p-6)

/* Element Spacing */
tight: 8px (gap-2)
normal: 16px (gap-4)
loose: 24px (gap-6)
```

**Shadows & Effects**:
```css
/* Cards */
card-shadow: 0 1px 3px rgba(0,0,0,0.1)
card-shadow-hover: 0 10px 30px rgba(0,0,0,0.15)
card-shadow-premium: 0 20px 50px rgba(251, 191, 36, 0.3)

/* Blur */
blur-light: blur(4px)
blur-medium: blur(6px)
blur-heavy: blur(8px)

/* Transitions */
transition-fast: 150ms
transition-normal: 300ms
transition-slow: 500ms
```

### 4.2 Animation Strategy

**Entrance Animations** (Framer Motion):
```typescript
// Stagger children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Usage
<motion.div variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {/* content */}
    </motion.div>
  ))}
</motion.div>
```

**Hover Animations**:
```typescript
// Card hover
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  transition={{ duration: 0.2 }}
>
  <Card />
</motion.div>

// Button hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  결제하기
</motion.button>
```

**Loading Animations**:
```typescript
// Spinner
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
>
  <Loader2 />
</motion.div>

// Pulse
<motion.div
  animate={{ scale: [1, 1.1, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <Lock />
</motion.div>
```

### 4.3 Mobile Responsiveness

**Breakpoints**:
```css
/* Tailwind defaults */
sm: 640px   /* tablet portrait */
md: 768px   /* tablet landscape */
lg: 1024px  /* desktop */
xl: 1280px  /* large desktop */
```

**Responsive Grid**:
```tsx
{/* Mobile: 1 column, Desktop: 2 columns */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {cards.map(card => <Card key={card.id} />)}
</div>
```

**Mobile Optimizations**:
- Touch targets: min 44x44px
- Font sizes: scale down on mobile
- Padding: reduce on small screens
- Card layout: single column on mobile
- Modal: full-screen on mobile
- CTA button: sticky on mobile

### 4.4 Accessibility

**ARIA Labels**:
```tsx
<button
  aria-label="프리미엄 이름 결제하기"
  aria-describedby="payment-description"
>
  결제하기
</button>

<div id="payment-description" className="sr-only">
  69,000원으로 10개의 프리미엄 이름을 확인할 수 있습니다
</div>
```

**Keyboard Navigation**:
- All interactive elements focusable
- Focus visible with outline
- Tab order logical
- Escape closes modal

**Screen Reader Support**:
- Semantic HTML (main, section, article)
- Heading hierarchy (h1 → h2 → h3)
- Alt text for icons
- Live regions for dynamic updates

---

## Phase 5: Integration Points

### 5.1 API Integration

**Endpoint**: `POST /api/naming/freemium`

**Request** (Stage 3):
```json
{
  "stage": 3,
  "sessionId": "abc123xyz"
}
```

**Response**:
```typescript
interface Stage3Response {
  success: true;
  sessionId: string;
  stage: 3;
  recommendations: NameRecommendation[];
  hasMore: boolean;
  pricing: {
    auto: number;
    expertRange: [number, number];
  };
  nextStage: 4;
}

interface NameRecommendation {
  rank: number;
  fullName: string;
  characters: Array<{
    character: string;
    meaning: string;
    strokes: number;
    element: string;
  }>;
  scores: {
    overall: number;
    element: number;
    yinyang: number;
    numerology: number;
    meaning: number;
    aiMeaning?: number;
  };
  aiExplanation: string;
}
```

**Error Handling**:
```typescript
if (!response.ok) {
  throw new Error('Failed to fetch recommendations');
}

const result = await response.json();

if (!result.success) {
  throw new Error(result.message || 'Unknown error');
}
```

### 5.2 Classification Logic Integration

**Usage**:
```typescript
import {
  classifyCandidates,
  calculatePsychologicalMetrics,
  getRankLabel,
  type FreemiumTiers,
  type PsychologicalMetrics,
} from '~/lib/freemium/classification';

// Transform API response
const candidates: ScoredCandidate[] = transformApiResponse(recommendations);

// Classify (11-12위 free, 1-10위 locked)
const tiers: FreemiumTiers = classifyCandidates(candidates);

// Calculate conversion metrics
const metrics: PsychologicalMetrics = calculatePsychologicalMetrics(tiers);

// Use in components
<FreemiumCTA metrics={metrics} onPayment={handlePayment} />
```

**No Changes Needed**:
- classification.ts is complete and well-tested
- All functions pure and type-safe
- Conversion messages pre-calculated
- Just import and use

### 5.3 Payment Integration

**API Endpoint**: `POST /api/payment/naming`

**Request**:
```json
{
  "sessionId": "abc123xyz",
  "amount": 69000,
  "customerName": "홍길동",
  "customerEmail": "hong@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "orderId": "order_abc123",
  "checkoutUrl": "https://checkout.tosspayments.com/...",
  "message": "Payment request created successfully"
}
```

**Flow**:
```typescript
// 1. Create payment request
const response = await fetch('/api/payment/naming', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, amount: 69000 }),
});

const result = await response.json();

// 2. Redirect to TossPayments
window.location.href = result.checkoutUrl;

// 3. TossPayments redirects back to:
// Success: /api/payment/success?orderId=xxx&paymentKey=yyy&amount=69000
// Fail: /api/payment/fail?code=xxx&message=yyy

// 4. Backend confirms payment and updates database

// 5. Redirect to results page
// Success: /naming/freemium-v2/results?sessionId=xxx&payment=success
// Fail: /naming/freemium-v2/results?sessionId=xxx&payment=fail&error=xxx
```

### 5.4 State Persistence

**Session Storage** (optional, for UX):
```typescript
// Save state before redirect
sessionStorage.setItem('freemium-session', JSON.stringify({
  sessionId,
  recommendations,
  tiers,
  metrics,
  timestamp: Date.now(),
}));

// Restore after redirect
useEffect(() => {
  const saved = sessionStorage.getItem('freemium-session');
  if (saved) {
    const data = JSON.parse(saved);
    // Validate timestamp (30 min expiry)
    if (Date.now() - data.timestamp < 30 * 60 * 1000) {
      setRecommendations(data.recommendations);
      setTiers(data.tiers);
      setMetrics(data.metrics);
    }
  }
}, []);
```

**URL State**:
```typescript
// Always include sessionId in URL
const navigate = useNavigate();
navigate(`/naming/freemium-v2/results?sessionId=${sessionId}&payment=success`);

// Read from URL
const [searchParams] = useSearchParams();
const sessionId = searchParams.get('sessionId');
const paymentStatus = searchParams.get('payment');
```

---

## Phase 6: Testing Strategy

### 6.1 Component Unit Tests

**Test Coverage** (target: >80%):
```typescript
// app/components/naming/freemium-v2/__tests__/FreeNameCard.test.tsx
describe('FreeNameCard', () => {
  it('renders candidate name and rank', () => {});
  it('displays all scores correctly', () => {});
  it('shows element badges', () => {});
  it('handles character click', () => {});
  it('applies correct styling', () => {});
});

// app/components/naming/freemium-v2/__tests__/LockedNameCard.test.tsx
describe('LockedNameCard', () => {
  it('blurs name and hanja', () => {});
  it('shows score unblurred', () => {});
  it('displays lock icon', () => {});
  it('triggers onClick when clicked', () => {});
  it('shows correct rank badge', () => {});
});

// app/components/naming/freemium-v2/__tests__/FreemiumCTA.test.tsx
describe('FreemiumCTA', () => {
  it('displays top score from metrics', () => {});
  it('shows score difference', () => {});
  it('calculates price correctly', () => {});
  it('triggers onPayment when button clicked', () => {});
  it('renders trust signals', () => {});
});

// app/components/naming/freemium-v2/__tests__/FreemiumPaymentModal.test.tsx
describe('FreemiumPaymentModal', () => {
  it('opens and closes modal', () => {});
  it('displays payment amount', () => {});
  it('calls payment API on submit', () => {});
  it('handles API errors gracefully', () => {});
  it('shows loading state during processing', () => {});
});
```

### 6.2 Integration Tests

**Test Scenarios**:
```typescript
describe('Freemium V2 Results Flow', () => {
  it('loads recommendations from API', async () => {
    // Mock API response
    // Verify recommendations displayed
  });

  it('classifies candidates into tiers', () => {
    // Verify 11-12위 in free section
    // Verify 1-10위 in locked section
  });

  it('calculates psychological metrics correctly', () => {
    // Verify score differences
    // Verify conversion messages
  });

  it('opens payment modal on CTA click', () => {
    // Click CTA button
    // Verify modal opens
  });

  it('completes payment flow', async () => {
    // Mock payment API
    // Verify redirect to TossPayments
  });

  it('handles payment success', async () => {
    // Simulate success redirect
    // Verify premium names unlocked
  });

  it('handles payment failure', async () => {
    // Simulate fail redirect
    // Verify error message
  });
});
```

### 6.3 E2E Tests (Playwright)

**User Journey**:
```typescript
test('complete freemium naming flow', async ({ page }) => {
  // 1. Navigate to freemium input
  await page.goto('/naming/freemium');

  // 2. Fill form
  await page.fill('input[name="lastName"]', '김');
  await page.selectOption('select[name="gender"]', 'M');
  // ... fill other fields

  // 3. Submit form
  await page.click('button[type="submit"]');

  // 4. Wait for saju analysis
  await page.waitForURL(/\/naming\/freemium\/analysis/);

  // 5. Navigate to results
  await page.waitForURL(/\/naming\/freemium-v2\/results/);

  // 6. Verify free names visible
  await expect(page.locator('[data-testid="name-card"]').first()).toBeVisible();

  // 7. Verify locked names blurred
  await expect(page.locator('[data-locked="true"]').first()).toBeVisible();

  // 8. Click payment CTA
  await page.click('button:has-text("프리미엄 이름 보기")');

  // 9. Verify modal opens
  await expect(page.locator('dialog')).toBeVisible();

  // 10. Click payment button
  await page.click('button:has-text("결제하기")');

  // 11. Verify redirect to TossPayments (or mock)
  // Note: Actual payment testing requires test environment
});
```

### 6.4 Performance Testing

**Metrics to Track**:
```typescript
// Lighthouse scores
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

// Core Web Vitals
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

// Component-specific
- Initial render: <500ms
- API response: <2s
- Payment redirect: <1s
```

**Optimization Checks**:
```typescript
// Code splitting
- Route-based splitting ✓
- Lazy load components ✓
- Dynamic imports for heavy deps ✓

// Image optimization
- No images in this flow ✓
- SVG icons optimized ✓

// Bundle size
- Main bundle: <100KB gzipped
- Route bundle: <50KB gzipped
```

---

## Phase 7: Risk Management & Mitigation

### 7.1 Technical Risks

**Risk 1: API Response Changes**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Strong TypeScript interfaces
  - Runtime validation with Zod
  - Fallback error handling
  - API versioning

**Risk 2: TossPayments Integration Failure**
- **Probability**: Low
- **Impact**: Critical
- **Mitigation**:
  - Comprehensive error handling
  - Test environment setup
  - Mock payment flow for development
  - Retry logic for transient failures
  - Clear error messages to users

**Risk 3: State Management Issues**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Simple local state (no global state needed)
  - URL-based state for persistence
  - Clear data flow documentation
  - Session storage backup

**Risk 4: Mobile Performance**
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**:
  - Test on real devices
  - Optimize animations for 60fps
  - Reduce bundle size
  - Lazy load non-critical components

### 7.2 UX Risks

**Risk 1: Conversion Drop-off**
- **Probability**: Medium
- **Impact**: High (business impact)
- **Mitigation**:
  - A/B test different CTA messaging
  - Optimize psychological triggers
  - Reduce friction in payment flow
  - Add trust signals
  - Clear value proposition

**Risk 2: Confusion About Tiers**
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**:
  - Clear labeling (11-12위 free, 1-10위 premium)
  - Color coding (green vs gold)
  - Obvious visual hierarchy
  - Information tooltips

**Risk 3: Payment Flow Interruption**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Save state before redirect
  - Clear loading indicators
  - Error recovery flow
  - Retry mechanism

### 7.3 Business Risks

**Risk 1: Price Sensitivity**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Value framing (per-name price)
  - Comparison to alternatives
  - Social proof
  - Money-back guarantee

**Risk 2: Trust Issues**
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**:
  - TossPayments branding
  - SSL/security indicators
  - Clear refund policy
  - Customer testimonials

---

## Phase 8: Success Criteria & Validation

### 8.1 Functional Requirements ✓

- [ ] Display 11-12위 names fully accessible (free tier)
- [ ] Display 1-10위 names with blur effect (locked tier)
- [ ] Calculate and display psychological metrics correctly
- [ ] Open payment modal on CTA click
- [ ] Integrate with TossPayments checkout
- [ ] Handle payment success redirect
- [ ] Handle payment failure gracefully
- [ ] Unlock premium names after payment
- [ ] Mobile responsive design
- [ ] Loading and error states

### 8.2 Non-Functional Requirements ✓

- [ ] Type-safe TypeScript implementation
- [ ] Clean, modern UI design
- [ ] Smooth animations (60fps)
- [ ] Accessibility (WCAG AA)
- [ ] SEO optimized
- [ ] Performance (Lighthouse >90)
- [ ] Cross-browser compatible
- [ ] Unit test coverage >80%
- [ ] E2E tests for critical flows

### 8.3 Business Requirements ✓

- [ ] Clear value proposition
- [ ] Conversion-optimized design
- [ ] Trust signals present
- [ ] Price displayed prominently
- [ ] Benefits list comprehensive
- [ ] Risk reversal (refund guarantee)
- [ ] Urgency/scarcity messaging
- [ ] Social proof elements

### 8.4 Validation Steps

**Pre-Launch Checklist**:
```
1. Component Tests
   [ ] All unit tests passing
   [ ] Integration tests passing
   [ ] E2E tests passing
   [ ] Visual regression tests

2. Functionality Tests
   [ ] API integration working
   [ ] Classification logic correct
   [ ] Payment flow complete
   [ ] Error handling robust

3. UX Tests
   [ ] Mobile responsive
   [ ] Animations smooth
   [ ] Loading states clear
   [ ] Error messages helpful

4. Business Tests
   [ ] Conversion elements present
   [ ] Value proposition clear
   [ ] Trust signals visible
   [ ] Price displayed correctly

5. Performance Tests
   [ ] Lighthouse scores >90
   [ ] Bundle size optimized
   [ ] API response <2s
   [ ] Page load <3s

6. Accessibility Tests
   [ ] Keyboard navigation working
   [ ] Screen reader compatible
   [ ] Color contrast passing
   [ ] Focus indicators visible
```

---

## Phase 9: Documentation & Handoff

### 9.1 Component Documentation

**README for freemium-v2/**:
```markdown
# Freemium V2 Naming Results Components

## Overview
Clean, conversion-optimized components for freemium naming results.

## Components
- **FreeNameCard**: Display free tier names (11-12위)
- **LockedNameCard**: Display locked premium names (1-10위) with blur
- **FreemiumCTA**: Conversion call-to-action
- **FreemiumPaymentModal**: TossPayments integration
- **FreemiumResultsLayout**: Wrapper layout

## Usage
```tsx
import { FreeNameCard, LockedNameCard, FreemiumCTA } from '~/components/naming/freemium-v2';
```

## Props
See individual component files for detailed prop documentation.

## Testing
```bash
npm test -- freemium-v2
```
```

### 9.2 Integration Guide

**For Developers**:
```markdown
# Integrating Freemium V2

## 1. Route Setup
Add route: `app/routes/naming.freemium-v2.results.tsx`

## 2. API Integration
```typescript
const response = await fetch('/api/naming/freemium', {
  method: 'POST',
  body: JSON.stringify({ stage: 3, sessionId }),
});
```

## 3. Classification
```typescript
import { classifyCandidates, calculatePsychologicalMetrics } from '~/lib/freemium/classification';

const tiers = classifyCandidates(candidates);
const metrics = calculatePsychologicalMetrics(tiers);
```

## 4. Payment Flow
```typescript
<FreemiumPaymentModal
  sessionId={sessionId}
  amount={69000}
  onSuccess={handleSuccess}
/>
```

## 5. Success Handling
Check URL param: `?payment=success`
Unlock premium names when true.
```

### 9.3 Troubleshooting Guide

**Common Issues**:

1. **API returns empty recommendations**
   - Check sessionId validity
   - Verify stage 1 & 2 completed
   - Check API logs

2. **Payment modal not opening**
   - Verify button onClick handler
   - Check modal state management
   - Inspect console for errors

3. **TossPayments redirect fails**
   - Verify API response contains checkoutUrl
   - Check environment variables
   - Ensure HTTPS in production

4. **Premium names not unlocking**
   - Check URL param: `?payment=success`
   - Verify payment confirmation in API
   - Check database payment record

5. **Blur effect not working**
   - Verify CSS filter support in browser
   - Check z-index layering
   - Inspect element styles

---

## Phase 10: Post-Launch Monitoring

### 10.1 Metrics to Track

**Technical Metrics**:
```
- Error rate: <0.1%
- API latency: <500ms (p95)
- Page load time: <3s (p95)
- Payment success rate: >95%
- Payment abandonment rate: <30%
```

**Business Metrics**:
```
- Conversion rate: target >15%
- Average order value: ₩69,000
- Refund rate: <5%
- Session completion rate: >80%
- Mobile conversion rate: >10%
```

**User Experience Metrics**:
```
- Time to payment decision: track median
- CTA click rate: target >50%
- Locked card click rate: target >40%
- Modal open → payment rate: target >70%
```

### 10.2 A/B Testing Opportunities

**Test Ideas**:
1. CTA button text variations
2. Price display (₩69,000 vs "이름당 ₩6,900")
3. Discount badge (30% vs "₩30,000 절약")
4. Benefits list order
5. Trust signal placement
6. Free tier count (2 vs 3 names)
7. Locked card blur intensity
8. Score difference emphasis

### 10.3 Optimization Roadmap

**Short-term (1-2 weeks)**:
- Add analytics events
- Implement error tracking (Sentry)
- Set up performance monitoring
- Create A/B test framework

**Medium-term (1-2 months)**:
- Analyze conversion funnel
- Optimize based on data
- Add social proof elements
- Implement exit-intent popup

**Long-term (3+ months)**:
- Advanced personalization
- Dynamic pricing experiments
- Alternative payment methods
- Upsell opportunities

---

## Summary: Critical Path

### Minimum Viable Product (MVP)

**Must-Have (Day 1-3)**:
1. ✅ FreeNameCard component
2. ✅ LockedNameCard component
3. ✅ FreemiumCTA component
4. ✅ FreemiumPaymentModal component
5. ✅ FreemiumResultsLayout component
6. ✅ naming.freemium-v2.results.tsx route
7. ✅ API integration
8. ✅ Classification logic integration
9. ✅ Payment flow integration
10. ✅ Basic error handling

**Nice-to-Have (Day 4+)**:
- Advanced animations
- Comprehensive tests
- Mobile optimizations
- Performance tuning
- A/B testing setup

### Key Decision Points

**Architecture**:
- ✅ Component-based approach (5 components + 1 route)
- ✅ Local state management (no Redux needed)
- ✅ URL-based persistence (sessionId in params)
- ✅ TossPayments redirect flow (not SDK)

**Design**:
- ✅ Green for free, Gold for premium
- ✅ Strategic blur: name hidden, score visible
- ✅ Psychological conversion optimization
- ✅ Mobile-first responsive design

**Integration**:
- ✅ Reuse existing classification.ts (no changes)
- ✅ Leverage existing API endpoints
- ✅ Follow existing payment patterns
- ✅ Maintain type safety throughout

### Final Checklist

**Before Deployment**:
- [ ] All components built and tested
- [ ] Route integrated and functional
- [ ] Payment flow tested end-to-end
- [ ] Mobile responsive verified
- [ ] Error handling comprehensive
- [ ] Performance optimized
- [ ] Accessibility validated
- [ ] Documentation complete
- [ ] Staging environment tested
- [ ] Production rollout plan ready

---

## Conclusion

This sequential thinking analysis provides a comprehensive blueprint for building the freemium-v2 naming results system. The plan follows a bottom-up implementation approach, starting with simple components and building up to the complete integrated system.

**Key Strengths**:
- Clear component boundaries and dependencies
- Type-safe architecture throughout
- Conversion-optimized design
- Seamless payment integration
- Comprehensive testing strategy
- Risk mitigation planning

**Next Steps**:
1. Review and approve this plan
2. Set up development environment
3. Begin Day 1 tasks (FreeNameCard, LockedNameCard)
4. Iterate through implementation sequence
5. Test thoroughly at each stage
6. Deploy with monitoring

**Estimated Timeline**: 3-4 days for MVP, 4-5 days including polish and testing.

**Estimated LOC (Lines of Code)**: ~2,000 lines total across 6 files.

---

**Document Version**: 1.0
**Created**: 2025-10-28
**Author**: Claude (Sequential Thinking Analysis)
**Status**: Ready for Implementation
