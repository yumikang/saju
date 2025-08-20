#!/usr/bin/env npx tsx
// ETL Pipeline 오케스트레이션 스크립트
// 전체 7단계 ETL 파이프라인을 순차적으로 실행

import { ingest } from './10_ingest';
import { normalize } from './20_normalize';
import { deduplicate } from './30_dedup';
import { resolveConflicts } from './40_resolve';
import { validate } from './50_validate';
import { load } from './60_load';
import { generateReport } from './70_report';
import { createLogger } from './lib/etl-logger';
import { formatDuration } from './lib/etl-utils';

/**
 * ETL 파이프라인 설정
 */
interface PipelineConfig {
  skipSteps?: string[];
  continueOnError?: boolean;
  generateReportOnFailure?: boolean;
}

/**
 * 단계 실행 결과
 */
interface StepExecutionResult {
  stepName: string;
  success: boolean;
  duration: number;
  error?: Error;
  recordsProcessed?: number;
  recordsSuccessful?: number;
}

/**
 * ETL 파이프라인 실행 클래스
 */
class ETLPipelineOrchestrator {
  private config: PipelineConfig;
  private logger: any;
  private executionResults: StepExecutionResult[] = [];
  private startTime: Date;

  constructor(config: PipelineConfig = {}) {
    this.config = {
      skipSteps: [],
      continueOnError: false,
      generateReportOnFailure: true,
      ...config
    };
    this.logger = createLogger({ 
      inputDir: 'scripts/etl/data',
      outputDir: 'scripts/etl/data/reports',
      logLevel: 'info',
      batchSize: 1000,
      errorHandling: 'continue',
      createBackup: true
    });
    this.startTime = new Date();
  }

  /**
   * 단일 단계 실행
   */
  private async executeStep(
    stepName: string,
    stepFunction: () => Promise<any>
  ): Promise<StepExecutionResult> {
    const stepStart = Date.now();
    
    this.logger.info(`\n${'='.repeat(60)}`);
    this.logger.info(`🚀 Starting ETL Step: ${stepName}`);
    this.logger.info(`${'='.repeat(60)}`);

    try {
      const result = await stepFunction();
      const duration = Date.now() - stepStart;

      const stepResult: StepExecutionResult = {
        stepName,
        success: true,
        duration,
        recordsProcessed: result?.processedCount || 0,
        recordsSuccessful: result?.successCount || 0
      };

      this.executionResults.push(stepResult);
      
      this.logger.info(`✅ Step ${stepName} completed successfully`);
      this.logger.info(`   Duration: ${formatDuration(duration)}`);
      this.logger.info(`   Records: ${stepResult.recordsSuccessful}/${stepResult.recordsProcessed}`);

      return stepResult;

    } catch (error) {
      const duration = Date.now() - stepStart;
      
      const stepResult: StepExecutionResult = {
        stepName,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };

      this.executionResults.push(stepResult);
      
      this.logger.error(`❌ Step ${stepName} failed`);
      this.logger.error(`   Duration: ${formatDuration(duration)}`);
      this.logger.error(`   Error: ${stepResult.error?.message}`);

      if (!this.config.continueOnError) {
        throw error;
      }

      return stepResult;
    }
  }

  /**
   * 전체 파이프라인 실행
   */
  async execute(): Promise<{
    success: boolean;
    totalDuration: number;
    stepResults: StepExecutionResult[];
    summary: string;
  }> {
    this.logger.info('🎯 Starting ETL Pipeline Execution');
    this.logger.info(`📅 Start Time: ${this.startTime.toISOString()}`);
    this.logger.info(`⚙️  Configuration:`, this.config);

    const steps = [
      { name: '10_ingest', description: '데이터 수집', function: ingest },
      { name: '20_normalize', description: '데이터 정규화', function: normalize },
      { name: '30_dedup', description: '중복 제거', function: deduplicate },
      { name: '40_resolve', description: '충돌 해결', function: resolveConflicts },
      { name: '50_validate', description: '데이터 검증', function: validate },
      { name: '60_load', description: '데이터베이스 적재', function: load },
      { name: '70_report', description: '보고서 생성', function: generateReport }
    ];

    let pipelineSuccess = true;

    // 각 단계 실행
    for (const step of steps) {
      // 건너뛸 단계 확인
      if (this.config.skipSteps?.includes(step.name)) {
        this.logger.info(`⏭️  Skipping step: ${step.name} (${step.description})`);
        continue;
      }

      try {
        const stepResult = await this.executeStep(
          `${step.name} (${step.description})`,
          step.function
        );

        if (!stepResult.success) {
          pipelineSuccess = false;
          if (!this.config.continueOnError) {
            break;
          }
        }

      } catch (error) {
        this.logger.error(`💥 Pipeline execution stopped due to error in ${step.name}`);
        pipelineSuccess = false;
        break;
      }
    }

    // 실패시에도 보고서 생성 (옵션이 활성화된 경우)
    if (!pipelineSuccess && this.config.generateReportOnFailure) {
      const reportInResults = this.executionResults.some(r => r.stepName.includes('70_report'));
      if (!reportInResults) {
        this.logger.info('🔄 Generating failure report...');
        try {
          await this.executeStep('70_report (실패 보고서)', generateReport);
        } catch (reportError) {
          this.logger.warn('Failed to generate failure report:', reportError);
        }
      }
    }

    const totalDuration = Date.now() - this.startTime.getTime();
    const summary = this.generateSummary(pipelineSuccess, totalDuration);

    this.logger.info('\n' + '='.repeat(60));
    this.logger.info('🏁 ETL Pipeline Execution Completed');
    this.logger.info('='.repeat(60));
    this.logger.info(summary);

    return {
      success: pipelineSuccess,
      totalDuration,
      stepResults: this.executionResults,
      summary
    };
  }

  /**
   * 실행 요약 생성
   */
  private generateSummary(success: boolean, totalDuration: number): string {
    const successfulSteps = this.executionResults.filter(r => r.success).length;
    const totalSteps = this.executionResults.length;
    const totalRecordsProcessed = this.executionResults
      .reduce((sum, r) => sum + (r.recordsProcessed || 0), 0);
    const totalRecordsSuccessful = this.executionResults
      .reduce((sum, r) => sum + (r.recordsSuccessful || 0), 0);

    const lines = [
      `📊 Overall Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`,
      `⏱️  Total Duration: ${formatDuration(totalDuration)}`,
      `📈 Steps Completed: ${successfulSteps}/${totalSteps}`,
      `📋 Records Processed: ${totalRecordsProcessed.toLocaleString()}`,
      `✅ Records Successful: ${totalRecordsSuccessful.toLocaleString()}`,
      `📍 Success Rate: ${totalRecordsProcessed > 0 ? Math.round((totalRecordsSuccessful / totalRecordsProcessed) * 100) : 0}%`,
      '',
      '🔍 Step Details:'
    ];

    this.executionResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = formatDuration(result.duration);
      const records = result.recordsProcessed !== undefined 
        ? ` (${result.recordsSuccessful}/${result.recordsProcessed})` 
        : '';
      
      lines.push(`   ${status} ${result.stepName}: ${duration}${records}`);
      
      if (!result.success && result.error) {
        lines.push(`      ⚠️  ${result.error.message}`);
      }
    });

    if (!success) {
      lines.push('');
      lines.push('💡 Troubleshooting Tips:');
      lines.push('   1. Check individual step logs for detailed error information');
      lines.push('   2. Verify data integrity and database connections');
      lines.push('   3. Consider running failed steps individually for debugging');
      lines.push('   4. Review the generated report for quality insights');
    }

    return lines.join('\n');
  }
}

/**
 * 명령행 인자 파싱
 */
function parseCommandLineArgs(): PipelineConfig {
  const args = process.argv.slice(2);
  const config: PipelineConfig = {};

  args.forEach(arg => {
    if (arg === '--continue-on-error') {
      config.continueOnError = true;
    } else if (arg === '--no-report-on-failure') {
      config.generateReportOnFailure = false;
    } else if (arg.startsWith('--skip=')) {
      const stepsToSkip = arg.replace('--skip=', '').split(',');
      config.skipSteps = stepsToSkip;
    }
  });

  return config;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 ETL Pipeline Orchestrator Starting...\n');
  
  try {
    const config = parseCommandLineArgs();
    const orchestrator = new ETLPipelineOrchestrator(config);
    
    const result = await orchestrator.execute();
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ETL Pipeline Orchestration Completed');
    console.log('='.repeat(80));
    
    if (result.success) {
      console.log('✅ All steps completed successfully!');
      console.log(`📊 Total Duration: ${formatDuration(result.totalDuration)}`);
      console.log('📋 Check the reports directory for detailed results.');
      process.exit(0);
    } else {
      console.log('❌ Pipeline execution failed.');
      console.log('🔍 Check the logs and reports for detailed error information.');
      console.log('\nFailed steps:');
      result.stepResults
        .filter(step => !step.success)
        .forEach(step => {
          console.log(`   • ${step.stepName}: ${step.error?.message}`);
        });
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Fatal error in pipeline orchestration:');
    console.error(error);
    process.exit(1);
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ETLPipelineOrchestrator };