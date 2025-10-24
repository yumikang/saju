/**
 * Usage Examples for NamingPipeline
 *
 * Demonstrates various usage patterns and integration scenarios
 */

import type { PrismaClient } from '@prisma/client';
import {
  createNamingPipeline,
  createHanjaService,
  createCacheService,
  type BirthInfo,
  type PipelineConfig,
} from './index';

// ============================================================
// Example 1: Basic Usage
// ============================================================

/**
 * Simple name generation
 */
export async function example1_basicUsage(prisma: PrismaClient) {
  console.log('=== Example 1: Basic Usage ===\n');

  // Create pipeline with database backend
  const hanjaService = createHanjaService('database', prisma);
  const cacheService = createCacheService('memory');
  const pipeline = createNamingPipeline(hanjaService, cacheService);

  // Birth information
  const birthInfo: BirthInfo = {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    isLunar: false,
    gender: 'M',
  };

  // Execute pipeline
  const result = await pipeline.execute(
    birthInfo,
    '김', // lastName
    8 // lastNameStrokes
  );

  // Display results
  console.log(`Found ${result.candidates.length} candidates\n`);

  result.candidates.slice(0, 5).forEach((candidate, i) => {
    console.log(`${i + 1}. ${candidate.firstName.join('')} (${candidate.score.toFixed(1)}점)`);
    console.log(`   한자: ${candidate.characters.map((c) => c.character).join('')}`);
    console.log(`   의미: ${candidate.characters.map((c) => c.meaning).join(', ')}`);
    console.log(`   세부 점수:`);
    console.log(`     - 오행: ${candidate.breakdown.element.toFixed(1)}`);
    console.log(`     - 음양: ${candidate.breakdown.yinyang.toFixed(1)}`);
    console.log(`     - 81수리: ${candidate.breakdown.numerology.toFixed(1)}`);
    console.log(`     - 의미: ${candidate.breakdown.meaning.toFixed(1)}`);
    console.log();
  });

  console.log(`Execution time: ${result.metadata.executionTime}ms\n`);
}

// ============================================================
// Example 2: Custom Configuration
// ============================================================

/**
 * Name generation with custom scoring weights
 */
export async function example2_customConfig(prisma: PrismaClient) {
  console.log('=== Example 2: Custom Configuration ===\n');

  const hanjaService = createHanjaService('database', prisma);
  const pipeline = createNamingPipeline(hanjaService);

  const birthInfo: BirthInfo = {
    year: 2024,
    month: 10,
    day: 24,
    hour: 10,
    minute: 30,
    isLunar: false,
    gender: 'F',
  };

  // Custom configuration: prioritize pronunciation
  const config: Partial<PipelineConfig> = {
    maxCandidates: 30,
    weights: {
      yongsin: 0.30, // Reduced from 35%
      yinyang: 0.25,
      pronunciation: 0.30, // Increased from 20%
      meaning: 0.10,
      numerology: 0.03,
      taboo: 0.02,
    },
    minScore: 70, // Higher threshold
    requireYongsinMatch: false, // Allow non-matching
  };

  const result = await pipeline.execute(birthInfo, '이', 7, config);

  console.log(`Configuration:`);
  console.log(`  - Max candidates: 30`);
  console.log(`  - Min score: 70`);
  console.log(`  - Pronunciation weight: 30% (increased)`);
  console.log();

  console.log(`Results: ${result.candidates.length} candidates found\n`);

  // Show top 3 with pronunciation analysis
  result.candidates.slice(0, 3).forEach((candidate, i) => {
    console.log(`${i + 1}. ${candidate.firstName.join('')}`);
    console.log(
      `   발음 점수: ${candidate.breakdown.meaning.toFixed(1)} (전체: ${candidate.score.toFixed(1)})`
    );
    console.log();
  });
}

// ============================================================
// Example 3: Testing with Mock Data
// ============================================================

/**
 * Testing pipeline with mock services
 */
export async function example3_mockTesting() {
  console.log('=== Example 3: Mock Testing ===\n');

  // Use mock services for testing
  const hanjaService = createHanjaService('mock');
  const cacheService = createCacheService('null');
  const pipeline = createNamingPipeline(hanjaService, cacheService);

  const birthInfo: BirthInfo = {
    year: 2000,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    isLunar: false,
    gender: 'M',
  };

  const result = await pipeline.execute(birthInfo, '테스트', 10);

  console.log(`Mock test completed`);
  console.log(`Candidates: ${result.candidates.length}`);
  console.log(`Execution time: ${result.metadata.executionTime}ms`);
  console.log();
}

// ============================================================
// Example 4: Batch Processing
// ============================================================

/**
 * Generate names for multiple birth dates
 */
export async function example4_batchProcessing(prisma: PrismaClient) {
  console.log('=== Example 4: Batch Processing ===\n');

  const hanjaService = createHanjaService('database', prisma);
  const cacheService = createCacheService('memory');
  const pipeline = createNamingPipeline(hanjaService, cacheService);

  const requests: Array<{ birthInfo: BirthInfo; lastName: string; strokes: number }> = [
    {
      birthInfo: {
        year: 2024,
        month: 1,
        day: 15,
        hour: 10,
        minute: 0,
        isLunar: false,
        gender: 'M',
      },
      lastName: '김',
      strokes: 8,
    },
    {
      birthInfo: {
        year: 2024,
        month: 6,
        day: 20,
        hour: 14,
        minute: 30,
        isLunar: false,
        gender: 'F',
      },
      lastName: '이',
      strokes: 7,
    },
    {
      birthInfo: {
        year: 2024,
        month: 12,
        day: 25,
        hour: 18,
        minute: 45,
        isLunar: false,
        gender: 'M',
      },
      lastName: '박',
      strokes: 5,
    },
  ];

  console.log(`Processing ${requests.length} requests...\n`);

  const results = await Promise.all(
    requests.map((req) => pipeline.execute(req.birthInfo, req.lastName, req.strokes))
  );

  results.forEach((result, i) => {
    const req = requests[i];
    console.log(
      `${i + 1}. ${req.lastName} (${req.birthInfo.year}/${req.birthInfo.month}/${req.birthInfo.day})`
    );
    console.log(`   Top: ${result.candidates[0]?.firstName.join('') || 'N/A'}`);
    console.log(`   Time: ${result.metadata.executionTime}ms`);
    console.log();
  });

  const totalTime = results.reduce((sum, r) => sum + r.metadata.executionTime, 0);
  console.log(`Total execution time: ${totalTime}ms`);
  console.log(`Average per request: ${(totalTime / requests.length).toFixed(1)}ms\n`);
}

// ============================================================
// Example 5: Error Handling
// ============================================================

/**
 * Demonstrate error handling and graceful degradation
 */
export async function example5_errorHandling(prisma: PrismaClient) {
  console.log('=== Example 5: Error Handling ===\n');

  const hanjaService = createHanjaService('database', prisma);
  const pipeline = createNamingPipeline(hanjaService);

  // Invalid birth info (will trigger errors)
  const birthInfo: BirthInfo = {
    year: 1800, // Before calendar data range
    month: 13, // Invalid month
    day: 32, // Invalid day
    hour: 25, // Invalid hour
    minute: 0,
    isLunar: false,
    gender: 'M',
  };

  try {
    console.log('Attempting pipeline with invalid data...\n');

    const result = await pipeline.execute(birthInfo, '김', 8);

    // Pipeline returns partial results even on error
    console.log(`Pipeline completed with graceful degradation`);
    console.log(`Candidates returned: ${result.candidates.length}`);
    console.log();
  } catch (error) {
    console.error('Pipeline error:', error);
    console.log();
  }
}

// ============================================================
// Example 6: Performance Tuning
// ============================================================

/**
 * Optimize pipeline for speed vs quality trade-offs
 */
export async function example6_performanceTuning(prisma: PrismaClient) {
  console.log('=== Example 6: Performance Tuning ===\n');

  const hanjaService = createHanjaService('database', prisma);
  const cacheService = createCacheService('memory');
  const pipeline = createNamingPipeline(hanjaService, cacheService);

  const birthInfo: BirthInfo = {
    year: 2024,
    month: 10,
    day: 24,
    hour: 12,
    minute: 0,
    isLunar: false,
    gender: 'M',
  };

  // Fast configuration (lower quality)
  const fastConfig: Partial<PipelineConfig> = {
    maxCombinations: 1000, // Reduced from 10000
    maxCandidates: 10, // Reduced from 20
    batchSize: 50, // Smaller batches
    minScore: 50, // Lower threshold
    requireYongsinMatch: false,
  };

  // Quality configuration (slower)
  const qualityConfig: Partial<PipelineConfig> = {
    maxCombinations: 20000, // Increased
    maxCandidates: 50,
    batchSize: 200,
    minScore: 75, // Higher threshold
    requireYongsinMatch: true,
    avoidInauspicious: true,
  };

  console.log('Running fast configuration...');
  const fastResult = await pipeline.execute(birthInfo, '김', 8, fastConfig);
  console.log(`  Time: ${fastResult.metadata.executionTime}ms`);
  console.log(`  Candidates: ${fastResult.candidates.length}`);
  console.log();

  console.log('Running quality configuration...');
  const qualityResult = await pipeline.execute(birthInfo, '김', 8, qualityConfig);
  console.log(`  Time: ${qualityResult.metadata.executionTime}ms`);
  console.log(`  Candidates: ${qualityResult.candidates.length}`);
  console.log();

  console.log('Comparison:');
  console.log(`  Speed improvement: ${((qualityResult.metadata.executionTime / fastResult.metadata.executionTime) * 100).toFixed(1)}%`);
  console.log(
    `  Top score (fast): ${fastResult.candidates[0]?.score.toFixed(1) || 'N/A'}`
  );
  console.log(
    `  Top score (quality): ${qualityResult.candidates[0]?.score.toFixed(1) || 'N/A'}`
  );
  console.log();
}

// ============================================================
// Example 7: Integration with API Route
// ============================================================

/**
 * Example API route handler using pipeline
 */
export async function example7_apiIntegration(
  request: {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthHour: number;
    birthMinute: number;
    isLunar: boolean;
    gender: 'M' | 'F';
    lastName: string;
    lastNameStrokes: number;
  },
  prisma: PrismaClient
) {
  console.log('=== Example 7: API Integration ===\n');

  // Create pipeline (would be singleton in real app)
  const hanjaService = createHanjaService('database', prisma);
  const cacheService = createCacheService('memory');
  const pipeline = createNamingPipeline(hanjaService, cacheService);

  // Map request to BirthInfo
  const birthInfo: BirthInfo = {
    year: request.birthYear,
    month: request.birthMonth,
    day: request.birthDay,
    hour: request.birthHour,
    minute: request.birthMinute,
    isLunar: request.isLunar,
    gender: request.gender,
  };

  try {
    // Execute pipeline
    const result = await pipeline.execute(
      birthInfo,
      request.lastName,
      request.lastNameStrokes
    );

    // Format API response
    return {
      success: true,
      data: {
        candidates: result.candidates.map((c) => ({
          firstName: c.firstName.join(''),
          hanja: c.characters.map((ch) => ch.character).join(''),
          score: c.score,
          breakdown: c.breakdown,
          meanings: c.characters.map((ch) => ch.meaning),
        })),
        saju: result.saju,
        metadata: result.metadata,
      },
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      success: false,
      error: 'Failed to generate names',
    };
  }
}

// ============================================================
// Run All Examples
// ============================================================

/**
 * Execute all examples (for testing)
 */
export async function runAllExamples(prisma: PrismaClient) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         NamingPipeline Usage Examples                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    await example1_basicUsage(prisma);
    await example2_customConfig(prisma);
    await example3_mockTesting();
    await example4_batchProcessing(prisma);
    await example5_errorHandling(prisma);
    await example6_performanceTuning(prisma);

    console.log('All examples completed successfully! ✅\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// ============================================================
// CLI Execution (if run directly)
// ============================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('Note: Examples require Prisma client to be available.');
  console.log('Run with: tsx examples.ts\n');

  // Example 3 (mock) can run without DB
  example3_mockTesting();
}
