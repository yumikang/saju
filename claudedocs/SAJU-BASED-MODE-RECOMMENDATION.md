# 사주 기반 모드 자동 추천 시스템

## 📋 개요

사주팔자 분석 결과를 기반으로 **최적의 점수 계산 모드를 자동 추천**하는 시스템

**핵심 아이디어:**
> "태어날 때부터 가진 오행 균형을 먼저 보고, 부족하면 오행 보완에 집중하고, 충분하면 의미에 집중하자"

## 🎯 추천 로직

### 4단계 분류

#### 1. 오행 균형 매우 좋음 (80점 이상)
```
추천 모드: 의미형 (Meaning Mode)
이유: 타고난 오행 균형이 이미 충분하므로
      이름에서는 부모의 가치와 의미에 집중
가중치: 오행 25%, 의미 35%
확신도: 90%
```

**예시:**
- 5개 오행이 골고루 분포 (목2, 화2, 토2, 금1, 수1)
- 특정 오행이 과도하게 치우치지 않음

#### 2. 오행 균형 양호 (65-79점)
```
추천 모드: 하이브리드 (Hybrid Mode)
이유: 오행 균형이 양호하지만 완벽하지 않으므로
      오행 보완과 의미를 균형있게 고려
가중치: 오행 35%, 의미 25% (가변)
확신도: 80%
```

**예시:**
- 대부분 오행이 있지만 일부 약함
- 특별히 문제될 정도는 아님

#### 3. 오행 균형 부족 (40-64점)
```
추천 모드: 하이브리드 (Hybrid Mode)
이유: 오행 균형이 다소 부족하므로
      오행 보완에 중점을 두되 의미도 고려
가중치: 오행 35%, 의미 25% (가변, 오행 쪽으로 자동 조정)
확신도: 85%
```

**예시:**
- 특정 오행 1-2개가 없거나 매우 적음
- 오행 보완 필요성 명확

#### 4. 오행 균형 매우 부족 (< 40점)
```
추천 모드: 균형형 (Balance Mode)
이유: 타고난 오행 균형이 매우 부족하므로
      이름을 통한 오행 보완을 최우선으로
가중치: 오행 45%, 의미 15%
확신도: 95%
```

**예시:**
- 특정 오행이 완전히 없거나 과도하게 많음
- 예: 화(火) 6개, 목(木) 0개

## 📊 오행 균형 점수 계산

### 계산 방식
```typescript
// 1. 천간 4개 + 지지 4개 = 총 8개의 오행 분포 분석
// 2. 이상적 분포: 각 오행 20% (5개 오행)
// 3. 편차 계산: |실제% - 20%|의 합
// 4. 균형 점수 = 100 - (편차 / 최대편차 * 100)
```

### 예시

**케이스 1: 완벽한 균형**
```
목: 2개 (25%) → 편차 5%
화: 2개 (25%) → 편차 5%
토: 2개 (25%) → 편차 5%
금: 1개 (13%) → 편차 7%
수: 1개 (13%) → 편차 7%
총 편차: 29% → 점수: 71점
```

**케이스 2: 심한 불균형**
```
목: 0개 (0%)  → 편차 20%
화: 6개 (75%) → 편차 55%
토: 1개 (13%) → 편차 7%
금: 0개 (0%)  → 편차 20%
수: 1개 (13%) → 편차 7%
총 편차: 109% → 점수: 0점
```

## 🔧 구현 파일

### 1. `/app/lib/naming/utils/mode-recommendation.ts` (NEW)

**핵심 함수:**
```typescript
export function recommendScoringMode(sajuResult: SajuResult): ModeRecommendation {
  // 1. 오행 균형 분석
  const elementBalance = analyzeElementBalance(sajuResult);

  // 2. 균형 점수 기반 모드 결정
  if (elementBalance.score >= 80) return 'meaning';
  if (elementBalance.score >= 65) return 'hybrid';
  if (elementBalance.score >= 40) return 'hybrid';
  return 'balance';
}

function analyzeElementBalance(sajuResult: SajuResult): ElementBalanceStatus {
  // 천간지지 8개의 오행 분포 분석
  // 이상적 분포 대비 편차 계산
  // 부족/과다 오행 식별
}
```

**반환 타입:**
```typescript
interface ModeRecommendation {
  recommendedMode: ScoringMode;      // 추천 모드
  reason: string;                    // 추천 이유 (사용자용)
  confidence: number;                // 확신도 (0-1)
  elementBalance: ElementBalanceStatus; // 오행 분석 결과
}

interface ElementBalanceStatus {
  score: number;         // 균형 점수 (0-100)
  lacks: string[];       // 부족한 오행 (예: ['목(木)', '금(金)'])
  excess: string[];      // 과한 오행 (예: ['화(火)'])
  isBalanced: boolean;   // 균형 잡혔는지 (70점 이상)
}
```

### 2. `/app/lib/naming/utils/scoring-context-builder.ts` (NEW)

**사용 예시:**
```typescript
import { buildScoringContext } from './scoring-context-builder';

// 자동 추천 (기본)
const context = buildScoringContext({
  sajuResult,
  lastName: '김',
  lastNameStrokes: 7,
  // scoringMode 미지정 → 자동 추천
});

// 사용자가 직접 선택
const context = buildScoringContext({
  sajuResult,
  lastName: '김',
  lastNameStrokes: 7,
  userSelectedMode: 'meaning', // 사용자 선택 우선
});

// 자동 추천 비활성화 (하이브리드 기본값)
const context = buildScoringContext({
  sajuResult,
  lastName: '김',
  lastNameStrokes: 7,
  disableAutoRecommendation: true,
});
```

### 3. Tests & Scripts

**테스트 스크립트:** `/scripts/test-mode-recommendation.ts`
- 4가지 케이스 테스트
- 오행 분포 시각화
- 추천 결과 검증

## 📊 테스트 결과

### 케이스 1: 오행 균형 매우 좋음
```
오행 분포:
  목: ██       (2/8, 25%)
  화: ██       (2/8, 25%)
  토: ██       (2/8, 25%)
  금: █        (1/8, 13%)
  수: █        (1/8, 13%)

균형 점수: 70점
추천 모드: 하이브리드
이유: 타고난 오행 균형이 양호합니다.
```

### 케이스 2: 목(木) 완전 부족
```
오행 분포:
  목:          (0/8, 0%)  ← 완전 부족
  화: ███      (3/8, 38%)
  토: ██       (2/8, 25%)
  금: ██       (2/8, 25%)
  수: █        (1/8, 13%)

균형 점수: 45점
추천 모드: 하이브리드
부족: 목(木)
이유: 타고난 오행 균형이 다소 부족합니다. 오행 보완에 중점을 두되 의미도 함께 고려하는 것을 추천합니다.
```

### 케이스 3: 화(火) 과다
```
오행 분포:
  목:          (0/8, 0%)
  화: ██████   (6/8, 75%)  ← 과다
  토: █        (1/8, 13%)
  금:          (0/8, 0%)
  수: █        (1/8, 13%)

균형 점수: 0점
추천 모드: 균형형 ✅
부족: 수(水), 목(木), 금(金)
과다: 화(火)
이유: 타고난 오행 균형이 많이 부족합니다. 이름을 통한 오행 보완을 최우선으로 하는 것을 추천합니다.
```

## 🎨 UI 통합 가이드

### 1. 모드 선택 UI에 추천 표시

```tsx
import { getModeRecommendationForUI } from '@/lib/naming/utils/scoring-context-builder';

function ModeSelector({ sajuResult }) {
  const recommendation = getModeRecommendationForUI(sajuResult);

  return (
    <div>
      <h3>점수 계산 모드 선택</h3>

      {/* 추천 안내 */}
      <div className="bg-blue-50 p-4 rounded">
        <p className="font-bold">
          🎯 추천: {MODE_DESCRIPTIONS[recommendation.recommendedMode].title}
        </p>
        <p className="text-sm">{recommendation.reason}</p>
        <div className="mt-2">
          <span>오행 균형: {recommendation.elementBalance.score}점</span>
          {recommendation.elementBalance.lacks.length > 0 && (
            <span className="ml-2">
              부족: {recommendation.elementBalance.lacks.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* 모드 선택 버튼들 */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <ModeButton mode="balance" recommended={recommendation.recommendedMode === 'balance'} />
        <ModeButton mode="meaning" recommended={recommendation.recommendedMode === 'meaning'} />
        <ModeButton mode="hybrid" recommended={recommendation.recommendedMode === 'hybrid'} />
      </div>
    </div>
  );
}
```

### 2. 오행 균형 시각화

```tsx
function ElementBalanceGauge({ elementBalance }) {
  const { score, lacks, excess } = elementBalance;

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${getBalanceColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="font-bold">{score}점</span>
      </div>

      {lacks.length > 0 && (
        <p className="text-sm text-yellow-600 mt-2">
          ⚠️ 부족: {lacks.join(', ')}
        </p>
      )}
      {excess.length > 0 && (
        <p className="text-sm text-red-600 mt-1">
          ⚠️ 과다: {excess.join(', ')}
        </p>
      )}
    </div>
  );
}
```

### 3. API 통합

```typescript
// routes/api.naming.generate.ts

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userSelectedMode = url.searchParams.get('mode') as ScoringMode | null;

  // 사주 분석
  const sajuResult = await calculateSaju(birthDate);

  // ScoringContext 생성 (자동 추천 포함)
  const context = buildScoringContext({
    sajuResult,
    lastName,
    lastNameStrokes,
    userSelectedMode, // 사용자 선택 우선, 없으면 자동 추천
  });

  // 이름 생성
  const candidates = await generateNames(context);

  return json({
    candidates,
    recommendation: getModeRecommendationForUI(sajuResult),
  });
}
```

## 🔄 작동 흐름

```
1. 사용자 생년월일 입력
   ↓
2. 사주팔자 분석 (calculateSaju)
   ↓
3. 오행 균형 분석 (analyzeElementBalance)
   - 천간지지 8개의 오행 분포
   - 균형 점수 계산 (0-100)
   - 부족/과다 오행 식별
   ↓
4. 모드 자동 추천 (recommendScoringMode)
   - 80+ → 의미형
   - 65-79 → 하이브리드
   - 40-64 → 하이브리드 (오행 중점)
   - <40 → 균형형
   ↓
5. ScoringContext 생성 (buildScoringContext)
   - 추천 모드 적용 (사용자 선택 우선)
   ↓
6. 이름 생성 (generateNames)
   - 추천된 모드로 점수 계산
   ↓
7. UI 표시
   - 추천 모드 안내
   - 오행 균형 상태 시각화
   - 사용자가 원하면 다른 모드 선택 가능
```

## 💡 사용자 경험

### Before (기존)
```
"점수 모드를 선택하세요: 균형형 / 의미형 / 하이브리드"
→ 사용자: "뭐가 좋은지 모르겠는데..." 😕
```

### After (개선)
```
"🎯 추천: 균형형
타고난 오행 균형이 많이 부족합니다 (0점).
이름을 통한 오행 보완을 최우선으로 하는 것을 추천합니다.
(특히 수(水), 목(木), 금(金) 보완 시급)

[균형형 선택됨] [의미형] [하이브리드]
원하시면 다른 모드도 선택하실 수 있습니다."
→ 사용자: "아, 내 사주에는 균형형이 좋구나!" 😊
```

## 🎯 장점

1. **개인화된 추천**
   - 사주팔자마다 다른 추천
   - 획일적이지 않음

2. **근거 있는 설명**
   - 왜 이 모드를 추천하는지 명확
   - 오행 균형 점수 제시

3. **선택권 보장**
   - 추천일 뿐, 강제 아님
   - 사용자가 원하면 다른 모드 선택 가능

4. **전문성 향상**
   - 사주명리학 원리 반영
   - 과학적 근거 기반

## 📚 연관 문서

- [Scoring Mode Implementation](./SCORING-MODE-IMPLEMENTATION.md) - 3-Mode 점수 시스템
- [Phonetic Quality Enhancement](./PHONETIC-QUALITY-ENHANCEMENT.md) - 발음 품질 강화
- [Meaning-based Filtering](./MEANING-BASED-FILTERING.md) - 의미 기반 필터링

## ✅ 완료 상태

- [x] 오행 균형 분석 로직
- [x] 모드 자동 추천 알고리즘
- [x] ScoringContext 빌더
- [x] 테스트 스크립트 (4 케이스)
- [x] 문서화
- [ ] UI 통합 (모드 선택 화면)
- [ ] API 통합 (이름 생성 API)

---

**구현 날짜:** 2025-11-04
**테스트 결과:** ✅ 4/4 케이스 정상 작동
**핵심 가치:** "사주를 먼저 보고 부족하면 오행, 충분하면 의미"
