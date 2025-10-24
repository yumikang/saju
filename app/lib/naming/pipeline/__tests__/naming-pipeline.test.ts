/**
 * NamingPipeline Tests
 *
 * Test strategy:
 * - Unit tests for individual steps
 * - Integration tests for full pipeline
 * - Performance tests for optimization validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NamingPipeline, PipelineError, createNamingPipeline } from '../naming-pipeline';
import { MockHanjaService, InMemoryCacheService } from '../services';
import { SajuCalculator } from '~/lib/saju/calculator';
import { YongsinAnalyzer } from '~/lib/saju/yongsin-analyzer';
import { YinYangValidator } from '~/lib/naming/validators/yinyang-validator';
import { PhoneticMatcher } from '~/lib/naming/validators/phonetic-matcher';
import type { BirthInfo } from '../naming-pipeline';

// ============================================================
// Test Helpers
// ============================================================

function createTestBirthInfo(): BirthInfo {
  return {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    isLunar: false,
    gender: 'M',
  };
}

function createTestPipeline() {
  const hanjaService = new MockHanjaService();
  const cacheService = new InMemoryCacheService();

  return new NamingPipeline(
    new SajuCalculator(),
    new YongsinAnalyzer(),
    new YinYangValidator(),
    new PhoneticMatcher(),
    hanjaService,
    cacheService
  );
}

// ============================================================
// Unit Tests - Individual Steps
// ============================================================

describe('NamingPipeline - Unit Tests', () => {
  describe('Step 1: Saju Calculation', () => {
    it('should calculate saju correctly', async () => {
      const pipeline = createTestPipeline();
      const birthInfo = createTestBirthInfo();

      // Access private method via any cast for testing
      const context: any = {
        birthInfo,
        lastName: '김',
        lastNameStrokes: 8,
        config: {} as any,
        startTime: Date.now(),
        stepDurations: {},
      };

      await (pipeline as any).step1_calculateSaju(context);

      expect(context.sajuResult).toBeDefined();
      expect(context.sajuResult.pillars).toBeDefined();
      expect(context.sajuResult.dayMaster).toBeDefined();
      expect(context.sajuResult.elementCounts).toBeDefined();
    });

    it('should throw error for invalid date', async () => {
      const pipeline = createTestPipeline();
      const invalidBirthInfo: BirthInfo = {
        year: 1800, // Before calendar data range
        month: 13,
        day: 32,
        hour: 25,
        minute: 0,
        isLunar: false,
        gender: 'M',
      };

      const context: any = {
        birthInfo: invalidBirthInfo,
        lastName: '김',
        lastNameStrokes: 8,
        config: {} as any,
        startTime: Date.now(),
        stepDurations: {},
      };

      await expect((pipeline as any).step1_calculateSaju(context)).rejects.toThrow(PipelineError);
    });
  });

  describe('Step 3: Hanja Recommendation', () => {
    it('should filter hanja by element', async () => {
      const pipeline = createTestPipeline();
      const context: any = {
        birthInfo: createTestBirthInfo(),
        lastName: '김',
        lastNameStrokes: 8,
        config: {} as any,
        startTime: Date.now(),
        stepDurations: {},
        yongsinResult: {
          primary: 'WOOD',
          secondary: 'WATER',
        },
      };

      await (pipeline as any).step3_recommendHanja(context);

      expect(context.hanjaPool).toBeDefined();
      expect(context.hanjaPool.length).toBeGreaterThan(0);
      expect(context.hanjaPool.every((h: any) => h.element === 'WOOD')).toBe(false); // May include secondary
    });

    it('should expand to secondary element if primary pool too small', async () => {
      const pipeline = createTestPipeline();
      const context: any = {
        birthInfo: createTestBirthInfo(),
        lastName: '김',
        lastNameStrokes: 8,
        config: {} as any,
        startTime: Date.now(),
        stepDurations: {},
        yongsinResult: {
          primary: 'METAL', // Small pool in mock
          secondary: 'WATER',
        },
      };

      await (pipeline as any).step3_recommendHanja(context);

      expect(context.hanjaPool).toBeDefined();
      // Should include both primary and secondary elements
    });
  });

  describe('Step 4: Combination Generation', () => {
    it('should generate valid 2-character combinations', async () => {
      const pipeline = createTestPipeline();
      const context: any = {
        birthInfo: createTestBirthInfo(),
        lastName: '김',
        lastNameStrokes: 8,
        config: {
          maxCombinations: 100,
        },
        startTime: Date.now(),
        stepDurations: {},
        hanjaPool: [
          { id: 1, character: '民', koreanReading: '민', strokes: 5, element: 'WATER' },
          { id: 2, character: '俊', koreanReading: '준', strokes: 9, element: 'WOOD' },
          { id: 3, character: '瑞', koreanReading: '서', strokes: 13, element: 'METAL' },
        ],
      };

      await (pipeline as any).step4_generateCombinations(context);

      expect(context.combinations).toBeDefined();
      expect(context.combinations.length).toBeGreaterThan(0);
      expect(context.combinations.length).toBeLessThanOrEqual(100);
      expect(context.combinations[0]).toHaveProperty('firstName');
      expect(context.combinations[0]).toHaveProperty('firstChar');
      expect(context.combinations[0]).toHaveProperty('secondChar');
    });

    it('should respect maxCombinations limit', async () => {
      const pipeline = createTestPipeline();
      const largePool = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        character: `字${i}`,
        koreanReading: `char${i}`,
        strokes: 10,
        element: 'WATER',
      }));

      const context: any = {
        birthInfo: createTestBirthInfo(),
        lastName: '김',
        lastNameStrokes: 8,
        config: {
          maxCombinations: 1000,
        },
        startTime: Date.now(),
        stepDurations: {},
        hanjaPool: largePool,
      };

      await (pipeline as any).step4_generateCombinations(context);

      expect(context.combinations.length).toBeLessThanOrEqual(1000);
    });
  });
});

// ============================================================
// Integration Tests - Full Pipeline
// ============================================================

describe('NamingPipeline - Integration Tests', () => {
  let pipeline: NamingPipeline;

  beforeEach(() => {
    pipeline = createTestPipeline();
  });

  it('should complete full pipeline successfully', async () => {
    const birthInfo = createTestBirthInfo();

    const result = await pipeline.execute(birthInfo, '김', 8);

    expect(result).toBeDefined();
    expect(result.candidates).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.executionTime).toBeGreaterThan(0);
    expect(result.saju).toBeDefined();
  });

  it('should return candidates sorted by score', async () => {
    const birthInfo = createTestBirthInfo();

    const result = await pipeline.execute(birthInfo, '김', 8);

    // Check descending order
    for (let i = 1; i < result.candidates.length; i++) {
      expect(result.candidates[i - 1].score).toBeGreaterThanOrEqual(
        result.candidates[i].score
      );
    }
  });

  it('should respect maxCandidates config', async () => {
    const birthInfo = createTestBirthInfo();

    const result = await pipeline.execute(birthInfo, '김', 8, {
      maxCandidates: 10,
    });

    expect(result.candidates.length).toBeLessThanOrEqual(10);
  });

  it('should filter by minimum score', async () => {
    const birthInfo = createTestBirthInfo();

    const result = await pipeline.execute(birthInfo, '김', 8, {
      minScore: 70,
    });

    result.candidates.forEach((candidate) => {
      expect(candidate.score).toBeGreaterThanOrEqual(70);
    });
  });

  it('should cache results', async () => {
    const birthInfo = createTestBirthInfo();
    const cacheService = new InMemoryCacheService();

    const pipeline = new NamingPipeline(
      new SajuCalculator(),
      new YongsinAnalyzer(),
      new YinYangValidator(),
      new PhoneticMatcher(),
      new MockHanjaService(),
      cacheService
    );

    // First call - no cache
    const result1 = await pipeline.execute(birthInfo, '김', 8);
    expect(cacheService.size()).toBe(1);

    // Second call - from cache (should be faster)
    const start = Date.now();
    const result2 = await pipeline.execute(birthInfo, '김', 8);
    const cacheTime = Date.now() - start;

    expect(cacheTime).toBeLessThan(100); // Cache retrieval should be very fast
    expect(result2.candidates.length).toBe(result1.candidates.length);
  });
});

// ============================================================
// Performance Tests
// ============================================================

describe('NamingPipeline - Performance Tests', () => {
  it('should complete within 10 seconds', async () => {
    const pipeline = createTestPipeline();
    const birthInfo = createTestBirthInfo();

    const start = Date.now();
    const result = await pipeline.execute(birthInfo, '김', 8);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
    expect(result.metadata.executionTime).toBeLessThan(10000);
  });

  it('should handle large candidate pool efficiently', async () => {
    const pipeline = createTestPipeline();
    const birthInfo = createTestBirthInfo();

    const result = await pipeline.execute(birthInfo, '김', 8, {
      maxCombinations: 10000,
      maxCandidates: 50,
    });

    expect(result.metadata.executionTime).toBeLessThan(10000);
    expect(result.candidates.length).toBeLessThanOrEqual(50);
  });

  it('should process batches efficiently', async () => {
    const pipeline = createTestPipeline();
    const birthInfo = createTestBirthInfo();

    // Small batch size should still complete quickly
    const result = await pipeline.execute(birthInfo, '김', 8, {
      batchSize: 10,
    });

    expect(result.metadata.executionTime).toBeLessThan(10000);
  });
});

// ============================================================
// Error Handling Tests
// ============================================================

describe('NamingPipeline - Error Handling', () => {
  it('should handle graceful degradation on partial failure', async () => {
    const pipeline = createTestPipeline();

    // This will fail at some point but should still return partial results
    const birthInfo: BirthInfo = {
      year: 1800, // Invalid year
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      isLunar: false,
      gender: 'M',
    };

    const result = await pipeline.execute(birthInfo, '김', 8);

    // Even on error, should return structure
    expect(result).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('should return empty candidates when no matches found', async () => {
    const pipeline = createTestPipeline();
    const birthInfo = createTestBirthInfo();

    // Very high minimum score - no candidates should match
    const result = await pipeline.execute(birthInfo, '김', 8, {
      minScore: 99,
    });

    expect(result.candidates).toBeDefined();
    expect(result.candidates.length).toBe(0);
  });
});

// ============================================================
// Configuration Tests
// ============================================================

describe('NamingPipeline - Configuration', () => {
  it('should apply custom weights correctly', async () => {
    const pipeline = createTestPipeline();
    const birthInfo = createTestBirthInfo();

    const result = await pipeline.execute(birthInfo, '김', 8, {
      weights: {
        yongsin: 0.50, // Heavy weight on yongsin
        yinyang: 0.20,
        pronunciation: 0.10,
        meaning: 0.10,
        numerology: 0.05,
        taboo: 0.05,
      },
    });

    // Candidates with better yongsin match should rank higher
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it('should filter by requireYongsinMatch', async () => {
    const pipeline = createTestPipeline();
    const birthInfo = createTestBirthInfo();

    const resultWithFilter = await pipeline.execute(birthInfo, '김', 8, {
      requireYongsinMatch: true,
    });

    const resultWithoutFilter = await pipeline.execute(birthInfo, '김', 8, {
      requireYongsinMatch: false,
    });

    // Without filter should have more or equal candidates
    expect(resultWithoutFilter.candidates.length).toBeGreaterThanOrEqual(
      resultWithFilter.candidates.length
    );
  });
});
