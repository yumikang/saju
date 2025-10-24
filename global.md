# 📋 SajuName: AI-Powered Korean Name Generator
## Product Requirements Document (PRD) v2.0

**최종 업데이트:** 2025년 10월 24일  
**작성자:** Product Team  
**상태:** Ready for Development ✅

---

## 📑 목차

1. [Executive Summary](#1-executive-summary)
2. [Problem & Solution](#2-problem--solution)
3. [Target Market](#3-target-market)
4. [Core Features](#4-core-features)
5. [Technical Architecture](#5-technical-architecture)
6. [Naming Algorithm](#6-naming-algorithm)
7. [Scoring System](#7-scoring-system)
8. [Development Roadmap](#8-development-roadmap)
9. [Business Model](#9-business-model)
10. [Go-to-Market Strategy](#10-go-to-market-strategy)
11. [Success Metrics](#11-success-metrics)
12. [Risk Management](#12-risk-management)

---

## 1. Executive Summary

### 🎯 **한 문장 요약**
**외국인에게 전통 작명 철학을 기반으로 완벽한 한국 이름을 추천하는 AI 서비스**

### 💡 **핵심 가치 제안**

```
기존 서비스: 단순 발음 변환 또는 근거 없는 추천
   예: John → 존 (의미 없음)

우리 서비스: 학술적 검증 + 전통 철학 + AI 분석
   예: John → 김준우 (金俊宇)
   - 사주 분석: 1990.5.15생, 水 필요 → 俊(水)
   - 의미 매칭: John(신의 은총) → 俊(뛰어남)
   - 음양 균형: 金(8획-음) 俊(9획-양) 宇(6획-음) ✅
   - 검증: 71% 정확도 논문 기반
```

### 📊 **시장 기회**

| 세그먼트 | 연간 시장 규모 | 우리 타겟 |
|---------|--------------|----------|
| 국내 외국인 | 250만명 | 10만명 (4%) |
| 글로벌 K-culture | 1억명+ | 50만명 (0.5%) |
| 재외동포 자녀 | 700만명 | 20만명 (2.9%) |
| **총 TAM** | **1.1억명** | **70만명/년** |

### 💰 **수익 예측 (Year 1)**

```
보수적 시나리오:
- Q1: 100명/월 × $20 = $2,000/월
- Q2: 500명/월 × $20 = $10,000/월  
- Q3: 2,000명/월 × $20 = $40,000/월
- Q4: 5,000명/월 × $20 = $100,000/월

Year 1 총 매출: $456,000
Year 1 순이익: $380,000 (83% 마진)

API 비용: $402/년 (0.09%) ✅ 무시할 수준
```

---

## 2. Problem & Solution

### 😞 **Problem: 현재 시장의 3가지 문제점**

#### **문제 1: 저품질 자동 변환**

```
❌ 기존 서비스:
"John" → "존" (단순 발음)
"Michael" → "마이클" (그냥 변환)

문제점:
- 한국인 이름 아님
- 의미 없음
- 사주 무시
- 성씨 매칭 안됨
```

#### **문제 2: 비전문적 수동 서비스**

```
❌ 일반 작명소:
- 고가 ($100-300)
- 느림 (2-3일)
- 영어 불가능
- 근거 불명확
- 일본식 81수리 남용
```

#### **문제 3: 문화적 이해 부족**

```
❌ 외국인이 직면하는 어려움:
- 한국 이름 짓는 법 모름
- 사주가 뭔지 모름
- 어떤 한자가 좋은지 모름
- 성씨 선택 기준 모름
- 한국인에게 이상하게 들릴까 걱정
```

### ✅ **Solution: SajuName의 3가지 해결책**

#### **해결책 1: AI + 전통 철학 융합**

```
✅ 우리 방식:
1. 사주팔자 분석 (만세력 DB)
2. 용신 결정 (Claude AI)
3. 오행 매칭
4. 의미 조화
5. 음양 검증 (71% 논문 검증)
6. 5-6개 후보 제시

결과: 전문가 수준 품질
시간: 10초
비용: $15-45
언어: 9개 언어 지원
```

#### **해결책 2: 투명하고 교육적**

```
✅ 상세한 설명 제공:
- "왜 이 이름인가?" (용신 설명)
- "각 한자의 의미" (영문 번역)
- "당신 사주의 특징" (시각화)
- "이름이 미치는 영향" (통계)
- "음양오행 조화" (도표)

→ 외국인도 이해 가능
→ 교육 + 서비스
```

#### **해결책 3: 글로벌 친화적**

```
✅ 외국인 맞춤:
- 9개 언어 UI/결과
- 발음 유사도 중시
- 의미 비교 (John = 神의 은총 → 俊 = 뛰어남)
- 문화 설명 포함
- PDF 다운로드 (한/영)
```

---

## 3. Target Market

### 🎯 **Primary Target (1순위)**

#### **세그먼트 1: K-Pop/K-Drama 팬 (글로벌)**

```
규모: 전 세계 1억명+
특징:
- 20-35세
- 한국 문화 적극 소비
- 한국어 학습 중
- 소셜 미디어 활발
- "한국 이름 갖고 싶음"

니즈:
- SNS용 한국 이름
- 팬픽 작가명
- 온라인 커뮤니티 닉네임
- 한국 여행 시 사용

가격 민감도: 중간 ($15-25)
전환율: 3-5%
```

#### **세그먼트 2: 국내 거주 외국인**

```
규모: 한국 내 250만명
특징:
- 유학생, 직장인, 결혼이민자
- 장기 체류 예정
- 실제 법적 이름 필요
- 한국 사회 통합 필요

니즈:
- 법적 개명
- 은행/공문서용
- 직장에서 호칭
- 자녀 작명

가격 민감도: 낮음 ($45-100)
전환율: 15-20%
```

#### **세그먼트 3: 재외동포 자녀**

```
규모: 전 세계 700만명
특징:
- 미국/캐나다/호주 거주
- 부모는 한국인
- 영어명 + 한국명 병행
- 정체성 고민

니즈:
- 한국 여권용
- 친척들과 소통
- 뿌리 찾기
- 자녀 세대 작명

가격 민감도: 낮음 ($25-45)
전환율: 10-15%
```

### 📊 **Market Sizing**

#### **TAM (Total Addressable Market)**

```
글로벌 K-culture 팬: 1억명
국내 외국인: 250만명
재외동포: 700만명
────────────────────────
총 TAM: 1.1억명
```

#### **SAM (Serviceable Available Market)**

```
실제 한국 이름 필요한 사람:
- K-culture 팬: 5백만명 (5%)
- 국내 외국인: 100만명 (40%)
- 재외동포: 200만명 (30%)
────────────────────────
총 SAM: 7백만명
```

#### **SOM (Serviceable Obtainable Market, Year 1-3)**

```
Year 1:
- 7,600명 (SAM의 0.1%)
- 평균 $60
- 매출: $456,000

Year 2:
- 38,000명 (SAM의 0.5%)
- 평균 $65
- 매출: $2,470,000

Year 3:
- 150,000명 (SAM의 2%)
- 평균 $70
- 매출: $10,500,000
```

---

## 4. Core Features

### 🌟 **MVP Features (Phase 1, Week 1-4)**

#### **Feature 1: AI Korean Name Generator** ⭐ 핵심!

**사용자 플로우:**
```
1. 기본 정보 입력
   ├─ 원래 이름 (영문)
   ├─ 생년월일시
   ├─ 성별
   ├─ 선호 성씨 (선택)
   └─ 언어 (9개 중 선택)

2. AI 분석 중 (~10초)
   ├─ 사주팔자 계산
   ├─ 용신 분석 (Claude AI)
   ├─ 발음 매칭
   ├─ 한자 선별
   └─ 음양/오행 검증

3. 결과 제시 (5-6개 후보)
   ├─ 이름 카드 (한글/한자/영문)
   ├─ 종합 점수 (0-100)
   ├─ 상세 분석
   ├─ 발음 가이드
   └─ 의미 설명
```

**UI 모습:**

```
┌──────────────────────────────────────┐
│  Your Korean Name Matches            │
│                                      │
│  ┌────────────────┐                 │
│  │  #1  김준우      │  Match: 92%   │
│  │  Kim Jun-woo    │                │
│  │  金俊宇          │                │
│  │                 │                │
│  │  🎯 Saju: 85%   │                │
│  │  ☯️ Yin-Yang: 95%│               │
│  │  🔊 Sound: 88%   │                │
│  │  💭 Meaning: 90% │                │
│  │                 │                │
│  │  [See Details]  │                │
│  └────────────────┘                 │
│                                      │
│  ┌────────────────┐                 │
│  │  #2  이준서      │  Match: 89%   │
│  │  Lee Jun-seo    │                │
│  └────────────────┘                 │
│                                      │
│  [Show 3 more names]                │
└──────────────────────────────────────┘
```

**상세 페이지:**

```
┌──────────────────────────────────────┐
│  김준우 (Kim Jun-woo)                 │
│  金俊宇                               │
│                                      │
│  Overall Match: ████████░ 92%       │
│                                      │
│  📊 Detailed Analysis                │
│  ─────────────────────────────────   │
│                                      │
│  🎯 Saju Compatibility: 85%          │
│  Your birth chart needs 水 (Water)   │
│  俊 contains strong 水 energy ✓      │
│                                      │
│  ☯️ Yin-Yang Balance: 95%            │
│  金(8획-陰) + 俊(9획-陽) + 宇(6획-陰)   │
│  Perfect harmony! ✓                  │
│                                      │
│  🔊 Pronunciation: 88%               │
│  John /dʒɑn/ → Jun /dʒun/           │
│  Very similar sound ✓                │
│                                      │
│  💭 Meaning Match: 90%               │
│  John = "God's grace" (신의 은총)     │
│  俊 = "Talented" (뛰어난)             │
│  宇 = "Universe" (우주)               │
│  Both imply excellence ✓             │
│                                      │
│  🌳 Five Elements                     │
│  [시각화 도표]                         │
│  Your chart: Wood ██ Fire ███        │
│               Earth █ Metal ██       │
│               Water █ (needs more!)  │
│                                      │
│  This name: Water ████ ✓             │
│                                      │
│  ℹ️ 81 Numerology: 76% (Reference)   │
│                                      │
│  🎓 Expert Notes                     │
│  This name was generated using:      │
│  - Traditional Myeongri philosophy   │
│  - Academic research (71% accuracy)  │
│  - AI analysis (confidence: 85%)     │
│                                      │
│  💡 Want 100% accuracy?              │
│  [Upgrade to Expert Review - $45]   │
│                                      │
│  [Download PDF] [Save] [Share]      │
└──────────────────────────────────────┘
```

#### **Feature 2: 다국어 지원** 🌏

**지원 언어:**
```
1. 🇬🇧 English (메인)
2. 🇨🇳 中文 (간체)
3. 🇹🇼 中文 (번체)
4. 🇯🇵 日本語
5. 🇪🇸 Español
6. 🇫🇷 Français
7. 🇩🇪 Deutsch
8. 🇻🇳 Tiếng Việt
9. 🇹🇭 ภาษาไทย
```

**번역 범위:**
- UI 전체
- 한자 의미 설명
- 사주 분석 결과
- 오행 설명
- PDF 리포트

#### **Feature 3: PDF Certificate 다운로드** 📄

**구성:**
```
┌─────────────────────────────────────┐
│  Korean Name Certificate            │
│                                     │
│  [로고]                              │
│                                     │
│  Your Korean Name                   │
│  ═══════════════════                │
│                                     │
│  김준우                              │
│  Kim Jun-woo                        │
│  金俊宇                              │
│                                     │
│  Born: May 15, 1990                 │
│  Original Name: John Smith          │
│                                     │
│  ─────────────────                  │
│                                     │
│  Why This Name?                     │
│                                     │
│  Your birth chart analysis shows... │
│  [3-4 문단 설명]                     │
│                                     │
│  Character Meanings:                │
│  • 俊 (Jun): Talented, Handsome     │
│  • 宇 (Woo): Universe, Space        │
│                                     │
│  How to Use Your Name:              │
│  • Pronunciation: [준우]             │
│  • When to use: [가이드]             │
│  • Cultural tips: [팁]               │
│                                     │
│  [QR Code - 온라인 결과 링크]          │
│                                     │
│  Generated by SajuName.com          │
│  Date: Oct 24, 2025                 │
└─────────────────────────────────────┘
```

#### **Feature 4: 성씨 매칭 엔진**

**성씨 선택 로직:**

```typescript
function recommendSurname(
  originalName: string,
  preferences: UserPreferences
): Surname[] {
  
  const factors = [
    // 1. 발음 유사도 (40%)
    phoneticSimilarity(originalName.charAt(0)),
    
    // 2. 인기도 (30%)
    // 김(21%), 이(14%), 박(8%), 최(5%), 정(4%)
    popularity,
    
    // 3. 한자 의미 (20%)
    meaningMatch(originalName),
    
    // 4. 사용자 선호 (10%)
    userPreference
  ];
  
  return topSurnames;
}
```

**예시:**
```
John → 
1. 김 (Kim) - 발음 유사 + 가장 흔함
2. 전 (Jeon) - 발음 매우 유사
3. 조 (Jo) - 발음 유사

Michael →
1. 민 (Min) - 발음 유사
2. 박 (Park) - 인기도
3. 마 (Ma) - 발음 유사
```

---

### 🚀 **Post-MVP Features (Phase 2, Month 2-3)**

#### **Feature 5: Expert Review Service** 💎

**프로세스:**
```
1. 사용자가 Premium+ 선택 ($45)
2. AI가 초안 5개 생성
3. 한국 전문가에게 전송
4. 전문가가 30분 검수
   ├─ 5가지 용신법 재검토
   ├─ 대운(大運) 분석 추가
   ├─ 최종 추천 3개
   └─ 개인화된 코멘트 작성
5. 24시간 내 결과 전달
```

**전문가 매칭:**
- 풀타임 명리학자 2-3명 고용
- 또는 파트타임 네트워크 구축
- 시간당 $60-80 지급
- 품질 관리 시스템

#### **Feature 6: 개명 컨설팅** 📞

**1:1 화상 상담:**
```
서비스 내용:
- 30분 화상 통화
- 실시간 작명
- Q&A
- 문화 설명
- 사용 가이드

가격: $150
타겟: 법적 개명, 중요한 결정
```

#### **Feature 7: 자녀 작명 서비스** 👶

**부모용 특화:**
```
추가 입력:
- 부모 사주
- 형제자매 이름
- 가족 항렬 (돌림자)
- 특별 요청

추가 분석:
- 부모와의 궁합
- 형제 이름과 조화
- 가문 전통 반영

가격: $80-150
```

#### **Feature 8: 비즈니스 네임** 💼

**회사명/브랜드명:**
```
입력:
- 비즈니스 유형
- 설립일
- 창업자 사주
- 브랜드 컨셉

출력:
- 한국 상호명
- 영문 로마자
- 상표 가능성 체크
- 도메인 가용성

가격: $200-500
```

---

## 5. Technical Architecture

### 🏗️ **시스템 구조**

```
┌─────────────────────────────────────────────┐
│              Frontend (Next.js)             │
│  - 다국어 UI (i18n)                          │
│  - 반응형 디자인                              │
│  - 실시간 진행 표시                           │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│           API Layer (Next.js API)           │
│  - RESTful endpoints                        │
│  - Rate limiting                            │
│  - Authentication                           │
└────────────┬────────────────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌─────────┐   ┌──────────────┐
│ DB      │   │ AI Services  │
│ Layer   │   │              │
└─────────┘   └──────────────┘
```

### 🗄️ **Database Architecture**

#### **PostgreSQL + Prisma**

**핵심 테이블:**

```sql
-- 1. 만세력 데이터 (96,429 rows)
CalendarData
├─ solarDate (PRIMARY KEY)
├─ lunarDate
├─ yearGanji (년주)
├─ monthGanji (월주)
├─ dayGanji (일주)
├─ solarTerm (24절기)
└─ zodiacAnimal (12지)

-- 2. 한자 사전 (~8,000 rows)
HanjaDict
├─ character (한자)
├─ meaning (의미)
├─ meaningEn (영문 의미)
├─ wuxing (오행)
├─ strokeCount (획수)
├─ pronunciation (발음)
└─ isSuitableForName (작명 적합성)

-- 3. 사용자 & 결과
User
├─ id
├─ email
├─ subscription
└─ createdAt

NameResult
├─ id
├─ userId (FK)
├─ originalName
├─ birthDate
├─ koreanNames (JSON[])
├─ analysis (JSON)
└─ createdAt

-- 4. 전문가 리뷰 (Phase 2)
ExpertReview
├─ id
├─ nameResultId (FK)
├─ expertId (FK)
├─ comments
├─ finalRecommendations (JSON)
└─ reviewedAt
```

**인덱스 최적화:**
```sql
-- 날짜 조회 최적화
CREATE INDEX idx_calendar_solar 
  ON CalendarData(solarYear, solarMonth, solarDay);

-- 한자 검색 최적화
CREATE INDEX idx_hanja_pronunciation 
  ON HanjaDict(pronunciation, wuxing);
  
CREATE INDEX idx_hanja_wuxing 
  ON HanjaDict(wuxing, isSuitableForName);
```

### 🤖 **AI Integration**

#### **Claude Sonnet 4 API**

**사용처 및 프롬프트:**

```typescript
// 1. 용신 분석 (가장 중요!)
async function analyzeYongsin(saju: FourPillars) {
  const prompt = `
당신은 40년 경력의 명리학 전문가입니다.

사주: ${formatSaju(saju)}

용신 결정 5가지 방법을 고려하여 분석:
1. 조후용신법 (계절 조화)
2. 억부용신법 (강약 조절)
3. 병약용신법 (병 치료)
4. 전왕용신법 (편중 활용)
5. 통관용신법 (충돌 중재)

JSON 형식으로 응답:
{
  "method": "조후|억부|병약|전왕|통관",
  "yongsin": "木|火|土|金|水",
  "heesin": ["木", "火"],
  "gijin": ["土", "金"],
  "confidence": 85,
  "reasoning": "상세 분석..."
}
`;

  return await claudeAPI.call(prompt);
}

// 2. 한자 의미 매칭
async function selectBestHanja(
  candidates: Hanja[],
  originalMeaning: string
) {
  const prompt = `
외국인 이름 "${originalName}" (의미: ${originalMeaning})의 
한국 이름을 짓고 있습니다.

후보 한자들:
${formatCandidates(candidates)}

평가 기준:
1. 원래 의미와의 유사도 (40%)
2. 긍정적 의미 (30%)
3. 외국인 이해도 (20%)
4. 한국인 선호도 (10%)

상위 3개 추천 및 점수:
[JSON 형식]
`;

  return await claudeAPI.call(prompt);
}

// 3. 희신 보완
async function refineWithHeesin(
  yongsin: YongsinResult,
  saju: FourPillars
) {
  const prompt = `
용신 ${yongsin.yongsin}이 결정되었습니다.
희신(보조 오행)과 기신(피할 오행)을 정확히 지정:

오행 상생: 木→火→土→金→水→木
오행 상극: 木克土, 土克水, 水克火, 火克金, 金克木

[JSON 형식 응답]
`;

  return await claudeAPI.call(prompt);
}
```

**API 호출 최적화:**

```typescript
// 캐싱 전략
const cacheKey = `yongsin:${hashSaju(saju)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// 신규 호출
const result = await analyzeYongsin(saju);
await redis.setex(cacheKey, 86400, JSON.stringify(result)); // 24h

return result;
```

**폴백 전략:**

```typescript
async function analyzeWithFallback(saju: FourPillars) {
  try {
    // 1순위: Claude Sonnet 4
    return await claudeAPI.call(prompt);
  } catch (error) {
    logger.error('Claude API failed:', error);
    
    try {
      // 2순위: GPT-4o
      return await openaiAPI.call(prompt);
    } catch (error2) {
      logger.error('OpenAI API failed:', error2);
      
      // 3순위: 규칙 기반 (조후법만)
      return simpleYongsinAnalysis(saju);
    }
  }
}
```

### ⚙️ **Core Services**

```typescript
// services/
├─ saju-calculator.ts         // 사주팔자 계산
├─ yongsin-analyzer.ts        // 용신 분석 (AI)
├─ wuxing-analyzer.ts         // 오행 분석 (규칙)
├─ phonetic-matcher.ts        // 음운 매칭
├─ hanja-selector.ts          // 한자 선별 (AI)
├─ yinyang-validator.ts       // 음양 검증
├─ numerology-calculator.ts   // 81수리 (참고)
├─ name-combinator.ts         // 조합 생성
└─ scoring-engine.ts          // 점수 계산
```

### 🔐 **Security & Performance**

```typescript
// 1. Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 5회
  message: '너무 많은 요청입니다.'
});

// 2. API Key 보안
process.env.ANTHROPIC_API_KEY // 환경변수
process.env.OPENAI_API_KEY

// 3. 결과 암호화
const encrypted = await encrypt(nameResult, user.id);

// 4. 캐싱
- Redis: 사주 분석 결과 (24h)
- CDN: 정적 에셋
- Prisma: 쿼리 캐싱

// 5. 모니터링
- Sentry: 에러 추적
- PostHog: 사용자 행동
- Vercel Analytics: 성능
```

---

## 6. Naming Algorithm

### 🧮 **전체 플로우**

```
입력: John Smith, 1990-05-15 14:30
     ↓
┌────────────────────────────────────┐
│ 1단계: 사주팔자 계산 (0.1초)        │
│    - 만세력 DB 조회                │
│    - 년주: 庚午                    │
│    - 월주: 辛巳                    │
│    - 일주: 癸巳                    │
│    - 시주: 己未 (출생시간 계산)     │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 2단계: 용신 분석 (2-3초) ⭐AI       │
│    - Claude Sonnet 4 호출         │
│    - 5가지 방법 고려               │
│    - 결과: 水 용신 (조후법)        │
│    - 신뢰도: 85%                   │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 3단계: 오행 분석 (0.05초)          │
│    - 木: 2개                       │
│    - 火: 3개                       │
│    - 土: 1개                       │
│    - 金: 1개                       │
│    - 水: 1개 ← 부족!               │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 4단계: 희신 결정 (1-2초) ⭐AI       │
│    - 용신: 水                      │
│    - 희신: 金 (水를 생함)          │
│    - 기신: 土, 火 (피해야 함)      │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 5단계: 발음 매칭 (0.5초)           │
│    - John /dʒɑn/                  │
│    - 후보: [준, 존, 전, 진]        │
│    - 음절 분해: [지/ㅈ] + [언/온/ㅓ/ㅗ] + [ㄴ]│
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 6단계: 한자 후보 (0.1초)           │
│    - DB 조회: 발음='준' + 오행=水,金│
│    - 결과: 俊(水), 濬(水), 峻(土)... │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 7단계: 의미 매칭 (3-4초) ⭐AI       │
│    - John = "God's grace"         │
│    - 俊 = "Talented" → 90% 유사    │
│    - 濬 = "Deep" → 60% 유사        │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 8단계: 조합 생성 (0.2초)           │
│    - 성씨: 김(金), 전(全), 조(趙)  │
│    - 이름: 준우, 준호, 준서...     │
│    - 총 30개 조합                  │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 9단계: 음양 검증 (0.1초)           │
│    - 김(8획-음) 준(9획-양) 우(6획-음)│
│    - 음-양-음: 균형 ✅             │
│    - 점수: 95%                     │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 10단계: 81수리 참고 (0.05초)       │
│    - 원격(초년운): 15획 → 길       │
│    - 형격(중년운): 17획 → 길       │
│    - 이격(장년운): 14획 → 길       │
│    - 정격(총운): 23획 → 길         │
│    - 평균: 78점 (참고용)           │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 11단계: 종합 점수 (0.1초)          │
│    - 용신: 85% × 0.35 = 29.75     │
│    - 음양: 95% × 0.25 = 23.75     │
│    - 발음: 88% × 0.20 = 17.60     │
│    - 의미: 90% × 0.10 = 9.00      │
│    - 81수리: 78% × 0.05 = 3.90    │
│    - 금기: 100% × 0.05 = 5.00     │
│    ─────────────────────────      │
│    총점: 89.0점                    │
└────────┬───────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ 12단계: 순위 정렬 & 출력           │
│    1. 김준우 (89.0점)              │
│    2. 전준호 (87.5점)              │
│    3. 조준서 (86.2점)              │
│    4. 김준영 (85.8점)              │
│    5. 이준우 (85.1점)              │
└────────────────────────────────────┘

총 소요 시간: ~10초
```

### 📐 **상세 알고리즘**

#### **Step 1: 사주팔자 계산**

```typescript
async function calculateFourPillars(
  birthDate: Date,
  birthTime?: string
): Promise<FourPillars> {
  
  // 1. 만세력 DB에서 년/월/일주 조회
  const calendar = await prisma.calendarData.findUnique({
    where: {
      solar_date_unique: {
        solarYear: birthDate.getFullYear(),
        solarMonth: birthDate.getMonth() + 1,
        solarDay: birthDate.getDate(),
      },
    },
  });

  // 2. 시주 계산 (출생시간 필요)
  const hourPillar = birthTime 
    ? calculateHourPillar(birthTime, calendar.dayGanjiHanja)
    : null;

  return {
    year: {
      heavenly: calendar.yearGanjiHanja[0],
      earthly: calendar.yearGanjiHanja[1],
    },
    month: {
      heavenly: calendar.monthGanjiHanja[0],
      earthly: calendar.monthGanjiHanja[1],
    },
    day: {
      heavenly: calendar.dayGanjiHanja[0],
      earthly: calendar.dayGanjiHanja[1],
    },
    hour: hourPillar,
  };
}

// 시주 계산 (출생시간 → 시간 천간)
function calculateHourPillar(
  time: string, // "14:30"
  dayHeavenly: string
): Pillar {
  
  const hour = parseInt(time.split(':')[0]);
  
  // 시간 → 지지 매핑
  const earthlyBranches = {
    0: '子', 2: '丑', 4: '寅', 6: '卯',
    8: '辰', 10: '巳', 12: '午', 14: '未',
    16: '申', 18: '酉', 20: '戌', 22: '亥'
  };
  
  const nearestHour = Math.floor(hour / 2) * 2;
  const earthly = earthlyBranches[nearestHour];
  
  // 일간에 따라 시간 천간 결정 (고정 공식)
  const heavenly = getHourHeavenly(dayHeavenly, earthly);
  
  return { heavenly, earthly };
}
```

#### **Step 2-4: AI 용신 분석** (이미 앞에서 설명)

#### **Step 5: 발음 매칭**

```typescript
function matchPronunciation(
  originalName: string,
  language: string = 'en'
): KoreanSyllable[] {
  
  // 1. IPA 변환
  const ipa = textToIPA(originalName, language);
  // "John" → /dʒɑn/
  
  // 2. 한글 음절로 매핑
  const matches = ipaToKorean(ipa);
  
  // 3. 유사도 계산
  const scored = matches.map(syllable => ({
    syllable,
    score: calculatePhoneticSimilarity(ipa, syllable.ipa)
  }));
  
  // 4. 상위 10개 반환
  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

// IPA → 한글 매핑 예시
function ipaToKorean(ipa: string): Syllable[] {
  const mapping = {
    '/dʒ/': ['ㅈ', 'ㅊ'],
    '/ɑ/': ['ㅏ', 'ㅗ'],
    '/n/': ['ㄴ'],
  };
  
  // 조합 생성
  // ㅈ + ㅏ + ㄴ = 잔
  // ㅈ + ㅗ + ㄴ = 존
  // ㅊ + ㅏ + ㄴ = 찬
  
  return combinations;
}
```

#### **Step 6-7: 한자 선별** (AI 의미 매칭 포함)

```typescript
async function selectHanjaForName(
  syllables: string[], // ["준", "우"]
  targetWuxing: string[], // ["水", "金"]
  originalMeaning: string, // "God's grace"
  originalName: string // "John"
): Promise<HanjaName[]> {
  
  const results: HanjaName[] = [];
  
  for (let i = 0; i < syllables.length; i++) {
    const syllable = syllables[i];
    const wuxing = targetWuxing[i];
    
    // 1. DB에서 후보 가져오기
    const candidates = await prisma.hanjaDict.findMany({
      where: {
        pronunciation: syllable,
        wuxing: { in: [wuxing, ...getCompatibleWuxing(wuxing)] },
        isSuitableForName: true,
      },
      take: 20,
    });
    
    // 2. AI로 의미 매칭 (Claude API)
    const scored = await scoreHanjaMeaning(
      candidates,
      originalMeaning,
      originalName
    );
    
    results.push(scored[0]); // 최고점만
  }
  
  return results;
}

// AI 의미 매칭 점수
async function scoreHanjaMeaning(
  candidates: Hanja[],
  originalMeaning: string,
  originalName: string
): Promise<ScoredHanja[]> {
  
  const prompt = `
원래 이름: ${originalName}
원래 의미: ${originalMeaning}

한자 후보:
${candidates.map(h => `${h.character}: ${h.meaningEn}`).join('\n')}

각 한자의 의미가 원래 이름과 얼마나 유사한지 0-100 점수:
[JSON 배열]
`;

  const response = await claudeAPI.call(prompt);
  
  return candidates.map((h, i) => ({
    ...h,
    semanticScore: response.scores[i],
  }));
}
```

#### **Step 8-9: 조합 및 음양 검증**

```typescript
function generateNameCombinations(
  surnames: string[], // ["김", "이", "박"]
  givenNames: HanjaName[][] // [["준", "준"], ["우", "호", "서"]]
): ValidatedName[] {
  
  const combinations: ValidatedName[] = [];
  
  for (const surname of surnames) {
    for (const first of givenNames[0]) {
      for (const second of givenNames[1]) {
        
        const name = {
          surname,
          first: first.character,
          second: second.character,
          korean: surname + first.korean + second.korean,
          hanja: surname + first.character + second.character,
        };
        
        // 음양 균형 체크
        const yinyang = checkYinYangBalance(
          getStrokeCount(surname),
          getStrokeCount(first.character),
          getStrokeCount(second.character)
        );
        
        // 발음 오행 상생 체크
        const phonetic = checkPhoneticWuxingHarmony(name.korean);
        
        // 불용문자 체크
        const forbidden = checkForbiddenCharacters([
          first.character,
          second.character
        ]);
        
        if (yinyang.isBalanced && phonetic && !forbidden) {
          combinations.push({
            ...name,
            yinyangScore: yinyang.score,
            validation: 'PASSED',
          });
        }
      }
    }
  }
  
  return combinations;
}

// 음양 균형 체크 (논문 71% 검증!)
function checkYinYangBalance(
  stroke1: number,
  stroke2: number,
  stroke3: number
): { isBalanced: boolean; score: number } {
  
  const yang = [stroke1, stroke2, stroke3].filter(s => s % 2 === 1).length;
  const yin = 3 - yang;
  
  // 완벽한 균형: 2:1 또는 1:2
  const isBalanced = Math.abs(yang - yin) <= 1;
  
  // 점수
  let score = 50;
  if (yang === 2 && yin === 1) score = 95; // 양-양-음
  if (yang === 1 && yin === 2) score = 95; // 양-음-음 또는 음-양-음
  if (yang === 3) score = 60; // 모두 양 (차선)
  if (yin === 3) score = 60; // 모두 음 (차선)
  
  return { isBalanced, score };
}
```

#### **Step 10-11: 점수 계산**

```typescript
function calculateFinalScore(
  name: ValidatedName,
  yongsinAnalysis: YongsinResult,
  phoneticScore: number,
  semanticScore: number,
  numerology81: Numerology81Result
): FinalScore {
  
  // 가중치
  const weights = {
    yongsin: 0.35,      // 용신 적합도
    yinyang: 0.25,      // 음양 균형
    phonetic: 0.20,     // 발음 유사도
    semantic: 0.10,     // 의미 유사도
    numerology: 0.05,   // 81수리 (참고)
    forbidden: 0.05,    // 금기 체크
  };
  
  // 1. 용신 점수
  const yongsinScore = yongsinAnalysis.confidence;
  
  // 2. 음양 점수
  const yinyangScore = name.yinyangScore;
  
  // 3. 발음 점수 (이미 계산됨)
  
  // 4. 의미 점수 (AI가 계산)
  
  // 5. 81수리 평균
  const numerologyScore = (
    numerology81.wongyeok +
    numerology81.hyeonggyeok +
    numerology81.igyeok +
    numerology81.jeonggyeok
  ) / 4;
  
  // 6. 금기 점수
  const forbiddenScore = name.validation === 'PASSED' ? 100 : 0;
  
  // 총점
  const total = 
    yongsinScore * weights.yongsin +
    yinyangScore * weights.yinyang +
    phoneticScore * weights.phonetic +
    semanticScore * weights.semantic +
    numerologyScore * weights.numerology +
    forbiddenScore * weights.forbidden;
  
  return {
    totalScore: Math.round(total),
    breakdown: {
      yongsinCompatibility: yongsinScore,
      yinYangBalance: yinyangScore,
      phoneticSimilarity: phoneticScore,
      semanticSimilarity: semanticScore,
      numerology81: numerologyScore,
      forbiddenCheck: forbiddenScore,
    },
    confidence: yongsinAnalysis.confidence,
    needsExpertReview: yongsinAnalysis.confidence < 70,
  };
}
```

---

## 7. Scoring System

### 📊 **점수 배분 (최종)**

```
총점 100점 = 
  용신 적합도 35점 +
  음양 균형 25점 +
  발음 유사도 20점 +
  의미 유사도 10점 +
  81수리 5점 +
  금기 체크 5점
```

### 🎯 **각 항목 상세**

#### **1. 용신 적합도 (35점)** ⭐ 가장 중요!

```
평가 기준:
- AI 신뢰도 기반
- 85% 이상: 34-35점 (매우 적합)
- 70-84%: 28-33점 (적합)
- 50-69%: 18-27점 (보통)
- 50% 미만: 0-17점 (부적합)

계산:
점수 = (AI confidence / 100) × 35
```

#### **2. 음양 균형 (25점)** ⭐ 논문 검증 71%!

```
평가 기준:
- 2:1 또는 1:2 균형: 24-25점
- 3:0 편중: 15-18점
- 기타: 10점 이하

계산:
if (완벽한 균형):
  점수 = 25
else if (전체 양수 or 전체 음수):
  점수 = 15
else:
  점수 = 10
```

**예시:**
```
김(8-음) 준(9-양) 우(6-음) → 음:양 = 2:1 → 25점 ✅
이(7-양) 준(9-양) 호(10-음) → 음:양 = 1:2 → 25점 ✅
박(5-양) 준(9-양) 서(6-음) → 음:양 = 2:1 → 25점 ✅
최(7-양) 준(9-양) 영(8-음) → 음:양 = 2:1 → 25점 ✅
```

#### **3. 발음 유사도 (20점)**

```
평가 기준:
- IPA 거리 기반
- 90% 이상: 19-20점
- 80-89%: 16-18점
- 70-79%: 14-15점
- 60-69%: 12-13점
- 60% 미만: 0-11점

계산:
점수 = (유사도 / 100) × 20
```

**예시:**
```
John → Jun: 88% → 17.6점
Michael → Min: 65% → 13점
Christopher → Chris: 92% → 18.4점
```

#### **4. 의미 유사도 (10점)**

```
평가 기준:
- AI 판단 기반
- 90% 이상: 9-10점
- 80-89%: 8점
- 70-79%: 7점
- 60-69%: 6점
- 60% 미만: 0-5점

계산:
점수 = (AI 점수 / 100) × 10
```

**예시:**
```
John (신의 은총) → 俊 (뛰어남): 90% → 9점
Sophia (지혜) → 智 (지혜): 98% → 9.8점
Grace (은총) → 恩 (은혜): 95% → 9.5점
```

#### **5. 81수리 (5점)** ⚠️ 참고용

```
평가 기준:
- 4격 평균 (원/형/이/정)
- 85점 이상: 5점
- 75-84점: 4점
- 65-74점: 3점
- 55-64점: 2점
- 55점 미만: 1점

계산:
4격 평균 = (원격 + 형격 + 이격 + 정격) / 4
점수 = (4격 평균 / 100) × 5
```

**주의:**
```
⚠️ 논문 검증 결과 57% 정확도
→ 참고용으로만 사용
→ 낮아도 큰 감점 없음
```

#### **6. 금기 체크 (5점)**

```
평가 기준:
- 불용문자 없음: 5점
- 불용문자 있음: 0점

불용문자 예시:
- 흉한 의미: 殺, 死, 病, 凶 등
- 분파자: 州, 川 등 (좌우 분리)
- 외자: 개명 시 피함
- 왕족 글자: 王, 帝 등 (현대는 OK)
```

---

### 🏆 **등급 시스템**

```
90-100점: S등급 ⭐⭐⭐
- 매우 적합
- "Perfect match for you!"
- 강력 추천

80-89점: A등급 ⭐⭐
- 적합
- "Great match!"
- 추천

70-79점: B등급 ⭐
- 양호
- "Good match"
- 고려 가능

60-69점: C등급
- 보통
- "Acceptable"
- 재고려 권장

60점 미만: D등급
- 부적합
- "Not recommended"
- 결과에 포함 안함
```

---

### 📈 **실제 예시**

```
예시 1: 김준우 (John Smith, 1990.5.15)

┌─────────────────────────────────────┐
│ 김준우 (Kim Jun-woo)                 │
│ 金俊宇                               │
│                                     │
│ Overall Score: 92/100 (S등급)       │
│ ████████████████████░               │
│                                     │
│ 🎯 용신 적합도: 34/35 (97%)          │
│    → 사주에 水 필요, 俊은 水 오행     │
│                                     │
│ ☯️ 음양 균형: 25/25 (100%)           │
│    → 金(8-음) 俊(9-양) 宇(6-음)      │
│    → 완벽한 2:1 균형!                │
│                                     │
│ 🔊 발음 유사도: 18/20 (88%)          │
│    → John /dʒɑn/ → Jun /dʒun/      │
│    → 매우 유사한 소리                │
│                                     │
│ 💭 의미 유사도: 9/10 (90%)           │
│    → John = "신의 은총"              │
│    → 俊 = "뛰어남" (긍정적 의미 일치) │
│                                     │
│ ℹ️ 81수리: 4/5 (78%)                 │
│    → 원격 85점, 형격 75점 (참고용)   │
│                                     │
│ ✅ 금기 체크: 5/5 (100%)             │
│    → 불용문자 없음                   │
└─────────────────────────────────────┘

⭐⭐⭐ Perfect Match! Highly Recommended
```

```
예시 2: 이준서 (John Smith, 1990.5.15)

┌─────────────────────────────────────┐
│ 이준서 (Lee Jun-seo)                 │
│ 李俊瑞                               │
│                                     │
│ Overall Score: 87/100 (A등급)       │
│ ██████████████████░░                │
│                                     │
│ 🎯 용신 적합도: 32/35 (92%)          │
│    → 俊(水) + 瑞(金) 상생 조합       │
│                                     │
│ ☯️ 음양 균형: 24/25 (95%)            │
│    → 李(7-양) 俊(9-양) 瑞(13-양)     │
│    → 약간 양 편중이지만 양호          │
│                                     │
│ 🔊 발음 유사도: 16/20 (78%)          │
│    → seo 발음이 약간 다름            │
│                                     │
│ 💭 의미 유사도: 9/10 (92%)           │
│    → 瑞 = "상서로움" (긍정적)        │
│                                     │
│ ℹ️ 81수리: 4/5 (82%)                 │
│                                     │
│ ✅ 금기 체크: 5/5 (100%)             │
└─────────────────────────────────────┘

⭐⭐ Great Match! Recommended
```

---

## 8. Development Roadmap

### 🗓️ **Phase 1: MVP (Week 1-4)** ✅ 우선순위

#### **Week 1: 인프라 & DB**

```
Day 1-2: 프로젝트 세팅
├─ Next.js + TypeScript 프로젝트
├─ Tailwind CSS + shadcn/ui
├─ Prisma + PostgreSQL
└─ Git repository

Day 3-4: 만세력 DB 확인
├─ 기존 마이그레이션 검증
├─ 샘플 쿼리 테스트
├─ 성능 최적화 (인덱스)
└─ 백업 설정

Day 5: 한자 사전 DB
├─ 한자 데이터 수집 (~8,000자)
├─ 오행 매핑
├─ 의미 번역 (한/영)
└─ 시딩

Day 6-7: Claude API 통합
├─ Anthropic SDK 설정
├─ 프롬프트 템플릿 작성
├─ 에러 핸들링
└─ 캐싱 전략
```

#### **Week 2: 핵심 로직**

```
Day 1-2: 사주 계산
├─ calculateFourPillars()
├─ 시주 계산 로직
├─ 테스트 (10개 샘플)
└─ 에러 케이스 처리

Day 3-4: 용신 분석 (AI)
├─ analyzeYongsin() - Claude API
├─ 5가지 방법 프롬프트
├─ 응답 검증
├─ 폴백 전략 (규칙 기반)
└─ 테스트

Day 5: 오행 분석
├─ analyzeWuxing()
├─ 희신/기신 결정
├─ 상생/상극 검증
└─ 테스트

Day 6-7: 발음 매칭
├─ IPA 변환 라이브러리
├─ 한글 음절 매핑
├─ 유사도 계산
└─ 테스트 (20개 이름)
```

#### **Week 3: AI 통합 & 조합**

```
Day 1-2: 한자 선별 (AI)
├─ selectBestHanja() - Claude API
├─ 의미 매칭 프롬프트
├─ DB 쿼리 최적화
└─ 테스트

Day 3-4: 조합 생성
├─ generateCombinations()
├─ 음양 검증
├─ 발음 오행 상생
├─ 불용문자 체크
└─ 테스트

Day 5: 점수 계산
├─ calculateFinalScore()
├─ 81수리 (참고)
├─ 종합 점수
└─ 등급 시스템

Day 6-7: 전체 통합
├─ 전체 플로우 연결
├─ 10개 샘플 End-to-End 테스트
├─ 성능 최적화
└─ 버그 수정
```

#### **Week 4: UI & 론칭**

```
Day 1-2: 프론트엔드
├─ 입력 폼 UI
├─ 진행 표시 (프로그레스바)
├─ 결과 카드 디자인
└─ 반응형 레이아웃

Day 3: 다국어 (i18n)
├─ next-i18next 설정
├─ 영문 번역 (우선)
├─ UI 문구 번역
└─ 테스트

Day 4: PDF 생성
├─ PDF 템플릿
├─ 한/영 버전
├─ 다운로드 기능
└─ 테스트

Day 5: 결제 통합
├─ Stripe 연동
├─ Basic/Premium 패키지
├─ Webhook 처리
└─ 테스트

Day 6: 베타 테스트
├─ 내부 테스트 (10명)
├─ 피드백 수집
├─ 긴급 버그 수정
└─ 성능 모니터링

Day 7: 론칭!
├─ 프로덕션 배포
├─ 모니터링 설정
├─ 마케팅 시작
└─ 🎉 출시!
```

---

### 📅 **Phase 2: 성장 (Month 2-3)**

#### **Month 2: 기능 확장**

```
Week 5-6: 전문가 검수
├─ 전문가 대시보드
├─ 리뷰 워크플로우
├─ 전문가 2-3명 고용
├─ 교육 및 온보딩
└─ Premium+ 론칭 ($45)

Week 7-8: 추가 언어
├─ 중문 번역 (간/번체)
├─ 일문 번역
├─ 기타 5개 언어
├─ 한자 의미 번역 확장
└─ 테스트
```

#### **Month 3: 프리미엄 기능**

```
Week 9-10: 자녀 작명
├─ 부모 사주 입력
├─ 형제 이름 입력
├─ 가족 궁합 분석
├─ 프리미엄 패키지 ($80)
└─ 마케팅

Week 11-12: 1:1 컨설팅
├─ 화상 통화 시스템 (Zoom API)
├─ 예약 시스템 (Calendly)
├─ 결제 처리
├─ 전문가 풀 확대
└─ 출시 ($150)
```

---

### 🚀 **Phase 3: 확장 (Month 4-6)**

```
비즈니스 네임 서비스
└─ 회사명/브랜드명 작명

커뮤니티 기능
└─ 이름 피드백, 투표

모바일 앱
└─ React Native

제휴 프로그램
└─ 언어 학원, 유학원, 비자 업체
```

---

## 9. Business Model

### 💰 **수익 모델**

#### **Tier 1: Basic ($15)** 🥉

```
포함 내용:
✅ AI 자동 작명
✅ 3개 이름 추천
✅ 상세 분석 리포트
✅ PDF 다운로드 (한/영)
✅ 발음 가이드
✅ 이메일 지원

타겟:
- K-pop 팬
- SNS용 이름
- 캐주얼 사용자

전환율: 3-5%
```

#### **Tier 2: Premium ($25)** 🥈 ⭐ 메인!

```
포함 내용:
✅ Basic 모든 기능
✅ 5개 이름 추천
✅ 더 상세한 분석
✅ 다국어 PDF (9개 언어)
✅ 평생 재다운로드
✅ 우선 이메일 지원

타겟:
- 국내 거주 외국인
- 진지한 사용자
- 실제 사용 예정

전환율: 10-15%
```

#### **Tier 3: Premium+ ($45)** 🥇

```
포함 내용:
✅ Premium 모든 기능
✅ 10개 이름 추천
✅ **전문가 검수** (30분)
✅ 개인화된 코멘트
✅ 3일 재검토 가능
✅ 24시간 지원

타겟:
- 법적 개명
- 자녀 작명
- 완벽 추구자

전환율: 15-20%
```

#### **Tier 4: 1:1 Consulting ($150)** 👔

```
포함 내용:
✅ Premium+ 모든 기능
✅ **30분 화상 상담**
✅ 실시간 작명
✅ 문화 교육
✅ Q&A
✅ 무제한 재검토 (1주일)

타겟:
- VIP
- 비즈니스 네임
- 특수 요구사항

전환율: 30-40%
```

---

### 📊 **수익 예측**

#### **Year 1 (보수적)**

| 분기 | 방문자 | 전환율 | 고객 | 평균 | 월 매출 | 분기 매출 |
|------|--------|--------|------|------|---------|----------|
| Q1 | 2,000 | 5% | 100 | $20 | $2,000 | $6,000 |
| Q2 | 10,000 | 5% | 500 | $20 | $10,000 | $30,000 |
| Q3 | 40,000 | 5% | 2,000 | $20 | $40,000 | $120,000 |
| Q4 | 100,000 | 5% | 5,000 | $20 | $100,000 | $300,000 |

**Year 1 총 매출: $456,000**

#### **비용 구조**

```
고정 비용:
- 서버 (Vercel Pro): $20/월 = $240/년
- DB (Supabase): $25/월 = $300/년
- 도메인/CDN: $100/년
- 소프트웨어 라이선스: $500/년
────────────────────────────
소계: $1,140/년

변동 비용:
- Claude API: $0.0093/건
  → 7,600건 × $0.0093 = $71/년
- Stripe 수수료: 2.9% + $0.30
  → $456,000 × 2.9% + ($0.30 × 7,600) = $15,508

전문가 비용 (Premium+, 5%):
- 380건 × $20/건 = $7,600/년

마케팅 (20%):
- $456,000 × 20% = $91,200/년
────────────────────────────
총 비용: $115,519/년

순이익: $340,481 (75% 마진) 💰
```

---

### 💳 **결제 시스템**

```
Stripe 통합:
- 신용카드 (Visa, Master, Amex)
- Apple Pay / Google Pay
- PayPal (추가)
- 국내: 토스페이 (추가)

환불 정책:
- 24시간 내 100% 환불
- 단, 다운로드 전에만
- 전문가 검수 후에는 불가
```

---

## 10. Go-to-Market Strategy

### 🎯 **Phase 1: 베타 론칭 (Week 4-8)**

#### **목표: 첫 100명 고객**

```
채널 1: Reddit
- r/Korean (80만 멤버)
- r/KoreanLanguage (20만)
- r/kpop (200만)
- 포스트: "I made an AI tool to get your Korean name!"
- 예상 획득: 50명

채널 2: Product Hunt
- 론칭 준비 (스크린샷, 비디오)
- "AI Korean Name Generator based on traditional philosophy"
- 예상 획득: 30명

채널 3: K-pop 커뮤니티
- Twitter K-pop 계정
- Discord 서버
- 무료 쿠폰 제공
- 예상 획득: 20명
```

---

### 🚀 **Phase 2: 성장 (Month 2-6)**

#### **목표: 5,000명/월**

```
채널 1: SEO
- 블로그 콘텐츠
  → "How to choose a Korean name"
  → "Korean naming traditions explained"
  → "Best Korean names for foreigners"
- 예상 트래픽: 10,000/월

채널 2: 유튜브 파트너십
- K-pop 리액션 유튜버
- 한국어 교육 채널
- 스폰서십: $500-2,000/영상
- 예상 전환: 100-500명/영상

채널 3: 인스타그램 광고
- 타겟: K-pop 팬, 18-35세
- 예산: $2,000/월
- 예상 획득: 200명/월

채널 4: 제휴
- 한국어 학원
- 유학원
- 비자 대행
- 레퍼럴 수수료: 20%
```

---

### 💪 **Phase 3: 확장 (Month 7-12)**

```
글로벌 인플루언서
- K-pop 리액터
- K-drama 리뷰어
- 예산: $10,000/월

PR/미디어
- TechCrunch 피치
- Korea Times 기사
- CNN Travel 피처

커뮤니티
- 자체 Discord
- 월간 이벤트
- UGC 캠페인
```

---

## 11. Success Metrics

### 📊 **Key Metrics**

#### **Acquisition (획득)**

```
월간 방문자 (MAU)
- Q1: 2,000
- Q2: 10,000
- Q3: 40,000
- Q4: 100,000

소스별 분석:
- Organic: 30%
- Paid: 20%
- Referral: 20%
- Social: 20%
- Direct: 10%
```

#### **Activation (활성화)**

```
회원가입률
- 목표: 20%
- 트래킹: 이메일 입력

작명 시작률
- 목표: 80% (가입자 중)
- 트래킹: 생년월일 입력

결과 조회율
- 목표: 95%
- 트래킹: 결과 페이지 도달
```

#### **Revenue (수익)**

```
전환율
- 목표: 5-10%
- 계산: 결제 / 결과 조회

평균 객단가 (AOV)
- 목표: $25
- 추적: Stripe 데이터

MRR (월 반복 매출)
- 목표: $100,000 (by Q4)
```

#### **Retention (유지)**

```
재방문율
- 30일: 20%
- 90일: 10%

재구매율
- 목표: 5% (자녀, 친구)

NPS (Net Promoter Score)
- 목표: 50+
```

#### **Referral (추천)**

```
추천률
- 목표: 15%
- 인센티브: 양쪽 $5 할인

Viral Coefficient
- 목표: K > 0.5
- 계산: 초대 × 전환율
```

---

### 🎯 **North Star Metric**

```
"생성된 고품질 한국 이름 수"

정의:
- 85점 이상 점수
- 사용자가 만족한 결과
- 다운로드 또는 구매

목표:
- Month 1: 100개
- Month 3: 1,000개
- Month 6: 5,000개
- Month 12: 50,000개
```

---

### 📈 **Dashboard**

```
실시간 모니터링:
1. 금일 방문자
2. 금일 전환
3. 금일 매출
4. API 에러율
5. 평균 점수
6. 사용자 만족도

주간 리뷰:
1. 주간 성장률
2. 채널별 ROI
3. 고객 피드백
4. 버그 리포트
5. 경쟁사 동향
```

---

## 12. Risk Management

### ⚠️ **Technical Risks**

#### **Risk 1: AI 품질 이슈**

```
문제:
- AI가 부적절한 용신 결정
- 의미 매칭 실패
- 사용자 불만족

완화책:
1. AI 신뢰도 < 70% → 전문가 추천
2. 결과마다 "피드백" 버튼
3. 전문가가 주간 검토
4. 프롬프트 지속 개선

Fallback:
- 규칙 기반 조후법
- 보수적 추천
```

#### **Risk 2: API 장애**

```
문제:
- Claude API 다운
- 느린 응답
- 한도 초과

완화책:
1. 3-tier 폴백
   Claude → OpenAI → 규칙
2. 캐싱 (24시간)
3. 에러 모니터링 (Sentry)
4. 사용자에게 투명하게 안내

비용:
- OpenAI 백업 예산: $500/월
```

#### **Risk 3: DB 성능**

```
문제:
- 느린 쿼리
- 동시 접속 과부하

완화책:
1. 인덱스 최적화
2. 쿼리 캐싱
3. Read Replica (트래픽 증가 시)
4. CDN 활용

모니터링:
- 쿼리 시간 < 100ms
- Prisma Accelerate (필요시)
```

---

### 💼 **Business Risks**

#### **Risk 4: 경쟁사 출현**

```
문제:
- 유사 서비스 등장
- 가격 경쟁

차별화:
1. 학술적 검증 (논문)
2. AI + 전문가 조합
3. 다국어 지원
4. 커뮤니티 구축

해자 (Moat):
- 만세력 DB
- 프롬프트 엔지니어링
- 브랜드 신뢰
```

#### **Risk 5: 문화적 논란**

```
문제:
- "외국인이 한국 이름?"
- 전통 왜곡 논란
- 부적절한 이름 생성

완화책:
1. 한국인 전문가 검수
2. 투명한 알고리즘 공개
3. 교육 콘텐츠 강화
4. 커뮤니티 피드백

PR:
- "전통 존중" 메시지
- 전문가 인터뷰
```

#### **Risk 6: 법적 이슈**

```
문제:
- 개인정보 (생년월일)
- 의료/점술 규제
- 환불 분쟁

준비:
1. 개인정보처리방침
2. "교육/엔터테인먼트" 명시
3. 명확한 환불 정책
4. 이용약관 (변호사 검토)

보험:
- 배상책임보험 가입
```

---

### 💰 **Financial Risks**

#### **Risk 7: 수익 미달**

```
시나리오: Q4까지 월 1,000명만 달성

대응:
1. 마케팅 예산 조정
2. 가격 실험 (A/B 테스트)
3. 제휴 확대
4. 피벗 고려 (B2B?)

Runway:
- 초기 자본: $50,000
- Burn rate: $5,000/월
- 12개월 여유
```

#### **Risk 8: API 비용 폭등**

```
시나리오: Claude 가격 2배 인상

대응:
1. GPT-4o로 전환
2. Haiku 믹스
3. 자체 모델 파인튜닝 (장기)
4. 가격 인상 (소폭)

계산:
- 현재: $0.0093/건
- 2배 인상: $0.0186/건
- 매출 대비: 여전히 0.2%
```

---

### 📋 **Risk Matrix**

| 리스크 | 확률 | 영향 | 우선순위 | 대응책 |
|--------|------|------|----------|--------|
| AI 품질 이슈 | 중 | 고 | P0 | 전문가 검수 |
| API 장애 | 중 | 중 | P1 | 3-tier 폴백 |
| 경쟁사 | 저 | 중 | P2 | 차별화 |
| 문화적 논란 | 저 | 고 | P1 | 전문가 자문 |
| 수익 미달 | 중 | 고 | P0 | 유연한 전략 |
| API 비용 | 저 | 저 | P3 | 모델 믹스 |
| DB 성능 | 중 | 중 | P1 | 최적화 |
| 법적 이슈 | 저 | 고 | P1 | 변호사 자문 |

---

## 📌 **Appendix**

### 📚 **참고 자료**

```
1. 학술 논문
   - "姓名이 運命에 미치는 影響에 관한 硏究" (2015)
   - 원광대학교 석사논문
   - 109명 실증 분석

2. 박재범 작명법
   - 10단계 작명 프로세스
   - 5가지 용신법

3. 만세력 데이터
   - 1841-2110 (270년)
   - 96,429 레코드

4. 기술 문서
   - Prisma Schema
   - API 명세
   - 프롬프트 템플릿
```

---

### 🔗 **링크**

```
Production:
- Website: https://sajuname.com
- API: https://api.sajuname.com
- Docs: https://docs.sajuname.com

Development:
- GitHub: [private]
- Figma: [link]
- Notion: [link]

Tools:
- Prisma Studio
- Vercel Dashboard
- Stripe Dashboard
- PostHog Analytics
```

---

## ✅ **Next Steps**

### 🚀 **즉시 시작**

```
✅ Week 1 Day 1 (내일)
1. GitHub 레포 생성
2. Next.js 프로젝트 초기화
3. Prisma 스키마 확정
4. Claude API 키 발급
5. 개발 환경 세팅

✅ Week 1 Day 2-7
6. 만세력 DB 검증
7. 한자 사전 구축
8. 사주 계산 로직
9. 첫 API 호출 성공
10. 기본 UI 프로토타입
```

---

## 🎯 **최종 요약**

```
제품: AI 한국 이름 생성기
시장: 글로벌 7백만명
기술: 만세력 DB + Claude AI + 전통 철학
차별화: 학술 검증 + 전문가 품질
개발: 3-4주 MVP
비용: 매출 대비 0.2% (API)
Year 1: $456,000 매출, $340,000 순이익
검증: 논문 71% 정확도

Status: ✅ Ready to Build!
```

---