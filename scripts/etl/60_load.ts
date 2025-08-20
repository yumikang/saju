#!/usr/bin/env npx tsx
// ETL Step 6: 데이터베이스 적재 (Load)
// 검증된 데이터를 Prisma를 통해 데이터베이스에 적재

import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { 
  ETLConfig, 
  ValidatedData,
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

const STEP_NAME = '60_load';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data/validated',
  outputDir: 'scripts/etl/data/loaded',
  logLevel: 'info',
  batchSize: 50, // 데이터베이스 적재는 더 작은 배치 크기 사용
  errorHandling: 'continue',
  createBackup: true
};

// Prisma Client 인스턴스
const prisma = new PrismaClient();

/**
 * 한자 레코드를 Prisma 모델 형태로 변환
 */
function convertToPrismaRecord(record: ProcessedHanjaRecord): any {
  // ReviewStatus enum 매핑
  let reviewStatus: 'ok' | 'needsReview' | 'rejected' = 'ok';
  if (record.validationStatus === 'needs_review') {
    reviewStatus = 'needsReview';
  } else if (record.validationStatus === 'invalid') {
    reviewStatus = 'rejected';
  }

  return {
    character: record.character,
    meaning: record.meaning || null,
    koreanReading: record.reading || null,  // reading → koreanReading
    strokes: record.strokes || null,
    element: record.normalizedElement || null,
    yinYang: record.normalizedYinYang || null,
    review: reviewStatus,  // reviewStatus → review
    // metadata를 evidenceJSON에 저장
    evidenceJSON: record.metadata ? JSON.stringify(record.metadata) : null,
    decidedBy: 'ETL_PIPELINE',
    ruleset: 'hanja-data-v1',
    codepoint: record.character ? record.character.codePointAt(0) : null,
    // 추가 필드들은 null로 설정
    chineseReading: null,
    radical: null,
    usageFrequency: 0,
    nameFrequency: 0,
    category: null,
    gender: null
  };
}

/**
 * 단일 레코드 upsert
 */
async function upsertHanjaRecord(
  record: ProcessedHanjaRecord,
  recordIndex: number,
  logger: any
): Promise<{ success: boolean; errors: any[] }> {
  const errors: any[] = [];
  
  try {
    // 유효하지 않은 레코드는 건너뛰기
    if (record.validationStatus === 'invalid') {
      logger.debug(`Skipping invalid record ${recordIndex}: ${record.character}`);
      errors.push(createETLError(
        'validation',
        `Record marked as invalid, skipping database load`,
        record,
        `record_${recordIndex}`,
        'validationStatus'
      ));
      return { success: false, errors };
    }

    const prismaRecord = convertToPrismaRecord(record);
    
    // Prisma upsert를 사용하여 중복 처리
    const result = await prisma.hanjaDict.upsert({
      where: {
        character: record.character
      },
      update: {
        meaning: prismaRecord.meaning,
        koreanReading: prismaRecord.koreanReading,
        strokes: prismaRecord.strokes,
        element: prismaRecord.element,
        yinYang: prismaRecord.yinYang,
        review: prismaRecord.review,
        evidenceJSON: prismaRecord.evidenceJSON,
        decidedBy: prismaRecord.decidedBy,
        ruleset: prismaRecord.ruleset,
        codepoint: prismaRecord.codepoint,
        chineseReading: prismaRecord.chineseReading,
        radical: prismaRecord.radical,
        usageFrequency: prismaRecord.usageFrequency,
        nameFrequency: prismaRecord.nameFrequency,
        category: prismaRecord.category,
        gender: prismaRecord.gender,
        updatedAt: new Date()
      },
      create: prismaRecord  // 모든 필드를 그대로 사용
    });

    logger.debug(`Successfully upserted record ${recordIndex}: ${record.character} (ID: ${result.id})`);
    return { success: true, errors };

  } catch (error) {
    errors.push(createETLError(
      'system',
      `Database upsert failed for record ${recordIndex}: ${error instanceof Error ? error.message : String(error)}`,
      record,
      `record_${recordIndex}`,
      undefined,
      { error }
    ));
    return { success: false, errors };
  }
}

/**
 * 배치 데이터베이스 적재 처리
 */
async function loadBatch(
  records: ProcessedHanjaRecord[],
  batchIndex: number,
  logger: any
): Promise<{ loaded: number; errors: any[] }> {
  let loaded = 0;
  const errors: any[] = [];

  logger.debug(`Starting batch ${batchIndex} with ${records.length} records`);

  // 트랜잭션을 사용하여 배치 처리
  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const globalIndex = batchIndex * config.batchSize + i;
        
        try {
          // 유효하지 않은 레코드는 건너뛰기
          if (record.validationStatus === 'invalid') {
            errors.push(createETLError(
              'validation',
              `Record marked as invalid, skipping database load`,
              record,
              `record_${globalIndex}`,
              'validationStatus'
            ));
            continue;
          }

          const prismaRecord = convertToPrismaRecord(record);
          
          // 트랜잭션 내에서 upsert
          const result = await tx.hanjaDict.upsert({
            where: {
              character: record.character
            },
            update: {
              meaning: prismaRecord.meaning,
              koreanReading: prismaRecord.koreanReading,
              strokes: prismaRecord.strokes,
              element: prismaRecord.element,
              yinYang: prismaRecord.yinYang,
              review: prismaRecord.review,
              evidenceJSON: prismaRecord.evidenceJSON,
              decidedBy: prismaRecord.decidedBy,
              ruleset: prismaRecord.ruleset,
              codepoint: prismaRecord.codepoint,
              chineseReading: prismaRecord.chineseReading,
              radical: prismaRecord.radical,
              usageFrequency: prismaRecord.usageFrequency,
              nameFrequency: prismaRecord.nameFrequency,
              category: prismaRecord.category,
              gender: prismaRecord.gender,
              updatedAt: new Date()
            },
            create: prismaRecord
          });

          loaded++;
          logger.debug(`Loaded record: ${record.character} (ID: ${result.id})`);

        } catch (error) {
          errors.push(createETLError(
            'system',
            `Database upsert failed for record ${globalIndex}: ${error instanceof Error ? error.message : String(error)}`,
            record,
            `record_${globalIndex}`,
            undefined,
            { error }
          ));
        }
      }
    }, {
      timeout: 30000, // 30초 타임아웃
      maxWait: 5000   // 최대 5초 대기
    });

  } catch (transactionError) {
    // 트랜잭션 전체 실패
    errors.push(createETLError(
      'system',
      `Transaction failed for batch ${batchIndex}: ${transactionError instanceof Error ? transactionError.message : String(transactionError)}`,
      records,
      `batch_${batchIndex}`,
      undefined,
      { error: transactionError }
    ));
    loaded = 0; // 트랜잭션 실패시 모든 레코드 실패
  }

  logger.debug(`Batch ${batchIndex}: loaded ${loaded}/${records.length} records, ${errors.length} errors`);
  
  return { loaded, errors };
}

/**
 * 데이터베이스 통계 수집
 */
async function collectDatabaseStats(logger: any) {
  try {
    const totalRecords = await prisma.hanjaDict.count();
    const statusStats = await prisma.hanjaDict.groupBy({
      by: ['review'],
      _count: {
        review: true
      }
    });

    const elementStats = await prisma.hanjaDict.groupBy({
      by: ['element'],
      _count: {
        element: true
      },
      where: {
        element: { not: null }
      }
    });

    const yinYangStats = await prisma.hanjaDict.groupBy({
      by: ['yinYang'],
      _count: {
        yinYang: true
      },
      where: {
        yinYang: { not: null }
      }
    });

    return {
      totalRecords,
      statusDistribution: statusStats.reduce((acc, stat) => {
        acc[stat.review] = stat._count.review;
        return acc;
      }, {} as Record<string, number>),
      elementDistribution: elementStats.reduce((acc, stat) => {
        acc[stat.element || 'null'] = stat._count.element;
        return acc;
      }, {} as Record<string, number>),
      yinYangDistribution: yinYangStats.reduce((acc, stat) => {
        acc[stat.yinYang || 'null'] = stat._count.yinYang;
        return acc;
      }, {} as Record<string, number>)
    };

  } catch (error) {
    logger.warn('Failed to collect database statistics', { error });
    return {
      totalRecords: 0,
      statusDistribution: {},
      elementDistribution: {},
      yinYangDistribution: {}
    };
  }
}

/**
 * 메인 데이터베이스 적재 함수
 */
async function load(): Promise<ProcessingResult<any>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    // 검증된 데이터 로드
    const inputPath = join(config.inputDir, 'validated_data.json');
    logger.info(`Loading validated data from: ${inputPath}`);
    
    const validatedData = await readJsonFile<ValidatedData>(inputPath);
    logger.info(`Loaded ${validatedData.records.length} validated records`);

    // 데이터베이스 연결 테스트
    logger.info('Testing database connection...');
    await prisma.$connect();
    logger.info('Database connection successful');

    // 적재 전 통계
    const statsBefore = await collectDatabaseStats(logger);
    logger.info(`Database stats before load: ${JSON.stringify(statsBefore)}`);

    // 배치로 데이터베이스 적재 처리
    logger.info(`Processing database load in batches of ${config.batchSize}`);
    
    let totalLoaded = 0;
    const allErrors: any[] = [];

    await processBatches(
      validatedData.records,
      config.batchSize,
      async (batch, batchIndex) => {
        const result = await loadBatch(batch, batchIndex, logger);
        totalLoaded += result.loaded;
        allErrors.push(...result.errors);
        
        logger.updateProgress(
          (batchIndex + 1) * config.batchSize,
          validatedData.records.length,
          'Loading to database'
        );
        
        return [result.loaded]; // processBatches expects an array return
      }
    );

    // 적재 후 통계
    const statsAfter = await collectDatabaseStats(logger);
    logger.info(`Database stats after load: ${JSON.stringify(statsAfter)}`);

    // 적재 결과 데이터
    const loadResult = {
      recordsProcessed: validatedData.records.length,
      recordsLoaded: totalLoaded,
      recordsSkipped: validatedData.records.length - totalLoaded - allErrors.filter(e => e.type !== 'validation').length,
      recordsFailed: allErrors.filter(e => e.type !== 'validation').length,
      databaseStatsBefore: statsBefore,
      databaseStatsAfter: statsAfter,
      loadMetrics: {
        batchCount: Math.ceil(validatedData.records.length / config.batchSize),
        averageBatchSize: validatedData.records.length / Math.ceil(validatedData.records.length / config.batchSize),
        successRate: totalLoaded / validatedData.records.length
      }
    };

    // 결과 저장
    const outputPath = join(config.outputDir, 'load_result.json');
    await writeJsonFile(outputPath, loadResult);

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      loadResult,
      totalLoaded,
      allErrors,
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Database load completed. Output saved to: ${outputPath}`);
    logger.info(`Loaded ${totalLoaded}/${validatedData.records.length} records to database`);
    logger.info(`Success rate: ${Math.round((totalLoaded / validatedData.records.length) * 100)}%`);
    logger.info('Final database stats:', statsAfter);

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Database load failed: ${error instanceof Error ? error.message : String(error)}`,
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
    logger.error('Database load failed', { error });
    throw error;
  } finally {
    // Prisma 연결 정리
    await prisma.$disconnect();
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  load()
    .then(result => {
      console.log('✅ Database load completed successfully');
      console.log(`📊 Processed: ${result.processedCount} records`);
      console.log(`✅ Success: ${result.successCount} records`);
      console.log(`❌ Errors: ${result.errorCount} errors`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      
      if (result.data) {
        const data = result.data;
        console.log('\n📈 Load Metrics:');
        console.log(`  Records processed: ${data.recordsProcessed}`);
        console.log(`  Records loaded: ${data.recordsLoaded}`);
        console.log(`  Records skipped: ${data.recordsSkipped}`);
        console.log(`  Records failed: ${data.recordsFailed}`);
        console.log(`  Success rate: ${Math.round(data.loadMetrics.successRate * 100)}%`);
        console.log('\n📊 Database Stats After Load:');
        console.log(`  Total records: ${data.databaseStatsAfter.totalRecords}`);
        console.log('  Status distribution:', data.databaseStatsAfter.statusDistribution);
        console.log('  Element distribution:', data.databaseStatsAfter.elementDistribution);
        console.log('  YinYang distribution:', data.databaseStatsAfter.yinYangDistribution);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database load failed:', error.message);
      process.exit(1);
    });
}

export { load };