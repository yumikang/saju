#!/usr/bin/env npx tsx
// ETL Step 2: 데이터 정규화 (Normalize)
// 수집된 원시 데이터를 표준 형태로 정규화하고 검증

import { join } from 'path';
import { 
  ETLConfig, 
  RawData,
  NormalizedData,
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
import { 
  safeNormalizeToPrismaElement,
  safeNormalizeToPrismaYinYang,
  safeNormalizeToPrismaReviewStatus
} from '../../app/lib/hanja-normalize';

const STEP_NAME = '20_normalize';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data/raw',
  outputDir: 'scripts/etl/data/normalized',
  logLevel: 'info',
  batchSize: 100,
  errorHandling: 'continue',
  createBackup: true
};

/**
 * 한자 레코드 정규화
 */
function normalizeHanjaRecord(record: any, recordIndex: number): {
  normalized: ProcessedHanjaRecord | null;
  errors: any[];
} {
  const errors: any[] = [];
  const processingLog: string[] = [];

  try {
    // 필수 필드 검증
    if (!record.character || typeof record.character !== 'string') {
      errors.push(createETLError(
        'validation',
        'Missing or invalid character field',
        record,
        `record_${recordIndex}`,
        'character'
      ));
      return { normalized: null, errors };
    }

    // 기본 정규화된 레코드 생성
    const normalized: ProcessedHanjaRecord = {
      character: record.character.trim(),
      meaning: record.meaning?.trim() || undefined,
      reading: record.reading?.trim() || undefined,
      strokes: record.strokes || undefined,
      element: record.element?.trim() || undefined,
      yinYang: record.yinYang?.trim() || undefined,
      source: record.source || 'unknown',
      confidenceScore: record.confidenceScore || 0.5,
      metadata: record.metadata || {},
      validationStatus: 'ok',
      processingLog: processingLog
    };

    // 오행 정규화
    if (record.element) {
      const elementResult = safeNormalizeToPrismaElement(record.element);
      if (elementResult.success) {
        normalized.normalizedElement = elementResult.value!;
        processingLog.push(`Element normalized: ${record.element} → ${elementResult.value}`);
      } else {
        errors.push(createETLError(
          'validation',
          `Element normalization failed: ${elementResult.error}`,
          record.element,
          `record_${recordIndex}`,
          'element'
        ));
        normalized.validationStatus = 'needs_review';
        processingLog.push(`Element normalization failed: ${elementResult.error}`);
      }
    }

    // 음양 정규화 (있는 경우)
    if (record.yinYang) {
      const yinYangResult = safeNormalizeToPrismaYinYang(record.yinYang);
      if (yinYangResult.success) {
        normalized.normalizedYinYang = yinYangResult.value!;
        processingLog.push(`YinYang normalized: ${record.yinYang} → ${yinYangResult.value}`);
      } else {
        errors.push(createETLError(
          'validation',
          `YinYang normalization failed: ${yinYangResult.error}`,
          record.yinYang,
          `record_${recordIndex}`,
          'yinYang'
        ));
        normalized.validationStatus = 'needs_review';
        processingLog.push(`YinYang normalization failed: ${yinYangResult.error}`);
      }
    }

    // 획수 검증 및 정규화
    if (record.strokes !== undefined) {
      const strokes = parseInt(String(record.strokes));
      if (isNaN(strokes) || strokes < 1 || strokes > 50) {
        errors.push(createETLError(
          'validation',
          `Invalid strokes value: ${record.strokes}`,
          record.strokes,
          `record_${recordIndex}`,
          'strokes'
        ));
        normalized.validationStatus = 'needs_review';
        processingLog.push(`Invalid strokes: ${record.strokes}`);
      } else {
        normalized.strokes = strokes;
        processingLog.push(`Strokes validated: ${strokes}`);
      }
    }

    // 문자 유효성 검증
    if (!/[\u4e00-\u9fff]/.test(normalized.character)) {
      errors.push(createETLError(
        'validation',
        `Character is not valid CJK: ${normalized.character}`,
        normalized.character,
        `record_${recordIndex}`,
        'character'
      ));
      normalized.validationStatus = 'needs_review';
      processingLog.push(`Character validation warning: not CJK range`);
    }

    // 신뢰도 점수 정규화
    if (normalized.confidenceScore < 0 || normalized.confidenceScore > 1) {
      normalized.confidenceScore = Math.max(0, Math.min(1, normalized.confidenceScore));
      processingLog.push(`Confidence score clamped to [0,1]: ${normalized.confidenceScore}`);
    }

    normalized.processingLog = processingLog;
    return { normalized, errors };

  } catch (error) {
    errors.push(createETLError(
      'processing',
      `Unexpected error during normalization: ${error instanceof Error ? error.message : String(error)}`,
      record,
      `record_${recordIndex}`,
      undefined,
      { error }
    ));
    return { normalized: null, errors };
  }
}

/**
 * 배치 정규화 처리
 */
async function normalizeBatch(
  records: any[], 
  batchIndex: number,
  logger: any
): Promise<{ normalized: ProcessedHanjaRecord[], errors: any[] }> {
  const normalized: ProcessedHanjaRecord[] = [];
  const errors: any[] = [];

  records.forEach((record, index) => {
    const globalIndex = batchIndex * config.batchSize + index;
    const result = normalizeHanjaRecord(record, globalIndex);
    
    if (result.normalized) {
      normalized.push(result.normalized);
    }
    errors.push(...result.errors);
  });

  logger.debug(`Batch ${batchIndex}: processed ${records.length} records, ${normalized.length} normalized, ${errors.length} errors`);
  
  return { normalized, errors };
}

/**
 * 정규화 메트릭 계산
 */
function calculateNormalizationMetrics(
  totalRecords: number,
  normalizedRecords: ProcessedHanjaRecord[],
  errors: any[]
) {
  const fieldStats = {
    element: { attempted: 0, successful: 0, failed: 0 },
    yinYang: { attempted: 0, successful: 0, failed: 0 },
    strokes: { attempted: 0, successful: 0, failed: 0 },
    meaning: { attempted: 0, successful: 0, failed: 0 },
    reading: { attempted: 0, successful: 0, failed: 0 }
  };

  // 성공한 레코드의 필드 통계
  normalizedRecords.forEach(record => {
    if (record.element) fieldStats.element.attempted++;
    if (record.normalizedElement) fieldStats.element.successful++;
    
    if (record.yinYang) fieldStats.yinYang.attempted++;
    if (record.normalizedYinYang) fieldStats.yinYang.successful++;
    
    if (record.strokes) fieldStats.strokes.attempted++;
    if (record.strokes && record.strokes > 0) fieldStats.strokes.successful++;
    
    if (record.meaning) fieldStats.meaning.attempted++;
    if (record.meaning && record.meaning.length > 0) fieldStats.meaning.successful++;
    
    if (record.reading) fieldStats.reading.attempted++;
    if (record.reading && record.reading.length > 0) fieldStats.reading.successful++;
  });

  // 에러 통계 반영
  errors.forEach(error => {
    if (error.field && fieldStats[error.field as keyof typeof fieldStats]) {
      fieldStats[error.field as keyof typeof fieldStats].failed++;
    }
  });

  return {
    totalRecords,
    normalizedSuccessfully: normalizedRecords.length,
    normalizationErrors: errors.length,
    fieldNormalizationStats: fieldStats
  };
}

/**
 * 메인 정규화 함수
 */
async function normalize(): Promise<ProcessingResult<NormalizedData>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    // 원시 데이터 로드
    const inputPath = join(config.inputDir, 'raw_data.json');
    logger.info(`Loading raw data from: ${inputPath}`);
    
    const rawData = await readJsonFile<RawData>(inputPath);
    logger.info(`Loaded ${rawData.records.length} raw records`);

    // 배치로 정규화 처리
    logger.info(`Processing in batches of ${config.batchSize}`);
    
    const allNormalized: ProcessedHanjaRecord[] = [];
    const allErrors: any[] = [];

    const batchResults = await processBatches(
      rawData.records,
      config.batchSize,
      async (batch, batchIndex) => {
        const result = await normalizeBatch(batch, batchIndex, logger);
        allNormalized.push(...result.normalized);
        allErrors.push(...result.errors);
        
        logger.updateProgress(
          (batchIndex + 1) * config.batchSize,
          rawData.records.length,
          'Normalizing records'
        );
        
        return result.normalized;
      }
    );

    // 정규화 메트릭 계산
    const normalizationMetrics = calculateNormalizationMetrics(
      rawData.records.length,
      allNormalized,
      allErrors
    );

    // 정규화된 데이터 객체 생성
    const normalizedData: NormalizedData = {
      records: allNormalized,
      normalizationMetrics
    };

    // 결과 저장
    const outputPath = join(config.outputDir, 'normalized_data.json');
    await writeJsonFile(outputPath, normalizedData);

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      normalizedData,
      allNormalized.length,
      allErrors,
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Normalization completed. Output saved to: ${outputPath}`);
    logger.info(`Normalized: ${allNormalized.length}/${rawData.records.length} records`);
    logger.info('Field normalization stats:', normalizationMetrics.fieldNormalizationStats);

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Normalization failed: ${error instanceof Error ? error.message : String(error)}`,
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
    logger.error('Normalization failed', { error });
    throw error;
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  normalize()
    .then(result => {
      console.log('✅ Normalization completed successfully');
      console.log(`📊 Processed: ${result.processedCount} records`);
      console.log(`✅ Success: ${result.successCount} records`);
      console.log(`❌ Errors: ${result.errorCount} errors`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      
      if (result.data?.normalizationMetrics) {
        const metrics = result.data.normalizationMetrics;
        console.log('\n📈 Normalization Metrics:');
        Object.entries(metrics.fieldNormalizationStats).forEach(([field, stats]) => {
          if (stats.attempted > 0) {
            const successRate = Math.round((stats.successful / stats.attempted) * 100);
            console.log(`  ${field}: ${stats.successful}/${stats.attempted} (${successRate}%)`);
          }
        });
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Normalization failed:', error.message);
      process.exit(1);
    });
}

export { normalize };