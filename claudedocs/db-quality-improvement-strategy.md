# 한자 DB meaning 필드 품질 개선 전략

> 작성일: 2025-10-31
> 대상: HanjaDict 테이블 2,748개 작명 한자
> 목표: meaning 필드를 "형용사 + 한자읽기" 형식으로 표준화

## 📊 현황 분석

### DB 통계
- **전체 한자**: 8,787개
- **작명 가능 한자**: 2,748개 (31.3%)
- **작명 부적합 한자**: 6,039개 (68.7%)
- **Seed 보호 한자**: 120개 (4.4% - 이미 양질의 meaning 보유)

### meaning 필드 품질 분석
| 카테고리 | 개수 | 비율 | 상태 |
|---------|------|------|------|
| ✅ 이상적 형식 | 133개 | 4.8% | "밝을 명", "클 호(하늘)" |
| 🚫 부정적 의미 | 9개 | 0.3% | "주검", "재앙", "병" |
| ⚠️ 구체명사 | 167개 | 6.1% | "나무이름", "물이름" |
| ⚠️ 도구/용품 | 14개 | 0.5% | "작은가마", "술그릇" |
| ⚠️ 동사형 | 0개 | 0.0% | "~할" 형태 |
| 🔧 개선 필요 | 2,425개 | 88.2% | 기타 비표준 형식 |

### 주요 문제 패턴
1. **구체명사**: "나무이름", "물이름", "고을이름" (167개)
2. **도구명**: "작은가마", "질그릇", "수레" (14개)
3. **부정적 의미**: "주검", "재앙", "병" (9개) - 🚨 isGoodForNaming=false로 변경 필요
4. **비표준 형식**: 설명이 장황하거나 일관성 없는 형식 (2,425개)

---

## 🛡️ 1. 데이터 안전성 우선 전략

### 1.1 백업 시스템 (3-Tier Backup)

```typescript
// Tier 1: 전체 테이블 스냅샷
async function createFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const allHanja = await prisma.hanjaDict.findMany();

  await fs.writeFile(
    `backups/hanja-dict-full-${timestamp}.json`,
    JSON.stringify(allHanja, null, 2)
  );

  return { timestamp, count: allHanja.length };
}

// Tier 2: 작명 한자만 선택적 백업
async function createGoodHanjaBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const goodHanja = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true }
  });

  await fs.writeFile(
    `backups/hanja-good-only-${timestamp}.json`,
    JSON.stringify(goodHanja, null, 2)
  );

  return { timestamp, count: goodHanja.length };
}

// Tier 3: 변경 로그 (Audit Trail)
async function logChange(change: {
  character: string;
  oldMeaning: string | null;
  newMeaning: string;
  reason: string;
  timestamp: Date;
}) {
  await fs.appendFile(
    'backups/meaning-changes.jsonl',
    JSON.stringify(change) + '\n'
  );
}
```

### 1.2 롤백 메커니즘

```typescript
// 변경 전: 트랜잭션 기반 안전 업데이트
async function safeUpdateMeaning(character: string, newMeaning: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 기존 데이터 조회
    const existing = await tx.hanjaDict.findUnique({
      where: { character }
    });

    if (!existing) throw new Error(`Character ${character} not found`);

    // 2. 변경 로그 기록
    await logChange({
      character,
      oldMeaning: existing.meaning,
      newMeaning,
      reason: 'meaning-standardization',
      timestamp: new Date(),
    });

    // 3. 업데이트
    return await tx.hanjaDict.update({
      where: { character },
      data: { meaning: newMeaning }
    });
  });
}

// 롤백 스크립트
async function rollbackChanges(changeLogFile: string) {
  const lines = (await fs.readFile(changeLogFile, 'utf-8')).split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const change = JSON.parse(line);

    await prisma.hanjaDict.update({
      where: { character: change.character },
      data: { meaning: change.oldMeaning }
    });
  }
}
```

### 1.3 단계별 적용 전략

```yaml
Phase 1 (Pilot - 10개):
  - 샘플 10개 한자로 파일럿 테스트
  - 수동 검증 → 품질 확인
  - 롤백 테스트 → 안전성 확인

Phase 2 (Small Batch - 100개):
  - 빈도 높은 100개 우선 적용
  - 자동 검증 + 수동 샘플링 검증
  - 1주일 모니터링 기간

Phase 3 (Medium Batch - 500개):
  - 중요도 기반 500개 확장
  - 자동 검증 프로세스 안정화

Phase 4 (Full Scale - 2,628개):
  - 전체 개선 필요 한자 적용
  - 지속적 품질 모니터링
```

---

## 🔍 2. 문제 패턴 자동 탐지 체계

### 2.1 패턴 분류 시스템

```typescript
interface MeaningPattern {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  patterns: RegExp[];
  examples: string[];
  action: 'reject' | 'improve' | 'review';
}

const meaningPatterns: MeaningPattern[] = [
  {
    category: 'negative-meaning',
    priority: 'critical',
    patterns: [
      /^(죽을|병|악할|흉할|재앙|해칠|주검|죽일|쇠할|망할|깨질|상할)/,
    ],
    examples: ['주검', '재앙', '병'],
    action: 'reject', // isGoodForNaming=false로 변경
  },
  {
    category: 'concrete-nouns',
    priority: 'high',
    patterns: [
      /나무이름/,
      /물이름/,
      /산이름/,
      /고을이름/,
      /나라이름/,
    ],
    examples: ['나무이름', '물이름'],
    action: 'improve',
  },
  {
    category: 'tools-objects',
    priority: 'high',
    patterns: [
      /가마/,
      /그릇/,
      /수레/,
    ],
    examples: ['작은가마', '술그릇'],
    action: 'improve',
  },
  {
    category: 'verb-ending',
    priority: 'medium',
    patterns: [/할\s*\w+$/],
    examples: ['원통할'],
    action: 'improve',
  },
  {
    category: 'ideal-format',
    priority: 'low',
    patterns: [
      /^[가-힣]+\s+[가-힣]{1,2}$/,                          // "밝을 명"
      /^[가-힣]+\s+[가-힣]{1,2}\([^)]+\)$/,                  // "클 호(하늘)"
      /^[가-힣]+\s+[가-힣]{1,2}\/[가-힣]+\s+[가-힣]{1,2}$/,  // "밝을 명/빛날 명"
    ],
    examples: ['밝을 명', '클 호(하늘)', '빛날 환/밝을 환'],
    action: 'review', // 이미 양호
  },
];

// 패턴 탐지 함수
function detectPattern(meaning: string | null): {
  category: string;
  priority: string;
  action: string;
} | null {
  if (!meaning) return { category: 'empty', priority: 'low', action: 'improve' };

  for (const pattern of meaningPatterns) {
    if (pattern.patterns.some(p => p.test(meaning))) {
      return {
        category: pattern.category,
        priority: pattern.priority,
        action: pattern.action,
      };
    }
  }

  return { category: 'non-standard', priority: 'medium', action: 'improve' };
}
```

### 2.2 자동 분류 스크립트

```typescript
async function classifyAllMeanings() {
  const allGood = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true },
  });

  const classification = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const hanja of allGood) {
    const result = detectPattern(hanja.meaning);
    if (result) {
      classification[result.priority].push({
        ...hanja,
        detectedPattern: result.category,
        action: result.action,
      });
    }
  }

  return classification;
}
```

---

## 🎯 3. 우선순위 전략

### 3.1 우선순위 매트릭스

| 우선순위 | 분류 | 개수 | 기준 | 조치 |
|---------|------|------|------|------|
| 🔴 P0 | 부정적 의미 | 9개 | 작명 부적합 | isGoodForNaming=false |
| 🟠 P1 | 고빈도 + 문제패턴 | ~50개 | nameFrequency>80 AND 문제패턴 | 즉시 개선 |
| 🟡 P2 | 구체명사/도구 | 181개 | 구체명사, 도구명 패턴 | 우선 개선 |
| 🟢 P3 | 비표준 형식 | ~2,300개 | 나머지 전체 | 점진적 개선 |

### 3.2 빈도 기반 우선순위

```sql
-- 고빈도 + 문제패턴 한자 식별
SELECT character, meaning, name_frequency, element
FROM hanja_dict
WHERE is_good_for_naming = true
  AND name_frequency > 80
  AND (
    meaning LIKE '%나무%' OR
    meaning LIKE '%이름%' OR
    meaning LIKE '%그릇%' OR
    meaning LIKE '%가마%'
  )
ORDER BY name_frequency DESC;
```

### 3.3 오행 밸런스 고려

```typescript
async function getElementDistribution() {
  const distribution = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: { isGoodForNaming: true },
    _count: true,
  });

  // 각 오행별 개선 필요 한자 비율 확인
  // → 특정 오행에 편중되지 않도록 균형 유지
}
```

---

## 📚 4. 대체 데이터 소스

### 4.1 1차 소스: 기존 good-hanja-seed.json (120개)

```json
{
  "char": "明",
  "element": "火",
  "korean": "밝을 명",
  "isGoodForNaming": true
}
```

**활용 방안**:
- 120개는 이미 완벽 → 참조 템플릿으로 활용
- 패턴 학습 데이터로 사용
- 품질 기준(Golden Standard)으로 설정

### 4.2 2차 소스: Unihan Database (Unicode)

```typescript
// Unihan에서 kKorean, kDefinition 가져오기
interface UnihanData {
  character: string;
  kKorean: string;      // 한글 음
  kDefinition: string;  // 영어 정의
  kMandarin: string;    // 중국어 병음
}

// 영어 정의 → 한글 의미 변환 필요
// 예: "bright, light, brilliant" → "밝을", "빛날"
```

**한계**:
- 영어 정의를 한글 형용사로 변환하는 추가 작업 필요
- 작명 맥락에 적합하지 않은 의미 포함 가능

### 4.3 3차 소스: 한자능력검정시험 교재 (신뢰도 높음)

출처: 한국어문회, 대한검정회 공식 한자 교재

**장점**:
- 한국 문화권에 최적화된 의미
- "형용사 + 음" 형식 이미 사용
- 작명에 적합한 긍정적 의미 위주

**수집 방법**:
- 공공 API 없음 → 수동 수집 또는 OCR
- 법적 검토 필요 (저작권)

### 4.4 4차 소스: 네이버 한자사전 API (가능 시)

```typescript
// 네이버 한자사전에서 의미 가져오기
async function fetchNaverHanjaMeaning(character: string) {
  // API 호출 (공식 API 존재 여부 확인 필요)
  // 크롤링은 법적 문제 가능성 → 비추천
}
```

### 4.5 추천 데이터 소스 전략

```yaml
우선순위 1: good-hanja-seed.json (120개)
  - 즉시 사용 가능
  - 패턴 참조 기준

우선순위 2: Unihan + GPT 보조
  - Unihan에서 기본 정보 가져오기
  - GPT-4로 "영어 정의 → 한글 형용사" 변환
  - 수동 검증 필수

우선순위 3: 커뮤니티 크라우드소싱
  - 한자 전문가 검토 요청
  - 사용자 제안 시스템 구축
  - 점진적 품질 향상
```

---

## ✅ 5. 검증 및 품질 보증

### 5.1 3단계 검증 프로세스

```typescript
interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

// Level 1: 형식 검증
function validateFormat(meaning: string): ValidationResult {
  const rules = [
    {
      name: 'not-empty',
      test: () => meaning && meaning.trim().length > 0,
      error: 'meaning 필드가 비어있음',
    },
    {
      name: 'korean-only',
      test: () => /^[가-힣\s()/]+$/.test(meaning),
      error: '한글, 공백, 괄호만 허용',
    },
    {
      name: 'standard-format',
      test: () => /^[가-힣]+\s+[가-힣]{1,2}/.test(meaning),
      warning: '표준 형식 권장: "형용사 음"',
    },
    {
      name: 'no-negative',
      test: () => !/^(죽을|병|악할|흉할|재앙|해칠)/.test(meaning),
      error: '부정적 의미 사용 금지',
    },
  ];

  const errors = [];
  const warnings = [];

  for (const rule of rules) {
    if (!rule.test()) {
      if (rule.error) errors.push(rule.error);
      if (rule.warning) warnings.push(rule.warning);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, 100 - (errors.length * 25) - (warnings.length * 10)),
  };
}

// Level 2: 의미 일관성 검증
function validateConsistency(character: string, meaning: string): ValidationResult {
  // 같은 음을 가진 한자들의 meaning 패턴 비교
  // 예: "明" (명) → "밝을 명" / "영화 명" (일관성 체크)
}

// Level 3: 작명 적합성 검증
function validateNamingSuitability(meaning: string): ValidationResult {
  const unsuitablePatterns = [
    /나무이름/,
    /물이름/,
    /그릇/,
    /가마/,
  ];

  const warnings = [];

  for (const pattern of unsuitablePatterns) {
    if (pattern.test(meaning)) {
      warnings.push(`작명에 부적합한 패턴: ${pattern.source}`);
    }
  }

  return {
    passed: warnings.length === 0,
    errors: [],
    warnings,
    score: warnings.length === 0 ? 100 : 70,
  };
}
```

### 5.2 자동 테스트 스위트

```typescript
describe('Meaning Field Quality', () => {
  test('All good-for-naming characters have meaning', async () => {
    const withoutMeaning = await prisma.hanjaDict.count({
      where: {
        isGoodForNaming: true,
        meaning: null,
      },
    });

    expect(withoutMeaning).toBe(0);
  });

  test('No negative meanings in good-for-naming', async () => {
    const negative = await prisma.hanjaDict.findMany({
      where: {
        isGoodForNaming: true,
        meaning: {
          contains: '죽을',
        },
      },
    });

    expect(negative.length).toBe(0);
  });

  test('Meaning format follows standard', async () => {
    const allGood = await prisma.hanjaDict.findMany({
      where: { isGoodForNaming: true },
    });

    let conforming = 0;
    for (const hanja of allGood) {
      const result = validateFormat(hanja.meaning || '');
      if (result.score >= 80) conforming++;
    }

    const conformingRate = (conforming / allGood.length) * 100;
    expect(conformingRate).toBeGreaterThan(90); // 90% 이상 표준 형식
  });
});
```

### 5.3 품질 모니터링 대시보드

```typescript
async function generateQualityReport() {
  const allGood = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true },
  });

  const report = {
    total: allGood.length,
    withMeaning: 0,
    standardFormat: 0,
    averageScore: 0,
    byElement: {},
    byPriority: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  };

  let totalScore = 0;

  for (const hanja of allGood) {
    if (hanja.meaning) report.withMeaning++;

    const validation = validateFormat(hanja.meaning || '');
    totalScore += validation.score;

    if (validation.score >= 80) report.standardFormat++;

    const pattern = detectPattern(hanja.meaning);
    if (pattern) {
      report.byPriority[pattern.priority]++;
    }
  }

  report.averageScore = totalScore / allGood.length;

  return report;
}
```

---

## 🚀 6. 실행 계획 (Implementation Roadmap)

### Phase 0: 준비 (1-2일)

```yaml
Tasks:
  - ✅ 현황 분석 완료 (analyze-all-meanings.ts)
  - ⏳ 백업 시스템 구축
  - ⏳ 패턴 탐지 스크립트 작성
  - ⏳ 검증 프레임워크 구축

Deliverables:
  - 전체 DB 백업 파일
  - 패턴 분류 결과 (JSON)
  - 우선순위 리스트
```

### Phase 1: 긴급 조치 (1일)

```yaml
Scope: 9개 부정적 의미 한자
Action: isGoodForNaming = false로 변경

Tasks:
  1. 부정적 의미 한자 리스트 추출
  2. 수동 재검토 (혹시 오탐지 확인)
  3. DB 업데이트
  4. 작명 알고리즘에서 제외 확인

Expected Impact:
  - 부적절 한자 즉시 차단
  - 작명 품질 향상
```

### Phase 2: 고빈도 개선 (3-5일)

```yaml
Scope: 빈도 80+ & 문제패턴 한자 (~50개)

Tasks:
  1. 고빈도 문제 한자 추출
  2. Unihan 데이터 수집
  3. GPT-4 보조로 meaning 생성
  4. 수동 검증 (100% 확인)
  5. 단계별 적용 (10 → 50)

Data Source:
  - Unihan Database
  - good-hanja-seed.json 패턴 참조
  - GPT-4 변환 + 수동 검증

Expected Impact:
  - 가장 많이 사용되는 한자 품질 개선
  - 작명 결과 즉시 향상
```

### Phase 3: 중요도 기반 확장 (1-2주)

```yaml
Scope: 구체명사/도구 181개

Tasks:
  1. 패턴별 일괄 처리 스크립트 작성
  2. Unihan + GPT-4 파이프라인 구축
  3. 자동 검증 + 샘플링 검증
  4. 배치별 적용 (50개씩)

Automation:
  - 70% 자동화 목표
  - 30% 수동 검증

Expected Impact:
  - 작명 부적합 패턴 대부분 제거
  - 작명 의미 일관성 확보
```

### Phase 4: 전체 표준화 (2-4주)

```yaml
Scope: 나머지 ~2,300개

Tasks:
  1. 대량 처리 파이프라인 최적화
  2. 크라우드소싱 시스템 고려
  3. 지속적 품질 모니터링
  4. A/B 테스트로 영향 측정

Quality Target:
  - 90% 이상 표준 형식
  - 100% meaning 필드 존재
  - 0% 부정적 의미

Expected Impact:
  - 전체 작명 DB 품질 표준화
  - 사용자 만족도 향상
```

---

## 📋 7. 도구 및 스크립트

### 7.1 백업 스크립트

```typescript
// scripts/etl/backup-hanja-dict.ts
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = 'backups/hanja-dict';

  await fs.mkdir(backupDir, { recursive: true });

  // Full backup
  const all = await prisma.hanjaDict.findMany();
  await fs.writeFile(
    `${backupDir}/full-${timestamp}.json`,
    JSON.stringify(all, null, 2)
  );

  // Good-for-naming only
  const good = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true }
  });
  await fs.writeFile(
    `${backupDir}/good-only-${timestamp}.json`,
    JSON.stringify(good, null, 2)
  );

  console.log(`✅ Backup created: ${timestamp}`);
  console.log(`   Full: ${all.length} characters`);
  console.log(`   Good: ${good.length} characters`);
}
```

### 7.2 패턴 탐지 스크립트

```typescript
// scripts/etl/detect-meaning-patterns.ts
// (이미 analyze-all-meanings.ts로 구현됨)
```

### 7.3 의미 개선 파이프라인

```typescript
// scripts/etl/improve-meaning-pipeline.ts
async function improveMeaningPipeline(characters: string[]) {
  const results = [];

  for (const char of characters) {
    // 1. Unihan 데이터 가져오기
    const unihan = await fetchUnihanData(char);

    // 2. GPT-4로 변환
    const gptResult = await convertToKoreanMeaning(unihan.kDefinition);

    // 3. 검증
    const validation = validateFormat(gptResult);

    // 4. 수동 검토 필요 여부 판단
    const needsReview = validation.score < 80;

    results.push({
      character: char,
      original: unihan.kDefinition,
      suggested: gptResult,
      validation,
      needsReview,
    });
  }

  return results;
}
```

### 7.4 품질 검증 스크립트

```typescript
// scripts/etl/validate-meaning-quality.ts
// (위 섹션 5.1-5.3 참조)
```

---

## 🎯 8. 성공 지표 (KPI)

### 단기 지표 (1-2주)

| 지표 | 현재 | 목표 | 측정 방법 |
|-----|------|------|----------|
| 표준 형식 비율 | 4.8% | 30% | 정규식 검증 |
| 부정적 의미 제거 | 9개 | 0개 | isGoodForNaming=false |
| 고빈도 한자 품질 | 미흡 | 90%+ | 빈도 80+ 검증 |

### 중기 지표 (1개월)

| 지표 | 현재 | 목표 | 측정 방법 |
|-----|------|------|----------|
| 전체 표준화 비율 | 4.8% | 70% | 자동 검증 |
| 구체명사 제거 | 167개 | <50개 | 패턴 탐지 |
| 평균 품질 점수 | - | 80+ | 검증 스크립트 |

### 장기 지표 (2-3개월)

| 지표 | 현재 | 목표 | 측정 방법 |
|-----|------|------|----------|
| 전체 표준화 비율 | 4.8% | 90%+ | 자동 검증 |
| 사용자 만족도 | - | 향상 | 설문조사 |
| 작명 품질 개선 | - | 측정 가능 | A/B 테스트 |

---

## ⚠️ 9. 리스크 및 완화 방안

### 리스크 1: 데이터 손실

**완화 방안**:
- 3-Tier 백업 시스템 (전체/부분/로그)
- 트랜잭션 기반 업데이트
- 롤백 스크립트 준비

### 리스크 2: 의미 변환 오류

**완화 방안**:
- 고빈도 한자는 100% 수동 검증
- 자동 검증 시스템 다중 검증
- 단계별 적용 및 모니터링

### 리스크 3: 작명 알고리즘 영향

**완화 방안**:
- A/B 테스트로 영향 측정
- 파일럿 테스트 먼저 실시
- 점진적 롤아웃 (10 → 50 → 500 → 전체)

### 리스크 4: 문화적 적합성

**완화 방안**:
- 한자 전문가 자문
- 한국 문화권 맥락 고려
- 커뮤니티 피드백 수집

---

## 📚 10. 참고 자료 및 도구

### 데이터 소스
- ✅ good-hanja-seed.json (120개, 즉시 사용 가능)
- ⏳ Unihan Database (Unicode Consortium)
- ⏳ 네이버 한자사전 (API 확인 필요)
- ⏳ 한국어문회 한자 교재 (법적 검토 필요)

### 도구
- Prisma ORM (DB 접근)
- TypeScript (스크립트 작성)
- GPT-4 (의미 변환 보조)
- Jest (품질 테스트)

### 스크립트 위치
```
scripts/etl/
├── analyze-all-meanings.ts      (✅ 완료)
├── backup-hanja-dict.ts          (⏳ 구현 필요)
├── detect-meaning-patterns.ts    (✅ 완료)
├── improve-meaning-pipeline.ts   (⏳ 구현 필요)
├── validate-meaning-quality.ts   (⏳ 구현 필요)
└── rollback-changes.ts           (⏳ 구현 필요)
```

---

## ✅ 다음 단계 (Next Actions)

### 즉시 실행 (오늘)
1. ✅ 현황 분석 완료
2. ⏳ 백업 스크립트 작성 및 실행
3. ⏳ 부정적 의미 9개 한자 수동 검토

### 이번 주
1. ⏳ Phase 1: 부정적 의미 한자 처리
2. ⏳ Phase 2 준비: 고빈도 한자 리스트 작성
3. ⏳ Unihan 데이터 수집 파이프라인 구축

### 다음 주
1. ⏳ Phase 2: 고빈도 한자 개선 (50개)
2. ⏳ 검증 시스템 안정화
3. ⏳ Phase 3 준비

---

**작성자**: System Architect Mode
**검토 필요**: 데이터 소스 법적 검토, 한자 전문가 자문
**업데이트**: 진행 상황에 따라 지속 갱신
