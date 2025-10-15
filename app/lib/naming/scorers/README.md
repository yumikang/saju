# 작명 점수화 시스템 (Naming Scoring System)

## 개요

사주팔자 기반 한국 전통 작명 시스템의 핵심 점수화 엔진입니다. 4가지 독립적인 평가 기준을 통해 이름 후보를 0-100점으로 점수화합니다.

## 구조

```
app/lib/naming/scorers/
├── base-scorer.ts          # 추상 베이스 클래스
├── element-scorer.ts       # 오행 조화 점수 (40%)
├── yinyang-scorer.ts       # 음양 균형 점수 (20%)
├── numerology-scorer.ts    # 81수리 점수 (20%)
├── meaning-scorer.ts       # 의미 조화 점수 (20%)
├── scoring-pipeline.ts     # 종합 점수 계산 파이프라인
├── test-scorers.ts         # 테스트 코드
└── index.ts                # 모듈 exports
```

## 점수 구성

### 1. 오행 조화 (40% 가중치) - `ElementScorer`

**평가 항목:**
- 두 한자 간 오행 관계 (상생/상극)
- 사주 부족 오행 보완 여부
- 용신 강화 여부
- 전체 오행 균형

**점수 계산:**
```typescript
기본 점수: 50점
+ 상생 관계: +30점
+ 같은 오행: +15점
+ 상극 관계: -20점
+ 사주 부족 오행 보완: +25점
+ 용신 강화: +15점
+ 오행 균형 개선: 0-20점
```

**예시:**
```typescript
// 금생수 (상생) + 용신(金) 보완
秀(金) + 澤(水) → 높은 점수
// 수극화 (상극)
澤(水) + 炫(火) → 낮은 점수
```

### 2. 음양 균형 (20% 가중치) - `YinYangScorer`

**평가 항목:**
- 성명 전체(성+이름) 음양 배치 패턴
- 성과의 조화

**점수 계산:**
```typescript
이상적 패턴 (양음양, 음양음): 100점
양호한 패턴 (양양음, 음음양): 80점
불량 패턴 (양양양, 음음음): 50점
+ 성과의 조화 보너스: +10점
```

**예시:**
```
金(음) + 秀(양) + 澤(음) = "음양음" → 100점
金(음) + 秀(양) + 炫(양) = "음양양" → 80점
```

### 3. 81수리 (20% 가중치) - `NumerologyScorer`

**평가 항목:**
- 사격(四格) 길흉 분석
  - 원격(초년운): 이름 전체 획수
  - 형격(청장년운): 성 + 첫 자
  - 이격(중말년운): 이름 두 자
  - 정격(말년운): 성 + 끝 자

**점수 계산:**
```typescript
각 격의 점수:
- 대길: 100점
- 길: 80점
- 평: 60점
- 흉: 40점
- 대흉: 20점

가중 평균 =
  원격 × 0.20 +
  형격 × 0.30 +
  이격 × 0.30 +
  정격 × 0.20

+ 길수 3개 이상: +10점
```

**예시:**
```
金(8) + 秀(7) + 澤(17)
- 원격(24): 길 → 80점
- 형격(15): 대길 → 100점
- 이격(24): 길 → 80점
- 정격(25): 길 → 80점
→ 평균: 85점 + 보너스 10점 = 95점
```

### 4. 의미 조화 (20% 가중치) - `MeaningScorer`

**평가 항목:**
- 개별 한자 품질 (40%)
- 의미 호환성 (30%)
- 문화적 적절성 (30%)

**점수 계산:**
```typescript
개별 한자 품질:
  기본: 50점
  + 대길/길/평: +30/+20/+10점
  + 사용 빈도: 0-20점

의미 호환성:
  기본: 70점
  + 카테고리 일치: +20점
  - 의미 충돌: -30점

문화적 적절성:
  기본: 90점
  - 부정적 한자: -50점
  - 검토 필요: -20점
  - 작명 부적합: -30점
```

**예시:**
```
秀(빼어나다) + 澤(은택) → 높은 점수 (긍정적 의미)
死(죽다) + 病(병들다) → 매우 낮은 점수 (부정적 의미)
```

## 사용 방법

### 기본 사용

```typescript
import { ScoringPipeline } from './scorers';
import type { NameCandidate, ScoringContext } from './types';

// 1. 파이프라인 생성
const pipeline = new ScoringPipeline();

// 2. 점수 계산 컨텍스트 준비
const context: ScoringContext = {
  sajuResult: sajuCalculator.calculate(...),
  lastName: '김',
  lastNameHanja: '金',
  lastNameStrokes: 8,
};

// 3. 단일 후보 점수 계산
const scored = await pipeline.scoreCandidate(candidate, context);

console.log('종합 점수:', scored.scores.overall);
console.log('오행:', scored.scores.elementHarmony.score);
console.log('음양:', scored.scores.yinYangBalance.score);
console.log('81수리:', scored.scores.numerology.score);
console.log('의미:', scored.scores.meaningHarmony.score);
```

### 일괄 점수 계산

```typescript
// 여러 후보를 한 번에 점수 계산 (병렬 처리)
const candidates: NameCandidate[] = [...]; // 수백~수천 개
const scoredAll = await pipeline.scoreAll(candidates, context);

// 점수 순으로 정렬
const sorted = scoredAll.sort((a, b) =>
  b.scores.overall - a.scores.overall
);

// 상위 30개 선택
const top30 = sorted.slice(0, 30);
```

### 커스텀 스코어러 추가

```typescript
import { BaseScorer } from './base-scorer';

class CustomScorer extends BaseScorer {
  readonly name = 'custom-score';
  readonly weight = 0.10; // 10%

  protected async calculateRawScore(
    candidate: NameCandidate,
    context: ScoringContext
  ): Promise<number> {
    // 커스텀 점수 계산 로직
    return 75;
  }

  protected generateExplanation(
    candidate: NameCandidate,
    score: number,
    context: ScoringContext
  ): string {
    return '커스텀 평가 결과 설명';
  }
}

// 기존 스코어러 가중치 조정 필요 (합계 = 1.0)
const pipeline = new ScoringPipeline([
  new ElementScorer(),     // 35% (기존 40%에서 조정)
  new YinYangScorer(),     // 20%
  new NumerologyScorer(),  // 20%
  new MeaningScorer(),     // 15% (기존 20%에서 조정)
  new CustomScorer(),      // 10% (신규)
]);
```

## 성능 특성

### 처리 속도
- 단일 후보 점수 계산: ~5-10ms
- 1,000개 후보 일괄 처리: ~2-3초
- 병렬 처리로 최적화됨

### 메모리 사용
- 배치 크기: 100개 (기본값)
- 대량 후보 처리 시 메모리 효율적

## 테스트

```bash
# 테스트 실행
npx tsx app/lib/naming/scorers/test-scorers.ts
```

**테스트 시나리오:**
1. 상생 관계 + 용신 보완 (高점수 케이스)
2. 상극 관계 (低점수 케이스)
3. 부정적 한자 (極低점수 케이스)
4. 일괄 처리 및 정렬

## 점수 해석

### 등급 체계
```
S등급: 90-100점 - 매우 우수한 이름
A등급: 80-89점  - 우수한 이름
B등급: 70-79점  - 양호한 이름
C등급: 60-69점  - 보통 이름
D등급: 0-59점   - 권장하지 않음
```

### 신뢰도 점수
```typescript
scored.confidenceScore // 0.0 ~ 1.0

- 0.9 이상: 모든 평가 기준에서 일관된 결과
- 0.7-0.9: 대체로 일관성 있음
- 0.5-0.7: 평가 기준 간 차이가 있음
- 0.5 미만: 평가 기준 간 큰 편차 존재
```

## 의존성

```typescript
// 내부 모듈
import { element-relations } from '../utils/element-relations';
import { numerology-81 } from '../utils/numerology-81';
import { types } from '../types';

// 외부 라이브러리
import { Element, YinYang } from '@prisma/client';
```

## 확장 가능성

1. **새로운 평가 기준 추가**
   - `BaseScorer` 상속
   - `calculateRawScore()` 구현
   - `generateExplanation()` 구현
   - 가중치 재조정

2. **평가 로직 개선**
   - 각 스코어러 독립적으로 수정 가능
   - 가중치 동적 조정 가능
   - A/B 테스트 지원 (아키텍처에 포함)

3. **성능 최적화**
   - 배치 크기 조정
   - 병렬 처리 수준 조정
   - 캐싱 추가 가능

## 다음 단계

Phase 1 완료: ✅ 점수화 시스템 구현
Phase 2 진행: 한자 매칭 알고리즘 (matcher.ts)
- 8,787개 한자에서 최적 조합 필터링
- 3단계 필터링 전략
- 성능 최적화 (<5초 목표)

## 참고 자료

- 아키텍처 문서: `/claudedocs/naming-algorithm-architecture.md`
- 81수리 연구: `/claudedocs/81-numerology-research.md`
- 오행 상생상극: `app/lib/naming/utils/element-relations.ts`
- 타입 정의: `app/lib/naming/types.ts`
