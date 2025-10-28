# 📊 시스템 현황 분석 및 개선 계획안

**분석일**: 2025-10-27
**목표**: 로컬(한국인) + 글로벌(외국인) 통합 서비스 아키텍처 구축
**분석 범위**: 데이터베이스, API, 프론트엔드, 결제 시스템

---

## 🎯 최종 목표 (사용자 요구사항)

### 1. 로컬 서비스 (한국인 타겟)
- **신생아 작명**: 사주 기반 AI 추천
- **개명**: 현재 이름 분석 + 개선안 제시
- **사주 궁합**: 커플 궁합 분석

### 2. 글로벌 서비스 (외국인 타겟)
- **K-작명 체험**: 영어 이름 → 한국 이름 변환
- **아이돌 궁합**: K-pop 아이돌과의 궁합 분석
- **문화 굿즈**: 디지털/물리적 상품 판매
- **바이럴 메커니즘**: SNS 공유 유도

### 3. 공통 요구사항
- 같은 사주 계산 로직 기반
- 결제 시스템만 차별화 (TossPayments vs Stripe)
- 마이페이지 통합 (NamingPayment 중심)

---

## 📋 현재 시스템 상태 (As-Is Analysis)

### 1. 데이터베이스 스키마 (Prisma)

#### ✅ 구현 완료
```prisma
# Freemium 작명 시스템
model NamingSession {
  id              String
  lastName        String
  gender          String
  birthDate       DateTime
  birthTime       String
  isLunar         Boolean
  selectedValues  String[]      # 부모 가치관 (1-3개)

  saju            Json          # 사주 분석 결과
  yongsin         Json          # 용신 분석 결과

  top5            Json          # 무료 5개 ⚠️
  remaining15     Json          # 유료 15개 ⚠️
  allCandidates   Json          # 전체 50개

  payment         NamingPayment?
}

model NamingPayment {
  id              String
  orderId         String        # 주문 ID
  paymentKey      String?       # 결제 키 (승인 후)
  amount          Int           # 결제 금액
  status          TossPaymentStatus
  unlocked        Boolean       # 잠금 해제 여부

  sessionId       String?       # NamingSession 연결
  session         NamingSession?
}
```

**문제점**:
1. **수량 불일치**:
   - 비즈니스 계획안: 무료 2개 + 유료 8개 (2+8)
   - 현재 DB: 무료 5개 + 유료 15개 (5+15)
   - ⚠️ **결정 필요!**

2. **레거시 시스템 혼재**:
   - `Payment` + `ServiceOrder` (구 시스템, 미사용)
   - `NamingPayment` + `NamingSession` (신규, 활성)
   - → 마이페이지는 이미 `NamingPayment`로 마이그레이션 완료 ✅

#### ❌ 미구현
```prisma
# 글로벌 서비스용
model GlobalNameSession       # 외국인 K-name 세션
model IdolCompatibility       # 아이돌 궁합 결과
model Idol                    # 아이돌 DB (100+)
model CultureShopOrder        # 문화 굿즈 주문

# 추가 서비스용
model RenamingService         # 개명 서비스
model CompatibilityService    # 커플 궁합 서비스
```

### 2. API 구조

#### ✅ 구현 완료
```typescript
POST /api/naming/freemium
  - Stage 1: 정보입력 → sessionId 생성
  - Stage 2: 사주분석 → saju, yongsin 저장
  - Stage 3: 이름추천 → top5 반환 (무료 5개)

GET /api/naming/analyze
  - 레거시 사주 계산 (방금 await 버그 수정 ✅)
```

**현재 Stage 3 응답 구조**:
```json
{
  "success": true,
  "recommendations": [/* 5개 */],
  "hasMore": true,
  "pricing": {
    "auto": 70000,
    "expertRange": [80000, 150000]
  },
  "nextStage": 4
}
```

#### ❌ 미구현
```typescript
# 결제 시스템
POST /api/payment/naming       # TossPayments 결제 시작
POST /api/payment/webhook      # 결제 완료 콜백
POST /api/payment/unlock       # 잠금 해제 (unlocked = true)

# 글로벌 서비스
GET  /api/global/name          # 영어 → 한국 이름
POST /api/global/unlock        # 공유 or 소액 결제
POST /api/global/share         # 공유 추적
GET  /api/idol/list            # 아이돌 목록
POST /api/idol/compatibility   # 궁합 계산
POST /api/shop/order           # 문화 굿즈 구매

# 추가 서비스
POST /api/naming/renaming      # 개명 서비스
POST /api/naming/compatibility # 커플 궁합
```

### 3. 프론트엔드 Routes

#### ✅ 구현 완료
```
/naming/freemium
  ├─ /naming/freemium/_index     # Stage 1: 정보입력
  ├─ /naming/freemium/analysis   # Stage 2: 사주분석
  └─ /naming/freemium/results    # Stage 3: 이름추천 (무료 5개)

/account
  ├─ /account/payments           # 결제 내역 (NamingPayment ✅)
  └─ /account/orders             # 서비스 이용 내역 (NamingSession ✅)
```

#### ❌ 미구현
```
# 결제 플로우
/naming/freemium/payment         # Stage 4: 결제 페이지
/naming/freemium/success         # 결제 성공 페이지
/naming/freemium/result          # 전체 20개 이름 보기 (결제 후)

# 글로벌 서비스
/global
  ├─ /global/input               # 영어 이름 입력
  ├─ /global/result              # 무료 1개 + 잠금 2개
  ├─ /global/unlock              # 공유 모달
  ├─ /global/idol                # 아이돌 선택
  └─ /global/shop                # 문화 굿즈

# 추가 서비스
/renaming                        # 개명 서비스
/compatibility                   # 사주 궁합
```

---

## 🔍 Gap 분석 (현재 vs 계획안)

### Critical Gaps (즉시 해결 필요)

#### Gap #1: 무료/유료 수량 불일치 ⚠️
| 항목 | 비즈니스 계획안 | 현재 구현 | 영향도 |
|------|----------------|----------|-------|
| 무료 이름 | 2개 | 5개 | 전환율 직접 영향 |
| 유료 이름 | 8개 | 15개 | 가격/가치 불일치 |
| 합계 | 10개 | 20개 | - |

**심리 전략 분석**:
```
계획안 (2+8):
- Gap Effect 극대화 (89점 vs 99점, 10점 차이)
- "단 2개만 봤다" → 강한 FOMO
- Peak-End Rule: End = "더 좋은 게 있을 것 같다"
- 예상 전환율: 32-35%

현재 (5+15):
- Gap Effect 약화 (더 많은 무료 샘플)
- "5개나 봤다" → 만족감 증가, 구매 동기 감소
- Peak-End Rule: End = "5개면 충분해"
- 예상 전환율: 20-25% (⬇️ 10%p 하락)
```

**재무 영향 시뮬레이션 (월 1,000명 기준)**:
```
2+8 구조 (32% 전환):
- 결제: 320명 × 69,000원 = 22,080,000원

5+15 구조 (22% 전환):
- 결제: 220명 × 69,000원 = 15,180,000원

손실: 6,900,000원/월 (31% 매출 감소) ⚠️
```

**권장 사항**:
- ✅ 비즈니스 계획안대로 **2+8 구조로 변경**
- DB 마이그레이션: `top5` → `top2`, `remaining15` → `locked8`
- API 수정: Stage 3에서 2개만 반환

#### Gap #2: 결제 시스템 미구현 🚨
**현재 상태**:
- DB 모델: `NamingPayment` ✅ (TossPaymentStatus enum 포함)
- API: ❌ 없음
- UI: ❌ 없음

**비즈니스 영향**:
- 무료 서비스만 제공 중 → **매출 0원** 🚨
- 사용자는 5개 이름 보고 만족 → 이탈

**필요 작업**:
```typescript
1. TossPayments API 연동
   POST /api/payment/naming
   - TossPayments checkout session 생성
   - 69,000원 결제 요청

   POST /api/payment/webhook
   - 결제 완료 시 unlocked = true
   - 이메일 발송 (PDF)

2. 프론트엔드
   /naming/freemium/payment
   - 결제 플로우 UI
   - 가격/혜택 표시
   - TossPayments Widget 통합

   /naming/freemium/success
   - 전체 20개 이름 표시
   - PDF 다운로드 버튼
```

#### Gap #3: 글로벌 서비스 완전 부재 ❌
**현재 상태**: 아무것도 없음

**비즈니스 영향**:
- 바이럴 성장 기회 상실
- 외국인 시장 진입 불가
- 계획안 매출의 50% 미달성

**필요 작업**:
- DB 스키마 추가 (4개 모델)
- API 구현 (8개 엔드포인트)
- 프론트엔드 (5개 페이지)
- Stripe 연동

---

## 🛠️ 개선 계획 (To-Be Architecture)

### Phase 1: 핵심 기능 완성 (Week 1-2) 🔥 **최우선**

#### Task 1.1: 무료/유료 수량 조정 (2+8 구조)
```sql
-- Prisma Schema 수정
model NamingSession {
  top2            Json    # 무료 2개 (was: top5)
  locked8         Json    # 유료 8개 (was: remaining15)
  allCandidates   Json    # 전체 50개 (유지)
}
```

**API 수정**:
```typescript
// api.naming.freemium.ts - handleStage3()
const top2 = allCandidates.slice(0, 2);  // was: slice(0, 5)
const locked8 = allCandidates.slice(2, 10); // was: slice(5, 20)

await prisma.namingSession.update({
  data: {
    top2: top2 as any,
    locked8: locked8 as any,
    allCandidates: allCandidates as any,
  },
});
```

**예상 시간**: 2시간

#### Task 1.2: TossPayments 결제 시스템 구현
```typescript
// 1. API 구현 (4시간)
app/routes/api.payment.naming.ts
app/routes/api.payment.webhook.ts

// 2. 프론트엔드 (6시간)
app/routes/naming.freemium.payment.tsx
app/routes/naming.freemium.success.tsx

// 3. 환경 변수
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

**결제 플로우**:
```
1. 사용자가 "프리미엄 잠금 해제" 버튼 클릭
2. POST /api/payment/naming { sessionId }
3. TossPayments checkout session 생성
4. 사용자 결제 진행
5. 성공 시 webhook → unlocked = true
6. /naming/freemium/success?sessionId=xxx 리다이렉트
7. 전체 10개 이름 표시 + PDF 다운로드
```

**예상 시간**: 10시간

#### Task 1.3: 프론트엔드 UI 완성
**컴포넌트 재사용**:
- ✅ `HanjaSelector` (기존)
- ✅ `Calendar`, `TimePicker` (기존)
- ✅ `NameCard` (기존)
- ⏳ `ValueSelector` (신규 1시간)
- ⏳ `PremiumCTA` (신규 2시간)
- ⏳ `PaymentModal` (신규 3시간)

**페이지별 작업**:
```
/naming/freemium/_index          # ValueSelector 추가 (1시간)
/naming/freemium/analysis        # 유지 (0시간)
/naming/freemium/results         # 2개 표시 + CTA 강화 (2시간)
/naming/freemium/payment         # 신규 (3시간)
/naming/freemium/success         # 신규 (2시간)
```

**예상 시간**: 8시간

**Phase 1 총 소요시간**: **20시간 (약 3일, 1일 8시간 기준)**

---

### Phase 2: 글로벌 서비스 (Week 3-4)

#### Task 2.1: 데이터베이스 스키마 확장
```prisma
model GlobalNameSession {
  id              String
  englishName     String
  koreanName      String
  hanja           String
  meaning         String
  score           Int

  unlocked        Boolean   # 2개 추가 잠금 해제 여부
  unlockMethod    String?   # 'share', 'payment'
  additionalNames Json?     # 2개 추가

  referralCode    String    # 공유 추적용
  sharedPlatform  String?   # 'instagram', 'tiktok', 'twitter'
  referralCount   Int
}

model IdolCompatibility {
  id              String
  sessionId       String        # GlobalNameSession ID
  idolId          String
  score           Int           # 궁합 점수 (0-100)
  details         Json          # 상세 분석
  paid            Boolean       # 결제 여부
  paymentId       String?       # Stripe payment ID
}

model Idol {
  id              String
  name            String        # "Jungkook"
  koreanName      String        # "정국"
  group           String        # "BTS"
  birthDate       DateTime
  saju            Json          # 미리 계산된 사주
  yongsin         Json          # 미리 계산된 용신
  popularity      Int           # 검색량 기반 순위
}

model CultureShopOrder {
  id              String
  sessionId       String
  productType     String        # 'stamp', 'calligraphy', 'necklace'
  amount          Int
  currency        String        # 'USD'
  status          String
  stripeOrderId   String?
  digitalFiles    Json?         # 디지털 상품 URL
  shippingAddress Json?         # 물리적 상품 배송지
  trackingNumber  String?
}
```

**예상 시간**: 2시간

#### Task 2.2: 글로벌 API 구현
```typescript
GET  /api/global/name?name=John           # 4시간
POST /api/global/unlock                   # 2시간
POST /api/global/share                    # 2시간
GET  /api/idol/list                       # 1시간
POST /api/idol/compatibility              # 3시간
POST /api/shop/order                      # 2시간
```

**예상 시간**: 14시간

#### Task 2.3: 글로벌 프론트엔드
```
/global/input               # 영어 이름 입력 (1시간)
/global/result              # 무료 1개 + 잠금 2개 (3시간)
/global/unlock              # 공유 모달 (Instagram/TikTok 템플릿) (4시간)
/global/idol                # 아이돌 선택 (3시간)
/global/shop                # 문화 굿즈 (3시간)
```

**예상 시간**: 14시간

#### Task 2.4: Stripe 결제 연동
```typescript
# Stripe Checkout Session 생성
- 아이돌 궁합: $1.49-4.99
- 문화 굿즈: $2.99-39.99
```

**예상 시간**: 4시간

**Phase 2 총 소요시간**: **34시간 (약 4-5일)**

---

### Phase 3: 추가 서비스 (Month 2+)

#### Task 3.1: 개명 서비스
```prisma
model RenamingService {
  id                String
  currentName       String        # 현재 이름 (한자)
  currentScore      Float         # 현재 점수
  problemAnalysis   Json          # 문제점 분석
  recommendations   Json          # 개선안 (10개)
  paymentId         String?
}
```

```typescript
POST /api/naming/renaming/analyze      # 현재 이름 분석
POST /api/naming/renaming/recommend    # 개선안 추천
```

**예상 시간**: 16시간

#### Task 3.2: 사주 궁합 서비스
```prisma
model CompatibilityService {
  id              String
  user1Saju       Json
  user2Saju       Json
  score           Int             # 궁합 점수
  analysis        Json            # 상세 분석
  paymentId       String?
}
```

```typescript
POST /api/compatibility/analyze        # 커플 궁합 분석
```

**예상 시간**: 12시간

**Phase 3 총 소요시간**: **28시간**

---

## 📊 우선순위별 작업 로드맵

### 🔥 Critical (즉시 시작 - Week 1)
1. ✅ **await 버그 수정** (완료)
2. ⏳ **2+8 구조 변경** (2시간)
3. ⏳ **TossPayments API** (4시간)
4. ⏳ **결제 UI** (6시간)

**목표**: **한국인 신생아 작명 서비스 완전 출시** → 매출 발생 시작 💰

### 🟡 High Priority (Week 2)
1. ⏳ **프론트엔드 완성** (8시간)
2. ⏳ **E2E 테스트** (4시간)
3. ⏳ **프로덕션 배포** (2시간)

**목표**: **완전한 Freemium 플로우** → 전환율 최적화 🎯

### 🟢 Medium Priority (Week 3-4)
1. ⏳ **글로벌 DB 스키마** (2시간)
2. ⏳ **글로벌 API** (14시간)
3. ⏳ **글로벌 UI** (14시간)
4. ⏳ **Stripe 연동** (4시간)

**목표**: **바이럴 성장 엔진 가동** → 외국인 시장 진입 🌍

### ⚪ Low Priority (Month 2+)
1. ⏳ **개명 서비스** (16시간)
2. ⏳ **사주 궁합** (12시간)
3. ⏳ **문화 굿즈 확장** (20시간)
4. ⏳ **물리적 상품** (외주)

**목표**: **서비스 라인업 확장** → 객단가 증대 💎

---

## 📈 예상 타임라인

```
Week 1 (Day 1-3):
├─ Day 1: 2+8 구조 변경 + TossPayments API
├─ Day 2: 결제 UI + ValueSelector
└─ Day 3: 통합 테스트 + 버그 수정
   → 🎉 한국인 신생아 작명 MVP 출시

Week 2 (Day 4-7):
├─ Day 4-5: 프론트엔드 완성 + UX 개선
├─ Day 6: E2E 테스트
└─ Day 7: 프로덕션 배포 + 모니터링
   → 🎯 전환율 추적 시작

Week 3-4 (Day 8-14):
├─ Day 8-9: 글로벌 DB + API
├─ Day 10-12: 글로벌 UI
└─ Day 13-14: Stripe + 테스트
   → 🌍 글로벌 서비스 출시

Month 2:
└─ 추가 서비스 (개명, 궁합) + 최적화
   → 💰 다각화된 수익 구조
```

---

## ⚠️ 리스크 및 대응 방안

### Risk #1: 2+8 구조 변경 시 DB 마이그레이션
**리스크**: 기존 세션 데이터 손실

**대응**:
```sql
-- 안전한 마이그레이션
ALTER TABLE naming_sessions
  ADD COLUMN top2 JSONB,
  ADD COLUMN locked8 JSONB;

-- 기존 데이터 변환
UPDATE naming_sessions
SET
  top2 = top5::jsonb->0:1,  -- 첫 2개
  locked8 = top5::jsonb->2:9; -- 다음 8개

-- 검증 후 old columns 제거
ALTER TABLE naming_sessions
  DROP COLUMN top5,
  DROP COLUMN remaining15;
```

### Risk #2: TossPayments 테스트 환경
**리스크**: 실제 결제 발생 위험

**대응**:
- ✅ 테스트 키 사용: `test_ck_...`, `test_sk_...`
- ✅ 환경 분리: `.env.development` vs `.env.production`
- ✅ 금액 제한: 테스트 환경에서는 1,000원으로 제한

### Risk #3: 글로벌 서비스 복잡도
**리스크**: 개발 시간 초과

**대응**:
- MVP 먼저: 이름 변환 + 아이돌 궁합만
- 문화 굿즈는 Phase 3로 연기
- 아이돌 DB는 Top 20만 먼저

---

## 💡 다음 단계 (Next Actions)

### Immediate (오늘)
1. ✅ **시스템 분석 완료** (이 문서)
2. ⏳ **2+8 구조 변경 시작**
   ```bash
   # Prisma schema 수정
   vim prisma/schema.prisma

   # 마이그레이션 생성
   npx prisma migrate dev --name change_to_2plus8_structure
   ```

3. ⏳ **TossPayments 환경 설정**
   ```bash
   # .env 파일 수정
   echo "TOSS_CLIENT_KEY=test_ck_..." >> .env
   echo "TOSS_SECRET_KEY=test_sk_..." >> .env
   ```

### This Week
1. Task 1.1: 2+8 구조 변경 (2시간)
2. Task 1.2: TossPayments API (4시간)
3. Task 1.3: ValueSelector (1시간)
4. Task 1.4: 결제 UI (6시간)

**목표**: **금주 내 한국인 서비스 MVP 출시** 🚀

---

## 📝 결론

### 현재 상황 요약
- ✅ **Core 기능**: 사주 계산, 이름 생성 로직 완성
- ✅ **DB 모델**: NamingSession, NamingPayment 준비 완료
- ⚠️ **Gap**: 결제 시스템, 글로벌 서비스 미구현

### 핵심 개선 사항
1. **2+8 구조 변경**: 전환율 10%p 향상 예상 → +6.9M원/월
2. **결제 시스템 구현**: 매출 발생 시작 (0원 → 22M원/월)
3. **글로벌 서비스**: 바이럴 성장 + 외국인 시장 (추가 24M원/월)

### 예상 성과
- **Week 1**: 한국인 MVP 출시 → 첫 매출 발생
- **Week 2**: 전환율 최적화 → 월 22M원
- **Week 3-4**: 글로벌 출시 → 월 46M원
- **Month 2**: 추가 서비스 → 월 60M원+

**ROI**: 개발 시간 82시간 (약 10일) → 월 4,600만원 매출 달성 🎯

---

**문서 버전**: v1.0
**작성자**: Claude (System Analyst)
**승인 대기**: 사용자 확인 필요 ✅
