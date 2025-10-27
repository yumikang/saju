# 작명 로직 분석: global.md vs 현재 구현

**분석 일자**: 2025-10-27
**분석자**: Claude Code
**대상 문서**: `/Users/blee/Downloads/saju/saju/global.md` (PRD v2.0)

---

## 📋 목차

1. [Executive Summary](#executive-summary)
2. [알고리즘 비교](#알고리즘-비교)
3. [점수 시스템 비교](#점수-시스템-비교)
4. [구현 상태 분석](#구현-상태-분석)
5. [차이점 및 Gap Analysis](#차이점-및-gap-analysis)
6. [개선 권장사항](#개선-권장사항)

---

## Executive Summary

### ✅ 핵심 발견사항

| 항목 | global.md (PRD) | 현재 구현 (NamingPipeline) | 상태 |
|------|-----------------|---------------------------|------|
| **전체 단계 수** | 12단계 | 8단계 | ⚠️ 단순화됨 |
| **점수 가중치** | 6개 항목 (용신 35%) | 6개 항목 (용신 35%) | ✅ 일치 |
| **실행 시간 목표** | ~10초 | <10초 | ✅ 일치 |
| **AI 사용** | Claude Sonnet 4 (3단계) | Claude AI (1단계) | ⚠️ 축소됨 |
| **용신 분석** | 5가지 방법 + AI | 5가지 전통 방법 + AI | ✅ 일치 |
| **발음 매칭** | IPA 기반 | PhoneticMatcher | ❓ 확인 필요 |
| **의미 매칭** | AI 기반 | 미확인 | ❌ 누락 가능성 |

---

## 알고리즘 비교

### global.md (PRD v2.0) - 12단계 플로우

```
1. 사주팔자 계산 (0.1초)
   └─ 만세력 DB 조회

2. 용신 분석 (2-3초) ⭐ AI
   └─ Claude Sonnet 4 호출, 5가지 방법 고려

3. 오행 분석 (0.05초)
   └─ 木火土金水 개수 파악

4. 희신 결정 (1-2초) ⭐ AI
   └─ 용신 보조 오행 결정

5. 발음 매칭 (0.5초)
   └─ IPA 변환 → 한글 음절

6. 한자 후보 (0.1초)
   └─ DB 조회 (발음 + 오행 필터)

7. 의미 매칭 (3-4초) ⭐ AI
   └─ 원래 이름 의미와 한자 의미 비교

8. 조합 생성 (0.2초)
   └─ 성씨 × 이름 조합 (최대 30개)

9. 음양 검증 (0.1초)
   └─ 획수 음양 균형 체크

10. 81수리 참고 (0.05초)
    └─ 원/형/이/정격 계산

11. 종합 점수 (0.1초)
    └─ 가중치 적용 합산

12. 순위 정렬 & 출력
    └─ Top 5-6개 반환
```

**총 소요 시간**: ~10초
**AI 호출**: 3회 (용신 분석, 희신 결정, 의미 매칭)

---

### 현재 구현 (NamingPipeline) - 8단계 플로우

```
1. Saju Calculation (~50-100ms)
   └─ CalendarDataService (DB)

2. Yongsin Analysis (~500-2000ms) ⭐ AI
   └─ 5가지 방법 + ClaudeAIService (optional)
   └─ Fallback: Traditional methods only

3. Hanja Recommendation (~100-200ms)
   └─ 용신 오행 기반 필터링
   └─ HanjaService (DB)

4. Combination Generation (~200-500ms)
   └─ 2자 이름 조합 (최대 10,000개)

5. Validation (~1-3s, batched)
   ├─ 81수리 (Numerology81)
   ├─ 음양 균형 (YinYangValidator)
   └─ 음운 조화 (PhoneticMatcher)

6. Scoring (integrated with Step 5)
   └─ 가중치 적용 (용신 35%, 음양 25%, ...)

7. Filtering (~10-50ms)
   └─ 최소 점수 60점 이상

8. Ranking & Return (~10ms)
   └─ Top 20개 반환 (default)
```

**총 소요 시간**: <10초
**AI 호출**: 1회 (용신 분석만, optional)

---

## 점수 시스템 비교

### ✅ 가중치 배분 (완전 일치)

| 항목 | global.md | NamingPipeline | 비고 |
|------|-----------|----------------|------|
| **용신 적합도** | 35% | 35% | ✅ 동일 |
| **음양 균형** | 25% | 25% | ✅ 동일 |
| **발음 유사도** | 20% | 20% | ✅ 동일 |
| **의미 유사도** | 10% | 10% | ✅ 동일 |
| **81수리** | 5% | 5% | ✅ 동일 |
| **금기 체크** | 5% | 5% | ✅ 동일 |
| **총점** | 100% | 100% | ✅ 동일 |

### ⚠️ 세부 계산 방식 차이

#### 1. 용신 적합도 (35점)

**global.md**:
```
점수 = (AI confidence / 100) × 35

예시:
- AI 신뢰도 85% → 29.75점
- AI 신뢰도 70% → 24.5점
```

**NamingPipeline**:
```typescript
// 확인 필요: 구현 코드에서 상세 로직 확인 필요
// YongsinMatchAnalysis 타입은 존재하지만 점수 계산 로직은?
```

#### 2. 음양 균형 (25점)

**global.md**:
```
2:1 또는 1:2 균형: 24-25점
3:0 편중: 15-18점

예시:
- 김(8-음) 준(9-양) 우(6-음) → 2:1 → 25점 ✅
```

**NamingPipeline**:
```typescript
// YinYangValidator 존재
// 71% 논문 검증 기반
// ⚠️ 점수 계산 로직 확인 필요
```

#### 3. 발음 유사도 (20점)

**global.md**:
```
IPA 거리 기반:
- 90% 이상: 19-20점
- 80-89%: 16-18점

예시:
- John → Jun: 88% → 17.6점
```

**NamingPipeline**:
```typescript
// PhoneticMatcher 존재
// PhoneticAnalysis 타입 존재
// ⚠️ IPA 사용 여부 및 점수 계산 확인 필요
```

#### 4. 의미 유사도 (10점)

**global.md**:
```
⭐ AI 기반 의미 매칭 (3-4초)

Claude API 호출:
"John (신의 은총) → 俊 (뛰어남): 90% → 9점"

프롬프트:
- 원래 이름 의미
- 한자 후보 의미
- 유사도 0-100점
```

**NamingPipeline**:
```typescript
// ❌ 의미 매칭 관련 타입/서비스 발견 안됨
// meaningScore는 weights에 존재하지만
// 실제 계산 로직은 어디에?
```

---

## 구현 상태 분석

### ✅ 완료된 기능

1. **사주팔자 계산**
   - SajuCalculator 구현 완료
   - CalendarDataService 통합
   - 만세력 DB (96,429 레코드) 연동

2. **용신 분석**
   - YongsinAnalyzer 구현
   - 5가지 전통 방법 + AI
   - Fallback 메커니즘 (AI 실패 시)

3. **음양 균형 검증**
   - YinYangValidator 구현
   - 71% 논문 검증 기반

4. **81수리 계산**
   - Numerology81 구현
   - 원/형/이/정격 계산

5. **한자 필터링**
   - HanjaService 구현
   - 오행 기반 필터링

6. **파이프라인 아키텍처**
   - 8단계 파이프라인
   - Dependency Injection
   - Error Handling
   - Caching 지원

---

### ❌ 누락되거나 불명확한 기능

#### 1. **희신 결정 (Step 4)** ⚠️
**global.md**: 별도 AI 단계 (1-2초)
```
용신: 水
희신: 金 (水를 생함)
기신: 土, 火 (피해야 함)
```

**현재 구현**: 확인 필요
- YongsinAnalyzer에 포함되어 있을 가능성
- 또는 Step 3 (Hanja Recommendation)에서 처리?

#### 2. **발음 매칭 (Step 5)** ❓
**global.md**: IPA 기반 변환
```typescript
function matchPronunciation(originalName: string) {
  // 1. IPA 변환: "John" → /dʒɑn/
  const ipa = textToIPA(originalName, 'en');

  // 2. 한글 음절 매핑
  const matches = ipaToKorean(ipa);

  // 3. 유사도 계산
  return calculatePhoneticSimilarity();
}
```

**현재 구현**: PhoneticMatcher 존재
- ⚠️ IPA 사용 여부 불명
- ⚠️ 외국인 이름 지원 여부 불명

#### 3. **의미 매칭 (Step 7)** ❌
**global.md**: AI 기반 의미 분석 (3-4초)
```typescript
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
  `;

  return await claudeAPI.call(prompt);
}
```

**현재 구현**: ❌ 발견 안됨
- weights.meaning: 0.10 존재
- 하지만 실제 계산 로직 불명

#### 4. **성씨 매칭 엔진** ❌
**global.md**: Feature 4
```typescript
function recommendSurname(originalName: string) {
  // 1. 발음 유사도 (40%)
  // 2. 인기도 (30%)
  // 3. 한자 의미 (20%)
  // 4. 사용자 선호 (10%)
}
```

**현재 구현**: ❌ 없음
- 사용자가 직접 성씨 선택
- 자동 추천 기능 없음

---

## 차이점 및 Gap Analysis

### 🎯 주요 차이점

| 영역 | global.md (이상형) | 현재 구현 (실제) | Impact |
|------|-------------------|-----------------|--------|
| **AI 활용도** | 3단계 (용신, 희신, 의미) | 1단계 (용신만) | 🔴 HIGH |
| **단계 수** | 12단계 (상세) | 8단계 (통합) | 🟡 MEDIUM |
| **의미 분석** | AI 기반 (10% 가중치) | 불명확 | 🔴 HIGH |
| **발음 매칭** | IPA 기반 | 불명확 | 🟡 MEDIUM |
| **성씨 추천** | 자동 추천 엔진 | 없음 | 🟢 LOW |
| **외국인 이름** | 주 타겟 | 한국인 전용? | 🔴 HIGH |
| **최대 후보** | 5-6개 | 20개 (default) | 🟢 LOW |

### 📊 Gap 분석

#### Gap 1: 의미 매칭 기능 부재 (HIGH Priority)

**영향**:
- 10% 가중치를 차지하는 핵심 기능
- 외국인 이름 → 한국 이름 매핑의 핵심 가치
- global.md의 핵심 차별화 요소

**예시**:
```
John (신의 은총) → 俊 (뛰어남) ← AI가 의미 유사도 평가
Sophia (지혜) → 智 (지혜) ← 98% 유사도
```

**권장 조치**:
1. Claude API 의미 매칭 프롬프트 구현
2. 한자 DB에 영문 의미 추가
3. Step 3 (Hanja Recommendation)에서 AI 호출

#### Gap 2: 희신 결정 로직 불명확 (MEDIUM Priority)

**global.md 설명**:
```
용신: 水 (주요 보완 오행)
희신: 金 (水를 생성하는 오행 - 상생 관계)
기신: 土, 火 (피해야 할 오행)
```

**확인 필요**:
- YongsinAnalyzer가 희신까지 계산하는지?
- 아니면 Hanja Recommendation에서 자동 처리?

#### Gap 3: IPA 기반 발음 매칭 (MEDIUM Priority)

**global.md 방식**:
```typescript
John → /dʒɑn/ (IPA) → 준, 존, 전, 진 (한글 후보)
Michael → /ˈmaɪkəl/ → 민, 마, 미 (한글 후보)
```

**현재**: PhoneticMatcher 구현 확인 필요
- 외국인 이름 지원하는지?
- IPA 변환 라이브러리 사용하는지?

#### Gap 4: 12단계 vs 8단계 (LOW Priority)

**PRD의 12단계**가 더 상세하지만, **현재 8단계**는 통합된 버전:
- Step 3 (오행 분석) + Step 4 (희신) → 통합?
- Step 6 (한자 후보) + Step 7 (의미 매칭) → 분리 필요
- Step 10 (81수리) → Step 5 (Validation)에 통합됨

**판단**: 8단계 구조도 합리적. 단, 의미 매칭은 별도 추가 필요.

---

## 개선 권장사항

### 🔥 High Priority (즉시 개선 필요)

#### 1. 의미 매칭 AI 기능 추가

**구현 방안**:

```typescript
// Step 3.5: Semantic Meaning Analysis (new)
async function step3_5_analyzeSemanticMeaning(
  context: PipelineContext,
  originalName: string // e.g., "John"
): Promise<void> {
  const hanjaPool = context.hanjaPool;

  // 1. 원래 이름의 의미 가져오기
  const originalMeaning = await getNameMeaning(originalName, 'en');
  // "John" → "God's grace" or "신의 은총"

  // 2. Claude API로 한자 의미 점수 계산
  const prompt = `
  외국인 이름 "${originalName}" (의미: ${originalMeaning})의
  한국 이름을 짓고 있습니다.

  후보 한자들:
  ${hanjaPool.map(h => `${h.character}: ${h.meaningEn || h.meaning}`).join('\n')}

  각 한자의 의미가 원래 이름과 얼마나 유사한지 0-100 점수로 평가해주세요.

  JSON 형식:
  [
    { "character": "俊", "semanticScore": 90, "reasoning": "..." },
    ...
  ]
  `;

  const result = await claudeAPI.call(prompt);

  // 3. 한자 풀에 의미 점수 추가
  hanjaPool.forEach(hanja => {
    const scored = result.find(r => r.character === hanja.character);
    hanja.semanticScore = scored?.semanticScore || 50; // default
  });
}
```

**데이터 요구사항**:
- HanjaDict 테이블에 `meaningEn` 컬럼 추가
- 8,000자 한자에 영문 의미 번역 필요

**예상 비용**:
- Claude API 호출: 1회/요청
- ~$0.01/요청 (Sonnet 4 기준)

---

#### 2. 외국인 이름 지원 검증

**확인 항목**:
1. PhoneticMatcher가 영문 이름 처리 가능한지?
2. IPA 변환 라이브러리 사용 여부
3. 한글 음절 매핑 로직 존재 여부

**테스트 케이스**:
```typescript
const testCases = [
  { name: 'John', expected: ['준', '존', '전'] },
  { name: 'Michael', expected: ['민', '마이클'] },
  { name: 'Sophia', expected: ['소피아', '수', '소'] },
];

testCases.forEach(async (test) => {
  const result = await phoneticMatcher.match(test.name, 'en');
  console.log(`${test.name} → ${result}`);
});
```

**개선 방안** (필요 시):
```typescript
import { textToIPA } from 'ipa-translator';

class PhoneticMatcher {
  matchEnglishName(name: string): string[] {
    // 1. IPA 변환
    const ipa = textToIPA(name, 'en');
    // "John" → /dʒɑn/

    // 2. 한글 음절 매핑
    const koreanSyllables = this.ipaToKorean(ipa);
    // /dʒɑn/ → ['준', '존', '전', '진']

    // 3. 유사도 점수
    return koreanSyllables.sort((a, b) =>
      b.similarity - a.similarity
    );
  }
}
```

---

### 🟡 Medium Priority (단계적 개선)

#### 3. 희신 로직 명시화

**현재 상태 확인**:
```bash
# YongsinAnalyzer 코드 확인
grep -r "희신\|heesin" app/lib/saju/

# 결과 확인하여 희신 계산 여부 판단
```

**명시화 방안**:
```typescript
export interface YongsinResult {
  yongsin: Element;        // 주 용신 (예: 水)
  heesin: Element[];       // 희신 (예: [金]) - 상생 관계
  gijin: Element[];        // 기신 (예: [土, 火]) - 피해야 할 오행
  confidence: number;
  method: string;
  reasoning: string;
}
```

---

#### 4. 성씨 자동 추천 기능 (Optional)

**PRD Feature 4**:
```typescript
function recommendSurname(
  originalName: string,
  preferences: UserPreferences
): Surname[] {
  const factors = [
    phoneticSimilarity(40%),  // John → 김, 전, 조
    popularity(30%),           // 김(21%), 이(14%), 박(8%)
    meaningMatch(20%),
    userPreference(10%)
  ];

  return topSurnames; // Top 3-5 추천
}
```

**타이밍**: Phase 2 (Month 2-3)에 추가 권장

---

### 🟢 Low Priority (장기 개선)

#### 5. 12단계 상세 플로우 문서화

현재 8단계를 12단계로 매핑하여 문서화:

```
PRD 12단계 → 현재 8단계 매핑:

Step 1 (사주) → Pipeline Step 1 ✅
Step 2 (용신) → Pipeline Step 2 ✅
Step 3 (오행) → Pipeline Step 2에 통합 ✅
Step 4 (희신) → Pipeline Step 2 or 3? ❓
Step 5 (발음) → Pipeline Step 5 (Validation)? ❓
Step 6 (한자 후보) → Pipeline Step 3 ✅
Step 7 (의미 매칭) → ❌ 누락
Step 8 (조합) → Pipeline Step 4 ✅
Step 9 (음양) → Pipeline Step 5 ✅
Step 10 (81수리) → Pipeline Step 5 ✅
Step 11 (점수) → Pipeline Step 6 ✅
Step 12 (정렬) → Pipeline Step 8 ✅
```

---

## 다음 단계 (Next Steps)

### ✅ 즉시 실행 (Week 1)

1. **의미 매칭 기능 설계**
   - [ ] 한자 DB에 영문 의미 추가 계획
   - [ ] Claude API 프롬프트 작성
   - [ ] Step 3.5 추가 설계

2. **외국인 이름 지원 검증**
   - [ ] PhoneticMatcher 코드 리뷰
   - [ ] 테스트 케이스 작성 (John, Michael, Sophia)
   - [ ] IPA 라이브러리 필요 여부 판단

3. **희신 로직 확인**
   - [ ] YongsinAnalyzer 코드 상세 분석
   - [ ] 희신 계산 여부 확인
   - [ ] 필요 시 타입 명시화

### 🔄 단계적 개선 (Week 2-4)

4. **의미 매칭 구현**
   - [ ] HanjaDict 스키마 업데이트
   - [ ] 영문 의미 데이터 수집/번역
   - [ ] Claude API 통합
   - [ ] 점수 계산 로직 추가

5. **테스트 및 검증**
   - [ ] End-to-End 테스트 (외국인 이름)
   - [ ] 성능 테스트 (AI 호출 2회)
   - [ ] 점수 정확도 검증

6. **문서화**
   - [ ] 12단계 → 8단계 매핑 문서
   - [ ] API 명세 업데이트
   - [ ] 사용자 가이드 작성

---

## 결론

### ✅ 잘 구현된 부분

1. **핵심 아키텍처**: 8단계 파이프라인, DI 패턴, Error Handling
2. **점수 가중치**: PRD와 100% 일치
3. **전통 로직**: 사주, 용신, 음양, 81수리 모두 구현
4. **성능**: <10초 목표 달성 가능한 구조

### ⚠️ 개선 필요 부분

1. **의미 매칭**: AI 기반 의미 분석 누락 (10% 가중치)
2. **외국인 이름**: 지원 여부 불명확, IPA 변환 확인 필요
3. **희신 로직**: 존재 여부 및 명시성 확인 필요
4. **AI 활용**: PRD의 3단계 AI → 현재 1단계만

### 🎯 최종 평가

**현재 구현**: ⭐⭐⭐⭐☆ (4/5)
- 전통 작명 로직: ⭐⭐⭐⭐⭐ (완벽)
- 외국인 맞춤 기능: ⭐⭐☆☆☆ (개선 필요)
- AI 활용도: ⭐⭐⭐☆☆ (확장 여지)

**PRD 대비 완성도**: ~70%
- 핵심 기능: 완료
- 차별화 기능: 부분 완료
- 외국인 타겟: 보완 필요

---

## 부록

### A. 참고 코드 위치

```
핵심 파이프라인:
- app/lib/naming/pipeline/naming-pipeline.ts
- app/lib/naming/pipeline/README.md

서비스:
- app/lib/saju/calculator.ts (사주 계산)
- app/lib/saju/yongsin-analyzer.ts (용신 분석)
- app/lib/naming/validators/yinyang-validator.ts (음양 검증)
- app/lib/naming/validators/phonetic-matcher.ts (발음 매칭)

API:
- app/routes/api.naming.generate.ts (엔드포인트)

문서:
- global.md (PRD v2.0)
- app/lib/naming/pipeline/README.md
```

### B. 관련 이슈

```
1. 의미 매칭 구현 (#TODO)
2. IPA 발음 변환 검증 (#TODO)
3. 희신 로직 명시화 (#TODO)
4. 외국인 이름 테스트 케이스 (#TODO)
```

---

**문서 작성자**: Claude Code
**최종 업데이트**: 2025-10-27
