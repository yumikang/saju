# Freemium-V2 Implementation Plan
## Strategic Freemium UI Integration for Renaming & Saju Services

**Date**: 2025-10-28
**Status**: Planning Phase
**Goal**: Apply freemium-v2 system to both renaming and saju compatibility services

---

## Executive Summary

This plan outlines the implementation strategy for applying the proven freemium-v2 UI pattern (currently used in naming service) to two additional services:
1. **Renaming Service** (`/renaming`) - 개명 서비스
2. **Saju Compatibility Service** (`/saju`) - 커플 사주 궁합 분석

**Key Principle**: Maintain existing backend logic and database structure. Only modify UI presentation and API integration layers.

---

## 1. Current State Analysis

### 1.1 Existing Services Overview

#### Renaming Service (`/renaming`)
**Current Flow**:
```
Input (정보입력) → Analysis (현재분석) → Results (개명제안) → Experts (전문가제안)
```

**Current Implementation**:
- **Route**: `/routes/renaming.tsx` (921 lines)
- **Components**: Inline components (RenamingInfoForm, CurrentNameAnalysis, RenamingResults, RenamingExpertProposals)
- **APIs**:
  - `POST /api/renaming/analyze-current` - Current name analysis
  - `GET /api/renaming/analysis/:id` - Retrieve analysis
  - `POST /api/naming/recommend` - Generate new name recommendations
- **Data Flow**: Form data → API → Show all results at once (no freemium)
- **Payment**: No payment integration yet

**Key Features**:
- Current name analysis (현재 이름 분석)
- 5 name recommendations with scores
- Expert proposals
- Uses HanjaSelector for name input
- Calendar integration for birth date

#### Saju Compatibility Service (`/saju`)
**Current Flow**:
```
Input (정보입력) → Analysis (궁합분석) → Results (결과확인) → Experts (전문가제안)
```

**Current Implementation**:
- **Route**: `/routes/saju.tsx` (779 lines)
- **Components**: Inline components (CoupleInfoForm, CompatibilityAnalysis, DetailedCompatibilityResults, SajuExpertProposals)
- **APIs**: Mock data (no real backend yet)
- **Data Flow**: Form data → Mock analysis → Show all results at once
- **Payment**: No payment integration yet

**Key Features**:
- Couple information input (male + female)
- Compatibility scoring (종합 궁합, 분야별 궁합)
- Strengths and challenges analysis
- Expert proposals
- Mock data for demonstration

### 1.2 Freemium-V2 Reference System

**Current Implementation** (Naming Service):
- **Route**: `/routes/naming.freemium-v2.results.tsx` (287 lines)
- **Components Directory**: `/components/naming/freemium-v2/`
  - `FreemiumResultsLayout.tsx` - Main layout orchestrator
  - `FreeNameCard.tsx` - 11-12위 free preview cards (emerald theme)
  - `LockedNameCard.tsx` - 1-10위 premium locked cards (yellow theme, dual-layer blur)
  - `FreemiumCTA.tsx` - Conversion-optimized call-to-action
  - `FreemiumPaymentModal.tsx` - TossPayments integration

**Classification Logic** (`/lib/freemium/classification.ts`):
```typescript
interface FreemiumTiers {
  free: ScoredCandidate[];    // 11-12위
  locked: ScoredCandidate[];  // 1-10위
  remaining: ScoredCandidate[]; // 13+위
}
```

**Strategic Pattern**:
1. Show 11-12위 as free samples (full details, no blur)
2. Display conversion CTA with score comparison
3. Show 1-10위 as locked premium content (dual-layer blur)
4. Enable payment modal for instant unlock
5. Redirect to unlocked results after payment

**Psychology**:
- **Anchor Effect**: Show quality samples first to build trust
- **FOMO**: Display locked premium content to create desire
- **Score Gap**: Emphasize difference between free and premium
- **Volume**: Highlight 10 premium names for completeness
- **Value Prop**: Price per name (69,000원 / 10 = 6,900원/name)

---

## 2. Analysis & Requirements

### 2.1 Renaming Service Requirements

**Functional Requirements**:
- ✅ Keep existing 4-step flow
- ✅ Maintain current name analysis logic
- ✅ Apply freemium-v2 to recommendation results
- ✅ 11-12위: Free preview recommendations
- ✅ 1-10위: Locked premium recommendations
- ✅ Payment integration (120,000원 suggested)
- ✅ Post-payment unlock flow

**Technical Requirements**:
- Adapt `FreemiumResultsLayout` for recommendation display
- Create `RenamingFreeCard` (similar to FreeNameCard)
- Create `RenamingLockedCard` (similar to LockedNameCard)
- Modify results component to use freemium classification
- Integrate TossPayments for renaming service
- Create payment success route

**Data Structure Compatibility**:
```typescript
// Current recommendation format
interface RecommendationItem {
  name: string;          // 김철수
  hanja: string;         // 金哲秀
  meaning: string;       // 의미
  score: number;         // 85
  improvement: string;   // +10점 개선
  details: unknown;      // 상세 정보
}

// Need to convert to ScoredCandidate format for freemium classification
```

### 2.2 Saju Compatibility Service Requirements

**Functional Requirements**:
- ✅ Keep existing 4-step flow
- ✅ Maintain couple information input
- ✅ Apply freemium-v2 to compatibility results
- ✅ 11-12위: Free preview compatibility aspects
- ✅ 1-10위: Locked premium detailed analyses
- ✅ Payment integration (80,000원 suggested)
- ✅ Post-payment unlock flow

**Technical Requirements**:
- Adapt `FreemiumResultsLayout` for compatibility display
- Create `SajuFreeCard` (similar to FreeNameCard)
- Create `SajuLockedCard` (similar to LockedNameCard)
- Create real backend API (currently using mock data)
- Integrate TossPayments for saju service
- Create payment success route

**Data Structure Compatibility**:
```typescript
// Current compatibility format
interface DetailedResult {
  title: string;          // "결혼 운세"
  score: number;          // 82
  description: string;    // "2025년 가을이 가장 좋은 결혼 시기입니다"
  details: string[];      // ["길일: 2025년 10월 15일", ...]
}

// Need to create structure compatible with freemium classification
```

### 2.3 Reusable Patterns Identified

**Component Patterns**:
1. **Layout Pattern**: FreemiumResultsLayout can be generalized
2. **Card Pattern**: Free/Locked card structure is reusable
3. **CTA Pattern**: Conversion component can be parameterized
4. **Payment Pattern**: Payment modal can be service-agnostic
5. **Classification Pattern**: Tier classification logic is reusable

**Naming Conventions**:
- Naming service: `FreemiumResultsLayout`, `FreeNameCard`, `LockedNameCard`
- Renaming service: Should use `RenamingFreeCard`, `RenamingLockedCard`
- Saju service: Should use `SajuFreeCard`, `SajuLockedCard`

**Shared Logic**:
- Classification: `classifyCandidates()` can be adapted
- Metrics: `calculatePsychologicalMetrics()` can be generalized
- Payment: `FreemiumPaymentModal` can be parameterized by service type

---

## 3. Architecture Design

### 3.1 Directory Structure

```
app/
├── components/
│   ├── naming/
│   │   └── freemium-v2/          # ✅ Existing (reference)
│   │       ├── FreeNameCard.tsx
│   │       ├── LockedNameCard.tsx
│   │       ├── FreemiumCTA.tsx
│   │       ├── FreemiumPaymentModal.tsx
│   │       ├── FreemiumResultsLayout.tsx
│   │       └── index.ts
│   │
│   ├── renaming/
│   │   └── freemium-v2/          # 🆕 To create
│   │       ├── RenamingFreeCard.tsx
│   │       ├── RenamingLockedCard.tsx
│   │       ├── RenamingCTA.tsx
│   │       ├── RenamingResultsLayout.tsx
│   │       └── index.ts
│   │
│   └── saju/
│       └── freemium-v2/          # 🆕 To create
│           ├── SajuFreeCard.tsx
│           ├── SajuLockedCard.tsx
│           ├── SajuCTA.tsx
│           ├── SajuResultsLayout.tsx
│           └── index.ts
│
├── lib/
│   ├── freemium/
│   │   ├── classification.ts     # ✅ Existing (reference)
│   │   ├── renaming-classification.ts  # 🆕 To create
│   │   └── saju-classification.ts      # 🆕 To create
│   │
│   ├── renaming/
│   │   ├── types.ts              # 🆕 Type definitions
│   │   ├── api-client.ts         # 🆕 API client
│   │   └── utils.ts              # 🆕 Utilities
│   │
│   └── saju/
│       ├── calculator.ts         # ✅ Existing
│       ├── yongsin-analyzer.ts   # ✅ Existing
│       ├── types.ts              # 🆕 Type definitions
│       ├── api-client.ts         # 🆕 API client
│       └── compatibility.ts      # 🆕 Compatibility logic
│
└── routes/
    ├── renaming.tsx                           # ✅ Existing (keep as-is)
    ├── renaming.freemium.results.tsx          # 🆕 New freemium results
    ├── renaming.freemium.result.tsx           # 🆕 Post-payment unlocked
    │
    ├── saju.tsx                               # ✅ Existing (keep as-is)
    ├── saju.freemium.results.tsx              # 🆕 New freemium results
    ├── saju.freemium.result.tsx               # 🆕 Post-payment unlocked
    │
    ├── api.renaming.freemium.ts               # 🆕 Renaming freemium API
    ├── api.renaming.payment.ts                # 🆕 Renaming payment API
    ├── api.saju.freemium.ts                   # 🆕 Saju freemium API
    └── api.saju.payment.ts                    # 🆕 Saju payment API
```

### 3.2 Component Architecture

#### Renaming Service Components

**RenamingFreeCard.tsx**:
```typescript
interface RenamingFreeCardProps {
  recommendation: RecommendationItem;
  rank: 11 | 12;
  currentScore: number;  // User's current name score
  onUpgradeClick: () => void;
}

// Display format:
// - Full name + hanja
// - Score with improvement indicator
// - Meaning explanation
// - Score breakdown (optional)
// - "프리미엄으로 업그레이드" button
```

**RenamingLockedCard.tsx**:
```typescript
interface RenamingLockedCardProps {
  recommendation: RecommendationItem;
  rank: number;  // 1-10
  onClick: () => void;
}

// Display format:
// - Dual-layer blur effect
// - Name partially visible (e.g., "김○○")
// - Score range hint (e.g., "85~92점")
// - Lock icon + "결제 후 확인" message
```

**RenamingResultsLayout.tsx**:
```typescript
interface RenamingResultsLayoutProps {
  tiers: RenamingTiers;
  metrics: RenamingMetrics;
  sessionId: string;
  currentNameScore: number;
  paymentAmount: number;
  onPaymentSuccess: (orderId: string) => void;
}

// Layout sections:
// 1. Header with progress
// 2. Current name analysis summary
// 3. Free recommendations (11-12위)
// 4. Conversion CTA
// 5. Locked recommendations (1-10위)
// 6. Info guide
// 7. Payment modal
```

#### Saju Compatibility Components

**SajuFreeCard.tsx**:
```typescript
interface SajuFreeCardProps {
  compatibility: CompatibilityAspect;
  rank: 11 | 12;
  onUpgradeClick: () => void;
}

// Display format:
// - Aspect title (e.g., "결혼 운세")
// - Score + category
// - Brief description
// - Key insights (2-3 points)
// - "프리미엄으로 업그레이드" button
```

**SajuLockedCard.tsx**:
```typescript
interface SajuLockedCardProps {
  compatibility: CompatibilityAspect;
  rank: number;  // 1-10
  onClick: () => void;
}

// Display format:
// - Dual-layer blur effect
// - Aspect title visible
// - Score range hint
// - Lock icon + "결제 후 확인" message
```

**SajuResultsLayout.tsx**:
```typescript
interface SajuResultsLayoutProps {
  tiers: SajuTiers;
  metrics: SajuMetrics;
  sessionId: string;
  coupleInfo: CoupleFormData;
  paymentAmount: number;
  onPaymentSuccess: (orderId: string) => void;
}

// Layout sections:
// 1. Header with progress
// 2. Overall compatibility summary
// 3. Free aspects (11-12위)
// 4. Conversion CTA
// 5. Locked aspects (1-10위)
// 6. Info guide
// 7. Payment modal
```

### 3.3 Data Flow Architecture

#### Renaming Service Data Flow

```
User Input (Form)
  ↓
[Step 1] Current Name Analysis
  → POST /api/renaming/analyze-current
  → Store: { analysisId, currentScore, problems, predictions }
  ↓
[Step 2] Generate Recommendations (Backend)
  → POST /api/naming/recommend (maxResults: 12)
  → Generate 12+ name recommendations
  ↓
[Step 3] Freemium Classification
  → classifyRenamingCandidates(recommendations)
  → { free: [11, 12], locked: [1-10], remaining: [13+] }
  ↓
[Step 4] Display Freemium Results
  → /renaming.freemium.results?sessionId=xxx
  → Show: Free (11-12) + CTA + Locked (1-10 blurred)
  ↓
[Step 5] Payment Flow
  → FreemiumPaymentModal (120,000원)
  → POST /api/renaming.payment
  → TossPayments integration
  ↓
[Step 6] Unlock Premium Content
  → /renaming.freemium.result?sessionId=xxx&orderId=yyy&payment=success
  → Show: All unlocked (1-12) with full details
```

#### Saju Compatibility Service Data Flow

```
User Input (Couple Form)
  ↓
[Step 1] Compatibility Analysis
  → POST /api/saju/compatibility (new endpoint to create)
  → Calculate: 12+ compatibility aspects
  → Store: { sessionId, overallScore, aspects[] }
  ↓
[Step 2] Freemium Classification
  → classifySajuAspects(aspects)
  → { free: [11, 12], locked: [1-10], remaining: [13+] }
  ↓
[Step 3] Display Freemium Results
  → /saju.freemium.results?sessionId=xxx
  → Show: Free aspects (11-12) + CTA + Locked (1-10 blurred)
  ↓
[Step 4] Payment Flow
  → FreemiumPaymentModal (80,000원)
  → POST /api/saju.payment
  → TossPayments integration
  ↓
[Step 5] Unlock Premium Content
  → /saju.freemium.result?sessionId=xxx&orderId=yyy&payment=success
  → Show: All unlocked (1-12) with full details
```

---

## 4. Implementation Roadmap

### Phase 1: Foundation & Planning (Week 1)
**Status**: Current phase

**Tasks**:
- ✅ Analyze existing service architectures
- ✅ Document freemium-v2 patterns
- ✅ Create implementation plan
- ⏳ Review plan with stakeholders
- ⏳ Finalize technical specifications

**Deliverables**:
- This implementation plan document
- Technical specification document
- Architecture diagrams

---

### Phase 2: Renaming Service Freemium Integration (Week 2-3)

**Goal**: Apply freemium-v2 to renaming service while keeping existing backend

#### 2.1 Setup & Types (Day 1-2)
**Tasks**:
1. Create `/lib/renaming/types.ts`
   - Define `RecommendationItem` interface
   - Define `RenamingTiers` interface
   - Define `RenamingMetrics` interface
2. Create `/lib/freemium/renaming-classification.ts`
   - Adapt `classifyCandidates()` for recommendations
   - Adapt `calculatePsychologicalMetrics()` for renaming
   - Add recommendation-specific utilities

**Dependencies**: None

#### 2.2 Component Development (Day 3-6)
**Tasks**:
1. Create `RenamingFreeCard.tsx`
   - Design card layout (emerald theme)
   - Display recommendation details
   - Add upgrade button
2. Create `RenamingLockedCard.tsx`
   - Design locked card (yellow theme)
   - Implement dual-layer blur
   - Add unlock prompt
3. Create `RenamingCTA.tsx`
   - Design conversion section
   - Emphasize score improvement
   - Add payment trigger
4. Create `RenamingResultsLayout.tsx`
   - Orchestrate all components
   - Add current name summary
   - Integrate payment modal

**Dependencies**: 2.1 must be complete

#### 2.3 Route & API Development (Day 7-9)
**Tasks**:
1. Create `/routes/renaming.freemium.results.tsx`
   - Fetch recommendations via existing API
   - Classify into freemium tiers
   - Render layout with components
2. Create `/routes/api.renaming.freemium.ts`
   - Stage 3: Return recommendations (reuse `/api/naming/recommend`)
   - Store session data
   - Return classification metadata
3. Create `/routes/api.renaming.payment.ts`
   - TossPayments integration
   - Store payment record
   - Update session with payment status
4. Create `/routes/renaming.freemium.result.tsx`
   - Verify payment
   - Fetch full recommendations
   - Display unlocked results

**Dependencies**: 2.2 must be complete

#### 2.4 Integration & Testing (Day 10-12)
**Tasks**:
1. Modify `/routes/renaming.tsx`
   - Update results component to redirect to freemium results
   - Keep existing analysis logic intact
2. Test complete user journey:
   - Input → Analysis → Freemium Results → Payment → Unlocked
3. Test edge cases:
   - Payment failure handling
   - Session expiration
   - Invalid data handling
4. Cross-browser testing
5. Mobile responsive testing

**Dependencies**: 2.3 must be complete

**Deliverables**:
- Working renaming freemium system
- 11-12위 free recommendations
- 1-10위 locked premium recommendations
- Payment integration
- Test report

---

### Phase 3: Saju Compatibility Service Freemium Integration (Week 4-5)

**Goal**: Apply freemium-v2 to saju service and create real backend logic

#### 3.1 Backend Development (Day 1-4)
**Tasks**:
1. Create `/lib/saju/compatibility.ts`
   - Implement compatibility calculation logic
   - Generate 12+ compatibility aspects
   - Score and rank aspects
2. Create `/lib/saju/types.ts`
   - Define `CompatibilityAspect` interface
   - Define `SajuTiers` interface
   - Define `SajuMetrics` interface
3. Create `/lib/freemium/saju-classification.ts`
   - Adapt classification for compatibility aspects
   - Calculate conversion metrics
4. Create `/routes/api.saju.compatibility.ts`
   - POST endpoint for compatibility analysis
   - Store couple data
   - Return classified results

**Dependencies**: Phase 2 completion (for reference patterns)

#### 3.2 Component Development (Day 5-8)
**Tasks**:
1. Create `SajuFreeCard.tsx`
   - Design aspect card (emerald theme)
   - Display compatibility details
   - Add upgrade button
2. Create `SajuLockedCard.tsx`
   - Design locked card (yellow theme)
   - Implement blur effect
   - Add unlock prompt
3. Create `SajuCTA.tsx`
   - Design conversion section
   - Emphasize relationship insights
   - Add payment trigger
4. Create `SajuResultsLayout.tsx`
   - Orchestrate all components
   - Add overall compatibility summary
   - Integrate payment modal

**Dependencies**: 3.1 must be complete

#### 3.3 Route & API Development (Day 9-11)
**Tasks**:
1. Create `/routes/saju.freemium.results.tsx`
   - Fetch compatibility analysis
   - Classify into freemium tiers
   - Render layout with components
2. Create `/routes/api.saju.freemium.ts`
   - Stage 3: Return compatibility aspects
   - Store session data
   - Return classification metadata
3. Create `/routes/api.saju.payment.ts`
   - TossPayments integration
   - Store payment record
   - Update session status
4. Create `/routes/saju.freemium.result.tsx`
   - Verify payment
   - Fetch full compatibility data
   - Display unlocked results

**Dependencies**: 3.2 must be complete

#### 3.4 Integration & Testing (Day 12-14)
**Tasks**:
1. Modify `/routes/saju.tsx`
   - Update to use real backend API
   - Redirect to freemium results
   - Keep input forms intact
2. Test complete user journey
3. Test edge cases
4. Cross-browser testing
5. Mobile responsive testing

**Dependencies**: 3.3 must be complete

**Deliverables**:
- Working saju freemium system
- Real backend compatibility logic
- 11-12위 free aspects
- 1-10위 locked premium aspects
- Payment integration
- Test report

---

### Phase 4: Optimization & Refinement (Week 6)

#### 4.1 Performance Optimization (Day 1-2)
**Tasks**:
1. Optimize component rendering
2. Implement lazy loading
3. Cache classification results
4. Optimize API response times

#### 4.2 UX Refinement (Day 3-4)
**Tasks**:
1. A/B test CTA messaging
2. Refine blur effects
3. Improve mobile experience
4. Add loading states
5. Enhance error messaging

#### 4.3 Analytics Integration (Day 5)
**Tasks**:
1. Add conversion tracking
2. Track payment funnel
3. Monitor user behavior
4. Set up dashboards

#### 4.4 Documentation (Day 6-7)
**Tasks**:
1. Write component documentation
2. Create API documentation
3. Document deployment process
4. Create user guides

**Deliverables**:
- Performance report
- UX recommendations
- Analytics dashboard
- Complete documentation

---

## 5. Technical Specifications

### 5.1 API Endpoints

#### Renaming Service APIs

**POST /api/renaming/freemium**
```typescript
// Stage 3: Get recommendations with freemium classification
Request: {
  stage: 3,
  sessionId: string
}

Response: {
  success: true,
  sessionId: string,
  stage: 3,
  recommendations: RecommendationItem[],  // 12+ items
  currentScore: number,
  hasMore: boolean,
  pricing: {
    amount: 120000,
    currency: 'KRW'
  },
  nextStage: 4
}
```

**POST /api/renaming/payment**
```typescript
Request: {
  sessionId: string,
  amount: number,
  customerName?: string,
  customerEmail?: string
}

Response: {
  success: true,
  orderId: string,
  paymentUrl: string  // TossPayments checkout URL
}
```

**GET /api/renaming/payment/verify**
```typescript
Query: {
  orderId: string,
  sessionId: string
}

Response: {
  success: true,
  isPaid: boolean,
  orderId: string,
  paymentDetails: {...}
}
```

#### Saju Compatibility Service APIs

**POST /api/saju/compatibility**
```typescript
Request: {
  maleData: PersonData,
  femaleData: PersonData,
  relationshipStatus: string,
  consultationType: string,
  concerns?: string
}

Response: {
  success: true,
  sessionId: string,
  overallScore: number,
  aspects: CompatibilityAspect[],  // 12+ aspects
  summary: {
    strengths: string[],
    challenges: string[]
  }
}
```

**POST /api/saju/freemium**
```typescript
// Stage 3: Get compatibility with freemium classification
Request: {
  stage: 3,
  sessionId: string
}

Response: {
  success: true,
  sessionId: string,
  stage: 3,
  aspects: CompatibilityAspect[],  // 12+ items
  overallScore: number,
  hasMore: boolean,
  pricing: {
    amount: 80000,
    currency: 'KRW'
  },
  nextStage: 4
}
```

**POST /api/saju/payment**
```typescript
Request: {
  sessionId: string,
  amount: number,
  customerName?: string,
  customerEmail?: string
}

Response: {
  success: true,
  orderId: string,
  paymentUrl: string  // TossPayments checkout URL
}
```

### 5.2 Data Models

#### Renaming Service Models

```typescript
// lib/renaming/types.ts

export interface RecommendationItem {
  name: string;          // 김철수
  hanja: string;         // 金哲秀
  meaning: string;       // Combined meaning
  score: number;         // 0-100
  improvement: string;   // "+15점 개선"
  details: {
    firstName: string[];
    characters: HanjaCharacter[];
    scores: {
      overall: number;
      element: number;
      yinyang: number;
      numerology: number;
      meaning: number;
    };
    breakdown: {
      element: string;
      yinyang: string;
      numerology: string;
      meaning: string;
    };
  };
}

export interface RenamingTiers {
  free: RecommendationItem[];      // 11-12위
  locked: RecommendationItem[];    // 1-10위
  remaining: RecommendationItem[]; // 13+위
}

export interface RenamingMetrics {
  topScore: number;           // 1등 점수
  secondScore: number;        // 2등 점수
  freeTopScore: number;       // 11위 점수
  scoreDifference: number;    // 점수 차이
  percentageDiff: number;     // 퍼센트 차이
  lockedCount: number;        // 잠긴 이름 수
  totalCount: number;         // 전체 이름 수
  currentScore: number;       // 현재 이름 점수
  improvementMessage: string; // 개선 메시지
}
```

#### Saju Compatibility Service Models

```typescript
// lib/saju/types.ts

export interface CompatibilityAspect {
  id: string;
  category: 'marriage' | 'children' | 'business' | 'finance' |
            'health' | 'communication' | 'values' | 'lifestyle' |
            'conflict' | 'harmony' | 'future' | 'spiritual';
  title: string;          // "결혼 운세"
  score: number;          // 0-100
  description: string;    // Brief description
  details: {
    positives: string[];  // Strengths
    negatives: string[];  // Challenges
    advice: string;       // Expert advice
    timing?: string;      // Best timing (for applicable aspects)
  };
  rank: number;           // 1-12+
}

export interface SajuTiers {
  free: CompatibilityAspect[];      // 11-12위
  locked: CompatibilityAspect[];    // 1-10위
  remaining: CompatibilityAspect[]; // 13+위
}

export interface SajuMetrics {
  topScore: number;           // 최고 점수 aspect
  secondScore: number;        // 2등 점수
  freeTopScore: number;       // 11위 점수
  scoreDifference: number;    // 점수 차이
  percentageDiff: number;     // 퍼센트 차이
  lockedCount: number;        // 잠긴 aspect 수
  totalCount: number;         // 전체 aspect 수
  overallScore: number;       // 종합 궁합 점수
  conversionMessage: string;  // 전환 메시지
}

export interface CoupleFormData {
  maleData: PersonData;
  femaleData: PersonData;
  relationshipStatus: string;
  consultationType: string;
  concerns?: string;
}

export interface PersonData {
  name: string;
  nameHanja: (HanjaChar | null)[];
  birthDate: Date | undefined;
  birthTime: string;
  calendarType: 'solar' | 'lunar';
}
```

### 5.3 Database Schema Updates

#### Renaming Session Table
```sql
CREATE TABLE renaming_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  current_name VARCHAR(50),
  current_name_hanja VARCHAR(50),
  birth_date DATE,
  birth_time TIME,
  calendar_type ENUM('solar', 'lunar'),
  gender ENUM('male', 'female'),
  renaming_reason VARCHAR(100),
  desired_meaning VARCHAR(100),
  current_score INTEGER,
  analysis_data JSON,
  recommendations JSON,  -- Array of 12+ recommendations
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

#### Saju Compatibility Session Table
```sql
CREATE TABLE saju_compatibility_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  male_data JSON,      -- PersonData
  female_data JSON,    -- PersonData
  relationship_status VARCHAR(50),
  consultation_type VARCHAR(50),
  concerns TEXT,
  overall_score INTEGER,
  aspects JSON,        -- Array of 12+ compatibility aspects
  summary JSON,        -- { strengths: [], challenges: [] }
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

#### Payment Records Table (Shared)
```sql
-- Extend existing payments table
ALTER TABLE payments ADD COLUMN service_type ENUM('naming', 'renaming', 'saju') DEFAULT 'naming';
ALTER TABLE payments ADD COLUMN session_id VARCHAR(36);
ALTER TABLE payments ADD INDEX idx_session_id (session_id);
```

---

## 6. Testing Strategy

### 6.1 Unit Testing

**Component Tests**:
- Test card rendering (Free/Locked)
- Test CTA interactions
- Test payment modal
- Test classification logic
- Test metrics calculation

**API Tests**:
- Test recommendation generation
- Test compatibility calculation
- Test payment processing
- Test session management

### 6.2 Integration Testing

**Renaming Service Flow**:
1. Form submission → Analysis
2. Analysis → Recommendations
3. Classification → Display
4. Payment → Unlock
5. Verification → Full access

**Saju Service Flow**:
1. Form submission → Compatibility
2. Compatibility → Aspects
3. Classification → Display
4. Payment → Unlock
5. Verification → Full access

### 6.3 E2E Testing

**Test Scenarios**:
1. Complete free user journey (no payment)
2. Complete paid user journey
3. Payment failure recovery
4. Session expiration handling
5. Mobile responsive behavior
6. Cross-browser compatibility

### 6.4 Performance Testing

**Metrics to Track**:
- Page load time
- API response time
- Classification speed
- Payment processing time
- Mobile performance

**Targets**:
- Initial load: < 2s
- API response: < 500ms
- Classification: < 100ms
- Payment redirect: < 1s

---

## 7. Risk Analysis & Mitigation

### 7.1 Technical Risks

**Risk: Component Complexity**
- **Impact**: High development time
- **Probability**: Medium
- **Mitigation**: Reuse existing freemium-v2 patterns, create shared utilities

**Risk: API Performance**
- **Impact**: Slow user experience
- **Probability**: Low
- **Mitigation**: Optimize queries, implement caching, monitor performance

**Risk: Payment Integration Issues**
- **Impact**: Lost revenue, poor UX
- **Probability**: Medium
- **Mitigation**: Comprehensive testing, fallback mechanisms, monitoring

**Risk: Data Model Mismatch**
- **Impact**: Complex adaptation layer
- **Probability**: Medium
- **Mitigation**: Clear type definitions, conversion utilities, validation

### 7.2 Business Risks

**Risk: Low Conversion Rate**
- **Impact**: Revenue targets not met
- **Probability**: Medium
- **Mitigation**: A/B testing, optimize CTA, adjust pricing, improve value prop

**Risk: User Confusion**
- **Impact**: High bounce rate
- **Probability**: Low
- **Mitigation**: Clear UI, help text, progress indicators, onboarding

**Risk: Quality Perception**
- **Impact**: Users don't see value in premium
- **Probability**: Medium
- **Mitigation**: Show quality samples, emphasize score difference, testimonials

### 7.3 Operational Risks

**Risk: Deployment Issues**
- **Impact**: Service downtime
- **Probability**: Low
- **Mitigation**: Staged rollout, rollback plan, monitoring

**Risk: Database Load**
- **Impact**: Slow performance
- **Probability**: Low
- **Mitigation**: Indexing, query optimization, caching strategy

**Risk: Support Burden**
- **Impact**: High support costs
- **Probability**: Medium
- **Mitigation**: Clear documentation, FAQ, self-service tools

---

## 8. Success Metrics

### 8.1 Technical Metrics

**Performance**:
- Page load time: < 2s (target)
- API response time: < 500ms (target)
- Classification speed: < 100ms (target)
- Error rate: < 1% (target)

**Quality**:
- Test coverage: > 80% (target)
- Bug density: < 5 per 1000 LOC (target)
- Code review approval rate: > 95% (target)

### 8.2 Business Metrics

**Conversion**:
- View-to-payment rate: > 15% (target)
- Free-to-paid conversion: > 20% (target)
- Payment success rate: > 95% (target)

**Engagement**:
- Time on results page: > 2 minutes (target)
- CTA click rate: > 30% (target)
- Payment modal open rate: > 40% (target)

**Revenue**:
- Renaming service: 120,000원 × conversion rate
- Saju service: 80,000원 × conversion rate
- Target monthly revenue increase: +30%

### 8.3 User Experience Metrics

**Satisfaction**:
- User satisfaction score: > 4.0/5.0 (target)
- Net Promoter Score: > 30 (target)
- Completion rate: > 60% (target)

**Usability**:
- Task completion time: < 10 minutes (target)
- Error encounter rate: < 10% (target)
- Help/FAQ access rate: < 20% (target)

---

## 9. Next Steps

### Immediate Actions (This Week)
1. ✅ Complete this implementation plan
2. ⏳ Review with technical lead
3. ⏳ Review with product owner
4. ⏳ Finalize pricing strategy
5. ⏳ Set up project tracking (Jira/Linear)

### Week 1 Actions
1. Create GitHub branch: `feature/freemium-v2-services`
2. Set up development environment
3. Create initial type definitions
4. Start Phase 2.1 tasks

### Dependencies to Resolve
1. Confirm pricing: 120,000원 (renaming) and 80,000원 (saju)
2. Confirm TossPayments account setup
3. Confirm database migration approval
4. Confirm design review process

### Key Questions to Answer
1. Should we migrate existing users to freemium model?
2. What's the rollback strategy if conversion is too low?
3. Should we A/B test pricing before full launch?
4. What's the customer support escalation path?

---

## 10. Appendix

### 10.1 Reference Implementation

**Naming Service Freemium-V2**:
- Route: `/routes/naming.freemium-v2.results.tsx`
- Components: `/components/naming/freemium-v2/`
- Classification: `/lib/freemium/classification.ts`
- Payment: TossPayments integration (69,000원)

**Key Success Factors**:
- Clean component separation
- Dual-layer blur effect for locked content
- Strategic 11-12위 free samples
- Clear value proposition in CTA
- Seamless payment flow

### 10.2 Design Tokens

**Colors**:
- Free tier: Emerald theme (`emerald-50`, `emerald-500`, `emerald-600`)
- Locked tier: Yellow/Orange theme (`yellow-50`, `yellow-500`, `orange-500`)
- CTA: Orange primary (`orange-500`, `orange-600`)
- Background: Gradient (`from-orange-50 via-white to-emerald-50`)

**Typography**:
- Headings: Bold, 2xl-5xl
- Body: Regular, sm-lg
- Scores: Bold, 3xl-5xl
- Labels: Medium, sm-base

**Spacing**:
- Section gap: 8-12 (2-3rem)
- Card gap: 4-6 (1-1.5rem)
- Internal padding: 4-6 (1-1.5rem)

### 10.3 Component Library

**Shared Components** (from shadcn/ui):
- Card, CardContent, CardHeader, CardTitle
- Button
- Badge
- Popover, PopoverContent, PopoverTrigger
- Calendar
- Toast

**Custom Components**:
- HanjaSelector, MultiHanjaSelector
- FreemiumResultsLayout (base)
- FreemiumPaymentModal (base)

### 10.4 Git Strategy

**Branch Naming**:
- Main feature: `feature/freemium-v2-services`
- Renaming: `feature/freemium-v2-renaming`
- Saju: `feature/freemium-v2-saju`

**Commit Messages**:
- `feat(renaming): add freemium classification`
- `feat(saju): create compatibility API`
- `refactor(freemium): extract shared utilities`
- `test(renaming): add e2e payment flow test`

**Pull Request Strategy**:
1. Small, focused PRs (< 500 lines)
2. Component PRs before integration PRs
3. API PRs before UI PRs
4. Each service in separate PR series

---

## Summary

This implementation plan provides a comprehensive roadmap for applying the proven freemium-v2 system to both renaming and saju compatibility services. The strategy maintains existing backend logic while modernizing the UI and adding strategic monetization.

**Key Principles**:
1. **Reuse proven patterns** from naming freemium-v2
2. **Maintain backend stability** - no logic changes
3. **Progressive enhancement** - phase by phase rollout
4. **Data-driven optimization** - A/B testing and metrics
5. **User-centric design** - clear value, seamless flow

**Expected Outcomes**:
- Consistent freemium UX across all services
- Improved conversion rates (target: 15%+)
- Increased revenue (target: +30% monthly)
- Better user satisfaction (target: 4.0/5.0)
- Scalable freemium architecture for future services

**Timeline**: 6 weeks total
- Week 1: Planning (current)
- Week 2-3: Renaming service
- Week 4-5: Saju service
- Week 6: Optimization & refinement

**Next Step**: Review and approval to proceed with Phase 2.1

---

**Document Version**: 1.0
**Last Updated**: 2025-10-28
**Author**: Claude Code
**Status**: Ready for Review
