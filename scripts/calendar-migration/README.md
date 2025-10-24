# 만세력 데이터 MySQL → PostgreSQL 마이그레이션 가이드

완전한 음양력 변환 데이터(만세력)를 MySQL에서 PostgreSQL로 Prisma를 사용하여 마이그레이션하는 가이드입니다.

## 📋 목차

- [개요](#개요)
- [데이터 소스](#데이터-소스)
- [사전 요구사항](#사전-요구사항)
- [마이그레이션 절차](#마이그레이션-절차)
- [데이터 검증](#데이터-검증)
- [사용 예제](#사용-예제)
- [문제 해결](#문제-해결)

---

## 개요

### 변환 내용

이 마이그레이션은 두 개의 MySQL 데이터베이스를 PostgreSQL로 통합합니다:

| Schema | 날짜 범위 | 레코드 수 (예상) | 특징 |
|--------|----------|----------------|------|
| **Schema 1** | 1900-2100 (201년) | ~73,400 | 상세 데이터 (달 위상, 28수, 월주 간지) |
| **Schema 2** | 1841-2110 (270년) | ~98,600 | 확장 날짜 범위 (기본 데이터) |
| **통합 결과** | 1841-2110 (270년) | ~98,600 | 최적의 데이터 품질 |

### 주요 기능

- ✅ 양력 ↔ 음력 변환
- ✅ 간지 (천간지지) 정보
- ✅ 24절기 정보
- ✅ 공휴일 및 기념일
- ✅ 윤달 정보
- ✅ 띠 (12지신) 정보
- ✅ 28수 (Schema 1만)
- ✅ 달 위상 (Schema 1만)

---

## 데이터 소스

### Schema 1: 20060818.sql (상세 데이터)

**위치**: `/Users/blee/Downloads/saju/saju/20060818.sql`

**필드**:
- 기본 날짜: 양력, 음력, 단기년도
- 간지: 년주, 월주, 일주 (한문/한글)
- 절기: 24절기 (시간 포함)
- 천문: 28수, 달 위상 및 시간
- 기념일: 양력/음력 기념일
- 기타: 요일(한문/한글), 윤달, 월 크기

### Schema 2: 20060811.sql (확장 범위)

**위치**: `/Users/blee/Downloads/lunar_data/20060811.sql`

**필드**:
- 기본 날짜: 양력, 음력, 단기년도
- 간지: 년주, 일주 (한문/한글)
- 절기: 24절기
- 기념일: 양력/음력 기념일
- 기타: 요일(통합), 복날 표시

---

## 사전 요구사항

### 1. 소프트웨어 요구사항

```bash
# Node.js 18+ 및 npm
node -v  # v18.0.0 이상
npm -v   # 9.0.0 이상

# PostgreSQL 14+
psql --version  # PostgreSQL 14.0 이상

# tsx (TypeScript runner)
npm install -g tsx
```

### 2. 환경 변수 설정

`.env` 파일에 PostgreSQL 연결 정보 추가:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

예시:
```bash
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/saju?schema=public"
```

### 3. Prisma 설정 확인

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 연결 테스트
npx prisma db execute --stdin <<< "SELECT 1;"
```

---

## 마이그레이션 절차

### Step 1: Prisma 마이그레이션 생성

```bash
# 스크립트에 실행 권한 부여
chmod +x scripts/calendar-migration/00-create-migration.sh

# 마이그레이션 생성
./scripts/calendar-migration/00-create-migration.sh
```

또는 수동으로:

```bash
npx prisma migrate dev --name add_calendar_data_model
```

**결과 확인**:
- `prisma/migrations/` 디렉토리에 새 마이그레이션 생성
- PostgreSQL에 `calendar_data` 테이블 및 인덱스 생성

### Step 2: Schema 1 데이터 임포트 (1900-2100)

```bash
# 상세 데이터 임포트
npx tsx scripts/calendar-migration/01-import-schema1.ts
```

**예상 소요 시간**: 5-10분 (73,400 레코드)

**진행 상황 예시**:
```
============================================================
Calendar Data Import - Schema 1 (1900-2100)
============================================================

📖 Reading SQL file...
  Parsed 10000 records...
  Parsed 20000 records...
  ...
✅ Parsed 73414 records from SQL file

📊 Statistics:
  Total records: 73414
  Date range: 1900-1-1 to 2100-12-31

🔄 Starting import to PostgreSQL...
  Progress: 1000/73414 (1000 imported, 0 errors)
  Progress: 2000/73414 (2000 imported, 0 errors)
  ...

✅ Import completed!
  Imported: 73414
  Skipped: 0
  Errors: 0

🎉 Schema 1 import completed successfully!
```

### Step 3: Schema 2 데이터 임포트 (1841-2110)

```bash
# 확장 범위 데이터 임포트
npx tsx scripts/calendar-migration/02-import-schema2.ts
```

**예상 소요 시간**: 5-10분 (98,600 레코드)

**동작 방식**:
- Schema 1과 겹치는 날짜 (1900-2100): Schema 2 전용 필드만 업데이트 (weekday, dogDay 등)
- Schema 2만 있는 날짜 (1841-1899, 2101-2110): 새 레코드 생성

**진행 상황 예시**:
```
============================================================
Calendar Data Import - Schema 2 (1841-2110)
============================================================

📖 Reading SQL file...
✅ Parsed 98630 records from SQL file

📊 Statistics:
  Total records: 98630
  Date range: 1841-1-1 to 2110-12-31

🔄 Starting import to PostgreSQL...
  Progress: 1000/98630 (500 new, 500 updated, 0 errors)
  Progress: 2000/98630 (1000 new, 1000 updated, 0 errors)
  ...

✅ Import completed!
  New records: 25216
  Updated records: 73414
  Skipped: 0
  Errors: 0

🎉 Schema 2 import completed successfully!
```

### Step 4: 데이터 검증

```bash
# 데이터 무결성 검증
npx tsx scripts/calendar-migration/03-validate-data.ts
```

**검증 항목**:
- ✅ 총 레코드 수
- ✅ 날짜 범위 확인
- ✅ 중복 데이터 검사
- ✅ 데이터 소스 통계
- ✅ 년도별 커버리지 (365-366일)
- ✅ 공휴일 개수
- ✅ 24절기 개수
- ✅ 윤달 개수
- ✅ 필수 필드 누락 확인

**검증 결과 예시**:
```
============================================================
VALIDATION SUMMARY
============================================================

📊 Overall Statistics:
   Total Records: 98,630
   Date Range: 1841-01-01 to 2110-12-31
   Years Covered: 270

📚 Data Sources:
   schema1: 73,414 (74.42%)
   schema2: 25,216 (25.58%)

📈 Content Statistics:
   Holidays: 12,345
   Solar Terms (24절기): 6,480
   Leap Month Days: 2,150

✅ All validation checks passed!
```

### Step 5: 추가 인덱스 생성

```bash
# PostgreSQL에 추가 인덱스 생성
psql $DATABASE_URL -f scripts/calendar-migration/04-create-indexes.sql
```

**생성되는 인덱스**:
- 양력 → 음력 변환용 복합 인덱스
- 음력 → 양력 변환용 복합 인덱스
- 공휴일 전용 부분 인덱스
- 절기 전용 부분 인덱스
- 윤달 전용 부분 인덱스
- 전문 검색용 GIN 인덱스 (기념일 이름)

---

## 데이터 검증

### 빠른 검증

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 특정 날짜 조회 (양력 → 음력)
const result = await prisma.calendarData.findUnique({
  where: {
    solar_date_unique: {
      solarYear: 2025,
      solarMonth: 10,
      solarDay: 24,
    },
  },
});

console.log(result);
// {
//   solarYear: 2025, solarMonth: 10, solarDay: 24,
//   lunarYear: 2025, lunarMonth: 9, lunarDay: 2,
//   zodiacAnimal: 'SNAKE',
//   yearGanjiKorean: '을사',
//   dayGanjiKorean: '정유',
//   ...
// }
```

### SQL 검증 쿼리

```sql
-- 1. 총 레코드 수
SELECT COUNT(*) FROM calendar_data;

-- 2. 날짜 범위
SELECT
  MIN(cd_sy || '-' || cd_sm || '-' || cd_sd) as min_date,
  MAX(cd_sy || '-' || cd_sm || '-' || cd_sd) as max_date
FROM calendar_data;

-- 3. 데이터 소스별 통계
SELECT data_source, COUNT(*) as count
FROM calendar_data
GROUP BY data_source;

-- 4. 2025년 공휴일 조회
SELECT cd_sy, cd_sm, cd_sd, cd_sol_plan, cd_lun_plan
FROM calendar_data
WHERE cd_sy = 2025 AND holiday > 0
ORDER BY cd_sm, cd_sd;

-- 5. 2025년 24절기 조회
SELECT cd_sy, cd_sm, cd_sd, cd_kterms, cd_terms_time
FROM calendar_data
WHERE cd_sy = 2025 AND cd_kterms IS NOT NULL
ORDER BY cd_sm, cd_sd;
```

---

## 사용 예제

### 1. 양력 → 음력 변환

```typescript
async function solarToLunar(year: number, month: number, day: number) {
  const result = await prisma.calendarData.findUnique({
    where: {
      solar_date_unique: { solarYear: year, solarMonth: month, solarDay: day },
    },
    select: {
      lunarYear: true,
      lunarMonth: true,
      lunarDay: true,
      isLeapMonth: true,
      zodiacAnimal: true,
    },
  });

  if (!result) {
    throw new Error(`Date not found: ${year}-${month}-${day}`);
  }

  return {
    lunar: `${result.lunarYear}년 ${result.isLeapMonth ? '윤' : ''}${result.lunarMonth}월 ${result.lunarDay}일`,
    zodiac: result.zodiacAnimal,
  };
}

// 사용
const lunar = await solarToLunar(2025, 10, 24);
console.log(lunar);
// { lunar: '2025년 9월 2일', zodiac: 'SNAKE' }
```

### 2. 음력 → 양력 변환

```typescript
async function lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean = false) {
  const result = await prisma.calendarData.findFirst({
    where: {
      lunarYear: year,
      lunarMonth: month,
      lunarDay: day,
      isLeapMonth,
    },
    select: {
      solarYear: true,
      solarMonth: true,
      solarDay: true,
    },
  });

  if (!result) {
    throw new Error(`Lunar date not found: ${year}-${month}-${day}`);
  }

  return `${result.solarYear}년 ${result.solarMonth}월 ${result.solarDay}일`;
}

// 사용
const solar = await lunarToSolar(2025, 9, 2);
console.log(solar); // '2025년 10월 24일'
```

### 3. 특정 년도의 공휴일 조회

```typescript
async function getHolidays(year: number) {
  return await prisma.calendarData.findMany({
    where: {
      solarYear: year,
      holidayType: { gt: 0 },
    },
    select: {
      solarMonth: true,
      solarDay: true,
      solarHoliday: true,
      lunarHoliday: true,
      holidayType: true,
    },
    orderBy: [{ solarMonth: 'asc' }, { solarDay: 'asc' }],
  });
}

// 사용
const holidays2025 = await getHolidays(2025);
holidays2025.forEach((h) => {
  console.log(`${h.solarMonth}월 ${h.solarDay}일: ${h.solarHoliday || h.lunarHoliday}`);
});
```

### 4. 24절기 조회

```typescript
async function getSolarTerms(year: number) {
  return await prisma.calendarData.findMany({
    where: {
      solarYear: year,
      solarTermKorean: { not: null },
    },
    select: {
      solarMonth: true,
      solarDay: true,
      solarTermKorean: true,
      solarTermTime: true,
    },
    orderBy: [{ solarMonth: 'asc' }, { solarDay: 'asc' }],
  });
}

// 사용
const terms2025 = await getSolarTerms(2025);
terms2025.forEach((t) => {
  console.log(`${t.solarMonth}월 ${t.solarDay}일: ${t.solarTermKorean} (${t.solarTermTime})`);
});
```

### 5. 띠(12지신) 연도 범위 조회

```typescript
async function getZodiacYearRange(zodiac: ZodiacAnimal) {
  const result = await prisma.calendarData.aggregate({
    where: { zodiacAnimal: zodiac },
    _min: { solarYear: true },
    _max: { solarYear: true },
    _count: true,
  });

  return {
    zodiac,
    startYear: result._min.solarYear,
    endYear: result._max.solarYear,
    totalDays: result._count,
  };
}

// 사용
const dragonYears = await getZodiacYearRange('DRAGON');
console.log(dragonYears);
// { zodiac: 'DRAGON', startYear: 1844, endYear: 2108, totalDays: 10958 }
```

### 6. 윤달 조회

```typescript
async function getLeapMonths(startYear: number, endYear: number) {
  return await prisma.calendarData.findMany({
    where: {
      solarYear: { gte: startYear, lte: endYear },
      isLeapMonth: true,
    },
    select: {
      solarYear: true,
      solarMonth: true,
      solarDay: true,
      lunarYear: true,
      lunarMonth: true,
      lunarDay: true,
    },
    distinct: ['lunarYear', 'lunarMonth'],
    orderBy: [{ solarYear: 'asc' }],
  });
}

// 사용
const leapMonths = await getLeapMonths(2020, 2030);
leapMonths.forEach((m) => {
  console.log(`${m.lunarYear}년 윤${m.lunarMonth}월 (양력: ${m.solarYear}-${m.solarMonth}-${m.solarDay})`);
});
```

---

## 문제 해결

### 문제 1: 마이그레이션 생성 실패

**증상**:
```
Error: Cannot connect to database
```

**해결 방법**:
```bash
# 1. DATABASE_URL 환경 변수 확인
echo $DATABASE_URL

# 2. PostgreSQL 서버 실행 확인
psql -U postgres -c "SELECT version();"

# 3. 데이터베이스 존재 확인 및 생성
createdb saju

# 4. 연결 테스트
npx prisma db execute --stdin <<< "SELECT 1;"
```

### 문제 2: 임포트 중 메모리 부족

**증상**:
```
JavaScript heap out of memory
```

**해결 방법**:
```bash
# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/calendar-migration/01-import-schema1.ts
```

### 문제 3: 중복 데이터

**증상**:
```
Unique constraint failed on the fields: (`solar_date_unique`)
```

**해결 방법**:
```sql
-- 기존 데이터 삭제 후 재임포트
TRUNCATE TABLE calendar_data CASCADE;

-- 또는 특정 년도만 삭제
DELETE FROM calendar_data WHERE cd_sy BETWEEN 1900 AND 2100;
```

### 문제 4: 성능 저하

**증상**: 쿼리 속도가 느림

**해결 방법**:
```sql
-- 1. 인덱스 재생성
REINDEX TABLE calendar_data;

-- 2. 통계 업데이트
ANALYZE calendar_data;

-- 3. 테이블 정리
VACUUM FULL calendar_data;

-- 4. 쿼리 플랜 확인
EXPLAIN ANALYZE
SELECT * FROM calendar_data
WHERE cd_sy = 2025 AND cd_sm = 10 AND cd_sd = 24;
```

### 문제 5: 한글 인코딩 문제

**증상**: 한글이 깨져서 표시됨

**해결 방법**:
```sql
-- PostgreSQL 데이터베이스 인코딩 확인
SELECT datname, encoding FROM pg_database WHERE datname = 'saju';

-- UTF8이 아니면 새 데이터베이스 생성
CREATE DATABASE saju_new WITH ENCODING 'UTF8' LC_COLLATE='ko_KR.UTF-8' LC_CTYPE='ko_KR.UTF-8';
```

---

## 성능 최적화

### 1. 연결 풀링 설정

`.env` 파일:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&connection_limit=10&pool_timeout=20"
```

### 2. Prisma 쿼리 최적화

```typescript
// ❌ 나쁜 예: 모든 필드 조회
const result = await prisma.calendarData.findUnique({
  where: { solar_date_unique: { ... } },
});

// ✅ 좋은 예: 필요한 필드만 선택
const result = await prisma.calendarData.findUnique({
  where: { solar_date_unique: { ... } },
  select: {
    lunarYear: true,
    lunarMonth: true,
    lunarDay: true,
  },
});
```

### 3. 캐싱 전략

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1시간
});

async function getCachedLunarDate(year: number, month: number, day: number) {
  const key = `lunar:${year}-${month}-${day}`;

  let result = cache.get(key);
  if (!result) {
    result = await prisma.calendarData.findUnique({
      where: { solar_date_unique: { solarYear: year, solarMonth: month, solarDay: day } },
    });
    if (result) cache.set(key, result);
  }

  return result;
}
```

---

## 유지보수

### 정기 작업

```bash
# 1. 주간: 통계 업데이트
psql $DATABASE_URL -c "ANALYZE calendar_data;"

# 2. 월간: 테이블 정리
psql $DATABASE_URL -c "VACUUM ANALYZE calendar_data;"

# 3. 분기별: 전체 정리 및 재인덱싱
psql $DATABASE_URL <<EOF
VACUUM FULL calendar_data;
REINDEX TABLE calendar_data;
ANALYZE calendar_data;
EOF
```

### 백업

```bash
# 전체 데이터베이스 백업
pg_dump $DATABASE_URL > saju_backup_$(date +%Y%m%d).sql

# calendar_data 테이블만 백업
pg_dump $DATABASE_URL -t calendar_data > calendar_backup_$(date +%Y%m%d).sql
```

---

## 라이선스 및 크레딧

**원본 데이터 제작자**: 울보천사 (cry1004@mirckorea.net)
**원본 블로그**: http://blog.naver.com/mirckorea
**데이터 범위**: 1841-2110 음양력 만세력

이 데이터는 제작자의 노력으로 생성된 자료이며, 사용 시 출처를 명시해 주시기 바랍니다.

---

## 추가 리소스

- [Prisma 공식 문서](https://www.prisma.io/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs)
- [음양력 변환 알고리즘](https://en.wikipedia.org/wiki/Chinese_calendar)

---

**문의사항**: 이 마이그레이션에 대한 문의사항이나 문제가 있으시면 이슈를 등록해 주세요.
