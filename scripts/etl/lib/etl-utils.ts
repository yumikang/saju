// ETL 파이프라인 공통 유틸리티
// 파일 I/O, 메트릭 계산, 체크포인트 관리

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { 
  ETLConfig, 
  ProcessingResult, 
  ProcessingMetrics, 
  ETLError,
  ETLStepContext,
  ValidationReport 
} from './etl-types';

/**
 * JSON 파일 안전하게 읽기
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error}`);
  }
}

/**
 * JSON 파일 안전하게 쓰기 (디렉토리 자동 생성)
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    // 디렉토리가 없으면 생성
    await fs.mkdir(dirname(filePath), { recursive: true });
    
    // JSON 파일 쓰기 (들여쓰기 포함)
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error}`);
  }
}

/**
 * 파일 존재 여부 확인
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 체크포인트 저장
 */
export async function saveCheckpoint<T>(
  stepName: string, 
  data: T, 
  config: ETLConfig
): Promise<void> {
  const checkpointPath = join(config.outputDir, `checkpoint_${stepName}.json`);
  await writeJsonFile(checkpointPath, {
    stepName,
    timestamp: new Date().toISOString(),
    data
  });
}

/**
 * 체크포인트 로드
 */
export async function loadCheckpoint<T>(
  stepName: string, 
  config: ETLConfig
): Promise<T | null> {
  const checkpointPath = join(config.outputDir, `checkpoint_${stepName}.json`);
  
  if (!(await fileExists(checkpointPath))) {
    return null;
  }

  try {
    const checkpoint = await readJsonFile<any>(checkpointPath);
    return checkpoint.data;
  } catch {
    return null;
  }
}

/**
 * 백업 파일 생성
 */
export async function createBackup(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) {
    throw new Error(`Source file does not exist: ${filePath}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  
  const content = await fs.readFile(filePath);
  await fs.writeFile(backupPath, content);
  
  return backupPath;
}

/**
 * 메트릭 계산
 */
export function calculateMetrics(
  startTime: Date,
  endTime: Date,
  processedCount: number,
  dataSizeBytes: number = 0
): ProcessingMetrics {
  const processingTimeMs = endTime.getTime() - startTime.getTime();
  const throughputPerSecond = processingTimeMs > 0 
    ? Math.round((processedCount * 1000) / processingTimeMs)
    : 0;

  return {
    processingTimeMs,
    memoryUsageBytes: process.memoryUsage().heapUsed,
    throughputPerSecond,
    dataSizeBytes
  };
}

/**
 * ProcessingResult 생성 헬퍼
 */
export function createProcessingResult<T>(
  data: T,
  successCount: number,
  errors: ETLError[],
  startTime: Date,
  endTime: Date = new Date(),
  dataSizeBytes: number = 0
): ProcessingResult<T> {
  const processedCount = successCount + errors.length;
  const metrics = calculateMetrics(startTime, endTime, processedCount, dataSizeBytes);

  return {
    success: errors.length === 0,
    processedCount,
    successCount,
    errorCount: errors.length,
    data,
    errors,
    metrics,
    startTime,
    endTime
  };
}

/**
 * ETL 에러 생성 헬퍼
 */
export function createETLError(
  type: 'validation' | 'parsing' | 'processing' | 'system',
  message: string,
  originalValue?: any,
  recordId?: string,
  field?: string,
  details?: Record<string, any>
): ETLError {
  return {
    type,
    message,
    originalValue,
    recordId,
    field,
    details,
    timestamp: new Date()
  };
}

/**
 * 배치 처리 헬퍼
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[], batchIndex: number) => Promise<R[]>,
  onProgress?: (current: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    
    const batchResults = await processor(batch, batchIndex);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }

  return results;
}

/**
 * 메모리 사용량 모니터링
 */
export function getMemoryUsage(): { used: number; total: number; percentage: number } {
  const usage = process.memoryUsage();
  const total = usage.heapTotal;
  const used = usage.heapUsed;
  const percentage = Math.round((used / total) * 100);

  return { used, total, percentage };
}

/**
 * 파일 크기 계산
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * 데이터 압축률 계산
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * 안전한 문자열 변환
 */
export function safeStringify(value: any): string {
  try {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return String(value);
  } catch {
    return '[UNPARSEABLE]';
  }
}

/**
 * 에러 그룹화
 */
export function groupErrorsByType(errors: ETLError[]): Record<string, ETLError[]> {
  const groups: Record<string, ETLError[]> = {};
  
  errors.forEach(error => {
    const key = error.type || 'unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(error);
  });

  return groups;
}

/**
 * 에러 요약 생성
 */
export function summarizeErrors(errors: ETLError[]): string {
  if (errors.length === 0) return 'No errors';

  const grouped = groupErrorsByType(errors);
  const summary = Object.entries(grouped)
    .map(([type, typeErrors]) => `${type}: ${typeErrors.length}`)
    .join(', ');

  return `Total ${errors.length} errors (${summary})`;
}

/**
 * 진행률 표시 헬퍼
 */
export function formatProgress(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  return `[${progressBar}] ${current}/${total} (${percentage}%)`;
}

/**
 * 시간 포맷팅
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

/**
 * 바이트 크기 포맷팅
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * ETL 단계 실행 컨텍스트 생성
 */
export function createStepContext(
  stepName: string,
  config: ETLConfig,
  logger: any,
  inputPath: string,
  outputPath: string,
  saveCheckpoint: boolean = true
): ETLStepContext {
  return {
    stepName,
    config,
    logger,
    inputPath,
    outputPath,
    saveCheckpoint
  };
}

/**
 * 기본 검증 리포트 생성
 */
export function createValidationReport(
  isValid: boolean,
  passedRules: number,
  totalRules: number,
  ruleResults: any[] = []
): ValidationReport {
  return {
    isValid,
    totalRules,
    passedRules,
    failedRules: totalRules - passedRules,
    ruleResults,
    summary: isValid 
      ? `All ${totalRules} validation rules passed`
      : `${totalRules - passedRules} of ${totalRules} validation rules failed`
  };
}