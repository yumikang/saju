# 성별 감성 필터링 시스템 (Gender Sensitivity Filtering)

## 📋 개요

성별에 부적합한 한자를 감지하고 필터링하는 시스템

**핵심 목표:**
1. 여아 이름에 남성적 한자 사용 방지
2. 남아 이름에 여성적 한자 사용 방지
3. 성별 감성 충돌 시 점수 조정 또는 완전 차단

**결과:**
- ✅ 14/14 테스트 통과
- ✅ 3단계 심각도 분류 (high/medium/low)
- ✅ 점수 조정 시스템 (-20 ~ -100점)

## 🎯 문제 해결

### 문제: 성별 감성 충돌하는 이름이 상위권 등장
**증상:**
- 여아: "준희", "민준", "서호" 같은 남성적 이름이 TOP20에 등장
- 남아: "서연", "지아", "서유" 같은 여성적 이름이 TOP20에 등장

**원인:**
- 개별 음절 빈도만 보고 성별 감성을 체크하지 않음
- 한자의 의미적 성별 감성 미반영

**해결:**
1. 성별 감성 한자 데이터베이스 구축
2. 3단계 심각도 분류 (high/medium/low)
3. 필터링 및 점수 조정 시스템
4. 14개 테스트 케이스 검증

## 🔧 구현 파일

### 1. `/app/lib/naming/data/gender-sensitive-hanja.json` (NEW)

**구조:**
```json
{
  "masculine": {
    "hanja": [
      { "char": "俊", "reading": "준", "reason": "뛰어날 준 - 강한 남성성" },
      { "char": "豪", "reading": "호", "reason": "호걸 호 - 강한 남성성" },
      ...
    ]
  },
  "feminine": {
    "hanja": [
      { "char": "雅", "reading": "아", "reason": "우아할 아 - 강한 여성성" },
      { "char": "婉", "reading": "완", "reason": "곱을 완 - 강한 여성성" },
      ...
    ]
  },
  "severity": {
    "high": {
      "masculine": ["雄", "剛", "雷"],
      "feminine": ["婉", "姸", "姬", "嬪"]
    },
    "medium": {
      "masculine": ["俊", "豪", "皓", "碩"],
      "feminine": ["雅", "柔", "淑", "娥"]
    },
    "low": {
      "masculine": ["玄", "煥", "赫"],
      "feminine": ["嬉", "嫻"]
    }
  }
}
```

**데이터 규모:**
- 남성적 한자: 10개
- 여성적 한자: 10개
- 총 20개 한자

### 2. `/app/lib/naming/utils/gender-sensitivity-filter.ts` (NEW)

**핵심 함수:**

#### `evaluateGenderSensitivity()`
성별 감성 적합성 평가 (이슈 상세 분석)

```typescript
export function evaluateGenderSensitivity(
  nameHanja: string[],
  gender: Gender
): GenderSensitivityResult {
  // NEUTRAL 성별은 필터링 제외
  if (gender === 'NEUTRAL') {
    return { isAppropriate: true, penalty: 0, issues: [] };
  }

  const issues: GenderSensitivityIssue[] = [];
  let totalPenalty = 0;

  nameHanja.forEach((char) => {
    if (gender === 'FEMALE') {
      // 여아: 남성적 한자 체크
      const masculineInfo = MASCULINE_HANJA_MAP.get(char);
      if (masculineInfo) {
        issues.push({ ...masculineInfo, char });
        totalPenalty += SEVERITY_PENALTY[masculineInfo.severity];
      }
    } else if (gender === 'MALE') {
      // 남아: 여성적 한자 체크
      const feminineInfo = FEMININE_HANJA_MAP.get(char);
      if (feminineInfo) {
        issues.push({ ...feminineInfo, char });
        totalPenalty += SEVERITY_PENALTY[feminineInfo.severity];
      }
    }
  });

  // 이슈가 하나라도 있으면 부적합
  const isAppropriate = issues.length === 0;

  return { isAppropriate, penalty: totalPenalty, issues };
}
```

#### `adjustScoreForGenderSensitivity()`
점수 조정 (패널티 적용)

```typescript
export function adjustScoreForGenderSensitivity(
  baseScore: number,
  nameHanja: string[],
  gender: Gender
): number {
  const result = evaluateGenderSensitivity(nameHanja, gender);

  if (result.penalty === -100) {
    return 0; // high severity → 완전 차단
  }

  const adjustedScore = baseScore + result.penalty;
  return Math.max(0, Math.min(100, adjustedScore));
}
```

#### `passesGenderSensitivityFilter()`
필터링 (통과/차단 판정)

```typescript
export function passesGenderSensitivityFilter(
  nameHanja: string[],
  gender: Gender
): boolean {
  const result = evaluateGenderSensitivity(nameHanja, gender);
  return result.isAppropriate;
}
```

### 3. `/scripts/test-gender-sensitivity.ts` (NEW)

**테스트 케이스:** 14개

**카테고리:**
1. ✅ 여아 적합 (2개)
2. ❌ 여아 부적합 (5개)
3. ✅ 남아 적합 (2개)
4. ❌ 남아 부적합 (4개)
5. ✅ 중성 (1개)

**테스트 결과:** ✅ 14/14 통과

## 📊 패널티 시스템

### 심각도 → 패널티 매핑

| 심각도 | 패널티 | 의미 | 예시 |
|--------|--------|------|------|
| **high** | -100점 | 완전 차단 | 여아: 雄(웅), 남아: 婉(완), 姸(연) |
| **medium** | -40점 | 강한 감점 | 여아: 俊(준), 豪(호), 남아: 雅(아), 柔(유) |
| **low** | -20점 | 약한 감점 | 여아: 玄(현), 남아: 嬉(희) |

### 점수 조정 예시

**여아 이름 "준희" (俊熙):**
```
기본 점수: 90점
한자: 俊 (medium severity, -40점)
조정 점수: 90 - 40 = 50점
```

**여아 이름 "서웅" (瑞雄):**
```
기본 점수: 90점
한자: 雄 (high severity, -100점)
조정 점수: 0점 (완전 차단)
```

**남아 이름 "서연" (瑞姸):**
```
기본 점수: 90점
한자: 姸 (high severity, -100점)
조정 점수: 0점 (완전 차단)
```

## 🧪 테스트 결과

### 케이스 1: 여아 적합 (여성적 한자)
```
이름: 서연 (瑞姸) | 성별: FEMALE
결과: ✅ 적합 (패널티 0점)
이유: 姸는 여성적 한자지만 여아이므로 OK
```

### 케이스 2: 여아 부적합 (남성적 한자)
```
이름: 준희 (俊熙) | 성별: FEMALE
결과: ❌ 부적합 (패널티 -40점)
이슈: ⚠️ 俊 (준): 뛰어날 준 - 강한 남성성 [medium]
점수: 90점 → 50점
```

### 케이스 3: 여아 완전 차단
```
이름: 서웅 (瑞雄) | 성별: FEMALE
결과: ❌ 부적합 (패널티 -100점)
이슈: 🚨 雄 (웅): 수컷 웅 - 명시적 남성성 [high]
점수: 90점 → 0점
```

### 케이스 4: 남아 적합 (남성적 한자)
```
이름: 민준 (敏俊) | 성별: MALE
결과: ✅ 적합 (패널티 0점)
이유: 俊은 남성적 한자지만 남아이므로 OK
```

### 케이스 5: 남아 부적합 (여성적 한자)
```
이름: 지아 (智雅) | 성별: MALE
결과: ❌ 부적합 (패널티 -40점)
이슈: ⚠️ 雅 (아): 우아할 아 - 강한 여성성 [medium]
점수: 90점 → 50점
```

### 케이스 6: 남아 완전 차단
```
이름: 민완 (敏婉) | 성별: MALE
결과: ❌ 부적합 (패널티 -100점)
이슈: 🚨 婉 (완): 곱을 완 - 강한 여성성 [high]
점수: 90점 → 0점
```

### 케이스 7: NEUTRAL 성별 (필터링 제외)
```
이름: 준희 (俊熙) | 성별: NEUTRAL
결과: ✅ 적합 (패널티 0점)
이유: NEUTRAL은 필터링 제외
```

## 📋 최종 요약

```
✅ 통과: 14/14
❌ 실패: 0/14

🎉 All Tests PASSED!
```

## 🎨 사용 예시

### 예시 1: 이름 생성 시 필터링
```typescript
import { passesGenderSensitivityFilter } from '@/lib/naming/utils/gender-sensitivity-filter';

const candidates = await generateNames(context);

const filtered = candidates.filter((name) => {
  const passes = passesGenderSensitivityFilter(
    name.hanja,
    context.preferences.gender
  );
  return passes;
});
```

### 예시 2: 점수 조정
```typescript
import { adjustScoreForGenderSensitivity } from '@/lib/naming/utils/gender-sensitivity-filter';

const baseScore = calculateBaseScore(name);
const adjustedScore = adjustScoreForGenderSensitivity(
  baseScore,
  name.hanja,
  gender
);
```

### 예시 3: 상세 평가 (디버깅)
```typescript
import { evaluateGenderSensitivity } from '@/lib/naming/utils/gender-sensitivity-filter';

const result = evaluateGenderSensitivity(['俊', '熙'], 'FEMALE');

console.log(result.isAppropriate); // false
console.log(result.penalty); // -40
console.log(result.issues);
// [{ char: '俊', reading: '준', reason: '뛰어날 준 - 강한 남성성', severity: 'medium' }]
```

## 🔄 통합 가이드

### LinguisticScorer 통합
```typescript
// app/lib/naming/scorers/linguistic-scorer.ts

import { adjustScoreForGenderSensitivity } from '../utils/gender-sensitivity-filter';

export class LinguisticScorer implements NameScorer {
  async score(candidate: NameCandidate, context: ScoringContext): Promise<NameScore> {
    // 기본 점수 계산
    let totalScore = calculateLinguisticScore(candidate);

    // 성별 감성 조정 (필요 시)
    if (context.preferences?.gender) {
      totalScore = adjustScoreForGenderSensitivity(
        totalScore,
        candidate.hanja,
        context.preferences.gender
      );
    }

    return { totalScore, breakdown: { ... } };
  }
}
```

### 이름 생성 파이프라인 통합
```typescript
// app/lib/naming/pipeline/name-generation-pipeline.ts

import { passesGenderSensitivityFilter } from '../utils/gender-sensitivity-filter';

async function generateNames(context: ScoringContext) {
  // 1. 한자 조합 생성
  const combinations = await generateHanjaCombinations(context);

  // 2. 성별 감성 필터링
  const genderFiltered = combinations.filter((combo) => {
    if (!context.preferences?.gender) return true;
    return passesGenderSensitivityFilter(
      combo.hanja,
      context.preferences.gender
    );
  });

  // 3. 점수 계산 및 정렬
  const scored = await scoreNames(genderFiltered, context);

  return scored;
}
```

## 📚 연관 문서

- [Phonetic Quality Enhancement](./PHONETIC-QUALITY-ENHANCEMENT.md) - 발음 품질 강화
- [Meaning-based Filtering](./MEANING-BASED-FILTERING.md) - 의미 기반 필터링
- [Scoring Mode Implementation](./SCORING-MODE-IMPLEMENTATION.md) - 3-Mode 점수 시스템

## ✅ 완료 상태

- [x] 성별 감성 한자 데이터 구축 (20개 한자)
- [x] 필터링 로직 구현 (3단계 심각도)
- [x] 점수 조정 시스템 (-20 ~ -100점)
- [x] 테스트 스크립트 작성
- [x] 회귀 테스트 (14/14 통과)
- [x] 문서화
- [ ] LinguisticScorer 통합
- [ ] API 통합
- [ ] UI 통합

---

**구현 날짜:** 2025-11-04
**테스트 결과:** ✅ 14/14 테스트 통과
**핵심 가치:** "성별에 맞는 이름으로 자연스러움 향상"
