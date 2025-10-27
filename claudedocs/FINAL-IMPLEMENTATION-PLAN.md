# 🎯 사주 작명 서비스 - 4단계 Freemium 프로세스 최종 실행 계획서

**프로젝트 코드명**: Naming Freemium
**버전**: 1.0.0
**작성일**: 2025-10-27
**예상 기간**: 5일 (38시간)
**예상 비용**: OpenAI API $2/월 + 인프라 $25/월
**예상 수익**: 월 1,000명 기준 약 900만원 순이익

---

## 📋 목차

1. [Executive Summary](#executive-summary)
2. [프로젝트 개요](#프로젝트-개요)
3. [현재 상태 분석](#현재-상태-분석)
4. [4단계 비즈니스 프로세스](#4단계-비즈니스-프로세스)
5. [기술 아키텍처](#기술-아키텍처)
6. [구현 계획 (5일)](#구현-계획-5일)
7. [리스크 관리](#리스크-관리)
8. [성공 지표](#성공-지표)
9. [다음 단계](#다음-단계)
10. [참조 문서](#참조-문서)

---

## 📊 Executive Summary

### 핵심 목표
기존 AI 작명 서비스를 **Freemium 비즈니스 모델**로 전환하여 무료 사용자를 유료 고객으로 전환하고 월 수익을 극대화합니다.

### 주요 전략
- ✅ **5개 이름 무료 제공** - 품질 높은 티저로 가치 입증
- ✅ **70,000원 자동 결제** - 20개 이름 + 상세 분석 보고서
- ✅ **전문가 매칭 (Phase 2)** - 8-15만원 프리미엄 서비스

### 핵심 성과 지표
- **전환율 목표**: 20% (무료 → 유료)
- **예상 수익**: 월 900만원 (1,000명 기준)
- **ROI**: 3,300% (비용 $27 vs 수익 $8,200)

### 구현 범위
| 항목 | 기존 재사용 | 신규 개발 | 비율 |
|------|-------------|-----------|------|
| 사주 계산 | ✅ SajuCalculator | - | 100% |
| 용신 분석 | ✅ YongsinAnalyzer | - | 100% |
| 이름 추천 | ✅ NamingPipeline | - | 100% |
| 결제 시스템 | ⚠️ TossPayments UI | 🆕 연동 로직 | 70% |
| API 통합 | - | 🆕 /api/naming/freemium | 0% |
| UI 플로우 | ⚠️ 기존 컴포넌트 | 🆕 4단계 통합 | 60% |
| **총 재활용** | **85%** | **15%** | **5일** |

---

## 🎯 프로젝트 개요

### 문제 정의
**현재 상태**:
- AI 작명 서비스가 완전 무료로 제공
- 수익 모델 없음
- 품질 높은 서비스이나 비즈니스 가치 없음

**목표 상태**:
- Freemium 모델로 전환
- 무료 티저 → 유료 전환
- 월 900만원 수익 달성

### 비즈니스 가치
```
월 1,000명 이용 시:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
무료 이탈:    700명 (70%)    →  ₩0
자동 결제:    200명 (20%)    →  ₩14,000,000
전문가 매칭:  100명 (10%)    →  ₩2,500,000 (수수료)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 매출:                        ₩16,500,000

비용:
- AI API: $2/월 (약 ₩2,600)
- 인프라: $25/월 (약 ₩32,500)
- 전문가 지급: ₩7,500,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
순이익:                         ₩8,965,000/월
```

### 성공 기준
1. **기술적 성공**:
   - 4단계 플로우 완벽 작동
   - 결제 성공률 > 95%
   - API 응답 시간 < 500ms

2. **비즈니스 성공**:
   - Stage 1→4 완료율 > 60%
   - 결제 전환율 > 20%
   - 월 순이익 > ₩5,000,000

---

## 🔍 현재 상태 분석

### ✅ 완성된 시스템 (재사용 가능)

#### 1. NamingPipeline (100% 완성)
**파일**: `app/lib/naming/pipeline/naming-pipeline.ts` (1,034 lines)

**기능**:
- Step 1: 사주 계산 (SajuCalculator)
- Step 2: 용신 분석 (5가지 전통 방법)
- Step 3: AI 용신 분석 (Claude)
- Step 4: 용신 합의
- Step 5: 한자 필터링 (500개 후보)
- Step 6: 조합 생성 + 점수화
- Step 7: AI 의미 분석
- Step 8: 최종 순위 결정

**품질**: ⭐⭐⭐⭐⭐ (프로덕션 레디)

#### 2. SajuCalculator (100% 완성)
**파일**: `app/lib/saju/calculator.ts` (376 lines)

**기능**:
- 사주팔자 계산 (년월일시주)
- 음력↔양력 변환 (CalendarData DB 연동)
- 오행 분포 계산
- 용신 결정

#### 3. YongsinAnalyzer (100% 완성)
**기능**:
- 부족법 (Lacking Method)
- 강약법 (Strength Method)
- 조후법 (Climate Method)
- 통관법 (Mediation Method)
- 격국법 (Pattern Method)

#### 4. HanjaService (100% 완성)
**파일**: `app/lib/hanja-service.server.ts` (524 lines)

**기능**:
- 한자 검색 (두음법칙 지원)
- 성씨/이름 모드 분리
- 299개 부정적 한자 블랙리스트
- Redis 캐싱

#### 5. TossPayments 통합 (UI 70% 완성)
**파일**: `app/components/payment/TossPaymentsButton.tsx`

**완성**:
- UI 컴포넌트
- 결제 요청 플로우

**미완성**:
- Webhook 핸들러 업데이트
- DB 연동 로직

#### 6. Database Schema (90% 완성)
**완성**:
```prisma
model NamingPayment {
  id            String   @id @default(uuid())
  orderId       String   @unique
  amount        Int
  status        PaymentStatus
  userId        String?
  customerName  String
  customerEmail String?
  sajuDataId    String?
  // ... 기타 필드
}
```

**필요한 수정**:
```prisma
// 추가 필드 (2개만)
model NamingPayment {
  // ... 기존 필드
  unlocked      Boolean  @default(false)  // ← 추가
  unlockedAt    DateTime?                 // ← 추가
}
```

### 🆕 신규 개발 필요 (15%)

#### 1. 통합 API (6시간)
**파일**: `app/routes/api.naming.freemium.ts` (신규)

**기능**:
- Stage별 라우팅 (1, 2, 3)
- NamingPipeline 통합
- 5개 이름만 반환 (무료)
- 나머지 15개 저장 (결제 후)

#### 2. 결제 플로우 (4시간)
**파일**:
- `app/routes/api.payment.naming.ts` (신규)
- `app/routes/api.payment.webhook.ts` (업데이트)

**기능**:
- 결제 요청 처리
- Webhook 검증 및 unlocked 업데이트
- NamingPayment DB 연동

#### 3. UI 통합 (6시간)
**파일**:
- `app/routes/naming.new.tsx` (신규)
- `app/routes/naming.new.$stage.tsx` (신규)

**기능**:
- 4단계 플로우 통합
- Progress indicator
- 기존 컴포넌트 재사용

#### 4. Unlock 로직 (4시간)
**파일**: `app/routes/naming.detail.$id.tsx` (신규)

**기능**:
- 결제 여부 체크
- 20개 이름 표시
- PDF 다운로드 (선택)

---

## 🎬 4단계 비즈니스 프로세스

### Stage 1: 정보입력 (무료)

**사용자 입력**:
- 성씨 (한자 선택) ⭐ 필수
- 성별 (남/여)
- 생년월일 (양력/음력)
- 출생시간 (HH:MM)
- 부모 가치관 (선택형, 최대 3개) ⭐

**가치 옵션**:
```typescript
const PARENT_VALUES = [
  { id: 'success', label: '성공과 출세', hanjaPreference: ['俊', '傑', '卓'] },
  { id: 'health', label: '건강과 장수', hanjaPreference: ['康', '健', '壽'] },
  { id: 'popularity', label: '인덕과 인기', hanjaPreference: ['仁', '德', '和'] },
  { id: 'wealth', label: '재물과 풍요', hanjaPreference: ['富', '貴', '寶'] },
  { id: 'peace', label: '평화와 안정', hanjaPreference: ['安', '泰', '靜'] },
  { id: 'wisdom', label: '지혜와 학업', hanjaPreference: ['智', '慧', '哲'] }
];
```

**API 호출**:
```typescript
POST /api/naming/freemium
{
  "stage": 1,
  "data": {
    "lastName": "김",
    "lastNameStrokes": 8,
    "gender": "M",
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "isLunar": false,
    "selectedValues": ["health", "wisdom"]
  }
}
```

**응답**:
```typescript
{
  "sessionId": "uuid",
  "stage": 1,
  "nextStage": 2
}
```

### Stage 2: 사주분석 (무료)

**자동 실행**:
- SajuCalculator.calculate()
- YongsinAnalyzer.analyze()

**표시 내용**:
```
┌─────────────────────────────────┐
│  년주    월주    일주    시주    │
│  甲子    丙寅    戊辰    壬午    │
└─────────────────────────────────┘

오행 분포:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
목(木) ████████░░ 2.5
화(火) ████░░░░░░ 1.5
토(土) ████████░░ 2.0
금(金) ██░░░░░░░░ 0.5 ⚠️ 부족
수(水) ██████████ 3.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━

용신: 金 (금)
희신: 土 (토)

💡 이 아이는 금(金) 기운이 부족합니다.
   금 기운을 보완하는 이름을 추천합니다.
```

**API 호출**:
```typescript
POST /api/naming/freemium
{
  "stage": 2,
  "sessionId": "uuid"
}
```

**응답**:
```typescript
{
  "sessionId": "uuid",
  "stage": 2,
  "saju": {
    "pillars": { year, month, day, hour },
    "elementCounts": { WOOD: 2.5, FIRE: 1.5, ... },
    "lackingElements": ["METAL"],
    "yongsin": { primary: "METAL", secondary: "EARTH" }
  },
  "nextStage": 3
}
```

### Stage 3: 이름추천 (무료 5개)

**실행 로직**:
```typescript
// 1. NamingPipeline 실행 (10-15초)
const pipeline = new NamingPipeline();
const allCandidates = await pipeline.execute(request); // 50개 생성

// 2. 상위 30개 AI 분석
const top30 = allCandidates.slice(0, 30);
const aiScores = await analyzeWithAI(top30, {
  saju,
  yongsin,
  selectedValues: ['health', 'wisdom']
});

// 3. 최종 점수 (전통 85% + AI 15%)
const finalScores = top30.map((c, i) => ({
  ...c,
  scores: {
    overall: c.scores.overall * 0.85 + aiScores[i] * 0.15
  }
}));

// 4. 상위 5개만 반환 (무료)
const top5 = finalScores.slice(0, 5);

// 5. 나머지 15개 저장 (결제 후)
const remaining15 = finalScores.slice(5, 20);

// 6. DB 저장
await db.namingSession.create({
  data: {
    sessionId,
    top5: JSON.stringify(top5),
    remaining15: JSON.stringify(remaining15),
    allCandidates: JSON.stringify(allCandidates)
  }
});
```

**표시 내용**:
```
┌────────────────────────────────────┐
│  1위  강수원  (姜秀源)  92점       │
│                                    │
│  한자 의미:                        │
│  秀(빼어날 수) - 재능, 출중함      │
│  源(근원 원) - 지혜, 학문의 근원   │
│                                    │
│  🤖 AI 분석:                       │
│  이 이름은 부모님이 중요하게       │
│  생각하시는 '지혜와 학업'을        │
│  완벽하게 반영합니다. 源(근원)은   │
│  학문의 뿌리를 의미하며...         │
│                                    │
│  [상세보기 🔒] 결제 후 확인        │
└────────────────────────────────────┘

... (2-5위 동일 형식)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 현재 상위 5개 이름만 보고 있습니다.

상세 분석 보고서에서 20개 이름과
깊이 있는 해석을 확인하세요.

[상세 보고서 받기 (70,000원)]
[전문가 상담 받기 →]
[나중에 하기]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**API 호출**:
```typescript
POST /api/naming/freemium
{
  "stage": 3,
  "sessionId": "uuid"
}
```

**응답**:
```typescript
{
  "sessionId": "uuid",
  "stage": 3,
  "recommendations": [
    {
      "rank": 1,
      "fullName": "강수원",
      "characters": [
        { character: "秀", meaning: "빼어날 수", strokes: 7, element: "METAL" },
        { character: "源", meaning: "근원 원", strokes: 13, element: "WATER" }
      ],
      "scores": {
        "overall": 92,
        "element": 95,
        "yinyang": 88,
        "numerology": 90,
        "meaning": 94,
        "aiMeaning": 96
      },
      "aiExplanation": "이 이름은 부모님이 중요하게..."
    },
    // ... 2-5위
  ],
  "hasMore": true,
  "pricing": {
    "auto": 70000,
    "expertRange": [80000, 150000]
  },
  "nextStage": 4
}
```

### Stage 4: 결제/전문가 (선택)

**옵션 A: 자동 결제 (70,000원)**

```
┌────────────────────────────────────┐
│  상세 분석 보고서                  │
│                                    │
│  ✓ 상위 20개 이름 전체 제공        │
│  ✓ 각 이름별 상세 해석             │
│  ✓ 사주 풀이 전문 리포트           │
│  ✓ 평생 보관 가능한 PDF            │
│  ✓ 즉시 다운로드 (결제 후 30초)    │
│                                    │
│  70,000원 (1회 결제)               │
│                                    │
│  [결제하고 보고서 받기]            │
└────────────────────────────────────┘
```

**결제 플로우**:
```typescript
// 1. 결제 요청
POST /api/payment/naming
{
  "sessionId": "uuid",
  "amount": 70000,
  "orderId": "order_20251027_123456",
  "customerName": "홍길동",
  "customerEmail": "hong@example.com"
}

// 2. TossPayments 리다이렉트
→ https://payment.toss.im/...

// 3. 결제 승인 (사용자)
→ 카드 정보 입력

// 4. 성공 콜백
→ /naming/payment/success?orderId=...&amount=...

// 5. 결제 확인
POST /api/payment/confirm
{
  "orderId": "order_20251027_123456",
  "amount": 70000,
  "paymentKey": "toss_payment_key"
}

// 6. Webhook 수신
POST /api/payment/webhook
{
  "orderId": "order_20251027_123456",
  "status": "DONE"
}

// 7. DB 업데이트
UPDATE naming_payments
SET
  status = 'DONE',
  unlocked = true,
  unlockedAt = NOW()
WHERE orderId = 'order_20251027_123456';

// 8. 리다이렉트
→ /naming/detail/:sessionId (Unlocked!)
```

**옵션 B: 전문가 매칭 (Phase 2)**

```
┌────────────────────────────────────┐
│  전문가 1:1 맞춤 상담              │
│                                    │
│  20년 경력의 작명 전문가가         │
│  직접 상담하고 이름을 지어드립니다 │
│                                    │
│  8만원 ~ 15만원                    │
│                                    │
│  [전문가 견적 받기 →]              │
└────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
전문가 목록:

┌────────────────────────────────────┐
│  김○○ 선생님  ⭐ 4.9 (127개)      │
│  경력 25년 | 완료 523건             │
│                                    │
│  "안녕하세요. 귀한 아이의 이름을   │
│   정성스럽게 지어드리겠습니다."    │
│                                    │
│  120,000원                         │
│  [선택하기]                        │
└────────────────────────────────────┘

... (다른 전문가들)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**옵션 C: 나중에 하기**

```
세션 ID를 저장해두고 나중에 결제 가능
(7일간 유효)
```

---

## 🏗️ 기술 아키텍처

### 시스템 구조

```
┌──────────────────────────────────────────────┐
│  Client (Browser)                            │
│  ┌────────────────────────────────────────┐  │
│  │  /naming/new                           │  │
│  │  ├─ Step 1: 정보입력                   │  │
│  │  ├─ Step 2: 사주분석                   │  │
│  │  ├─ Step 3: 이름추천 (5개 무료)        │  │
│  │  └─ Step 4: 결제/전문가                │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
                    ↓ HTTP
┌──────────────────────────────────────────────┐
│  Remix Server                                │
│  ┌────────────────────────────────────────┐  │
│  │  통합 API                              │  │
│  │  POST /api/naming/freemium             │  │
│  │  ├─ Stage 1: 세션 생성                 │  │
│  │  ├─ Stage 2: 사주 계산                 │  │
│  │  └─ Stage 3: 이름 추천                 │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  결제 API                              │  │
│  │  POST /api/payment/naming              │  │
│  │  POST /api/payment/confirm             │  │
│  │  POST /api/payment/webhook             │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  Business Logic Layer                        │
│  ┌────────────────────────────────────────┐  │
│  │  NamingPipeline (8 Steps)              │  │
│  │  ├─ SajuCalculator                     │  │
│  │  ├─ YongsinAnalyzer (5 methods)        │  │
│  │  ├─ HanjaService                       │  │
│  │  └─ AI Integration (Claude)            │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Payment Service                       │  │
│  │  └─ TossPayments Integration           │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  Data Layer                                  │
│  ┌────────────────────────────────────────┐  │
│  │  PostgreSQL (Prisma)                   │  │
│  │  ├─ NamingSession                      │  │
│  │  ├─ NamingPayment                      │  │
│  │  ├─ HanjaDict (8,787)                  │  │
│  │  └─ CalendarData (96,429)              │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Redis (Cache)                         │  │
│  │  └─ Session, Hanja, Yongsin            │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### API 설계

#### 1. 통합 API: `/api/naming/freemium`

**Stage 1: 정보입력**
```typescript
POST /api/naming/freemium
Content-Type: application/json

{
  "stage": 1,
  "data": {
    "lastName": "김",
    "lastNameStrokes": 8,
    "gender": "M",
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "isLunar": false,
    "selectedValues": ["health", "wisdom"]
  }
}

Response 201:
{
  "sessionId": "uuid",
  "stage": 1,
  "nextStage": 2
}
```

**Stage 2: 사주분석**
```typescript
POST /api/naming/freemium
Content-Type: application/json

{
  "stage": 2,
  "sessionId": "uuid"
}

Response 200:
{
  "sessionId": "uuid",
  "stage": 2,
  "saju": {
    "pillars": { ... },
    "elementCounts": { ... },
    "yongsin": { primary: "METAL" }
  },
  "nextStage": 3
}
```

**Stage 3: 이름추천**
```typescript
POST /api/naming/freemium
Content-Type: application/json

{
  "stage": 3,
  "sessionId": "uuid"
}

Response 200:
{
  "sessionId": "uuid",
  "stage": 3,
  "recommendations": [ ... ], // 5개
  "hasMore": true,
  "pricing": { auto: 70000, expertRange: [80000, 150000] },
  "nextStage": 4
}
```

#### 2. 결제 API

**결제 요청**
```typescript
POST /api/payment/naming
Content-Type: application/json

{
  "sessionId": "uuid",
  "amount": 70000,
  "orderId": "order_20251027_123456",
  "customerName": "홍길동",
  "customerEmail": "hong@example.com"
}

Response 200:
{
  "success": true,
  "orderId": "order_20251027_123456",
  "amount": 70000,
  "checkoutUrl": "https://payment.toss.im/..."
}
```

**결제 확인**
```typescript
POST /api/payment/confirm
Content-Type: application/json

{
  "orderId": "order_20251027_123456",
  "amount": 70000,
  "paymentKey": "toss_payment_key"
}

Response 200:
{
  "success": true,
  "orderId": "order_20251027_123456",
  "status": "DONE",
  "unlocked": true
}
```

**Webhook**
```typescript
POST /api/payment/webhook
Content-Type: application/json
X-Toss-Secret: xxxxxxxx

{
  "eventType": "PAYMENT_STATUS_CHANGED",
  "orderId": "order_20251027_123456",
  "status": "DONE"
}

Response 200:
{
  "received": true
}
```

### 데이터베이스 스키마

**기존 스키마 (유지)**
```prisma
model NamingPayment {
  id              String        @id @default(uuid())
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // 주문 정보
  orderId         String        @unique
  amount          Int
  status          PaymentStatus @default(PENDING)

  // 고객 정보
  userId          String?
  customerName    String
  customerEmail   String?
  customerPhone   String?

  // 작명 세션
  sajuDataId      String?

  // 결제 정보
  paymentKey      String?
  paymentType     String?
  approvedAt      DateTime?

  @@index([orderId])
  @@index([userId])
}

enum PaymentStatus {
  PENDING
  IN_PROGRESS
  DONE
  CANCELED
  PARTIAL_CANCELED
  ABORTED
  EXPIRED
}
```

**신규 스키마 (추가)**
```prisma
model NamingSession {
  id              String   @id @default(uuid())
  createdAt       DateTime @default(now())
  expiresAt       DateTime @default(dbgenerated("NOW() + interval '7 days'"))

  // 입력 정보
  lastName        String
  lastNameStrokes Int
  gender          String
  birthDate       DateTime
  birthTime       String
  isLunar         Boolean
  selectedValues  String[] // ["health", "wisdom"]

  // 분석 결과
  saju            Json
  yongsin         Json

  // 추천 이름
  top5            Json     // 무료 제공
  remaining15     Json     // 결제 후 제공
  allCandidates   Json     // 전체 50개

  // 결제 연동
  paymentId       String?  @unique
  payment         NamingPayment? @relation(fields: [paymentId], references: [id])

  @@index([createdAt])
  @@index([expiresAt])
}

// NamingPayment 수정
model NamingPayment {
  // ... 기존 필드

  // 추가 필드
  unlocked        Boolean  @default(false)  // ← 추가
  unlockedAt      DateTime?                 // ← 추가

  // 관계
  session         NamingSession?
}
```

**Migration Script**
```sql
-- 1. NamingSession 테이블 생성
CREATE TABLE naming_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '7 days',

  last_name       VARCHAR(10) NOT NULL,
  last_name_strokes INT NOT NULL,
  gender          VARCHAR(1) NOT NULL,
  birth_date      DATE NOT NULL,
  birth_time      VARCHAR(5) NOT NULL,
  is_lunar        BOOLEAN NOT NULL,
  selected_values TEXT[] NOT NULL,

  saju            JSONB NOT NULL,
  yongsin         JSONB NOT NULL,

  top5            JSONB NOT NULL,
  remaining15     JSONB NOT NULL,
  all_candidates  JSONB NOT NULL,

  payment_id      UUID UNIQUE REFERENCES naming_payments(id)
);

CREATE INDEX idx_naming_sessions_created ON naming_sessions(created_at);
CREATE INDEX idx_naming_sessions_expires ON naming_sessions(expires_at);

-- 2. NamingPayment 테이블 수정
ALTER TABLE naming_payments
  ADD COLUMN unlocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN unlocked_at TIMESTAMPTZ;

-- 3. 인덱스 추가
CREATE INDEX idx_naming_payments_unlocked ON naming_payments(unlocked);
```

---

## 📅 구현 계획 (5일)

### Week 1: Core Development (23시간)

#### Day 1: API Development (6시간)

**오전 (3시간)**
```
09:00-10:00  Task 1.1.1: Route setup
             - app/routes/api.naming.freemium.ts 생성
             - POST 핸들러 구조 작성
             - Zod validation 스키마 정의

10:00-11:30  Task 1.1.2: Stage routing
             - Stage별 분기 로직
             - Session validation
             - Error handling

11:30-12:00  Task 1.1.3: Pipeline integration (part 1)
             - NamingPipeline import
             - Context 설정
```

**오후 (3시간)**
```
13:00-14:30  Task 1.1.3: Pipeline integration (part 2)
             - Execute pipeline
             - Handle results
             - Extract top 5

14:30-15:00  Task 1.1.4: Response format
             - DTO 정의
             - JSON serialization
             - TypeScript types

15:00-16:00  Task 1.1.5: Error handling
             - Try-catch blocks
             - User-friendly messages
             - Logging setup

16:00-16:30  Task 1.1.6: Logging
             - Request logging
             - Performance tracking
             - Error reporting
```

**병렬 작업 (같은 날 가능)**
```
Day 1 동시에:
- Track A: API development (위 스케줄)
- Track B: Database schema (Task 1.2.1)
  → 다른 개발자가 수행 가능
```

#### Day 2: Payment Integration (4시간)

**오전 (2시간)**
```
09:00-10:00  Task 1.2.1: Database schema
             - schema.prisma 수정
             - Migration 작성
             - prisma migrate dev

10:00-11:00  Task 1.2.2: Payment endpoint
             - app/routes/api.payment.naming.ts
             - TossPayments 연동
             - DB 저장 로직
```

**오후 (2시간)**
```
13:00-14:30  Task 1.2.3: Webhook handler
             - app/routes/api.payment.webhook.ts
             - Secret validation
             - Unlocked 업데이트

14:30-15:00  Task 1.2.4: Unlock logic
             - Payment verification
             - Session unlock
             - Redirect logic
```

**병렬 작업**
```
Day 2 동시에:
- Track A: Payment (위 스케줄)
- Track B: UI structure (Task 1.3.1)
- Track C: QA setup (Task 1.5.1)
```

#### Day 3: UI Integration (6시간)

**오전 (3시간)**
```
09:00-09:30  Task 1.3.1: Route structure
             - app/routes/naming.new.tsx
             - Layout component
             - Progress indicator skeleton

09:30-10:30  Task 1.3.2: Progress indicator
             - 4-stage progress bar
             - Current stage highlight
             - Animations

10:30-12:00  Task 1.3.3: Stage components (part 1)
             - Stage1Form (정보입력)
             - Stage2Display (사주분석)
```

**오후 (3시간)**
```
13:00-14:30  Task 1.3.3: Stage components (part 2)
             - Stage3Results (이름추천 5개)
             - Stage4Payment (결제/전문가)

14:30-16:00  Task 1.3.4: Wire APIs
             - useFetcher hooks
             - Loading states
             - Error handling

16:00-16:30  Task 1.3.5: Responsive layout
             - Mobile optimization
             - Tablet breakpoints

16:30-17:00  Task 1.3.6: Loading states
             - Skeleton screens
             - Progress animations
```

#### Day 4: Unlock Logic + Testing (7시간)

**오전 (4시간)**
```
09:00-10:00  Task 1.4.1: Payment verification
             - Check unlocked status
             - Redirect logic
             - Access control

10:00-11:00  Task 1.4.2: Access control
             - Middleware setup
             - Auth check
             - Error pages

11:00-12:30  Task 1.4.3: 20-name display
             - app/routes/naming.detail.$id.tsx
             - Load remaining15 from DB
             - Display all 20 names

12:30-13:00  Task 1.4.4: PDF download
             - PDF generation (optional)
             - Download button
```

**오후 (3시간)**
```
13:00-13:30  Task 1.5.1: Test setup
             - Vitest configuration
             - Test utilities
             - Mock data

13:30-14:30  Task 1.5.2: Happy path test
             - E2E test: Stage 1→4
             - Assertion checks
             - Screenshot validation

14:30-15:00  Task 1.5.3: Payment sandbox
             - TossPayments test card
             - Webhook simulation
             - DB verification

15:00-16:00  Task 1.5.4: Error scenarios
             - Invalid input
             - Payment failure
             - API timeout
```

#### Day 5: Polish + Buffer (3시간)

```
09:00-10:00  Code review
             - Self review
             - Refactoring

10:00-11:00  Documentation
             - API docs
             - README update

11:00-12:00  Buffer time
             - Bug fixes
             - Final testing
```

### Week 2: Launch Prep (15시간)

#### Day 6-7: Analytics + Expert UI (7시간)

**Day 6 (4시간)**
```
09:00-10:00  Task 2.1.1: Define events
             - Event taxonomy
             - GTM setup
             - Data layer

10:00-11:30  Task 2.1.2: Implement tracking
             - useAnalytics hook
             - Event tracking code
             - Test events

11:30-12:30  Task 2.1.3: Funnel setup
             - GA4 funnel
             - Conversion goals
             - Dashboard

12:30-13:00  Task 2.1.4: Alerts
             - Error alerts
             - Payment alerts
             - Slack integration
```

**Day 7 (3시간)**
```
09:00-10:30  Task 2.2.1: Expert listing
             - app/routes/naming.experts.tsx
             - Dummy expert data
             - List component

10:30-11:30  Task 2.2.2: Profile cards
             - ExpertCard component
             - Rating display
             - Price display

11:30-12:00  Task 2.2.3: Consultation flow
             - Select expert button
             - Redirect to chat (mock)
```

#### Day 8-10: QA & Deployment (8시간)

**Day 8 (2시간)**
```
09:00-11:00  Task 2.3.1: QA testing
             - Functional testing
             - Integration testing
             - UAT checklist
```

**Day 9 (4.5시간)**
```
09:00-12:00  Task 2.3.2: Bug fixes
             - Fix priority bugs
             - Regression testing
             - Code cleanup

13:00-14:30  Task 2.3.3: Performance
             - Load testing
             - Optimization
             - CDN setup
```

**Day 10 (1.5시간)**
```
09:00-09:30  Task 2.3.4: Production config
             - Environment variables
             - Database backup
             - Monitoring setup

09:30-10:00  Task 2.3.5: Deploy
             - Deploy to production
             - Health check
             - DNS verification

10:00-10:30  Task 2.3.6: Monitor
             - Watch metrics
             - Check errors
             - User testing
```

### 병렬 처리 전략

**시간 절약 분석**:
```
Sequential (모든 작업 순차):     51.5 hours (6.4 days)
Parallel (최적화):                38 hours (5 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
절감:                             13.5 hours (26%)
```

**병렬 실행 가능한 작업**:
```
Day 1:
├─ Track A: API route setup (1.1.1-1.1.6)
├─ Track B: Database schema (1.2.1)
└─ Track C: UI route structure (1.3.1)

Day 2:
├─ Track A: Payment endpoint (1.2.2-1.2.3)
├─ Track B: Progress indicator (1.3.2)
└─ Track C: Test setup (1.5.1)

Day 3:
├─ Track A: Stage components (1.3.3)
└─ Track B: Unlock logic (1.4.1-1.4.2)
```

---

## ⚠️ 리스크 관리

### 기술적 리스크

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| **API 통합 복잡도** | 🟡 중 | 🔴 고 | - Step-by-step 개발<br>- 각 Stage별 단위 테스트<br>- Mock data로 프론트엔드 먼저 개발 |
| **결제 버그** | 🟢 저 | 🔴 고 | - 샌드박스 철저히 검증<br>- Webhook 재시도 로직<br>- Manual 결제 확인 도구 준비 |
| **성능 저하** | 🟢 저 | 🟡 중 | - Redis 캐싱 활용<br>- DB 쿼리 최적화<br>- CDN 설정 |
| **TypeScript 타입 오류** | 🟡 중 | 🟢 저 | - Zod로 런타임 검증<br>- Prisma 자동 타입 생성<br>- Strict 모드 활성화 |

### 비즈니스 리스크

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| **전환율 낮음 (<10%)** | 🟡 중 | 🔴 고 | - A/B 테스트 (가격, CTA)<br>- 무료 이름 품질 극대화<br>- 가치 명확화 (testimonial) |
| **무료 사용자만 증가** | 🟡 중 | 🔴 고 | - Email 수집 후 리마케팅<br>- Push notification<br>- Referral 프로그램 |
| **환불 요청 증가** | 🟢 저 | 🟡 중 | - 명확한 환불 정책<br>- 무료 샘플 충분히 제공<br>- 고객 만족도 모니터링 |

### 통합 리스크

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| **기존 코드 호환성** | 🟢 저 | 🔴 고 | - TypeScript로 타입 체크<br>- E2E 테스트<br>- Gradual migration |
| **DB Migration 실패** | 🟢 저 | 🔴 고 | - Backup 필수<br>- Rollback script 준비<br>- Staging 먼저 테스트 |
| **TossPayments API 변경** | 🟢 저 | 🟡 중 | - API 버전 고정<br>- Webhook retry<br>- Manual fallback |

---

## 📊 성공 지표

### 기술적 KPI

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **API 응답 시간** | <500ms (p95) | Datadog, Lighthouse |
| **페이지 로드 시간** | <2s (p95) | Lighthouse, GTmetrix |
| **결제 성공률** | >95% | Payment logs |
| **에러율** | <1% | Sentry |
| **Lighthouse 점수** | >90 | Lighthouse CI |
| **가동 시간** | >99.9% | Uptime Robot |

### 비즈니스 KPI

| 단계 | 지표 | 목표 | 측정 방법 |
|------|------|------|-----------|
| **Stage 1 → 2** | 진입률 | >80% | GA4 funnel |
| **Stage 2 → 3** | 완료율 | >70% | GA4 funnel |
| **Stage 3 → 4** | 조회율 | >60% | GA4 funnel |
| **Stage 4 결제** | 전환율 | >20% | GA4, DB query |
| **최종 전환** | Stage 1 → 결제 | >10% | GA4 |

**예상 퍼널**:
```
1,000명 진입
  ├─ 800명 (80%) → Stage 2 완료
  │   ├─ 560명 (70%) → Stage 3 완료
  │   │   ├─ 336명 (60%) → Stage 4 조회
  │   │   │   ├─ 200명 (20%) → 결제 완료 ⭐
  │   │   │   └─ 136명 → 이탈
  │   │   └─ 224명 → 이탈
  │   └─ 240명 → 이탈
  └─ 200명 → 이탈

최종 전환율: 200/1,000 = 20% ⭐
```

### 재무 KPI

| 지표 | 목표 | 계산 |
|------|------|------|
| **월 매출** | ₩16,500,000 | 200명 × ₩70,000 + 수수료 |
| **월 비용** | ₩7,535,000 | API + 인프라 + 전문가 |
| **월 순이익** | ₩8,965,000 | 매출 - 비용 |
| **ROAS** | 600% | 순이익 / 마케팅 비용 |
| **CAC** | <₩10,000 | 마케팅 비용 / 전환 |
| **LTV** | >₩100,000 | 재구매 + 추천 |

---

## 🚀 다음 단계

### 즉시 (오늘)

1. **✅ 문서 검토** (30분)
   - README-NAMING-FREEMIUM.md 읽기
   - WBS 개요 파악
   - 기술 스택 가이드 확인

2. **✅ 환경 검증** (30분)
   - TossPayments 샌드박스 접근 확인
   - Database 권한 확인
   - 기존 NamingPipeline 코드 리뷰

3. **✅ 브랜치 생성** (10분)
   ```bash
   git checkout -b feature/naming-freemium-api
   git checkout -b feature/naming-freemium-payment
   git checkout -b feature/naming-freemium-ui
   ```

### 내일 (Day 1)

1. **09:00 Morning Standup**
   - 오늘의 목표: API Development (6시간)
   - 병렬 작업: DB schema (1시간)

2. **09:00-16:30 Implementation**
   - Task 1.1.1 ~ 1.1.6 완료
   - Task 1.2.1 병렬 작업

3. **16:30 Daily Review**
   - 완료 태스크 체크
   - 내일 준비

### 이번 주 (Week 1)

- ✅ Day 1: API Development (6h)
- ✅ Day 2: Payment Integration (4h)
- ✅ Day 3: UI Integration (6h)
- ✅ Day 4: Unlock + Testing (7h)
- ✅ Day 5: Polish + Buffer (3h)

**목표**: Phase 1 완료 (23시간)

### 다음 주 (Week 2)

- ✅ Day 6: Analytics Setup (4h)
- ✅ Day 7: Expert UI Dummy (3h)
- ✅ Day 8-10: QA & Deployment (8h)

**목표**: Production 배포

---

## 📚 참조 문서

### 프로젝트 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| **README** | `claudedocs/README-NAMING-FREEMIUM.md` | 시작 가이드 |
| **WBS** | `claudedocs/naming-freemium-wbs.md` | 상세 작업 분해 |
| **Quick Reference** | `claudedocs/naming-freemium-quick-reference.md` | 일일 실행 가이드 |
| **Dependency Graph** | `claudedocs/naming-freemium-dependency-graph.md` | 의존성 시각화 |
| **Implementation Summary** | `claudedocs/naming-freemium-implementation-summary.md` | 경영진 요약 |
| **Tech Stack Guide** | `claudedocs/tech-stack-patterns-guide.md` | 기술 패턴 |
| **Business Analysis** | `claudedocs/business-process-analysis.md` | 비즈니스 분석 |
| **Service Comparison** | `claudedocs/SERVICE_COMPARISON.md` | 기존 vs 신규 |

### 기술 문서

| 기술 | 공식 문서 | 버전 |
|------|----------|------|
| **Remix** | https://remix.run/docs/en/v2 | v2.x |
| **TossPayments** | https://docs.tosspayments.com/en | latest |
| **Prisma** | https://www.prisma.io/docs | v5.x |
| **React** | https://react.dev | v18.x |
| **Zod** | https://zod.dev | v3.x |

### 코드 참조

| 컴포넌트 | 파일 | 라인 |
|----------|------|------|
| **NamingPipeline** | `app/lib/naming/pipeline/naming-pipeline.ts` | 1,034 |
| **SajuCalculator** | `app/lib/saju/calculator.ts` | 376 |
| **YongsinAnalyzer** | `app/lib/naming/pipeline/steps/step2-calculate-yongsin.ts` | - |
| **HanjaService** | `app/lib/hanja-service.server.ts` | 524 |
| **TossPayments** | `app/components/payment/TossPaymentsButton.tsx` | - |

---

## ✅ 체크리스트

### 시작 전

- [ ] 모든 프로젝트 문서 읽음
- [ ] TossPayments 샌드박스 계정 확인
- [ ] Database 백업 완료
- [ ] 개발 환경 설정 완료
- [ ] Git 브랜치 생성 완료

### Phase 1 완료 기준

- [ ] 4단계 플로우 완벽 작동
- [ ] 결제 시스템 샌드박스 검증
- [ ] E2E 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트 완료

### Phase 2 완료 기준

- [ ] Analytics 이벤트 정상 수집
- [ ] 전문가 UI 더미 데이터 표시
- [ ] 프로덕션 배포 완료
- [ ] 모니터링 설정 완료
- [ ] 고객 지원 준비 완료

### 배포 전 최종 체크

- [ ] Lighthouse 점수 >90
- [ ] 모든 E2E 테스트 통과
- [ ] 결제 플로우 검증 완료
- [ ] 환경 변수 설정 확인
- [ ] DB Migration 완료
- [ ] CDN 설정 완료
- [ ] 에러 모니터링 활성화
- [ ] 백업 스크립트 준비

---

## 🎉 결론

### 핵심 요약

1. **기존 코드 85% 재사용** - NamingPipeline, SajuCalculator 등 모두 완성
2. **신규 개발 15%** - 통합 API, 결제 플로우, UI 통합만
3. **5일 완성** - 38시간 (병렬 처리로 26% 시간 절약)
4. **월 900만원 수익** - 1,000명 기준 20% 전환율

### 성공 요인

- ✅ **품질 높은 무료 티저** - 5개 이름으로 가치 입증
- ✅ **명확한 가격** - 70,000원 합리적
- ✅ **빠른 전환** - 즉시 다운로드 (30초)
- ✅ **기술 안정성** - 검증된 코드 재사용

### 다음 단계

1. **즉시**: 문서 검토 + 환경 설정
2. **내일**: API 개발 시작
3. **이번 주**: Phase 1 완료
4. **다음 주**: 프로덕션 배포

---

**Ready to start?** 🚀

모든 준비가 완료되었습니다. Day 1부터 시작하시면 됩니다!
