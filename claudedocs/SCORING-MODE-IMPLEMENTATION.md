# 3-Mode Scoring System Implementation

## 📋 개요

사용자 요청에 따라 **균형형**, **의미형**, **하이브리드** 3가지 점수 계산 모드를 구현했습니다.

**핵심 개념:**
- 오행 조화(사주 적합)와 부모 가치(의미 취향)의 가중치를 사용자가 선택
- 모드별로 다른 가중치 프리셋 적용
- 하이브리드 모드는 오행 점수에 따라 가중치 자동 조정
- Safety threshold로 오행 부족 이름 TOP 진입 차단

## 🎯 구현된 3가지 모드

### 1. 균형형 (Balance Mode)
**철학:** 사주 오행을 1순위, 가치는 2순위 (전통 명리학 기반)

**가중치:**
- 오행: 45%
- 음양: 15%
- 의미: 15%
- 언어: 15%
- 금기: 10%

**안전 기준:**
- Element Threshold: 60점 (오행 60점 미만 → 79.9점 제한)
- Meaning Cap: +12점 (의미 가점 최대 12점)

### 2. 의미형 (Meaning Mode)
**철학:** 부모 가치/의미를 1순위, 오행은 최소 기준만 충족 (현대적 접근)

**가중치:**
- 오행: 25%
- 음양: 10%
- 의미: 35% ⬆️ (최우선)
- 언어: 15%
- 금기: 15%

**안전 기준:**
- Element Threshold: 50점 (완화)
- Meaning Cap: +15점 (확대)

### 3. 하이브리드 (Hybrid Mode) - 추천 기본값 ⭐
**철학:** 오행과 의미를 균형있게 고려, 상황에 따라 자동 조정

**기본 가중치:**
- 오행: 35%
- 음양: 12%
- 의미: 25%
- 언어: 15%
- 금기: 13%

**동적 조정 로직:**
```typescript
// 오행 점수가 낮을수록 오행 가중치 증가
Element Score 100 → Element 30%, Meaning 30%
Element Score 80  → Element 33%, Meaning 27%
Element Score 60  → Element 36%, Meaning 24%
Element Score 40  → Element 39%, Meaning 21%
Element Score 20  → Element 42%, Meaning 18%
```

**안전 기준:**
- Element Threshold: 55점
- Meaning Cap: +13점

## 🔧 구현 파일

### 1. `/app/lib/naming/types/scoring-mode.ts` (NEW)
**타입 정의 및 핵심 함수**

```typescript
export type ScoringMode = 'balance' | 'meaning' | 'hybrid';

export interface ScoringWeights {
  element: number;
  yinyang: number;
  meaning: number;
  linguistic: number;
  taboo: number;
}

export interface ModeConfiguration {
  mode: ScoringMode;
  weights: ScoringWeights;
  description: string;
  elementThreshold: number;
  meaningCap: number;
}

// 3가지 모드 설정 export
export const BALANCE_MODE: ModeConfiguration;
export const MEANING_MODE: ModeConfiguration;
export const HYBRID_MODE: ModeConfiguration;

// 핵심 함수들
export function getModeConfiguration(mode: ScoringMode): ModeConfiguration;
export function calculateHybridWeights(elementScore: number): ScoringWeights;
export function applySafetyThreshold(score: number, elementScore: number, threshold: number): number;
export function validateWeights(weights: ScoringWeights): boolean;
```

### 2. `/app/lib/naming/types.ts` (MODIFIED)
**ScoringContext에 mode 필드 추가**

```typescript
export interface ScoringContext {
  sajuResult: SajuResult;
  lastName: string;
  lastNameHanja?: string;
  lastNameStrokes: number;
  preferences?: NamingPreferences;
  config?: {
    batchSize?: number;
  };
  scoringMode?: import('./types/scoring-mode').ScoringMode; // 🆕
}
```

### 3. `/app/lib/naming/scorers/scoring-pipeline.ts` (MODIFIED)
**Mode 기반 점수 계산 로직**

변경 내역:
1. Mode configuration import
2. `scoreCandidate()` 메서드 업데이트:
   - STEP 1: Mode 설정 가져오기
   - STEP 2: Mode별 가중치 적용 (Hybrid는 동적 계산)
   - STEP 3: Safety threshold 적용

```typescript
async scoreCandidate(candidate: NameCandidate, context: ScoringContext): Promise<ScoredCandidate> {
  // STEP 1: Get mode configuration
  const mode = context.scoringMode || 'hybrid';
  const modeConfig = getModeConfiguration(mode);

  // Run scorers...
  const detailedScores = await Promise.all(...);

  // STEP 2: Apply mode-specific weights
  let weights: ScoringWeights;
  if (mode === 'hybrid') {
    weights = calculateHybridWeights(elementHarmony.score);
  } else {
    weights = modeConfig.weights;
  }

  // Calculate mode-adjusted scores
  const baseScore = ...;

  // Tie-breakers...
  let overall = baseScore + tieBreakers;

  // STEP 3: Apply safety threshold
  overall = applySafetyThreshold(overall, elementHarmony.score, modeConfig.elementThreshold);

  return { ...candidate, scores: { overall, ... } };
}
```

### 4. `/scripts/test-scoring-modes.ts` (NEW)
**테스트 스크립트**

테스트 항목:
1. ✅ Mode configurations 검증 (가중치 합 = 1.0)
2. ✅ Hybrid 동적 가중치 계산
3. ✅ Safety threshold 적용
4. ✅ Mode 간 가중치 비교

실행: `npx tsx scripts/test-scoring-modes.ts`

## 📊 테스트 결과

### Test 1: Mode Configurations
```
균형형 (Balance): ✅ Sum: 1.000
의미형 (Meaning): ✅ Sum: 1.000
하이브리드 (Hybrid): ✅ Sum: 1.000
```

### Test 2: Hybrid Dynamic Weights
```
Element Score | Element Weight | Meaning Weight
100          | 30.0%          | 30.0%
80           | 33.0%          | 27.0%
60           | 36.0%          | 24.0%
40           | 39.0%          | 21.0%
20           | 42.0%          | 18.0%
```

### Test 3: Safety Threshold
```
Score | Element | Threshold | Final Score | Capped?
95    | 70      | 60        | 95.0        | ✅
95    | 55      | 60        | 79.9        | ❌ (Capped)
92    | 45      | 50        | 79.9        | ❌ (Capped)
```

**효과:** 오행 점수가 낮은 이름은 의미 점수가 높아도 TOP 10 진입 차단

## 🎯 Safety Mechanism

### 1. Lower Threshold (하한선)
**목적:** 오행 부족 이름 TOP 진입 차단

**로직:**
```typescript
if (elementScore < elementThreshold) {
  return Math.min(score, 79.9);
}
```

**예시:**
- 균형형: 오행 < 60 → 최대 79.9점
- 의미형: 오행 < 50 → 최대 79.9점
- 하이브리드: 오행 < 55 → 최대 79.9점

### 2. Meaning Cap (상한선)
**목적:** 의미 가점이 과도하게 점수를 올리는 것 방지

**구현 위치:** MeaningScorer (향후 구현 예정)

**예시:**
- 균형형: 의미 가점 최대 +12점
- 의미형: 의미 가점 최대 +15점
- 하이브리드: 의미 가점 최대 +13점

## 🔄 다음 단계 (사용자 요청 기반)

### Phase 1: UI 구현 (미완성)
- [ ] Mode 선택 UI (균형형/의미형/하이브리드 탭)
- [ ] Slider UI (오행 ↔ 의미, 0-100 범위)
- [ ] Mode별 결과 탭 (3가지 모드 비교)
- [ ] 점수 시각화 (오행 게이지, 의미 게이지)
- [ ] 설명 배지 (오행✔ / 의미✔ / 언어✔ / 금기필터✔)

### Phase 2: API 통합 (미완성)
- [ ] API에서 scoringMode 파라미터 받기
- [ ] Mode별 결과 반환
- [ ] 프리미엄 사용자만 mode 선택 가능하도록 제한

### Phase 3: MeaningScorer 업데이트 (미완성)
- [ ] meaningCap 적용 로직 추가
- [ ] 부모 가치 매칭 점수 계산 강화
- [ ] Mode별 의미 가중치 반영

## 📝 사용법

### Backend (점수 계산 시)
```typescript
import { ScoringPipeline } from './scoring-pipeline';

const context: ScoringContext = {
  sajuResult,
  lastName,
  lastNameStrokes,
  scoringMode: 'hybrid', // 'balance' | 'meaning' | 'hybrid'
};

const pipeline = new ScoringPipeline();
const scoredCandidates = await pipeline.scoreAll(candidates, context);
```

### 기본값
- scoringMode가 없으면 **'hybrid'** 사용 (권장 기본값)

## 🎨 설계 원칙

1. **사용자 선택권 존중**
   - 전통(균형형) vs 현대(의미형) 선택 가능
   - 하이브리드로 자동 밸런스도 가능

2. **안전장치 내장**
   - 오행 부족 이름 TOP 진입 차단
   - 의미 가점 과도한 영향 방지

3. **동적 최적화**
   - Hybrid 모드는 상황에 따라 자동 조정
   - 오행 부족 시 오행 가중 ↑, 충분하면 의미 가중 ↑

4. **확장 가능성**
   - 새로운 모드 추가 용이
   - Slider UI로 미세 조정 가능 (향후)

## 🔗 연관 문서

- [Phonetic Naturalness System](./PHONETIC-NATURALNESS.md)
- [Enhanced Tie-breaker System](./TIE-BREAKER-ENHANCEMENT.md)
- [Meaning-based Filtering](./MEANING-BASED-FILTERING.md)

## ✅ 완료 상태

- [x] 타입 정의 (scoring-mode.ts)
- [x] ScoringContext 확장
- [x] ScoringPipeline 업데이트
- [x] Safety threshold 구현
- [x] Hybrid 동적 가중치
- [x] 테스트 스크립트
- [x] 모든 테스트 통과
- [ ] UI 구현
- [ ] API 통합
- [ ] MeaningScorer 업데이트

---

**구현 날짜:** 2025-11-04
**참조 이슈:** 사용자 요청 - "점수 계산 핵심은 '오행 균형(사주 적합)'과 '부모 가치(의미 취향)'를 동시에 만족시키되, 가중치의 주도권을 누가 쥐느냐를 사용자가 선택할 수 있게 하는 겁니다"
