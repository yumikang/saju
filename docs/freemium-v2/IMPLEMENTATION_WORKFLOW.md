# Freemium V2 Implementation Workflow
**Visual Guide for Task Execution**

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FREEMIUM V2 PROJECT                      │
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   PHASE 1: RENAMING  │  →   │   PHASE 2: SAJU      │   │
│  │   (19 hours)         │      │   (19.5 hours)       │   │
│  └──────────────────────┘      └──────────────────────┘   │
│                                                             │
│           ↓                               ↓                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CROSS-CUTTING INTEGRATION (8 hours)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Renaming Service Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENAMING SERVICE                        │
└─────────────────────────────────────────────────────────────────┘

STEP 1: FOUNDATION (2h)
┌──────────────────┐
│ Create types.ts  │ → Define interfaces for candidates, tiers, metrics
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────┐
│ Create classification.ts     │ → Implement tier splitting (11-12 free, 1-10 locked)
└────────┬─────────────────────┘ → Calculate conversion metrics
         │
         ↓
┌──────────────────────────────┐
│ Unit tests for classification │ → Test tier logic, metric calculations
└────────┬─────────────────────┘
         │
         ↓ CHECKPOINT: Foundation solid, types working
         │

STEP 2: UI COMPONENTS (7h)
         │
    ┌────┴────┬────────────┬────────────────┐
    ↓         ↓            ↓                ↓
┌──────┐  ┌──────┐  ┌─────────┐  ┌────────────────┐
│ Free │  │Locked│  │   CTA   │  │ Payment Modal  │
│ Card │  │ Card │  │Component│  │   Component    │
└──┬───┘  └──┬───┘  └────┬────┘  └───────┬────────┘
   │         │           │                │
   │  Emerald│    Yellow │         Toss   │
   │  Theme  │    Theme  │      Payments  │
   │         │           │                │
   └─────────┴───────────┴────────────────┘
                    │
                    ↓ CHECKPOINT: All cards render correctly
                    │

STEP 3: LAYOUT INTEGRATION (3h)
                    │
                    ↓
┌───────────────────────────────────────────────┐
│   RenamingFreemiumResultsLayout.tsx           │
│                                               │
│   ┌─────────────────────────────────────┐    │
│   │  Header + Progress Steps            │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Free Section (11-12위)            │    │
│   │  [FreeCard] [FreeCard]              │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Premium CTA                        │    │
│   │  "프리미엄 10개 이름 보기"          │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Locked Section (1-10위)           │    │
│   │  [🔒] [🔒] [🔒] ... (10개)         │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Selection Guide                    │    │
│   └─────────────────────────────────────┘    │
│                                               │
│   [Payment Modal - Hidden until triggered]   │
└───────────────────────────────────────────────┘
                    │
                    ↓ CHECKPOINT: Layout orchestrates all components
                    │

STEP 4: ROUTE INTEGRATION (3h)
                    │
                    ↓
┌───────────────────────────────────────────────┐
│   /app/routes/renaming.tsx                    │
│                                               │
│   Current Flow:                               │
│   Input → Analysis → Results → Experts       │
│                                               │
│   Updated Flow:                               │
│   Input → Analysis → Freemium Results        │
│                      (with payment gate)      │
│                                               │
│   Changes:                                    │
│   - Import freemium-v2 components             │
│   - Classify API responses into tiers        │
│   - Calculate metrics for conversion         │
│   - Replace RenamingResults with              │
│     RenamingFreemiumResultsLayout            │
│   - Handle payment success → unlock          │
└───────────────────────────────────────────────┘
                    │
                    ↓ CHECKPOINT: Route working end-to-end
                    │

STEP 5: TESTING & VALIDATION (4h)
                    │
    ┌───────────────┼───────────────┬────────────────┐
    ↓               ↓               ↓                ↓
┌──────┐     ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Unit │     │Component │    │Integration│   │ Payment  │
│Tests │     │  Tests   │    │   Tests   │   │  Flow    │
└──┬───┘     └────┬─────┘    └─────┬─────┘   └────┬─────┘
   │              │                │               │
   └──────────────┴────────────────┴───────────────┘
                    │
                    ↓ CHECKPOINT: All tests green, payment sandbox works
                    │
                    ↓ PHASE 1 COMPLETE ✅
```

---

## Phase 2: Saju Service Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SAJU COMPATIBILITY SERVICE                 │
└─────────────────────────────────────────────────────────────────┘

STEP 1: FOUNDATION (2.5h)
┌────────────────────────────────┐
│ Create compatibility-types.ts  │ → CompatibilityResult, Tiers, Metrics
└────────┬───────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│ Create compatibility-classification.ts  │ → Classify analysis types
└────────┬────────────────────────────────┘ → Calculate saju metrics
         │
         ↓
┌──────────────────────────────┐
│ Unit tests for classification │
└────────┬─────────────────────┘
         │
         ↓ CHECKPOINT: Saju foundation ready
         │

STEP 2: UI COMPONENTS (7h)
         │
    ┌────┴────┬────────────┬────────────────┐
    ↓         ↓            ↓                ↓
┌──────┐  ┌──────┐  ┌─────────┐  ┌────────────────┐
│ Saju │  │ Saju │  │  Saju   │  │ Saju Payment   │
│ Free │  │Locked│  │   CTA   │  │     Modal      │
│ Card │  │ Card │  │         │  │                │
└──┬───┘  └──┬───┘  └────┬────┘  └───────┬────────┘
   │         │           │                │
   │  Basic  │   Deep    │      Couple    │
   │  Compat │  Analysis │      Context   │
   │         │           │                │
   └─────────┴───────────┴────────────────┘
                    │
                    ↓ CHECKPOINT: Saju cards work
                    │

STEP 3: LAYOUT INTEGRATION (3h)
                    │
                    ↓
┌───────────────────────────────────────────────┐
│   SajuFreemiumResultsLayout.tsx               │
│                                               │
│   ┌─────────────────────────────────────┐    │
│   │  Header (Couple Names)              │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Free Section                       │    │
│   │  Basic Compatibility Overview       │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Premium CTA                        │    │
│   │  "상세 분석 10가지 보기"           │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Locked Section                     │    │
│   │  🔒 Marriage  🔒 Children           │    │
│   │  🔒 Business  🔒 Financial          │    │
│   │  🔒 Health    🔒 Career ... (10개)  │    │
│   └─────────────────────────────────────┘    │
│   ┌─────────────────────────────────────┐    │
│   │  Compatibility Guide                │    │
│   └─────────────────────────────────────┘    │
└───────────────────────────────────────────────┘
                    │
                    ↓ CHECKPOINT: Layout complete
                    │

STEP 4: ROUTE INTEGRATION (3h)
                    │
                    ↓
┌───────────────────────────────────────────────┐
│   /app/routes/saju.tsx                        │
│                                               │
│   Current Flow:                               │
│   Input → Analysis → Results → Experts       │
│                                               │
│   Updated Flow:                               │
│   Input → Analysis → Freemium Results        │
│                      (with payment gate)      │
│                                               │
│   Changes:                                    │
│   - Import saju freemium-v2 components        │
│   - Generate multiple analysis types         │
│   - Classify into tiers                      │
│   - Calculate metrics                        │
│   - Replace with SajuFreemiumResultsLayout   │
│   - Handle payment success                   │
└───────────────────────────────────────────────┘
                    │
                    ↓ CHECKPOINT: Saju route working
                    │

STEP 5: TESTING & VALIDATION (4h)
                    │
    ┌───────────────┼───────────────┬────────────────┐
    ↓               ↓               ↓                ↓
┌──────┐     ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Unit │     │Component │    │Integration│   │ Payment  │
│Tests │     │  Tests   │    │   Tests   │   │  Flow    │
└──┬───┘     └────┬─────┘    └─────┬─────┘   └────┬─────┘
   │              │                │               │
   └──────────────┴────────────────┴───────────────┘
                    │
                    ↓ CHECKPOINT: Saju tests pass
                    │
                    ↓ PHASE 2 COMPLETE ✅
```

---

## Cross-Cutting Integration Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  CROSS-CUTTING INTEGRATION                      │
└─────────────────────────────────────────────────────────────────┘

PHASE 1 ✅ + PHASE 2 ✅
         │
         ↓
┌─────────────────────────────────────────┐
│   Payment System Verification (2h)      │
│                                         │
│   ✓ TossPayments works for both        │
│   ✓ Session ID tracking correct        │
│   ✓ Order creation successful          │
│   ✓ Success/error callbacks fire       │
│   ✓ Content unlock logic works         │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│   Database Schema Validation (1h)       │
│                                         │
│   ✓ orders table has service_type      │
│   ✓ renaming_analyses table exists     │
│   ✓ saju_analyses table exists         │
│   ✓ Foreign keys correct               │
│   ✓ Indexes optimized                  │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│   End-to-End Integration Tests (3h)     │
│                                         │
│   Renaming Flow:                        │
│   ├─ Input → Analysis → Results         │
│   ├─ View free names                    │
│   ├─ Click upgrade → Payment modal      │
│   ├─ Complete payment → Unlock          │
│   └─ View premium names                 │
│                                         │
│   Saju Flow:                            │
│   ├─ Input → Analysis → Results         │
│   ├─ View basic compatibility           │
│   ├─ Click upgrade → Payment modal      │
│   ├─ Complete payment → Unlock          │
│   └─ View detailed analyses             │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│   Documentation & Review (2h)           │
│                                         │
│   ✓ JSDoc comments complete             │
│   ✓ README files created                │
│   ✓ API docs updated                    │
│   ✓ Code review completed               │
│   ✓ Design review approved              │
└─────────────┬───────────────────────────┘
              │
              ↓
         ┌────┴────┐
         │ DEPLOY  │
         │ STAGING │
         └────┬────┘
              │
              ↓
         ┌────────────┐
         │ QA TESTING │
         │   (1-2d)   │
         └────┬───────┘
              │
              ↓
         ┌────┴─────┐
         │  DEPLOY  │
         │PRODUCTION│
         └──────────┘
```

---

## Detailed Component Flow: Renaming Example

```
┌─────────────────────────────────────────────────────────────────┐
│              RENAMING FREEMIUM FLOW (USER JOURNEY)              │
└─────────────────────────────────────────────────────────────────┘

USER INPUT
    │
    ├─ Current name: "철수" (哲洙)
    ├─ Birth date/time
    └─ Renaming reason
    │
    ↓
┌───────────────────────────┐
│  Backend Analysis         │
│  POST /api/renaming/      │
│       analyze-current     │
└───────────┬───────────────┘
            │ Returns: currentScore, problems, analysisId
            ↓
┌───────────────────────────┐
│  Display Current Analysis │
│  "현재 이름: 65점"        │
│  "개선 필요: 오행 불균형" │
└───────────┬───────────────┘
            │
            ↓
┌───────────────────────────┐
│  Backend Recommendations  │
│  POST /api/renaming/      │
│       recommend           │
└───────────┬───────────────┘
            │ Returns: Array of candidates
            ↓
┌───────────────────────────────────────────────┐
│  Classification Logic                         │
│                                               │
│  Input: 20 candidates                         │
│  Sort by score descending                     │
│                                               │
│  Tiers:                                       │
│  ├─ locked: candidates[0-9]   (1-10위)       │
│  ├─ free: candidates[10-11]   (11-12위)      │
│  └─ remaining: candidates[12+]               │
│                                               │
│  Metrics:                                     │
│  ├─ topScore: 88 (locked[0])                 │
│  ├─ currentScore: 65                         │
│  ├─ improvement: +23 points                  │
│  └─ conversionMessage: "23점 개선 가능!"     │
└───────────┬───────────────────────────────────┘
            │
            ↓
┌─────────────────────────────────────────────────────────────┐
│  FreemiumResultsLayout Render                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ HEADER                                               │  │
│  │ "개명 추천 결과"                                     │  │
│  │ "현재: 65점 → 최고: 88점 (+23점 개선)"              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ FREE SECTION (11-12위)                              │  │
│  │ ┌───────────────────┐ ┌───────────────────┐         │  │
│  │ │ 11등: 김철민 (78점)│ │ 12등: 김영수 (76점)│         │  │
│  │ │ 🎁 무료 체험      │ │ 🎁 무료 체험      │         │  │
│  │ │ +13점 개선        │ │ +11점 개선        │         │  │
│  │ │ [전체 상세 표시] │ │ [전체 상세 표시] │         │  │
│  │ └───────────────────┘ └───────────────────┘         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PREMIUM CTA                                          │  │
│  │ "더 높은 점수의 이름을 확인하세요!"                  │  │
│  │ "1위 최고 점수: 88점 (현재보다 23점 개선)"           │  │
│  │ [프리미엄 10개 이름 보기 - ₩69,000]                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ LOCKED SECTION (1-10위)                             │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐              │  │
│  │ │🔒 1등 88점│ │🔒 2등 87점│ │🔒 3등 86점│ ...         │  │
│  │ │[블러 효과]│ │[블러 효과]│ │[블러 효과]│              │  │
│  │ │클릭하여  │ │클릭하여  │ │클릭하여  │              │  │
│  │ │확인하기  │ │확인하기  │ │확인하기  │              │  │
│  │ └──────────┘ └──────────┘ └──────────┘              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │
            ↓ USER CLICKS UPGRADE
            │
┌─────────────────────────────────────────────────────────────┐
│  Payment Modal Opens                                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 개명 프리미엄 이름 결제                              │  │
│  │                                                      │  │
│  │ 포함 내역:                                           │  │
│  │ ✓ 1-10위 최고 점수 이름 10개                        │  │
│  │ ✓ 각 이름 상세 분석                                 │  │
│  │ ✓ 법적 개명 절차 가이드                             │  │
│  │                                                      │  │
│  │ 결제 금액: ₩69,000                                  │  │
│  │                                                      │  │
│  │ [TossPayments Widget]                                │  │
│  │                                                      │  │
│  │ [결제하기]                                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │
            ↓ PAYMENT SUCCESS
            │
┌─────────────────────────────────────────────────────────────┐
│  Content Unlocked                                           │
│                                                             │
│  onPaymentSuccess(orderId) fires:                           │
│  ├─ Update local state: isPremium = true                   │
│  ├─ Record order in database                               │
│  ├─ Unlock premium content                                 │
│  └─ Show success toast                                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ UNLOCKED SECTION (1-10위) - Now Visible             │  │
│  │ ┌───────────────────┐ ┌───────────────────┐         │  │
│  │ │ 1등: 김도현 (88점) │ │ 2등: 김준혁 (87점) │         │  │
│  │ │ ✅ 프리미엄       │ │ ✅ 프리미엄       │         │  │
│  │ │ +23점 개선        │ │ +22점 개선        │         │  │
│  │ │ [전체 상세 표시] │ │ [전체 상세 표시] │         │  │
│  │ └───────────────────┘ └───────────────────┘         │  │
│  │ ... (10개 모두 표시)                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Coding & Theme Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                         THEME SYSTEM                            │
└─────────────────────────────────────────────────────────────────┘

FREE TIER (11-12위)
├─ Primary: Emerald-500  (#10b981)
├─ Light: Emerald-50     (#ecfdf5)
├─ Border: Emerald-200   (#a7f3d0)
├─ Shadow: Emerald-200   (rgba emerald shadow)
└─ Icon: Gift (Lucide)

PREMIUM TIER (1-10위)
├─ Primary: Yellow-500   (#eab308)
├─ Light: Yellow-50      (#fefce8)
├─ Border: Yellow-200    (#fef08a)
├─ Accent: Orange-500    (#f97316)
└─ Icon: Lock (Lucide)

CTA SECTION
├─ Gradient: Orange-500 → Yellow-500
├─ Background: Orange-50 (#fff7ed)
└─ Text: White on gradient

PAYMENT MODAL
├─ Background: White
├─ Overlay: Gray-900 (50% opacity)
├─ Border: Gray-200
└─ Button: Orange-500
```

---

## Key Decision Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     DECISION TREE                               │
└─────────────────────────────────────────────────────────────────┘

Q: Should we create shared base components for cards?
└─→ NO: Keep naming/renaming/saju components separate for flexibility
    Each service has unique data structures and requirements

Q: Should classification logic be shared?
└─→ YES: Create shared utilities in /lib/freemium/utils.ts
    But service-specific logic in service folders

Q: How to handle payment success?
└─→ Callback pattern: onPaymentSuccess(orderId)
    Parent component handles state update and content unlock
    Modal only handles payment flow

Q: Should we use Zustand for state?
└─→ NO: Use React useState in parent layout component
    Simpler for this use case, no need for global state

Q: How to structure tests?
└─→ Co-located: Each component has .test.tsx in same folder
    Shared test utils in __tests__/utils/
    Integration tests in __tests__/integration/

Q: Mobile-first or desktop-first?
└─→ MOBILE-FIRST: Most users on mobile
    Use Tailwind responsive classes: base = mobile, sm/md/lg = larger
```

---

## Critical Path Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                      CRITICAL PATH                              │
└─────────────────────────────────────────────────────────────────┘

The FASTEST path to working implementation:

DAY 1 (Renaming Foundation + Free Cards)
├─ Hour 1-2:   Types + Classification
├─ Hour 3-4:   RenamingFreeCard
├─ Hour 5-6:   Manual testing of free tier
└─ CHECKPOINT: Can see 11-12위 free names

DAY 2 (Renaming Premium + Payment)
├─ Hour 1-2:   RenamingLockedCard
├─ Hour 3-4:   CTA + PaymentModal
├─ Hour 5-6:   Payment flow testing
└─ CHECKPOINT: Payment works, unlocks content

DAY 3 (Renaming Integration + Testing)
├─ Hour 1-3:   ResultsLayout + Route Integration
├─ Hour 4-6:   Testing suite
└─ CHECKPOINT: Renaming complete end-to-end

DAY 4-6: REPEAT FOR SAJU
(Same pattern, should be faster with learned patterns)

CRITICAL SUCCESS FACTORS:
✓ Payment integration works (highest risk)
✓ Type system consistent (prevents bugs)
✓ Mobile responsive (user experience)
```

---

## Quick Reference Commands

```bash
# Development workflow
npm run dev              # Start dev server
npm run test:watch       # Run tests in watch mode
npm run typecheck:watch  # Type check on file changes

# Before committing
npm run lint             # Check for lint errors
npm run format           # Auto-format code
npm test                 # Run all tests
npm run typecheck        # Full type check

# Component testing
npm test RenamingFreeCard.test.tsx  # Test specific file
npm test -- --coverage               # With coverage report

# Build and deploy
npm run build            # Production build
npm run preview          # Preview production build
```

---

**Ready to implement!** Follow the workflow sequentially, validate at each checkpoint, and maintain the critical path for fastest delivery.
