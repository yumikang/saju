# Work Breakdown Structure (WBS)
## 4-Stage Naming Freemium Business Process Implementation

**Total Estimated Time**: 25-40 hours (2-3 days)
**Target Completion**: Week 1-2
**Priority**: High

---

## Phase 1: Core Development (Week 1) - 23 hours

### 1.1 Integrated API Development (6 hours)
**Priority**: P0 (Critical Path)
**Dependencies**: None
**Parallel Opportunity**: Can start immediately

#### 1.1.1 Set up /api/naming/freemium route handler (1h)
- **Task**: Create API route file and basic handler structure
- **Deliverables**:
  - `/app/api/naming/freemium/route.ts` created
  - Request validation schema defined
  - Stage parameter validation (1-4)
- **Dependencies**: None
- **Parallel**: ✅ Can run parallel with 1.2.1, 1.3.1
- **Acceptance Criteria**: Route responds to POST with stage parameter

#### 1.1.2 Implement stage-based routing logic (1.5h)
- **Task**: Create switch/case logic for different stages
- **Deliverables**:
  - Stage 1: Basic info collection
  - Stage 2: Additional preferences
  - Stage 3: Expert selection (dummy)
  - Stage 4: Results preview (3 names)
- **Dependencies**: 1.1.1
- **Parallel**: ❌ Sequential after 1.1.1
- **Acceptance Criteria**: Each stage returns appropriate response

#### 1.1.3 Integrate existing NamingPipeline (1.5h)
- **Task**: Connect NamingPipeline to new endpoint
- **Deliverables**:
  - Import existing pipeline
  - Adapt pipeline to work with new flow
  - Ensure 20-name generation capability
- **Dependencies**: 1.1.2
- **Parallel**: ❌ Sequential after 1.1.2
- **Acceptance Criteria**: Pipeline generates 20 names successfully

#### 1.1.4 Define unified response format (0.5h)
- **Task**: Create TypeScript interfaces for API responses
- **Deliverables**:
  - Response schema for each stage
  - Error response format
  - TypeScript types exported
- **Dependencies**: 1.1.1
- **Parallel**: ✅ Can run parallel with 1.1.2
- **Acceptance Criteria**: All responses follow consistent schema

#### 1.1.5 Implement error handling (1h)
- **Task**: Add comprehensive error handling
- **Deliverables**:
  - Try-catch blocks around critical sections
  - Custom error classes for different failures
  - User-friendly error messages
  - Error logging with context
- **Dependencies**: 1.1.3
- **Parallel**: ❌ Sequential after 1.1.3
- **Acceptance Criteria**: All error cases handled gracefully

#### 1.1.6 Add logging and monitoring (0.5h)
- **Task**: Implement request/response logging
- **Deliverables**:
  - Request logging middleware
  - Response time tracking
  - Stage transition events
- **Dependencies**: 1.1.5
- **Parallel**: ✅ Can run parallel with other tasks
- **Acceptance Criteria**: All API calls logged with metrics

---

### 1.2 Payment Flow Integration (4 hours)
**Priority**: P0 (Critical Path)
**Dependencies**: None initially
**Parallel Opportunity**: Can start database work immediately

#### 1.2.1 Set up NamingPayment database schema (1h)
- **Task**: Create database schema and migrations
- **Deliverables**:
  - Prisma schema for NamingPayment model
  - Migration files
  - Indexes for performance
- **Dependencies**: None
- **Parallel**: ✅ Can run parallel with 1.1.1, 1.3.1
- **Acceptance Criteria**: Database schema created and migrated

```prisma
model NamingPayment {
  id            String   @id @default(cuid())
  userId        String
  sessionId     String   @unique
  orderId       String   @unique
  amount        Int
  status        PaymentStatus
  paymentKey    String?
  unlocked      Boolean  @default(false)
  nameResults   Json     // Store 20 names
  createdAt     DateTime @default(now())
  paidAt        DateTime?

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([orderId])
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  CANCELLED
}
```

#### 1.2.2 Create /api/payment/naming endpoint (1h)
- **Task**: Build payment initiation endpoint
- **Deliverables**:
  - Payment request handler
  - TossPayments integration (reuse existing)
  - Generate orderId and store session
- **Dependencies**: 1.2.1
- **Parallel**: ❌ Sequential after 1.2.1
- **Acceptance Criteria**: Payment URL generated successfully

#### 1.2.3 Update webhook handler (1.5h)
- **Task**: Extend existing webhook for naming payments
- **Deliverables**:
  - Handle naming payment confirmations
  - Update NamingPayment status
  - Trigger unlock logic
  - Send confirmation email (optional)
- **Dependencies**: 1.2.2
- **Parallel**: ❌ Sequential after 1.2.2
- **Acceptance Criteria**: Webhook processes naming payments correctly

#### 1.2.4 Implement unlock logic (0.5h)
- **Task**: Create unlock mechanism after payment
- **Deliverables**:
  - Set unlocked=true in database
  - Store full 20 names in nameResults
  - Return unlock confirmation
- **Dependencies**: 1.2.3
- **Parallel**: ❌ Sequential after 1.2.3
- **Acceptance Criteria**: Payment unlocks full name list

---

### 1.3 UI Integration (6 hours)
**Priority**: P0 (Critical Path)
**Dependencies**: API endpoints (can start layout independently)
**Parallel Opportunity**: Can build layout while API is being developed

#### 1.3.1 Create /naming/new route structure (0.5h)
- **Task**: Set up Next.js route and basic layout
- **Deliverables**:
  - `/app/naming/new/page.tsx` created
  - Basic layout structure
  - Metadata configured
- **Dependencies**: None
- **Parallel**: ✅ Can run parallel with 1.1.1, 1.2.1
- **Acceptance Criteria**: Route accessible and renders

#### 1.3.2 Build progress indicator component (1h)
- **Task**: Create stepper/progress component
- **Deliverables**:
  - Visual progress indicator (1/4, 2/4, etc.)
  - State management for current stage
  - Stage navigation logic
- **Dependencies**: 1.3.1
- **Parallel**: ✅ Can run parallel with 1.3.3
- **Acceptance Criteria**: Progress shows current stage visually

#### 1.3.3 Integrate Stage 1-4 components (2h)
- **Task**: Wire up existing components to new flow
- **Deliverables**:
  - Stage 1: Basic info form (reuse existing)
  - Stage 2: Preferences form
  - Stage 3: Expert selection (dummy UI)
  - Stage 4: Preview results (3 names)
- **Dependencies**: 1.3.1
- **Parallel**: ✅ Can run parallel with 1.3.2
- **Acceptance Criteria**: All stages render and collect data

#### 1.3.4 Wire up API endpoints (1.5h)
- **Task**: Connect frontend to backend APIs
- **Deliverables**:
  - API client functions
  - Form submission handlers
  - State management (React state/context)
  - Data persistence between stages
- **Dependencies**: 1.1.3, 1.3.3
- **Parallel**: ❌ Sequential after both dependencies
- **Acceptance Criteria**: Form data submits to API successfully

#### 1.3.5 Implement responsive layout (0.5h)
- **Task**: Mobile/tablet/desktop optimization
- **Deliverables**:
  - Tailwind responsive classes
  - Mobile-first design
  - Touch-friendly UI elements
- **Dependencies**: 1.3.3
- **Parallel**: ✅ Can run parallel with 1.3.4
- **Acceptance Criteria**: UI works on all screen sizes

#### 1.3.6 Add loading states and error UI (0.5h)
- **Task**: Implement loading spinners and error messages
- **Deliverables**:
  - Loading indicators during API calls
  - Error message display
  - Retry mechanisms
- **Dependencies**: 1.3.4
- **Parallel**: ❌ Sequential after 1.3.4
- **Acceptance Criteria**: Users see feedback for all states

---

### 1.4 Unlock Logic Implementation (4 hours)
**Priority**: P0 (Critical Path)
**Dependencies**: Payment flow and UI integration
**Parallel Opportunity**: Limited

#### 1.4.1 Implement payment verification (1h)
- **Task**: Check payment status on detail page
- **Deliverables**:
  - API endpoint to check unlock status
  - Query NamingPayment by sessionId/orderId
  - Return unlocked status and name count
- **Dependencies**: 1.2.4
- **Parallel**: ❌ Sequential after 1.2.4
- **Acceptance Criteria**: Verification correctly identifies paid users

#### 1.4.2 Build access control middleware (1h)
- **Task**: Protect detail routes based on payment
- **Deliverables**:
  - Middleware to check unlock status
  - Redirect to payment if not unlocked
  - Session-based access control
- **Dependencies**: 1.4.1
- **Parallel**: ❌ Sequential after 1.4.1
- **Acceptance Criteria**: Unpaid users redirected to payment

#### 1.4.3 Create 20-name display component (1.5h)
- **Task**: Build UI to show all 20 names after unlock
- **Deliverables**:
  - List/grid component for names
  - Name details display
  - Pagination or infinite scroll
  - Filtering/sorting options
- **Dependencies**: 1.4.2
- **Parallel**: ✅ Can start UI work earlier
- **Acceptance Criteria**: All 20 names displayed beautifully

#### 1.4.4 Implement PDF download (0.5h)
- **Task**: Add PDF export functionality (if needed)
- **Deliverables**:
  - PDF generation library integration
  - Download button
  - Formatted PDF with all names
- **Dependencies**: 1.4.3
- **Parallel**: ✅ Optional, can run parallel
- **Acceptance Criteria**: Users can download PDF report

---

### 1.5 E2E Testing (3 hours)
**Priority**: P1 (Important)
**Dependencies**: All core features
**Parallel Opportunity**: None (must be last)

#### 1.5.1 Set up E2E test environment (0.5h)
- **Task**: Configure Playwright/Cypress
- **Deliverables**:
  - Test framework installed
  - Test database setup
  - Mock payment provider
- **Dependencies**: None (infrastructure)
- **Parallel**: ✅ Can set up early
- **Acceptance Criteria**: Tests can run locally

#### 1.5.2 Write happy path test (1h)
- **Task**: Test complete user flow
- **Deliverables**:
  - Stage 1 → 2 → 3 → 4 flow test
  - Payment initiation test
  - Unlock verification test
  - Full 20-name access test
- **Dependencies**: 1.1.5, 1.3.6, 1.4.3
- **Parallel**: ❌ Sequential after features complete
- **Acceptance Criteria**: Happy path passes end-to-end

#### 1.5.3 Test payment sandbox (0.5h)
- **Task**: Validate TossPayments integration
- **Deliverables**:
  - Sandbox payment test cases
  - Webhook receipt verification
  - Status update validation
- **Dependencies**: 1.2.3
- **Parallel**: ✅ Can run parallel with 1.5.2
- **Acceptance Criteria**: Sandbox payments work correctly

#### 1.5.4 Test error scenarios (1h)
- **Task**: Validate error handling
- **Deliverables**:
  - Payment failure tests
  - Network error tests
  - Invalid input tests
  - Session timeout tests
- **Dependencies**: 1.5.2
- **Parallel**: ❌ Sequential after happy path
- **Acceptance Criteria**: All errors handled gracefully

---

## Phase 2: Launch Prep (Week 2) - 15 hours

### 2.1 Analytics Setup (4 hours)
**Priority**: P1 (Important)
**Dependencies**: Core features complete
**Parallel Opportunity**: Can run parallel with QA

#### 2.1.1 Define key events (1h)
- **Task**: Identify and document tracking events
- **Deliverables**:
  - Event taxonomy document
  - Event naming convention
  - Event properties schema
- **Key Events**:
  - `naming_freemium_start`
  - `naming_stage_1_complete`
  - `naming_stage_2_complete`
  - `naming_stage_3_complete`
  - `naming_stage_4_complete`
  - `naming_payment_initiated`
  - `naming_payment_success`
  - `naming_payment_failed`
  - `naming_unlock_accessed`
  - `naming_pdf_downloaded`
- **Dependencies**: None
- **Parallel**: ✅ Can run parallel with 2.3.1
- **Acceptance Criteria**: Event list documented

#### 2.1.2 Implement event tracking (1.5h)
- **Task**: Add analytics SDK and tracking calls
- **Deliverables**:
  - Analytics provider integration (GA4/Mixpanel/Amplitude)
  - Track calls at key points
  - User properties tracking
  - Custom dimensions
- **Dependencies**: 2.1.1
- **Parallel**: ❌ Sequential after 2.1.1
- **Acceptance Criteria**: Events firing correctly

#### 2.1.3 Set up conversion funnel (1h)
- **Task**: Create dashboard and funnels
- **Deliverables**:
  - Funnel visualization: Start → Stage 4 → Payment → Unlock
  - Drop-off analysis
  - Conversion rate tracking
- **Dependencies**: 2.1.2
- **Parallel**: ❌ Sequential after 2.1.2
- **Acceptance Criteria**: Funnel visible in analytics dashboard

#### 2.1.4 Configure alerts (0.5h)
- **Task**: Set up monitoring alerts
- **Deliverables**:
  - Payment failure rate alert
  - API error rate alert
  - Conversion drop alert
- **Dependencies**: 2.1.3
- **Parallel**: ✅ Can run parallel with other tasks
- **Acceptance Criteria**: Alerts configured and tested

---

### 2.2 Expert UI (Dummy) (3 hours)
**Priority**: P2 (Nice to have)
**Dependencies**: None (standalone)
**Parallel Opportunity**: Can run completely parallel

#### 2.2.1 Create expert listing page (1.5h)
- **Task**: Build /experts route with dummy data
- **Deliverables**:
  - `/app/experts/page.tsx` created
  - Dummy expert data (5-10 experts)
  - Grid/list layout
  - Search/filter UI (non-functional)
- **Dependencies**: None
- **Parallel**: ✅ Can run parallel with all tasks
- **Acceptance Criteria**: Expert list page renders

#### 2.2.2 Design expert profile cards (1h)
- **Task**: Create reusable expert card component
- **Deliverables**:
  - Expert card component
  - Photo, name, specialty, rating (dummy)
  - Responsive design
- **Dependencies**: 2.2.1
- **Parallel**: ✅ Can run parallel with 2.2.1
- **Acceptance Criteria**: Cards look professional

#### 2.2.3 Add consultation flow UI (0.5h)
- **Task**: Placeholder consultation booking
- **Deliverables**:
  - "Contact Expert" button
  - Modal with "Coming Soon" message
  - Email capture form (optional)
- **Dependencies**: 2.2.2
- **Parallel**: ❌ Sequential after 2.2.2
- **Acceptance Criteria**: CTA present but non-functional

---

### 2.3 QA & Deployment (8 hours)
**Priority**: P0 (Critical Path)
**Dependencies**: All features
**Parallel Opportunity**: QA and optimization can overlap

#### 2.3.1 Conduct QA testing (2h)
- **Task**: Comprehensive manual testing
- **Deliverables**:
  - Functional testing checklist
  - UI/UX testing
  - Cross-browser testing (Chrome, Safari, Firefox)
  - Mobile device testing
  - Bug report document
- **Dependencies**: All Phase 1 tasks
- **Parallel**: ✅ Can run parallel with 2.1.1
- **Acceptance Criteria**: All features tested, bugs documented

#### 2.3.2 Fix bugs (3h)
- **Task**: Address identified issues
- **Deliverables**:
  - Bug fixes committed
  - Regression tests added
  - Bug resolution notes
- **Dependencies**: 2.3.1
- **Parallel**: ❌ Sequential after 2.3.1
- **Acceptance Criteria**: All critical/high bugs fixed

#### 2.3.3 Performance optimization (1.5h)
- **Task**: Optimize bundle size and load time
- **Deliverables**:
  - Code splitting analysis
  - Image optimization
  - Lazy loading implementation
  - Bundle size reduction
- **Dependencies**: 2.3.2
- **Parallel**: ✅ Can run parallel with 2.3.2
- **Acceptance Criteria**: Lighthouse score > 90

#### 2.3.4 Set up production config (0.5h)
- **Task**: Configure production environment
- **Deliverables**:
  - Environment variables set
  - TossPayments production keys
  - Database connection strings
  - Analytics keys
- **Dependencies**: None (infrastructure)
- **Parallel**: ✅ Can run parallel with QA
- **Acceptance Criteria**: Production env ready

#### 2.3.5 Execute deployment (0.5h)
- **Task**: Deploy to production
- **Deliverables**:
  - Production build successful
  - Database migrations run
  - Deployment verification
  - Rollback plan documented
- **Dependencies**: 2.3.2, 2.3.3, 2.3.4
- **Parallel**: ❌ Sequential after all prep
- **Acceptance Criteria**: Site live in production

#### 2.3.6 Monitor post-deployment (0.5h)
- **Task**: Watch for issues after launch
- **Deliverables**:
  - Error monitoring dashboard
  - Real-time metrics tracking
  - User behavior observation
  - Hotfix readiness
- **Dependencies**: 2.3.5
- **Parallel**: ❌ Sequential after deployment
- **Acceptance Criteria**: No critical issues in first 24h

---

## Dependency Matrix

### Critical Path (Must be Sequential)
```
1.1.1 → 1.1.2 → 1.1.3 → 1.1.5 → 1.3.4 → 1.5.2 → 2.3.1 → 2.3.2 → 2.3.5 → 2.3.6
```

### Parallel Tracks (Can Run Simultaneously)

**Track A (API Development)**:
```
1.1.1 → 1.1.2 → 1.1.3 → 1.1.5 → 1.1.6
```

**Track B (Database & Payment)**:
```
1.2.1 → 1.2.2 → 1.2.3 → 1.2.4
```

**Track C (UI Development)**:
```
1.3.1 → 1.3.2 + 1.3.3 → (wait for 1.1.3) → 1.3.4 → 1.3.6
```

**Track D (Unlock Logic)**:
```
(wait for 1.2.4) → 1.4.1 → 1.4.2 → 1.4.3 + 1.4.4
```

**Track E (Analytics)**:
```
2.1.1 → 2.1.2 → 2.1.3 + 2.1.4
```

**Track F (Expert UI)**:
```
2.2.1 + 2.2.2 → 2.2.3
```

---

## Time Optimization Strategy

### Week 1 Parallelization Plan

**Day 1 (8h)**:
- **Morning (4h)**:
  - 1.1.1, 1.2.1, 1.3.1 (parallel) - 1h each
  - 1.1.2 - 1.5h
  - 1.1.4 - 0.5h
- **Afternoon (4h)**:
  - 1.1.3 - 1.5h
  - 1.2.2 - 1h
  - 1.3.2 + 1.3.3 (parallel) - 1h each

**Day 2 (8h)**:
- **Morning (4h)**:
  - 1.1.5 - 1h
  - 1.2.3 - 1.5h
  - 1.3.4 - 1.5h
- **Afternoon (4h)**:
  - 1.2.4 - 0.5h
  - 1.3.5 + 1.3.6 (parallel) - 0.5h each
  - 1.4.1 - 1h
  - 1.4.2 - 1h
  - 1.4.3 - 1.5h

**Day 3 (7h)**:
- **Morning (3h)**:
  - 1.4.4 - 0.5h
  - 1.5.1 - 0.5h
  - 1.5.2 + 1.5.3 (parallel) - 1h + 0.5h
  - 1.5.4 - 1h
- **Afternoon (4h)**:
  - Buffer for overruns
  - Code review
  - Documentation

### Week 2 Parallelization Plan

**Day 4 (8h)**:
- **Morning (4h)**:
  - 2.3.1 + 2.1.1 (parallel) - 2h + 1h
  - 2.1.2 - 1.5h
- **Afternoon (4h)**:
  - 2.3.2 - 3h
  - 2.1.3 - 1h

**Day 5 (7h)**:
- **Morning (3h)**:
  - 2.3.3 - 1.5h
  - 2.2.1 + 2.2.2 (parallel) - 1.5h + 1h
- **Afternoon (4h)**:
  - 2.2.3 - 0.5h
  - 2.3.4 - 0.5h
  - 2.3.5 - 0.5h
  - 2.3.6 - 0.5h
  - Final testing - 2h

---

## Risk Assessment

### High Risk Items
- **1.2.3 Webhook Handler**: Payment webhook failures could block unlock
  - **Mitigation**: Extensive sandbox testing, retry mechanism
- **1.3.4 API Wiring**: Complex state management could cause delays
  - **Mitigation**: Use proven state management pattern (React Context/Zustand)
- **2.3.2 Bug Fixes**: Unknown bugs could extend timeline
  - **Mitigation**: 3h buffer allocated, prioritize critical bugs

### Medium Risk Items
- **1.1.3 Pipeline Integration**: Existing code might need refactoring
  - **Mitigation**: Review existing code first, plan refactor if needed
- **1.5 E2E Testing**: Flaky tests could consume extra time
  - **Mitigation**: Focus on critical path, skip edge cases if needed

### Low Risk Items
- **2.2 Expert UI**: Dummy pages, low complexity
- **2.1 Analytics**: Standard integration, well-documented

---

## Success Metrics

### Technical Metrics
- ✅ API response time < 500ms (p95)
- ✅ Payment success rate > 95%
- ✅ Unlock access time < 2 seconds
- ✅ Zero critical bugs in production
- ✅ Lighthouse performance score > 90

### Business Metrics
- 📊 Stage 1 → 4 conversion rate > 60%
- 📊 Stage 4 → Payment conversion rate > 20%
- 📊 Payment success rate > 95%
- 📊 User satisfaction (NPS) > 8/10

### Development Metrics
- 🎯 On-time delivery (Week 1-2)
- 🎯 Code coverage > 80%
- 🎯 Zero regressions after deployment
- 🎯 < 5 post-launch hotfixes needed

---

## Resource Allocation

### Developer Hours Breakdown
| Phase | Hours | % of Total |
|-------|-------|-----------|
| API Development | 6 | 15.8% |
| Payment Integration | 4 | 10.5% |
| UI Integration | 6 | 15.8% |
| Unlock Logic | 4 | 10.5% |
| E2E Testing | 3 | 7.9% |
| Analytics | 4 | 10.5% |
| Expert UI | 3 | 7.9% |
| QA & Deployment | 8 | 21.1% |
| **Total** | **38** | **100%** |

### Estimated Completion
- **Optimistic**: 25 hours (aggressive parallelization)
- **Realistic**: 30-35 hours (some delays)
- **Pessimistic**: 40 hours (significant bugs/refactoring)

---

## Next Steps

1. **Immediate**: Start Track A, B, C in parallel on Day 1
2. **Review existing code**: Validate NamingPipeline integration complexity
3. **Set up environments**: Ensure dev/staging/production ready
4. **Confirm TossPayments**: Verify sandbox access and credentials
5. **Team alignment**: Review WBS with stakeholders

---

## Notes

- **Reusable Components**: Leverage existing naming components where possible
- **Code Quality**: Maintain test coverage throughout development
- **Documentation**: Update API docs and user guides as you build
- **Rollback Plan**: Keep previous version ready for quick rollback
- **Communication**: Daily standups to track progress and blockers
