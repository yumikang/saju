# 작명 서비스 비교 분석

기존 구현 vs AI 작명 서비스의 로직, 데이터베이스, API 사용 차이점 분석

## 목차

1. [개요](#개요)
2. [아키텍처 비교](#아키텍처-비교)
3. [API 엔드포인트 비교](#api-엔드포인트-비교)
4. [데이터베이스 사용](#데이터베이스-사용)
5. [작명 로직 비교](#작명-로직-비교)
6. [한자 검색 및 필터링](#한자-검색-및-필터링)
7. [점수 계산 방식](#점수-계산-방식)
8. [성능 최적화](#성능-최적화)
9. [사용자 경험](#사용자-경험)
10. [주요 차이점 요약](#주요-차이점-요약)

---

## 개요

### 기존 서비스 (Phase 2)

1. **신생아 작명** (`/naming`)
   - 2단계 프로세스: 사주 분석 → 이름 추천
   - API: `/api/naming/analyze`, `/api/naming/recommend`
   - 엔진: `HanjaMatcher` + `ScoringPipeline`

2. **개명 서비스** (`/renaming`)
   - 현재 이름 분석 → 개선된 이름 추천
   - API: `/api/renaming/analyze-current`, `/api/naming/recommend`
   - 동일한 `HanjaMatcher` 사용

3. **사주 궁합** (`/saju`)
   - 두 사람의 사주 궁합 분석
   - `SajuCalculator` 사용

### 새로운 서비스 (Day 8)

4. **AI 사주 작명** (`/ai-naming`)
   - 단일 API 호출로 완료
   - API: `/api/naming/generate`
   - 엔진: `NamingPipeline` (AI 통합)

---

## 아키텍처 비교

### 기존 서비스 (Phase 2) 아키텍처

```
User Input
    ↓
[1단계] POST /api/naming/analyze
    - SajuCalculator.calculate()
    - DB 저장 (SajuData 테이블)
    - 반환: sajuDataId
    ↓
[2단계] POST /api/naming/recommend
    - DB에서 sajuData 로드 OR 재계산
    - HanjaMatcher.findOptimalNames()
      ├─ Stage 1: filterByElements() (DB 쿼리)
      ├─ Stage 2: filterByStrokeLuck() (CPU)
      ├─ Stage 3: generateAndScoreCombinations()
      └─ Stage 4: ScoringPipeline.scoreAll()
    - 반환: ScoredCandidate[]
    ↓
User sees results
```

**핵심 클래스:**
- `app/lib/naming/api-handlers.ts` - `handleAnalyze`, `handleRecommendation`
- `app/lib/naming/matcher.ts` - `HanjaMatcher` 클래스
- `app/lib/naming/scorers/index.ts` - `ScoringPipeline` 클래스
- `app/lib/saju/calculator.ts` - `SajuCalculator` 클래스

### 새로운 AI 작명 (Day 8) 아키텍처

```
User Input
    ↓
[단일 API] POST /api/naming/generate
    - NamingPipeline.execute()
      ├─ Step 1: SajuCalculator.calculate()
      ├─ Step 2: YongsinCalculator (5가지 전통 방법)
      ├─ Step 3: AI용신 분석 (OpenAI GPT-4)
      ├─ Step 4: 용신 합의 (전통 + AI)
      ├─ Step 5: 한자 필터링 (HanjaDict 쿼리)
      ├─ Step 6: 조합 생성 + 점수화
      ├─ Step 7: AI 의미 점수 (OpenAI)
      └─ Step 8: 최종 순위 결정
    - 반환: AINamingResponse
    ↓
User sees results
```

**핵심 클래스:**
- `app/lib/naming/pipeline/naming-pipeline.ts` - `NamingPipeline` 오케스트레이터
- `app/lib/naming/pipeline/steps/` - 8개 개별 스텝 클래스
- `app/lib/ai/openai.server.ts` - AI 통합

---

## API 엔드포인트 비교

| 서비스 | 엔드포인트 | HTTP | 역할 | 응답 시간 |
|--------|-----------|------|------|-----------|
| **기존 신생아 작명** | `/api/naming/analyze` | POST | 사주 분석만 | <500ms |
| | `/api/naming/recommend` | POST | 이름 추천 | <5s |
| | `/api/naming/character/:id` | GET | 한자 상세 | <100ms |
| **기존 개명 서비스** | `/api/renaming/analyze-current` | POST | 현재 이름 분석 | <1s |
| | `/api/naming/recommend` | POST | 개선 이름 추천 | <5s |
| **새로운 AI 작명** | `/api/naming/generate` | POST | 전체 프로세스 | <30s |
| **공통 (한자 검색)** | `/api/hanja/search` | GET | 한자 검색 | <200ms |

### API 요청/응답 형식 차이

#### 기존 서비스 요청

**1단계: 사주 분석**
```typescript
// POST /api/naming/analyze
{
  birthDate: "1990-05-15",
  birthTime: "14:30",
  isLunar: false,
  gender: "male"
}

// 응답
{
  success: true,
  data: {
    sajuDataId: "uuid-here",  // ← DB 저장 후 ID 반환
    pillars: { year, month, day, hour },
    elementCounts: { WOOD: 2, FIRE: 1.5, ... },
    lackingElements: [Element.METAL],
    yongsin: { primary: Element.WATER }
  }
}
```

**2단계: 이름 추천**
```typescript
// POST /api/naming/recommend
{
  sajuDataId: "uuid-here",  // ← 1단계에서 받은 ID 사용
  lastName: "김",
  preferences: {
    minScore: 65,
    maxResults: 50
  }
}
```

#### 새로운 AI 작명 요청

**단일 API 호출**
```typescript
// POST /api/naming/generate
{
  birthInfo: {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    isLunar: false,
    gender: "M"
  },
  lastName: "김",
  lastNameStrokes: 8,
  preferences: {
    count: 10,
    minScore: 70
  }
}

// 응답 - 모든 분석 포함
{
  success: true,
  candidates: [...],
  metadata: {
    sajuAnalysis: { ... },
    yongsinAnalysis: { traditional: ..., ai: ... },
    executionTime: 28500
  }
}
```

**핵심 차이:**
- 기존: 2단계 프로세스, DB에 중간 결과 저장
- 신규: 1단계 완료, DB 저장 없음 (세션 메모리만)

---

## 데이터베이스 사용

### 공통 사용 테이블

| 테이블 | 레코드 수 | 용도 | 사용처 |
|--------|-----------|------|--------|
| `HanjaDict` | 8,787 | 한자 사전 | 양쪽 모두 |
| `CalendarData` | 96,429 | 음력↔양력 변환 | 양쪽 모두 |

### 기존 서비스 전용 테이블

| 테이블 | 용도 | 사용처 |
|--------|------|--------|
| `SajuData` | 사주 분석 결과 저장 | `/naming`, `/renaming` |
| `RenamingAnalysis` | 개명 분석 결과 저장 | `/renaming` |
| `OrderItem` | 주문 항목 | 결제 시스템 |

### AI 작명 서비스 테이블 사용

**사용하지 않는 테이블:**
- ✗ `SajuData` - 중간 결과를 DB에 저장하지 않음
- ✗ `RenamingAnalysis` - 현재 이름 분석 미지원

**이유:**
- AI 작명은 실시간 분석만 수행
- 결과를 DB에 저장하려면 사용자가 "저장" 버튼 클릭 필요
- 익명 사용자 지원 (로그인 불필요)

---

## 작명 로직 비교

### 기존 HanjaMatcher 로직 (Phase 2)

**파일:** `app/lib/naming/matcher.ts`

```typescript
class HanjaMatcher {
  async findOptimalNames(saju, lastName, options) {
    // Stage 1: Element-based DB filtering (50-100ms)
    const pool = await this.filterByElements(
      saju.favorableElements,
      saju.lackingElements,
      gender,
      avoidChars
    );
    // 화이트리스트 사용: ALL_POPULAR_HANJA (300개 제한)

    // Stage 2: Stroke-based filtering (10-20ms)
    const filteredPool = this.filterByStrokeLuck(pool, lastNameStrokes);
    // 길한 획수 조합만 선택 (2+ 길격)

    // Stage 3: Combination generation (50-100ms)
    // Stage 4: Scoring (1.5-2.5s)
    const candidates = await this.generateAndScoreCombinations(
      filteredPool, lastName, lastNameStrokes, saju,
      maxResults, minScore, enableEarlyTermination
    );

    return candidates.sort((a,b) => b.scores.overall - a.scores.overall);
  }
}
```

**특징:**
- ✅ 매우 빠름 (<3초)
- ✅ 인기 한자 화이트리스트 사용
- ✅ 조기 종료 (Early Termination) 지원
- ✅ 배치 처리로 메모리 효율적
- ❌ AI 의미 분석 없음
- ❌ 용신 계산 간단함 (3가지 경우만)

### 새로운 NamingPipeline 로직 (Day 8)

**파일:** `app/lib/naming/pipeline/naming-pipeline.ts`

```typescript
class NamingPipeline {
  async execute(request) {
    // Step 1: 사주 계산 (SajuCalculator)
    const saju = await step1.execute(request.birthInfo);

    // Step 2: 용신 계산 (5가지 전통 방법)
    const traditionalYongsin = await step2.execute(saju);
    // - 부족법 (Lacking Method)
    // - 강약법 (Strength Method)
    // - 조후법 (Climate Method)
    // - 통관법 (Mediation Method)
    // - 격국법 (Pattern Method)

    // Step 3: AI 용신 분석 (OpenAI GPT-4)
    const aiYongsin = await step3.execute(saju, traditionalYongsin);

    // Step 4: 용신 합의 (전통 70% + AI 30%)
    const finalYongsin = await step4.execute(traditionalYongsin, aiYongsin);

    // Step 5: 한자 후보 필터링
    const hanjaPool = await step5.execute(finalYongsin, lastName);

    // Step 6: 조합 생성 + 전통 점수화
    const scoredCandidates = await step6.execute(hanjaPool, saju);

    // Step 7: AI 의미 점수 (OpenAI)
    const withAIScores = await step7.execute(scoredCandidates, saju);

    // Step 8: 최종 순위 결정
    return await step8.execute(withAIScores, request.preferences);
  }
}
```

**특징:**
- ✅ AI 통합 (용신 분석 + 의미 점수)
- ✅ 5가지 전통 용신 방법 사용
- ✅ 더 정교한 점수 산정
- ❌ 느림 (20-30초)
- ❌ OpenAI API 비용 발생
- ❌ 네트워크 의존성 (API 장애 가능)

---

## 한자 검색 및 필터링

### 공통: hanja-service.server.ts

**두 서비스 모두 동일한 한자 검색 함수 사용:**

```typescript
// app/lib/hanja-service.server.ts
export async function searchHanjaFromDB(options: HanjaSearchOptions) {
  // 1. 두음법칙 확장 (이↔리, 유↔류 등)
  const readings = expandDueum(reading);

  // 2. 성씨 모드 vs 이름 모드 분기
  if (isSurname && surnameHanjaList) {
    // 성씨 모드: SURNAME_MAP에서 가져온 한자만
    // nameFrequency 필터 제거 (千자도 포함)
    results = await prisma.hanjaDict.findMany({
      where: {
        character: { in: surnameHanjaList, notIn: BAD_CHARACTERS },
        isGoodForNaming: true
        // ← nameFrequency 필터 없음
      }
    });
  } else {
    // 이름 모드: 인기도 필터 적용
    results = await prisma.hanjaDict.findMany({
      where: {
        koreanReading: { in: readings },
        character: { notIn: BAD_CHARACTERS },
        isGoodForNaming: true,
        nameFrequency: { gte: 50 }  // ← 빈도수 50 이상만
      }
    });
  }

  // 3. 299개 부정적 한자 블랙리스트 제외
  // BAD_CHARACTERS = ['餬', '醐', '蝴', '狐', ...]

  return response;
}
```

**공통 필터:**
- ✅ `isGoodForNaming: true` (작명 적합 한자만)
- ✅ 299개 부정적 한자 제외 (`BAD_CHARACTERS`)
- ✅ 두음법칙 자동 적용 (이↔리, 유↔류)

**차이점:**
- 성씨 모드: `nameFrequency` 필터 없음 (모든 성씨 한자 허용)
- 이름 모드: `nameFrequency >= 50` (인기도 필터)

### HanjaMatcher 전용 필터

**파일:** `app/lib/naming/matcher.ts:126-242`

```typescript
private async filterByElements(favorableElements, lackingElements, gender, avoidChars) {
  // 1️⃣ 화이트리스트 우선 (popular-hanja.ts)
  const popularChars = [...ALL_POPULAR_HANJA];  // 300개

  // 2️⃣ DB 쿼리
  let results = await prisma.hanjaDict.findMany({
    where: {
      AND: [
        { character: { in: popularChars } },  // ← 화이트리스트만
        { element: { in: allTargetElements } },
        { isGoodForNaming: true },
        { nameFrequency: { gte: 50 } },
        { character: { notIn: rareChars } }
      ]
    },
    take: 300
  });

  // 3️⃣ 폴백: 화이트리스트가 부족하면 (<50개) 재검색
  if (results.length < 50) {
    results = await prisma.hanjaDict.findMany({
      where: {
        element: { in: allTargetElements },
        isGoodForNaming: true,
        nameFrequency: { gte: 50 }
        // ← 화이트리스트 제거
      },
      take: 300
    });
  }

  return results;
}
```

**화이트리스트 파일:** `app/lib/naming/popular-hanja.ts`

```typescript
// 인기 한자 큐레이션 (300개)
export const VERY_POPULAR_HANJA = [
  '민', '준', '서', '하', '윤', '지', '우', '현', '주', '은',
  '영', '수', '정', '미', '진', '희', '경', '성', '아', '선',
  // ... 총 300개
];

export const ALL_POPULAR_HANJA = VERY_POPULAR_HANJA;

// 제외 한자 (희귀/부정적)
export const RARE_HANJA = [
  '㝢', '㮾', '㴇', '㶳', '㺚', '䜣', '䝙', '䞐', '䢙', '䥘',
  // ...
];
```

### NamingPipeline 한자 필터링

**파일:** `app/lib/naming/pipeline/steps/step5-filter-hanja.ts`

```typescript
// Step 5: 한자 후보 필터링
export class Step5FilterHanja implements PipelineStep {
  async execute(context) {
    const { finalYongsin, lastName } = context;

    // 용신 오행에 맞는 한자만 선택
    const hanjaPool = await prisma.hanjaDict.findMany({
      where: {
        element: { in: [finalYongsin.primary, finalYongsin.secondary] },
        isGoodForNaming: true,
        nameFrequency: { gte: 30 }  // ← 더 관대함 (50 → 30)
      },
      orderBy: [
        { nameFrequency: 'desc' },
        { usageFrequency: 'desc' }
      ],
      take: 500  // ← 더 많은 후보 (300 → 500)
    });

    return { ...context, hanjaPool };
  }
}
```

**차이점:**
- ✗ 화이트리스트 미사용 (모든 한자 허용)
- ✓ `nameFrequency >= 30` (더 관대함)
- ✓ 더 많은 후보 수집 (500개)
- ✓ 용신 오행만 필터링

---

## 점수 계산 방식

### 기존 ScoringPipeline (Phase 2)

**파일:** `app/lib/naming/scorers/index.ts`

```typescript
class ScoringPipeline {
  private scorers = [
    new ElementHarmonyScorer(),   // 35% 가중치
    new YinYangBalanceScorer(),   // 25% 가중치
    new NumerologyScorer(),       //  5% 가중치
    new MeaningHarmonyScorer(),   // 10% 가중치 (AI 없음!)
    new PronunciationScorer()     // 20% 가중치
  ];

  async scoreAll(candidates, context) {
    const scored = [];

    for (const candidate of candidates) {
      // 각 스코어러 실행
      const elementScore = await this.scorers[0].score(candidate, context);
      const yinyangScore = await this.scorers[1].score(candidate, context);
      const numerologyScore = await this.scorers[2].score(candidate, context);
      const meaningScore = await this.scorers[3].score(candidate, context);
      const pronunciationScore = await this.scorers[4].score(candidate, context);

      // 가중 평균 계산
      const overall =
        elementScore.score * 0.35 +
        yinyangScore.score * 0.25 +
        numerologyScore.score * 0.05 +
        meaningScore.score * 0.10 +  // ← 규칙 기반만!
        pronunciationScore.score * 0.20;

      scored.push({
        ...candidate,
        scores: {
          overall,
          elementHarmony: elementScore,
          yinYangBalance: yinyangScore,
          numerology: numerologyScore,
          meaningHarmony: meaningScore,
          pronunciation: pronunciationScore
        }
      });
    }

    return scored;
  }
}
```

**MeaningHarmonyScorer 세부 (규칙 기반)**

```typescript
// app/lib/naming/scorers/meaning-harmony.ts
class MeaningHarmonyScorer implements Scorer {
  async score(candidate, context) {
    const [char1, char2] = candidate.characters;

    // 1. 카테고리 매칭 (자연↔자연, 덕목↔덕목)
    const categoryMatch = this.checkCategoryHarmony(
      char1.category,
      char2.category
    );

    // 2. 의미 키워드 충돌 체크 (규칙 기반)
    const hasConflict = this.checkMeaningConflict(
      char1.meaning,
      char2.meaning
    );

    // 3. 점수 계산 (0-100)
    let score = 50;  // 기본 점수
    if (categoryMatch) score += 30;
    if (hasConflict) score -= 40;

    return {
      score,
      category: 'meaningHarmony',
      weight: 0.10,
      details: [
        categoryMatch ? '카테고리 조화' : '카테고리 불일치',
        hasConflict ? '의미 충돌' : '의미 조화'
      ]
    };
  }

  private checkCategoryHarmony(cat1, cat2) {
    // 간단한 규칙 매칭
    const harmonious = [
      ['nature', 'nature'],
      ['virtue', 'virtue'],
      ['wisdom', 'wisdom']
    ];

    return harmonious.some(([c1, c2]) =>
      (cat1.includes(c1) && cat2.includes(c2)) ||
      (cat2.includes(c1) && cat1.includes(c2))
    );
  }
}
```

**특징:**
- ✅ 매우 빠름 (규칙 기반만)
- ✅ 예측 가능한 결과
- ❌ 의미 이해 제한적
- ❌ AI 사용 없음

### 새로운 NamingPipeline 점수화 (Day 8)

**Step 6: 전통 점수화**

```typescript
// app/lib/naming/pipeline/steps/step6-score-combinations.ts
class Step6ScoreCombinations {
  async execute(context) {
    const { hanjaPool, saju, lastName } = context;
    const scorer = new TraditionalScorer();

    // 모든 조합 생성 + 전통 점수화
    const candidates = [];
    for (let i = 0; i < hanjaPool.length; i++) {
      for (let j = i; j < hanjaPool.length; j++) {
        const candidate = createCandidate(hanjaPool[i], hanjaPool[j]);

        // 전통 점수 (용신 35% + 음양 25% + 발음 20% + 81수리 5%)
        const traditionalScore = await scorer.score(candidate, saju, lastName);

        candidates.push({
          ...candidate,
          scores: traditionalScore
        });
      }
    }

    return { ...context, scoredCandidates: candidates };
  }
}
```

**Step 7: AI 의미 점수 추가**

```typescript
// app/lib/naming/pipeline/steps/step7-ai-meaning-score.ts
class Step7AIMeaningScore {
  async execute(context) {
    const { scoredCandidates, saju } = context;

    // OpenAI GPT-4로 의미 분석 (배치 처리)
    const aiScores = await this.getAIMeaningScores(scoredCandidates, saju);

    // 기존 점수 + AI 점수 합산
    const withAIScores = scoredCandidates.map((candidate, index) => {
      const aiMeaningScore = aiScores[index];

      // 재계산: 전통 90% + AI 의미 10%
      const finalScore =
        candidate.scores.overall * 0.90 +  // 기존 점수
        aiMeaningScore * 0.10;              // AI 의미 점수

      return {
        ...candidate,
        scores: {
          ...candidate.scores,
          overall: finalScore,
          aiMeaning: aiMeaningScore
        }
      };
    });

    return { ...context, scoredCandidates: withAIScores };
  }

  private async getAIMeaningScores(candidates, saju) {
    // OpenAI API 호출
    const prompt = `
      사주 분석 결과: ${JSON.stringify(saju)}

      다음 이름들의 의미가 사주와 얼마나 잘 어울리는지 평가해주세요:
      ${candidates.map(c => `${c.firstName.join('')}: ${c.characters.map(ch => ch.meaning).join(', ')}`).join('\n')}

      각 이름마다 0-100점 점수를 부여하고, 그 이유를 설명해주세요.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    return parseAIScores(response.choices[0].message.content);
  }
}
```

**특징:**
- ✅ AI 의미 이해 (문맥 파악)
- ✅ 사주와 이름 의미의 심층 연관성 분석
- ❌ 느림 (20-30초)
- ❌ API 비용 ($0.01-0.05/요청)
- ❌ 네트워크 의존성

---

## 성능 최적화

### 기존 HanjaMatcher 최적화

**1. 화이트리스트로 DB 쿼리 최소화**
```typescript
// 8,787개 → 300개로 축소
const popularChars = [...ALL_POPULAR_HANJA];
const where = { character: { in: popularChars } };
```

**2. 조기 종료 (Early Termination)**
```typescript
// 150개 고품질 후보 확보 시 중단
if (enableEarlyTermination && highScoreCount >= 150) {
  break;
}
```

**3. 빠른 점수 사전 필터링**
```typescript
const quickScore = this.calculateQuickScore(candidate, saju);
if (quickScore < 65) {
  continue;  // 저품질 후보 스킵
}
```

**4. 배치 처리 (메모리 효율)**
```typescript
const BATCH_SIZE = 100;
let batchBuffer = [];

// 100개씩 모아서 한 번에 점수화
if (batchBuffer.length >= BATCH_SIZE) {
  const scored = await pipeline.scoreAll(batchBuffer, context);
  candidates.push(...scored);
  batchBuffer = [];
}
```

**성능 목표:**
- ✅ Stage 1 (DB 필터): 50-100ms
- ✅ Stage 2 (획수 필터): 10-20ms
- ✅ Stage 3 (조합 생성): 50-100ms
- ✅ Stage 4 (점수화): 1.5-2.5s
- ✅ **총합: <3초**

### NamingPipeline 최적화 시도

**1. 용신 계산 병렬화**
```typescript
// 5가지 방법 동시 실행
const methods = await Promise.all([
  lackingMethod.calculate(saju),
  strengthMethod.calculate(saju),
  climateMethod.calculate(saju),
  mediationMethod.calculate(saju),
  patternMethod.calculate(saju)
]);
```

**2. AI 호출 최소화**
```typescript
// 상위 후보만 AI 분석 (전체 500개 → 상위 50개)
const topCandidates = scoredCandidates
  .sort((a, b) => b.scores.overall - a.scores.overall)
  .slice(0, 50);

const aiScores = await this.getAIMeaningScores(topCandidates, saju);
```

**3. 캐싱 전략**
```typescript
// 동일한 사주는 결과 캐시
const cacheKey = `saju:${birthInfo.year}:${birthInfo.month}:...`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

**현재 성능:**
- Step 1-2 (사주+용신): ~2s
- Step 3 (AI 용신): ~5-8s
- Step 4-6 (합의+필터+점수): ~3s
- Step 7 (AI 의미): ~10-15s
- Step 8 (순위): <1s
- ⚠️ **총합: 20-30초**

**병목:**
- 🔴 OpenAI API 호출 (2회) - 15-23초
- 🟡 용신 계산 (5가지 방법) - 2초
- 🟡 조합 생성 - 3초

---

## 사용자 경험

### 기존 서비스 UX

**신생아 작명 (`/naming`)**

1. 사용자 입력:
   - 생년월일시
   - 성별
   - 성씨 (한글)

2. 1단계: "사주 분석 중..." (~500ms)
   - 로딩 표시
   - 사주 결과 표시 (년월일시주, 오행 분포)

3. 2단계: "이름 추천 중..." (~3초)
   - 진행률 표시
   - 추천 결과 표시 (50-100개)

4. 결과 화면:
   - 이름 목록 (점수순)
   - 필터링 (성별, 점수 범위)
   - 한자 상세 보기 (클릭 시)

**장점:**
- ✅ 빠른 응답 (<5초)
- ✅ 2단계로 나뉘어 진행 상황 명확
- ✅ 중간 결과 (사주) 확인 가능

**단점:**
- ❌ 2번의 API 호출 필요
- ❌ DB 저장으로 불필요한 데이터 축적

### 새로운 AI 작명 UX

**AI 사주 작명 (`/ai-naming`)**

1. 사용자 입력:
   - 생년월일시
   - 성별
   - **성씨 한자 선택** ← 추가됨! (필수)

2. 단일 API 호출: "AI 작명 분석 중..." (~25초)
   - 진행률 표시 (8단계)
   - Step 1/8: 사주 계산
   - Step 2/8: 용신 분석 (전통)
   - Step 3/8: AI 용신 분석
   - Step 4/8: 용신 합의
   - Step 5/8: 한자 필터링
   - Step 6/8: 조합 점수화
   - Step 7/8: AI 의미 분석
   - Step 8/8: 최종 순위

3. 결과 화면:
   - 추천 이름 (10-30개)
   - **AI 의미 설명** ← 추가됨!
   - 점수 세부 내역
   - 용신 분석 결과

**장점:**
- ✅ AI 의미 분석 제공
- ✅ 5가지 전통 용신 방법 사용
- ✅ 더 정교한 점수
- ✅ 단일 API 호출 (세션 관리 간단)

**단점:**
- ❌ 느림 (20-30초)
- ❌ 성씨 한자 선택 추가 단계
- ❌ 네트워크 장애 시 전체 실패
- ❌ OpenAI API 비용

---

## 주요 차이점 요약

| 항목 | 기존 서비스 (Phase 2) | AI 작명 (Day 8) |
|------|----------------------|----------------|
| **API 구조** | 2단계 (analyze → recommend) | 1단계 (generate) |
| **응답 시간** | <5초 | 20-30초 |
| **용신 계산** | 간단 (3가지 경우) | 정교 (5가지 전통 + AI) |
| **의미 점수** | 규칙 기반 | AI 기반 (GPT-4) |
| **한자 필터링** | 화이트리스트 (300개) | 전체 DB (500개) |
| **점수 가중치** | 용신 35%, 음양 25%, 발음 20%, 의미 10%, 81수리 5%, 금기 5% | 동일 (하지만 의미 점수는 AI) |
| **DB 저장** | SajuData 테이블에 저장 | 저장 안함 (메모리만) |
| **비용** | 무료 (DB만) | OpenAI API 비용 ($0.01-0.05/요청) |
| **의존성** | DB만 | DB + OpenAI API |
| **장애 복원력** | 높음 (DB만) | 낮음 (API 장애 가능) |
| **성씨 입력** | 한글만 | 한자 선택 필수 |
| **결과 품질** | 빠르고 안정적 | 느리지만 의미 있음 |

---

## 결론

### 기존 서비스의 강점

1. **속도**: <5초 내 응답 (프로덕션 품질)
2. **안정성**: DB만 의존, 네트워크 장애 없음
3. **비용**: 무료 (DB 쿼리만)
4. **확장성**: 화이트리스트 + 조기 종료로 효율적
5. **검증됨**: 실제 사용자 피드백 반영

### AI 작명의 강점

1. **정교함**: 5가지 전통 용신 방법 + AI
2. **의미 분석**: GPT-4로 심층 의미 이해
3. **투명성**: 8단계 과정 명확히 표시
4. **확장 가능**: 새로운 AI 기능 추가 용이
5. **혁신적**: 전통 + AI 하이브리드

### 통합 전략 제안

**단기 (현재):**
- 기존 서비스: 일반 사용자 대상 (빠른 작명)
- AI 작명: 프리미엄 서비스 (정교한 분석)

**중기 (3-6개월):**
1. AI 작명 성능 최적화
   - OpenAI Batch API 사용 (비용 50% 절감)
   - 용신 계산 결과 캐싱
   - AI 호출 1회로 통합 (용신 + 의미)

2. 하이브리드 모드 추가
   - 기본 모드: HanjaMatcher (빠름)
   - 프리미엄 모드: NamingPipeline (AI)
   - 사용자가 선택

**장기 (6-12개월):**
1. NamingPipeline을 기본으로
   - 성능 최적화 완료 후
   - AI API 비용 검증 후
   - A/B 테스트 통과 후

2. HanjaMatcher는 폴백으로
   - API 장애 시 자동 전환
   - 빠른 응답 필요 시
   - 무료 사용자 대상

---

**문서 버전:** 1.0
**작성일:** 2025-10-27
**작성자:** Claude (AI 분석)
**검토 필요:** 사용자 피드백 수집 후 업데이트
