// ETL 파이프라인 공통 타입 정의
// 모든 ETL 스크립트에서 사용하는 기본 인터페이스

export interface ETLConfig {
  /** 입력 데이터 디렉토리 */
  inputDir: string;
  /** 출력 데이터 디렉토리 */
  outputDir: string;
  /** 로그 레벨 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** 배치 크기 (메모리 최적화용) */
  batchSize: number;
  /** 에러 발생시 처리 방식 */
  errorHandling: 'throw' | 'continue' | 'skip';
  /** 백업 생성 여부 */
  createBackup: boolean;
}

export interface ProcessingResult<T = any> {
  /** 처리 성공 여부 */
  success: boolean;
  /** 처리된 레코드 수 */
  processedCount: number;
  /** 성공한 레코드 수 */
  successCount: number;
  /** 실패한 레코드 수 */
  errorCount: number;
  /** 처리 결과 데이터 */
  data?: T;
  /** 에러 목록 */
  errors: ETLError[];
  /** 처리 메트릭 */
  metrics: ProcessingMetrics;
  /** 처리 시작 시간 */
  startTime: Date;
  /** 처리 완료 시간 */
  endTime: Date;
}

export interface ETLError {
  /** 에러 타입 */
  type: 'validation' | 'parsing' | 'processing' | 'system';
  /** 에러 메시지 */
  message: string;
  /** 원본 값 */
  originalValue?: any;
  /** 레코드 식별자 */
  recordId?: string;
  /** 필드명 */
  field?: string;
  /** 라인 번호 */
  lineNumber?: number;
  /** 상세 에러 정보 */
  details?: Record<string, any>;
  /** 에러 발생 시간 */
  timestamp: Date;
}

export interface ProcessingMetrics {
  /** 처리 시간 (밀리초) */
  processingTimeMs: number;
  /** 메모리 사용량 (바이트) */
  memoryUsageBytes: number;
  /** 처리량 (레코드/초) */
  throughputPerSecond: number;
  /** 데이터 크기 (바이트) */
  dataSizeBytes: number;
  /** 압축률 (있는 경우) */
  compressionRatio?: number;
}

export interface ValidationReport {
  /** 검증 통과 여부 */
  isValid: boolean;
  /** 총 검증 규칙 수 */
  totalRules: number;
  /** 통과한 규칙 수 */
  passedRules: number;
  /** 실패한 규칙 수 */
  failedRules: number;
  /** 규칙별 검증 결과 */
  ruleResults: RuleResult[];
  /** 검증 요약 */
  summary: string;
}

export interface RuleResult {
  /** 규칙 이름 */
  ruleName: string;
  /** 규칙 설명 */
  description: string;
  /** 통과 여부 */
  passed: boolean;
  /** 에러 메시지 (실패시) */
  errorMessage?: string;
  /** 검증된 레코드 수 */
  checkedCount: number;
  /** 실패한 레코드 수 */
  failedCount: number;
  /** 실패한 레코드 예시 */
  failedExamples?: any[];
}

// 한자 데이터 관련 타입
export interface HanjaRecord {
  /** 한자 문자 */
  character: string;
  /** 의미 */
  meaning?: string;
  /** 훈음 */
  reading?: string;
  /** 획수 */
  strokes?: number;
  /** 오행 (원본 문자열) */
  element?: string;
  /** 음양 (원본 문자열) */
  yinYang?: string;
  /** 데이터 소스 */
  source?: string;
  /** 신뢰도 스코어 */
  confidenceScore?: number;
  /** 메타데이터 */
  metadata?: Record<string, any>;
}

export interface ProcessedHanjaRecord extends HanjaRecord {
  /** 정규화된 오행 */
  normalizedElement?: string;
  /** 정규화된 음양 */
  normalizedYinYang?: string;
  /** 검증 상태 */
  validationStatus: 'ok' | 'needs_review' | 'invalid';
  /** 처리 로그 */
  processingLog: string[];
  /** 중복 검사 결과 */
  duplicateInfo?: {
    isDuplicate: boolean;
    duplicateOf?: string;
    mergeStrategy?: string;
  };
}

// ETL 단계별 데이터 타입
export interface RawData {
  /** 원시 데이터 */
  records: HanjaRecord[];
  /** 데이터 소스 정보 */
  source: {
    name: string;
    url?: string;
    fetchedAt: Date;
    version?: string;
  };
  /** 메타데이터 */
  metadata: {
    totalRecords: number;
    format: string;
    encoding?: string;
  };
}

export interface NormalizedData {
  /** 정규화된 레코드 */
  records: ProcessedHanjaRecord[];
  /** 정규화 메트릭 */
  normalizationMetrics: {
    totalRecords: number;
    normalizedSuccessfully: number;
    normalizationErrors: number;
    fieldNormalizationStats: Record<string, {
      attempted: number;
      successful: number;
      failed: number;
    }>;
  };
}

export interface MergedData {
  /** 중복 제거 및 병합된 레코드 */
  records: ProcessedHanjaRecord[];
  /** 병합 메트릭 */
  mergeMetrics: {
    originalCount: number;
    duplicatesFound: number;
    duplicatesRemoved: number;
    finalCount: number;
    mergeStrategies: Record<string, number>;
  };
}

export interface ResolvedData {
  /** 충돌 해결된 레코드 */
  records: ProcessedHanjaRecord[];
  /** 충돌 해결 메트릭 */
  conflictMetrics: {
    conflictsFound: number;
    conflictsResolved: number;
    conflictsRemaining: number;
    resolutionStrategies: Record<string, number>;
  };
}

export interface ValidatedData {
  /** 검증 완료된 레코드 */
  records: ProcessedHanjaRecord[];
  /** 검증 리포트 */
  validationReport: ValidationReport;
}

// 로깅 관련
export interface ETLLogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  startStep(stepName: string): void;
  endStep(stepName: string, result: ProcessingResult): void;
}

// 단계별 실행 컨텍스트
export interface ETLStepContext {
  /** 단계 이름 */
  stepName: string;
  /** 설정 */
  config: ETLConfig;
  /** 로거 */
  logger: ETLLogger;
  /** 입력 파일 경로 */
  inputPath: string;
  /** 출력 파일 경로 */
  outputPath: string;
  /** 체크포인트 저장 여부 */
  saveCheckpoint: boolean;
}

// 파이프라인 전체 실행 결과
export interface PipelineResult {
  /** 전체 성공 여부 */
  success: boolean;
  /** 실행된 단계들 */
  steps: Array<{
    stepName: string;
    result: ProcessingResult;
    duration: number;
  }>;
  /** 전체 실행 시간 */
  totalDuration: number;
  /** 최종 데이터 통계 */
  finalStats: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    needsReviewRecords: number;
  };
}