# 한자 데이터 ETL Pipeline

7단계로 구성된 한자 데이터 Extract-Transform-Load (ETL) 파이프라인입니다.

## 개요

이 ETL 파이프라인은 다양한 소스에서 한자 데이터를 수집하고, 정규화, 중복 제거, 충돌 해결, 검증을 거쳐 최종적으로 데이터베이스에 적재하는 과정을 자동화합니다.

## 파이프라인 구조

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 10_ingest   │ -> │ 20_normalize│ -> │ 30_dedup    │ -> │ 40_resolve  │
│ 데이터 수집 │    │ 데이터 정규화│    │ 중복 제거   │    │ 충돌 해결   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│ 70_report   │ <- │ 60_load     │ <- │ 50_validate │ <-------┘
│ 보고서 생성 │    │ DB 적재     │    │ 데이터 검증 │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 단계별 설명

### 1. 데이터 수집 (10_ingest.ts)
- 기존 hanja-data.ts에서 데이터 수집
- 향후 대법원 데이터, 외부 API 연동 지원
- 원시 데이터를 `raw_data.json`으로 저장

### 2. 데이터 정규화 (20_normalize.ts)
- 오행(Element)과 음양(YinYang)을 Prisma enum 형태로 정규화
- 획수, 신뢰도 점수 검증 및 정규화
- 한자 문자 유효성 검증 (CJK 유니코드 범위)
- 정규화된 데이터를 `normalized_data.json`으로 저장

### 3. 중복 제거 (30_dedup.ts)
- 동일한 한자 문자에 대한 중복 레코드 감지
- 품질 점수와 소스 우선순위 기반 병합 전략
- 메타데이터 보존하며 최적 레코드 선택
- 중복 제거된 데이터를 `merged_data.json`으로 저장

### 4. 충돌 해결 (40_resolve.ts)
- 데이터 일관성 문제 해결
- 정규화된 값과 원본 값 간 충돌 해결
- 유효성 검증 실패 항목 재검토
- 해결된 데이터를 `resolved_data.json`으로 저장

### 5. 데이터 검증 (50_validate.ts)
- 10개 검증 규칙 적용
- 필수 필드, CJK 문자 범위, 데이터 타입 검증
- 비즈니스 규칙 적용 (의미/훈음 중 하나 필수)
- 검증된 데이터를 `validated_data.json`으로 저장

### 6. 데이터베이스 적재 (60_load.ts)
- Prisma Client를 통한 데이터베이스 upsert
- 트랜잭션 기반 배치 처리
- 데이터베이스 통계 수집
- 적재 결과를 `load_result.json`으로 저장

### 7. 보고서 생성 (70_report.ts)
- 전체 파이프라인 실행 결과 종합
- 데이터 품질 분석 (완성도, 정확도, 일관성, 유효성)
- 성능 분석 및 병목 지점 식별
- HTML, JSON, Markdown 형태의 보고서 생성

## 사용법

### 전체 파이프라인 실행
```bash
# 기본 실행
npm run etl

# 에러 발생시에도 계속 실행
npm run etl:continue

# 특정 단계 건너뛰기 (예: 10_ingest, 20_normalize 건너뛰기)
npm run etl:skip=10_ingest,20_normalize
```

### 개별 단계 실행
```bash
# 개별 단계 실행
npm run etl:ingest      # 1단계: 데이터 수집
npm run etl:normalize   # 2단계: 데이터 정규화
npm run etl:dedup      # 3단계: 중복 제거
npm run etl:resolve    # 4단계: 충돌 해결
npm run etl:validate   # 5단계: 데이터 검증
npm run etl:load       # 6단계: DB 적재
npm run etl:report     # 7단계: 보고서 생성
```

### 직접 실행
```bash
# TypeScript로 직접 실행
npx tsx scripts/etl/run-pipeline.ts

# 개별 스크립트 실행
npx tsx scripts/etl/10_ingest.ts
npx tsx scripts/etl/20_normalize.ts
# ... 기타 등등
```

## 디렉토리 구조

```
scripts/etl/
├── lib/                      # 공통 라이브러리
│   ├── etl-types.ts         # TypeScript 타입 정의
│   ├── etl-logger.ts        # 로깅 시스템
│   └── etl-utils.ts         # 유틸리티 함수
├── data/                     # 데이터 저장소
│   ├── raw/                 # 원시 데이터
│   ├── normalized/          # 정규화된 데이터
│   ├── merged/              # 중복 제거된 데이터
│   ├── resolved/            # 충돌 해결된 데이터
│   ├── validated/           # 검증된 데이터
│   ├── loaded/              # DB 적재 결과
│   └── reports/             # 보고서 및 로그
├── 10_ingest.ts             # 1단계: 데이터 수집
├── 20_normalize.ts          # 2단계: 데이터 정규화
├── 30_dedup.ts              # 3단계: 중복 제거
├── 40_resolve.ts            # 4단계: 충돌 해결
├── 50_validate.ts           # 5단계: 데이터 검증
├── 60_load.ts               # 6단계: DB 적재
├── 70_report.ts             # 7단계: 보고서 생성
├── run-pipeline.ts          # 오케스트레이션 스크립트
└── README.md                # 이 문서
```

## 설정 및 환경 변수

ETL 파이프라인은 다음 환경 변수들을 사용합니다:

```bash
DATABASE_URL="your-database-url"    # Prisma 데이터베이스 연결 URL
```

## 로깅 및 모니터링

### 로그 레벨
- `debug`: 상세한 디버그 정보
- `info`: 일반적인 정보 메시지 (기본값)
- `warn`: 경고 메시지
- `error`: 에러 메시지

### 로그 출력
- 콘솔: 컬러 코딩된 실시간 로그
- 파일: `data/reports/etl-[timestamp].log`

### 체크포인트 및 복구
각 단계는 실행 후 체크포인트를 생성하여 실패시 복구를 지원합니다.

## 성능 최적화

### 배치 처리
- 기본 배치 크기: 100개 레코드
- 메모리 사용량에 따라 동적 조정 가능

### 병렬 처리
- 각 배치는 독립적으로 처리
- 데이터베이스 적재시 트랜잭션 보장

### 메모리 관리
- 대용량 데이터 처리를 위한 스트리밍 방식
- 메모리 사용량 모니터링 및 최적화

## 데이터 품질 규칙

### 필수 검증 규칙
1. **required_character**: 한자 문자 필드 필수
2. **valid_cjk_character**: CJK 유니코드 범위 검증
3. **required_meaning_or_reading**: 의미 또는 훈음 중 하나 필수
4. **valid_strokes_range**: 획수 1-50 범위
5. **valid_confidence_score**: 신뢰도 0-1 범위
6. **valid_element**: 유효한 오행 enum 값
7. **valid_yinyang**: 유효한 음양 enum 값
8. **valid_validation_status**: 유효한 검증 상태
9. **consistent_element_data**: 오행 데이터 일관성
10. **consistent_yinyang_data**: 음양 데이터 일관성

### 데이터 품질 지표
- **완성도**: 최종 적재 비율
- **정확도**: 에러 없는 레코드 비율  
- **일관성**: 중복 제거 후 일관성 유지율
- **유효성**: 검증 통과 비율

## 문제 해결

### 일반적인 문제들

#### 1. 데이터베이스 연결 실패
```bash
Error: Can't reach database server
```
**해결방법**: 
- DATABASE_URL 환경 변수 확인
- 데이터베이스 서버 상태 확인
- Prisma 마이그레이션 실행: `npx prisma db push`

#### 2. 메모리 부족
```bash
JavaScript heap out of memory
```
**해결방법**:
- Node.js 메모리 제한 증가: `NODE_OPTIONS="--max-old-space-size=4096" npm run etl`
- 배치 크기 감소: ETL 설정에서 `batchSize` 조정

#### 3. TypeScript 컴파일 에러
```bash
TS2307: Cannot find module
```
**해결방법**:
- 의존성 설치: `npm install`
- TypeScript 설정 확인: `tsconfig.json`

### 디버깅 팁

1. **개별 단계 실행**: 문제가 있는 특정 단계만 실행하여 디버깅
2. **로그 레벨 조정**: `debug` 레벨로 상세 로그 확인
3. **체크포인트 활용**: 중간 결과 파일 확인
4. **보고서 분석**: HTML 보고서로 시각적 분석

## 확장 및 커스터마이징

### 새로운 데이터 소스 추가
1. `10_ingest.ts`에 새로운 수집 함수 추가
2. 데이터 형태에 맞는 변환 로직 구현
3. 테스트 및 검증

### 새로운 검증 규칙 추가
1. `50_validate.ts`의 `validationRules` 배열에 새 규칙 추가
2. 규칙 함수와 에러 메시지 정의
3. 테스트 케이스 작성

### 커스텀 보고서 템플릿
1. `70_report.ts`의 `generateHTMLReport` 함수 수정
2. CSS 스타일 및 차트 라이브러리 추가
3. 새로운 메트릭 계산 로직 구현

## 라이센스

이 ETL 파이프라인은 사주 작명 플랫폼의 일부로 개발되었습니다.