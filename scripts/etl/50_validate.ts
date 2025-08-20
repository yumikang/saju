#!/usr/bin/env npx tsx
// ETL Step 5: 검증 (Validation)
// 데이터 품질 규칙에 따른 최종 검증

import { join } from 'path';
import { 
  ETLConfig, 
  ResolvedData,
  ValidatedData,
  ProcessedHanjaRecord,
  ProcessingResult,
  ValidationReport,
  RuleResult
} from './lib/etl-types';
import { createLogger } from './lib/etl-logger';
import { 
  readJsonFile,
  writeJsonFile, 
  createProcessingResult, 
  createETLError,
  createValidationReport,
  processBatches
} from './lib/etl-utils';

const STEP_NAME = '50_validate';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data/resolved',
  outputDir: 'scripts/etl/data/validated',
  logLevel: 'info',
  batchSize: 100,
  errorHandling: 'continue',
  createBackup: true
};

/**
 * 검증 규칙 인터페이스
 */
interface ValidationRule {
  name: string;
  description: string;
  validate: (record: ProcessedHanjaRecord) => boolean;
  errorMessage: (record: ProcessedHanjaRecord) => string;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * 검증 규칙 정의
 */
const validationRules: ValidationRule[] = [
  {
    name: 'required_character',
    description: '한자 문자 필드는 필수입니다',
    severity: 'critical',
    validate: (record) => {
      return record.character && 
             typeof record.character === 'string' && 
             record.character.length === 1;
    },
    errorMessage: (record) => `Character field is missing or invalid: "${record.character}"`
  },
  {
    name: 'valid_cjk_character',
    description: '한자 문자는 CJK 유니코드 범위에 있어야 합니다',
    severity: 'critical',
    validate: (record) => {
      return /^[\u4e00-\u9fff]$/.test(record.character);
    },
    errorMessage: (record) => `Character is not in CJK range: "${record.character}"`
  },
  {
    name: 'required_meaning_or_reading',
    description: '의미나 훈음 중 하나는 반드시 있어야 합니다',
    severity: 'critical',
    validate: (record) => {
      return (record.meaning && record.meaning.length > 0) || 
             (record.reading && record.reading.length > 0);
    },
    errorMessage: (record) => `Missing both meaning and reading for character: "${record.character}"`
  },
  {
    name: 'valid_strokes_range',
    description: '획수는 1-50 범위 내의 정수여야 합니다',
    severity: 'warning',
    validate: (record) => {
      if (record.strokes === undefined) return true; // 선택적 필드
      return Number.isInteger(record.strokes) && 
             record.strokes >= 1 && 
             record.strokes <= 50;
    },
    errorMessage: (record) => `Invalid strokes value: ${record.strokes} (expected: 1-50)`
  },
  {
    name: 'valid_confidence_score',
    description: '신뢰도 점수는 0-1 범위의 숫자여야 합니다',
    severity: 'warning',
    validate: (record) => {
      return typeof record.confidenceScore === 'number' &&
             record.confidenceScore >= 0 &&
             record.confidenceScore <= 1;
    },
    errorMessage: (record) => `Invalid confidence score: ${record.confidenceScore} (expected: 0-1)`
  },
  {
    name: 'valid_element',
    description: '정규화된 오행 값이 유효한 Prisma enum 값이어야 합니다',
    severity: 'warning',
    validate: (record) => {
      if (!record.normalizedElement) return true; // 선택적 필드
      const validElements = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];
      return validElements.includes(record.normalizedElement);
    },
    errorMessage: (record) => `Invalid normalized element: ${record.normalizedElement}`
  },
  {
    name: 'valid_yinyang',
    description: '정규화된 음양 값이 유효한 Prisma enum 값이어야 합니다',
    severity: 'warning',
    validate: (record) => {
      if (!record.normalizedYinYang) return true; // 선택적 필드
      const validYinYang = ['YIN', 'YANG'];
      return validYinYang.includes(record.normalizedYinYang);
    },
    errorMessage: (record) => `Invalid normalized YinYang: ${record.normalizedYinYang}`
  },
  {
    name: 'valid_validation_status',
    description: '검증 상태가 유효한 값이어야 합니다',
    severity: 'critical',
    validate: (record) => {
      const validStatuses = ['ok', 'needs_review', 'invalid'];
      return validStatuses.includes(record.validationStatus);
    },
    errorMessage: (record) => `Invalid validation status: ${record.validationStatus}`
  },
  {
    name: 'consistent_element_data',
    description: '오행 관련 데이터가 일관성을 가져야 합니다',
    severity: 'info',
    validate: (record) => {
      // element가 있으면 normalizedElement도 있어야 함 (정규화 성공)
      if (record.element && !record.normalizedElement) {
        return false;
      }
      return true;
    },
    errorMessage: (record) => `Element data inconsistent: element="${record.element}" but normalizedElement="${record.normalizedElement}"`
  },
  {
    name: 'consistent_yinyang_data',
    description: '음양 관련 데이터가 일관성을 가져야 합니다',
    severity: 'info',
    validate: (record) => {
      // yinYang이 있으면 normalizedYinYang도 있어야 함 (정규화 성공)
      if (record.yinYang && !record.normalizedYinYang) {
        return false;
      }
      return true;
    },
    errorMessage: (record) => `YinYang data inconsistent: yinYang="${record.yinYang}" but normalizedYinYang="${record.normalizedYinYang}"`
  },
  {
    name: 'no_duplicate_characters',
    description: '중복된 한자 문자가 없어야 합니다',
    severity: 'critical',
    validate: (record) => {
      // 이 규칙은 배치 레벨에서 검증됨
      return true;
    },
    errorMessage: (record) => `Duplicate character found: ${record.character}`
  }
];

/**
 * 단일 레코드 검증
 */
function validateRecord(
  record: ProcessedHanjaRecord, 
  recordIndex: number
): { isValid: boolean; ruleResults: RuleResult[] } {
  const ruleResults: RuleResult[] = [];
  let allPassed = true;

  for (const rule of validationRules) {
    if (rule.name === 'no_duplicate_characters') {
      continue; // 배치 레벨에서 처리
    }

    const passed = rule.validate(record);
    if (!passed) {
      allPassed = false;
    }

    ruleResults.push({
      ruleName: rule.name,
      description: rule.description,
      passed,
      errorMessage: passed ? undefined : rule.errorMessage(record),
      checkedCount: 1,
      failedCount: passed ? 0 : 1,
      failedExamples: passed ? [] : [record]
    });
  }

  return { isValid: allPassed, ruleResults };
}

/**
 * 중복 문자 검증
 */
function validateNoDuplicates(records: ProcessedHanjaRecord[]): RuleResult {
  const characterCounts = new Map<string, number>();
  const duplicates: ProcessedHanjaRecord[] = [];

  records.forEach(record => {
    const char = record.character;
    const count = characterCounts.get(char) || 0;
    characterCounts.set(char, count + 1);

    if (count > 0) {
      duplicates.push(record);
    }
  });

  const hasDuplicates = duplicates.length > 0;

  return {
    ruleName: 'no_duplicate_characters',
    description: '중복된 한자 문자가 없어야 합니다',
    passed: !hasDuplicates,
    errorMessage: hasDuplicates ? `Found ${duplicates.length} duplicate characters` : undefined,
    checkedCount: records.length,
    failedCount: duplicates.length,
    failedExamples: duplicates.slice(0, 5) // 처음 5개만
  };
}

/**
 * 배치 검증 처리
 */
async function validateBatch(
  records: ProcessedHanjaRecord[],
  batchIndex: number,
  logger: any
): Promise<{ validated: ProcessedHanjaRecord[], errors: any[], ruleResults: RuleResult[] }> {
  const validated: ProcessedHanjaRecord[] = [];
  const errors: any[] = [];
  const batchRuleResults: RuleResult[] = [];

  records.forEach((record, index) => {
    const globalIndex = batchIndex * config.batchSize + index;
    
    try {
      const validation = validateRecord(record, globalIndex);
      
      // 검증 결과를 레코드에 추가
      const validatedRecord = {
        ...record,
        metadata: {
          ...record.metadata,
          validationResults: validation.ruleResults,
          validatedAt: new Date().toISOString()
        }
      };

      // 치명적 오류가 있으면 invalid로 설정
      const hasCriticalErrors = validation.ruleResults.some(
        result => !result.passed && 
        validationRules.find(rule => rule.name === result.ruleName)?.severity === 'critical'
      );

      if (hasCriticalErrors) {
        validatedRecord.validationStatus = 'invalid';
      } else if (!validation.isValid) {
        validatedRecord.validationStatus = 'needs_review';
      }

      validated.push(validatedRecord);

      // 배치 레벨 규칙 결과 누적
      validation.ruleResults.forEach(ruleResult => {
        const existing = batchRuleResults.find(r => r.ruleName === ruleResult.ruleName);
        if (existing) {
          existing.checkedCount += ruleResult.checkedCount;
          existing.failedCount += ruleResult.failedCount;
          if (ruleResult.failedExamples) {
            existing.failedExamples = (existing.failedExamples || []).concat(ruleResult.failedExamples);
          }
          existing.passed = existing.passed && ruleResult.passed;
        } else {
          batchRuleResults.push({ ...ruleResult });
        }
      });

    } catch (error) {
      errors.push(createETLError(
        'validation',
        `Validation failed for record ${globalIndex}: ${error instanceof Error ? error.message : String(error)}`,
        record,
        `record_${globalIndex}`,
        undefined,
        { error }
      ));
    }
  });

  logger.debug(`Batch ${batchIndex}: validated ${records.length} records, ${validated.length} passed validation`);
  
  return { validated, errors, ruleResults: batchRuleResults };
}

/**
 * 전체 검증 결과 집계
 */
function aggregateValidationResults(batchResults: RuleResult[][]): RuleResult[] {
  const aggregated: RuleResult[] = [];

  // 모든 규칙에 대해 배치 결과 집계
  for (const rule of validationRules) {
    let totalChecked = 0;
    let totalFailed = 0;
    let allPassed = true;
    const allFailedExamples: any[] = [];

    batchResults.forEach(batchRuleResults => {
      const ruleResult = batchRuleResults.find(r => r.ruleName === rule.name);
      if (ruleResult) {
        totalChecked += ruleResult.checkedCount;
        totalFailed += ruleResult.failedCount;
        allPassed = allPassed && ruleResult.passed;
        if (ruleResult.failedExamples) {
          allFailedExamples.push(...ruleResult.failedExamples);
        }
      }
    });

    aggregated.push({
      ruleName: rule.name,
      description: rule.description,
      passed: allPassed && totalFailed === 0,
      errorMessage: totalFailed > 0 ? `${totalFailed} records failed ${rule.name}` : undefined,
      checkedCount: totalChecked,
      failedCount: totalFailed,
      failedExamples: allFailedExamples.slice(0, 10) // 최대 10개만
    });
  }

  return aggregated;
}

/**
 * 메인 검증 함수
 */
async function validate(): Promise<ProcessingResult<ValidatedData>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    // 해결된 데이터 로드
    const inputPath = join(config.inputDir, 'resolved_data.json');
    logger.info(`Loading resolved data from: ${inputPath}`);
    
    const resolvedData = await readJsonFile<ResolvedData>(inputPath);
    logger.info(`Loaded ${resolvedData.records.length} resolved records`);

    // 배치로 검증 처리
    logger.info(`Processing validation in batches of ${config.batchSize}`);
    
    const allValidated: ProcessedHanjaRecord[] = [];
    const allErrors: any[] = [];
    const allRuleResults: RuleResult[][] = [];

    const batchResults = await processBatches(
      resolvedData.records,
      config.batchSize,
      async (batch, batchIndex) => {
        const result = await validateBatch(batch, batchIndex, logger);
        allValidated.push(...result.validated);
        allErrors.push(...result.errors);
        allRuleResults.push(result.ruleResults);
        
        logger.updateProgress(
          (batchIndex + 1) * config.batchSize,
          resolvedData.records.length,
          'Validating records'
        );
        
        return result.validated;
      }
    );

    // 중복 검증 (전체 데이터셋에 대해)
    logger.info('Checking for duplicate characters');
    const duplicateRule = validateNoDuplicates(allValidated);
    
    // 전체 검증 결과 집계
    const aggregatedRules = aggregateValidationResults(allRuleResults);
    aggregatedRules.push(duplicateRule);

    // 검증 리포트 생성
    const totalRules = aggregatedRules.length;
    const passedRules = aggregatedRules.filter(rule => rule.passed).length;
    const isValid = passedRules === totalRules;

    const validationReport = createValidationReport(
      isValid,
      passedRules,
      totalRules,
      aggregatedRules
    );

    // 검증된 데이터 객체 생성
    const validatedData: ValidatedData = {
      records: allValidated,
      validationReport
    };

    // 결과 저장
    const outputPath = join(config.outputDir, 'validated_data.json');
    await writeJsonFile(outputPath, validatedData);

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      validatedData,
      allValidated.length,
      allErrors,
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Validation completed. Output saved to: ${outputPath}`);
    logger.info(`Validated ${allValidated.length} records`);
    logger.info(`Validation summary: ${validationReport.summary}`);
    
    // 검증 실패 규칙 로깅
    const failedRules = aggregatedRules.filter(rule => !rule.passed);
    if (failedRules.length > 0) {
      logger.warn('Failed validation rules:');
      failedRules.forEach(rule => {
        logger.warn(`  - ${rule.ruleName}: ${rule.failedCount}/${rule.checkedCount} failed`);
      });
    }

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
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
    logger.error('Validation failed', { error });
    throw error;
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  validate()
    .then(result => {
      console.log('✅ Validation completed successfully');
      console.log(`📊 Processed: ${result.processedCount} records`);
      console.log(`✅ Success: ${result.successCount} records`);
      console.log(`❌ Errors: ${result.errorCount} errors`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      
      if (result.data?.validationReport) {
        const report = result.data.validationReport;
        console.log('\n📈 Validation Report:');
        console.log(`  Overall status: ${report.isValid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`  Rules passed: ${report.passedRules}/${report.totalRules}`);
        console.log(`  Summary: ${report.summary}`);
        
        const failedRules = report.ruleResults.filter(rule => !rule.passed);
        if (failedRules.length > 0) {
          console.log('\n  Failed rules:');
          failedRules.forEach(rule => {
            console.log(`    - ${rule.ruleName}: ${rule.failedCount} failures`);
          });
        }
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
}

export { validate };