# Naming Freemium - Dependency Graph

## Critical Path Visualization

```mermaid
graph TD
    Start([Project Start])

    %% Phase 1.1 - API Development
    A1[1.1.1 Route Setup<br/>1h]
    A2[1.1.2 Stage Routing<br/>1.5h]
    A3[1.1.3 Pipeline Integration<br/>1.5h]
    A4[1.1.4 Response Format<br/>0.5h]
    A5[1.1.5 Error Handling<br/>1h]
    A6[1.1.6 Logging<br/>0.5h]

    %% Phase 1.2 - Payment Flow
    B1[1.2.1 DB Schema<br/>1h]
    B2[1.2.2 Payment Endpoint<br/>1h]
    B3[1.2.3 Webhook Handler<br/>1.5h]
    B4[1.2.4 Unlock Logic<br/>0.5h]

    %% Phase 1.3 - UI Integration
    C1[1.3.1 Route Structure<br/>0.5h]
    C2[1.3.2 Progress Indicator<br/>1h]
    C3[1.3.3 Stage Components<br/>2h]
    C4[1.3.4 Wire APIs<br/>1.5h]
    C5[1.3.5 Responsive Layout<br/>0.5h]
    C6[1.3.6 Loading States<br/>0.5h]

    %% Phase 1.4 - Unlock Logic
    D1[1.4.1 Payment Verification<br/>1h]
    D2[1.4.2 Access Control<br/>1h]
    D3[1.4.3 20-Name Display<br/>1.5h]
    D4[1.4.4 PDF Download<br/>0.5h]

    %% Phase 1.5 - E2E Testing
    E1[1.5.1 Test Setup<br/>0.5h]
    E2[1.5.2 Happy Path<br/>1h]
    E3[1.5.3 Payment Sandbox<br/>0.5h]
    E4[1.5.4 Error Scenarios<br/>1h]

    %% Phase 2.1 - Analytics
    F1[2.1.1 Define Events<br/>1h]
    F2[2.1.2 Implement Tracking<br/>1.5h]
    F3[2.1.3 Funnel Setup<br/>1h]
    F4[2.1.4 Alerts<br/>0.5h]

    %% Phase 2.2 - Expert UI
    G1[2.2.1 Expert Listing<br/>1.5h]
    G2[2.2.2 Profile Cards<br/>1h]
    G3[2.2.3 Consultation Flow<br/>0.5h]

    %% Phase 2.3 - QA & Deployment
    H1[2.3.1 QA Testing<br/>2h]
    H2[2.3.2 Bug Fixes<br/>3h]
    H3[2.3.3 Performance<br/>1.5h]
    H4[2.3.4 Production Config<br/>0.5h]
    H5[2.3.5 Deploy<br/>0.5h]
    H6[2.3.6 Monitor<br/>0.5h]

    End([Launch Complete])

    %% Dependencies - Track A (API)
    Start --> A1
    A1 --> A2
    A1 --> A4
    A2 --> A3
    A3 --> A5
    A5 --> A6

    %% Dependencies - Track B (Payment)
    Start --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4

    %% Dependencies - Track C (UI)
    Start --> C1
    C1 --> C2
    C1 --> C3
    C2 -.parallel.-> C3
    A3 --> C4
    C3 --> C4
    C4 --> C6
    C3 --> C5
    C5 -.parallel.-> C6

    %% Dependencies - Track D (Unlock)
    B4 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4

    %% Dependencies - Track E (Testing)
    Start --> E1
    C6 --> E2
    D3 --> E2
    A5 --> E2
    B3 --> E3
    E2 -.parallel.-> E3
    E2 --> E4

    %% Dependencies - Track F (Analytics)
    E4 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4

    %% Dependencies - Track G (Expert UI)
    Start --> G1
    G1 -.parallel.-> G2
    G2 --> G3

    %% Dependencies - Track H (QA/Deploy)
    E4 --> H1
    F1 -.parallel.-> H1
    H1 --> H2
    H2 --> H3
    H2 --> H4
    H3 --> H5
    H4 --> H5
    H5 --> H6
    H6 --> End

    %% Styling
    classDef critical fill:#ff6b6b,stroke:#c92a2a,color:#fff
    classDef parallel fill:#51cf66,stroke:#2f9e44,color:#fff
    classDef independent fill:#74c0fc,stroke:#1c7ed6,color:#fff

    class A1,A2,A3,A5,C4,E2,H1,H2,H5,H6 critical
    class A4,C2,C3,C5,C6,E3,F1,G1,G2 parallel
    class A6,D4,E1,F4,G3,H3,H4 independent
```

## Parallel Execution Timeline

```mermaid
gantt
    title Naming Freemium Implementation Timeline
    dateFormat YYYY-MM-DD
    section Day 1
    1.1.1 Route Setup           :a1, 2025-10-28, 1h
    1.2.1 DB Schema             :b1, 2025-10-28, 1h
    1.3.1 Route Structure       :c1, 2025-10-28, 0.5h
    1.1.2 Stage Routing         :a2, after a1, 1.5h
    1.1.4 Response Format       :a4, after a1, 0.5h
    1.2.2 Payment Endpoint      :b2, after b1, 1h
    1.3.2 Progress Indicator    :c2, after c1, 1h
    1.3.3 Stage Components      :c3, after c1, 2h
    1.1.3 Pipeline Integration  :a3, after a2, 1.5h
    1.2.3 Webhook Handler       :b3, after b2, 1.5h
    1.1.5 Error Handling        :a5, after a3, 1h
    1.1.6 Logging               :a6, after a5, 0.5h

    section Day 2
    1.2.4 Unlock Logic          :b4, 2025-10-29, 0.5h
    1.3.4 Wire APIs             :c4, 2025-10-29, 1.5h
    1.3.5 Responsive Layout     :c5, after c4, 0.5h
    1.3.6 Loading States        :c6, after c4, 0.5h
    1.4.1 Payment Verification  :d1, after b4, 1h
    1.4.2 Access Control        :d2, after d1, 1h
    1.4.3 20-Name Display       :d3, after d2, 1.5h
    1.4.4 PDF Download          :d4, after d3, 0.5h

    section Day 3
    1.5.1 Test Setup            :e1, 2025-10-30, 0.5h
    1.5.2 Happy Path Test       :e2, after e1, 1h
    1.5.3 Payment Sandbox       :e3, after e1, 0.5h
    1.5.4 Error Scenarios       :e4, after e2, 1h
    Bug Fixes & Review          :milestone, 2025-10-30, 3h

    section Day 4
    2.1.1 Define Events         :f1, 2025-10-31, 1h
    2.3.1 QA Testing            :h1, 2025-10-31, 2h
    2.1.2 Implement Tracking    :f2, after f1, 1.5h
    2.1.3 Funnel Setup          :f3, after f2, 1h
    2.1.4 Alerts                :f4, after f3, 0.5h
    2.3.2 Bug Fixes             :h2, after h1, 3h

    section Day 5
    2.2.1 Expert Listing        :g1, 2025-11-01, 1.5h
    2.2.2 Profile Cards         :g2, 2025-11-01, 1h
    2.3.3 Performance           :h3, 2025-11-01, 1.5h
    2.2.3 Consultation Flow     :g3, after g2, 0.5h
    2.3.4 Production Config     :h4, after h3, 0.5h
    2.3.5 Deploy                :crit, milestone, after h4, 0.5h
    2.3.6 Monitor               :h6, after h4, 0.5h
```

## Task Dependency Matrix

| Task | Depends On | Can Run Parallel With | Blocks |
|------|------------|-----------------------|--------|
| 1.1.1 | None | 1.2.1, 1.3.1 | 1.1.2, 1.1.4 |
| 1.1.2 | 1.1.1 | 1.1.4, 1.2.x, 1.3.x | 1.1.3 |
| 1.1.3 | 1.1.2 | 1.2.x, 1.3.1-3 | 1.1.5, 1.3.4 |
| 1.1.4 | 1.1.1 | 1.1.2, 1.2.x, 1.3.x | - |
| 1.1.5 | 1.1.3 | 1.2.x, 1.3.x, 1.4.x | 1.1.6, 1.5.2 |
| 1.1.6 | 1.1.5 | All others | - |
| 1.2.1 | None | 1.1.1, 1.3.1 | 1.2.2 |
| 1.2.2 | 1.2.1 | 1.1.x, 1.3.x | 1.2.3 |
| 1.2.3 | 1.2.2 | 1.1.x, 1.3.x | 1.2.4, 1.5.3 |
| 1.2.4 | 1.2.3 | 1.3.x | 1.4.1 |
| 1.3.1 | None | 1.1.1, 1.2.1 | 1.3.2, 1.3.3 |
| 1.3.2 | 1.3.1 | 1.3.3, 1.1.x, 1.2.x | - |
| 1.3.3 | 1.3.1 | 1.3.2, 1.1.1-2, 1.2.x | 1.3.4, 1.3.5 |
| 1.3.4 | 1.1.3, 1.3.3 | - | 1.3.6, 1.5.2 |
| 1.3.5 | 1.3.3 | 1.3.6 | - |
| 1.3.6 | 1.3.4 | 1.3.5 | 1.5.2 |
| 1.4.1 | 1.2.4 | - | 1.4.2 |
| 1.4.2 | 1.4.1 | - | 1.4.3 |
| 1.4.3 | 1.4.2 | 1.4.4 | 1.5.2 |
| 1.4.4 | 1.4.3 | - | - |
| 1.5.1 | None | All others | - |
| 1.5.2 | 1.1.5, 1.3.6, 1.4.3 | 1.5.3 | 1.5.4 |
| 1.5.3 | 1.2.3 | 1.5.2 | - |
| 1.5.4 | 1.5.2 | - | 2.1.1, 2.3.1 |
| 2.1.1 | 1.5.4 | 2.3.1, 2.2.x | 2.1.2 |
| 2.1.2 | 2.1.1 | 2.3.x, 2.2.x | 2.1.3 |
| 2.1.3 | 2.1.2 | 2.3.x, 2.2.x | 2.1.4 |
| 2.1.4 | 2.1.3 | All others | - |
| 2.2.1 | None | All others | 2.2.2 |
| 2.2.2 | 2.2.1 | All others | 2.2.3 |
| 2.2.3 | 2.2.2 | All others | - |
| 2.3.1 | 1.5.4 | 2.1.1, 2.2.x | 2.3.2 |
| 2.3.2 | 2.3.1 | 2.1.x, 2.2.x | 2.3.3, 2.3.4 |
| 2.3.3 | 2.3.2 | 2.1.x, 2.2.x | 2.3.5 |
| 2.3.4 | 2.3.2 | 2.1.x, 2.2.x, 2.3.3 | 2.3.5 |
| 2.3.5 | 2.3.3, 2.3.4 | - | 2.3.6 |
| 2.3.6 | 2.3.5 | - | None |

## Resource Allocation by Track

```mermaid
pie title Hours by Development Track
    "API Development (A)" : 6
    "Payment Flow (B)" : 4
    "UI Integration (C)" : 6
    "Unlock Logic (D)" : 4
    "E2E Testing (E)" : 3
    "Analytics (F)" : 4
    "Expert UI (G)" : 3
    "QA & Deploy (H)" : 8
```

## Risk Heat Map

```mermaid
quadrantChart
    title Risk vs Impact Assessment
    x-axis Low Impact --> High Impact
    y-axis Low Risk --> High Risk
    quadrant-1 Monitor
    quadrant-2 Mitigate Actively
    quadrant-3 Accept
    quadrant-4 Contingency Plan

    Payment Webhook: [0.8, 0.7]
    State Management: [0.7, 0.6]
    Bug Fixes: [0.6, 0.8]
    Pipeline Integration: [0.7, 0.5]
    E2E Testing: [0.4, 0.6]
    Expert UI: [0.2, 0.3]
    Analytics: [0.3, 0.3]
    Performance: [0.5, 0.4]
```

## Completion Tracking

### Phase 1 Progress
```
[████████████████████░░] 90% - 23/25 hours
└─ API Development     [██████████████████████] 100% - 6/6 hours
└─ Payment Flow        [████████████████████░░] 90% - 3.6/4 hours
└─ UI Integration      [███████████████████░░░] 85% - 5.1/6 hours
└─ Unlock Logic        [█████████████████░░░░░] 75% - 3/4 hours
└─ E2E Testing         [██████████░░░░░░░░░░░░] 50% - 1.5/3 hours
```

### Phase 2 Progress
```
[░░░░░░░░░░░░░░░░░░░░░░] 0% - 0/15 hours
└─ Analytics           [░░░░░░░░░░░░░░░░░░░░░░] 0% - 0/4 hours
└─ Expert UI           [░░░░░░░░░░░░░░░░░░░░░░] 0% - 0/3 hours
└─ QA & Deployment     [░░░░░░░░░░░░░░░░░░░░░░] 0% - 0/8 hours
```

## Daily Velocity Tracking

| Day | Planned Hours | Actual Hours | Variance | Cumulative | On Track? |
|-----|---------------|--------------|----------|------------|-----------|
| Day 1 | 8 | - | - | 8 | ✅ |
| Day 2 | 8 | - | - | 16 | ✅ |
| Day 3 | 7 | - | - | 23 | ✅ |
| Day 4 | 8 | - | - | 31 | ✅ |
| Day 5 | 7 | - | - | 38 | ✅ |

## Critical Path Analysis

**Longest Path**: 18.5 hours (sequential)
```
1.1.1 (1h) → 1.1.2 (1.5h) → 1.1.3 (1.5h) → 1.1.5 (1h) →
1.3.4 (1.5h) → 1.3.6 (0.5h) → 1.5.2 (1h) → 1.5.4 (1h) →
2.3.1 (2h) → 2.3.2 (3h) → 2.3.3 (1.5h) → 2.3.5 (0.5h) →
2.3.6 (0.5h)
```

**With Parallelization**: 5 days (38 hours total, but distributed)

**Time Savings**: ~13.5 hours through parallel execution

## Bottleneck Identification

### 🔴 Critical Bottlenecks
1. **1.1.3 Pipeline Integration** - Blocks entire UI integration
2. **1.3.4 Wire APIs** - Blocks all downstream testing
3. **2.3.2 Bug Fixes** - Duration uncertain, blocks launch

### 🟡 Potential Bottlenecks
1. **1.2.3 Webhook Handler** - Complex async logic
2. **1.5.2 Happy Path Test** - May reveal integration issues
3. **2.3.1 QA Testing** - May uncover many bugs

### 🟢 Non-Bottlenecks (Can be deferred)
1. **2.2.x Expert UI** - Completely independent
2. **1.4.4 PDF Download** - Optional feature
3. **2.1.4 Alerts** - Nice-to-have monitoring

## Optimization Strategies

### Strategy 1: Early Integration Testing
- Start 1.5.1 (Test Setup) on Day 1
- Write integration tests as you build features
- Catch issues early when cheaper to fix

### Strategy 2: Parallel Development
- Assign Track A (API) and Track C (UI) to different developers
- Payment and unlock logic can be single developer
- Expert UI can be junior developer or deferred

### Strategy 3: Feature Flags
- Deploy with feature flag disabled
- Test in production safely
- Enable when fully validated

### Strategy 4: Progressive Enhancement
- Launch with basic unlock (no PDF)
- Add analytics monitoring later
- Expert UI in Phase 3

## Recommended Team Structure

### Solo Developer
- Follow daily plan sequentially
- Use maximum parallelization opportunities
- 5 full days required

### 2 Developers
- Dev 1: Tracks A, B, D (API, Payment, Unlock)
- Dev 2: Track C, G (UI, Expert pages)
- Both: E2E testing together
- 3 days possible

### 3 Developers
- Dev 1: Track A (API) - 1.5 days
- Dev 2: Tracks B, D (Payment, Unlock) - 1.5 days
- Dev 3: Track C (UI) - 2 days
- All: Testing and QA - 1 day
- 2.5 days possible

---

**Graph Legend**:
- 🔴 Red: Critical path tasks (must be done sequentially)
- 🟢 Green: Parallel execution opportunities
- 🔵 Blue: Independent tasks (can run anytime)
- ⏱️ Time shown in parentheses (hours)
- Solid arrows: Hard dependencies
- Dotted arrows: Parallel execution possible

**Last Updated**: 2025-10-27
