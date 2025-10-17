지금까지 만든 “정규화/검증/리뷰” 흐름을 **데이터 규칙(Contracts)**로 못 박고, ETL 파이프라인과 버전·리뷰 체계를 붙이면 5,000자 규모까지 그대로 확장돼요. 아래를 그대로 운영 표준으로 쓰면 됩니다.

⸻

0) 핵심 원칙(요약)
	1.	문자 1행 원칙: DB의 HanjaDict는 문자(코드포인트)당 1행
	2.	읽기 분리: 다중 읽기는 HanjaReading(character, reading, soundElem)로 분리 관리
	3.	원본 보존 + 통합 규칙: 소스는 최대한 있는 그대로(중복 허용) → 통합 레이어에서 정규화/병합
	4.	표준값 강제: 오행=CJK(“金木水火土”), 음양=한글(“음/양”) — 변환 유틸로 유일 경로 강제
	5.	충돌은 데이터로 관리: review=needs_review, evidenceJSON, decidedBy, ruleset로 근거 추적
	6.	버전 가능 시드: 시드는 idempotent(upsert) + 소스 버전 태그로 재현성 보장

⸻

1) 데이터 규칙(Contracts)

1-1. 표준 필드 값
	•	Element: '金' | '木' | '水' | '火' | '土' (CJK 고정)
	•	YinYang: '음' | '양' | null (한글 고정)
	•	Strokes: > 0 정수
	•	Character: 단일 코드포인트(NFKC 정규화) + 유니코드 스칼라 값 저장 권장(예: codepoint=0x661F)

1-2. 고유성/제약
	•	HanjaDict.character 유니크
	•	HanjaReading: unique(character, reading)
	•	(선택) Element, YinYang를 Prisma enum으로 제한 → 회귀 방지

1-3. 변환 규칙(불변)
	•	normalizeElement: 한글/영문/공백/대소문자 → CJK 한 글자
	•	normalizeYinYang: 陰/陽/음/양/공백 → 음/양/null
	•	어댑터에서만 호출하고, DB 직전까지 반드시 거치게 한다.

⸻

2) 스키마(요약)

enum Element { 金 木 水 火 土 }
enum YinYang { 음 양 }
enum ReviewStatus { ok needs_review }

model HanjaDict {
  id            Int           @id @default(autoincrement())
  character     String        @unique
  meaning       String?
  strokes       Int?
  element       Element?
  yinYang       YinYang?
  usageFrequency Int?         // 인기도
  nameFrequency  Int?
  review        ReviewStatus  @default(ok)
  evidenceScore Int?
  evidenceJSON  String?
  decidedBy     String?       // base | expanded | strokeRule | soundRule | manual | auto
  ruleset       String?       // 예: RULESET_V2_2025_08
  codepoint     Int?          // 0x661F 같은 정수 저장
  updatedAt     DateTime      @updatedAt

  @@index([element])
  @@index([usageFrequency])
}

model HanjaReading {
  id         Int      @id @default(autoincrement())
  character  String
  reading    String
  soundElem  Element?
  isPrimary  Boolean  @default(false)

  @@unique([character, reading])
  @@index([reading])
}

(법적 허용셋은 별도 HanjaLegal에 보관: 인명용 여부/허용 독음/이체자 목록/출처 버전)

⸻

3) ETL 파이프라인(5,000자 확장용)

3-1. 단계
	1.	Ingest(수집): 외부/내부 TS/CSV/PDF/HTML → staging JSON
	2.	Normalize(정규화): normalizeElement/YinYang + NFKC + 트림 + 타입 캐스팅
	3.	Dedup(병합):
	•	문자 기준으로 병합(가장 메타 풍부한 레코드 우선)
	•	읽기 수집(키/행 어디 있든 모두 모음)
	4.	Resolve(충돌 해결): resolveElement(가중치 + 리뷰 플래그)
	5.	Validate(검증): 계약 위반/결측/비표준 값/유실 문자 검출
	6.	Load(적재): Prisma upsert(idempotent) + ruleset/sourceTag 기록
	7.	Report(리포트): 신규/변경/삭제 diff, 충돌/리뷰 큐, 통계

3-2. 파일 구조(예)

scripts/etl/
  10_fetch.ts           // 외부 소스 가져오기(법령 PDF/CSV 등)
  20_parse_*           // 소스별 파서
  30_normalize.ts      // 표준화 유틸 호출
  40_dedup_merge.ts    // 문자 기준 병합 + readings 수집
  50_resolve_conflict.ts // resolveElement
  60_validate.ts       // 계약 검사
  70_seed.ts           // Prisma upsert
  80_report.ts         // diff/이상치 리포트 출력


⸻

4) 충돌 정책(운영버전)
	•	임시 정책 v1(지금 적용 중)
	•	입력 근거: base/expanded/획수룰/음운룰
	•	합의 다수 득표 → 채택, 박빙/동점 → needs_review
	•	UI에서 needs_review는 오행 텍스트 마스킹
	•	향후
	•	권위 소스별 가중치 테이블 도입(예: Kangxi=0.9, 국립국어원=0.8 …)
	•	들어오는 즉시 자동 재결정 → review 상태 갱신(섀도우 리컴퓨팅)

⸻

5) 대용량(5,000+) 운영 팁

5-1. 성능
	•	인덱스: character 유니크, reading 인덱스, element/usageFrequency 인덱스
	•	배치 upsert: 1,000건씩 청크 처리, 트랜잭션 사용
	•	캐시: 정적 룰테이블/상생·상극 매트릭스는 메모리 캐시 + 버전 태그

5-2. 회귀 방지
	•	데이터 테스트(Vitest):
	•	“char 유니크 수 전/후 동일”
	•	“같은 키 내 char|reading 중복 없음”
	•	“모든 값이 표준값 집합에 포함”
	•	스냅샷: 전체 카디널리티(문자 수), 오행 분포, 평균 획수 → 갑작스런 변동 알림
	•	CI: ETL 풀 파이프라인을 CI에서 돌리고, 임계 초과 시 배포 차단

5-3. 증분(Incremental) 로드
	•	소스에 버전/개정일 태그(예: scourt_pdf_2025-06-26)
	•	변경분만 계산해 delta upsert(신규/변경/삭제 리포트 분리)

5-4. 데이터 품질 대시보드
	•	총 문자수, 인명용 커버리지, needs_review 개수 추이, 충돌 Top N
	•	오행/음양 분포 히스토리, 결측/비표준 카운트, 평균 획수

⸻

6) 가져오기 규칙(여러 소스 혼합 시)
	1.	원본 보존: 소스별 raw를 그대로 저장(sources/raw/{sourceTag}.json)
	2.	소스 신뢰도 테이블:
	•	base=0.4, expanded=0.4, strokeRule=0.3, soundRule=0.3(임시)
	•	향후 Kangxi/국립국어원/법령표 들어오면 상향
	3.	우선 병합 → 그다음 충돌해결:
	•	병합은 결측 보완 목적(빈 필드 채우기)
	•	충돌만 resolveElement로 판단 + evidenceJSON 남김

⸻

7) 운영 체크리스트
	•	normalizeElement/normalizeYinYang를 유일 경로로 강제
	•	키 중복 병합 로직 적용 + 동일 키 내 동일 읽기 중복 제거
	•	통합에서 문자 기준 1행 + readings 수집
	•	충돌은 needs_review + evidenceJSON 기록
	•	시드 upsert + ruleset/sourceTag 저장
	•	CI에서 유니크 문자 수 전/후 동일 테스트
	•	대시보드: needs_review 추이/분포, 결측/비정상 값 모니터링

⸻

8) 지금 상태에서 바로 할 일(5,000자 목표 스타트)
	1.	HanjaLegal(인명용 허용셋) 먼저 시드 → 합법성 필터 확보
	2.	기존 236자 → ETL 파이프라인에 올려 통합/검증/리뷰 필드 채움
	3.	외부 소스(법령 표/사전/오픈데이터) 한 줄씩 추가할 때마다
	•	sourceTag로 ingest → 파서 → normalize → dedup/merge → resolve → seed → report
	4.	주간 배치로 needs_review 큐 소진(내부 콘솔에서 승인/수정)

⸻

결론
	•	지금 정의한 규칙과 파이프라인이면 스케일 문제 없이 5,000자까지 그대로 확장됩니다.
	•	핵심은 정규화의 일관성(유일 경로) + 충돌을 데이터로 남기는 리뷰 체계 + CI 회귀 방지입니다.