#!/usr/bin/env npx tsx
// ETL Step 7: 보고서 생성 (Report Generation)
// 전체 ETL 파이프라인의 실행 결과 종합 및 보고서 생성

import { join } from 'path';
import { promises as fs } from 'fs';
import { 
  ETLConfig, 
  PipelineResult,
  ProcessingResult,
  RawData,
  NormalizedData,
  MergedData,
  ResolvedData,
  ValidatedData
} from './lib/etl-types';
import { createLogger } from './lib/etl-logger';
import { 
  readJsonFile,
  writeJsonFile, 
  createProcessingResult, 
  createETLError,
  formatDuration,
  formatBytes,
  summarizeErrors,
  fileExists
} from './lib/etl-utils';

const STEP_NAME = '70_report';

// 기본 설정
const config: ETLConfig = {
  inputDir: 'scripts/etl/data',
  outputDir: 'scripts/etl/data/reports',
  logLevel: 'info',
  batchSize: 1000,
  errorHandling: 'continue',
  createBackup: true
};

/**
 * ETL 단계별 결과 수집
 */
async function collectStepResults(logger: any): Promise<Array<{
  stepName: string;
  result: ProcessingResult | null;
  duration: number;
  inputFile?: string;
  outputFile?: string;
  dataPath?: string;
}>> {
  const steps = [
    { name: '10_ingest', inputFile: null, outputFile: 'raw/raw_data.json' },
    { name: '20_normalize', inputFile: 'raw/raw_data.json', outputFile: 'normalized/normalized_data.json' },
    { name: '30_dedup', inputFile: 'normalized/normalized_data.json', outputFile: 'merged/merged_data.json' },
    { name: '40_resolve', inputFile: 'merged/merged_data.json', outputFile: 'resolved/resolved_data.json' },
    { name: '50_validate', inputFile: 'resolved/resolved_data.json', outputFile: 'validated/validated_data.json' },
    { name: '60_load', inputFile: 'validated/validated_data.json', outputFile: 'loaded/load_result.json' }
  ];

  const stepResults = [];

  for (const step of steps) {
    try {
      let result: ProcessingResult | null = null;
      let duration = 0;
      const dataPath = step.outputFile ? join(config.inputDir, step.outputFile) : undefined;

      // 단계별 결과 파일이 있는지 확인하고 로드
      if (dataPath && await fileExists(dataPath)) {
        const data = await readJsonFile<any>(dataPath);
        
        // ProcessingResult 형태의 메타데이터 추출 시도
        if (data.processingTimeMs !== undefined) {
          result = data as ProcessingResult;
          duration = result.metrics?.processingTimeMs || 0;
        } else {
          // 데이터만 있는 경우 가상의 결과 생성
          result = {
            success: true,
            processedCount: Array.isArray(data.records) ? data.records.length : 0,
            successCount: Array.isArray(data.records) ? data.records.length : 0,
            errorCount: 0,
            data,
            errors: [],
            metrics: {
              processingTimeMs: 0,
              memoryUsageBytes: 0,
              throughputPerSecond: 0,
              dataSizeBytes: 0
            },
            startTime: new Date(),
            endTime: new Date()
          };
        }
      }

      stepResults.push({
        stepName: step.name,
        result,
        duration,
        inputFile: step.inputFile,
        outputFile: step.outputFile,
        dataPath
      });

      logger.debug(`Collected results for step: ${step.name}`);

    } catch (error) {
      logger.warn(`Failed to collect results for step ${step.name}:`, error);
      stepResults.push({
        stepName: step.name,
        result: null,
        duration: 0,
        inputFile: step.inputFile,
        outputFile: step.outputFile
      });
    }
  }

  return stepResults;
}

/**
 * 데이터 품질 분석
 */
async function analyzeDataQuality(stepResults: any[], logger: any): Promise<any> {
  logger.info('Analyzing data quality across pipeline stages');

  const qualityMetrics = {
    dataFlowSummary: {
      ingested: 0,
      normalized: 0,
      deduped: 0,
      resolved: 0,
      validated: 0,
      loaded: 0
    },
    qualityIndicators: {
      completenessRate: 0,
      accuracyRate: 0,
      consistencyRate: 0,
      validityRate: 0
    },
    fieldCompleteness: {} as Record<string, number>,
    errorAnalysis: {
      totalErrors: 0,
      errorsByType: {} as Record<string, number>,
      errorsByStep: {} as Record<string, number>
    }
  };

  try {
    // 각 단계별 레코드 수 추출
    for (const step of stepResults) {
      if (step.result) {
        const stepName = step.stepName.replace(/^\d+_/, '');
        qualityMetrics.dataFlowSummary[stepName as keyof typeof qualityMetrics.dataFlowSummary] = 
          step.result.successCount || 0;

        // 에러 분석
        qualityMetrics.errorAnalysis.totalErrors += step.result.errorCount || 0;
        qualityMetrics.errorAnalysis.errorsByStep[stepName] = step.result.errorCount || 0;

        // 에러 타입별 분석
        if (step.result.errors) {
          step.result.errors.forEach((error: any) => {
            const errorType = error.type || 'unknown';
            qualityMetrics.errorAnalysis.errorsByType[errorType] = 
              (qualityMetrics.errorAnalysis.errorsByType[errorType] || 0) + 1;
          });
        }
      }
    }

    // 품질 지표 계산
    const ingestedCount = qualityMetrics.dataFlowSummary.ingested;
    if (ingestedCount > 0) {
      qualityMetrics.qualityIndicators.completenessRate = 
        qualityMetrics.dataFlowSummary.loaded / ingestedCount;
      qualityMetrics.qualityIndicators.validityRate = 
        qualityMetrics.dataFlowSummary.validated / ingestedCount;
      qualityMetrics.qualityIndicators.accuracyRate = 
        (ingestedCount - qualityMetrics.errorAnalysis.totalErrors) / ingestedCount;
      qualityMetrics.qualityIndicators.consistencyRate = 
        qualityMetrics.dataFlowSummary.resolved / qualityMetrics.dataFlowSummary.deduped;
    }

    // 필드 완성도 분석 (최종 데이터를 기반으로)
    const loadStep = stepResults.find(s => s.stepName === '60_load');
    if (loadStep && loadStep.dataPath) {
      const loadData = await readJsonFile<any>(loadStep.dataPath);
      if (loadData.databaseStatsAfter) {
        const stats = loadData.databaseStatsAfter;
        qualityMetrics.fieldCompleteness = {
          element: Object.values(stats.elementDistribution).reduce((a: number, b: number) => a + b, 0) / stats.totalRecords,
          yinYang: Object.values(stats.yinYangDistribution).reduce((a: number, b: number) => a + b, 0) / stats.totalRecords
        };
      }
    }

  } catch (error) {
    logger.warn('Failed to analyze data quality:', error);
  }

  return qualityMetrics;
}

/**
 * 성능 분석
 */
function analyzePerformance(stepResults: any[]): any {
  const performanceMetrics = {
    totalDuration: 0,
    stepDurations: {} as Record<string, number>,
    throughputAnalysis: {
      overallThroughput: 0,
      stepThroughput: {} as Record<string, number>
    },
    resourceUsage: {
      peakMemoryUsage: 0,
      averageMemoryUsage: 0,
      totalDataProcessed: 0
    },
    bottleneckAnalysis: {
      slowestStep: '',
      slowestStepDuration: 0,
      recommendedOptimizations: [] as string[]
    }
  };

  let totalProcessed = 0;
  let memorySum = 0;
  let memoryCount = 0;

  stepResults.forEach(step => {
    if (step.result) {
      const stepName = step.stepName.replace(/^\d+_/, '');
      const duration = step.result.metrics?.processingTimeMs || 0;
      const processed = step.result.processedCount || 0;

      performanceMetrics.totalDuration += duration;
      performanceMetrics.stepDurations[stepName] = duration;

      if (processed > 0 && duration > 0) {
        performanceMetrics.throughputAnalysis.stepThroughput[stepName] = 
          Math.round((processed * 1000) / duration);
      }

      totalProcessed += processed;

      // 메모리 사용량 분석
      if (step.result.metrics?.memoryUsageBytes) {
        const memoryMB = step.result.metrics.memoryUsageBytes / (1024 * 1024);
        performanceMetrics.resourceUsage.peakMemoryUsage = 
          Math.max(performanceMetrics.resourceUsage.peakMemoryUsage, memoryMB);
        memorySum += memoryMB;
        memoryCount++;
      }

      // 병목 분석
      if (duration > performanceMetrics.bottleneckAnalysis.slowestStepDuration) {
        performanceMetrics.bottleneckAnalysis.slowestStep = stepName;
        performanceMetrics.bottleneckAnalysis.slowestStepDuration = duration;
      }
    }
  });

  // 전체 처리량 계산
  if (totalProcessed > 0 && performanceMetrics.totalDuration > 0) {
    performanceMetrics.throughputAnalysis.overallThroughput = 
      Math.round((totalProcessed * 1000) / performanceMetrics.totalDuration);
  }

  // 평균 메모리 사용량
  if (memoryCount > 0) {
    performanceMetrics.resourceUsage.averageMemoryUsage = memorySum / memoryCount;
  }

  performanceMetrics.resourceUsage.totalDataProcessed = totalProcessed;

  // 최적화 권장사항 생성
  const recommendations = [];
  if (performanceMetrics.bottleneckAnalysis.slowestStepDuration > 10000) {
    recommendations.push(`Consider optimizing ${performanceMetrics.bottleneckAnalysis.slowestStep} step (${formatDuration(performanceMetrics.bottleneckAnalysis.slowestStepDuration)})`);
  }
  if (performanceMetrics.resourceUsage.peakMemoryUsage > 500) {
    recommendations.push('Consider reducing batch sizes to optimize memory usage');
  }
  if (performanceMetrics.throughputAnalysis.overallThroughput < 100) {
    recommendations.push('Consider parallel processing or database optimization');
  }
  performanceMetrics.bottleneckAnalysis.recommendedOptimizations = recommendations;

  return performanceMetrics;
}

/**
 * HTML 보고서 생성
 */
function generateHTMLReport(
  pipelineResult: PipelineResult,
  qualityMetrics: any,
  performanceMetrics: any
): string {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ETL Pipeline Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .status { padding: 10px; border-radius: 6px; font-weight: bold; display: inline-block; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .failed { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007acc; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007acc; }
        .metric-label { color: #666; font-size: 0.9em; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .progress-bar { background: #e9ecef; border-radius: 4px; overflow: hidden; height: 20px; }
        .progress-fill { background: #007acc; height: 100%; transition: width 0.3s; }
        .error-summary { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 10px 0; }
        .recommendations { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 15px; margin: 10px 0; }
        .chart { margin: 20px 0; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 한자 데이터 ETL Pipeline 보고서</h1>
        
        <div class="timestamp">
            생성일시: ${new Date().toLocaleString('ko-KR')}
        </div>

        <div class="status ${pipelineResult.success ? 'success' : 'failed'}">
            전체 상태: ${pipelineResult.success ? '✅ 성공' : '❌ 실패'}
        </div>

        <h2>📊 전체 요약</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${pipelineResult.finalStats.totalRecords}</div>
                <div class="metric-label">총 처리 레코드</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${pipelineResult.finalStats.validRecords}</div>
                <div class="metric-label">유효 레코드</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatDuration(pipelineResult.totalDuration)}</div>
                <div class="metric-label">총 처리 시간</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${performanceMetrics.throughputAnalysis.overallThroughput}/s</div>
                <div class="metric-label">평균 처리량</div>
            </div>
        </div>

        <h2>🔄 단계별 처리 결과</h2>
        <table>
            <thead>
                <tr>
                    <th>단계</th>
                    <th>상태</th>
                    <th>처리 레코드</th>
                    <th>성공 레코드</th>
                    <th>에러 수</th>
                    <th>처리 시간</th>
                    <th>처리량</th>
                </tr>
            </thead>
            <tbody>
                ${pipelineResult.steps.map(step => `
                <tr>
                    <td>${step.stepName}</td>
                    <td>${step.result.success ? '✅' : '❌'}</td>
                    <td>${step.result.processedCount.toLocaleString()}</td>
                    <td>${step.result.successCount.toLocaleString()}</td>
                    <td>${step.result.errorCount}</td>
                    <td>${formatDuration(step.duration)}</td>
                    <td>${performanceMetrics.throughputAnalysis.stepThroughput[step.stepName.replace(/^\d+_/, '')] || 0}/s</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>📈 데이터 품질 분석</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${Math.round(qualityMetrics.qualityIndicators.completenessRate * 100)}%</div>
                <div class="metric-label">완성도</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(qualityMetrics.qualityIndicators.accuracyRate * 100)}%</div>
                <div class="metric-label">정확도</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(qualityMetrics.qualityIndicators.validityRate * 100)}%</div>
                <div class="metric-label">유효성</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(qualityMetrics.qualityIndicators.consistencyRate * 100)}%</div>
                <div class="metric-label">일관성</div>
            </div>
        </div>

        <h3>데이터 흐름</h3>
        <table>
            <thead>
                <tr>
                    <th>단계</th>
                    <th>레코드 수</th>
                    <th>변화율</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(qualityMetrics.dataFlowSummary).map(([stage, count], index, arr) => {
                  const prevCount = index > 0 ? Object.values(qualityMetrics.dataFlowSummary)[index - 1] : count;
                  const changeRate = prevCount > 0 ? ((count as number - (prevCount as number)) / (prevCount as number) * 100) : 0;
                  return `
                  <tr>
                      <td>${stage}</td>
                      <td>${(count as number).toLocaleString()}</td>
                      <td>${changeRate > 0 ? '+' : ''}${changeRate.toFixed(1)}%</td>
                  </tr>
                  `;
                }).join('')}
            </tbody>
        </table>

        ${qualityMetrics.errorAnalysis.totalErrors > 0 ? `
        <div class="error-summary">
            <h3>⚠️ 에러 분석</h3>
            <p>총 ${qualityMetrics.errorAnalysis.totalErrors}개의 에러가 발생했습니다.</p>
            <ul>
                ${Object.entries(qualityMetrics.errorAnalysis.errorsByType).map(([type, count]) => 
                  `<li>${type}: ${count}개</li>`
                ).join('')}
            </ul>
        </div>
        ` : ''}

        <h2>⚡ 성능 분석</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${Math.round(performanceMetrics.resourceUsage.peakMemoryUsage)}MB</div>
                <div class="metric-label">최대 메모리 사용량</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${performanceMetrics.bottleneckAnalysis.slowestStep}</div>
                <div class="metric-label">가장 느린 단계</div>
            </div>
        </div>

        ${performanceMetrics.bottleneckAnalysis.recommendedOptimizations.length > 0 ? `
        <div class="recommendations">
            <h3>💡 최적화 권장사항</h3>
            <ul>
                ${performanceMetrics.bottleneckAnalysis.recommendedOptimizations.map(rec => 
                  `<li>${rec}</li>`
                ).join('')}
            </ul>
        </div>
        ` : ''}

        <h2>📋 상세 정보</h2>
        <details>
            <summary>원시 데이터 (JSON)</summary>
            <pre style="background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px;">
${JSON.stringify({ pipelineResult, qualityMetrics, performanceMetrics }, null, 2)}
            </pre>
        </details>
    </div>
</body>
</html>
`;

  return html;
}

/**
 * 메인 보고서 생성 함수
 */
async function generateReport(): Promise<ProcessingResult<PipelineResult>> {
  const logger = createLogger(config);
  const startTime = new Date();
  
  logger.startStep(STEP_NAME);

  try {
    // 단계별 결과 수집
    logger.info('Collecting ETL pipeline results...');
    const stepResults = await collectStepResults(logger);

    // 파이프라인 전체 결과 생성
    const totalDuration = stepResults.reduce((sum, step) => sum + step.duration, 0);
    const allSuccessful = stepResults.every(step => step.result?.success !== false);

    // 최종 통계 계산
    const lastStep = stepResults[stepResults.length - 1];
    const finalStats = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      needsReviewRecords: 0
    };

    // 60_load 단계에서 최종 통계 추출
    const loadStep = stepResults.find(s => s.stepName === '60_load');
    if (loadStep && loadStep.result?.data) {
      const loadData = loadStep.result.data;
      finalStats.totalRecords = loadData.recordsProcessed || 0;
      finalStats.validRecords = loadData.recordsLoaded || 0;
      finalStats.invalidRecords = loadData.recordsFailed || 0;
      finalStats.needsReviewRecords = loadData.recordsSkipped || 0;
    }

    const pipelineResult: PipelineResult = {
      success: allSuccessful,
      steps: stepResults.map(step => ({
        stepName: step.stepName,
        result: step.result || {
          success: false,
          processedCount: 0,
          successCount: 0,
          errorCount: 0,
          data: null,
          errors: [],
          metrics: {
            processingTimeMs: 0,
            memoryUsageBytes: 0,
            throughputPerSecond: 0,
            dataSizeBytes: 0
          },
          startTime: new Date(),
          endTime: new Date()
        },
        duration: step.duration
      })),
      totalDuration,
      finalStats
    };

    // 데이터 품질 분석
    logger.info('Analyzing data quality...');
    const qualityMetrics = await analyzeDataQuality(stepResults, logger);

    // 성능 분석
    logger.info('Analyzing performance...');
    const performanceMetrics = analyzePerformance(stepResults);

    // JSON 보고서 생성
    const reportData = {
      pipelineResult,
      qualityMetrics,
      performanceMetrics,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const jsonReportPath = join(config.outputDir, 'etl_pipeline_report.json');
    await writeJsonFile(jsonReportPath, reportData);

    // HTML 보고서 생성
    logger.info('Generating HTML report...');
    const htmlReport = generateHTMLReport(pipelineResult, qualityMetrics, performanceMetrics);
    const htmlReportPath = join(config.outputDir, 'etl_pipeline_report.html');
    await fs.writeFile(htmlReportPath, htmlReport, 'utf8');

    // 요약 텍스트 보고서 생성
    const summaryLines = [
      '# ETL Pipeline 실행 요약',
      '',
      `실행 일시: ${new Date().toLocaleString('ko-KR')}`,
      `전체 상태: ${pipelineResult.success ? '성공' : '실패'}`,
      `총 처리 시간: ${formatDuration(pipelineResult.totalDuration)}`,
      `총 처리 레코드: ${finalStats.totalRecords.toLocaleString()}`,
      `유효 레코드: ${finalStats.validRecords.toLocaleString()}`,
      `성공률: ${Math.round((finalStats.validRecords / finalStats.totalRecords) * 100)}%`,
      '',
      '## 단계별 결과',
      ...pipelineResult.steps.map(step => 
        `- ${step.stepName}: ${step.result.success ? '✅' : '❌'} (${step.result.successCount}/${step.result.processedCount})`
      ),
      '',
      '## 품질 지표',
      `- 완성도: ${Math.round(qualityMetrics.qualityIndicators.completenessRate * 100)}%`,
      `- 정확도: ${Math.round(qualityMetrics.qualityIndicators.accuracyRate * 100)}%`,
      `- 유효성: ${Math.round(qualityMetrics.qualityIndicators.validityRate * 100)}%`,
      `- 일관성: ${Math.round(qualityMetrics.qualityIndicators.consistencyRate * 100)}%`,
      '',
      performanceMetrics.bottleneckAnalysis.recommendedOptimizations.length > 0 ? '## 권장사항' : '',
      ...performanceMetrics.bottleneckAnalysis.recommendedOptimizations.map(rec => `- ${rec}`)
    ];

    const summaryReportPath = join(config.outputDir, 'etl_pipeline_summary.md');
    await fs.writeFile(summaryReportPath, summaryLines.join('\n'), 'utf8');

    // 처리 결과 생성
    const endTime = new Date();
    const result = createProcessingResult(
      pipelineResult,
      pipelineResult.steps.length,
      [],
      startTime,
      endTime
    );

    logger.endStep(STEP_NAME, result);
    logger.info(`Report generation completed.`);
    logger.info(`JSON report: ${jsonReportPath}`);
    logger.info(`HTML report: ${htmlReportPath}`);
    logger.info(`Summary report: ${summaryReportPath}`);
    logger.info(`Pipeline success: ${pipelineResult.success ? 'YES' : 'NO'}`);
    logger.info(`Total duration: ${formatDuration(pipelineResult.totalDuration)}`);
    logger.info(`Final records: ${finalStats.validRecords}/${finalStats.totalRecords}`);

    return result;

  } catch (error) {
    const endTime = new Date();
    const errorObj = createETLError(
      'system',
      `Report generation failed: ${error instanceof Error ? error.message : String(error)}`,
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
    logger.error('Report generation failed', { error });
    throw error;
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport()
    .then(result => {
      console.log('✅ Report generation completed successfully');
      console.log(`📊 Processed: ${result.processedCount} steps`);
      console.log(`⏱️  Duration: ${result.metrics.processingTimeMs}ms`);
      
      if (result.data) {
        const pipelineResult = result.data;
        console.log('\n📈 Pipeline Summary:');
        console.log(`  Overall status: ${pipelineResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`  Total duration: ${formatDuration(pipelineResult.totalDuration)}`);
        console.log(`  Final records: ${pipelineResult.finalStats.validRecords}/${pipelineResult.finalStats.totalRecords}`);
        console.log(`  Success rate: ${Math.round((pipelineResult.finalStats.validRecords / pipelineResult.finalStats.totalRecords) * 100)}%`);
      }
      
      console.log('\n📋 Generated Reports:');
      console.log('  - etl_pipeline_report.json (detailed JSON data)');
      console.log('  - etl_pipeline_report.html (visual dashboard)');
      console.log('  - etl_pipeline_summary.md (executive summary)');
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Report generation failed:', error.message);
      process.exit(1);
    });
}

export { generateReport };