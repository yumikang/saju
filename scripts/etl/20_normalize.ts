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
import { lookupHanjaElement, hasElementMapping } from './lib/hanja-element-lookup';

const STEP_NAME = '20_normalize';

/**
 * Gov 데이터 감지 함수
 */
function isGovData(record: any): boolean {
  return record.source === 'supreme-court' || record.source === 'government';
}

/**
 * 복수 읽기 분할 처리
 */
function splitMultipleReadings(reading: string): { primary: string; alternatives: string[] } {
  if (!reading || typeof reading !== 'string') {
    return { primary: '', alternatives: [] };
  }

  const readings = reading.split(',').map(r => r.trim()).filter(r => r.length > 0);
  
  return {
    primary: readings[0] || '',
    alternatives: readings.slice(1)
  };
}

/**
 * Gov 데이터용 오행 매핑 시도
 */
function tryElementLookup(character: string, originalElement?: string): {
  element?: string;
  mappingSource: 'original' | 'lookup' | 'none';
  lookupAvailable: boolean;
} {
  const lookupAvailable = hasElementMapping(character);
  
  // 원본 데이터에 오행이 있으면 우선 사용
  if (originalElement && originalElement.trim()) {
    return {
      element: originalElement.trim(),
      mappingSource: 'original',
      lookupAvailable
    };
  }
  
  // 룩업 테이블에서 찾기
  const lookupElement = lookupHanjaElement(character);
  if (lookupElement) {
    return {
      element: lookupElement,
      mappingSource: 'lookup',
      lookupAvailable: true
    };
  }
  
  return {
    mappingSource: 'none',
    lookupAvailable
  };
}

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

    // Gov 데이터 특별 처리
    const isGov = isGovData(record);
    let primaryReading = record.reading?.trim() || undefined;
    let alternativeReadings: string[] = [];
    
    if (isGov && record.reading) {
      const readingSplit = splitMultipleReadings(record.reading);
      primaryReading = readingSplit.primary || undefined;
      alternativeReadings = readingSplit.alternatives;
      if (alternativeReadings.length > 0) {
        processingLog.push(`Gov data: split readings ${record.reading} → primary: ${primaryReading}, alternatives: [${alternativeReadings.join(', ')}]`);
      }
    }

    // 오행 매핑 시도 (Gov 데이터인 경우 룩업 테이블 활용)
    let elementValue = record.element?.trim() || undefined;
    let elementMappingSource = 'original';
    
    if (isGov) {
      const elementLookup = tryElementLookup(record.character, record.element);
      elementValue = elementLookup.element;
      elementMappingSource = elementLookup.mappingSource;
      
      if (elementLookup.mappingSource === 'lookup') {
        processingLog.push(`Gov data: element mapped via lookup table ${record.character} → ${elementValue}`);
      } else if (elementLookup.mappingSource === 'none' && elementLookup.lookupAvailable) {
        processingLog.push(`Gov data: no element mapping found for ${record.character} (lookup table has this character)`);
      } else if (elementLookup.mappingSource === 'none') {
        processingLog.push(`Gov data: no element mapping found for ${record.character} (not in lookup table)`);
      }
    }

    // 기본 정규화된 레코드 생성
    const normalized: ProcessedHanjaRecord = {
      character: record.character.trim(),
      meaning: record.meaning?.trim() || undefined,
      reading: primaryReading,
      strokes: record.strokes || undefined,
      element: elementValue,
      yinYang: record.yinYang?.trim() || undefined,
      source: record.source || 'unknown',
      confidenceScore: record.confidenceScore || 0.5,
      metadata: {
        ...record.metadata,
        ...(isGov && alternativeReadings.length > 0 && { alternativeReadings }),
        ...(isGov && { elementMappingSource }),
        ...(isGov && record.metadata?.hexCode && { hexCode: record.metadata.hexCode }),
        ...(isGov && record.metadata?.dictionaryInfo && { dictionaryInfo: record.metadata.dictionaryInfo })
      },
      validationStatus: 'ok',
      processingLog: processingLog
    };

    // 오행 정규화 (elementValue 사용 - Gov 데이터의 경우 룩업된 값 포함)
    if (elementValue) {
      const elementResult = safeNormalizeToPrismaElement(elementValue);
      if (elementResult.success) {
        normalized.normalizedElement = elementResult.value!;
        const sourceInfo = isGov ? ` (source: ${elementMappingSource})` : '';
        processingLog.push(`Element normalized: ${elementValue} → ${elementResult.value}${sourceInfo}`);
      } else {
        errors.push(createETLError(
          'validation',
          `Element normalization failed: ${elementResult.error}`,
          elementValue,
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
    // 원시 데이터 로드 (기존 + Gov 데이터)
    const inputPath = join(config.inputDir, 'raw_data.json');
    const govInputPath = join(config.inputDir, 'gov-2025-08-20T06-58-47-164Z.json');
    
    logger.info(`Loading raw data from: ${inputPath}`);
    const rawData = await readJsonFile<RawData>(inputPath);
    logger.info(`Loaded ${rawData.records.length} existing raw records`);
    
    // Gov 데이터도 로드 (있는 경우)
    let govRecords: any[] = [];
    try {
      logger.info(`Loading Gov data from: ${govInputPath}`);
      const govData = await readJsonFile<any>(govInputPath);
      govRecords = govData.records || govData;
      
      // Gov 데이터에 source 필드 추가
      govRecords = govRecords.map(record => ({
        ...record,
        source: record.source || 'supreme-court',
        confidenceScore: record.confidenceScore || 0.8
      }));
      
      logger.info(`Loaded ${govRecords.length} Gov records`);
    } catch (govError) {
      logger.warn(`Could not load Gov data: ${govError instanceof Error ? govError.message : String(govError)}`);
    }
    
    // 통합 레코드 생성
    const allRecords = [...rawData.records, ...govRecords];
    logger.info(`Total records to process: ${allRecords.length} (existing: ${rawData.records.length}, gov: ${govRecords.length})`);
    
    // rawData 객체를 통합 데이터로 업데이트
    const combinedRawData = {
      ...rawData,
      records: allRecords,
      metadata: {
        ...rawData.metadata,
        totalRecords: allRecords.length,
        sources: {
          existing: rawData.records.length,
          government: govRecords.length
        }
      }
    };

    // 배치로 정규화 처리
    logger.info(`Processing in batches of ${config.batchSize}`);
    
    const allNormalized: ProcessedHanjaRecord[] = [];
    const allErrors: any[] = [];

    const batchResults = await processBatches(
      combinedRawData.records,
      config.batchSize,
      async (batch, batchIndex) => {
        const result = await normalizeBatch(batch, batchIndex, logger);
        allNormalized.push(...result.normalized);
        allErrors.push(...result.errors);
        
        logger.updateProgress(
          (batchIndex + 1) * config.batchSize,
          combinedRawData.records.length,
          'Normalizing records'
        );
        
        return result.normalized;
      }
    );

    // 정규화 메트릭 계산
    const normalizationMetrics = calculateNormalizationMetrics(
      combinedRawData.records.length,
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
    logger.info(`Normalized: ${allNormalized.length}/${combinedRawData.records.length} records (existing: ${rawData.records.length}, gov: ${govRecords.length})`);
    logger.info('Field normalization stats:', normalizationMetrics.fieldNormalizationStats);
    
    // Gov 데이터 처리 통계 로그
    const govProcessed = allNormalized.filter(r => r.source === 'supreme-court' || r.source === 'government');
    const govWithAlternatives = govProcessed.filter(r => r.metadata?.alternativeReadings?.length > 0);
    const govWithLookupElement = govProcessed.filter(r => r.metadata?.elementMappingSource === 'lookup');
    
    if (govProcessed.length > 0) {
      logger.info(`Gov data processed: ${govProcessed.length} records`);
      logger.info(`  - With alternative readings: ${govWithAlternatives.length}`);
      logger.info(`  - Element from lookup table: ${govWithLookupElement.length}`);
    }

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