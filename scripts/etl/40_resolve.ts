#!/usr/bin/env npx tsx
// ETL Step 4: 충돌 해결 (Conflict Resolution)
// 서로 다른 소스의 동일 한자에 대한 정보 충돌을 해결

import { join } from 'path';
import { 
  ETLConfig, 
  MergedData,
  ResolvedData,
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

const STEP_NAME = '40_resolve';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data/merged',
  outputDir: 'scripts/etl/data/resolved',
  logLevel: 'info',
  batchSize: 100,
  errorHandling: 'continue',
  createBackup: true
};

/**
 * 충돌 감지 및 해결 전략
 */
interface ConflictResolutionStrategy {
  /** 전략 이름 */
  name: string;
  /** 적용 함수 */
  resolve: (record: ProcessedHanjaRecord) => ProcessedHanjaRecord;
  /** 적용 조건 */
  condition: (record: ProcessedHanjaRecord) => boolean;
}

/**
 * 충돌 유형별 해결 전략들
 */
const resolutionStrategies: ConflictResolutionStrategy[] = [
  {
    name: 'validate_strokes',
    condition: (record) => {
      return record.strokes !== undefined && 
             (record.strokes < 1 || record.strokes > 50 || !Number.isInteger(record.strokes));
    },
    resolve: (record) => {
      const processingLog = [...(record.processingLog || [])];
      
      if (record.strokes && (record.strokes < 1 || record.strokes > 50)) {
        processingLog.push(`Invalid strokes value ${record.strokes} - setting to undefined`);
        record.strokes = undefined;
        record.validationStatus = 'needs_review';
      }
      
      record.processingLog = processingLog;
      return record;
    }
  },
  {
    name: 'resolve_element_conflicts',
    condition: (record) => {
      return record.element !== undefined && 
             record.normalizedElement !== undefined &&
             record.validationStatus === 'needs_review';
    },
    resolve: (record) => {
      const processingLog = [...(record.processingLog || [])];
      
      // 정규화된 오행 값이 있으면 원본 값을 정규화된 값으로 통일
      if (record.normalizedElement && record.element !== record.normalizedElement) {
        processingLog.push(`Element conflict resolved: ${record.element} → ${record.normalizedElement}`);
        record.element = record.normalizedElement;
      }
      
      record.processingLog = processingLog;
      return record;
    }
  },
  {
    name: 'resolve_yinyang_conflicts',
    condition: (record) => {
      return record.yinYang !== undefined && 
             record.normalizedYinYang !== undefined &&
             record.validationStatus === 'needs_review';
    },
    resolve: (record) => {
      const processingLog = [...(record.processingLog || [])];
      
      // 정규화된 음양 값이 있으면 원본 값을 정규화된 값으로 통일
      if (record.normalizedYinYang && record.yinYang !== record.normalizedYinYang) {
        processingLog.push(`YinYang conflict resolved: ${record.yinYang} → ${record.normalizedYinYang}`);
        record.yinYang = record.normalizedYinYang;
      }
      
      record.processingLog = processingLog;
      return record;
    }
  },
  {
    name: 'validate_required_fields',
    condition: (record) => {
      return !record.meaning && !record.reading;
    },
    resolve: (record) => {
      const processingLog = [...(record.processingLog || [])];
      
      processingLog.push('Missing both meaning and reading - needs manual review');
      record.validationStatus = 'needs_review';
      
      record.processingLog = processingLog;
      return record;
    }
  },
  {
    name: 'normalize_confidence',
    condition: (record) => {
      return record.confidenceScore === undefined || 
             record.confidenceScore < 0 || 
             record.confidenceScore > 1;
    },
    resolve: (record) => {
      const processingLog = [...(record.processingLog || [])];
      const originalScore = record.confidenceScore;
      
      if (record.confidenceScore === undefined) {
        record.confidenceScore = 0.5;
        processingLog.push('Set default confidence score: 0.5');
      } else if (record.confidenceScore < 0 || record.confidenceScore > 1) {
        record.confidenceScore = Math.max(0, Math.min(1, record.confidenceScore));
        processingLog.push(`Confidence score normalized: ${originalScore} → ${record.confidenceScore}`);
      }
      
      record.processingLog = processingLog;
      return record;
    }
  },
  {
    name: 'validate_character',
    condition: (record) => {
      return !/^[\u4e00-\u9fff]$/.test(record.character);
    },
    resolve: (record) => {
      const processingLog = [...(record.processingLog || [])];
      
      if (record.character.length !== 1) {
        processingLog.push(`Invalid character length: ${record.character} (length: ${record.character.length})`);
        record.validationStatus = 'invalid';
      } else if (!/[\u4e00-\u9fff]/.test(record.character)) {
        processingLog.push(`Character not in CJK range: ${record.character}`);
        record.validationStatus = 'needs_review';
      }
      
      record.processingLog = processingLog;
      return record;
    }
  }
];

/**
 * 레코드에 충돌 해결 전략 적용
 */
function resolveConflicts(
  record: ProcessedHanjaRecord, 
  recordIndex: number,
  logger: any
): { resolved: ProcessedHanjaRecord | null; errors: any[] } {
  const errors: any[] = [];
  const appliedStrategies: string[] = [];
  
  try {
    let resolvedRecord = { ...record };
    
    // 각 전략을 순차적으로 적용
    for (const strategy of resolutionStrategies) {
      if (strategy.condition(resolvedRecord)) {
        resolvedRecord = strategy.resolve(resolvedRecord);
        appliedStrategies.push(strategy.name);
        logger.debug(`Applied strategy ${strategy.name} to record ${recordIndex}`);
      }
    }

    // 적용된 전략 정보를 메타데이터에 추가
    if (appliedStrategies.length > 0) {
      resolvedRecord.metadata = {
        ...resolvedRecord.metadata,
        appliedResolutionStrategies: appliedStrategies,
        resolvedAt: new Date().toISOString()
      };
    }

    // 최종 검증 상태 결정
    if (resolvedRecord.validationStatus === 'invalid') {
      // invalid 상태는 그대로 유지
    } else if (appliedStrategies.length > 0) {
      // 전략이 적용된 경우, needs_review로 설정 (이미 설정되어 있지 않다면)
      if (resolvedRecord.validationStatus === 'ok') {
        resolvedRecord.validationStatus = 'needs_review';
      }
    }

    return { resolved: resolvedRecord, errors };

  } catch (error) {
    errors.push(createETLError(
      'processing',
      `Conflict resolution failed for record ${recordIndex}: ${error instanceof Error ? error.message : String(error)}`,
      record,
      `record_${recordIndex}`,
      undefined,
      { error }
    ));
    return { resolved: null, errors };
  }
}

/**
 * 배치 충돌 해결 처리
 */
async function resolveBatch(
  records: ProcessedHanjaRecord[],
  batchIndex: number,
  logger: any
): Promise<{ resolved: ProcessedHanjaRecord[], errors: any[] }> {
  const resolved: ProcessedHanjaRecord[] = [];
  const errors: any[] = [];

  records.forEach((record, index) => {
    const globalIndex = batchIndex * config.batchSize + index;
    const result = resolveConflicts(record, globalIndex, logger);
    
    if (result.resolved) {
      resolved.push(result.resolved);
    }
    errors.push(...result.errors);
  });

  logger.debug(`Batch ${batchIndex}: processed ${records.length} records, ${resolved.length} resolved, ${errors.length} errors`);
  
  return { resolved, errors };
}

/**
 * 충돌 해결 메트릭 계산
 */
function calculateConflictMetrics(
  originalRecords: ProcessedHanjaRecord[],
  resolvedRecords: ProcessedHanjaRecord[]
) {
  let conflictsFound = 0;
  let conflictsResolved = 0;
  let conflictsRemaining = 0;
  const resolutionStrategies: Record<string, number> = {};

  resolvedRecords.forEach(record => {
    const appliedStrategies = record.metadata?.appliedResolutionStrategies as string[] || [];
    
    if (appliedStrategies.length > 0) {
      conflictsFound++;
      
      if (record.validationStatus === 'ok') {
        conflictsResolved++;
      } else {
        conflictsRemaining++;
      }

      appliedStrategies.forEach(strategy => {
        resolutionStrategies[strategy] = (resolutionStrategies[strategy] || 0) + 1;
      });
    }
  });

  return {
    conflictsFound,
    conflictsResolved,
    conflictsRemaining,
    resolutionStrategies
  };
}

/**
 * 메인 충돌 해결 함수
 */
async function resolveConflictsMain(): Promise<ProcessingResult<ResolvedData>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    // 병합된 데이터 로드
    const inputPath = join(config.inputDir, 'merged_data.json');
    logger.info(`Loading merged data from: ${inputPath}`);
    
    const mergedData = await readJsonFile<MergedData>(inputPath);
    logger.info(`Loaded ${mergedData.records.length} merged records`);

    // 배치로 충돌 해결 처리
    logger.info(`Processing conflict resolution in batches of ${config.batchSize}`);
    
    const allResolved: ProcessedHanjaRecord[] = [];
    const allErrors: any[] = [];

    const batchResults = await processBatches(
      mergedData.records,
      config.batchSize,
      async (batch, batchIndex) => {
        const result = await resolveBatch(batch, batchIndex, logger);
        allResolved.push(...result.resolved);
        allErrors.push(...result.errors);
        
        logger.updateProgress(
          (batchIndex + 1) * config.batchSize,
          mergedData.records.length,
          'Resolving conflicts'
        );
        
        return result.resolved;
      }
    );

    // 충돌 해결 메트릭 계산
    const conflictMetrics = calculateConflictMetrics(
      mergedData.records,
      allResolved
    );

    // 해결된 데이터 객체 생성
    const resolvedData: ResolvedData = {
      records: allResolved,
      conflictMetrics
    };

    // 결과 저장
    const outputPath = join(config.outputDir, 'resolved_data.json');
    await writeJsonFile(outputPath, resolvedData);

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      resolvedData,
      allResolved.length,
      allErrors,
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Conflict resolution completed. Output saved to: ${outputPath}`);
    logger.info(`Processed ${mergedData.records.length} records`);
    logger.info(`Found ${conflictMetrics.conflictsFound} conflicts`);
    logger.info(`Resolved ${conflictMetrics.conflictsResolved} conflicts`);
    logger.info(`Remaining ${conflictMetrics.conflictsRemaining} conflicts need review`);
    logger.info('Resolution strategies used:', conflictMetrics.resolutionStrategies);

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Conflict resolution failed: ${error instanceof Error ? error.message : String(error)}`,
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
    logger.error('Conflict resolution failed', { error });
    throw error;
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  resolveConflictsMain()
    .then(result => {
      console.log('✅ Conflict resolution completed successfully');
      console.log(`📊 Processed: ${result.processedCount} records`);
      console.log(`✅ Success: ${result.successCount} records`);
      console.log(`❌ Errors: ${result.errorCount} errors`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      
      if (result.data?.conflictMetrics) {
        const metrics = result.data.conflictMetrics;
        console.log('\n📈 Conflict Resolution Metrics:');
        console.log(`  Conflicts found: ${metrics.conflictsFound}`);
        console.log(`  Conflicts resolved: ${metrics.conflictsResolved}`);
        console.log(`  Conflicts remaining: ${metrics.conflictsRemaining}`);
        console.log('  Resolution strategies:', metrics.resolutionStrategies);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Conflict resolution failed:', error.message);
      process.exit(1);
    });
}

export { resolveConflictsMain as resolveConflicts };