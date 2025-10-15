# HanjaMatcher Optimization Strategy - Deep Analysis

**Document Version**: 1.0
**Date**: 2025-10-15
**Status**: Implementation Analysis

---

## Executive Summary

This document provides a comprehensive optimization strategy for the HanjaMatcher algorithm, designed to generate 1,000 high-quality Korean name candidates in under 5 seconds from a database of 8,787 hanja characters (77M+ potential combinations).

**Key Findings**:
- **Bottleneck**: Naive approach (77M combinations) is computationally infeasible
- **Solution**: 3-stage filtering funnel reducing search space by 99.9%
- **Expected Performance**: <3s for 1,000 candidates with 80+ average score
- **Critical Path**: Database query optimization with composite indexes

**Performance Predictions**:
- Stage 1 (Element Filter): 8,787 → ~600-800 chars (DB: 50-100ms)
- Stage 2 (Stroke Filter): ~600-800 → ~300-500 chars (CPU: 10-20ms)
- Stage 3 (Combination): ~300-500 → ~1,000 pairs (CPU: 50-100ms)
- Stage 4 (Scoring): ~1,000 pairs → 1,000 scored (CPU: 1.5-2.5s)
- **Total**: ~2-3 seconds (cold), <1s (cached)

---

## Table of Contents

1. [Problem Analysis](#1-problem-analysis)
2. [Filtering Strategy](#2-filtering-strategy)
3. [Database Query Optimization](#3-database-query-optimization)
4. [Early Termination Logic](#4-early-termination-logic)
5. [Memory vs Speed Tradeoffs](#5-memory-vs-speed-tradeoffs)
6. [Performance Bottleneck Analysis](#6-performance-bottleneck-analysis)
7. [Implementation Algorithm](#7-implementation-algorithm)
8. [Performance Validation](#8-performance-validation)

---

## 1. Problem Analysis

### 1.1 Constraints

**System Constraints**:
- Database: 8,787 hanja characters (PostgreSQL)
- Combinations: 8,787² = 77,210,369 possible pairs
- Target: 1,000 high-quality candidates in <5 seconds
- Scoring: 4 weighted scorers (40% + 20% + 20% + 20%)

**Database Schema Relevant Fields**:
```typescript
model HanjaDict {
  element: Element?           // 오행 (METAL, WOOD, WATER, FIRE, EARTH)
  strokes: Int?              // 획수
  yinYang: YinYang?          // 음양 (YIN, YANG)
  gender: String?            // 'male', 'female', 'neutral'
  nameFrequency: Int?        // 이름 사용 빈도
  isGoodForNaming: Boolean   // 작명 적합성

  // Composite indexes
  @@index([element, isGoodForNaming])
  @@index([gender])
  @@index([nameFrequency])
}
```

### 1.2 Computational Complexity Analysis

**Naive Approach** (Not Viable):
```
Total combinations: 8,787 × 8,787 = 77,210,369
Scoring time per pair: ~2ms (4 scorers in parallel)
Total time: 77,210,369 × 0.002s = 154,420 seconds (~43 hours)
```

**Required Reduction**:
```
Target candidates: 1,000
Required reduction: 77,210,369 → 1,000 = 99.999% reduction
Acceptable scoring pool: ~1,500-2,000 candidates
```

### 1.3 Scoring Complexity

**Per-Candidate Scoring Cost**:
```typescript
ElementScorer (40%):     ~0.5ms (element relations, saju compatibility)
YinYangScorer (20%):     ~0.3ms (pattern analysis)
NumerologyScorer (20%):  ~0.8ms (4 grid calculations, 81수리 lookup)
MeaningScorer (20%):     ~0.4ms (semantic analysis)
---
Total per candidate:     ~2.0ms (parallelized)
```

**Target Scoring Budget**:
```
1,000 candidates × 2ms = 2,000ms = 2 seconds
Remaining for generation: 3 seconds
Total: 5 seconds (within budget)
```

---

## 2. Filtering Strategy

### 2.1 Three-Stage Funnel Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Element-Based Filtering                          │
│  Input:  8,787 characters                                   │
│  Output: ~600-800 characters (93% reduction)               │
│  Method: SQL WHERE element IN (...) + isGoodForNaming      │
│  Time:   50-100ms (DB query with composite index)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: Stroke-Based Filtering                           │
│  Input:  ~600-800 characters                                │
│  Output: ~300-500 characters (40% reduction)               │
│  Method: Filter by auspicious stroke ranges                │
│  Time:   10-20ms (in-memory filter)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: Combination Generation                           │
│  Input:  ~300-500 characters                                │
│  Output: ~1,000-1,500 pairs                                │
│  Method: Strategic pairing with quick-score filter         │
│  Time:   50-100ms (CPU-bound, generator pattern)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: Full Scoring & Ranking                           │
│  Input:  ~1,000-1,500 pairs                                │
│  Output: 1,000 ranked candidates                           │
│  Method: Parallel batch scoring (4 scorers)                │
│  Time:   1.5-2.5 seconds (CPU-bound)                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stage 1: Element-Based Filtering (SQL)

**Strategy**: Leverage composite index `[element, isGoodForNaming]` for optimal query performance.

**Input**: Saju analysis result
```typescript
interface SajuInput {
  favorableElements: Element[];    // [WATER, WOOD] (primary yongsin + producing)
  lackingElements: Element[];       // [FIRE] (deficient elements)
  gender?: 'male' | 'female';      // Optional gender preference
}
```

**Filtering Logic**:
```typescript
/**
 * Priority-based element selection
 */
function determineFilterElements(saju: SajuResult): Element[] {
  const priorities: Element[] = [];

  // Priority 1: Primary yongsin (용신) - MUST include
  priorities.push(saju.yongsin.primary);

  // Priority 2: Elements that produce yongsin (상생 cycle)
  const producing = getProducingElement(saju.yongsin.primary);
  if (!priorities.includes(producing)) {
    priorities.push(producing);
  }

  // Priority 3: Lacking elements (if compatible with yongsin)
  for (const lacking of saju.lackingElements) {
    if (!priorities.includes(lacking) &&
        !isControlledBy(lacking, saju.yongsin.primary)) {
      priorities.push(lacking);
    }
  }

  // Priority 4: Secondary yongsin (if available)
  if (saju.yongsin.secondary && !priorities.includes(saju.yongsin.secondary)) {
    priorities.push(saju.yongsin.secondary);
  }

  return priorities; // Typically 2-3 elements
}
```

**SQL Query**:
```typescript
const characters = await prisma.hanjaDict.findMany({
  where: {
    element: { in: favorableElements },    // Uses index: [element, isGoodForNaming]
    isGoodForNaming: true,                 // Further filters
    gender: gender || undefined,           // Optional gender filter
  },
  orderBy: [
    { nameFrequency: 'desc' },            // Prefer popular characters
    { usageFrequency: 'desc' },
  ],
  take: 1000,                              // Safety limit
});
```

**Expected Results**:
- Typical input: 2-3 favorable elements
- Characters per element: ~300-400 (with `isGoodForNaming: true`)
- Total output: ~600-800 characters
- **Query time**: 50-100ms (with composite index)

### 2.3 Stage 2: Stroke-Based Filtering (CPU)

**Strategy**: Calculate auspicious stroke ranges that produce favorable numerology grids.

**Numerology Grids** (사격):
```typescript
interface FourGrids {
  wonGyeok: number;    // 원격 = char1.strokes + char2.strokes
  hyeongGyeok: number; // 형격 = lastName.strokes + char1.strokes
  iGyeok: number;      // 이격 = char1.strokes + char2.strokes (same as 원격)
  jeongGyeok: number;  // 정격 = lastName.strokes + char2.strokes
}
```

**Auspicious Numbers** (from 81수리):
```typescript
const AUSPICIOUS_NUMBERS = [
  1, 3, 5, 6, 7, 8,          // 대길
  11, 13, 15, 16, 21, 23, 24, // 대길
  31, 32, 33, 41, 47, 48,    // 대길
  52, 57, 61, 63, 65, 67, 68, 81, // 대길
  17, 18, 25, 29, 35, 37, 39, 45  // 길
];
```

**Filtering Algorithm**:
```typescript
function filterByAuspiciousStrokes(
  characters: HanjaDict[],
  lastNameStrokes: number
): HanjaDict[] {

  // Pre-calculate stroke ranges that can form auspicious grids
  const auspiciousStrokeRanges = calculateAuspiciousRanges(lastNameStrokes);

  return characters.filter(char => {
    // Check if this character can contribute to at least 2 auspicious grids
    const canFormAuspicious = countAuspiciousGridPotential(
      char.strokes,
      lastNameStrokes,
      auspiciousStrokeRanges
    );

    return canFormAuspicious >= 2; // Minimum 2 out of 4 grids
  });
}

/**
 * Calculate which stroke counts can form auspicious grids
 */
function calculateAuspiciousRanges(lastNameStrokes: number): StrokeRange[] {
  const ranges: StrokeRange[] = [];

  for (const auspicious of AUSPICIOUS_NUMBERS) {
    const mod81 = auspicious % 81 || 81;

    // For hyeongGyeok: lastName + char1 = auspicious (mod 81)
    // char1 can be: auspicious - lastName, or auspicious + 81 - lastName, etc.
    for (let multiplier = 0; multiplier <= 2; multiplier++) {
      const target = mod81 + (multiplier * 81);
      const charStrokes = target - lastNameStrokes;

      if (charStrokes >= 1 && charStrokes <= 30) {
        ranges.push({
          strokes: charStrokes,
          gridType: 'hyeongGyeok',
          targetNumber: target
        });
      }
    }
  }

  return ranges;
}
```

**Expected Results**:
- Input: ~600-800 characters
- Output: ~300-500 characters (40% reduction)
- **Processing time**: 10-20ms (in-memory filter)

### 2.4 Stage 3: Combination Generation (CPU)

**Strategy**: Generate character pairs with strategic ordering and quick-score pre-filtering.

**Combination Strategy**:
```typescript
function* generateCombinations(
  characters: HanjaDict[],
  maxCandidates: number = 1500
): Generator<NameCandidate> {

  let generated = 0;

  // Strategy 1: Prioritize diverse elements
  const byElement = groupByElement(characters);

  // Generate cross-element pairs first (higher quality)
  for (const [elem1, chars1] of byElement) {
    for (const [elem2, chars2] of byElement) {
      if (elem1 === elem2) continue; // Skip same-element for now

      for (const char1 of chars1) {
        for (const char2 of chars2) {
          yield createCandidate(char1, char2);
          generated++;

          if (generated >= maxCandidates) return;
        }
      }
    }
  }

  // Strategy 2: Generate same-element pairs (if needed)
  for (const [_, chars] of byElement) {
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        yield createCandidate(chars[i], chars[j]);
        yield createCandidate(chars[j], chars[i]); // Both orderings
        generated += 2;

        if (generated >= maxCandidates) return;
      }
    }
  }
}
```

**Quick-Score Pre-filtering**:
```typescript
/**
 * Fast heuristic scoring before full scoring
 * Purpose: Early termination if we have enough high-quality candidates
 */
function quickScore(candidate: NameCandidate, sajuResult: SajuResult): number {
  let score = 50; // Base score

  // Element diversity: +20 points
  if (candidate.char1.element !== candidate.char2.element) {
    score += 20;
  }

  // Favorable element bonus: +15 points
  const hasFavorable =
    sajuResult.favorableElements.includes(candidate.char1.element) ||
    sajuResult.favorableElements.includes(candidate.char2.element);
  if (hasFavorable) {
    score += 15;
  }

  // Yin-yang balance: +10 points
  if (candidate.char1.yinYang !== candidate.char2.yinYang) {
    score += 10;
  }

  // Popularity bonus: +5 points (max)
  const avgPopularity =
    (candidate.char1.nameFrequency + candidate.char2.nameFrequency) / 2;
  score += Math.min(5, avgPopularity / 100);

  return score; // 50-100 range
}
```

**Expected Results**:
- Input: ~300-500 characters
- Potential combinations: 150,000-250,000 (300² to 500²)
- Quick-scored: ~1,500 candidates (top quickScore > 70)
- **Processing time**: 50-100ms

---

## 3. Database Query Optimization

### 3.1 Index Strategy

**Existing Indexes**:
```sql
-- Single-column indexes
CREATE INDEX idx_element ON hanja_dict(element);
CREATE INDEX idx_strokes ON hanja_dict(strokes);
CREATE INDEX idx_gender ON hanja_dict(gender);
CREATE INDEX idx_name_freq ON hanja_dict(name_frequency);

-- Composite indexes (CRITICAL for performance)
CREATE INDEX idx_element_naming ON hanja_dict(element, is_good_for_naming);
```

**Query Optimization Analysis**:
```typescript
// OPTIMIZED: Uses composite index [element, is_good_for_naming]
await prisma.hanjaDict.findMany({
  where: {
    element: { in: [Element.WATER, Element.WOOD] },
    isGoodForNaming: true,
  },
  orderBy: { nameFrequency: 'desc' },
  take: 1000,
});
// Query plan: Index Scan on idx_element_naming
// Estimated cost: 50-100ms for ~600 rows

// UNOPTIMIZED: Full table scan
await prisma.hanjaDict.findMany({
  where: {
    isGoodForNaming: true,
    OR: [
      { element: Element.WATER },
      { element: Element.WOOD }
    ]
  }
});
// Query plan: Sequential Scan on hanja_dict
// Estimated cost: 500-1000ms for 8,787 rows
```

### 3.2 Query Strategy

**Strategy**: Single batched query vs incremental queries

**Option A: Single Batched Query (RECOMMENDED)**
```typescript
// Fetch all candidate characters in one query
const characters = await prisma.hanjaDict.findMany({
  where: {
    element: { in: favorableElements },
    isGoodForNaming: true,
    gender: gender || undefined,
  },
  orderBy: [
    { nameFrequency: 'desc' },
    { usageFrequency: 'desc' },
  ],
  take: 1000,
});

// Pros:
// - Single DB round-trip (50-100ms)
// - Predictable performance
// - Full dataset for filtering

// Cons:
// - May fetch more than needed
// - ~600-800 characters = ~200KB data transfer
```

**Option B: Incremental Queries (NOT RECOMMENDED)**
```typescript
// Query per element
const characters = [];
for (const element of favorableElements) {
  const chars = await prisma.hanjaDict.findMany({
    where: { element, isGoodForNaming: true },
    take: 300,
  });
  characters.push(...chars);
}

// Pros:
// - Fine-grained control per element

// Cons:
// - Multiple DB round-trips (150-300ms total)
// - Unpredictable performance
// - Complexity in deduplication
```

**Recommendation**: Use **Option A** (single batched query) for:
- Consistent 50-100ms latency
- Simple code path
- Predictable memory usage (~200KB)
- Better cache utilization

### 3.3 Caching Strategy

**Layer 1: Query Result Cache (Redis)**
```typescript
// Cache key: element combination + gender
const cacheKey = `chars:${favorableElements.join('-')}:${gender || 'any'}`;
const ttl = 3600; // 1 hour

// Check cache
let characters = await redis.get(cacheKey);
if (!characters) {
  characters = await prisma.hanjaDict.findMany({...});
  await redis.setex(cacheKey, ttl, JSON.stringify(characters));
}

// Expected cache hit rate: 40-60% (common element combinations)
// Performance improvement: 50-100ms → <5ms (95% faster)
```

**Layer 2: Stroke Range Cache (In-Memory)**
```typescript
// Pre-compute auspicious stroke ranges per lastName
const strokeRangeCache = new Map<number, StrokeRange[]>();

function getAuspiciousRanges(lastNameStrokes: number): StrokeRange[] {
  if (!strokeRangeCache.has(lastNameStrokes)) {
    strokeRangeCache.set(
      lastNameStrokes,
      calculateAuspiciousRanges(lastNameStrokes)
    );
  }
  return strokeRangeCache.get(lastNameStrokes)!;
}

// Expected cache hit rate: 90%+ (100 common last name strokes)
// Performance improvement: 10-20ms → <1ms (95% faster)
```

---

## 4. Early Termination Logic

### 4.1 When to Stop Generating

**Early Termination Criteria**:
```typescript
interface TerminationCriteria {
  // Quality threshold
  minHighScoreCandidates: number;   // Stop if we have 150+ candidates with score > 80
  minAcceptableCandidates: number;  // Stop if we have 500+ candidates with score > 70

  // Resource limits
  maxCandidatesGenerated: number;   // Absolute limit: 2,000 candidates
  maxGenerationTime: number;        // Timeout: 2 seconds

  // Quality gates
  minQuickScoreToConsider: number;  // Only score candidates with quickScore > 65
}

const DEFAULT_TERMINATION: TerminationCriteria = {
  minHighScoreCandidates: 150,
  minAcceptableCandidates: 500,
  maxCandidatesGenerated: 2000,
  maxGenerationTime: 2000, // 2 seconds
  minQuickScoreToConsider: 65,
};
```

**Implementation**:
```typescript
async function generateCandidatesWithEarlyTermination(
  characters: HanjaDict[],
  sajuResult: SajuResult,
  criteria: TerminationCriteria
): Promise<NameCandidate[]> {

  const candidates: NameCandidate[] = [];
  const startTime = Date.now();

  const generator = generateCombinations(characters, criteria.maxCandidatesGenerated);

  for (const candidate of generator) {
    // Quick-score filter
    const quickScoreValue = quickScore(candidate, sajuResult);
    if (quickScoreValue < criteria.minQuickScoreToConsider) {
      continue;
    }

    candidate.quickScore = quickScoreValue;
    candidates.push(candidate);

    // Check termination every 100 candidates (performance optimization)
    if (candidates.length % 100 === 0) {
      // Time limit check
      if (Date.now() - startTime > criteria.maxGenerationTime) {
        console.log('[EARLY_TERM] Time limit reached');
        break;
      }

      // Quality threshold check (requires sampling)
      if (candidates.length >= 500) {
        const sample = candidates.slice(-200); // Check last 200
        const highScoreCount = sample.filter(c => c.quickScore > 80).length;
        const acceptableCount = sample.filter(c => c.quickScore > 70).length;

        // Extrapolate to full set
        const estimatedHighScore = (highScoreCount / 200) * candidates.length;
        const estimatedAcceptable = (acceptableCount / 200) * candidates.length;

        if (estimatedHighScore >= criteria.minHighScoreCandidates ||
            estimatedAcceptable >= criteria.minAcceptableCandidates) {
          console.log(`[EARLY_TERM] Quality threshold met: ${candidates.length} candidates`);
          break;
        }
      }

      // Absolute limit check
      if (candidates.length >= criteria.maxCandidatesGenerated) {
        console.log('[EARLY_TERM] Max candidates reached');
        break;
      }
    }
  }

  return candidates;
}
```

### 4.2 Quick-Score Heuristics

**Purpose**: Fast pre-filtering before expensive full scoring

**Quick-Score Performance**:
```
Per-candidate cost: ~0.05ms (40x faster than full scoring)
1,500 candidates: 75ms (vs 3,000ms for full scoring)
Savings: 97.5%
```

**Accuracy**: Quick-score should correlate >0.7 with full score
```typescript
// Validation during development
const quickScoreAccuracy = candidates.map(c => ({
  quick: quickScore(c, saju),
  full: await fullScore(c, saju),
}));

const correlation = calculatePearsonCorrelation(
  quickScoreAccuracy.map(a => a.quick),
  quickScoreAccuracy.map(a => a.full)
);

console.log(`Quick-score correlation: ${correlation}`);
// Target: correlation > 0.7
```

### 4.3 Batch Sizing for Scoring

**Optimal Batch Size Analysis**:
```typescript
// Batch size = Number of candidates scored in parallel
const BATCH_SIZES = [50, 100, 200, 500];

for (const batchSize of BATCH_SIZES) {
  const start = Date.now();

  for (let i = 0; i < 1000; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    await Promise.all(batch.map(c => scoreCandidate(c, context)));
  }

  const duration = Date.now() - start;
  console.log(`Batch size ${batchSize}: ${duration}ms`);
}

// Expected results:
// Batch size 50:  2500ms (50 batches × 50ms overhead)
// Batch size 100: 2100ms (10 batches × 10ms overhead) ← OPTIMAL
// Batch size 200: 2000ms (5 batches × 0ms overhead, but memory pressure)
// Batch size 500: 2200ms (2 batches, memory thrashing)
```

**Recommendation**: Batch size = **100 candidates**
- Balances parallelism and memory usage
- ~10 batches for 1,000 candidates
- Total scoring time: ~2 seconds

---

## 5. Memory vs Speed Tradeoffs

### 5.1 Generator Pattern vs Array Buffering

**Option A: Generator Pattern (RECOMMENDED for Stage 3)**
```typescript
function* generateCombinations(
  characters: HanjaDict[]
): Generator<NameCandidate> {
  for (const char1 of characters) {
    for (const char2 of characters) {
      yield createCandidate(char1, char2);
    }
  }
}

// Usage
const generator = generateCombinations(characters);
for (const candidate of generator) {
  if (shouldTerminateEarly(candidate)) break;
  processPair(candidate);
}

// Pros:
// - Constant memory: O(1) for iteration state
// - Early termination saves CPU
// - No upfront allocation cost

// Cons:
// - Cannot shuffle or reorder
// - No random access
// - Slightly slower per-iteration (~5% overhead)
```

**Option B: Array Buffering**
```typescript
function generateAllCombinations(
  characters: HanjaDict[]
): NameCandidate[] {
  const pairs: NameCandidate[] = [];

  for (const char1 of characters) {
    for (const char2 of characters) {
      pairs.push(createCandidate(char1, char2));
    }
  }

  return pairs; // 300² = 90,000 pairs × 1KB/pair = 90MB
}

// Pros:
// - Can sort, shuffle, random access
// - Slightly faster iteration
// - Can process in parallel batches

// Cons:
// - High memory usage: O(n²) space
// - Slower startup (must generate all upfront)
// - No early termination savings
```

**Memory Comparison**:
```
Scenario: 400 characters → 160,000 combinations

Generator Pattern:
- Memory: ~50KB (iteration state + current candidate)
- Startup: 0ms
- Early termination: Stops immediately

Array Buffering:
- Memory: ~160MB (160,000 × 1KB per candidate object)
- Startup: 200-300ms (generate all pairs)
- Early termination: No savings (already generated)
```

**Recommendation**:
- **Stage 3 (Combination Generation)**: Use **Generator Pattern**
  - Early termination saves both memory and CPU
  - Constant memory footprint
  - Progressive processing

- **Stage 4 (Scoring)**: Use **Array Buffering** for batches
  - Process 100 candidates at a time
  - Allows parallel scoring with `Promise.all()`
  - Memory: ~100KB per batch (acceptable)

### 5.2 Materialization Strategy

```typescript
// Hybrid approach: Stream + batch
async function generateAndScoreCandidates(
  characters: HanjaDict[],
  sajuResult: SajuResult
): Promise<ScoredCandidate[]> {

  const scoredCandidates: ScoredCandidate[] = [];
  const batchSize = 100;
  let batch: NameCandidate[] = [];

  const generator = generateCombinations(characters);

  for (const candidate of generator) {
    // Quick-score filter
    if (quickScore(candidate, sajuResult) < 65) continue;

    batch.push(candidate);

    // Process batch when full
    if (batch.length >= batchSize) {
      const scored = await scoreBatch(batch, sajuResult);
      scoredCandidates.push(...scored);
      batch = []; // Clear batch

      // Early termination check
      if (shouldTerminate(scoredCandidates)) break;
    }
  }

  // Process remaining partial batch
  if (batch.length > 0) {
    const scored = await scoreBatch(batch, sajuResult);
    scoredCandidates.push(...scored);
  }

  return scoredCandidates;
}
```

### 5.3 Caching Strategy

**What to Cache**:
```typescript
// Layer 1: Element-filtered characters (Redis, 1 hour TTL)
interface ElementCacheEntry {
  key: string; // `chars:${elements}:${gender}`
  value: HanjaDict[];
  size: ~200KB;
  ttl: 3600;
  hitRate: 40-60%;
}

// Layer 2: Auspicious stroke ranges (In-memory, indefinite)
interface StrokeRangeCacheEntry {
  key: number; // lastNameStrokes
  value: StrokeRange[];
  size: ~5KB per entry;
  maxEntries: 100; // LRU eviction
  hitRate: 90%+;
}

// Layer 3: Full scoring results (Redis, 30 min TTL)
interface ScoringCacheEntry {
  key: string; // `naming:${sajuHash}:${lastName}:${gender}`
  value: ScoredCandidate[];
  size: ~1MB;
  ttl: 1800;
  hitRate: 10-20%;
}
```

**Cache Size Estimation**:
```
Redis Memory Usage:
- Element cache: 50 entries × 200KB = 10MB
- Scoring cache: 100 entries × 1MB = 100MB
- Total: ~110MB (well within typical limits)

In-Memory Cache:
- Stroke ranges: 100 entries × 5KB = 500KB
- Minimal impact on Node.js heap
```

---

## 6. Performance Bottleneck Analysis

### 6.1 Bottleneck Identification

**Predicted Bottlenecks** (in order of severity):

1. **Stage 4: Scoring (1.5-2.5s)** - CRITICAL PATH
   - Numerology scorer: ~0.8ms per candidate (81수리 lookup)
   - Meaning scorer: ~0.4ms (semantic analysis)
   - Total: ~2ms × 1,000 = 2,000ms

2. **Stage 1: Database Query (50-100ms)** - IMPORTANT
   - PostgreSQL query with composite index
   - Network latency: ~10-20ms
   - Query execution: ~30-80ms

3. **Stage 3: Combination Generation (50-100ms)** - MINOR
   - CPU-bound nested loops
   - Quick-score filtering
   - Generator overhead

4. **Stage 2: Stroke Filtering (10-20ms)** - NEGLIGIBLE
   - In-memory filtering
   - Simple arithmetic operations

### 6.2 Optimization Priorities

**Priority 1: Optimize Scoring Pipeline (MUST)**
```typescript
// BEFORE: Sequential scoring
for (const candidate of candidates) {
  const scores = {
    element: await elementScorer.score(candidate, context),
    yinyang: await yinyangScorer.score(candidate, context),
    numerology: await numerologyScorer.score(candidate, context),
    meaning: await meaningScorer.score(candidate, context),
  };
}
// Time: 1,000 × (0.5 + 0.3 + 0.8 + 0.4) = 2,000ms

// AFTER: Parallel scoring within candidate
const scores = await Promise.all([
  elementScorer.score(candidate, context),
  yinyangScorer.score(candidate, context),
  numerologyScorer.score(candidate, context),
  meaningScorer.score(candidate, context),
]);
// Time: 1,000 × max(0.5, 0.3, 0.8, 0.4) = 1,000 × 0.8 = 800ms
// Improvement: 60% faster
```

**Priority 2: Database Query Optimization (SHOULD)**
```typescript
// BEFORE: No caching
const characters = await prisma.hanjaDict.findMany({...});
// Time: 50-100ms every request

// AFTER: Redis caching
const cacheKey = generateCacheKey(elements, gender);
let characters = await redis.get(cacheKey);
if (!characters) {
  characters = await prisma.hanjaDict.findMany({...});
  await redis.setex(cacheKey, 3600, JSON.stringify(characters));
}
// Time: <5ms (cache hit), 50-100ms (cache miss)
// Improvement: 95% faster on cache hits
```

**Priority 3: Batch Processing (SHOULD)**
```typescript
// Process scoring in batches to maximize parallelism
async function scoreBatch(
  candidates: NameCandidate[],
  context: ScoringContext
): Promise<ScoredCandidate[]> {
  return Promise.all(
    candidates.map(candidate => scoreCandidate(candidate, context))
  );
}

// Usage
const batchSize = 100;
for (let i = 0; i < candidates.length; i += batchSize) {
  const batch = candidates.slice(i, i + batchSize);
  const scored = await scoreBatch(batch, context);
  results.push(...scored);
}
```

### 6.3 Measurement Strategy

**Instrumentation**:
```typescript
class PerformanceTracker {
  private metrics = new Map<string, number[]>();

  async track<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    if (duration > 1000) {
      console.warn(`[SLOW] ${label} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}

// Usage
const perf = new PerformanceTracker();

const candidates = await perf.track('total-generation', async () => {
  const chars = await perf.track('stage1-db-query', () =>
    fetchCharactersByElement(favorableElements)
  );

  const filtered = await perf.track('stage2-stroke-filter', () =>
    filterByStrokes(chars, lastNameStrokes)
  );

  const pairs = await perf.track('stage3-combination', () =>
    generateCombinations(filtered)
  );

  return await perf.track('stage4-scoring', () =>
    scoreCandidates(pairs, context)
  );
});

console.log('Performance Stats:', {
  total: perf.getStats('total-generation'),
  stage1: perf.getStats('stage1-db-query'),
  stage2: perf.getStats('stage2-stroke-filter'),
  stage3: perf.getStats('stage3-combination'),
  stage4: perf.getStats('stage4-scoring'),
});
```

---

## 7. Implementation Algorithm

### 7.1 Complete Algorithm Pseudocode

```typescript
/**
 * Main entry point: Generate optimal name candidates
 */
async function generateNameCandidates(input: NamingInput): Promise<ScoredCandidate[]> {
  const perf = new PerformanceTracker();

  // ========================================
  // STAGE 1: Element-Based Filtering (DB)
  // ========================================
  const characters = await perf.track('stage1', async () => {
    // Determine favorable elements from saju
    const favorableElements = determineFavorableElements(input.sajuResult);

    // Check cache
    const cacheKey = `chars:${favorableElements.join('-')}:${input.gender || 'any'}`;
    let chars = await redis.get(cacheKey);

    if (!chars) {
      // Query database with composite index
      chars = await prisma.hanjaDict.findMany({
        where: {
          element: { in: favorableElements },
          isGoodForNaming: true,
          gender: input.gender || undefined,
        },
        orderBy: [
          { nameFrequency: 'desc' },
          { usageFrequency: 'desc' },
        ],
        take: 1000,
      });

      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(chars));
    }

    return chars; // ~600-800 characters
  });

  console.log(`[STAGE1] Filtered to ${characters.length} characters`);

  // ========================================
  // STAGE 2: Stroke-Based Filtering (CPU)
  // ========================================
  const strokeFiltered = await perf.track('stage2', async () => {
    // Get or compute auspicious stroke ranges
    const lastNameStrokes = getLastNameStrokes(input.lastName);
    const auspiciousRanges = getAuspiciousStrokeRanges(lastNameStrokes);

    // Filter characters that can form auspicious grids
    return characters.filter(char => {
      const potential = countAuspiciousGridPotential(
        char.strokes,
        lastNameStrokes,
        auspiciousRanges
      );
      return potential >= 2; // At least 2 out of 4 grids
    });
  });

  console.log(`[STAGE2] Stroke-filtered to ${strokeFiltered.length} characters`);

  // ========================================
  // STAGE 3: Combination Generation (CPU)
  // ========================================
  const candidates = await perf.track('stage3', async () => {
    const pairs: NameCandidate[] = [];
    const generator = generateCombinations(strokeFiltered);

    for (const candidate of generator) {
      // Quick-score pre-filter
      const quickScoreValue = quickScore(candidate, input.sajuResult);

      if (quickScoreValue >= 65) { // Threshold
        candidate.quickScore = quickScoreValue;
        pairs.push(candidate);
      }

      // Early termination checks (every 100 candidates)
      if (pairs.length % 100 === 0 && shouldTerminateEarly(pairs)) {
        console.log(`[STAGE3] Early termination at ${pairs.length} candidates`);
        break;
      }

      // Absolute limit
      if (pairs.length >= 2000) {
        console.log('[STAGE3] Max candidates reached');
        break;
      }
    }

    return pairs;
  });

  console.log(`[STAGE3] Generated ${candidates.length} candidate pairs`);

  // ========================================
  // STAGE 4: Full Scoring (CPU, Parallel)
  // ========================================
  const scoredCandidates = await perf.track('stage4', async () => {
    const results: ScoredCandidate[] = [];
    const batchSize = 100;

    const context = buildScoringContext(input);

    // Process in batches for parallelism
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);

      const scoredBatch = await Promise.all(
        batch.map(candidate => scoreCandidate(candidate, context))
      );

      results.push(...scoredBatch);
    }

    return results;
  });

  console.log(`[STAGE4] Scored ${scoredCandidates.length} candidates`);

  // ========================================
  // STAGE 5: Ranking & Selection
  // ========================================
  const topCandidates = scoredCandidates
    .sort((a, b) => b.scores.overall - a.scores.overall)
    .slice(0, 1000);

  // Log performance stats
  console.log('[PERFORMANCE]', {
    stage1: perf.getStats('stage1'),
    stage2: perf.getStats('stage2'),
    stage3: perf.getStats('stage3'),
    stage4: perf.getStats('stage4'),
    total: perf.getStats('stage1')!.avg +
           perf.getStats('stage2')!.avg +
           perf.getStats('stage3')!.avg +
           perf.getStats('stage4')!.avg,
  });

  return topCandidates;
}

/**
 * Score a single candidate with all 4 scorers in parallel
 */
async function scoreCandidate(
  candidate: NameCandidate,
  context: ScoringContext
): Promise<ScoredCandidate> {

  // Run all scorers in parallel
  const [elementScore, yinyangScore, numerologyScore, meaningScore] =
    await Promise.all([
      new ElementScorer().score(candidate, context),
      new YinYangScorer().score(candidate, context),
      new NumerologyScorer().score(candidate, context),
      new MeaningScorer().score(candidate, context),
    ]);

  // Calculate weighted overall score
  const overall =
    elementScore.weightedScore +
    yinyangScore.weightedScore +
    numerologyScore.weightedScore +
    meaningScore.weightedScore;

  return {
    ...candidate,
    scores: {
      overall,
      elementHarmony: elementScore,
      yinYangBalance: yinyangScore,
      numerology: numerologyScore,
      meaningHarmony: meaningScore,
    },
  };
}
```

### 7.2 Helper Functions

```typescript
/**
 * Determine favorable elements from saju analysis
 */
function determineFavorableElements(saju: SajuResult): Element[] {
  const priorities: Element[] = [];

  // Priority 1: Primary yongsin
  priorities.push(saju.yongsin.primary);

  // Priority 2: Producing element (상생)
  const producing = getProducingElement(saju.yongsin.primary);
  if (!priorities.includes(producing)) {
    priorities.push(producing);
  }

  // Priority 3: Lacking elements (if compatible)
  for (const lacking of saju.lackingElements) {
    if (!priorities.includes(lacking) &&
        !isControlledBy(lacking, saju.yongsin.primary)) {
      priorities.push(lacking);
    }
  }

  // Priority 4: Secondary yongsin
  if (saju.yongsin.secondary &&
      !priorities.includes(saju.yongsin.secondary)) {
    priorities.push(saju.yongsin.secondary);
  }

  return priorities.slice(0, 3); // Max 3 elements for query performance
}

/**
 * Get auspicious stroke ranges for given last name
 */
function getAuspiciousStrokeRanges(lastNameStrokes: number): StrokeRange[] {
  // Check in-memory cache
  if (strokeRangeCache.has(lastNameStrokes)) {
    return strokeRangeCache.get(lastNameStrokes)!;
  }

  // Calculate ranges
  const ranges: StrokeRange[] = [];

  for (const auspicious of AUSPICIOUS_NUMBERS) {
    const mod81 = auspicious % 81 || 81;

    // For each grid, calculate stroke requirements
    // Example: hyeongGyeok = lastName + char1
    for (let multiplier = 0; multiplier <= 2; multiplier++) {
      const target = mod81 + (multiplier * 81);
      const charStrokes = target - lastNameStrokes;

      if (charStrokes >= 1 && charStrokes <= 30) {
        ranges.push({
          strokes: charStrokes,
          gridType: 'hyeongGyeok',
          targetNumber: target,
        });
      }
    }
  }

  // Cache and return
  strokeRangeCache.set(lastNameStrokes, ranges);
  return ranges;
}

/**
 * Count how many grids this character can make auspicious
 */
function countAuspiciousGridPotential(
  charStrokes: number,
  lastNameStrokes: number,
  ranges: StrokeRange[]
): number {
  let count = 0;

  // Check each grid type
  const grids = {
    hyeongGyeok: lastNameStrokes + charStrokes,
    jeongGyeok: lastNameStrokes + charStrokes,
    // wonGyeok and iGyeok depend on both characters, check later
  };

  for (const [gridType, totalStrokes] of Object.entries(grids)) {
    const mod81 = totalStrokes % 81 || 81;
    if (AUSPICIOUS_NUMBERS.includes(mod81)) {
      count++;
    }
  }

  return count;
}

/**
 * Quick heuristic scoring
 */
function quickScore(candidate: NameCandidate, saju: SajuResult): number {
  let score = 50;

  // Element diversity: +20
  if (candidate.char1.element !== candidate.char2.element) {
    score += 20;
  }

  // Favorable element: +15
  const hasFavorable =
    saju.favorableElements.includes(candidate.char1.element) ||
    saju.favorableElements.includes(candidate.char2.element);
  if (hasFavorable) {
    score += 15;
  }

  // Yin-yang balance: +10
  if (candidate.char1.yinYang !== candidate.char2.yinYang) {
    score += 10;
  }

  // Popularity: +5
  const avgPopularity =
    (candidate.char1.nameFrequency + candidate.char2.nameFrequency) / 2;
  score += Math.min(5, avgPopularity / 100);

  return score;
}

/**
 * Early termination logic
 */
function shouldTerminateEarly(candidates: NameCandidate[]): boolean {
  if (candidates.length < 500) return false;

  // Sample last 200 candidates
  const sample = candidates.slice(-200);
  const highScoreCount = sample.filter(c => c.quickScore > 80).length;

  // Extrapolate to full set
  const estimatedHighScore = (highScoreCount / 200) * candidates.length;

  return estimatedHighScore >= 150; // 150+ high-quality candidates
}
```

---

## 8. Performance Validation

### 8.1 Expected Performance Profile

**Cold Request** (no cache):
```
Stage 1 (DB Query):        80ms
Stage 2 (Stroke Filter):   15ms
Stage 3 (Combination):     75ms
Stage 4 (Scoring):      2,000ms
Total:                  2,170ms (< 3 seconds) ✓
```

**Warm Request** (partial cache):
```
Stage 1 (Cached):           5ms
Stage 2 (Stroke Filter):   15ms
Stage 3 (Combination):     75ms
Stage 4 (Scoring):      2,000ms
Total:                  2,095ms (< 3 seconds) ✓
```

**Hot Request** (full cache):
```
All stages cached:        <10ms
Total:                    <10ms ✓
```

### 8.2 Performance Benchmarks

**Test Cases**:
```typescript
const testCases = [
  {
    name: 'Common saju (water yongsin)',
    sajuResult: createSaju({ yongsin: Element.WATER }),
    lastName: '김',
    expectedTime: 2500,
  },
  {
    name: 'Complex saju (multiple lacking elements)',
    sajuResult: createSaju({
      yongsin: Element.WOOD,
      lacking: [Element.WATER, Element.FIRE]
    }),
    lastName: '이',
    expectedTime: 3000,
  },
  {
    name: 'Edge case (single yongsin)',
    sajuResult: createSaju({
      yongsin: Element.EARTH,
      lacking: []
    }),
    lastName: '박',
    expectedTime: 2000,
  },
];

for (const testCase of testCases) {
  const start = Date.now();
  const candidates = await generateNameCandidates({
    sajuResult: testCase.sajuResult,
    lastName: testCase.lastName,
    lastNameHanja: getHanja(testCase.lastName),
  });
  const duration = Date.now() - start;

  console.log(`${testCase.name}:`, {
    duration: `${duration}ms`,
    candidates: candidates.length,
    avgScore: candidates.reduce((sum, c) => sum + c.scores.overall, 0) / candidates.length,
    pass: duration < testCase.expectedTime,
  });
}
```

### 8.3 Quality Metrics

**Target Metrics**:
```typescript
interface QualityMetrics {
  // Performance
  p50ResponseTime: number;      // Target: <2,000ms
  p95ResponseTime: number;      // Target: <3,500ms
  p99ResponseTime: number;      // Target: <5,000ms

  // Quality
  avgScore: number;             // Target: >75
  highScoreRate: number;        // Target: >15% with score >85
  validCandidates: number;      // Target: 1,000

  // Efficiency
  dbQueryTime: number;          // Target: <100ms
  cacheHitRate: number;         // Target: >50%
  earlyTerminationRate: number; // Target: >30%
}
```

### 8.4 Stress Testing

**Concurrent Users Test**:
```typescript
async function stressTest(concurrentUsers: number) {
  const promises = [];

  for (let i = 0; i < concurrentUsers; i++) {
    promises.push(
      generateNameCandidates(createRandomInput())
    );
  }

  const start = Date.now();
  const results = await Promise.all(promises);
  const duration = Date.now() - start;

  console.log(`Stress test (${concurrentUsers} users):`, {
    totalTime: `${duration}ms`,
    avgTime: `${duration / concurrentUsers}ms`,
    throughput: `${concurrentUsers / (duration / 1000)} req/s`,
  });
}

// Run stress tests
await stressTest(10);   // Expected: <3s avg
await stressTest(50);   // Expected: <5s avg
await stressTest(100);  // Expected: <8s avg
```

---

## 9. Implementation Recommendations

### 9.1 High-Priority Optimizations

1. **Composite Index Verification** (Day 1)
   - Verify `idx_element_naming` exists and is used
   - Run `EXPLAIN ANALYZE` on element query
   - Target: <100ms query time

2. **Parallel Scoring Implementation** (Day 1)
   - Implement `Promise.all()` for 4 scorers
   - Test scoring performance on 100 candidates
   - Target: <200ms for 100 candidates

3. **Redis Caching Setup** (Day 2)
   - Implement element-based character cache
   - Set 1-hour TTL
   - Monitor cache hit rate
   - Target: >40% hit rate

4. **Quick-Score Heuristic** (Day 2)
   - Implement fast pre-filter
   - Validate correlation with full score
   - Target: >0.7 correlation

### 9.2 Medium-Priority Optimizations

5. **Stroke Range Caching** (Day 3)
   - Implement in-memory LRU cache
   - Cache 100 most common last name strokes
   - Target: >90% hit rate

6. **Early Termination Logic** (Day 3)
   - Implement quality threshold checks
   - Monitor termination rate
   - Target: >30% early termination

7. **Batch Processing** (Day 4)
   - Implement batch size = 100
   - Test different batch sizes
   - Measure throughput improvement

### 9.3 Low-Priority Optimizations

8. **Generator Pattern** (Day 5)
   - Refactor combination generation
   - Benchmark memory usage
   - Compare with array buffering

9. **Performance Monitoring** (Day 5)
   - Implement PerformanceTracker class
   - Add metrics collection
   - Create performance dashboard

10. **Load Testing** (Week 2)
    - Test with 100 concurrent users
    - Identify bottlenecks at scale
    - Optimize as needed

---

## 10. Conclusion

### Key Takeaways

1. **Filtering is Critical**: 3-stage funnel reduces 77M combinations to 1,500 candidates (99.998% reduction)

2. **Database Optimization**: Composite index `[element, isGoodForNaming]` is essential for <100ms queries

3. **Parallel Scoring**: Running 4 scorers in parallel reduces scoring time by 60%

4. **Caching Strategy**: Multi-layer caching (Redis + in-memory) provides 40-90% hit rates

5. **Early Termination**: Quick-score heuristic saves 30%+ of generation time

### Expected Performance

**Cold Request** (first-time user):
- Total time: ~2.5 seconds
- Candidates: 1,000
- Average score: 76-78

**Warm Request** (cached elements):
- Total time: ~2.1 seconds
- Candidates: 1,000
- Average score: 76-78

**Hot Request** (fully cached):
- Total time: <500ms
- Candidates: 1,000 (cached results)

### Next Steps

1. **Phase 1**: Implement core algorithm (Stages 1-4)
2. **Phase 2**: Add caching and optimization
3. **Phase 3**: Performance testing and tuning
4. **Phase 4**: Production deployment with monitoring

---

**Document Status**: Ready for Implementation
**Confidence Level**: High (90%+)
**Review Required**: Yes (before Phase 1 implementation)
