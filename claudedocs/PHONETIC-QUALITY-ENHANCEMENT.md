# Phonetic Quality Enhancement (발음 품질 강화)

## 📋 개요

발음 자연스러움 + tie-breaker 강화를 통한 이름 생성 품질 대폭 개선

**핵심 개선사항:**
1. ✅ 음절 화이트리스트 (태/채/해/솔 등 자연스러운 음절 패널티 제외)
2. ✅ 빅램 보너스 시스템 (서연/민준/지우 등 실제 자주 쓰이는 조합 +3~5점)
3. ✅ 낯선 빅램 패널티 (도호/호도 등 낯선 조합 -30점)
4. ✅ 반복 음절 완전 차단 (서서/준준 → 0점)
5. ✅ 타이브레이커 정렬 함수 (동점 시 5단계 정렬)

## 🎯 문제 해결

### 문제 1: 화이트리스트 없어서 자연스러운 이름도 감점
**증상:** "태린", "채원", "해인" 같은 자연스러운 이름이 낮은 점수

**원인:** 빈도 데이터가 없는 음절은 패널티

**해결:**
- 화이트리스트 97개 음절 정의 (`syllable-whitelist.json`)
- 화이트리스트 음절은 무조건 100점 처리
- **결과:** 태린/채원/해인 모두 95+ 점수

### 문제 2: 빅램 보너스 없어서 실제 인기 이름 순위 낮음
**증상:** "서연", "민준", "지우" 같은 인기 이름이 상대적으로 낮은 순위

**원인:** 개별 음절 빈도만 보고 조합 빈도 미반영

**해결:**
- 빅램 시드 데이터 50개 조합 (`bigram-seed.json`)
- 가중치 1-5 범위 (서연/서윤/민준/지우/도윤 → +5점)
- **결과:** 인기 이름들 100점 획득

### 문제 3: 낯선 조합이 높은 점수
**증상:** "도호", "호도" 같은 낯선 조합이 95점

**원인:** 개별 음절은 흔하지만 조합이 낯설 경우 감지 못함

**해결:**
- 낯선 빅램 패널티 데이터 (`awkward-bigrams.json`)
- 도호/호도 → -30점 패널티
- **결과:** 도호/호도 65점으로 하락

### 문제 4: 반복 음절 차단 안됨
**증상:** "서서", "준준" 같은 반복 이름이 95점

**원인:** 발음 자연스러움 함수에서 반복 체크 누락

**해결:**
- `scorePhoneticNaturalness()`에 반복 체크 추가
- 반복 감지 시 무조건 0점
- **결과:** 서서/준준 0점

### 문제 5: 동점 이름들 순위 랜덤
**증상:** 89.0점 이름들이 매번 다른 순서로 표시

**원인:** 정렬 로직 부재

**해결:**
- 5단계 tie-breaker 정렬 함수 구현
- 정렬 순서: totalScore → nameFreq → usageFreq → strokes → stableId
- **결과:** 동점이어도 항상 동일한 순서

## 🔧 구현 파일

### 1. Data Files (NEW)

**`/app/lib/naming/data/syllable-whitelist.json`**
```json
{
  "syllables": [
    "가", "강", "건", "결", "경", ..., "태", "채", "해", "솔", "율", "원", "빈", ...
  ]
}
```
- 97개 자연스러운 음절
- 화이트리스트 음절은 패널티 미적용

**`/app/lib/naming/data/bigram-seed.json`**
```json
{
  "bigrams": [
    { "pair": ["서", "연"], "weight": 5 },
    { "pair": ["민", "준"], "weight": 5 },
    { "pair": ["지", "우"], "weight": 5 },
    ...
  ]
}
```
- 50개 인기 조합
- 가중치 1-5 (5가 가장 인기)

**`/app/lib/naming/data/awkward-bigrams.json`**
```json
{
  "awkwardPairs": [
    { "pair": ["도", "호"], "penalty": -30 },
    { "pair": ["호", "도"], "penalty": -30 },
    ...
  ]
}
```
- 낯선 조합 패널티

### 2. Core Logic Updates

**`/app/lib/naming/utils/phonetic-naturalness.ts`** (MODIFIED)

주요 변경사항:
```typescript
// 1. Data imports
import syllableWhitelistData from '../data/syllable-whitelist.json';
import bigramSeedData from '../data/bigram-seed.json';
import awkwardBigramsData from '../data/awkward-bigrams.json';

// 2. Whitelist check in scoreSyllableNaturalness()
if (SYLLABLE_WHITELIST.has(syllable)) {
  return 100; // 패널티 미적용
}

// 3. Repetition check in scorePhoneticNaturalness()
if (syll1 === syll2) {
  return 0; // 반복 완전 차단
}

// 4. Awkward bigram penalty
const awkwardPenalty = AWKWARD_BIGRAM_MAP.get(bigramKey) || 0;
combinationScore += awkwardPenalty;

// 5. Bigram bonus
const bigramBonus = BIGRAM_BONUS_MAP.get(bigramKey) || 0;
combinationScore += bigramBonus;
```

### 3. Tie-breaker System (NEW)

**`/app/lib/naming/utils/tie-breaker.ts`**
```typescript
export function tieBreakSort<T extends TieBreakable>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    // 1) totalScore desc
    // 2) nameFrequency desc
    // 3) usageFrequency desc
    // 4) strokeCount asc (shorter first)
    // 5) stableId asc (deterministic)
  });
}
```

정렬 우선순위:
1. **점수 높은 순** (totalScore desc)
2. **이름 빈도 높은 순** (nameFrequency desc)
3. **사용 빈도 높은 순** (usageFrequency desc)
4. **획수 짧은 순** (strokeCount asc)
5. **ID 순** (stableId asc, 결정론적)

### 4. Tests

**`/app/lib/naming/__tests__/tie-breaker.test.ts`**
- 9개 테스트 케이스
- ✅ 모두 통과

**`/scripts/test-phonetic-quality.ts`**
- 회귀 테스트 스크립트
- 3가지 테스트 카테고리:
  1. 낯선 조합 (< 70점)
  2. 자연 조합 (>= 85점)
  3. 화이트리스트 (>= 80점)
- ✅ 모든 테스트 통과

## 📊 테스트 결과

### Test 1: 낯선 조합 (하위 점수 기대)
```
이름   | 점수  | 결과
서서   | 0.0   | ✅ (반복)
준준   | 0.0   | ✅ (반복)
도호   | 65.0  | ✅ (낯선 빅램 패널티)
호도   | 65.0  | ✅ (낯선 빅램 패널티)
쇄란   | 45.0  | ✅ (드문 음절)
쉐윤   | 45.0  | ✅ (드문 음절)
뫼린   | 45.0  | ✅ (드문 음절)
```

### Test 2: 자연스러운 조합 (높은 점수 기대)
```
이름   | 점수   | 빅램 | 결과
지우   | 100.0  | +5   | ✅
서연   | 100.0  | +5   | ✅
민준   | 100.0  | +5   | ✅
하린   | 99.0   | +4   | ✅
서윤   | 100.0  | +5   | ✅
연우   | 99.0   | +4   | ✅
태이   | 98.0   | +3   | ✅
하윤   | 100.0  | +5   | ✅
지안   | 99.0   | +4   | ✅
채원   | 99.0   | +4   | ✅
```

### Test 3: 화이트리스트 음절 (패널티 미적용)
```
이름   | 점수  | 결과
태린   | 95.0  | ✅
채윤   | 98.0  | ✅ (빅램 +3)
해인   | 95.0  | ✅
소윤   | 95.0  | ✅
라온   | 98.0  | ✅ (빅램 +3)
나연   | 98.0  | ✅ (빅램 +3)
지율   | 98.0  | ✅ (빅램 +3)
하원   | 95.0  | ✅
빈서   | 95.0  | ✅
솔아   | 95.0  | ✅
```

### Summary
```
✅ 낯선 조합 하위권: 7/7 (100%)
✅ 자연 조합 상위권: 10/10 (100%)
✅ 화이트리스트 통과: 10/10 (100%)

🎉 All Tests PASSED!
```

## 🎨 점수 계산 로직

### 발음 자연스러움 (Phonetic Naturalness)

**Base Score:** 70점 (기본)

**수정 요소:**
```typescript
// 1. 반복 음절: 0점 (완전 차단)
if (syll1 === syll2) return 0;

// 2. 개별 음절 자연스러움
- 화이트리스트: 100점
- 매우 흔한 음절: 100점
- 드문 음절: 20점
- 기본: 60점

// 3. 조합 자연스러움
- 낯선 빅램: -30점
- 인기 빅램: +1~5점
- 둘 다 흔한 음절: +10점
```

**최종 점수 범위:** 0-100점

### LinguisticScorer 가중치

발음 자연스러움은 LinguisticScorer의 50%를 차지:
```
LinguisticScorer (30% weight):
  - 발음 자연스러움: 50%
  - 음절 반복: 30%
  - 의미 유사도: 20%
```

## 🔄 영향 분석

### Before (문제 상황)
```
도호: 95점 (너무 높음)
서서: 95점 (반복인데 높음)
태린: 60점 (자연스러운데 낮음)
```

### After (개선 후)
```
도호: 65점 → 낯선 조합으로 하락 ✅
서서: 0점 → 반복 차단 ✅
태린: 95점 → 화이트리스트 적용 ✅
```

### 상대적 순위 변화
```
Top 20 예상:
1. 서연, 민준, 지우 (100점, 빅램 +5)
2. 하린, 연우, 윤호 (99점, 빅램 +4)
3. 태린, 채원, 해인 (95-98점, 화이트리스트)
...
50위권 밖: 도호, 호도 (65점, 낯선 빅램 패널티)
제외: 서서, 준준 (0점, 반복 차단)
```

## 📚 운영 가이드

### 화이트리스트 관리
**추가 기준:**
- 실제 이름에서 자주 쓰이는 음절
- 발음이 자연스러운 음절
- 빈도 데이터가 없어도 패널티 주면 안되는 음절

**파일:** `/app/lib/naming/data/syllable-whitelist.json`

### 빅램 보너스 관리
**추가 기준:**
- 2020-2024 출생 TOP 100 이름 참고
- 실제 이름으로 자주 쓰이는 조합
- 가중치: 1(가끔) ~ 5(매우 자주)

**파일:** `/app/lib/naming/data/bigram-seed.json`

### 낯선 빅램 패널티 관리
**추가 기준:**
- 개별 음절은 흔하지만 조합이 낯선 케이스
- 실제 이름에서 거의 쓰이지 않는 조합
- 패널티: -20 (약간 낯섦) ~ -30 (매우 낯섦)

**파일:** `/app/lib/naming/data/awkward-bigrams.json`

## 🔗 연관 문서

- [Scoring Mode Implementation](./SCORING-MODE-IMPLEMENTATION.md) - 3-Mode 점수 시스템
- [Meaning-based Filtering](./MEANING-BASED-FILTERING.md) - 의미 기반 필터링
- [Tie-breaker Enhancement](./TIE-BREAKER-ENHANCEMENT.md) - 타이브레이커 시스템

## ✅ 완료 상태

- [x] 음절 화이트리스트 구현
- [x] 빅램 보너스 시스템
- [x] 낯선 빅램 패널티
- [x] 반복 음절 차단
- [x] 타이브레이커 정렬 함수
- [x] 유닛 테스트 (9개 테스트 통과)
- [x] 회귀 테스트 (27개 케이스 통과)
- [x] 문서화

---

**구현 날짜:** 2025-11-04
**테스트 결과:** ✅ All Tests PASSED (27/27)
**품질 개선:** 낯선 조합 차단, 인기 이름 상위권, 반복 이름 제거
