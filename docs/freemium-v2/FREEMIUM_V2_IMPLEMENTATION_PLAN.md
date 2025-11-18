# Freemium V2 Implementation Plan
## Renaming & Saju Services

**Generated**: 2025-10-28
**Status**: Ready for Implementation
**Estimated Complexity**: High (Multi-phase, ~15-20 subtasks)

---

## Overview

Apply the proven **freemium-v2 UI pattern** from naming service to:
1. **Renaming Service** (`/renaming`)
2. **Saju Compatibility Service** (`/saju`)

**Core Pattern**:
- 11-12위: Free preview (emerald theme)
- 1-10위: Premium locked (yellow theme)
- Payment integration with TossPayments
- Maintain existing backend logic and database

---

## PHASE 1: RENAMING SERVICE (/renaming)

### 1.1 Type Definitions & Interfaces
**File**: `/app/lib/renaming/types.ts` (new)

**Tasks**:
- [ ] Create `RenamingCandidate` interface extending naming pattern
- [ ] Create `RenamingScoredCandidate` with overall score + breakdown
- [ ] Create `RenamingFreemiumTiers` interface (free, locked, remaining)
- [ ] Create `RenamingPsychologicalMetrics` for conversion optimization
- [ ] Create `RenamingRequest` and `RenamingResponse` types

**Dependencies**: None
**Complexity**: Simple
**Estimated Time**: 30 minutes

**Interface Structure**:
```typescript
export interface RenamingCandidate {
  currentName: string;
  newName: string;
  newNameHanja: string;
  improvement: number;
  score: number;
  breakdown: ScoreBreakdown;
  analysis: RenamingAnalysis;
}

export interface RenamingScoredCandidate extends RenamingCandidate {
  scores: {
    overall: number;
    elementHarmony: DetailedScore;
    yinYangBalance: DetailedScore;
    numerology: DetailedScore;
    meaningHarmony: DetailedScore;
  };
}

export interface RenamingFreemiumTiers {
  free: RenamingScoredCandidate[];    // 11-12위
  locked: RenamingScoredCandidate[];  // 1-10위
  remaining: RenamingScoredCandidate[];
}

export interface RenamingPsychologicalMetrics {
  topScore: number;
  currentScore: number;
  improvementDifference: number;
  lockedCount: number;
  totalCount: number;
  conversionMessage: string;
}
```

**Validation**:
- [ ] Types compile without errors
- [ ] Compatible with existing renaming API responses
- [ ] Export structure matches naming/types.ts pattern

---

### 1.2 Classification Logic
**File**: `/app/lib/renaming/classification.ts` (new)

**Tasks**:
- [ ] Implement `classifyRenamingCandidates()` function
- [ ] Implement `calculateRenamingMetrics()` function
- [ ] Implement `getImprovementMessage()` for conversion
- [ ] Add rank label utility `getRenamingRankLabel()`
- [ ] Add value proposition utility for renaming

**Dependencies**: 1.1 Type Definitions
**Complexity**: Moderate
**Estimated Time**: 1 hour

**Key Functions**:
```typescript
export function classifyRenamingCandidates(
  candidates: RenamingScoredCandidate[]
): RenamingFreemiumTiers {
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return {
    locked: sorted.slice(0, 10),  // 1-10위 premium
    free: sorted.slice(10, 12),   // 11-12위 free
    remaining: sorted.slice(12),   // 13+ remaining
  };
}

export function calculateRenamingMetrics(
  tiers: RenamingFreemiumTiers,
  currentScore: number
): RenamingPsychologicalMetrics {
  // Calculate improvement gaps and conversion messaging
}
```

**Validation**:
- [ ] Returns correct tier splits (10 locked, 2 free, rest remaining)
- [ ] Metrics accurately reflect improvement from current name
- [ ] Conversion messages emphasize improvement value
- [ ] Unit tests pass for classification logic

---

### 1.3 RenamingFreeCard Component
**File**: `/app/components/renaming/freemium-v2/RenamingFreeCard.tsx` (new)

**Tasks**:
- [ ] Create component with emerald theme (matching FreeNameCard)
- [ ] Display current name → new name transformation
- [ ] Show improvement score with green accent
- [ ] Display detailed scores (element, yinyang, numerology, meaning)
- [ ] Add character detail click handlers
- [ ] Add upgrade CTA button
- [ ] Implement hover animations and stagger effects
- [ ] Add responsive mobile-first design

**Dependencies**: 1.1 Types, 1.2 Classification
**Complexity**: Moderate
**Estimated Time**: 2 hours

**Props Interface**:
```typescript
export interface RenamingFreeCardProps {
  candidate: RenamingScoredCandidate;
  currentName: string;
  rank: 11 | 12;
  onCharacterClick?: (characterId: number) => void;
  onUpgradeClick?: () => void;
}
```

**Visual Features**:
- Emerald color scheme (emerald-50, emerald-200, emerald-500)
- "무료 체험" badge with Gift icon
- Current name → New name transformation display
- "+X점 개선" improvement badge (green)
- Full score breakdown visible
- Sparkles quality indicator for high scores
- Hover scale effect with emerald shadow

**Validation**:
- [ ] Renders correctly with mock data
- [ ] Theme matches FreeNameCard emerald style
- [ ] Animations work smoothly (stagger, hover, scale)
- [ ] Responsive on mobile, tablet, desktop
- [ ] Click handlers fire correctly
- [ ] Accessibility: keyboard navigation, screen reader support

---

### 1.4 RenamingLockedCard Component
**File**: `/app/components/renaming/freemium-v2/RenamingLockedCard.tsx` (new)

**Tasks**:
- [ ] Create component with yellow/orange premium theme
- [ ] Implement dual-layer blur effect on content
- [ ] Make overall score prominently visible (z-20)
- [ ] Add Lock icon in top-right corner
- [ ] Display improvement score clearly
- [ ] Add CTA message at bottom with click handler
- [ ] Implement rank-based stagger animations
- [ ] Add hover effects with yellow shadow

**Dependencies**: 1.1 Types, 1.2 Classification
**Complexity**: Moderate
**Estimated Time**: 2 hours

**Props Interface**:
```typescript
export interface RenamingLockedCardProps {
  candidate: RenamingScoredCandidate;
  currentName: string;
  rank: number; // 1-10
  onClick: () => void;
}
```

**Visual Features**:
- Yellow/orange premium theme (yellow-50, yellow-200, yellow-500)
- Dual-layer blur: content blur + overlay blur
- Overall score visible with improvement indicator
- Lock icon badge in top-right
- Blurred new name (8px blur)
- Visible improvement: "+X점 개선"
- Bottom CTA: "클릭하여 X등 이름 확인하기"
- Hover scale effect with yellow shadow

**Validation**:
- [ ] Blur effect works correctly (content blurred, score visible)
- [ ] Theme matches LockedNameCard yellow style
- [ ] Lock icon and CTA positioned correctly
- [ ] Click handler opens payment modal
- [ ] Animations smooth (stagger by rank)
- [ ] Responsive layout maintained
- [ ] Test data-testid attributes for testing

---

### 1.5 RenamingFreemiumCTA Component
**File**: `/app/components/renaming/freemium-v2/RenamingFreemiumCTA.tsx` (new)

**Tasks**:
- [ ] Create conversion-optimized CTA section
- [ ] Display improvement metrics (top improvement vs current)
- [ ] Show locked count (10개 프리미엄 이름)
- [ ] Add urgency messaging for renaming
- [ ] Implement gradient background (orange → yellow)
- [ ] Add payment button with price display
- [ ] Implement benefit list specific to renaming
- [ ] Add hover and animation effects

**Dependencies**: 1.1 Types, 1.2 Classification
**Complexity**: Simple
**Estimated Time**: 1 hour

**Props Interface**:
```typescript
export interface RenamingFreemiumCTAProps {
  metrics: RenamingPsychologicalMetrics;
  currentScore: number;
  onPayment: () => void;
  price?: number; // default: 69000
}
```

**Content Focus**:
- Emphasize improvement: "현재 X점 → 최고 Y점 (Z점 개선)"
- Value proposition: "이름 하나당 6,900원"
- Benefit list for renaming:
  - 운세 개선 효과
  - 법적 개명 절차 가이드
  - 평생 사용할 이름
  - 10개 최고 점수 이름 선택권

**Validation**:
- [ ] Metrics display correctly
- [ ] Price calculation accurate
- [ ] Button triggers payment modal
- [ ] Visual hierarchy clear
- [ ] Mobile responsive layout

---

### 1.6 RenamingFreemiumPaymentModal Component
**File**: `/app/components/renaming/freemium-v2/RenamingFreemiumPaymentModal.tsx` (new)

**Tasks**:
- [ ] Create modal with TossPayments integration
- [ ] Display session ID, amount, metrics
- [ ] Show improvement value in modal
- [ ] Add customer info form (name, email optional)
- [ ] Implement payment flow (request, widget, success)
- [ ] Add loading states and error handling
- [ ] Implement close handler with confirmation
- [ ] Add success callback with orderId

**Dependencies**: 1.1 Types, 1.2 Classification, FreemiumPaymentModal pattern
**Complexity**: Moderate
**Estimated Time**: 2 hours

**Props Interface**:
```typescript
export interface RenamingFreemiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  amount?: number; // default: 69000
  metrics: RenamingPsychologicalMetrics;
  currentScore: number;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: (orderId: string) => void;
}
```

**Features**:
- Reuse TossPayments widget integration
- Show improvement context in modal header
- Display what's included (10개 프리미엄 이름)
- Customer info fields (optional)
- Loading spinner during payment
- Success/error toast notifications
- Close confirmation if payment in progress

**Validation**:
- [ ] Modal opens/closes correctly
- [ ] Payment widget loads and functions
- [ ] Form validation works
- [ ] Success callback fires with orderId
- [ ] Error handling displays messages
- [ ] Loading states prevent double-submit
- [ ] Modal is accessible (focus trap, ESC to close)

---

### 1.7 RenamingFreemiumResultsLayout Component
**File**: `/app/components/renaming/freemium-v2/RenamingFreemiumResultsLayout.tsx` (new)

**Tasks**:
- [ ] Create main layout orchestrating all components
- [ ] Implement header with current name → improvement context
- [ ] Add progress steps indicator
- [ ] Create free section (11-12위)
- [ ] Add premium CTA section
- [ ] Create locked section (1-10위)
- [ ] Add selection guide for renaming
- [ ] Integrate payment modal
- [ ] Implement success handler for unlocking

**Dependencies**: 1.3-1.6 All Components
**Complexity**: High
**Estimated Time**: 3 hours

**Props Interface**:
```typescript
export interface RenamingFreemiumResultsLayoutProps {
  tiers: RenamingFreemiumTiers;
  metrics: RenamingPsychologicalMetrics;
  currentName: string;
  currentScore: number;
  sessionId: string;
  title?: string;
  description?: string;
  paymentAmount?: number;
  customerName?: string;
  customerEmail?: string;
  onPaymentSuccess?: (orderId: string) => void;
  onCharacterClick?: (characterId: number) => void;
  showProgress?: boolean;
  showGuide?: boolean;
}
```

**Layout Structure**:
1. Header: Title, current name context, progress indicator
2. Free Section: 11-12위 free sample names
3. Premium CTA: Conversion-optimized call-to-action
4. Locked Section: 1-10위 premium locked names
5. Info Guide: Renaming selection guide
6. Payment Modal: TossPayments integration

**Validation**:
- [ ] All sections render in correct order
- [ ] Payment modal state managed correctly
- [ ] Success handler unlocks premium content
- [ ] Animations smooth and staggered
- [ ] Responsive layout on all devices
- [ ] Progress steps update correctly
- [ ] Guide content relevant to renaming

---

### 1.8 Route Integration
**File**: `/app/routes/renaming.tsx` (update existing)

**Tasks**:
- [ ] Import freemium-v2 components
- [ ] Update RenamingResults component to use FreemiumResultsLayout
- [ ] Implement classification logic in API response handling
- [ ] Add metrics calculation
- [ ] Update payment flow to use FreemiumPaymentModal
- [ ] Handle payment success with content unlock
- [ ] Add session ID generation
- [ ] Update step flow to match new UI

**Dependencies**: 1.1-1.7 All Previous Tasks
**Complexity**: High
**Estimated Time**: 2-3 hours

**Changes Required**:
```typescript
// In RenamingResults component:
const [tiers, setTiers] = useState<RenamingFreemiumTiers | null>(null);
const [metrics, setMetrics] = useState<RenamingPsychologicalMetrics | null>(null);

// After fetching recommendations:
const classifiedTiers = classifyRenamingCandidates(scoredCandidates);
const calculatedMetrics = calculateRenamingMetrics(
  classifiedTiers,
  currentScore
);
setTiers(classifiedTiers);
setMetrics(calculatedMetrics);

// Render:
return (
  <RenamingFreemiumResultsLayout
    tiers={tiers}
    metrics={metrics}
    currentName={data.currentName}
    currentScore={currentScore}
    sessionId={analysisId}
    onPaymentSuccess={handlePaymentSuccess}
  />
);
```

**Validation**:
- [ ] Route compiles without errors
- [ ] API responses transform correctly
- [ ] Classification logic executes properly
- [ ] Payment flow works end-to-end
- [ ] Free names display immediately
- [ ] Locked names unlock after payment
- [ ] Error states handled gracefully
- [ ] Loading states display correctly

---

### 1.9 Testing & Validation
**Files**: Various test files

**Tasks**:
- [ ] Create unit tests for classification logic
- [ ] Create component tests for all freemium-v2 components
- [ ] Create integration tests for route flow
- [ ] Test payment flow (sandbox mode)
- [ ] Test responsive design on multiple devices
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Test error scenarios
- [ ] Performance testing (rendering, animations)

**Dependencies**: 1.1-1.8 All Implementation Complete
**Complexity**: High
**Estimated Time**: 3-4 hours

**Test Coverage**:
- [ ] `classification.test.ts`: classifyCandidates, calculateMetrics
- [ ] `RenamingFreeCard.test.tsx`: rendering, props, interactions
- [ ] `RenamingLockedCard.test.tsx`: blur effects, click handlers
- [ ] `RenamingFreemiumCTA.test.tsx`: metrics display, button actions
- [ ] `RenamingFreemiumPaymentModal.test.tsx`: payment flow, validation
- [ ] `RenamingFreemiumResultsLayout.test.tsx`: full layout integration
- [ ] `renaming.route.test.tsx`: API integration, state management

**Validation Checklist**:
- [ ] All tests pass (unit, component, integration)
- [ ] Code coverage >80%
- [ ] No console errors or warnings
- [ ] Payment sandbox flow completes successfully
- [ ] Mobile/tablet/desktop responsive
- [ ] Accessibility audit passes
- [ ] Performance: FCP <1.5s, TTI <3s
- [ ] SEO: meta tags, semantic HTML

---

## PHASE 2: SAJU COMPATIBILITY SERVICE (/saju)

### 2.1 Type Definitions & Interfaces
**File**: `/app/lib/saju/compatibility-types.ts` (new)

**Tasks**:
- [ ] Create `CompatibilityResult` interface
- [ ] Create `CompatibilityScoredResult` with detailed scores
- [ ] Create `SajuFreemiumTiers` interface (free, locked, remaining)
- [ ] Create `SajuPsychologicalMetrics` for conversion
- [ ] Create `CompatibilityCategory` enum (personality, communication, values, etc.)

**Dependencies**: None
**Complexity**: Simple
**Estimated Time**: 30 minutes

**Interface Structure**:
```typescript
export interface CompatibilityResult {
  couple: {
    male: PersonData;
    female: PersonData;
  };
  overallScore: number;
  categories: {
    personality: number;
    communication: number;
    values: number;
    lifestyle: number;
    financial: number;
  };
  strengths: string[];
  challenges: string[];
  advice: string;
}

export interface CompatibilityScoredResult extends CompatibilityResult {
  scores: {
    overall: number;
    personality: DetailedScore;
    communication: DetailedScore;
    values: DetailedScore;
    lifestyle: DetailedScore;
    financial: DetailedScore;
  };
  detailedAnalysis: {
    marriage: DetailedAnalysis;
    children: DetailedAnalysis;
    business: DetailedAnalysis;
  };
}

export interface SajuFreemiumTiers {
  free: CompatibilityScoredResult[];    // 11-12위 (lower scores)
  locked: CompatibilityScoredResult[];  // 1-10위 (top insights)
  remaining: CompatibilityScoredResult[];
}

export interface SajuPsychologicalMetrics {
  topScore: number;
  averageFreeScore: number;
  scoreDifference: number;
  lockedCount: number;
  totalCount: number;
  conversionMessage: string;
}
```

**Note**: Saju compatibility is different from naming - we're classifying **different aspects/analyses** rather than individual name candidates. Consider structuring as:
- Free: Basic compatibility overview (11-12위 quality insights)
- Locked: Deep analyses (marriage timing, children forecast, financial compatibility, etc.)

**Validation**:
- [ ] Types compile without errors
- [ ] Compatible with saju calculator output
- [ ] Export structure clear and documented

---

### 2.2 Classification Logic
**File**: `/app/lib/saju/compatibility-classification.ts` (new)

**Tasks**:
- [ ] Implement `classifyCompatibilityResults()` function
- [ ] Implement `calculateSajuMetrics()` function
- [ ] Implement `getCompatibilityMessage()` for conversion
- [ ] Add rank label utility `getCompatibilityRankLabel()`
- [ ] Add value proposition for saju compatibility

**Dependencies**: 2.1 Type Definitions
**Complexity**: Moderate
**Estimated Time**: 1-2 hours

**Key Functions**:
```typescript
export function classifyCompatibilityResults(
  results: CompatibilityScoredResult[]
): SajuFreemiumTiers {
  const sorted = [...results].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return {
    locked: sorted.slice(0, 10),  // Top 10 deep insights
    free: sorted.slice(10, 12),   // Basic preview insights
    remaining: sorted.slice(12),
  };
}

export function calculateSajuMetrics(
  tiers: SajuFreemiumTiers
): SajuPsychologicalMetrics {
  // Calculate score gaps and conversion messaging
}
```

**Special Consideration**:
For saju compatibility, we might want to classify **different analysis types** rather than ranked duplicates:
- Free: Basic compatibility score + overview
- Locked: Marriage timing analysis, Children forecast, Financial compatibility, Career synergy, Health compatibility, etc.

This gives more value than just showing "lower quality" compatibility results.

**Validation**:
- [ ] Returns correct tier splits
- [ ] Metrics reflect value of deep insights
- [ ] Conversion messages emphasize analysis depth
- [ ] Unit tests pass

---

### 2.3 SajuFreeCard Component
**File**: `/app/components/saju/freemium-v2/SajuFreeCard.tsx` (new)

**Tasks**:
- [ ] Create component with emerald theme
- [ ] Display basic compatibility score
- [ ] Show category breakdown (personality, communication, etc.)
- [ ] Display strengths list (green highlights)
- [ ] Display challenges list (yellow highlights)
- [ ] Add upgrade CTA button
- [ ] Implement hover animations
- [ ] Add responsive design

**Dependencies**: 2.1 Types, 2.2 Classification
**Complexity**: Moderate
**Estimated Time**: 2 hours

**Props Interface**:
```typescript
export interface SajuFreeCardProps {
  result: CompatibilityScoredResult;
  rank: 11 | 12;
  onUpgradeClick?: () => void;
}
```

**Visual Features**:
- Emerald color scheme
- "무료 체험" badge with Gift icon
- Overall compatibility score prominently displayed
- Category scores with progress bars
- Strengths list (green badges)
- Challenges list (yellow badges)
- Basic advice section
- Upgrade CTA: "더 깊은 분석 보기"

**Validation**:
- [ ] Renders correctly with mock data
- [ ] Theme matches emerald style
- [ ] Animations smooth
- [ ] Responsive layout
- [ ] Click handlers work

---

### 2.4 SajuLockedCard Component
**File**: `/app/components/saju/freemium-v2/SajuLockedCard.tsx` (new)

**Tasks**:
- [ ] Create component with yellow/orange theme
- [ ] Implement dual-layer blur on detailed content
- [ ] Make overall score visible (z-20)
- [ ] Add Lock icon
- [ ] Display analysis type (marriage, children, business)
- [ ] Add CTA message at bottom
- [ ] Implement hover effects
- [ ] Add rank-based stagger animations

**Dependencies**: 2.1 Types, 2.2 Classification
**Complexity**: Moderate
**Estimated Time**: 2 hours

**Props Interface**:
```typescript
export interface SajuLockedCardProps {
  result: CompatibilityScoredResult;
  analysisType: 'marriage' | 'children' | 'business' | 'financial' | 'health';
  rank: number; // 1-10
  onClick: () => void;
}
```

**Visual Features**:
- Yellow/orange premium theme
- Dual-layer blur effect
- Overall score visible
- Lock icon badge
- Analysis type indicator
- Blurred detailed content (8px)
- Visible score and category
- Bottom CTA: "클릭하여 X 분석 확인하기"

**Validation**:
- [ ] Blur effect works correctly
- [ ] Theme matches yellow premium style
- [ ] Click handler opens payment modal
- [ ] Animations smooth
- [ ] Responsive layout

---

### 2.5 SajuFreemiumCTA Component
**File**: `/app/components/saju/freemium-v2/SajuFreemiumCTA.tsx` (new)

**Tasks**:
- [ ] Create conversion CTA section
- [ ] Display score metrics (top vs free average)
- [ ] Show locked analysis count
- [ ] Add urgency messaging for couple compatibility
- [ ] Implement gradient background
- [ ] Add payment button
- [ ] Implement benefit list for saju
- [ ] Add animations

**Dependencies**: 2.1 Types, 2.2 Classification
**Complexity**: Simple
**Estimated Time**: 1 hour

**Props Interface**:
```typescript
export interface SajuFreemiumCTAProps {
  metrics: SajuPsychologicalMetrics;
  onPayment: () => void;
  price?: number; // default: 69000
}
```

**Content Focus**:
- Emphasize depth: "기본 궁합 → 상세 분석 10가지"
- Value proposition: "결혼, 자녀, 사업 등 종합 분석"
- Benefit list:
  - 결혼 시기 예측
  - 자녀 계획 가이드
  - 재물 운세 분석
  - 건강 궁합 분석
  - 평생 참고 자료

**Validation**:
- [ ] Metrics display correctly
- [ ] Button triggers payment modal
- [ ] Visual hierarchy clear
- [ ] Mobile responsive

---

### 2.6 SajuFreemiumPaymentModal Component
**File**: `/app/components/saju/freemium-v2/SajuFreemiumPaymentModal.tsx` (new)

**Tasks**:
- [ ] Create modal with TossPayments integration
- [ ] Display couple names in modal header
- [ ] Show analysis count (10가지 상세 분석)
- [ ] Add customer info form
- [ ] Implement payment flow
- [ ] Add loading and error states
- [ ] Implement close handler
- [ ] Add success callback

**Dependencies**: 2.1 Types, 2.2 Classification
**Complexity**: Moderate
**Estimated Time**: 2 hours

**Props Interface**:
```typescript
export interface SajuFreemiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  amount?: number;
  metrics: SajuPsychologicalMetrics;
  coupleNames: {
    male: string;
    female: string;
  };
  customerName?: string;
  customerEmail?: string;
  onSuccess?: (orderId: string) => void;
}
```

**Features**:
- Reuse TossPayments widget
- Show couple context in header
- Display what's included (10가지 상세 분석)
- Customer info fields
- Loading/success/error states
- Close confirmation

**Validation**:
- [ ] Modal functionality works
- [ ] Payment widget loads
- [ ] Form validation works
- [ ] Success callback fires
- [ ] Error handling works
- [ ] Accessible

---

### 2.7 SajuFreemiumResultsLayout Component
**File**: `/app/components/saju/freemium-v2/SajuFreemiumResultsLayout.tsx` (new)

**Tasks**:
- [ ] Create main layout component
- [ ] Implement header with couple names
- [ ] Add progress steps
- [ ] Create free section (basic compatibility)
- [ ] Add premium CTA section
- [ ] Create locked section (detailed analyses)
- [ ] Add selection guide for saju
- [ ] Integrate payment modal
- [ ] Implement success handler

**Dependencies**: 2.3-2.6 All Components
**Complexity**: High
**Estimated Time**: 3 hours

**Props Interface**:
```typescript
export interface SajuFreemiumResultsLayoutProps {
  tiers: SajuFreemiumTiers;
  metrics: SajuPsychologicalMetrics;
  coupleNames: {
    male: string;
    female: string;
  };
  sessionId: string;
  title?: string;
  description?: string;
  paymentAmount?: number;
  customerName?: string;
  customerEmail?: string;
  onPaymentSuccess?: (orderId: string) => void;
  showProgress?: boolean;
  showGuide?: boolean;
}
```

**Layout Structure**:
1. Header: Couple names, progress indicator
2. Free Section: Basic compatibility overview
3. Premium CTA: Deep analysis conversion
4. Locked Section: Detailed analyses (marriage, children, etc.)
5. Info Guide: Compatibility analysis guide
6. Payment Modal

**Validation**:
- [ ] All sections render correctly
- [ ] Payment flow works
- [ ] Success unlocks content
- [ ] Animations smooth
- [ ] Responsive design
- [ ] Guide content relevant

---

### 2.8 Route Integration
**File**: `/app/routes/saju.tsx` (update existing)

**Tasks**:
- [ ] Import freemium-v2 components
- [ ] Update CompatibilityAnalysis to generate multiple analysis types
- [ ] Implement classification logic
- [ ] Add metrics calculation
- [ ] Update payment flow
- [ ] Handle payment success
- [ ] Add session ID generation
- [ ] Update step flow

**Dependencies**: 2.1-2.7 All Previous Tasks
**Complexity**: High
**Estimated Time**: 2-3 hours

**Changes Required**:
```typescript
// In DetailedCompatibilityResults component:
const [tiers, setTiers] = useState<SajuFreemiumTiers | null>(null);
const [metrics, setMetrics] = useState<SajuPsychologicalMetrics | null>(null);

// Generate multiple analysis types:
const analyses = generateDetailedAnalyses(compatibility);
const classifiedTiers = classifyCompatibilityResults(analyses);
const calculatedMetrics = calculateSajuMetrics(classifiedTiers);

// Render:
return (
  <SajuFreemiumResultsLayout
    tiers={tiers}
    metrics={metrics}
    coupleNames={{
      male: data?.maleData.name || '',
      female: data?.femaleData.name || ''
    }}
    sessionId={sessionId}
    onPaymentSuccess={handlePaymentSuccess}
  />
);
```

**Validation**:
- [ ] Route compiles
- [ ] Analysis generation works
- [ ] Classification executes
- [ ] Payment flow works
- [ ] Content unlocks correctly
- [ ] Error handling works
- [ ] Loading states display

---

### 2.9 Testing & Validation
**Files**: Various test files

**Tasks**:
- [ ] Create unit tests for classification logic
- [ ] Create component tests for all freemium-v2 components
- [ ] Create integration tests for route flow
- [ ] Test payment flow (sandbox)
- [ ] Test responsive design
- [ ] Test accessibility
- [ ] Test error scenarios
- [ ] Performance testing

**Dependencies**: 2.1-2.8 All Implementation Complete
**Complexity**: High
**Estimated Time**: 3-4 hours

**Test Coverage**:
- [ ] `compatibility-classification.test.ts`: logic tests
- [ ] `SajuFreeCard.test.tsx`: component tests
- [ ] `SajuLockedCard.test.tsx`: blur and interactions
- [ ] `SajuFreemiumCTA.test.tsx`: metrics and actions
- [ ] `SajuFreemiumPaymentModal.test.tsx`: payment flow
- [ ] `SajuFreemiumResultsLayout.test.tsx`: full integration
- [ ] `saju.route.test.tsx`: API and state management

**Validation Checklist**:
- [ ] All tests pass
- [ ] Code coverage >80%
- [ ] No errors or warnings
- [ ] Payment sandbox works
- [ ] Responsive on all devices
- [ ] Accessibility passes
- [ ] Performance metrics good
- [ ] SEO optimized

---

## Cross-Cutting Concerns

### Payment Integration
**Common to both services**

**Requirements**:
- Use existing TossPayments integration
- Session ID tracks purchase context
- Amount: ₩69,000 (default, configurable)
- Success callback unlocks premium content
- Error handling with retry logic
- Loading states prevent double-submit

**Files to Review**:
- `/app/lib/payment/toss-payments.ts`
- `/app/components/naming/freemium-v2/FreemiumPaymentModal.tsx`

### Database Schema
**Verify payment tracking supports both services**

**Required fields**:
- `service_type`: 'naming' | 'renaming' | 'saju'
- `session_id`: Links to analysis session
- `order_id`: TossPayments order ID
- `status`: 'pending' | 'completed' | 'failed'
- `amount`: Payment amount in KRW
- `user_id`: Optional user association

### API Endpoints
**Ensure backend supports freemium access control**

**Renaming**:
- `POST /api/renaming/analyze-current` - Current name analysis
- `POST /api/renaming/recommend` - Generate recommendations
- `GET /api/renaming/analysis/:id` - Retrieve analysis with access check

**Saju**:
- `POST /api/saju/compatibility` - Basic compatibility
- `POST /api/saju/detailed-analysis` - Generate detailed analyses
- `GET /api/saju/analysis/:id` - Retrieve with access check

### Analytics & Tracking
**Monitor conversion funnel**

**Events to track**:
- View freemium results page
- Click upgrade CTA
- Open payment modal
- Complete payment
- View unlocked content
- Bounce rate at free tier

**Tools**: Google Analytics, Mixpanel, or similar

---

## Dependencies & Prerequisites

### External Libraries (Already Available)
- ✅ React 18+
- ✅ Remix (routing, loaders, actions)
- ✅ Framer Motion (animations)
- ✅ Lucide React (icons)
- ✅ TailwindCSS (styling)
- ✅ shadcn/ui components (Card, Button, Badge, etc.)
- ✅ date-fns (date formatting)
- ✅ TossPayments SDK

### Internal Dependencies
- ✅ `/app/lib/naming/types.ts` - Naming type patterns
- ✅ `/app/lib/freemium/classification.ts` - Classification patterns
- ✅ `/app/components/naming/freemium-v2/*` - Reference components
- ✅ `/app/lib/payment/toss-payments.ts` - Payment integration
- ✅ `/app/lib/saju/calculator.ts` - Saju calculation logic

### Database Tables
- ✅ `orders` - Payment records
- ✅ `naming_analyses` - Naming sessions
- ✅ `renaming_analyses` - Renaming sessions (verify exists)
- ✅ `saju_analyses` - Saju sessions (verify exists)

---

## Risk Assessment & Mitigation

### High Risk Items

**1. Payment Integration Complexity**
- **Risk**: Payment flow fails, double-charging, unlock logic fails
- **Mitigation**: Extensive testing in sandbox, idempotency keys, rollback logic
- **Owner**: Backend + Frontend team
- **Priority**: Critical

**2. Type System Consistency**
- **Risk**: Type mismatches between services cause runtime errors
- **Mitigation**: Strict TypeScript, comprehensive type tests, runtime validation
- **Owner**: Frontend team
- **Priority**: High

**3. Responsive Design Consistency**
- **Risk**: Components break on mobile/tablet
- **Mitigation**: Mobile-first development, test on real devices, responsive test suite
- **Owner**: Frontend team
- **Priority**: High

### Medium Risk Items

**4. Animation Performance**
- **Risk**: Framer Motion animations cause jank on low-end devices
- **Mitigation**: Performance profiling, lazy loading, animation throttling
- **Owner**: Frontend team
- **Priority**: Medium

**5. API Response Transformation**
- **Risk**: Backend response changes break classification logic
- **Mitigation**: Adapter pattern, schema validation, version API
- **Owner**: Full-stack team
- **Priority**: Medium

### Low Risk Items

**6. Content Duplication**
- **Risk**: Copy-paste errors between renaming and saju components
- **Mitigation**: Shared utilities, code review, DRY principles
- **Owner**: Development team
- **Priority**: Low

---

## Success Metrics

### Conversion Metrics
- **Free-to-Premium Conversion Rate**: Target >15%
- **Payment Completion Rate**: Target >80% (of initiated payments)
- **Average Time to Payment**: Target <5 minutes from results view

### Technical Metrics
- **Page Load Time**: FCP <1.5s, TTI <3s
- **Mobile Responsiveness**: 100% layout coverage across devices
- **Test Coverage**: >80% for all new code
- **Zero Critical Bugs**: In production for 2 weeks post-launch

### User Experience Metrics
- **Bounce Rate**: <40% on results page
- **Session Duration**: >3 minutes average
- **Accessibility Score**: Lighthouse >90

---

## Timeline Estimate

### Phase 1: Renaming Service
- **1.1-1.2**: Types & Classification - 2 hours
- **1.3-1.4**: Card Components - 4 hours
- **1.5-1.6**: CTA & Payment Modal - 3 hours
- **1.7**: Results Layout - 3 hours
- **1.8**: Route Integration - 3 hours
- **1.9**: Testing - 4 hours
- **Total Phase 1**: ~19 hours (2.5 days)

### Phase 2: Saju Service
- **2.1-2.2**: Types & Classification - 2.5 hours
- **2.3-2.4**: Card Components - 4 hours
- **2.5-2.6**: CTA & Payment Modal - 3 hours
- **2.7**: Results Layout - 3 hours
- **2.8**: Route Integration - 3 hours
- **2.9**: Testing - 4 hours
- **Total Phase 2**: ~19.5 hours (2.5 days)

### Buffer & Integration
- Cross-service testing: 2 hours
- Bug fixes and refinement: 4 hours
- Documentation: 2 hours
- **Total Buffer**: ~8 hours (1 day)

### **GRAND TOTAL**: ~46.5 hours (6 days for 1 developer)

---

## Next Steps

### Immediate Actions
1. ✅ Review this implementation plan
2. ✅ Validate assumptions with product/design team
3. ✅ Confirm database schema supports both services
4. ✅ Set up development branch: `feature/freemium-v2-renaming-saju`
5. ✅ Configure testing environment with TossPayments sandbox

### Implementation Order
1. **Phase 1**: Complete renaming service (days 1-3)
2. **Test Phase 1**: Validate renaming in staging (day 3)
3. **Phase 2**: Complete saju service (days 4-6)
4. **Test Phase 2**: Validate saju in staging (day 6)
5. **Integration Testing**: Cross-service validation (day 6-7)
6. **Production Deploy**: Staged rollout with monitoring (day 7)

### Review Gates
- ✅ Code review after each component
- ✅ Design review after each card component
- ✅ Product review after each results layout
- ✅ QA review before route integration
- ✅ Security review before production deploy

---

## Additional Notes

### Design System Consistency
All components should maintain visual consistency with:
- Naming freemium-v2 (reference implementation)
- Global color palette (emerald for free, yellow for premium)
- Typography scale from design system
- Spacing and layout grid

### Accessibility Requirements
- WCAG 2.1 AA compliance minimum
- Keyboard navigation support
- Screen reader optimization
- Focus management in modals
- Color contrast ratios >4.5:1

### Performance Optimization
- Lazy load components below fold
- Optimize images and animations
- Use React.memo for expensive renders
- Debounce/throttle user interactions
- Monitor Core Web Vitals

### Documentation
- Inline JSDoc comments for all exports
- README.md in each freemium-v2 folder
- Storybook stories for components
- API documentation for new endpoints

---

**END OF IMPLEMENTATION PLAN**

This comprehensive plan provides a structured approach to implementing freemium-v2 for both renaming and saju services, with detailed task breakdowns, validation criteria, and risk mitigation strategies.
