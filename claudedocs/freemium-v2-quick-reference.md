# Freemium V2 - Quick Reference Guide

**Project Overview**: Build new freemium-v2 naming results system with 11-12위 free / 1-10위 premium model

---

## Quick Start: Day-by-Day Breakdown

### DAY 1: Foundation Components (6 hours)
**Goal**: Build the 3 foundational display components

#### Morning (3 hours):
1. **FreeNameCard** (2 hours)
   - File: `app/components/naming/freemium-v2/FreeNameCard.tsx`
   - Props: `candidate`, `rank`, `onCharacterClick?`
   - Features: Full name display, green theme, scores, element badges

2. **LockedNameCard - Part 1** (1 hour)
   - File: `app/components/naming/freemium-v2/LockedNameCard.tsx`
   - Props: `candidate`, `rank`, `scoreDifference`, `onClick`
   - Features: Blur effect (name=8px, details=4px), lock icon

#### Afternoon (3 hours):
3. **LockedNameCard - Part 2** (1.5 hours)
   - Features: Hover animations, click handler, premium styling

4. **FreemiumResultsLayout** (1.5 hours)
   - File: `app/components/naming/freemium-v2/FreemiumResultsLayout.tsx`
   - Props: `children`, `stage`, `sessionId?`, `metrics?`
   - Features: Loading/error/results states, gradient background

**End of Day 1 Checklist**:
- [ ] FreeNameCard renders and displays all data
- [ ] LockedNameCard shows blur effect correctly
- [ ] FreemiumResultsLayout handles all 3 states
- [ ] Components export from index.ts

---

### DAY 2: Conversion Components (7 hours)

**Goal**: Build the CTA and payment modal

#### Morning (3.5 hours):
1. **FreemiumCTA - Part 1** (1.5 hours)
   - File: `app/components/naming/freemium-v2/FreemiumCTA.tsx`
   - Props: `metrics`, `onPayment`
   - Features: Content structure, score display, benefits list

2. **FreemiumCTA - Part 2** (2 hours)
   - Features: Gradient animation, psychological triggers, styling

#### Afternoon (3.5 hours):
3. **FreemiumPaymentModal - Part 1** (2 hours)
   - File: `app/components/naming/freemium-v2/FreemiumPaymentModal.tsx`
   - Props: `isOpen`, `onClose`, `sessionId`, `amount`, `metrics`, `onSuccess?`
   - Features: Modal structure, product summary, price display

4. **FreemiumPaymentModal - Part 2** (1.5 hours)
   - Features: Payment API integration, error handling, loading states

**End of Day 2 Checklist**:
- [ ] FreemiumCTA displays dynamic metrics
- [ ] FreemiumCTA animations smooth
- [ ] FreemiumPaymentModal opens/closes
- [ ] Payment API integration works
- [ ] Error handling comprehensive

---

### DAY 3: Route Integration (8 hours)

**Goal**: Connect everything together in the main route

#### Morning (4 hours):
1. **Route Setup** (1 hour)
   - File: `app/routes/naming.freemium-v2.results.tsx`
   - Set up state management (8 state variables)
   - Extract URL params (sessionId, payment status)

2. **API Integration** (1.5 hours)
   - Fetch from `/api/naming/freemium`
   - Transform to ScoredCandidate[]
   - Error handling

3. **Classification Integration** (1.5 hours)
   - Use `classifyCandidates()` → FreemiumTiers
   - Use `calculatePsychologicalMetrics()` → PsychologicalMetrics
   - Store in state

#### Afternoon (4 hours):
4. **UI Sections** (2.5 hours)
   - Free names section (11-12위)
   - Premium CTA section
   - Locked names section (1-10위)
   - Unlocked premium section (after payment)
   - Info card section

5. **Payment Flow** (1 hour)
   - Payment modal integration
   - Success/failure handling
   - Premium unlock logic

6. **Layout Wrapper** (0.5 hours)
   - Wrap in FreemiumResultsLayout
   - Test all states (loading, error, results)

**End of Day 3 Checklist**:
- [ ] Route loads and displays recommendations
- [ ] Classification works (11-12 free, 1-10 locked)
- [ ] CTA opens payment modal
- [ ] Payment flow works end-to-end
- [ ] Premium names unlock after payment
- [ ] All error cases handled

---

### DAY 4: Testing & Polish (8 hours)

**Goal**: Comprehensive testing and bug fixes

#### Morning (4 hours):
1. **Unit Tests** (2.5 hours)
   - FreeNameCard.test.tsx (30 min)
   - LockedNameCard.test.tsx (30 min)
   - FreemiumCTA.test.tsx (30 min)
   - FreemiumPaymentModal.test.tsx (45 min)
   - FreemiumResultsLayout.test.tsx (15 min)
   - Target: >80% coverage

2. **Integration Tests** (1.5 hours)
   - Full flow from API to UI
   - Payment flow (mocked)
   - Success/failure paths

#### Afternoon (4 hours):
3. **E2E & Mobile Testing** (2 hours)
   - Playwright E2E test (1 hour)
   - Mobile responsiveness (1 hour)
   - Test on multiple devices

4. **Performance & Accessibility** (1 hour)
   - Lighthouse audit (Performance >90)
   - Accessibility audit (>95)
   - Core Web Vitals check

5. **Final QA** (1 hour)
   - Cross-browser testing
   - Error handling validation
   - Bug fixes
   - Code cleanup

**End of Day 4 Checklist**:
- [ ] All unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E test passes
- [ ] Mobile responsive verified
- [ ] Performance metrics good (Lighthouse >90)
- [ ] Accessibility compliant (>95)
- [ ] All bugs fixed
- [ ] Ready for deployment

---

## Component Files to Create

```
app/components/naming/freemium-v2/
├── FreeNameCard.tsx           (Day 1 AM)
├── LockedNameCard.tsx         (Day 1)
├── FreemiumResultsLayout.tsx  (Day 1 PM)
├── FreemiumCTA.tsx            (Day 2 AM/Afternoon)
├── FreemiumPaymentModal.tsx   (Day 2 Afternoon)
├── index.ts                   (Export all components)
└── __tests__/
    ├── FreeNameCard.test.tsx
    ├── LockedNameCard.test.tsx
    ├── FreemiumResultsLayout.test.tsx
    ├── FreemiumCTA.test.tsx
    └── FreemiumPaymentModal.test.tsx

app/routes/
└── naming.freemium-v2.results.tsx (Day 3)
```

---

## Key Props Interfaces

### FreeNameCard
```typescript
interface FreeNameCardProps {
  candidate: ScoredCandidate;
  rank: number;
  onCharacterClick?: (characterId: string) => void;
}
```

### LockedNameCard
```typescript
interface LockedNameCardProps {
  candidate: ScoredCandidate;
  rank: number;
  scoreDifference: number;
  onClick: () => void;
}
```

### FreemiumCTA
```typescript
interface FreemiumCTAProps {
  metrics: PsychologicalMetrics;
  onPayment: () => void;
}
```

### FreemiumPaymentModal
```typescript
interface FreemiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  amount: number;
  metrics: PsychologicalMetrics;
  onSuccess?: (paymentId: string) => void;
}
```

### FreemiumResultsLayout
```typescript
interface FreemiumResultsLayoutProps {
  children: React.ReactNode;
  stage: 'loading' | 'error' | 'results';
  sessionId?: string;
  metrics?: PsychologicalMetrics;
}
```

---

## Critical Imports

### From Existing Codebase:
```typescript
// Types
import { ScoredCandidate } from '~/lib/naming/types';
import {
  FreemiumTiers,
  PsychologicalMetrics,
  classifyCandidates,
  calculatePsychologicalMetrics,
  getRankLabel
} from '~/lib/freemium/classification';

// UI Components
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';

// Utilities
import { motion } from 'framer-motion';
import { Lock, Sparkles, TrendingUp, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
```

---

## API Endpoints

### Fetch Recommendations
```typescript
POST /api/naming/freemium
Body: { stage: 3, sessionId: string }
Response: {
  success: true,
  recommendations: NameRecommendation[],
  ...
}
```

### Create Payment
```typescript
POST /api/payment/naming
Body: {
  sessionId: string,
  amount: number,
  customerName?: string,
  customerEmail?: string
}
Response: {
  success: true,
  orderId: string,
  checkoutUrl: string
}
```

---

## Design Tokens Quick Reference

### Colors
```css
/* Free Tier */
green-500 (#10b981), green-100 (#d1fae5)

/* Premium Tier */
orange-500 (#f59e0b), yellow-400 (#fbbf24), yellow-100 (#fef3c7)

/* CTA Gradient */
linear-gradient(to right, #f59e0b, #ef4444)
```

### Blur Effects
```css
name/hanja: blur(8px)
score details: blur(4px)
overall score: no blur (z-index: 20)
CTA section: no blur (z-index: 20)
```

### Typography
```css
h1: text-4xl font-bold (36px)
h2: text-2xl font-bold (24px)
body: text-base (16px)
score-large: text-5xl font-bold (48px)
```

### Layout
```css
max-width: 1024px (max-w-4xl)
padding: py-12 px-4
gap: gap-6 (24px)
card-padding: p-6 (24px)
```

---

## Testing Checklist

### Unit Tests (All Components)
- [ ] Props render correctly
- [ ] Interactions work (clicks, hovers)
- [ ] Styling applied correctly
- [ ] Edge cases handled
- [ ] Coverage >80%

### Integration Tests
- [ ] API → Classification → Rendering
- [ ] Payment flow (mocked)
- [ ] Success/failure paths
- [ ] State management correct

### E2E Tests
- [ ] Full user journey
- [ ] Payment flow (mocked TossPayments)
- [ ] Mobile interactions
- [ ] Success redirect and unlock

### Quality Metrics
- [ ] Lighthouse Performance >90
- [ ] Lighthouse Accessibility >95
- [ ] LCP <2.5s
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] No console errors

---

## Common Issues & Solutions

### Issue: Blur effect not working
**Solution**: Verify `filter: blur()` CSS applied and z-index layering correct

### Issue: Payment modal not opening
**Solution**: Check state management and onClick handlers

### Issue: API returns empty
**Solution**: Verify sessionId valid and stages 1-2 completed

### Issue: Premium names not unlocking
**Solution**: Check URL param `?payment=success` and isPremium state

### Issue: Mobile layout broken
**Solution**: Verify grid responsive classes (grid-cols-1 md:grid-cols-2)

---

## Performance Optimization Tips

1. **Code Splitting**: Route-based splitting already handled by Remix
2. **Lazy Loading**: Use dynamic imports for heavy components if needed
3. **Animation Performance**: Use `transform` and `opacity` only for 60fps
4. **Bundle Size**: Keep main route bundle <50KB gzipped
5. **API Caching**: Consider caching recommendations in sessionStorage

---

## Deployment Steps

### Staging
1. Deploy to staging environment
2. Run smoke tests
3. Test payment flow with test keys
4. Get stakeholder approval

### Production
1. Create deployment plan
2. Deploy to production
3. Run smoke tests
4. Monitor error rates and performance
5. Announce to team

---

## Success Criteria

### Functional
- [x] Display 11-12위 names fully accessible
- [x] Display 1-10위 names with blur
- [x] Payment flow works end-to-end
- [x] Premium names unlock after payment

### Non-Functional
- [x] TypeScript type-safe
- [x] Mobile responsive
- [x] Lighthouse >90 performance
- [x] Accessibility WCAG AA
- [x] Test coverage >80%

### Business
- [x] Clear value proposition
- [x] Conversion optimized
- [x] Trust signals present
- [x] Price displayed prominently

---

**Quick Reference Version**: 1.0
**Created**: 2025-10-28
**Based On**: Sequential thinking plan + detailed task breakdown
**Use Case**: Daily development reference for rapid implementation
