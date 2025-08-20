#!/usr/bin/env npx tsx
// ETL Step 1: 데이터 수집 (Ingest)
// 외부 데이터 소스에서 원시 데이터를 수집하여 raw 형태로 저장

import { join } from 'path';
import { 
  ETLConfig, 
  RawData, 
  HanjaRecord, 
  ProcessingResult 
} from './lib/etl-types';
import { createLogger } from './lib/etl-logger';
import { 
  writeJsonFile, 
  createProcessingResult, 
  createETLError,
  createStepContext
} from './lib/etl-utils';
import { getAllHanja } from '../../app/lib/hanja-data';

const STEP_NAME = '10_ingest';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data/raw',
  outputDir: 'scripts/etl/data/raw',
  logLevel: 'info',
  batchSize: 1000,
  errorHandling: 'continue',
  createBackup: true
};

/**
 * 기존 hanja-data.ts에서 데이터 수집
 */
async function ingestFromHanjaData(): Promise<{ records: HanjaRecord[], errors: any[] }> {
  const logger = createLogger(config);
  logger.info('Ingesting data from existing hanja-data.ts');

  try {
    const allHanja = getAllHanja();
    const records: HanjaRecord[] = [];
    const errors: any[] = [];

    allHanja.forEach((hanja, index) => {
      try {
        const record: HanjaRecord = {
          character: hanja.char,
          meaning: hanja.meaning,
          reading: hanja.reading,
          strokes: hanja.strokes,
          element: hanja.element,
          source: 'hanja-data.ts',
          confidenceScore: 0.9, // 기존 데이터는 높은 신뢰도
          metadata: {
            originalIndex: index,
            importedAt: new Date().toISOString()
          }
        };
        records.push(record);
      } catch (error) {
        errors.push(createETLError(
          'parsing',
          `Failed to parse hanja record at index ${index}`,
          hanja,
          `hanja_${index}`,
          undefined,
          { error: error instanceof Error ? error.message : String(error) }
        ));
      }
    });

    logger.info(`Successfully ingested ${records.length} records from hanja-data.ts`);
    return { records, errors };
  } catch (error) {
    logger.error('Failed to ingest from hanja-data.ts', { error });
    throw error;
  }
}

/**
 * 대법원 데이터 소스 준비 (향후 구현용 스켈레톤)
 */
async function prepareScourtDataSource(): Promise<{ records: HanjaRecord[], errors: any[] }> {
  const logger = createLogger(config);
  logger.info('Preparing Supreme Court data source (placeholder)');

  // TODO: 실제 대법원 데이터 파싱 로직 구현
  // 현재는 빈 배열 반환
  return { records: [], errors: [] };
}

/**
 * 기타 외부 데이터 소스 준비 (향후 확장용)
 */
async function prepareExternalSources(): Promise<{ records: HanjaRecord[], errors: any[] }> {
  const logger = createLogger(config);
  logger.info('Preparing external data sources (placeholder)');

  // TODO: 기타 한자 데이터베이스, API 등에서 데이터 수집
  return { records: [], errors: [] };
}

/**
 * 메인 수집 함수
 */
async function ingest(): Promise<ProcessingResult<RawData>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    const allRecords: HanjaRecord[] = [];
    const allErrors: any[] = [];

    // 1. 기존 hanja-data.ts에서 수집
    logger.info('Step 1: Ingesting from hanja-data.ts');
    const hanjaDataResult = await ingestFromHanjaData();
    allRecords.push(...hanjaDataResult.records);
    allErrors.push(...hanjaDataResult.errors);

    // 2. 대법원 데이터 준비 (향후 구현)
    logger.info('Step 2: Preparing Supreme Court data');
    const scourtResult = await prepareScourtDataSource();
    allRecords.push(...scourtResult.records);
    allErrors.push(...scourtResult.errors);

    // 3. 기타 외부 소스 준비 (향후 구현)
    logger.info('Step 3: Preparing external sources');
    const externalResult = await prepareExternalSources();
    allRecords.push(...externalResult.records);
    allErrors.push(...externalResult.errors);

    // 원시 데이터 객체 생성
    const rawData: RawData = {
      records: allRecords,
      source: {
        name: 'mixed_sources',
        fetchedAt: new Date(),
        version: '1.0.0'
      },
      metadata: {
        totalRecords: allRecords.length,
        format: 'json',
        encoding: 'utf8'
      }
    };

    // 결과 저장
    const outputPath = join(config.outputDir, 'raw_data.json');
    await writeJsonFile(outputPath, rawData);

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      rawData,
      allRecords.length,
      allErrors,
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Ingestion completed. Output saved to: ${outputPath}`);
    logger.info(`Total records: ${allRecords.length}, Errors: ${allErrors.length}`);

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Ingestion failed: ${error instanceof Error ? error.message : String(error)}`,
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
    logger.error('Ingestion failed', { error });
    throw error;
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  ingest()
    .then(result => {
      console.log('✅ Ingestion completed successfully');
      console.log(`📊 Processed: ${result.processedCount} records`);
      console.log(`✅ Success: ${result.successCount} records`);
      console.log(`❌ Errors: ${result.errorCount} errors`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Ingestion failed:', error.message);
      process.exit(1);
    });
}

export { ingest };