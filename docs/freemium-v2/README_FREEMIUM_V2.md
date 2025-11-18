# Freemium V2 Implementation - Renaming & Saju Services

**Project Summary**: Apply proven freemium-v2 UI pattern from naming service to renaming and saju compatibility services.

---

## 📋 Quick Links

- **[Full Implementation Plan](./FREEMIUM_V2_IMPLEMENTATION_PLAN.md)** - Comprehensive technical specification (46.5 hours, 36 tasks)
- **[Task Breakdown Summary](./TASK_BREAKDOWN_SUMMARY.md)** - Quick reference guide with task list
- **[Implementation Workflow](./IMPLEMENTATION_WORKFLOW.md)** - Visual workflow diagrams and execution guide

---

## 🎯 Project Overview

### Objective
Implement freemium-v2 monetization pattern for two additional services:
1. **Renaming Service** (`/renaming`) - Name change recommendations
2. **Saju Compatibility Service** (`/saju`) - Couple compatibility analysis

### Core Pattern
- **11-12위**: Free preview tier (emerald theme)
- **1-10위**: Premium locked tier (yellow theme)
- **Payment**: TossPayments integration (₩69,000)
- **Backend**: Maintain existing logic, no breaking changes

### Reference Implementation
- **Source**: `/app/components/naming/freemium-v2/*`
- **Success Metrics**: Proven conversion rate, stable payment flow

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Total Tasks** | 36 subtasks |
| **Estimated Time** | 46.5 hours (6 days, 1 developer) |
| **Phases** | 2 main + 1 integration |
| **New Files** | ~14 component files |
| **Updated Files** | 2 route files |
| **Test Coverage** | Target >80% |
| **Complexity** | High |

---

## 🏗️ Architecture

### File Structure

```
/app
├── lib/
│   ├── renaming/
│   │   ├── types.ts (NEW)
│   │   └── classification.ts (NEW)
│   ├── saju/
│   │   ├── compatibility-types.ts (NEW)
│   │   └── compatibility-classification.ts (NEW)
│   └── freemium/
│       └── classification.ts (REFERENCE)
│
├── components/
│   ├── renaming/freemium-v2/ (NEW FOLDER)
│   │   ├── RenamingFreeCard.tsx
│   │   ├── RenamingLockedCard.tsx
│   │   ├── RenamingFreemiumCTA.tsx
│   │   ├── RenamingFreemiumPaymentModal.tsx
│   │   ├── RenamingFreemiumResultsLayout.tsx
│   │   └── index.ts
│   │
│   ├── saju/freemium-v2/ (NEW FOLDER)
│   │   ├── SajuFreeCard.tsx
│   │   ├── SajuLockedCard.tsx
│   │   ├── SajuFreemiumCTA.tsx
│   │   ├── SajuFreemiumPaymentModal.tsx
│   │   ├── SajuFreemiumResultsLayout.tsx
│   │   └── index.ts
│   │
│   └── naming/freemium-v2/ (REFERENCE)
│
└── routes/
    ├── renaming.tsx (UPDATE)
    └── saju.tsx (UPDATE)
```

---

## 🚀 Quick Start

### Prerequisites
- ✅ Node.js 18+
- ✅ npm or yarn
- ✅ TossPayments sandbox account
- ✅ Database schema supports service_type field

### Setup
```bash
# Clone and setup
git checkout -b feature/freemium-v2-renaming-saju

# Install dependencies (if needed)
npm install

# Start development
npm run dev

# Run tests
npm test -- --watch

# Type check
npm run typecheck
```

---

## 📅 Implementation Timeline

### Week 1: Phase 1 - Renaming Service

**Day 1-2: Foundation + Components (9h)**
- Create types and classification logic
- Build RenamingFreeCard (emerald theme)
- Build RenamingLockedCard (yellow theme)
- Unit tests for classification

**Day 2-3: Integration + Payment (7h)**
- Build FreemiumCTA and PaymentModal
- Create RenamingFreemiumResultsLayout
- Integrate with `/routes/renaming.tsx`
- Payment flow testing

**Day 3: Testing & Validation (4h)**
- Component tests
- Integration tests
- Payment sandbox testing
- Responsive design validation
- Accessibility audit

**✅ Checkpoint**: Renaming service complete, deployed to staging

### Week 2: Phase 2 - Saju Service

**Day 4-5: Foundation + Components (9.5h)**
- Create compatibility types and classification
- Build SajuFreeCard (emerald theme)
- Build SajuLockedCard (yellow theme)
- Unit tests for classification

**Day 5-6: Integration + Payment (7h)**
- Build SajuFreemiumCTA and PaymentModal
- Create SajuFreemiumResultsLayout
- Integrate with `/routes/saju.tsx`
- Payment flow testing

**Day 6: Testing & Validation (4h)**
- Component tests
- Integration tests
- Payment sandbox testing
- Cross-browser testing

**✅ Checkpoint**: Saju service complete, deployed to staging

### Week 2: Cross-Cutting Integration

**Day 6-7: Integration & Deploy (8h)**
- Payment system verification
- Database schema validation
- End-to-end integration tests
- Documentation and code review
- Staged production deployment

**✅ Checkpoint**: Both services live in production

---

## 🎨 Design System

### Color Themes

**Free Tier (11-12위)**
- Primary: `emerald-500` (#10b981)
- Light: `emerald-50` (#ecfdf5)
- Border: `emerald-200` (#a7f3d0)
- Icon: Gift (Lucide)

**Premium Tier (1-10위)**
- Primary: `yellow-500` (#eab308)
- Light: `yellow-50` (#fefce8)
- Border: `yellow-200` (#fef08a)
- Accent: `orange-500` (#f97316)
- Icon: Lock (Lucide)

**CTA Section**
- Gradient: `orange-500` → `yellow-500`
- Background: `orange-50` (#fff7ed)

### Component Patterns

**Card Layout**
```tsx
<Card>
  {/* Background gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-{color}-50 to-white" />

  {/* Content */}
  <div className="relative p-4 sm:p-5 lg:p-6">
    {/* Header with badges */}
    {/* Score display */}
    {/* Detailed breakdown */}
    {/* CTA button */}
  </div>
</Card>
```

**Blur Effect (Locked Cards)**
```tsx
{/* Layer 1: Background gradient */}
<div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50" />

{/* Layer 2: Blur overlay */}
<div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-10" />

{/* Layer 3: Visible score (z-20) */}
<div className="absolute top-0 right-16 z-20">
  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
    <span className="text-4xl font-bold">{score}</span>
  </div>
</div>

{/* Layer 4: Blurred content */}
<div style={{ filter: 'blur(8px)' }}>
  {/* Name, hanja, details */}
</div>

{/* Layer 5: CTA (z-20) */}
<div className="absolute bottom-4 z-20">
  <button>클릭하여 확인하기</button>
</div>
```

---

## 🔧 Technical Details

### Classification Algorithm

```typescript
// For both renaming and saju services
export function classifyCandidates(
  candidates: ScoredCandidate[]
): FreemiumTiers {
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return {
    locked: sorted.slice(0, 10),   // 1-10위 premium
    free: sorted.slice(10, 12),    // 11-12위 free
    remaining: sorted.slice(12),   // 13+ remaining
  };
}
```

### Payment Flow

```
User clicks upgrade
    ↓
Modal opens with TossPayments widget
    ↓
User completes payment
    ↓
TossPayments callback fires
    ↓
onPaymentSuccess(orderId) executes
    ↓
Update local state: isPremium = true
    ↓
Record order in database
    ↓
Unlock premium content (re-render)
    ↓
Show success toast
```

### State Management

```typescript
// In ResultsLayout component
const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
const [isPremium, setIsPremium] = useState(false);

const handlePaymentSuccess = (orderId: string) => {
  setIsPremium(true);
  setIsPaymentModalOpen(false);
  // Record order, show toast, etc.
  onPaymentSuccess?.(orderId);
};

// Conditionally render locked vs unlocked cards
{isPremium ? (
  <UnlockedCard candidate={candidate} />
) : (
  <LockedCard candidate={candidate} onClick={handlePaymentOpen} />
)}
```

---

## ✅ Validation Checklist

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] No console.log statements
- [ ] Error boundaries in place

### Testing
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Component tests passing
- [ ] Integration tests passing
- [ ] Payment sandbox flow tested
- [ ] Edge cases covered

### UX/Design
- [ ] Matches design system
- [ ] Responsive on mobile/tablet/desktop
- [ ] Animations smooth (60fps)
- [ ] Loading states clear
- [ ] Error states helpful

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus management correct
- [ ] Color contrast sufficient (4.5:1)
- [ ] ARIA labels present

### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Lazy loading where appropriate
- [ ] Core Web Vitals acceptable (FCP <1.5s, TTI <3s)
- [ ] Memory leaks checked

### Business
- [ ] Free-to-premium conversion tracked
- [ ] Payment completion rate monitored
- [ ] Bounce rate acceptable (<40%)
- [ ] Session duration tracked
- [ ] A/B testing ready (if needed)

---

## 🎯 Success Metrics

### Conversion Metrics
| Metric | Target |
|--------|--------|
| Free-to-Premium Conversion | >15% |
| Payment Completion Rate | >80% |
| Avg Time to Payment | <5 min |

### Technical Metrics
| Metric | Target |
|--------|--------|
| Page Load (FCP) | <1.5s |
| Time to Interactive (TTI) | <3s |
| Test Coverage | >80% |
| Lighthouse Score | >90 |

### User Experience
| Metric | Target |
|--------|--------|
| Bounce Rate | <40% |
| Session Duration | >3 min |
| Mobile Responsive | 100% |
| Accessibility Score | >90 |

---

## 🚨 Risk Assessment

### High Risk Items

**1. Payment Integration (Critical)**
- **Risk**: Payment fails, double-charging, unlock logic breaks
- **Mitigation**: Extensive sandbox testing, idempotency keys, rollback logic
- **Owner**: Full-stack team
- **Status**: Monitor closely

**2. Type System Consistency (High)**
- **Risk**: Type mismatches cause runtime errors
- **Mitigation**: Strict TypeScript, comprehensive tests, runtime validation
- **Owner**: Frontend team
- **Status**: Code review required

### Medium Risk Items

**3. Mobile Responsiveness (Medium)**
- **Risk**: Components break on small screens
- **Mitigation**: Mobile-first development, real device testing
- **Owner**: Frontend team
- **Status**: Test on multiple devices

**4. Animation Performance (Medium)**
- **Risk**: Animations cause jank on low-end devices
- **Mitigation**: Performance profiling, animation throttling
- **Owner**: Frontend team
- **Status**: Profile on target devices

---

## 📚 Reference Materials

### Internal Documentation
- [Naming Freemium V2 Implementation](./app/components/naming/freemium-v2/)
- [TossPayments Integration Guide](./app/lib/payment/toss-payments.ts)
- [Classification Patterns](./app/lib/freemium/classification.ts)

### External Resources
- [TossPayments SDK Docs](https://docs.tosspayments.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch: `feature/freemium-v2-renaming-saju`
2. Implement following task breakdown
3. Write tests for all new code
4. Run validation checklist
5. Create PR with detailed description
6. Code review required before merge

### Code Review Checklist
- [ ] All tests pass
- [ ] Type safety maintained
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Documentation complete
- [ ] No breaking changes

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: feat, fix, refactor, test, docs, style, chore

**Examples**:
```
feat(renaming): add FreemiumResultsLayout component

Implement main layout component orchestrating all freemium-v2 cards
for renaming service. Includes free section, CTA, locked section,
and payment modal integration.

Refs: #123
```

---

## 📞 Support & Questions

### Technical Questions
- **Frontend Lead**: Review component architecture
- **Backend Lead**: Verify API responses and database schema
- **Product Manager**: Clarify business requirements

### Testing Questions
- **QA Lead**: Review test coverage and edge cases
- **DevOps**: Configure staging environment

### Design Questions
- **Design Lead**: Verify theme consistency and UX flow

---

## 🎉 Launch Checklist

### Pre-Launch
- [ ] All development complete
- [ ] All tests passing
- [ ] Code review approved
- [ ] Design review approved
- [ ] QA testing complete
- [ ] Staging deployment successful
- [ ] Documentation complete

### Launch Day
- [ ] Production deployment
- [ ] Smoke tests passing
- [ ] Monitoring dashboards configured
- [ ] Analytics tracking verified
- [ ] Error alerting active
- [ ] Rollback plan ready

### Post-Launch
- [ ] Monitor conversion metrics (24h)
- [ ] Monitor error rates (24h)
- [ ] Collect user feedback
- [ ] Performance analysis
- [ ] A/B test results (if applicable)
- [ ] Iteration planning

---

## 📈 Monitoring & Analytics

### Key Events to Track
```javascript
// Free tier engagement
analytics.track('freemium_results_viewed', {
  service: 'renaming' | 'saju',
  freeCount: number,
  lockedCount: number,
});

// Conversion funnel
analytics.track('upgrade_cta_clicked', { service });
analytics.track('payment_modal_opened', { service });
analytics.track('payment_initiated', { service, amount });
analytics.track('payment_completed', { service, orderId });

// Content unlock
analytics.track('premium_content_unlocked', { service, orderId });
analytics.track('premium_content_viewed', { service, itemId });
```

### Dashboards
- **Conversion Funnel**: View → Click → Pay → Unlock
- **Payment Success Rate**: Initiated vs Completed
- **Revenue Tracking**: By service, by day
- **User Behavior**: Time to conversion, bounce rate

---

## 🔄 Iteration Plan

### Phase 1: Launch (Week 1-2)
- Deploy renaming and saju freemium-v2
- Monitor metrics and stability
- Collect initial user feedback

### Phase 2: Optimization (Week 3-4)
- A/B test CTA messaging
- Optimize payment flow UX
- Reduce bounce rate
- Improve conversion rate

### Phase 3: Enhancement (Month 2)
- Add more detailed analyses
- Improve mobile experience
- Add social proof elements
- Implement referral program

---

**Last Updated**: 2025-10-28
**Version**: 1.0
**Status**: Ready for Implementation

---

For detailed implementation instructions, see:
- **[Full Implementation Plan](./FREEMIUM_V2_IMPLEMENTATION_PLAN.md)**
- **[Task Breakdown Summary](./TASK_BREAKDOWN_SUMMARY.md)**
- **[Implementation Workflow](./IMPLEMENTATION_WORKFLOW.md)**
