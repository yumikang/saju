// ETL 파이프라인 로깅 시스템
// 단계별 로깅, 메트릭 수집, 에러 트래킹

import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { ETLLogger, ProcessingResult, ETLConfig } from './etl-types';

export class ETLLoggerImpl implements ETLLogger {
  private logFile: string;
  private currentStep?: string;
  private stepStartTime?: Date;

  constructor(
    private config: ETLConfig,
    private logDir: string = 'scripts/etl/data/reports'
  ) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = join(this.logDir, `etl-${timestamp}.log`);
    this.writeLog('info', 'ETL Logger initialized', { config: this.config });
  }

  debug(message: string, meta?: any): void {
    if (this.config.logLevel === 'debug') {
      this.writeLog('debug', message, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (['debug', 'info'].includes(this.config.logLevel)) {
      this.writeLog('info', message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (['debug', 'info', 'warn'].includes(this.config.logLevel)) {
      this.writeLog('warn', message, meta);
    }
  }

  error(message: string, meta?: any): void {
    this.writeLog('error', message, meta);
  }

  startStep(stepName: string): void {
    this.currentStep = stepName;
    this.stepStartTime = new Date();
    this.info(`=== Starting ETL Step: ${stepName} ===`, {
      step: stepName,
      startTime: this.stepStartTime
    });
  }

  endStep(stepName: string, result: ProcessingResult): void {
    const endTime = new Date();
    const duration = this.stepStartTime 
      ? endTime.getTime() - this.stepStartTime.getTime()
      : 0;

    this.info(`=== Completed ETL Step: ${stepName} ===`, {
      step: stepName,
      duration,
      result: {
        success: result.success,
        processedCount: result.processedCount,
        successCount: result.successCount,
        errorCount: result.errorCount,
        processingTimeMs: result.metrics.processingTimeMs
      }
    });

    // 에러가 있으면 상세 로깅
    if (result.errors.length > 0) {
      this.warn(`Step ${stepName} completed with ${result.errors.length} errors`, {
        errors: result.errors.slice(0, 10) // 처음 10개만 로깅
      });
    }

    this.currentStep = undefined;
    this.stepStartTime = undefined;
  }

  private writeLog(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      step: this.currentStep,
      message,
      meta
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      appendFileSync(this.logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }

    // 콘솔에도 출력 (컬러링 포함)
    this.writeToConsole(level, message, meta);
  }

  private writeToConsole(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
    
    let coloredPrefix: string;
    switch (level) {
      case 'debug':
        coloredPrefix = `\x1b[90m${prefix}\x1b[0m`; // 회색
        break;
      case 'info':
        coloredPrefix = `\x1b[36m${prefix}\x1b[0m`; // 청록색
        break;
      case 'warn':
        coloredPrefix = `\x1b[33m${prefix}\x1b[0m`; // 노란색
        break;
      case 'error':
        coloredPrefix = `\x1b[31m${prefix}\x1b[0m`; // 빨간색
        break;
      default:
        coloredPrefix = prefix;
    }

    console.log(`${coloredPrefix} ${message}`);
    
    if (meta && this.config.logLevel === 'debug') {
      console.log('  Meta:', JSON.stringify(meta, null, 2));
    }
  }

  // 현재 단계의 진행상황 업데이트
  updateProgress(current: number, total: number, operation?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressMessage = operation 
      ? `${operation}: ${current}/${total} (${percentage}%)`
      : `Progress: ${current}/${total} (${percentage}%)`;
    
    this.debug(progressMessage, {
      current,
      total,
      percentage,
      operation
    });
  }

  // 메트릭 로깅
  logMetrics(metrics: Record<string, number>, stepName?: string): void {
    this.info(`Metrics${stepName ? ` for ${stepName}` : ''}`, metrics);
  }

  // 에러 배치 로깅
  logErrors(errors: any[], stepName?: string): void {
    if (errors.length === 0) return;

    this.error(`Found ${errors.length} errors${stepName ? ` in ${stepName}` : ''}`, {
      errorCount: errors.length,
      errorTypes: this.groupErrorsByType(errors),
      sampleErrors: errors.slice(0, 5) // 처음 5개 에러만 샘플로
    });
  }

  private groupErrorsByType(errors: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    errors.forEach(error => {
      const type = error.type || 'unknown';
      groups[type] = (groups[type] || 0) + 1;
    });
    return groups;
  }

  // 성능 측정 헬퍼
  measureTime<T>(operation: string, fn: () => T): T {
    const startTime = Date.now();
    this.debug(`Starting: ${operation}`);
    
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.debug(`Completed: ${operation} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Failed: ${operation} (${duration}ms)`, { error });
      throw error;
    }
  }

  // 비동기 성능 측정 헬퍼
  async measureTimeAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.debug(`Starting: ${operation}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.debug(`Completed: ${operation} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Failed: ${operation} (${duration}ms)`, { error });
      throw error;
    }
  }
}

// 기본 설정으로 로거 생성
export function createLogger(config: Partial<ETLConfig> = {}): ETLLogger {
  const defaultConfig: ETLConfig = {
    inputDir: 'scripts/etl/data/raw',
    outputDir: 'scripts/etl/data/normalized',
    logLevel: 'info',
    batchSize: 1000,
    errorHandling: 'continue',
    createBackup: true,
    ...config
  };

  return new ETLLoggerImpl(defaultConfig);
}

// 콘솔 전용 로거 (파일 없이)
export class ConsoleLogger implements ETLLogger {
  constructor(private logLevel: string = 'info') {}

  debug(message: string, meta?: any): void {
    if (this.logLevel === 'debug') {
      console.log(`🔍 DEBUG: ${message}`, meta || '');
    }
  }

  info(message: string, meta?: any): void {
    if (['debug', 'info'].includes(this.logLevel)) {
      console.log(`ℹ️  INFO: ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    if (['debug', 'info', 'warn'].includes(this.logLevel)) {
      console.warn(`⚠️  WARN: ${message}`, meta || '');
    }
  }

  error(message: string, meta?: any): void {
    console.error(`❌ ERROR: ${message}`, meta || '');
  }

  startStep(stepName: string): void {
    console.log(`\n🚀 Starting: ${stepName}`);
  }

  endStep(stepName: string, result: ProcessingResult): void {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Completed: ${stepName} (${result.successCount}/${result.processedCount} success)`);
  }
}