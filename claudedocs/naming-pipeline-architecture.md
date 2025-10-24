# NamingPipeline Architecture Documentation

**작성일**: 2024-10-24
**버전**: 1.0.0
**상태**: Design Complete

## Executive Summary

한국 전통 작명 서비스를 위한 8단계 파이프라인 아키텍처를 설계했습니다. 사주팔자 계산부터 최종 이름 추천까지 전체 프로세스를 통합하며, **10초 이내 실행**을 목표로 성능 최적화와 에러 처리를 구현했습니다.

## Architecture Overview

```
생년월일시 입력
    ↓
[Step 1] Saju 계산 (~50-100ms)
    ↓
[Step 2] Yongsin 분석 (~500-2000ms) - 5방법 + AI
    ↓
[Step 3] Hanja 추천 (~100-200ms) - 용신 기반 필터링
    ↓
[Step 4] 조합 생성 (~200-500ms) - 2자 이름 조합
    ↓
[Step 5] 검증 (~1-3s) - 81수리/음양/음운 (배치 처리)
    ↓
[Step 6] 점수 계산 (Step 5 통합)
    ↓
[Step 7] 필터링 (~10-50ms) - 최소 점수 이상
    ↓
[Step 8] 정렬 및 반환 (~10ms) - Top N
    ↓
최종 추천 이름 목록
```

## Key Design Decisions

### 1. **Pipeline Pattern with Dependency Injection**

**선택 이유**:
- 각 단계 독립적 테스트 가능
- 서비스 교체 용이 (DB ↔ Mock ↔ Memory)
- 명확한 데이터 흐름

**구현**:
```typescript
export class NamingPipeline {
  constructor(
    private sajuCalculator: SajuCalculator,
    private yongsinAnalyzer: YongsinAnalyzer,
    private yinyangValidator: YinYangValidator,
    private phoneticMatcher: PhoneticMatcher,
    private hanjaService: HanjaService,      // Abstract interface
    private cache?: CacheService             // Optional
  ) {}
}
```

### 2. **Graceful Degradation Error Strategy**

**선택 이유**:
- 부분 실패에도 결과 반환
- 사용자 경험 개선
- AI 실패 시 전통 방법 폴백

**구현**:
```typescript
try {
  await step1_calculateSaju(context);
  await step2_analyzeYongsin(context);  // AI may fail
  // ... more steps
} catch (error) {
  return handlePipelineError(context, error);  // Return partial results
}
```

**Fallback Mechanisms**:
- Step 2: AI 실패 → 전통 5방법만 사용
- Step 3: Primary 풀 부족 → Secondary 추가
- Step 5: 개별 검증 실패 → 건너뛰고 계속
- 전체: 에러 → 부분 결과 반환

### 3. **Batch Processing for Performance**

**선택 이유**:
- 대량 조합(최대 10,000개) 효율적 처리
- 메모리 사용량 제어
- 타임아웃 방지

**구현**:
```typescript
const batchSize = 100;
for (let i = 0; i < combinations.length; i += batchSize) {
  const batch = combinations.slice(i, i + batchSize);
  const batchCandidates = await processBatch(batch, context);
  candidates.push(...batchCandidates);
}
```

### 4. **Progressive Filtering Strategy**

**선택 이유**:
- 불필요한 계산 최소화
- 각 단계에서 후보 수 감소
- 최종 단계에서만 상세 분석

**Flow**:
```
10,000 combinations
    ↓ (Step 4: Early limit)
3,000 combinations
    ↓ (Step 5: Basic validation)
1,500 candidates
    ↓ (Step 7: Score filtering)
300 candidates
    ↓ (Step 8: Top N)
20 final candidates
```

### 5. **Integrated Scoring in Validation**

**선택 이유**:
- 중복 계산 제거
- 성능 향상 (Step 5+6 통합)
- 코드 간소화

**가중치 시스템**:
```typescript
weights: {
  yongsin: 0.35,       // 용신 매치 (가장 중요)
  yinyang: 0.25,       // 음양 균형
  pronunciation: 0.20, // 발음 용이성
  meaning: 0.10,       // 의미 조화
  numerology: 0.05,    // 81수리
  taboo: 0.05,         // 금기 문자
}
```

## Component Architecture

### Core Components

```
NamingPipeline (Orchestrator)
    │
    ├── SajuCalculator
    │   └── CalendarDataService (DB)
    │
    ├── YongsinAnalyzer
    │   └── ClaudeAIService (Optional)
    │
    ├── YinYangValidator
    │
    ├── PhoneticMatcher
    │
    ├── HanjaService (Interface)
    │   ├── DatabaseHanjaService (Production)
    │   ├── InMemoryHanjaService (Dev)
    │   └── MockHanjaService (Test)
    │
    └── CacheService (Interface)
        ├── RedisCacheService (Production)
        ├── InMemoryCacheService (Dev)
        └── NullCacheService (Disabled)
```

### Service Interfaces

**HanjaService**:
```typescript
interface HanjaService {
  findByElement(
    element: Element,
    options: {
      minStrokes?: number;
      maxStrokes?: number;
      isGoodForNaming?: boolean;
      gender?: 'M' | 'F';
    }
  ): Promise<HanjaCharacter[]>;
}
```

**CacheService**:
```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}
```

## Performance Optimization

### 1. **Caching Strategy**

**Cache Key Format**:
```
naming:{year}{month}{day}{hour}{minute}{L|S}:{lastName}:{strokes}
```

**Example**:
```
naming:19900515143L:김:8
```

**TTL**: 1 hour (3600초)

### 2. **Early Limiting**

```typescript
// Step 4: Combination Generation
for (let i = 0; i < pool.length && combinations.length < maxCombinations; i++) {
  // Stop early if limit reached
}
```

### 3. **Parallel Validation**

각 후보의 검증은 독립적이므로 배치 내 병렬 처리 가능:
- 81수리 계산
- 음양 검증
- 음운 분석
- 용신 매치
- 금기 확인

### 4. **Database Query Optimization**

```sql
-- Hanja 조회 최적화
SELECT * FROM hanja
WHERE element = 'WOOD'
  AND strokes BETWEEN 3 AND 20
  AND is_good_for_naming = true
ORDER BY name_frequency DESC, usage_frequency DESC
LIMIT 500;
```

**인덱스**:
- `(element, is_good_for_naming, name_frequency)`
- `(element, strokes)`

## Error Handling Matrix

| Step | Error Type | Fallback Strategy | Impact |
|------|-----------|-------------------|---------|
| 1. Saju | Invalid date | Throw error | Critical - cannot proceed |
| 2. Yongsin | AI failure | Use traditional methods | Reduced accuracy |
| 3. Hanja | Empty pool | Add secondary element | May reduce quality |
| 4. Combinations | Too few | Lower threshold | Smaller result set |
| 5. Validation | Individual failure | Skip candidate | Reduced pool size |
| 6. Scoring | Calculation error | Skip candidate | Reduced pool size |
| 7. Filtering | All filtered out | Return empty | User notified |
| 8. Ranking | Sort failure | Return unsorted | Order wrong |

## Testing Strategy

### Unit Tests
```typescript
describe('NamingPipeline', () => {
  describe('Step 1: Saju Calculation', () => {
    it('should calculate saju correctly', async () => {
      // Test individual step
    });
  });
});
```

### Integration Tests
```typescript
it('should complete full pipeline in <10s', async () => {
  const start = Date.now();
  const result = await pipeline.execute(birthInfo, '김', 8);
  expect(Date.now() - start).toBeLessThan(10000);
});
```

### Performance Tests
```typescript
it('should handle 10,000 combinations efficiently', async () => {
  const result = await pipeline.execute(birthInfo, '김', 8, {
    maxCombinations: 10000
  });
  expect(result.metadata.executionTime).toBeLessThan(10000);
});
```

## File Structure

```
app/lib/naming/pipeline/
├── naming-pipeline.ts          # Core pipeline implementation
├── services.ts                 # Service implementations
├── index.ts                    # Public API exports
├── examples.ts                 # Usage examples
├── README.md                   # Architecture documentation
└── __tests__/
    └── naming-pipeline.test.ts # Test suite
```

## Configuration Options

### Default Configuration

```typescript
const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  // Performance
  maxCombinations: 10000,
  maxCandidates: 20,
  batchSize: 100,
  timeout: 10000,

  // Scoring weights
  weights: {
    yongsin: 0.35,
    yinyang: 0.25,
    pronunciation: 0.20,
    meaning: 0.10,
    numerology: 0.05,
    taboo: 0.05,
  },

  // Filtering
  minScore: 60,
  requireYongsinMatch: true,
  avoidInauspicious: true,

  // Caching
  cacheEnabled: true,
  cacheTTL: 3600,
};
```

### Custom Configuration Examples

**Fast Mode** (낮은 품질, 빠른 속도):
```typescript
{
  maxCombinations: 1000,
  maxCandidates: 10,
  batchSize: 50,
  minScore: 50,
  requireYongsinMatch: false,
}
```

**Quality Mode** (높은 품질, 느린 속도):
```typescript
{
  maxCombinations: 20000,
  maxCandidates: 50,
  batchSize: 200,
  minScore: 75,
  requireYongsinMatch: true,
  avoidInauspicious: true,
}
```

## Usage Examples

### Basic Usage

```typescript
import { createNamingPipeline } from '~/lib/naming/pipeline';

const pipeline = createNamingPipeline(hanjaService, cacheService);

const birthInfo: BirthInfo = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  isLunar: false,
  gender: 'M',
};

const result = await pipeline.execute(birthInfo, '김', 8);

console.log(`Top: ${result.candidates[0].firstName.join('')}`);
console.log(`Score: ${result.candidates[0].score}`);
```

### Custom Configuration

```typescript
const result = await pipeline.execute(
  birthInfo,
  '김',
  8,
  {
    maxCandidates: 50,
    weights: {
      yongsin: 0.40,
      yinyang: 0.30,
      pronunciation: 0.15,
      meaning: 0.10,
      numerology: 0.03,
      taboo: 0.02,
    },
  }
);
```

## Monitoring & Observability

### Telemetry Data

```typescript
result.metadata = {
  totalGenerated: 5234,      // Step 4에서 생성된 조합 수
  totalScored: 1456,         // Step 5에서 검증된 후보 수
  executionTime: 8543,       // 총 실행 시간 (ms)
  timestamp: "2024-10-24...", // 실행 시각
};

context.stepDurations = {
  step1_saju: 78,
  step2_yongsin: 1543,
  step3_hanja: 156,
  step4_combinations: 432,
  step5_validation: 5678,
  step6_scoring: 0,          // Step 5에 통합
  step7_filtering: 34,
  step8_ranking: 12,
};
```

### Performance Monitoring

**Key Metrics**:
- Total execution time: Target <10s
- Cache hit rate: Target >50%
- Candidate generation rate: ~2000/s
- Validation throughput: ~500/s

**Alerts**:
- Execution time >15s
- Cache hit rate <30%
- Empty results >10%
- Error rate >5%

## Future Enhancements

### Phase 2 (Q1 2025)
- [ ] Semantic meaning analysis (AI-powered)
- [ ] Cultural appropriateness scoring
- [ ] Historical name trend analysis
- [ ] Sibling name harmony checking

### Phase 3 (Q2 2025)
- [ ] Multi-character surnames (복성)
- [ ] 3-character first names
- [ ] International compatibility
- [ ] Generation name (돌림자)

### Phase 4 (Q3 2025)
- [ ] ML-based score optimization
- [ ] A/B testing framework
- [ ] Real-time feedback loop
- [ ] Distributed execution

## Trade-off Analysis

### Design Decisions

| Decision | Pros | Cons | Chosen |
|----------|------|------|---------|
| Pipeline vs Microservices | Simple, fast | Limited scalability | Pipeline ✅ |
| Sync vs Async | Predictable, easier debugging | Lower throughput | Sync ✅ |
| DB vs In-Memory | Persistent, large datasets | Slower | DB ✅ |
| Strict vs Permissive validation | Higher quality | Fewer results | Balanced ✅ |
| Cache vs No-Cache | Faster repeat queries | Stale data risk | Cache (1hr TTL) ✅ |

### Performance vs Quality

**Current Balance**: 70% Quality, 30% Speed
- 10초 제한 내 최대 품질 추구
- 필요시 사용자가 설정 조정 가능

**Alternative Profiles**:
- **Fast**: 50% Quality, 50% Speed (3-5초, 낮은 점수)
- **Quality**: 90% Quality, 10% Speed (15-20초, 높은 점수)

## Conclusion

NamingPipeline은 전통 작명 지식과 현대 소프트웨어 아키텍처를 결합한 설계입니다:

**강점**:
- ✅ 명확한 단계별 구조
- ✅ 유연한 의존성 주입
- ✅ 견고한 에러 처리
- ✅ 성능 최적화 전략
- ✅ 확장 가능한 설계

**다음 단계**:
1. Production DB 연동 (DatabaseHanjaService)
2. Redis 캐시 통합
3. API 엔드포인트 생성
4. 프론트엔드 통합
5. 성능 벤치마크 및 튜닝

## References

- [Saju Calculator](../app/lib/saju/calculator.ts)
- [Yongsin Analyzer](../app/lib/saju/yongsin-analyzer.ts)
- [81수리 연구](./81-numerology-research.md)
- [음양 검증](./yinyang-validation-research.md)
