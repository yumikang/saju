#!/usr/bin/env npx tsx
// ETL Step 3: 중복 제거 (Deduplication)
// 정규화된 데이터에서 중복 레코드를 찾고 병합 전략을 적용

import { join } from 'path';
import { 
  ETLConfig, 
  NormalizedData,
  MergedData,
  ProcessedHanjaRecord,
  ProcessingResult 
} from './lib/etl-types';
import { createLogger } from './lib/etl-logger';
import { 
  readJsonFile,
  writeJsonFile, 
  createProcessingResult, 
  createETLError,
  processBatches
} from './lib/etl-utils';

const STEP_NAME = '30_dedup';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data/normalized',
  outputDir: 'scripts/etl/data/merged',
  logLevel: 'info',
  batchSize: 100,
  errorHandling: 'continue',
  createBackup: true
};

/**
 * 중복 레코드 그룹화
 */
function groupDuplicates(records: ProcessedHanjaRecord[]): Map<string, ProcessedHanjaRecord[]> {
  const groups = new Map<string, ProcessedHanjaRecord[]>();
  
  records.forEach(record => {
    const key = record.character.trim();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  return groups;
}

/**
 * 레코드 품질 점수 계산
 */
function calculateQualityScore(record: ProcessedHanjaRecord): number {
  let score = 0;
  
  // 기본 점수 (신뢰도 기반)
  score += (record.confidenceScore || 0.5) * 40;
  
  // 필드 완성도
  if (record.meaning && record.meaning.length > 0) score += 15;
  if (record.reading && record.reading.length > 0) score += 15;
  if (record.strokes && record.strokes > 0) score += 10;
  if (record.normalizedElement) score += 10;
  if (record.normalizedYinYang) score += 5;
  
  // 검증 상태 보너스
  if (record.validationStatus === 'ok') score += 5;
  
  return Math.min(100, score);
}

/**
 * 소스 우선순위
 */
function getSourcePriority(source: string): number {
  const priorities: Record<string, number> = {
    'hanja-data.ts': 10,
    'supreme_court': 8,
    'external_api': 6,
    'user_input': 4,
    'unknown': 1
  };
  
  return priorities[source] || 1;
}

/**
 * 두 레코드 병합
 */
function mergeRecords(
  primary: ProcessedHanjaRecord, 
  secondary: ProcessedHanjaRecord
): ProcessedHanjaRecord {
  const processingLog = [...(primary.processingLog || [])];
  processingLog.push(`Merged with record from ${secondary.source}`);
  
  // 병합 메타데이터 생성
  const mergedMetadata = {
    ...primary.metadata,
    mergedSources: [
      primary.source || 'unknown',
      secondary.source || 'unknown'
    ],
    mergedAt: new Date().toISOString(),
    originalRecords: [primary.character, secondary.character]
  };

  return {
    character: primary.character,
    meaning: primary.meaning || secondary.meaning,
    reading: primary.reading || secondary.reading,
    strokes: primary.strokes || secondary.strokes,
    element: primary.element || secondary.element,
    yinYang: primary.yinYang || secondary.yinYang,
    normalizedElement: primary.normalizedElement || secondary.normalizedElement,
    normalizedYinYang: primary.normalizedYinYang || secondary.normalizedYinYang,
    source: primary.source,
    confidenceScore: Math.max(
      primary.confidenceScore || 0.5, 
      secondary.confidenceScore || 0.5
    ),
    validationStatus: primary.validationStatus === 'ok' && secondary.validationStatus === 'ok' 
      ? 'ok' 
      : 'needs_review',
    metadata: mergedMetadata,
    processingLog,
    duplicateInfo: {
      isDuplicate: false,
      duplicateOf: undefined,
      mergeStrategy: 'quality_based_merge'
    }
  };
}

/**
 * 중복 그룹 병합
 */
function mergeDuplicateGroup(
  duplicates: ProcessedHanjaRecord[], 
  groupKey: string,
  logger: any
): { merged: ProcessedHanjaRecord | null; errors: any[] } {
  const errors: any[] = [];
  
  try {
    if (duplicates.length === 1) {
      // 중복이 아닌 경우
      return { merged: duplicates[0], errors };
    }

    logger.debug(`Processing duplicate group for character: ${groupKey} (${duplicates.length} records)`);

    // 품질 점수 계산 및 정렬
    const scoredRecords = duplicates.map(record => ({
      record,
      qualityScore: calculateQualityScore(record),
      sourcePriority: getSourcePriority(record.source || 'unknown')
    }));

    // 정렬: 품질 점수 → 소스 우선순위 → 신뢰도 점수 순
    scoredRecords.sort((a, b) => {
      if (a.qualityScore !== b.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      if (a.sourcePriority !== b.sourcePriority) {
        return b.sourcePriority - a.sourcePriority;
      }
      return (b.record.confidenceScore || 0.5) - (a.record.confidenceScore || 0.5);
    });

    // 최고 품질 레코드를 기준으로 병합
    let mergedRecord = scoredRecords[0].record;
    
    for (let i = 1; i < scoredRecords.length; i++) {
      mergedRecord = mergeRecords(mergedRecord, scoredRecords[i].record);
    }

    logger.debug(`Merged ${duplicates.length} records for ${groupKey} (final quality: ${calculateQualityScore(mergedRecord)})`);
    
    return { merged: mergedRecord, errors };

  } catch (error) {
    errors.push(createETLError(
      'processing',
      `Failed to merge duplicate group for ${groupKey}: ${error instanceof Error ? error.message : String(error)}`,
      duplicates,
      `group_${groupKey}`,
      undefined,
      { error }
    ));
    return { merged: null, errors };
  }
}

/**
 * 배치 중복 제거 처리
 */
async function dedupBatch(
  groups: [string, ProcessedHanjaRecord[]][],
  batchIndex: number,
  logger: any
): Promise<{ merged: ProcessedHanjaRecord[], errors: any[] }> {
  const merged: ProcessedHanjaRecord[] = [];
  const errors: any[] = [];

  for (const [groupKey, duplicates] of groups) {
    const result = mergeDuplicateGroup(duplicates, groupKey, logger);
    
    if (result.merged) {
      merged.push(result.merged);
    }
    errors.push(...result.errors);
  }

  logger.debug(`Batch ${batchIndex}: processed ${groups.length} duplicate groups, ${merged.length} merged records`);
  
  return { merged, errors };
}

/**
 * 중복 제거 메트릭 계산
 */
function calculateMergeMetrics(
  originalCount: number,
  finalRecords: ProcessedHanjaRecord[],
  duplicateGroups: Map<string, ProcessedHanjaRecord[]>
) {
  let duplicatesFound = 0;
  let duplicatesRemoved = 0;
  const mergeStrategies: Record<string, number> = {};

  duplicateGroups.forEach((group, character) => {
    if (group.length > 1) {
      duplicatesFound += group.length;
      duplicatesRemoved += group.length - 1; // 하나만 남기고 제거
    }
  });

  // 병합 전략 통계
  finalRecords.forEach(record => {
    const strategy = record.duplicateInfo?.mergeStrategy || 'no_merge';
    mergeStrategies[strategy] = (mergeStrategies[strategy] || 0) + 1;
  });

  return {
    originalCount,
    duplicatesFound,
    duplicatesRemoved,
    finalCount: finalRecords.length,
    mergeStrategies
  };
}

/**
 * 메인 중복 제거 함수
 */
async function deduplicate(): Promise<ProcessingResult<MergedData>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    // 정규화된 데이터 로드
    const inputPath = join(config.inputDir, 'normalized_data.json');
    logger.info(`Loading normalized data from: ${inputPath}`);
    
    const normalizedData = await readJsonFile<NormalizedData>(inputPath);
    logger.info(`Loaded ${normalizedData.records.length} normalized records`);

    // 중복 그룹화
    logger.info('Grouping duplicate records by character');
    const duplicateGroups = groupDuplicates(normalizedData.records);
    
    const totalGroups = duplicateGroups.size;
    const duplicateGroupCount = Array.from(duplicateGroups.values())
      .filter(group => group.length > 1).length;
    
    logger.info(`Found ${totalGroups} unique characters, ${duplicateGroupCount} duplicate groups`);

    // 배치로 중복 제거 처리
    logger.info(`Processing duplicate groups in batches of ${config.batchSize}`);
    
    const allMerged: ProcessedHanjaRecord[] = [];
    const allErrors: any[] = [];

    const groupEntries = Array.from(duplicateGroups.entries());
    const batchResults = await processBatches(
      groupEntries,
      config.batchSize,
      async (batch, batchIndex) => {
        const result = await dedupBatch(batch, batchIndex, logger);
        allMerged.push(...result.merged);
        allErrors.push(...result.errors);
        
        logger.updateProgress(
          (batchIndex + 1) * config.batchSize,
          groupEntries.length,
          'Deduplicating records'
        );
        
        return result.merged;
      }
    );

    // 중복 제거 메트릭 계산
    const mergeMetrics = calculateMergeMetrics(
      normalizedData.records.length,
      allMerged,
      duplicateGroups
    );

    // 병합된 데이터 객체 생성
    const mergedData: MergedData = {
      records: allMerged,
      mergeMetrics
    };

    // 결과 저장
    const outputPath = join(config.outputDir, 'merged_data.json');
    await writeJsonFile(outputPath, mergedData);

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      mergedData,
      allMerged.length,
      allErrors,
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Deduplication completed. Output saved to: ${outputPath}`);
    logger.info(`Removed ${mergeMetrics.duplicatesRemoved} duplicates from ${mergeMetrics.originalCount} records`);
    logger.info(`Final count: ${mergeMetrics.finalCount} unique records`);
    logger.info('Merge strategies:', mergeMetrics.mergeStrategies);

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Deduplication failed: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      undefined,
      undefined,
      { error }
    );

    const result = createProcessingResult(
      null,
      0,
      [errorObj],
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.error('Deduplication failed', { error });
    throw error;
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  deduplicate()
    .then(result => {
      console.log('✅ Deduplication completed successfully');
      console.log(`📊 Processed: ${result.processedCount} records`);
      console.log(`✅ Success: ${result.successCount} records`);
      console.log(`❌ Errors: ${result.errorCount} errors`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      
      if (result.data?.mergeMetrics) {
        const metrics = result.data.mergeMetrics;
        console.log('\n📈 Merge Metrics:');
        console.log(`  Original records: ${metrics.originalCount}`);
        console.log(`  Duplicates found: ${metrics.duplicatesFound}`);
        console.log(`  Duplicates removed: ${metrics.duplicatesRemoved}`);
        console.log(`  Final count: ${metrics.finalCount}`);
        console.log('  Merge strategies:', metrics.mergeStrategies);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Deduplication failed:', error.message);
      process.exit(1);
    });
}

export { deduplicate };