# Week 2-3 Future Tasks

**Date**: 2025-10-31
**Status**: 📋 **PLANNED**
**Priority**: Medium (Quality Improvements)

---

## Overview

Week 1에서 **"DB가 사람처럼 말하게 되는 상태"**까지 달성했습니다:
- ✅ 9,000자 → 2,748자 usable (31.3%)
- ✅ 1,697자에 성별 라벨 (61.7% coverage)
- ✅ 5축 필터링이 "때려맞추기"에서 "다듬기"로 전환

이제 Week 2-3는 **품질 향상과 모니터링** 중심으로 진행합니다.

---

## Task 1: 의도치 않은 오염 감시 시스템

### 목적
대규모로 1,414건을 자동 태깅했으므로, 주기적으로 이상치를 감시하는 쿼리가 필요합니다.

### 구현 내용

**scripts/monitor-gender-pollution.ts**
```typescript
// 남성 느낌인데 female로 분류된 케이스 찾기
const suspiciousFemale = await prisma.hanjaDict.findMany({
  where: {
    genderHint: 'female',
    OR: [
      { meaning: { contains: '굳셀' } },
      { meaning: { contains: '씩씩할' } },
      { meaning: { contains: '강할' } },
      { meaning: { contains: '웅장할' } },
      { meaning: { contains: '빼어날' } },
      { meaning: { contains: '호걸' } },
    ],
  },
});

// 여성 느낌인데 male로 분류된 케이스 찾기
const suspiciousMale = await prisma.hanjaDict.findMany({
  where: {
    genderHint: 'male',
    OR: [
      { meaning: { contains: '고울' } },
      { meaning: { contains: '아름다울' } },
      { meaning: { contains: '예쁠' } },
      { meaning: { contains: '꽃' } },
      { meaning: { contains: '향기' } },
    ],
  },
});
```

### 실행 주기
- **초기**: 주 1회 (Week 2-4)
- **안정화 후**: 월 1회

### 예상 발견 사항
- Phase 2에서 패턴 매칭으로 인한 오분류 5-10건
- 완전 정상적인 현상이며, 수동으로 조정하면 됨

---

## Task 2: 성별 힌트 로그 분석 대시보드

### 목적
여러 변경 로그를 합쳐서 전체 시스템의 성별 분포와 패턴을 시각화합니다.

### 구현 내용

**scripts/analyze-gender-hint-logs.ts**
```typescript
/**
 * Gender Hint Logs Analysis Dashboard
 *
 * 분석 항목:
 * 1. 각 Phase별 기여도
 * 2. 음절별 성별 분포 (준/현/우/서/윤 등)
 * 3. 한자별 최종 gender 통계
 * 4. 시간 경과에 따른 coverage 변화
 */

const logs = [
  'data/logs/gender-expand-phase1-2025-10-31.json',
  'data/logs/gender-expand-phase2-2025-10-31.json',
  'data/logs/gender-blacklists-2025-10-31.json',
];

// 로그 합치기
const allChanges = logs.flatMap((path) => {
  const log = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return log.changes;
});

// 음절별 통계
const syllableStats = new Map<string, { male: number; female: number; unisex: number }>();

allChanges.forEach((change) => {
  const syllable = change.koreanReading;
  const stats = syllableStats.get(syllable) || { male: 0, female: 0, unisex: 0 };

  if (change.newGenderHint === 'male') stats.male++;
  else if (change.newGenderHint === 'female') stats.female++;
  else if (change.newGenderHint === 'unisex') stats.unisex++;

  syllableStats.set(syllable, stats);
});

// 대시보드 출력
console.log('📊 Gender Hint Dashboard\n');
console.log('Overall Statistics:');
console.log(`  Total changes: ${allChanges.length}`);
console.log(`  Phase 1: ${phase1.length} (${((phase1.length / allChanges.length) * 100).toFixed(1)}%)`);
console.log(`  Phase 2: ${phase2.length} (${((phase2.length / allChanges.length) * 100).toFixed(1)}%)`);
console.log(`  Blacklists: ${blacklists.length}\n`);

console.log('Top 10 Syllables by Activity:');
syllableStats
  .sort((a, b) => (b.male + b.female + b.unisex) - (a.male + a.female + a.unisex))
  .slice(0, 10)
  .forEach((syllable, stats) => {
    console.log(`  ${syllable}: M:${stats.male} F:${stats.female} U:${stats.unisex}`);
  });
```

### 출력 예시
```
📊 Gender Hint Dashboard

Overall Statistics:
  Total changes: 1,596
  Phase 1: 170 (10.7%)
  Phase 2: 1,414 (88.6%)
  Blacklists: 12 (0.8%)

Gender Distribution:
  Female: 413 (25.9%)
  Male: 654 (41.0%)
  Unisex: 630 (39.5%)

Top 10 Syllables by Activity:
  아: M:1 F:14 U:0
  우: M:17 F:1 U:0
  준: M:15 F:0 U:3
  서: M:2 F:8 U:4
  윤: M:3 F:7 U:2
  ...
```

---

## Task 3: 실전 이름 생성 E2E 테스트

### 목적
실제 이름 생성 파이프라인으로 20-30개 이름을 뽑아서 사람 눈으로 검증합니다.

### 테스트 시나리오

**scripts/test-real-name-generation.ts**
```typescript
/**
 * Real Name Generation E2E Test
 *
 * 목표:
 * - 여아 이름에 남성 한자 없는지
 * - 남아 이름에 여성 한자 없는지
 * - 중성적 이름의 품질
 */

const testCases = [
  // 여아 - FIRE 부족
  {
    birthInfo: { year: 2024, month: 3, day: 15, hour: 14, minute: 30, isLunar: false, gender: 'F' },
    lastName: '김',
    lastNameStrokes: 5,
    expectedGender: 'female',
  },
  // 남아 - WOOD 부족
  {
    birthInfo: { year: 2024, month: 6, day: 20, hour: 10, minute: 15, isLunar: false, gender: 'M' },
    lastName: '이',
    lastNameStrokes: 7,
    expectedGender: 'male',
  },
  // 여아 - WATER 부족
  {
    birthInfo: { year: 2024, month: 9, day: 10, hour: 16, minute: 0, isLunar: false, gender: 'F' },
    lastName: '박',
    lastNameStrokes: 10,
    expectedGender: 'female',
  },
];

for (const testCase of testCases) {
  const results = await pipeline.execute(testCase.birthInfo, testCase.lastName, testCase.lastNameStrokes, {
    maxCandidates: 30,
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Test: ${testCase.lastName}${testCase.expectedGender === 'F' ? '여아' : '남아'}`);
  console.log(`${'='.repeat(50)}\n`);

  results.candidates.slice(0, 30).forEach((candidate, i) => {
    const firstName = candidate.firstName.join('');
    const fullName = testCase.lastName + firstName;
    const hanja = candidate.characters.map((c) => c.character).join('');
    const score = candidate.score;

    // Check for inappropriate gender chars
    const inappropriate = candidate.characters.filter((c) => {
      if (testCase.expectedGender === 'F') {
        return FEMALE_BLACKLIST.includes(c.character);
      } else {
        return MALE_BLACKLIST.includes(c.character);
      }
    });

    const flag = inappropriate.length > 0 ? '❌' : '✅';

    console.log(`${flag} ${i + 1}. ${fullName} (${hanja}) - ${score.toFixed(1)}`);
    if (inappropriate.length > 0) {
      console.log(`   Inappropriate chars: ${inappropriate.map((c) => c.character).join(', ')}`);
    }
  });
}
```

### 검증 기준
- ✅ **Pass**: 30개 이름 중 부적절한 성별 한자 0개
- ⚠️ **Warning**: 30개 중 1-2개 발견 (블랙리스트 추가 필요)
- ❌ **Fail**: 30개 중 3개 이상 발견 (시스템 재검토 필요)

---

## Task 4: 블랙리스트 자동 업데이트 시스템

### 목적
Task 3에서 발견된 부적절한 한자를 블랙리스트에 자동으로 추가합니다.

### 구현 내용

**scripts/update-blacklists-from-findings.ts**
```typescript
/**
 * Update Blacklists from E2E Test Findings
 *
 * 사용법:
 * 1. E2E 테스트 실행
 * 2. 부적절한 한자 발견
 * 3. 이 스크립트로 블랙리스트 업데이트
 */

interface Finding {
  character: string;
  koreanReading: string;
  foundIn: 'female' | 'male';
  reason: string;
}

const findings: Finding[] = [
  { character: '峻', koreanReading: '준', foundIn: 'female', reason: 'Too masculine for girls' },
  // ... 더 추가
];

// config/gender-blacklists.json 업데이트
const config = JSON.parse(fs.readFileSync('config/gender-blacklists.json', 'utf-8'));

findings.forEach((finding) => {
  if (finding.foundIn === 'female' && !config.femaleBlacklist.characters.includes(finding.character)) {
    config.femaleBlacklist.characters.push(finding.character);
    console.log(`✅ Added ${finding.character} to femaleBlacklist`);
  } else if (finding.foundIn === 'male' && !config.maleBlacklist.characters.includes(finding.character)) {
    config.maleBlacklist.characters.push(finding.character);
    console.log(`✅ Added ${finding.character} to maleBlacklist`);
  }
});

// Save updated config
fs.writeFileSync('config/gender-blacklists.json', JSON.stringify(config, null, 2), 'utf-8');

// Re-apply blacklists
execSync('npx tsx scripts/apply-gender-blacklists.ts');
```

---

## Task 5: Threshold 조정 실험

### 목적
현재 70% threshold가 최적인지 실험적으로 검증합니다.

### 실험 설계

```typescript
/**
 * Threshold Sensitivity Analysis
 *
 * 실험:
 * 1. 60%, 70%, 80%, 85% threshold로 각각 분류
 * 2. 각 threshold의 coverage와 precision 측정
 * 3. 최적 threshold 선택
 */

const thresholds = [0.6, 0.7, 0.8, 0.85];

for (const threshold of thresholds) {
  // config/gender-hint-thresholds.json 업데이트
  const config = {
    ...baseConfig,
    thresholds: {
      femaleRatio: threshold,
      maleRatio: 1 - threshold,
      minUsageCount: 3,
    },
  };

  fs.writeFileSync('config/gender-hint-thresholds.json', JSON.stringify(config, null, 2), 'utf-8');

  // Phase 2 재실행 (dry-run)
  const results = await simulatePhase2(config.thresholds);

  console.log(`\nThreshold: ${threshold}`);
  console.log(`  Female: ${results.female}`);
  console.log(`  Male: ${results.male}`);
  console.log(`  Unisex: ${results.unisex}`);
  console.log(`  Coverage: ${((results.total / 2748) * 100).toFixed(1)}%`);

  // E2E 테스트로 precision 측정
  const precision = await testPrecision(results);
  console.log(`  Precision: ${(precision * 100).toFixed(1)}%`);
}
```

### 예상 결과
```
Threshold: 0.6
  Coverage: 68%
  Precision: 92%

Threshold: 0.7 (current)
  Coverage: 61.5%
  Precision: 96%

Threshold: 0.8
  Coverage: 52%
  Precision: 98%

Threshold: 0.85
  Coverage: 45%
  Precision: 99%

→ 결론: 0.7이 coverage와 precision의 최적 균형점
```

---

## Task 6: 한자 변형 필터링

### 목적
koreanReading이 같은 여러 한자 변형 중 nameFrequency가 높은 것만 남깁니다.

### 문제 상황
```
현재: "아" 음절 → 雅/我/兒/哦/猗/誐/亞/丫/亜/俄/... (10개)
문제: 실제로는 雅(아)만 주로 쓰임

개선: "아" 음절 → 雅/我/兒 (상위 3개만)
```

### 구현 내용

**scripts/filter-rare-variants.ts**
```typescript
/**
 * Filter Rare Hanja Variants
 *
 * 전략:
 * - koreanReading이 같은 한자들을 그룹화
 * - nameFrequency 상위 3개만 남김
 * - 나머지는 genderHint → null로 복원
 */

// 음절별 한자 그룹화
const syllableGroups = new Map<string, HanjaDict[]>();

const allHanjas = await prisma.hanjaDict.findMany({
  where: {
    genderHint: { not: null },
    koreanReading: { not: null },
  },
  orderBy: { nameFrequency: 'desc' },
});

allHanjas.forEach((hanja) => {
  const group = syllableGroups.get(hanja.koreanReading!) || [];
  group.push(hanja);
  syllableGroups.set(hanja.koreanReading!, group);
});

// 각 그룹에서 상위 3개만 남김
for (const [syllable, hanjas] of syllableGroups) {
  if (hanjas.length <= 3) continue;

  const topVariants = hanjas.slice(0, 3);
  const rareVariants = hanjas.slice(3);

  console.log(`${syllable}: ${hanjas.length}개 → ${topVariants.length}개 (${rareVariants.length}개 제거)`);

  // Rare variants의 genderHint 제거
  for (const hanja of rareVariants) {
    await prisma.hanjaDict.update({
      where: { id: hanja.id },
      data: { genderHint: null },
    });
  }
}
```

### 예상 결과
```
Before: 1,697 chars with genderHint
After:  ~800 chars with genderHint

Coverage: 61.5% → ~30%
Precision: 96% → 99%

→ 품질 대폭 향상, coverage는 여전히 충분
```

---

## Priority & Timeline

### Week 2 (High Priority)
- ✅ Task 3: 실전 이름 생성 E2E 테스트
- ✅ Task 1: 의도치 않은 오염 감시 시스템

### Week 3 (Medium Priority)
- Task 2: 성별 힌트 로그 분석 대시보드
- Task 4: 블랙리스트 자동 업데이트 시스템

### Week 4+ (Low Priority, 선택적)
- Task 5: Threshold 조정 실험
- Task 6: 한자 변형 필터링

---

## Success Metrics

### Coverage (현재)
- ✅ 61.5% of usable chars (1,697/2,748)

### Precision (목표)
- 🎯 E2E 테스트 pass rate > 95%
- 🎯 Suspicious cases < 10건/월

### Maintainability
- 🎯 Blacklist update cycle: 월 1회
- 🎯 Log analysis: 주 1회 (초기), 월 1회 (안정화 후)

---

## Notes

이 작업들은 **선택적**입니다. Week 1에서 이미 프로덕션 가능한 수준에 도달했으므로:

1. **즉시 배포 가능**: 현재 상태로도 충분히 실서비스 가능
2. **점진적 개선**: Week 2-3 작업은 품질 향상용
3. **데이터 기반**: 실제 사용 데이터 수집 후 우선순위 재조정

---

**작성자**: Claude Code
**날짜**: 2025-10-31
**관련 작업**: Week 1 Gender Hint Expansion (Phase 1 + Phase 2)
