# Freemium V2 - Visual Timeline & Task Flow

**4-Day Implementation Timeline with Task Dependencies**

---

## 📅 DAY 1: Foundation Components (6 hours)

### Morning Session (3 hours) - 8:00 AM to 11:00 AM

```
08:00 ┌─────────────────────────────────────┐
      │ FV2-001: FreeNameCard Setup         │ 30 min
      │ • Create file                       │
      │ • Define props interface            │
      │ • Set up TypeScript                 │
08:30 └─────────────────────────────────────┘
      │
      ↓
08:30 ┌─────────────────────────────────────┐
      │ FV2-002: FreeNameCard Layout        │ 45 min
      │ • Card wrapper                      │
      │ • Header with rank badge            │
      │ • Name/hanja display                │
      │ • Score breakdown grid              │
      │ • Element badges                    │
09:15 └─────────────────────────────────────┘
      │
      ↓
09:15 ┌─────────────────────────────────────┐
      │ FV2-003: FreeNameCard Styling       │ 45 min
      │ • Green theme                       │
      │ • Animations (entrance, hover)      │
      │ • Responsive design                 │
      │ • Mobile testing                    │
10:00 └─────────────────────────────────────┘
      │
      ✓ FreeNameCard COMPLETE
      │
      ↓
10:00 ┌─────────────────────────────────────┐
      │ FV2-004: LockedNameCard Setup       │ 30 min
      │ • Create file                       │
      │ • Define props interface            │
10:30 └─────────────────────────────────────┘
      │
      ↓
10:30 ┌─────────────────────────────────────┐
      │ FV2-005: LockedNameCard Layout      │ 60 min
      │ • Card with premium styling         │
      │ • Blur effect implementation        │
      │   - Name/hanja: blur(8px)          │
      │   - Details: blur(4px)             │
      │   - Score: no blur (z-index: 20)   │
      │ • Lock icon badge                   │
11:30 └─────────────────────────────────────┘

☕ LUNCH BREAK: 11:30 AM - 12:30 PM
```

### Afternoon Session (3 hours) - 12:30 PM to 3:30 PM

```
12:30 ┌─────────────────────────────────────┐
      │ FV2-006: LockedNameCard Interaction │ 45 min
      │ • onClick handler                   │
      │ • Hover animations (scale, shadow)  │
      │ • Mobile tap animation              │
01:15 └─────────────────────────────────────┘
      │
      ↓
01:15 ┌─────────────────────────────────────┐
      │ FV2-007: LockedNameCard Styling     │ 30 min
      │ • Yellow/gold premium theme         │
      │ • Rank badges (special for top 3)  │
      │ • Responsive styling                │
01:45 └─────────────────────────────────────┘
      │
      ✓ LockedNameCard COMPLETE
      │
      ↓
01:45 ┌─────────────────────────────────────┐
      │ FV2-008: Layout Setup               │ 20 min
      │ • Create FreemiumResultsLayout.tsx  │
      │ • Define props interface            │
02:05 └─────────────────────────────────────┘
      │
      ↓
02:05 ┌─────────────────────────────────────┐
      │ FV2-009: Layout Structure           │ 45 min
      │ • Gradient background               │
      │ • Max-width container               │
      │ • Progress indicator (Step 3/3)     │
      │ • Loading skeleton                  │
      │ • Error state with retry            │
02:50 └─────────────────────────────────────┘
      │
      ↓
02:50 ┌─────────────────────────────────────┐
      │ FV2-010: Layout States & Styling    │ 30 min
      │ • Style loading/error/results       │
      │ • Test state transitions            │
03:20 └─────────────────────────────────────┘
      │
      ✓ FreemiumResultsLayout COMPLETE
      │
      ↓
03:20 ┌─────────────────────────────────────┐
      │ FV2-011: Create Component Index     │ 10 min
      │ • index.ts with all exports         │
03:30 └─────────────────────────────────────┘

✅ DAY 1 COMPLETE: 3 components built, all tested
```

---

## 📅 DAY 2: Conversion Components (7 hours)

### Morning Session (3.5 hours) - 8:00 AM to 11:30 AM

```
08:00 ┌─────────────────────────────────────┐
      │ FV2-012: FreemiumCTA Setup          │ 20 min
      │ • Create FreemiumCTA.tsx            │
      │ • Define props interface            │
08:20 └─────────────────────────────────────┘
      │
      ↓
08:20 ┌─────────────────────────────────────┐
      │ FV2-013: FreemiumCTA Content        │ 60 min
      │ • Card with gradient background     │
      │ • Lock icon (pulse animation)       │
      │ • Main headline with top score      │
      │ • Score difference display          │
      │ • Price: ₩99,000 → ₩69,000         │
      │ • Benefits list                     │
      │ • Large CTA button                  │
      │ • Trust signals                     │
09:20 └─────────────────────────────────────┘
      │
      ↓ (parallel work)
      ├────────────────────────────────────┐
      ↓                                    ↓
09:20 ┌──────────────────┐  ┌──────────────────┐
      │ FV2-014: CTA     │  │ FV2-015: CTA     │ 45 min each
      │ Gradient         │  │ Psychology       │
      │ Animation        │  │                  │
      │                  │  │ • Score anchoring│
      │ • Animated       │  │ • Contrast msgs  │
      │   gradient flow  │  │ • Scarcity       │
      │ • Lock pulse     │  │ • Value framing  │
      │ • Button hover   │  │ • Urgency        │
      │ • Entrance anim  │  │ • Social proof   │
10:05 └──────────────────┘  └──────────────────┘
      │                                    │
      └────────────────┬───────────────────┘
                       ↓
10:05 ┌─────────────────────────────────────┐
      │ FV2-016: FreemiumCTA Styling        │ 30 min
      │ • Gradient color scheme             │
      │ • CTA button styling                │
      │ • Responsive design                 │
      │ • Mobile touch optimization         │
10:35 └─────────────────────────────────────┘
      │
      ✓ FreemiumCTA COMPLETE
      │
      ↓
10:35 ┌─────────────────────────────────────┐
      │ FV2-017: PaymentModal Setup         │ 30 min
      │ • Create FreemiumPaymentModal.tsx   │
      │ • Define props interface            │
      │ • Import Dialog component           │
11:05 └─────────────────────────────────────┘
      │
      ↓
11:05 ┌─────────────────────────────────────┐
      │ FV2-018: PaymentModal Structure     │ 25 min
      │ • Dialog wrapper                    │
      │ • Header with close button          │
      │ • Product summary section           │
11:30 └─────────────────────────────────────┘

☕ LUNCH BREAK: 11:30 AM - 12:30 PM
```

### Afternoon Session (3.5 hours) - 12:30 PM to 4:00 PM

```
12:30 ┌─────────────────────────────────────┐
      │ FV2-018 (continued)                 │ 35 min
      │ • Price display                     │
      │ • Benefits list                     │
      │ • TossPayments logo                 │
      │ • Primary CTA button                │
      │ • Cancel button                     │
      │ • Loading state overlay             │
01:05 └─────────────────────────────────────┘
      │
      ↓
01:05 ┌─────────────────────────────────────┐
      │ FV2-019: Payment API Integration    │ 90 min
      │ • Implement fetch to /api/payment   │
      │ • Handle API response               │
      │   - Extract checkoutUrl, orderId    │
      │ • Redirect to TossPayments          │
      │ • Loading state during API call     │
      │ • Close modal before redirect       │
      │ • Success callback implementation   │
02:35 └─────────────────────────────────────┘
      │
      ↓
02:35 ┌─────────────────────────────────────┐
      │ FV2-020: Payment Error Handling     │ 45 min
      │ • Try-catch around API call         │
      │ • Toast error notifications         │
      │ • Network failure handling          │
      │ • API error handling (400, 500)     │
      │ • Invalid sessionId handling        │
      │ • Retry mechanism                   │
      │ • Test all error scenarios          │
03:20 └─────────────────────────────────────┘
      │
      ↓
03:20 ┌─────────────────────────────────────┐
      │ FV2-021: PaymentModal Styling       │ 30 min
      │ • Modal container styling           │
      │ • Product summary layout            │
      │ • Gradient CTA button               │
      │ • Responsive design                 │
      │ • Mobile full-screen                │
03:50 └─────────────────────────────────────┘
      │
      ✓ FreemiumPaymentModal COMPLETE
      │
      ↓
03:50 ┌─────────────────────────────────────┐
      │ FV2-022: Update Component Index     │ 10 min
      │ • Export FreemiumCTA                │
      │ • Export FreemiumPaymentModal       │
04:00 └─────────────────────────────────────┘

✅ DAY 2 COMPLETE: 2 complex components built
```

---

## 📅 DAY 3: Route Integration (8 hours)

### Morning Session (4 hours) - 8:00 AM to 12:00 PM

```
08:00 ┌─────────────────────────────────────┐
      │ FV2-023: Route File Setup           │ 30 min
      │ • Create naming.freemium-v2.        │
      │   results.tsx                       │
      │ • Import all components             │
      │ • Import classification utilities   │
      │ • Define local types                │
08:30 └─────────────────────────────────────┘
      │
      ↓
08:30 ┌─────────────────────────────────────┐
      │ FV2-024: State Management Setup     │ 30 min
      │ • Set up 8 useState hooks           │
      │ • Extract URL params                │
      │ • useSearchParams setup             │
09:00 └─────────────────────────────────────┘
      │
      ↓
09:00 ┌─────────────────────────────────────┐
      │ FV2-025: API Integration            │ 90 min
      │ • useEffect for data fetching       │
      │ • Fetch from /api/naming/freemium   │
      │ • Handle Stage3Response             │
      │ • Transform to ScoredCandidate[]    │
      │ • Error handling                    │
      │ • Loading state management          │
      │ • Handle missing sessionId          │
10:30 └─────────────────────────────────────┘
      │
      ↓
10:30 ┌─────────────────────────────────────┐
      │ FV2-026: Classification Integration │ 45 min
      │ • Import classifyCandidates()       │
      │ • Import calculatePsychologicalM()  │
      │ • Call on fetched data              │
      │ • Store tiers in state              │
      │ • Calculate metrics                 │
      │ • Store metrics in state            │
11:15 └─────────────────────────────────────┘
      │
      ↓
11:15 ┌─────────────────────────────────────┐
      │ FV2-027: Payment Success Handling   │ 30 min
      │ • useEffect for payment status      │
      │ • Check URL param payment=success   │
      │ • Set isPremium state               │
      │ • Show success toast                │
      │ • Handle failure case               │
11:45 └─────────────────────────────────────┘

☕ LUNCH BREAK: 11:45 AM - 12:45 PM
```

### Afternoon Session (4 hours) - 12:45 PM to 4:45 PM

```
12:45 ┌─────────────────────────────────────┐
      │ FV2-028: Free Names Section         │ 45 min
      │ • Section header "🎁 무료 체험"     │
      │ • Grid layout (2 cols desktop)      │
      │ • Map over tiers.free               │
      │ • Render FreeNameCard x2            │
      │ • Pass rank 11, 12                  │
01:30 └─────────────────────────────────────┘
      │
      ↓
01:30 ┌─────────────────────────────────────┐
      │ FV2-029: Premium CTA Section        │ 30 min
      │ • Conditional render (!isPremium)   │
      │ • Render FreemiumCTA                │
      │ • Pass metrics prop                 │
      │ • onPayment opens modal             │
02:00 └─────────────────────────────────────┘
      │
      ↓
02:00 ┌─────────────────────────────────────┐
      │ FV2-030: Locked Names Section       │ 60 min
      │ • Section header "🔒 프리미엄"       │
      │ • Conditional render (!isPremium)   │
      │ • Grid layout (2 cols desktop)      │
      │ • Map over tiers.locked             │
      │ • Render LockedNameCard x10         │
      │ • Pass rank 1-10                    │
      │ • onClick opens modal               │
03:00 └─────────────────────────────────────┘
      │
      ↓
03:00 ┌─────────────────────────────────────┐
      │ FV2-031: Unlocked Premium Section   │ 45 min
      │ • Section header "✨ 프리미엄"       │
      │ • Conditional render (isPremium)    │
      │ • Grid layout                       │
      │ • Map over tiers.locked             │
      │ • Render FreeNameCard x10           │
      │ • Pass rank 1-10                    │
03:45 └─────────────────────────────────────┘
      │
      ↓
03:45 ┌─────────────────────────────────────┐
      │ FV2-032: Payment Modal Integration  │ 45 min
      │ • Render FreemiumPaymentModal       │
      │ • Pass isOpen state                 │
      │ • onClose handler                   │
      │ • Pass sessionId                    │
      │ • Pass amount (69000)               │
      │ • Pass metrics                      │
      │ • onSuccess handler                 │
      │ • Test modal open/close             │
04:30 └─────────────────────────────────────┘
      │
      ↓
04:30 ┌─────────────────────────────────────┐
      │ FV2-033: Info Card Section          │ 15 min
      │ • Info Card with tips               │
      │ (LOW priority - optional)           │
04:45 └─────────────────────────────────────┘

✅ DAY 3 COMPLETE: Full route integrated and functional
```

### Evening (Optional) - 4:45 PM to 5:15 PM

```
04:45 ┌─────────────────────────────────────┐
      │ FV2-034: Layout Wrapper Integration │ 30 min
      │ • Wrap all in FreemiumResultsLayout │
      │ • Pass stage prop                   │
      │ • Pass sessionId, metrics           │
      │ • Test all 3 states                 │
      │ • Verify full page layout           │
05:15 └─────────────────────────────────────┘

✅ ROUTE INTEGRATION COMPLETE
```

---

## 📅 DAY 4: Testing & Polish (8 hours)

### Morning Session (4 hours) - 8:00 AM to 12:00 PM

```
08:00 ┌───────────────────────────────────────────────────┐
      │ UNIT TESTS (Parallel Work)                        │
      ├───────────────────────────────────────────────────┤
      │ FV2-035: FreeNameCard.test.tsx         │ 45 min  │
      │ FV2-036: LockedNameCard.test.tsx       │ 45 min  │
      │ FV2-037: FreemiumCTA.test.tsx          │ 45 min  │
      │ FV2-038: FreemiumPaymentModal.test.tsx │ 90 min  │
      │ FV2-039: FreemiumResultsLayout.test.tsx│ 30 min  │
      ├───────────────────────────────────────────────────┤
      │ Target: >80% coverage for each component          │
11:00 └───────────────────────────────────────────────────┘
      │
      ↓
11:00 ┌─────────────────────────────────────┐
      │ FV2-040: Integration Test           │ 60 min
      │ • Full flow: API → Classification   │
      │   → Rendering → Payment             │
      │ • Mock all API calls                │
      │ • Test success/failure paths        │
12:00 └─────────────────────────────────────┘

☕ LUNCH BREAK: 12:00 PM - 1:00 PM
```

### Afternoon Session (4 hours) - 1:00 PM to 5:00 PM

```
01:00 ┌─────────────────────────────────────┐
      │ FV2-041: E2E Test (Playwright)      │ 120 min
      │ • Navigate to results page          │
      │ • Verify free names visible         │
      │ • Verify locked names blurred       │
      │ • Click CTA                         │
      │ • Verify modal opens                │
      │ • Click payment button (mocked)     │
      │ • Verify success redirect           │
      │ • Verify premium names unlocked     │
      │ • Test mobile viewport              │
03:00 └─────────────────────────────────────┘
      │
      ↓
      │ (parallel work on quality testing)
      │
03:00 ┌────────────────────┬──────────────────┐
      │ FV2-042: Mobile    │ FV2-043:         │ 60 min
      │ Responsiveness     │ Performance      │ each
      │                    │ Optimization     │
      │ • iPhone SE (375px)│ • Lighthouse     │
      │ • iPhone 12 (390px)│ • Bundle size    │
      │ • iPad (768px)     │ • Animation perf │
      │ • Desktop (1024px+)│ • Core Web Vitals│
      │ • Touch targets    │ • Lazy loading   │
      │ • Font sizes       │                  │
04:00 └────────────────────┴──────────────────┘
      │                    │
      └──────────┬─────────┘
                 ↓
04:00 ┌──────────────────────────────────────┐
      │ FV2-044: Accessibility Testing       │ 60 min
      │ • Lighthouse accessibility audit     │
      │ • Keyboard navigation (Tab, Esc)     │
      │ • Screen reader (VoiceOver/NVDA)     │
      │ • ARIA labels                        │
      │ • Color contrast                     │
      │ • Focus indicators                   │
      │ Target: WCAG AA compliance           │
05:00 └──────────────────────────────────────┘

✅ DAY 4 COMPLETE: All tests passing
```

### Evening (1.5 hours) - 5:00 PM to 6:30 PM

```
05:00 ┌─────────────────────────────────────┐
      │ FV2-045: Cross-Browser Testing      │ 30 min
      │ • Chrome, Safari, Firefox, Edge     │
      │ • Verify blur effects               │
      │ • Check animations                  │
05:30 └─────────────────────────────────────┘
      │
      ↓
05:30 ┌─────────────────────────────────────┐
      │ FV2-046: Error Handling Validation  │ 45 min
      │ • Missing sessionId                 │
      │ • API failure (500)                 │
      │ • Network failure                   │
      │ • Invalid API response              │
      │ • Payment API failure               │
      │ • Test all error messages           │
06:15 └─────────────────────────────────────┘
      │
      ↓
06:15 ┌─────────────────────────────────────┐
      │ FV2-047: Final QA & Bug Fixes       │ 60 min
      │ • Complete QA checklist             │
      │ • Fix discovered bugs               │
      │ • Verify all acceptance criteria    │
      │ • Test complete user journey        │
      │ • Check console (no errors)         │
      │ • Run linter                        │
      │ • TypeScript compilation            │
07:15 └─────────────────────────────────────┘

✅ READY FOR DEPLOYMENT
```

---

## 📅 DAY 5 (Optional): Documentation & Launch

### Morning Session (3 hours) - 8:00 AM to 11:00 AM

```
08:00 ┌─────────────────────────────────────┐
      │ FV2-048: Component Documentation    │ 45 min
      │ • Create README.md                  │
      │ • Document all components           │
      │ • Add usage examples                │
      │ • Document props                    │
08:45 └─────────────────────────────────────┘
      │
      ↓
08:45 ┌─────────────────────────────────────┐
      │ FV2-049: Integration Guide          │ 45 min
      │ • Create integration guide          │
      │ • Document API integration          │
      │ • Document payment flow             │
      │ • Add troubleshooting               │
09:30 └─────────────────────────────────────┘
      │
      ↓
09:30 ┌─────────────────────────────────────┐
      │ FV2-050: Analytics Setup            │ 30 min
      │ • Page view event                   │
      │ • CTA click event                   │
      │ • Locked card click event           │
      │ • Payment events                    │
10:00 └─────────────────────────────────────┘
      │
      ↓
10:00 ┌─────────────────────────────────────┐
      │ FV2-051: Monitoring Setup           │ 30 min
      │ • Set up Sentry error tracking      │
      │ • Configure performance monitoring  │
      │ • Set up critical error alerts      │
10:30 └─────────────────────────────────────┘
      │
      ↓
10:30 ┌─────────────────────────────────────┐
      │ FV2-052: Staging Deployment         │ 30 min
      │ • Deploy to staging                 │
      │ • Run smoke tests                   │
      │ • Test payment with test keys       │
      │ • Get stakeholder approval          │
11:00 └─────────────────────────────────────┘

☕ BREAK: 11:00 AM - 11:30 AM
```

### Deployment (30 minutes) - 11:30 AM to 12:00 PM

```
11:30 ┌─────────────────────────────────────┐
      │ FV2-053: Production Deployment      │ 30 min
      │ • Create deployment plan            │
      │ • Deploy to production              │
      │ • Run smoke tests                   │
      │ • Monitor error rates               │
      │ • Monitor performance               │
      │ • Announce launch                   │
12:00 └─────────────────────────────────────┘

🎉 LAUNCH COMPLETE!
```

---

## 🔀 Parallel Task Opportunities

### Day 1 Afternoon
Can work in parallel:
- **FV2-006** (LockedNameCard Interaction) + **FV2-008** (Layout Setup)
  - Different files, no dependencies

### Day 2 Morning
Can work in parallel:
- **FV2-014** (CTA Gradient Animation) + **FV2-015** (CTA Psychology)
  - Same file but different sections

### Day 3 Morning
Can work in parallel after FV2-026:
- **FV2-027** (Payment Success) + **FV2-028** (Free Names Section)
  - Independent features

### Day 4 Morning
Can work in parallel:
- **FV2-035, 036, 037, 039** (Unit tests)
  - Different test files, completely independent

### Day 4 Afternoon
Can work in parallel:
- **FV2-042** (Mobile) + **FV2-043** (Performance)
  - Different testing focuses

---

## 🎯 Critical Path Visualization

```
DAY 1
══════
FV2-001 → FV2-002 → FV2-003 ✓ FreeNameCard
FV2-004 → FV2-005 → FV2-006 → FV2-007 ✓ LockedNameCard

DAY 2
══════
FV2-017 → FV2-018 → FV2-019 → FV2-020 ✓ PaymentModal

DAY 3
══════
FV2-023 → FV2-024 → FV2-025 → FV2-026 ✓ Route Foundation
FV2-027 ✓ Payment Success
FV2-028 → FV2-029 → FV2-030 → FV2-031 ✓ UI Sections
FV2-032 → FV2-034 ✓ Integration Complete

DAY 4
══════
FV2-047 ✓ Final QA
FV2-052 → FV2-053 ✓ Deployment
```

**Total Critical Path**: 18 tasks

---

## 📊 Task Completion Tracking

### Progress Indicators

**Day 1**: `[▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░] 11/53 tasks (21%)`

**Day 2**: `[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░] 22/53 tasks (42%)`

**Day 3**: `[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 34/53 tasks (64%)`

**Day 4**: `[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 47/53 tasks (89%)`

**Day 5**: `[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 53/53 tasks (100%)`

---

## ⏱️ Time Tracking Template

### Daily Log Template

```markdown
## Date: ____________________

### Morning Session (___h ___m)
- [x] FV2-XXX: Task name (estimated vs actual)
  - Started: __:__
  - Completed: __:__
  - Notes:

### Afternoon Session (___h ___m)
- [ ] FV2-XXX: Task name
  - Started: __:__
  - Completed: __:__
  - Blockers:
  - Notes:

### Daily Summary
- Tasks completed: __/__ planned
- Time spent: __h __m
- Ahead/Behind schedule: __h
- Tomorrow's priorities:
  1.
  2.
  3.
```

---

## 🚦 Status Indicators

### Task Status Colors
- 🟢 **COMPLETE**: Task finished, tested, committed
- 🟡 **IN PROGRESS**: Currently working on this task
- 🔴 **BLOCKED**: Waiting on dependency or issue
- ⚪ **PENDING**: Not yet started

### Quality Gates
- ✅ **PASSED**: Meets all acceptance criteria
- ⚠️ **NEEDS WORK**: Partially complete
- ❌ **FAILED**: Does not meet criteria

---

## 📈 Velocity Tracking

### Expected Velocity
- **Day 1**: 11 tasks, 6 hours (1.8 tasks/hour)
- **Day 2**: 11 tasks, 7 hours (1.6 tasks/hour)
- **Day 3**: 12 tasks, 8 hours (1.5 tasks/hour)
- **Day 4**: 13 tasks, 8 hours (1.6 tasks/hour)

### Actual Velocity
```
Track actual completion rate to adjust timeline
```

---

**Document Created**: 2025-10-28
**Purpose**: Visual timeline for 4-day implementation
**Use for**: Daily progress tracking and time management
