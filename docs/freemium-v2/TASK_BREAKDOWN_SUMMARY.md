# Freemium V2 Task Breakdown Summary
**Quick Reference Guide for shrimp-task-manager Integration**

---

## Quick Stats
- **Total Tasks**: 36 granular subtasks
- **Total Estimated Time**: ~46.5 hours (6 days for 1 developer)
- **Phases**: 2 (Renaming + Saju)
- **Complexity**: High (multi-service, payment integration)

---

## PHASE 1: RENAMING SERVICE (19 hours)

### Module 1: Foundation (2h)
**Tasks:**
1. ✅ Create `/app/lib/renaming/types.ts`
   - Define `RenamingCandidate`, `RenamingScoredCandidate`
   - Define `RenamingFreemiumTiers`, `RenamingPsychologicalMetrics`
   - Complexity: Simple | Time: 30min

2. ✅ Create `/app/lib/renaming/classification.ts`
   - Implement `classifyRenamingCandidates()`
   - Implement `calculateRenamingMetrics()`
   - Implement utility functions (rank labels, value prop)
   - Complexity: Moderate | Time: 1.5h

### Module 2: Free Tier UI (2h)
**Tasks:**
3. ✅ Create `RenamingFreeCard.tsx`
   - Emerald theme, current→new name display
   - Score breakdown, improvement badge
   - Character click handlers, upgrade CTA
   - Animations: hover, stagger
   - Complexity: Moderate | Time: 2h

### Module 3: Premium Tier UI (2h)
**Tasks:**
4. ✅ Create `RenamingLockedCard.tsx`
   - Yellow premium theme, dual-layer blur
   - Visible score + improvement, blurred content
   - Lock icon, click handler for payment
   - Rank-based stagger animations
   - Complexity: Moderate | Time: 2h

### Module 4: Conversion Components (3h)
**Tasks:**
5. ✅ Create `RenamingFreemiumCTA.tsx`
   - Improvement metrics display
   - Benefit list for renaming
   - Payment button with price
   - Complexity: Simple | Time: 1h

6. ✅ Create `RenamingFreemiumPaymentModal.tsx`
   - TossPayments integration
   - Customer info form
   - Loading/error states
   - Success callback with orderId
   - Complexity: Moderate | Time: 2h

### Module 5: Layout Integration (3h)
**Tasks:**
7. ✅ Create `RenamingFreemiumResultsLayout.tsx`
   - Orchestrate all components
   - Header with context, progress steps
   - Free section, CTA, locked section
   - Selection guide, payment modal integration
   - Complexity: High | Time: 3h

### Module 6: Route Integration (3h)
**Tasks:**
8. ✅ Update `/app/routes/renaming.tsx`
   - Import freemium-v2 components
   - Transform API responses to tiers
   - Calculate metrics
   - Handle payment success
   - Update step flow
   - Complexity: High | Time: 3h

### Module 7: Testing & Validation (4h)
**Tasks:**
9. ✅ Unit tests for `classification.ts`
10. ✅ Component tests for all cards
11. ✅ Integration tests for layout
12. ✅ Payment flow testing (sandbox)
13. ✅ Responsive design testing
14. ✅ Accessibility audit
15. ✅ Performance profiling
    - Complexity: High | Time: 4h total

---

## PHASE 2: SAJU COMPATIBILITY SERVICE (19.5 hours)

### Module 1: Foundation (2.5h)
**Tasks:**
16. ✅ Create `/app/lib/saju/compatibility-types.ts`
    - Define `CompatibilityResult`, `CompatibilityScoredResult`
    - Define `SajuFreemiumTiers`, `SajuPsychologicalMetrics`
    - Define `CompatibilityCategory` enum
    - Complexity: Simple | Time: 30min

17. ✅ Create `/app/lib/saju/compatibility-classification.ts`
    - Implement `classifyCompatibilityResults()`
    - Implement `calculateSajuMetrics()`
    - Implement utility functions
    - Complexity: Moderate | Time: 2h

### Module 2: Free Tier UI (2h)
**Tasks:**
18. ✅ Create `SajuFreeCard.tsx`
    - Emerald theme, compatibility score
    - Category breakdown with progress bars
    - Strengths/challenges lists
    - Upgrade CTA
    - Complexity: Moderate | Time: 2h

### Module 3: Premium Tier UI (2h)
**Tasks:**
19. ✅ Create `SajuLockedCard.tsx`
    - Yellow theme, dual-layer blur
    - Analysis type indicator (marriage, children, etc.)
    - Visible score, blurred details
    - Click handler for payment
    - Complexity: Moderate | Time: 2h

### Module 4: Conversion Components (3h)
**Tasks:**
20. ✅ Create `SajuFreemiumCTA.tsx`
    - Score metrics display
    - Benefit list for saju analyses
    - Payment button
    - Complexity: Simple | Time: 1h

21. ✅ Create `SajuFreemiumPaymentModal.tsx`
    - TossPayments integration
    - Couple names in header
    - Customer info form
    - Success callback
    - Complexity: Moderate | Time: 2h

### Module 5: Layout Integration (3h)
**Tasks:**
22. ✅ Create `SajuFreemiumResultsLayout.tsx`
    - Orchestrate all components
    - Header with couple names
    - Free section, CTA, locked section
    - Guide, payment modal
    - Complexity: High | Time: 3h

### Module 6: Route Integration (3h)
**Tasks:**
23. ✅ Update `/app/routes/saju.tsx`
    - Import freemium-v2 components
    - Generate multiple analysis types
    - Transform to tiers and metrics
    - Handle payment success
    - Update step flow
    - Complexity: High | Time: 3h

### Module 7: Testing & Validation (4h)
**Tasks:**
24. ✅ Unit tests for `compatibility-classification.ts`
25. ✅ Component tests for all cards
26. ✅ Integration tests for layout
27. ✅ Payment flow testing (sandbox)
28. ✅ Responsive design testing
29. ✅ Accessibility audit
30. ✅ Performance profiling
    - Complexity: High | Time: 4h total

---

## CROSS-CUTTING CONCERNS (8 hours)

### Payment Integration
**Tasks:**
31. ✅ Verify TossPayments integration works for both services
32. ✅ Test session ID tracking
33. ✅ Test success/error callbacks
    - Complexity: Medium | Time: 2h

### Database Schema
**Tasks:**
34. ✅ Verify `orders` table supports service_type field
35. ✅ Verify `renaming_analyses` table exists
36. ✅ Verify `saju_analyses` table exists
    - Complexity: Simple | Time: 1h

### Integration Testing
**Tasks:**
37. ✅ End-to-end flow testing (renaming)
38. ✅ End-to-end flow testing (saju)
39. ✅ Cross-browser testing
40. ✅ Production-like environment testing
    - Complexity: High | Time: 3h

### Documentation & Review
**Tasks:**
41. ✅ Add inline JSDoc comments
42. ✅ Create README.md files
43. ✅ Update API documentation
44. ✅ Code review and refinement
    - Complexity: Medium | Time: 2h

---

## Task Dependencies Map

```
PHASE 1 (Renaming):
1 (types) → 2 (classification)
2 → 3 (FreeCard), 4 (LockedCard), 5 (CTA)
2 → 6 (PaymentModal)
3, 4, 5, 6 → 7 (ResultsLayout)
7 → 8 (Route Integration)
8 → 9-15 (Testing)

PHASE 2 (Saju):
16 (types) → 17 (classification)
17 → 18 (FreeCard), 19 (LockedCard), 20 (CTA)
17 → 21 (PaymentModal)
18, 19, 20, 21 → 22 (ResultsLayout)
22 → 23 (Route Integration)
23 → 24-30 (Testing)

CROSS-CUTTING:
PHASE 1 complete → 31-33 (Payment)
PHASE 2 complete → 34-36 (Database)
All phases → 37-40 (Integration)
All phases → 41-44 (Documentation)
```

---

## Complexity Distribution

**Simple (6 tasks)**: 5h
- Types creation (2 tasks)
- CTA components (2 tasks)
- Database verification (1 task)
- Documentation (1 task)

**Moderate (14 tasks)**: 23h
- Classification logic (2 tasks)
- Card components (4 tasks)
- Payment modals (2 tasks)
- Integration testing (2 tasks)
- Payment verification (2 tasks)
- Refinement (2 tasks)

**High (8 tasks)**: 18.5h
- Results layouts (2 tasks)
- Route integrations (2 tasks)
- Testing suites (2 tasks)
- E2E testing (2 tasks)

---

## File Structure

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
│   ├── renaming/
│   │   └── freemium-v2/ (NEW FOLDER)
│   │       ├── RenamingFreeCard.tsx
│   │       ├── RenamingLockedCard.tsx
│   │       ├── RenamingFreemiumCTA.tsx
│   │       ├── RenamingFreemiumPaymentModal.tsx
│   │       ├── RenamingFreemiumResultsLayout.tsx
│   │       └── index.ts
│   │
│   ├── saju/
│   │   └── freemium-v2/ (NEW FOLDER)
│   │       ├── SajuFreeCard.tsx
│   │       ├── SajuLockedCard.tsx
│   │       ├── SajuFreemiumCTA.tsx
│   │       ├── SajuFreemiumPaymentModal.tsx
│   │       ├── SajuFreemiumResultsLayout.tsx
│   │       └── index.ts
│   │
│   └── naming/
│       └── freemium-v2/ (REFERENCE)
│
└── routes/
    ├── renaming.tsx (UPDATE)
    └── saju.tsx (UPDATE)
```

---

## Validation Checklist (Per Task)

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] No console.log statements
- [ ] Error boundaries in place

### Testing
- [ ] Unit tests written and passing
- [ ] Component tests written and passing
- [ ] Integration tests passing
- [ ] Manual testing completed
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
- [ ] Core Web Vitals acceptable
- [ ] Memory leaks checked

### Documentation
- [ ] JSDoc comments added
- [ ] README updated if needed
- [ ] Props interface documented
- [ ] Examples provided
- [ ] Edge cases noted

---

## Quick Start Commands

```bash
# Create new branch
git checkout -b feature/freemium-v2-renaming-saju

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Build
npm run build
```

---

## shrimp-task-manager Integration Format

If using shrimp-task-manager MCP, tasks can be imported with this schema:

```json
{
  "project": "Freemium V2 - Renaming & Saju",
  "phases": [
    {
      "name": "Phase 1: Renaming Service",
      "estimatedHours": 19,
      "tasks": [
        {
          "id": "R1.1",
          "name": "Create renaming types",
          "file": "/app/lib/renaming/types.ts",
          "complexity": "simple",
          "estimatedHours": 0.5,
          "dependencies": [],
          "validation": [
            "Types compile without errors",
            "Compatible with existing API",
            "Export structure documented"
          ]
        },
        // ... more tasks
      ]
    },
    {
      "name": "Phase 2: Saju Service",
      "estimatedHours": 19.5,
      "tasks": [
        // ... saju tasks
      ]
    }
  ]
}
```

---

## Risk Mitigation Strategies

### High Risk: Payment Integration
- **Strategy**: Test in sandbox extensively before production
- **Backup**: Manual unlock via admin panel if payment fails
- **Monitoring**: Alert on payment failures >5%

### High Risk: Type Mismatches
- **Strategy**: Runtime validation with zod schemas
- **Backup**: Graceful degradation to basic view
- **Monitoring**: Sentry error tracking

### Medium Risk: Animation Performance
- **Strategy**: Use will-change CSS, throttle animations
- **Backup**: Reduce animations on low-end devices
- **Monitoring**: Core Web Vitals tracking

---

## Success Criteria

### Technical
- ✅ All tests pass (>80% coverage)
- ✅ Type safety maintained (no `any` types)
- ✅ Performance benchmarks met (FCP <1.5s)
- ✅ Zero critical bugs in staging
- ✅ Accessibility score >90

### Business
- ✅ Free-to-premium conversion >15%
- ✅ Payment completion rate >80%
- ✅ Time to payment <5 minutes
- ✅ Bounce rate <40%
- ✅ User satisfaction >4/5

### UX
- ✅ Design review approved
- ✅ User testing positive feedback
- ✅ Mobile experience smooth
- ✅ Loading states clear
- ✅ Error recovery intuitive

---

**Ready to implement!** Start with Phase 1, Module 1 (foundation), and progress sequentially through the task list.
