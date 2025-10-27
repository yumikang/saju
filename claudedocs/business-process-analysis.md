# 4단계 비즈니스 프로세스 구현 체계 분석

**분석일**: 2025-10-27
**분석자**: Claude (Sequential Thinking)
**프로젝트**: 사주 작명 서비스 - Freemium 전환

---

## 📋 목차

1. [Executive Summary](#1-executive-summary)
2. [현재 상태 분석](#2-현재-상태-분석)
3. [목표 상태 정의](#3-목표-상태-정의)
4. [갭 분석](#4-갭-분석)
5. [위험 요소 식별](#5-위험-요소-식별)
6. [구현 전략](#6-구현-전략)

---

## 1. Executive Summary

### 🎯 핵심 질문 요약

| 질문 | 답변 요약 | 상태 |
|------|----------|------|
| 1. 기존 코드 재활용? | **85% 재활용 가능** - NamingPipeline(8단계), SajuCalculator, YongsinAnalyzer, HanjaService 모두 사용 가능 | ✅ |
| 2. 신규 개발 필요? | **15% 신규** - 통합 API, 결제 플로우, 전문가 시스템, UI 개선 | ⚠️ |
| 3. API 구조 설계? | **3개 주요 API** - `/api/saju/analyze`, `/api/naming/free`, `/api/naming/premium` | 📝 |
| 4. DB 스키마 수정? | **최소 수정** - NamingPayment 테이블 이미 존재, 1-2개 필드 추가만 필요 | ✅ |
| 5. 전문가 시스템? | **Phase 2** - 초기에는 자동 결제만, 전문가는 수동 프로세스 | 🔮 |

### 💡 핵심 인사이트

```
✅ 좋은 소식:
- 기존 8단계 NamingPipeline이 이미 완성도 높게 구현됨
- 사주 계산, 용신 분석, 한자 추천 모두 작동하는 상태
- DB 스키마도 거의 준비 완료 (NamingPayment 테이블 존재)
- 결제 시스템(TossPayments) 이미 통합됨

⚠️ 주의사항:
- 기존 코드는 "한국인 신생아 작명"에 최적화
- "외국인용" 기능은 없음 (global.md PRD는 다른 서비스)
- /quick.tsx는 프로토타입 수준 (API 호출 에러 존재)
- 통합 플로우가 없음 (각 단계별로 분리된 상태)

🎯 핵심 전략:
→ 기존 코드 95% 재사용
→ 신규 개발은 통합 레이어만 (5%)
→ 4단계 플로우를 orchestration layer로 연결
```

---

## 2. 현재 상태 분석

### 2.1 기존 코드베이스 현황

#### ✅ **완성도 높은 핵심 시스템**

```typescript
// 1. NamingPipeline (8단계) - ~/app/lib/naming/pipeline/naming-pipeline.ts
// 1034 라인, 완전 작동
class NamingPipeline {
  async execute(birthInfo, lastName, lastNameStrokes, config) {
    // Step 1: 사주팔자 계산
    await this.step1_calculateSaju(context);

    // Step 2: 용신 분석 (Claude AI)
    await this.step2_analyzeYongsin(context);

    // Step 3: 한자 추천 (용신 기반)
    await this.step3_recommendHanja(context);

    // Step 4: 조합 생성 (2자/3자 이름)
    await this.step4_generateCombinations(context);

    // Step 5: 검증 (81수리/음양/음운)
    await this.step5_validateCandidates(context);

    // Step 6: 점수 계산
    await this.step6_scoreCandidates(context);

    // Step 7: 필터링
    await this.step7_filterCandidates(context);

    // Step 8: 순위 반환
    return await this.step8_rankAndReturn(context);
  }
}
```

**품질 평가**: ⭐⭐⭐⭐⭐ (5/5)
- 아키텍처: Clean, SOLID 원칙 준수
- 에러 처리: Graceful degradation
- 성능: 10초 목표 (<10s)
- 테스트: Unit test 존재
- 문서화: 주석 상세함

#### ✅ **API 엔드포인트**

```typescript
// 기존 API들
/api/naming/analyze         // 사주 분석 (Step 1-2)
/api/naming/recommend       // 이름 추천 (Step 3-8)
/api/naming/generate        // 통합 (전체 8단계) ⭐ 핵심!
/api/payment/intent         // 결제 시작
/api/payment/confirm        // 결제 확인
/api/payment/webhook        // 결제 webhook
```

**품질 평가**: ⭐⭐⭐⭐ (4/5)
- `/api/naming/generate` 완성도 높음
- 나머지는 별도 호출 필요 (통합 안됨)

#### ✅ **데이터베이스 스키마**

```prisma
// 핵심 테이블 (이미 존재)
model SajuData {
  id               String
  userId           String?
  name             String
  birthDate        DateTime
  birthTime        String
  isLunar          Boolean
  gender           String
  // 사주 데이터
  yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi
  // 오행 분포
  woodCount, fireCount, earthCount, metalCount, waterCount
  // 용신
  primaryYongsin, secondaryYongsin
  // Relations
  namingResults    NamingResult[]
}

model NamingResult {
  id               String
  userId           String?
  sajuDataId       String
  lastName         String
  firstName        String
  fullName         String
  totalStrokes     Int
  balanceScore, soundScore, meaningScore, overallScore  Float
  generationMethod String
  aiModel          String?
  aiPrompt         String?
  preferredValues  Json?
  // Relations
  favorites        Favorite[]
  sajuData         SajuData
}

model NamingPayment {  // ⭐ 이미 존재!
  id               String
  userId           String
  sajuId           String
  orderId          String  // TossPayments merchantId
  paymentKey       String?
  amount           Int
  status           TossPaymentStatus
  method           String?
  orderName        String
  requestedAt      DateTime
  approvedAt       DateTime?
  cancelledAt      DateTime?
  failedAt         DateTime?
  expiresAt        DateTime?
  failureCode      String?
  failureMessage   String?
  receiptUrl       String?
  cardInfo         Json?
  // Relations
  user             User
  // Indexes
  @@unique([userId, sajuId])
  @@index([userId, status])
}
```

**품질 평가**: ⭐⭐⭐⭐⭐ (5/5)
- 스키마 완성도 매우 높음
- NamingPayment 테이블 이미 존재 (Freemium 준비됨!)
- 인덱스 최적화 완료

#### ⚠️ **문제점: 통합 플로우 부재**

```typescript
// 현재 상태: 각 단계가 분리됨
/quick.tsx (프로토타입)
├─ Step 1: BirthInfoForm → /api/naming/analyze (별도 호출)
├─ Step 2: SajuAnalysis (결과 표시)
├─ Step 3: NamingResults → /api/naming/recommend (별도 호출)
└─ Step 4: 결제/전문가 제안 (UI만 있음, API 없음)

// 문제:
1. API 호출이 2번 분리됨 (analyze → recommend)
2. 결제 플로우가 연결 안됨
3. 에러 처리 불완전
4. 상태 관리 복잡함
```

### 2.2 기존 UI 컴포넌트

#### ✅ **사용 가능한 컴포넌트**

```typescript
// Form components
~/components/ai-naming/BirthInfoForm.tsx       // 생년월일시 입력
~/components/ai-naming/LoadingProgress.tsx     // 진행 표시
~/components/ai-naming/NameResultCard.tsx      // 결과 카드
~/components/ai-naming/StepIndicator.tsx       // 단계 표시

// UI primitives (shadcn/ui)
~/components/ui/card.tsx
~/components/ui/button.tsx
~/components/ui/calendar.tsx
~/components/ui/dialog.tsx
~/components/ui/badge.tsx
```

**품질 평가**: ⭐⭐⭐⭐ (4/5)
- 디자인 통일성 좋음
- 반응형 지원
- 접근성 고려됨
- 재사용성 높음

#### ⚠️ **누락된 컴포넌트**

```typescript
// 필요하지만 없는 것들
PaymentModal.tsx          // 결제 모달
PricingCards.tsx          // 가격 비교 카드
ExpertProposalCard.tsx    // 전문가 제안 카드 (quick.tsx에 하드코딩됨)
NameComparisonTable.tsx   // 무료 vs 유료 비교
```

### 2.3 현재 플로우 다이어그램

```
[사용자]
   ↓
┌─────────────────────────────────┐
│ 1. 정보 입력 (BirthInfoForm)     │
│   - 성씨, 성별, 생년월일시         │
│   - 양력/음력, 부모 가치관         │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ POST /api/naming/analyze        │ ⚠️ 별도 API 호출
│   - 사주 계산                     │
│   - 용신 분석                     │
│   - DB 저장 (SajuData)           │
│   → sajuDataId 반환              │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 2. 사주 분석 결과 표시             │
│   - 오행 분포 차트                 │
│   - 용신 설명                      │
│   - 다음 단계 버튼                 │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ POST /api/naming/recommend      │ ⚠️ 두 번째 API 호출
│   - sajuDataId 전달              │
│   - lastName, gender, meaning   │
│   - NamingPipeline 실행 (?)     │
│   → 이름 5개 반환                 │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 3. 이름 추천 결과 (5개)           │
│   - 이름 카드 × 5                 │
│   - 점수 표시                      │
│   - 상세보기 버튼 (비활성)         │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 4. 결제/전문가 제안                │ ⚠️ UI만 있음, 기능 없음
│   - 70,000원 결제 CTA            │
│   - 전문가 목록 (더미 데이터)       │
│   - 실제 결제 플로우 없음          │
└─────────────────────────────────┘

⚠️ 문제점:
1. API 2번 호출 = 느림 + 복잡함
2. 중간 상태 관리 어려움
3. 결제 연동 안됨
4. 에러 복구 어려움
```

---

## 3. 목표 상태 정의

### 3.1 4단계 비즈니스 프로세스

```
┌─────────────────────────────────────────────────┐
│ Stage 1: 정보입력 (무료)                         │
├─────────────────────────────────────────────────┤
│ Input:                                          │
│  - 성씨 (한글)                                   │
│  - 성씨 한자 선택 (획수 자동)                      │
│  - 성별 (남아/여아)                              │
│  - 생년월일 (양력/음력)                           │
│  - 출생시간                                       │
│  - 부모 가치관 (선택)                             │
│                                                 │
│ Output:                                         │
│  → sajuDataId (DB 저장)                         │
│  → 다음 단계로 자동 진행                          │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Stage 2: 사주분석 (무료)                         │
├─────────────────────────────────────────────────┤
│ Process:                                        │
│  1. 만세력 DB 조회 (년/월/일주)                   │
│  2. 시주 계산                                     │
│  3. 오행 분포 계산                                │
│  4. 용신 분석 (Claude AI)                        │
│  5. DB 저장 (primaryYongsin, secondaryYongsin)  │
│                                                 │
│ Display:                                        │
│  - 사주팔자 (간지 표시)                           │
│  - 오행 분포 차트                                 │
│  - 용신 설명 (한글)                              │
│  - 부족한 오행 강조                               │
│                                                 │
│ CTA:                                            │
│  [이름 추천 받기 →] (자동 진행)                   │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Stage 3: 이름추천 (무료 5개)                      │
├─────────────────────────────────────────────────┤
│ Process (NamingPipeline):                       │
│  1. 한자 풀 필터링 (용신 기반)                     │
│  2. 조합 생성 (2자 이름)                          │
│  3. 음양/음운 검증                                │
│  4. 81수리 계산                                   │
│  5. 종합 점수 계산                                │
│  6. Top 5 추출                                   │
│                                                 │
│ Display:                                        │
│  ┌──────────────────────┐                      │
│  │ 1. 김준우 (金俊宇)     │ 92점 ⭐⭐⭐           │
│  │    용신: 85% ☯️ 음양: 95%                    │
│  │    [상세보기 잠김 🔒]                         │
│  └──────────────────────┘                      │
│  ... (5개)                                      │
│                                                 │
│ Message:                                        │
│  "💡 무료로 5개 이름을 확인하셨습니다!"           │
│  "상세 분석을 보시려면 결제가 필요합니다"          │
│                                                 │
│ CTA:                                            │
│  ┌─────────────────────────────────┐          │
│  │ 💳 70,000원 결제하고 상세보기    │ ← 주요   │
│  │   - 각 이름별 상세 분석           │          │
│  │   - 81수리 풀이                   │          │
│  │   - 음양오행 조화도               │          │
│  │   - PDF 다운로드                  │          │
│  └─────────────────────────────────┘          │
│                                                 │
│  [다음에 하기] (Stage 4로 이동)                  │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Stage 4: 결제/전문가 (선택)                       │
├─────────────────────────────────────────────────┤
│ Option A: 자동 결제 (70,000원)                   │
│  - TossPayments 연동                            │
│  - 결제 성공 → 상세 페이지 unlock                │
│  - NamingPayment DB 저장                        │
│  - 영수증 발급                                   │
│                                                 │
│ Option B: 전문가 상담 (8~15만원)                 │
│  - 전문가 목록 표시 (수동 큐레이션)               │
│  - 경력, 평점, 가격 비교                          │
│  - 상담 신청 (별도 플로우)                        │
│  - Phase 2 구현 예정                             │
│                                                 │
│ Option C: 나중에 하기                            │
│  - 이메일 저장 (선택)                            │
│  - 마케팅 동의 (선택)                            │
│  - sajuDataId 저장 → 나중에 재접근 가능           │
└─────────────────────────────────────────────────┘
```

### 3.2 API 설계

#### **통합 API: `/api/naming/freemium`** ⭐ 신규 개발

```typescript
// POST /api/naming/freemium
{
  "stage": "1" | "2" | "3",
  "data": {
    // Stage 1
    "lastName": "김",
    "lastNameChar": "金",
    "lastNameStrokes": 8,
    "gender": "M",
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "isLunar": false,
    "parentValue": "지혜"

    // Stage 2 (자동, data 없음)

    // Stage 3
    "sajuDataId": "uuid"
  }
}

// Response
{
  "success": true,
  "stage": 2,
  "data": {
    "sajuDataId": "uuid",
    "saju": {
      "yearGan": "庚", "yearJi": "午",
      // ... 4주
    },
    "elements": {
      "wood": 2, "fire": 3, "earth": 1, "metal": 1, "water": 1
    },
    "yongsin": {
      "primary": "WATER",
      "secondary": "METAL",
      "confidence": 85
    }
  },
  "nextStage": 3,
  "cta": "이름 추천 받기"
}
```

**장점**:
- ✅ 1개 API로 모든 단계 처리
- ✅ 상태 관리 간소화
- ✅ 에러 처리 통합
- ✅ 프로그레스 바 정확도 향상

#### **결제 API: `/api/payment/naming`** ⭐ 신규 개발

```typescript
// POST /api/payment/naming
{
  "sajuDataId": "uuid",
  "userId": "uuid",  // optional, anonymous 허용
  "amount": 70000,
  "orderName": "사주 작명 결과 프리미엄 조회"
}

// Response
{
  "success": true,
  "paymentId": "uuid",
  "orderId": "ORDER_20251027_123456",
  "tossRedirectUrl": "https://..."
}

// Webhook: /api/payment/webhook
// → NamingPayment.status = 'DONE'
// → Unlock 상세 페이지
```

### 3.3 DB 스키마 수정

```prisma
// 수정 불필요! 이미 완벽함
model NamingPayment {
  // 기존 필드 전부 사용 가능
  // 추가 필드 제안:

  unlocked       Boolean  @default(false)  // 상세 페이지 unlock 여부
  unlockedAt     DateTime?                 // unlock 시각
}

// Migration
-- migration.sql
ALTER TABLE naming_payments
  ADD COLUMN unlocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN unlocked_at TIMESTAMPTZ;
```

---

## 4. 갭 분석

### 4.1 재활용 vs 신규 개발

#### ✅ **재활용 가능 (85%)**

| 컴포넌트 | 파일 | 사용 방법 | 수정 필요 |
|---------|------|----------|----------|
| **사주 계산** | `SajuCalculator` | 그대로 사용 | ❌ No |
| **용신 분석** | `YongsinAnalyzer` | 그대로 사용 | ❌ No |
| **한자 서비스** | `HanjaService` | 그대로 사용 | ❌ No |
| **NamingPipeline** | `naming-pipeline.ts` | 그대로 사용 | ❌ No |
| **DB 스키마** | `schema.prisma` | NamingPayment 사용 | ⚠️ 2개 필드 추가 |
| **결제 통합** | TossPayments | 기존 webhook 재사용 | ⚠️ orderName 수정 |
| **UI 컴포넌트** | BirthInfoForm 등 | 대부분 재사용 | ⚠️ 일부 수정 |

#### 🆕 **신규 개발 필요 (15%)**

| 기능 | 난이도 | 예상 시간 | 우선순위 |
|------|--------|----------|---------|
| **통합 API** `/api/naming/freemium` | 🟡 중 | 4-6시간 | P0 |
| **결제 플로우** 연동 | 🟡 중 | 3-4시간 | P0 |
| **상세 페이지** unlock 로직 | 🟢 쉬움 | 2-3시간 | P0 |
| **가격 비교 UI** | 🟢 쉬움 | 2-3시간 | P1 |
| **전문가 목록** 페이지 | 🟢 쉬움 | 3-4시간 | P2 |
| **Analytics** 추적 | 🟡 중 | 2-3시간 | P1 |
| **이메일 저장** (나중에) | 🟢 쉬움 | 1-2시간 | P2 |

**총 예상 시간**: 17-25시간 (2-3일)

### 4.2 상세 갭 맵

```
현재 상태                    목표 상태                   갭 (신규 개발)
───────────────────────────────────────────────────────────────────
[1. 정보입력]
  BirthInfoForm ✅         →  BirthInfoForm ✅          (수정: 성씨 한자 선택 추가)
  ↓
[2. 사주분석]
  /api/analyze ✅          →  /api/freemium stage=1 ✅  (통합 API 개발)
  SajuCalculator ✅        →  SajuCalculator ✅          (재사용)
  YongsinAnalyzer ✅       →  YongsinAnalyzer ✅         (재사용)
  ↓
[3. 이름추천]
  /api/recommend ❌        →  /api/freemium stage=2 ✅  (통합 API 개발)
  NamingPipeline ✅        →  NamingPipeline ✅          (재사용)
  결과 5개 표시 ✅          →  결과 5개 표시 ✅          (수정: 잠김 표시 추가)
  ↓
[4. 결제/전문가]
  UI만 있음 ❌             →  /api/payment/naming ✅    (결제 API 개발)
  더미 데이터 ❌           →  DB 연동 ✅                 (DB 쿼리 추가)
  결제 플로우 없음 ❌      →  TossPayments ✅           (기존 재사용)
  전문가 시스템 없음 ❌    →  Phase 2 구현 🔮           (나중에)
```

---

## 5. 위험 요소 식별

### 5.1 기술적 위험

| 위험 | 확률 | 영향 | 완화책 |
|------|------|------|--------|
| **API 통합 복잡도** | 🟡 중 | 🔴 고 | 단계별 개발, 철저한 테스트 |
| **결제 플로우 버그** | 🟢 저 | 🔴 고 | 기존 시스템 재사용, 샌드박스 테스트 |
| **성능 저하** (2번 → 1번 호출) | 🟢 저 | 🟡 중 | 캐싱, 병렬 처리 |
| **DB 마이그레이션** | 🟢 저 | 🟢 저 | 2개 필드만 추가, 안전함 |
| **UI 일관성** | 🟡 중 | 🟡 중 | 디자인 시스템 준수 |

### 5.2 비즈니스 위험

| 위험 | 확률 | 영향 | 완화책 |
|------|------|------|--------|
| **전환율 낮음** | 🟡 중 | 🔴 고 | A/B 테스트, 가격 실험 |
| **무료 사용자만 증가** | 🟡 중 | 🔴 고 | 가치 명확화, 상세보기 미리보기 |
| **전문가 시스템 부재** | 🔴 고 | 🟡 중 | Phase 1에서는 제외 |
| **고객 불만** (5개만 무료) | 🟡 중 | 🟡 중 | 명확한 커뮤니케이션 |

### 5.3 통합 위험

| 위험 | 확률 | 영향 | 완화책 |
|------|------|------|--------|
| **기존 코드 호환성** | 🟢 저 | 🔴 고 | 철저한 테스트, 타입 체크 |
| **API 버전 관리** | 🟡 중 | 🟡 중 | `/v1/`, `/v2/` 패턴 사용 |
| **데이터 무결성** | 🟢 저 | 🔴 고 | Transaction, 롤백 전략 |

---

## 6. 구현 전략

### 6.1 단계별 개발 계획

#### **Week 1: Core Integration (5일)**

```
Day 1: API 통합 (6시간)
├─ /api/naming/freemium 개발
├─ Stage 1: 정보입력 → sajuDataId 생성
├─ Stage 2: 사주분석 (SajuCalculator, YongsinAnalyzer 호출)
├─ Stage 3: 이름추천 (NamingPipeline 호출, Top 5)
└─ 유닛 테스트

Day 2: 결제 통합 (6시간)
├─ /api/payment/naming 개발
├─ TossPayments 연동 (기존 재사용)
├─ NamingPayment DB 저장
├─ Webhook 처리 (unlock 로직)
└─ 샌드박스 테스트

Day 3: UI 개발 (6시간)
├─ 4단계 플로우 페이지 (/naming/new)
├─ BirthInfoForm 수정 (성씨 한자 선택)
├─ 사주 결과 카드
├─ 이름 카드 (잠김 표시)
└─ 결제 모달

Day 4: Unlock 로직 (4시간)
├─ 결제 성공 → 상세 페이지
├─ 각 이름별 상세 분석 페이지
├─ PDF 다운로드 (기존 재사용)
└─ 영수증 페이지

Day 5: 테스트 & 버그 수정 (6시간)
├─ End-to-End 테스트 (10개 샘플)
├─ 에러 케이스 처리
├─ 성능 최적화
└─ 프로덕션 배포 준비
```

#### **Week 2: Enhancement (5일)**

```
Day 6: Analytics & Tracking
├─ PostHog 이벤트 추가
├─ 전환율 추적
├─ 결제 성공/실패 로깅
└─ 대시보드 설정

Day 7: 전문가 시스템 (UI만)
├─ 전문가 목록 페이지 (더미 데이터)
├─ 상담 신청 폼
├─ Phase 2 대비 스키마 준비
└─ 관리자 대시보드 (기본)

Day 8-10: QA & Launch
├─ 베타 테스트 (10명)
├─ 피드백 수집
├─ 긴급 버그 수정
├─ 프로덕션 배포
└─ 모니터링
```

### 6.2 핵심 코드 구조

#### **통합 API: `/app/routes/api.naming.freemium.ts`**

```typescript
// 신규 파일
import { json } from '@remix-run/node';
import { SajuCalculator } from '~/lib/saju/calculator';
import { YongsinAnalyzer } from '~/lib/saju/yongsin-analyzer';
import { createNamingPipeline } from '~/lib/naming/pipeline';
import { prisma } from '~/lib/db.server';

export async function action({ request }) {
  const { stage, data } = await request.json();

  switch (stage) {
    case 1: // 정보입력 → 사주분석
      return await handleStage1(data);

    case 2: // 사주분석 → 이름추천
      return await handleStage2(data);

    case 3: // 이름추천 완료
      return await handleStage3(data);

    default:
      return json({ error: 'Invalid stage' }, { status: 400 });
  }
}

async function handleStage1(data) {
  // 1. 사주 계산
  const sajuCalculator = new SajuCalculator();
  const saju = await sajuCalculator.calculate(
    new Date(data.birthDate),
    data.birthTime,
    data.isLunar
  );

  // 2. 용신 분석
  const yongsinAnalyzer = new YongsinAnalyzer();
  const yongsin = await yongsinAnalyzer.analyze(saju, data);

  // 3. DB 저장
  const sajuData = await prisma.sajuData.create({
    data: {
      name: data.lastName,
      birthDate: new Date(data.birthDate),
      birthTime: data.birthTime,
      isLunar: data.isLunar,
      gender: data.gender,
      yearGan: saju.year.heavenly,
      yearJi: saju.year.earthly,
      // ... 나머지 필드
      primaryYongsin: yongsin.primary,
      secondaryYongsin: yongsin.secondary,
    },
  });

  return json({
    success: true,
    stage: 2,
    data: {
      sajuDataId: sajuData.id,
      saju: saju,
      yongsin: yongsin,
    },
    nextStage: 3,
  });
}

async function handleStage2(data) {
  // 1. SajuData 조회
  const sajuData = await prisma.sajuData.findUnique({
    where: { id: data.sajuDataId },
  });

  // 2. NamingPipeline 실행
  const pipeline = createNamingPipeline(
    new DatabaseHanjaService(prisma),
    new RedisCacheService()
  );

  const result = await pipeline.execute(
    {
      year: sajuData.birthDate.getFullYear(),
      month: sajuData.birthDate.getMonth() + 1,
      day: sajuData.birthDate.getDate(),
      hour: parseInt(sajuData.birthTime.split(':')[0]),
      minute: parseInt(sajuData.birthTime.split(':')[1]),
      isLunar: sajuData.isLunar,
      gender: sajuData.gender,
    },
    data.lastName,
    data.lastNameStrokes,
    {
      maxCandidates: 5,  // 무료는 5개만!
      minScore: 60,
    }
  );

  // 3. DB 저장 (NamingResult)
  const namingResults = await Promise.all(
    result.candidates.map((candidate) =>
      prisma.namingResult.create({
        data: {
          sajuDataId: sajuData.id,
          lastName: data.lastName,
          firstName: candidate.firstName.join(''),
          fullName: data.lastName + candidate.firstName.join(''),
          totalStrokes: /* 계산 */,
          balanceScore: candidate.breakdown.yinyang,
          soundScore: candidate.breakdown.phonetic || 0,
          meaningScore: candidate.breakdown.meaning,
          overallScore: candidate.score,
          generationMethod: 'FREEMIUM',
          aiModel: 'NamingPipeline-v1',
        },
      })
    )
  );

  return json({
    success: true,
    stage: 3,
    data: {
      candidates: result.candidates,
      metadata: result.metadata,
    },
    payment: {
      available: true,
      amount: 70000,
      message: '상세 분석을 보시려면 결제가 필요합니다',
    },
  });
}
```

#### **결제 API: `/app/routes/api.payment.naming.ts`**

```typescript
// 신규 파일
import { json } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { TossPayments } from '@tosspayments/payment-sdk';

const toss = new TossPayments(process.env.TOSS_CLIENT_KEY!);

export async function action({ request }) {
  const { sajuDataId, userId, amount } = await request.json();

  // 1. orderId 생성
  const orderId = `NAMING_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // 2. NamingPayment 생성
  const payment = await prisma.namingPayment.create({
    data: {
      userId: userId || null,  // anonymous 허용
      sajuId: sajuDataId,
      orderId,
      amount,
      status: 'PENDING',
      orderName: '사주 작명 결과 프리미엄 조회',
    },
  });

  // 3. TossPayments 리다이렉트 URL 생성
  const redirectUrl = await toss.requestPayment({
    orderId,
    amount,
    orderName: payment.orderName,
    successUrl: `${process.env.BASE_URL}/payment/success`,
    failUrl: `${process.env.BASE_URL}/payment/fail`,
  });

  return json({
    success: true,
    paymentId: payment.id,
    orderId,
    redirectUrl,
  });
}
```

### 6.3 DB Migration

```sql
-- 20251027_add_naming_payment_unlock.sql
ALTER TABLE naming_payments
  ADD COLUMN unlocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN unlocked_at TIMESTAMPTZ;

-- Index for fast unlock check
CREATE INDEX idx_naming_payment_unlock
  ON naming_payments(saju_id, unlocked)
  WHERE unlocked = TRUE;
```

### 6.4 테스트 전략

```typescript
// E2E 테스트 시나리오
describe('Freemium Flow', () => {
  it('should complete full 4-stage flow', async () => {
    // Stage 1: 정보입력
    const stage1 = await POST('/api/naming/freemium', {
      stage: 1,
      data: {
        lastName: '김',
        lastNameStrokes: 8,
        gender: 'M',
        birthDate: '1990-05-15',
        birthTime: '14:30',
        isLunar: false,
      },
    });
    expect(stage1.stage).toBe(2);
    expect(stage1.data.sajuDataId).toBeDefined();

    // Stage 2: 이름추천
    const stage2 = await POST('/api/naming/freemium', {
      stage: 2,
      data: {
        sajuDataId: stage1.data.sajuDataId,
        lastName: '김',
        lastNameStrokes: 8,
      },
    });
    expect(stage2.data.candidates).toHaveLength(5);

    // Stage 3: 결제
    const payment = await POST('/api/payment/naming', {
      sajuDataId: stage1.data.sajuDataId,
      amount: 70000,
    });
    expect(payment.redirectUrl).toBeDefined();

    // Webhook 시뮬레이션
    await POST('/api/payment/webhook', {
      orderId: payment.orderId,
      status: 'DONE',
    });

    // Unlock 확인
    const check = await GET(`/api/naming/unlock/${stage1.data.sajuDataId}`);
    expect(check.unlocked).toBe(true);
  });
});
```

---

## 7. 최종 권장사항

### 7.1 우선순위 매트릭스

```
┌─────────────────────────────────────┐
│ High Impact × Low Effort            │ ⭐ 최우선
├─────────────────────────────────────┤
│ 1. 통합 API 개발 (6시간)             │
│ 2. 결제 플로우 연동 (4시간)          │
│ 3. UI 통합 (6시간)                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ High Impact × High Effort           │ 🔜 2순위
├─────────────────────────────────────┤
│ 4. Analytics 추적 (4시간)            │
│ 5. 상세 페이지 구현 (6시간)          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Low Impact × Low Effort             │ ⏳ 나중에
├─────────────────────────────────────┤
│ 6. 전문가 UI (3시간)                 │
│ 7. 이메일 저장 (2시간)               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Low Impact × High Effort            │ ❌ 제외
├─────────────────────────────────────┤
│ 8. 전문가 매칭 시스템 (Phase 2)      │
│ 9. AI 개선 (현재 충분함)             │
└─────────────────────────────────────┘
```

### 7.2 실행 체크리스트

```
✅ Phase 1: MVP (Week 1)
□ Day 1: /api/naming/freemium 개발 및 테스트
□ Day 2: /api/payment/naming 개발 및 샌드박스 테스트
□ Day 3: UI 통합 (/naming/new 페이지)
□ Day 4: Unlock 로직 및 상세 페이지
□ Day 5: E2E 테스트 및 버그 수정

✅ Phase 2: Launch (Week 2)
□ Day 6: Analytics 설정
□ Day 7: 전문가 UI (더미)
□ Day 8-10: QA, 베타, 배포

🔮 Phase 3: Enhancement (Month 2)
□ 전문가 매칭 시스템
□ A/B 테스트 (가격, 메시지)
□ 고급 Analytics
```

### 7.3 핵심 메트릭

```
성공 지표:
─────────────────────────────
전환율: 5-10% (무료 → 유료)
평균 주문액: 70,000원
API 응답시간: <5초
결제 성공률: >95%
고객 만족도: NPS 50+

모니터링:
─────────────────────────────
- Stage별 이탈률
- 결제 단계 성공/실패
- API 에러율
- 평균 이름 점수
```

---

## 📌 결론

### ✅ 핵심 답변 요약

1. **기존 코드 재활용**: **85% 가능** - NamingPipeline, SajuCalculator, DB 스키마 모두 훌륭함
2. **신규 개발**: **15%** - 통합 API 1개, 결제 연동, UI 수정만 필요
3. **API 구조**: **3개 주요 API** - `/api/naming/freemium` (통합), `/api/payment/naming`, `/api/payment/webhook`
4. **DB 수정**: **최소** - NamingPayment에 2개 필드만 추가 (`unlocked`, `unlocked_at`)
5. **전문가 시스템**: **Phase 2** - 초기에는 UI만, 실제 매칭은 나중에

### 🎯 추천 전략

```
Week 1: Core Development (25시간)
→ 통합 API + 결제 + UI = 프로덕션 준비

Week 2: QA & Launch (15시간)
→ 테스트 + 배포 + 모니터링

Total: 40시간 (5일 풀타임)
```

### ⚠️ 주의사항

1. **기존 `/quick.tsx`는 폐기** - 새로운 `/naming/new` 페이지로 대체
2. **global.md PRD는 별도 프로젝트** - 외국인용 서비스는 다른 것
3. **전문가 시스템은 Phase 2** - 초기에는 자동 결제만
4. **테스트 철저히** - 결제 플로우는 샌드박스에서 충분히 검증

---

**분석 완료일**: 2025-10-27
**다음 단계**: 구현 착수 (통합 API 개발부터)
