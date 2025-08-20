#!/usr/bin/env npx tsx
// ETL Step 1 - Gov: 대법원 인명용 한자 데이터 수집
// Supreme Court 한자 데이터(10,163자)를 raw 형태로 변환 및 저장

import { readFileSync } from 'fs';
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

const STEP_NAME = '10_ingest_gov';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data/raw',
  outputDir: 'scripts/etl/data/raw',
  logLevel: 'info',
  batchSize: 1000,
  errorHandling: 'continue',
  createBackup: true
};

// Supreme Court 데이터 구조
interface GovHanjaRecord {
  rnum: number;       // 레코드 번호
  cd: string;         // 한자 코드 (hex)
  ex: number;         // 확장 플래그
  ineum: string;      // 한글 음
  in: string;         // 훈음 전체
  em: number;         // 특수 마커
  rad_id: number;     // 부수 ID
  type: string;       // 타입
  totstroke: number;  // 총 획수
  stroke: number;     // 획수
  isin: number;       // 포함 여부
  dic: string;        // 사전 정보
}

/**
 * hex 코드를 실제 한자 문자로 변환
 */
function hexToHanja(hexCode: string): string {
  try {
    // hexCode가 4-5자리 hex 문자열 (예: "04f3d")
    const codePoint = parseInt(hexCode, 16);
    return String.fromCodePoint(codePoint);
  } catch (error) {
    console.error(`Failed to convert hex ${hexCode} to character:`, error);
    return '';
  }
}

/**
 * 훈음에서 의미 추출
 */
function extractMeaning(inString: string): string {
  // "가 : 절(가)" 형태에서 "절" 추출
  const match = inString.match(/:\s*([^(]+)\(/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // 다른 형태일 경우 전체 반환
  return inString.replace(/^[^:]+:\s*/, '').trim();
}

/**
 * Supreme Court 데이터를 HanjaRecord로 변환
 */
function convertGovRecord(govRecord: GovHanjaRecord, index: number): HanjaRecord | null {
  try {
    const character = hexToHanja(govRecord.cd);
    if (!character) {
      return null;
    }

    const meaning = extractMeaning(govRecord.in);
    
    return {
      character,
      meaning: meaning || undefined,
      reading: govRecord.ineum || undefined,
      strokes: govRecord.totstroke > 0 ? govRecord.totstroke : 
               govRecord.stroke > 0 ? govRecord.stroke : undefined,
      source: 'supreme-court',
      confidenceScore: 1.0, // 공식 데이터는 최고 신뢰도
      metadata: {
        originalIndex: govRecord.rnum,
        hexCode: govRecord.cd,
        radicalId: govRecord.rad_id,
        type: govRecord.type,
        dictionaryInfo: govRecord.dic,
        importedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`Failed to convert record ${govRecord.rnum}:`, error);
    return null;
  }
}

/**
 * Supreme Court 데이터 수집 및 변환
 */
async function ingestSupremeCourtData(): Promise<ProcessingResult<RawData>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    // 원본 데이터 파일 읽기
    const inputPath = join(config.inputDir, 'supreme-court-hanja.json');
    logger.info(`Reading Supreme Court data from: ${inputPath}`);
    
    const rawContent = readFileSync(inputPath, 'utf8');
    const govRecords: GovHanjaRecord[] = JSON.parse(rawContent);
    
    logger.info(`Found ${govRecords.length} records in Supreme Court data`);

    // 변환 처리
    const records: HanjaRecord[] = [];
    const errors: any[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < govRecords.length; i++) {
      const govRecord = govRecords[i];
      
      try {
        const record = convertGovRecord(govRecord, i);
        
        if (record) {
          records.push(record);
          processedCount++;
        } else {
          skippedCount++;
          logger.debug(`Skipped record ${govRecord.rnum}: Invalid character conversion`);
        }
        
        // 진행 상황 로깅 (1000개마다)
        if ((i + 1) % 1000 === 0) {
          logger.info(`Progress: ${i + 1}/${govRecords.length} records processed`);
        }
      } catch (error) {
        errors.push(createETLError(
          'parsing',
          `Failed to parse Supreme Court record ${govRecord.rnum}`,
          govRecord,
          `gov_${govRecord.rnum}`,
          undefined,
          { 
            error: error instanceof Error ? error.message : String(error),
            hexCode: govRecord.cd
          }
        ));
      }
    }

    logger.info(`Conversion completed: ${processedCount} success, ${skippedCount} skipped, ${errors.length} errors`);

    // RawData 객체 생성
    const rawData: RawData = {
      records,
      source: {
        name: 'Supreme Court of Korea',
        url: 'https://github.com/rutopio/Korean-Name-Hanja-Charset',
        fetchedAt: new Date(),
        version: '2024'
      },
      metadata: {
        totalRecords: records.length,
        format: 'json',
        encoding: 'utf8'
      }
    };

    // 타임스탬프를 포함한 파일명으로 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = join(config.outputDir, `gov-${timestamp}.json`);
    await writeJsonFile(outputPath, rawData);

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      rawData,
      processedCount,
      errors,
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Supreme Court data ingestion completed. Output saved to: ${outputPath}`);
    logger.info(`Total records: ${records.length}, Skipped: ${skippedCount}, Errors: ${errors.length}`);

    // 샘플 레코드 출력 (검증용)
    if (records.length > 0) {
      logger.info('Sample records:');
      for (let i = 0; i < Math.min(3, records.length); i++) {
        const r = records[i];
        logger.info(`  ${r.character} (${r.reading}): ${r.meaning}`);
      }
    }

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Supreme Court data ingestion failed: ${error instanceof Error ? error.message : String(error)}`,
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
    logger.error('Supreme Court data ingestion failed', { error });
    throw error;
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestSupremeCourtData()
    .then(result => {
      console.log('✅ Supreme Court data ingestion completed successfully');
      console.log(`📊 Processed: ${result.processedCount} records`);
      console.log(`✅ Success: ${result.successCount} records`);
      console.log(`❌ Errors: ${result.errorCount} errors`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Supreme Court data ingestion failed:', error.message);
      process.exit(1);
    });
}

export { ingestSupremeCourtData };