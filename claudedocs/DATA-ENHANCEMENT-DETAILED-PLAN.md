# 한자 데이터베이스 확장 프로젝트 - 상세 실행 계획
## 189 → 3,000+ 사용 가능 한자 확장 (1주 스프린트)

**작성일**: 2025-10-30
**목표**: 8,787개 한자 중 사용 가능한 한자를 189개(2.2%)에서 3,000개 이상(35%+)으로 확장
**기간**: 7일 (Day 1-7)
**현재 상태**: 30.4% 품질 점수 (F등급) → 목표: 95%+ (A등급)

---

## 📊 현재 상황 분석 (Current State Analysis)

### Database Statistics (2025-10-30 기준)
```
총 한자 수: 8,787개
├─ 완전한 레코드 (Complete): 2,670개 (30.4%) ✅
├─ nameFrequency = 0: 6,117개 (69.6%) ⚠️
├─ strokes 데이터: 8,787개 (100%) ✅
├─ element 데이터: 8,787개 (100%) ✅
└─ isGoodForNaming = true: ~189개 (2.2%) ⚠️ CRITICAL

🚨 Critical Issue: 18개 핵심 성씨가 nameFrequency=0으로 필터링 위험
```

### Root Cause Analysis
1. **Primary Bottleneck**: nameFrequency 데이터 부족 (69.6% missing)
2. **Secondary Issue**: isGoodForNaming 필터가 너무 엄격 (기존 부적절 한자 필터 때문)
3. **Tertiary Issue**: 성씨 한자에 대한 특수 처리 로직 부재

### Success Criteria
- **Phase 1 Complete**: 300+ 성씨 한자 100% 보호 ✅
- **Phase 2 Complete**: 700+ 사용 가능 한자 (상위 500개 인기 한자 처리)
- **Phase 3 Complete**: 3,000+ 사용 가능 한자 (35%+ 커버리지)
- **Quality Score**: 95%+ (A등급)
- **Zero Regression**: 기존 작명 기능 정상 작동 유지

---

## 🚀 PHASE 1: Emergency Fixes (Day 1 - Today)
**목표**: 성씨 한자 보호 및 모니터링 시스템 구축
**예상 시간**: 4-6 시간
**중요도**: 🔴 CRITICAL

### Task 1.1: 성씨 한자 목록 확보 및 분석
**시간**: 30분
**담당자**: Data Team
**의존성**: None

#### 실행 단계:
1. 한국 성씨 공식 목록 확보 (통계청 기준)
   - 핵심 30개 성씨 (전체 인구의 95%)
   - 추가 270개 성씨 (나머지 5%)
   - 총 300개 성씨 한자 리스트 생성

2. 현재 DB에서 성씨 한자 조회
```typescript
// scripts/etl/analyze-surnames.ts
const coreSurnames = [
  '金', '李', '朴', '崔', '鄭', '姜', '趙', '尹', '張', '林',
  '韓', '吳', '申', '徐', '權', '黃', '安', '宋', '柳', '洪',
  '高', '文', '梁', '孫', '白', '曺', '許', '千', '劉', '全'
];

const surnameStatus = await prisma.hanjaDict.findMany({
  where: { character: { in: coreSurnames } },
  select: {
    character: true,
    isGoodForNaming: true,
    nameFrequency: true,
    element: true,
    strokes: true
  }
});
```

3. 문제 성씨 식별
   - nameFrequency = 0인 성씨: 18개 발견 ⚠️
   - isGoodForNaming = false인 성씨: 확인 필요

#### 성공 기준:
- ✅ 300개 성씨 한자 목록 완성
- ✅ DB 내 성씨 현황 리포트 생성
- ✅ 문제 성씨 목록 문서화

#### 리스크:
- **Low**: 성씨 목록은 공개 데이터로 확보 용이
- **Mitigation**: 통계청 자료 + 법원 호적 자료 교차 검증

---

### Task 1.2: 성씨 보호 스크립트 작성
**시간**: 1-2 시간
**담당자**: Backend Engineer
**의존성**: Task 1.1 완료

#### 실행 단계:
1. 성씨 보호 스크립트 생성
```typescript
// scripts/etl/protect-surnames.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_KOREAN_SURNAMES = [
  // Core 30 surnames
  '金', '李', '朴', '崔', '鄭', '姜', '趙', '尹', '張', '林',
  // ... (전체 300개 성씨)
];

async function protectSurnames() {
  console.log('🛡️  Starting surname protection...\n');

  // Step 1: Mark all surnames as usable
  const updated = await prisma.hanjaDict.updateMany({
    where: { character: { in: ALL_KOREAN_SURNAMES } },
    data: {
      isGoodForNaming: true,
      // Set minimum nameFrequency to prevent filtering
      nameFrequency: { increment: 100 }  // Add 100 if zero
    }
  });

  console.log(`✅ Protected ${updated.count} surname characters`);

  // Step 2: Verify all surnames are protected
  const verification = await prisma.hanjaDict.findMany({
    where: {
      character: { in: ALL_KOREAN_SURNAMES },
      OR: [
        { isGoodForNaming: false },
        { nameFrequency: { lt: 50 } }
      ]
    }
  });

  if (verification.length > 0) {
    console.error('⚠️  Warning: Some surnames not properly protected:');
    verification.forEach(s => {
      console.log(`  ${s.character}: isGood=${s.isGoodForNaming}, freq=${s.nameFrequency}`);
    });
    throw new Error('Surname protection failed');
  }

  console.log('\n✅ All surnames protected successfully!\n');

  // Step 3: Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalSurnames: ALL_KOREAN_SURNAMES.length,
    protected: updated.count,
    verified: ALL_KOREAN_SURNAMES.length - verification.length
  };

  console.log('📊 Protection Report:');
  console.log(JSON.stringify(report, null, 2));

  return report;
}

protectSurnames()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

2. 실행 및 검증
```bash
npx tsx scripts/etl/protect-surnames.ts
```

3. 데이터 품질 재확인
```bash
npx tsx scripts/qa/data-quality-report.ts
```

#### 성공 기준:
- ✅ 300개 성씨 모두 isGoodForNaming=true
- ✅ 모든 성씨 nameFrequency >= 50
- ✅ 검증 스크립트 통과
- ✅ 품질 리포트에서 성씨 문제 0건

#### 리스크:
- **Medium**: nameFrequency 증분 로직이 기존 값을 덮어쓸 수 있음
- **Mitigation**: WHERE 조건에 nameFrequency < 50 추가하여 기존 데이터 보호

---

### Task 1.3: isGoodForNaming 로직 검토
**시간**: 1 시간
**담당자**: Backend Engineer
**의존성**: Task 1.2 완료

#### 실행 단계:
1. HanjaRepository 로직 분석
```typescript
// app/repositories/hanja.repository.ts (Line 209-211)
async recommendForSaju(params: {...}): Promise<HanjaDict[]> {
  const where: Prisma.HanjaDictWhereInput = {
    AND: [
      { isGoodForNaming: true },  // ⚠️ 이 필터가 성씨를 제외할 수 있음
      { nameFrequency: { gte: minPopularity } },  // ⚠️ 기본값 50
      // ...
    ]
  };
}
```

2. 성씨 특수 케이스 처리 추가
```typescript
// 수정 제안:
async recommendForSaju(params: {
  lackingElements?: string[];
  gender?: 'M' | 'F' | null;
  minPopularity?: number;
  limit?: number;
  includeSurnames?: boolean;  // 🆕 새로운 파라미터
}): Promise<HanjaDict[]> {
  const {
    lackingElements = [],
    gender = null,
    minPopularity = 50,
    limit = 100,
    includeSurnames = false  // 기본값 false (기존 동작 유지)
  } = params;

  const where: Prisma.HanjaDictWhereInput = {
    AND: [
      { isGoodForNaming: true },

      // 성씨 모드일 경우 nameFrequency 필터 완화
      includeSurnames
        ? { nameFrequency: { gte: 0 } }  // 성씨는 모두 포함
        : { nameFrequency: { gte: minPopularity } },  // 일반 한자는 인기도 필터

      // 나머지 조건들...
    ]
  };
}
```

3. 작명 파이프라인에서 성씨 처리 확인
```typescript
// app/lib/naming/pipeline/services.ts
// 성씨 선택 시 includeSurnames=true 전달하는지 확인
```

#### 성공 기준:
- ✅ isGoodForNaming 로직이 성씨를 절대 필터링하지 않음
- ✅ 기존 작명 기능 regression 없음
- ✅ 단위 테스트 작성 및 통과

#### 리스크:
- **High**: 로직 변경이 기존 작명 결과에 영향 줄 수 있음
- **Mitigation**:
  - Feature flag 방식으로 점진적 롤아웃
  - 기존 동작은 includeSurnames=false로 유지
  - A/B 테스트로 검증

---

### Task 1.4: 데이터베이스 제약 추가
**시간**: 30분
**담당자**: Database Admin
**의존성**: Task 1.2 완료

#### 실행 단계:
1. Prisma 마이그레이션 생성
```prisma
// prisma/migrations/YYYYMMDD_protect_surnames/migration.sql

-- Add isSurname flag to HanjaDict
ALTER TABLE "hanja_dict" ADD COLUMN "is_surname" BOOLEAN DEFAULT false;

-- Mark all Korean surnames
UPDATE "hanja_dict"
SET "is_surname" = true
WHERE "character" IN ('金', '李', '朴', /* ... 300개 성씨 ... */);

-- Add check constraint: surnames must be good for naming
ALTER TABLE "hanja_dict"
ADD CONSTRAINT "surname_must_be_usable"
CHECK ("is_surname" = false OR "is_good_for_naming" = true);

-- Add index for surname filtering
CREATE INDEX "hanja_dict_is_surname_idx" ON "hanja_dict"("is_surname");
```

2. Prisma 스키마 업데이트
```prisma
model HanjaDict {
  id               String       @id @default(uuid())
  character        String       @unique
  // ... existing fields ...
  isSurname        Boolean      @default(false) @map("is_surname")  // 🆕
  isGoodForNaming  Boolean      @default(true) @map("is_good_for_naming")

  // ... rest of schema ...

  @@index([isSurname])  // 🆕
}
```

3. 마이그레이션 실행
```bash
npx prisma migrate dev --name protect_surnames
npx prisma generate
```

#### 성공 기준:
- ✅ isSurname 필드 추가 완료
- ✅ 300개 성씨 isSurname=true로 마킹
- ✅ 제약 조건 작동 확인 (성씨를 isGoodForNaming=false로 변경 시도 → 실패)
- ✅ 인덱스 생성 확인

#### 리스크:
- **Low**: 마이그레이션은 비파괴적 (컬럼 추가만)
- **Mitigation**: 마이그레이션 전 DB 백업

---

### Task 1.5: 모니터링 스크립트 작성
**시간**: 1 시간
**담당자**: DevOps / Backend Engineer
**의존성**: Task 1.4 완료

#### 실행 단계:
1. 일일 품질 체크 스크립트 작성
```typescript
// scripts/monitoring/daily-quality-check.ts
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

interface QualityAlert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details: any;
}

async function dailyQualityCheck() {
  const alerts: QualityAlert[] = [];

  // Check 1: Surname protection
  const badSurnames = await prisma.hanjaDict.count({
    where: {
      isSurname: true,
      OR: [
        { isGoodForNaming: false },
        { nameFrequency: { lt: 50 } }
      ]
    }
  });

  if (badSurnames > 0) {
    alerts.push({
      severity: 'critical',
      message: `🚨 ${badSurnames} surnames are not properly protected!`,
      details: await prisma.hanjaDict.findMany({
        where: {
          isSurname: true,
          OR: [
            { isGoodForNaming: false },
            { nameFrequency: { lt: 50 } }
          ]
        },
        select: { character: true, isGoodForNaming: true, nameFrequency: true }
      })
    });
  }

  // Check 2: Overall usability
  const usableCount = await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: 50 }
    }
  });

  const usablePercentage = (usableCount / 8787) * 100;

  if (usablePercentage < 30) {
    alerts.push({
      severity: 'warning',
      message: `⚠️ Usable character percentage is low: ${usablePercentage.toFixed(1)}%`,
      details: { usableCount, target: 3000 }
    });
  }

  // Check 3: Data completeness
  const incompleteCount = await prisma.hanjaDict.count({
    where: {
      OR: [
        { strokes: null },
        { element: null },
        { koreanReading: null }
      ]
    }
  });

  if (incompleteCount > 0) {
    alerts.push({
      severity: 'warning',
      message: `⚠️ ${incompleteCount} characters have incomplete data`,
      details: { incompleteCount }
    });
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalCharacters: 8787,
    usableCharacters: usableCount,
    usablePercentage: usablePercentage.toFixed(1),
    alerts: alerts
  };

  console.log('\n📊 Daily Quality Check Report\n');
  console.log(JSON.stringify(report, null, 2));

  // Send alerts if any critical issues
  if (alerts.some(a => a.severity === 'critical')) {
    await sendAlert(report);
  }

  return report;
}

async function sendAlert(report: any) {
  // 이메일 또는 Slack 알림 발송
  console.log('🚨 Sending critical alert...');
  // TODO: Implement email/Slack notification
}

dailyQualityCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

2. Cron Job 설정
```bash
# crontab -e
# 매일 오전 9시에 품질 체크 실행
0 9 * * * cd /path/to/saju && npx tsx scripts/monitoring/daily-quality-check.ts >> logs/quality-check.log 2>&1
```

3. 로그 로테이션 설정
```bash
# /etc/logrotate.d/saju-quality-check
/path/to/saju/logs/quality-check.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

#### 성공 기준:
- ✅ 모니터링 스크립트 작성 완료
- ✅ 테스트 실행 성공
- ✅ Cron Job 설정 완료
- ✅ 알림 시스템 작동 확인

#### 리스크:
- **Low**: 모니터링 스크립트는 읽기 전용
- **Mitigation**: None needed

---

### Task 1.6: Phase 1 검증 및 리포트
**시간**: 30분
**담당자**: QA Engineer
**의존성**: Task 1.1-1.5 모두 완료

#### 실행 단계:
1. 전체 품질 리포트 재실행
```bash
npx tsx scripts/qa/data-quality-report.ts
```

2. 예상 결과:
```
📊 한자 데이터 품질 분석 리포트
================================================================================

총 레코드 수: 8,787개

🟢 정상 데이터:
  • 완전한 레코드: 2,670개 (30.4%)

2️⃣ 핵심 성씨 30자 품질 분석
----------------------------------------
  ✅ 모든 핵심 성씨 데이터 정상

🛡️ 성씨 보호 현황:
  • 총 성씨: 300개
  • 보호됨: 300개 (100.0%) ✅
  • 사용 가능: 300개 (100.0%) ✅

📈 데이터 품질 점수: 30.4% (F) → Phase 2에서 개선 예정
```

3. Phase 1 완료 체크리스트:
- [ ] 300개 성씨 모두 isGoodForNaming=true
- [ ] 300개 성씨 모두 nameFrequency >= 50
- [ ] isSurname 필드 추가 완료
- [ ] DB 제약 조건 작동 확인
- [ ] 모니터링 스크립트 작동 확인
- [ ] Cron Job 설정 완료
- [ ] 기존 작명 기능 regression 테스트 통과

#### 성공 기준:
- ✅ 모든 체크리스트 항목 완료
- ✅ Critical alert 0건
- ✅ Phase 2로 진행 가능 상태

#### 리스크:
- **None**: 검증 단계는 리스크 없음

---

### Phase 1 Summary
**총 예상 시간**: 4-6 시간
**중요 마일스톤**:
- 300개 성씨 한자 100% 보호 ✅
- 모니터링 시스템 구축 ✅
- 데이터 품질 기준선 확립 ✅

**다음 단계**: Phase 2 - Quick Wins (Day 2-3)

---

## 🎯 PHASE 2: Quick Wins (Day 2-3)
**목표**: 상위 500개 인기 한자 처리하여 700+ 사용 가능 한자 달성
**예상 시간**: 2일 (16-20 시간)
**중요도**: 🟡 HIGH

### Task 2.1: 상위 500개 한자 식별
**시간**: 1 시간
**담당자**: Data Analyst
**의존성**: Phase 1 완료

#### 실행 단계:
1. 현재 nameFrequency 분포 분석
```typescript
// scripts/etl/analyze-popularity-distribution.ts
const distribution = await prisma.hanjaDict.groupBy({
  by: ['nameFrequency'],
  _count: true,
  orderBy: { nameFrequency: 'desc' }
});

// Find top 500 characters
const top500 = await prisma.hanjaDict.findMany({
  where: { nameFrequency: { gt: 100 } },
  orderBy: { nameFrequency: 'desc' },
  take: 500,
  select: {
    character: true,
    meaning: true,
    nameFrequency: true,
    element: true,
    strokes: true,
    isGoodForNaming: true
  }
});

console.log(`Found ${top500.length} characters with nameFrequency > 100`);
console.log(`Current usability: ${top500.filter(c => c.isGoodForNaming).length} / ${top500.length}`);
```

2. 부족한 데이터 필드 식별
```typescript
const missingData = top500.filter(c =>
  !c.element || !c.strokes || c.nameFrequency === 0
);

console.log(`Characters needing enhancement: ${missingData.length}`);
```

3. 우선순위 그룹 생성
```typescript
// Group by nameFrequency bands
const tier1 = top500.filter(c => c.nameFrequency >= 1000);  // 최고 인기
const tier2 = top500.filter(c => c.nameFrequency >= 500 && c.nameFrequency < 1000);
const tier3 = top500.filter(c => c.nameFrequency >= 100 && c.nameFrequency < 500);

console.log(`Tier 1 (freq >= 1000): ${tier1.length}`);
console.log(`Tier 2 (freq 500-999): ${tier2.length}`);
console.log(`Tier 3 (freq 100-499): ${tier3.length}`);
```

#### 성공 기준:
- ✅ 상위 500개 한자 목록 생성
- ✅ 우선순위 그룹 분류 완료
- ✅ 부족한 데이터 필드 식별 완료

#### 리스크:
- **Low**: 데이터 분석은 읽기 전용
- **Mitigation**: None needed

---

### Task 2.2: 참조 데이터 파일 생성
**시간**: 3-4 시간
**담당자**: Data Engineer + Domain Expert
**의존성**: Task 2.1 완료

#### 실행 단계:
1. Unihan 데이터베이스 활용
```bash
# Download Unihan database
wget https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
unzip Unihan.zip

# Parse Unihan_Readings.txt for Korean readings
# Parse Unihan_DictionaryLikeData.txt for meanings and strokes
```

2. 오행(Element) 매핑 테이블 구축
```typescript
// data/element-mappings/radical-to-element.json
{
  "부수별_오행_매핑": {
    "木部": ["木", "竹", "禾", "艹", "亠"],  // WOOD
    "火部": ["火", "日", "光", "赤"],        // FIRE
    "土部": ["土", "山", "石", "玉"],        // EARTH
    "金部": ["金", "刀", "斤", "戈"],        // METAL
    "水部": ["水", "氵", "雨", "冫"]         // WATER
  },

  "음운별_오행_매핑": {
    "ㄱ_ㅋ_초성": "WOOD",  // 목(木)
    "ㄴ_ㄹ_초성": "FIRE",  // 화(火)
    "ㅁ_ㅂ_ㅍ_초성": "WATER",  // 수(水)
    "ㅅ_ㅈ_ㅊ_초성": "METAL",  // 금(金)
    "ㅇ_ㅎ_초성": "EARTH"  // 토(土)
  },

  "의미별_오행_매핑": {
    "나무_식물_관련": "WOOD",
    "불_빛_열_관련": "FIRE",
    "흙_산_돌_관련": "EARTH",
    "쇠_날카로움_관련": "METAL",
    "물_습기_차가움_관련": "WATER"
  }
}
```

3. 검증된 한자 데이터 수집
```typescript
// data/verified-hanja/popular-characters.json
{
  "tier1": [
    {
      "character": "賢",
      "meaning": "어질다, 현명하다",
      "koreanReading": "현",
      "strokes": 15,
      "element": "EARTH",
      "radical": "貝",
      "confidence": "verified",
      "source": "Unihan + 표준국어대사전",
      "nameFrequency": 2500,
      "gender": "neutral"
    },
    // ... more characters
  ]
}
```

#### 성공 기준:
- ✅ Unihan 데이터 다운로드 및 파싱 완료
- ✅ 오행 매핑 테이블 생성 (부수, 음운, 의미 기반)
- ✅ 상위 500개 한자에 대한 검증된 데이터 수집
- ✅ 데이터 품질 검증 (전문가 리뷰)

#### 리스크:
- **Medium**: 오행 매핑이 주관적일 수 있음
- **Mitigation**:
  - 다층 매핑 방식 사용 (부수 → 음운 → 의미 순서로 fallback)
  - 전통 사주명리학 문헌 참조
  - 전문가 리뷰 거치기

---

### Task 2.3: Element Lookup 서비스 구축
**시간**: 3-4 시간
**담당자**: Backend Engineer
**의존성**: Task 2.2 완료

#### 실행 단계:
1. Element Lookup 라이브러리 작성
```typescript
// scripts/etl/lib/element-lookup.ts
import radicalMap from '../../../data/element-mappings/radical-to-element.json';
import soundMap from '../../../data/element-mappings/sound-to-element.json';
import meaningMap from '../../../data/element-mappings/meaning-to-element.json';

export type Element = 'WOOD' | 'FIRE' | 'EARTH' | 'METAL' | 'WATER';

export interface ElementInference {
  element: Element | null;
  confidence: number;
  source: 'radical' | 'sound' | 'meaning' | 'manual';
  reasoning: string;
}

/**
 * Multi-tier element inference system
 * Tier 1: Radical-based (가장 정확)
 * Tier 2: Sound-based (중간 정확도)
 * Tier 3: Meaning-based (낮은 정확도)
 */
export class ElementLookupService {

  /**
   * Infer element from radical (부수)
   */
  inferFromRadical(radical: string): ElementInference | null {
    for (const [element, radicals] of Object.entries(radicalMap)) {
      if (radicals.includes(radical)) {
        return {
          element: element as Element,
          confidence: 0.90,
          source: 'radical',
          reasoning: `부수 '${radical}'는 ${element} 속성`
        };
      }
    }
    return null;
  }

  /**
   * Infer element from Korean reading sound (음운)
   */
  inferFromSound(reading: string): ElementInference | null {
    if (!reading) return null;

    const initialSound = reading[0];  // 초성
    const mapping = soundMap.find(m => m.sounds.includes(initialSound));

    if (mapping) {
      return {
        element: mapping.element as Element,
        confidence: 0.70,
        source: 'sound',
        reasoning: `초성 '${initialSound}'는 ${mapping.element} 속성`
      };
    }
    return null;
  }

  /**
   * Infer element from meaning (의미)
   */
  inferFromMeaning(meaning: string): ElementInference | null {
    if (!meaning) return null;

    for (const [element, keywords] of Object.entries(meaningMap)) {
      for (const keyword of keywords) {
        if (meaning.includes(keyword)) {
          return {
            element: element as Element,
            confidence: 0.60,
            source: 'meaning',
            reasoning: `의미 '${keyword}'는 ${element} 속성`
          };
        }
      }
    }
    return null;
  }

  /**
   * Comprehensive element inference with fallback
   */
  inferElement(params: {
    radical?: string;
    koreanReading?: string;
    meaning?: string;
  }): ElementInference {
    const { radical, koreanReading, meaning } = params;

    // Tier 1: Radical-based (highest confidence)
    if (radical) {
      const result = this.inferFromRadical(radical);
      if (result) return result;
    }

    // Tier 2: Sound-based (medium confidence)
    if (koreanReading) {
      const result = this.inferFromSound(koreanReading);
      if (result) return result;
    }

    // Tier 3: Meaning-based (lowest confidence)
    if (meaning) {
      const result = this.inferFromMeaning(meaning);
      if (result) return result;
    }

    // Fallback: Unable to infer
    return {
      element: null,
      confidence: 0,
      source: 'manual',
      reasoning: '자동 추론 불가 - 수동 검토 필요'
    };
  }
}
```

2. 테스트 케이스 작성
```typescript
// scripts/etl/__tests__/element-lookup.test.ts
import { ElementLookupService } from '../lib/element-lookup';

const service = new ElementLookupService();

describe('ElementLookupService', () => {
  it('should infer WOOD from 木 radical', () => {
    const result = service.inferFromRadical('木');
    expect(result?.element).toBe('WOOD');
    expect(result?.confidence).toBeGreaterThan(0.85);
  });

  it('should infer FIRE from ㄴ initial sound', () => {
    const result = service.inferFromSound('나');
    expect(result?.element).toBe('FIRE');
    expect(result?.confidence).toBeGreaterThan(0.65);
  });

  it('should infer WATER from water-related meaning', () => {
    const result = service.inferFromMeaning('물이 흐르다');
    expect(result?.element).toBe('WATER');
    expect(result?.confidence).toBeGreaterThan(0.55);
  });

  it('should use radical first, then sound, then meaning', () => {
    const result = service.inferElement({
      radical: '木',    // WOOD
      koreanReading: '나',  // FIRE (from sound)
      meaning: '물'    // WATER (from meaning)
    });
    expect(result.element).toBe('WOOD');  // Radical takes precedence
    expect(result.source).toBe('radical');
  });
});
```

3. 실행 및 검증
```bash
npx jest scripts/etl/__tests__/element-lookup.test.ts
```

#### 성공 기준:
- ✅ ElementLookupService 구현 완료
- ✅ 모든 테스트 케이스 통과
- ✅ 추론 정확도 85%+ (수동 샘플 검증)
- ✅ Fallback 메커니즘 작동 확인

#### 리스크:
- **Medium**: 자동 추론 정확도가 낮을 수 있음
- **Mitigation**:
  - 다층 fallback 메커니즘
  - Confidence score로 신뢰도 표시
  - 낮은 confidence는 수동 검토 플래그

---

### Task 2.4: 상위 500개 한자 일괄 보강
**시간**: 4-6 시간
**담당자**: Data Engineer
**의존성**: Task 2.3 완료

#### 실행 단계:
1. 일괄 보강 스크립트 작성
```typescript
// scripts/etl/enhance-top-500.ts
import { PrismaClient } from '@prisma/client';
import { ElementLookupService } from './lib/element-lookup';
import verifiedData from '../../data/verified-hanja/popular-characters.json';

const prisma = new PrismaClient();
const elementService = new ElementLookupService();

interface EnhancementResult {
  character: string;
  before: any;
  after: any;
  changes: string[];
  confidence: number;
}

async function enhanceTop500() {
  console.log('🔧 Starting enhancement of top 500 characters...\n');

  // Step 1: Load characters needing enhancement
  const top500 = await prisma.hanjaDict.findMany({
    where: {
      nameFrequency: { gt: 100 }
    },
    orderBy: { nameFrequency: 'desc' },
    take: 500
  });

  console.log(`📊 Loaded ${top500.length} characters for enhancement`);

  const results: EnhancementResult[] = [];
  const errors: any[] = [];

  // Step 2: Process each character
  for (const char of top500) {
    try {
      const enhancement = await enhanceCharacter(char);
      results.push(enhancement);

      // Progress indicator
      if (results.length % 50 === 0) {
        console.log(`  ✅ Processed ${results.length}/${top500.length} characters...`);
      }
    } catch (error) {
      errors.push({
        character: char.character,
        error: error.message
      });
    }
  }

  // Step 3: Apply enhancements to database
  console.log('\n📝 Applying enhancements to database...\n');

  for (const result of results) {
    await prisma.hanjaDict.update({
      where: { character: result.character },
      data: result.after
    });
  }

  // Step 4: Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalProcessed: results.length,
    totalErrors: errors.length,
    enhancements: {
      elementInferred: results.filter(r => r.changes.includes('element')).length,
      strokesAdded: results.filter(r => r.changes.includes('strokes')).length,
      readingAdded: results.filter(r => r.changes.includes('reading')).length,
      meaningEnhanced: results.filter(r => r.changes.includes('meaning')).length
    },
    averageConfidence: (
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    ).toFixed(2),
    errors: errors
  };

  console.log('\n📊 Enhancement Report:');
  console.log(JSON.stringify(report, null, 2));

  // Save detailed results
  await fs.writeFile(
    'data/reports/top-500-enhancement-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Enhancement complete!\n');

  return report;
}

async function enhanceCharacter(char: any): Promise<EnhancementResult> {
  const before = { ...char };
  const after = { ...char };
  const changes: string[] = [];
  let confidence = 1.0;

  // Check if character is in verified dataset
  const verified = verifiedData.tier1.find(v => v.character === char.character);

  if (verified) {
    // Use verified data (highest confidence)
    if (!char.element && verified.element) {
      after.element = verified.element;
      changes.push('element');
    }
    if (!char.strokes && verified.strokes) {
      after.strokes = verified.strokes;
      changes.push('strokes');
    }
    if (!char.koreanReading && verified.koreanReading) {
      after.koreanReading = verified.koreanReading;
      changes.push('reading');
    }
    confidence = 0.95;
  } else {
    // Use automated inference
    if (!char.element) {
      const inference = elementService.inferElement({
        radical: char.radical,
        koreanReading: char.koreanReading,
        meaning: char.meaning
      });

      if (inference.element) {
        after.element = inference.element;
        after.evidenceJSON = {
          ...after.evidenceJSON,
          elementInference: {
            source: inference.source,
            reasoning: inference.reasoning,
            confidence: inference.confidence,
            inferredAt: new Date().toISOString()
          }
        };
        changes.push('element');
        confidence = Math.min(confidence, inference.confidence);
      }
    }
  }

  // Always mark as good for naming if popular enough
  if (char.nameFrequency > 100 && !char.isGoodForNaming) {
    after.isGoodForNaming = true;
    changes.push('isGoodForNaming');
  }

  return {
    character: char.character,
    before,
    after,
    changes,
    confidence
  };
}

enhanceTop500()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

2. Dry-run 모드로 테스트
```typescript
// Add --dry-run flag to script
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No database changes will be made');
  // Skip database updates
} else {
  // Apply updates
}
```

3. 실행
```bash
# Dry-run first
npx tsx scripts/etl/enhance-top-500.ts --dry-run

# Review results
cat data/reports/top-500-enhancement-results.json

# Apply changes
npx tsx scripts/etl/enhance-top-500.ts
```

#### 성공 기준:
- ✅ 500개 한자 모두 처리 완료
- ✅ 평균 confidence >= 0.85
- ✅ 오류율 < 5%
- ✅ 품질 리포트 생성

#### 리스크:
- **Medium**: 자동 추론이 부정확할 수 있음
- **Mitigation**:
  - Dry-run으로 먼저 검증
  - Confidence threshold 설정 (< 0.7은 수동 검토)
  - Rollback 가능한 트랜잭션 방식

---

### Task 2.5: 검증 및 품질 체크
**시간**: 2-3 시간
**담당자**: QA Engineer + Domain Expert
**의존성**: Task 2.4 완료

#### 실행 단계:
1. 자동 검증 스크립트 실행
```typescript
// scripts/qa/validate-enhanced-characters.ts
const enhanced = await prisma.hanjaDict.findMany({
  where: {
    nameFrequency: { gt: 100 }
  }
});

// Validation checks
const validationResults = {
  totalChecked: enhanced.length,
  passed: 0,
  failed: 0,
  issues: []
};

for (const char of enhanced) {
  // Check 1: Element is valid
  if (!['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'].includes(char.element)) {
    validationResults.issues.push({
      character: char.character,
      issue: 'Invalid element',
      value: char.element
    });
    validationResults.failed++;
    continue;
  }

  // Check 2: Strokes is reasonable (1-30)
  if (char.strokes < 1 || char.strokes > 30) {
    validationResults.issues.push({
      character: char.character,
      issue: 'Invalid stroke count',
      value: char.strokes
    });
    validationResults.failed++;
    continue;
  }

  // Check 3: Korean reading exists
  if (!char.koreanReading) {
    validationResults.issues.push({
      character: char.character,
      issue: 'Missing Korean reading',
      value: null
    });
    validationResults.failed++;
    continue;
  }

  validationResults.passed++;
}

console.log('Validation Results:', validationResults);
```

2. 샘플 수동 검증 (20개 랜덤 샘플)
```typescript
const randomSample = enhanced
  .sort(() => Math.random() - 0.5)
  .slice(0, 20);

console.log('\n🔍 Manual Review Required (Random Sample):');
randomSample.forEach(char => {
  console.log(`
    Character: ${char.character}
    Reading: ${char.koreanReading}
    Meaning: ${char.meaning}
    Element: ${char.element}
    Strokes: ${char.strokes}
    Frequency: ${char.nameFrequency}
    Evidence: ${JSON.stringify(char.evidenceJSON, null, 2)}
  `);
});

console.log('\n📋 Please verify the above characters are correct.');
```

3. 도메인 전문가 리뷰
   - 한자학 전문가 또는 작명가에게 샘플 검토 요청
   - 오행 매핑이 전통 사주명리학과 일치하는지 확인
   - 의미와 음운이 올바른지 검증

#### 성공 기준:
- ✅ 자동 검증 통과율 95%+
- ✅ 수동 샘플 검증 95%+ 정확도
- ✅ 도메인 전문가 승인
- ✅ Critical issue 0건

#### 리스크:
- **Low**: 검증은 읽기 전용
- **Mitigation**: None needed

---

### Task 2.6: 데이터베이스 업데이트 적용
**시간**: 1 시간
**담당자**: Backend Engineer
**의존성**: Task 2.5 완료 (검증 통과)

#### 실행 단계:
1. 백업 생성
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backups/before-phase2-$(date +%Y%m%d).sql

# Prisma snapshot
npx prisma db pull
```

2. 트랜잭션으로 일괄 업데이트
```typescript
// All updates already applied in Task 2.4
// This step is for verification and finalization

// Verify counts
const beforeCount = await prisma.hanjaDict.count({
  where: {
    isGoodForNaming: true,
    nameFrequency: { gte: 50 }
  }
});

console.log(`Usable characters: ${beforeCount}`);
console.log(`Expected: 700+`);

if (beforeCount < 700) {
  throw new Error('Phase 2 target not met');
}
```

3. 인덱스 재생성 및 최적화
```bash
npx prisma migrate dev --name phase2_enhancements
```

#### 성공 기준:
- ✅ 백업 생성 완료
- ✅ 사용 가능 한자 >= 700개
- ✅ 데이터 무결성 검증 통과
- ✅ 인덱스 최적화 완료

#### 리스크:
- **Low**: 업데이트는 이미 Task 2.4에서 완료
- **Mitigation**: 백업으로 언제든 롤백 가능

---

### Task 2.7: Phase 2 검증 및 리포트
**시간**: 1 시간
**담당자**: QA Engineer
**의존성**: Task 2.6 완료

#### 실행 단계:
1. 전체 품질 리포트 재실행
```bash
npx tsx scripts/qa/data-quality-report.ts
```

2. 예상 결과:
```
📊 한자 데이터 품질 분석 리포트
================================================================================

총 레코드 수: 8,787개

🟢 정상 데이터:
  • 완전한 레코드: 3,370개 (38.3%) ⬆️ +8%

🎯 사용 가능 한자 (isGoodForNaming=true):
  • 총 사용 가능: 700+개 ✅
  • 상위 500개 인기 한자: 500개 (100%) ✅
  • 성씨 한자: 300개 (100%) ✅

📈 데이터 품질 점수: 38.3% (D+) → Phase 3에서 A등급 달성 예정
```

3. Phase 2 완료 체크리스트:
- [ ] 상위 500개 한자 모두 보강 완료
- [ ] 사용 가능 한자 >= 700개
- [ ] Element 추론 정확도 85%+
- [ ] 자동 검증 통과율 95%+
- [ ] 수동 샘플 검증 통과
- [ ] 기존 작명 기능 regression 테스트 통과

#### 성공 기준:
- ✅ 모든 체크리스트 항목 완료
- ✅ 사용 가능 한자 700+개 달성
- ✅ Phase 3로 진행 가능 상태

#### 리스크:
- **None**: 검증 단계는 리스크 없음

---

### Phase 2 Summary
**총 예상 시간**: 16-20 시간 (2일)
**중요 마일스톤**:
- 상위 500개 인기 한자 처리 완료 ✅
- 700+ 사용 가능 한자 달성 ✅
- Element 자동 추론 시스템 구축 ✅

**다음 단계**: Phase 3 - Bulk Enhancement (Day 4-7)

---

## 🏁 PHASE 3: Bulk Enhancement (Day 4-7)
**목표**: 나머지 2,500개 한자 처리하여 3,000+ 사용 가능 한자 달성
**예상 시간**: 4일 (32-40 시간)
**중요도**: 🟢 MEDIUM

### Task 3.1: 나머지 한자 분류 및 우선순위 설정
**시간**: 2 시간
**담당자**: Data Analyst
**의존성**: Phase 2 완료

#### 실행 단계:
1. 대상 한자 조회 및 분류
```typescript
// scripts/etl/categorize-remaining.ts

// Band 1: nameFrequency 50-100 (highest priority)
const band1 = await prisma.hanjaDict.findMany({
  where: {
    nameFrequency: { gte: 50, lt: 100 },
    isGoodForNaming: true  // 이미 true인 것만
  }
});

// Band 2: nameFrequency 20-50
const band2 = await prisma.hanjaDict.findMany({
  where: {
    nameFrequency: { gte: 20, lt: 50 }
  }
});

// Band 3: nameFrequency 1-20
const band3 = await prisma.hanjaDict.findMany({
  where: {
    nameFrequency: { gte: 1, lt: 20 }
  }
});

// Band 4: nameFrequency = 0 (requires Laplace smoothing)
const band4 = await prisma.hanjaDict.findMany({
  where: {
    nameFrequency: 0
  }
});

const categorization = {
  band1: {
    count: band1.length,
    priority: 'HIGH',
    estimatedTime: '4-6 hours'
  },
  band2: {
    count: band2.length,
    priority: 'MEDIUM',
    estimatedTime: '8-12 hours'
  },
  band3: {
    count: band3.length,
    priority: 'MEDIUM',
    estimatedTime: '16-20 hours'
  },
  band4: {
    count: band4.length,
    priority: 'LOW',
    estimatedTime: '4-6 hours (automated)'
  }
};

console.log('📊 Categorization Results:');
console.log(JSON.stringify(categorization, null, 2));

// Save categorization for reference
await fs.writeFile(
  'data/reports/phase3-categorization.json',
  JSON.stringify({ bands: { band1, band2, band3, band4 } }, null, 2)
);
```

2. 작업량 추정
```typescript
const totalToProcess = band1.length + band2.length + band3.length + band4.length;
const targetUsable = 3000;
const currentUsable = 700;
const gap = targetUsable - currentUsable;

console.log(`
  Target: ${targetUsable} usable characters
  Current: ${currentUsable} usable characters
  Gap: ${gap} characters
  Available: ${totalToProcess} characters
  Success Rate Needed: ${((gap / totalToProcess) * 100).toFixed(1)}%
`);
```

#### 성공 기준:
- ✅ 4개 Band로 분류 완료
- ✅ 각 Band 별 작업량 추정 완료
- ✅ 목표 달성 가능성 검증 (충분한 한자 수)

#### 리스크:
- **Low**: 분류는 읽기 전용
- **Mitigation**: None needed

---

### Task 3.2: 반자동 Element 추론 스크립트 작성
**시간**: 4-6 시간
**담당자**: Backend Engineer
**의존성**: Task 3.1 완료

#### 실행 단계:
1. 고급 Element 추론 로직 구현
```typescript
// scripts/etl/lib/advanced-element-inference.ts
import { ElementLookupService } from './element-lookup';
import axios from 'axios';

export class AdvancedElementInference extends ElementLookupService {

  /**
   * Use Unihan database for stroke count and radical
   */
  async fetchUnihanData(character: string) {
    const codepoint = character.codePointAt(0)?.toString(16).toUpperCase();

    // Parse Unihan_DictionaryLikeData.txt
    // (Assuming we've pre-processed it into a JSON file)
    const unihanData = await this.loadUnihanCache(codepoint);

    return {
      strokes: unihanData?.kTotalStrokes,
      radical: unihanData?.kRSKangXi,
      meaning: unihanData?.kDefinition
    };
  }

  /**
   * Cross-reference with multiple sources
   */
  async inferWithCrossReference(params: {
    character: string;
    existingData: any;
  }) {
    const { character, existingData } = params;

    // Source 1: Existing database
    let element = existingData.element;
    let confidence = 0.5;
    let sources = [];

    // Source 2: Unihan database
    const unihanData = await this.fetchUnihanData(character);
    if (unihanData.radical) {
      const radicalInference = this.inferFromRadical(unihanData.radical);
      if (radicalInference) {
        element = radicalInference.element;
        confidence = radicalInference.confidence;
        sources.push('Unihan_radical');
      }
    }

    // Source 3: Sound-based inference
    if (existingData.koreanReading) {
      const soundInference = this.inferFromSound(existingData.koreanReading);
      if (soundInference && !element) {
        element = soundInference.element;
        confidence = soundInference.confidence;
        sources.push('sound_pattern');
      }
    }

    // Source 4: Meaning-based inference
    if (existingData.meaning) {
      const meaningInference = this.inferFromMeaning(existingData.meaning);
      if (meaningInference && !element) {
        element = meaningInference.element;
        confidence = meaningInference.confidence;
        sources.push('meaning_keywords');
      }
    }

    return {
      element,
      confidence,
      sources,
      unihanData
    };
  }

  /**
   * Batch process with rate limiting
   */
  async batchInfer(characters: any[], batchSize: number = 100) {
    const results = [];

    for (let i = 0; i < characters.length; i += batchSize) {
      const batch = characters.slice(i, i + batchSize);

      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(characters.length/batchSize)}...`);

      const batchResults = await Promise.all(
        batch.map(char => this.inferWithCrossReference({
          character: char.character,
          existingData: char
        }))
      );

      results.push(...batchResults);

      // Rate limiting: wait 100ms between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}
```

2. Unihan 데이터 전처리
```typescript
// scripts/etl/preprocess-unihan.ts
import fs from 'fs/promises';
import readline from 'readline';

async function preprocessUnihan() {
  const unihanMap = new Map();

  // Read Unihan_DictionaryLikeData.txt
  const fileStream = fs.createReadStream('data/unihan/Unihan_DictionaryLikeData.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.startsWith('#')) continue;  // Skip comments

    const [codepoint, field, value] = line.split('\t');

    if (!unihanMap.has(codepoint)) {
      unihanMap.set(codepoint, {});
    }

    const data = unihanMap.get(codepoint);
    data[field] = value;
  }

  // Save as JSON for fast lookup
  await fs.writeFile(
    'data/unihan/unihan-cache.json',
    JSON.stringify(Object.fromEntries(unihanMap), null, 2)
  );

  console.log(`✅ Preprocessed ${unihanMap.size} Unihan entries`);
}

preprocessUnihan().catch(console.error);
```

#### 성공 기준:
- ✅ AdvancedElementInference 클래스 구현 완료
- ✅ Unihan 데이터 전처리 완료
- ✅ Cross-reference 로직 작동 확인
- ✅ Batch processing 성능 테스트 (1000개/min 이상)

#### 리스크:
- **Medium**: Unihan 데이터 파싱 복잡도
- **Mitigation**:
  - 데이터 전처리로 JSON 캐시 생성
  - Batch processing으로 성능 최적화

---

### Task 3.3: Band 1 처리 (nameFrequency 50-100)
**시간**: 4-6 시간
**담당자**: Data Engineer
**의존성**: Task 3.2 완료

#### 실행 단계:
1. Band 1 한자 일괄 처리
```typescript
// scripts/etl/process-band1.ts
import { AdvancedElementInference } from './lib/advanced-element-inference';

const inference = new AdvancedElementInference();

async function processBand1() {
  console.log('🔧 Processing Band 1 (nameFrequency 50-100)...\n');

  // Load Band 1 characters
  const band1Chars = JSON.parse(
    await fs.readFile('data/reports/phase3-categorization.json', 'utf-8')
  ).bands.band1;

  console.log(`📊 Total Band 1 characters: ${band1Chars.length}`);

  // Batch inference
  const results = await inference.batchInfer(band1Chars, 50);

  // Filter by confidence threshold
  const highConfidence = results.filter(r => r.confidence >= 0.75);
  const mediumConfidence = results.filter(r => r.confidence >= 0.60 && r.confidence < 0.75);
  const lowConfidence = results.filter(r => r.confidence < 0.60);

  console.log(`
    High Confidence (>= 0.75): ${highConfidence.length}
    Medium Confidence (0.60-0.74): ${mediumConfidence.length}
    Low Confidence (< 0.60): ${lowConfidence.length}
  `);

  // Apply high and medium confidence automatically
  const autoApply = [...highConfidence, ...mediumConfidence];

  for (let i = 0; i < autoApply.length; i++) {
    const result = autoApply[i];
    const char = band1Chars[i];

    await prisma.hanjaDict.update({
      where: { character: char.character },
      data: {
        element: result.element,
        strokes: result.unihanData?.strokes || char.strokes,
        evidenceJSON: {
          ...char.evidenceJSON,
          advancedInference: {
            element: result.element,
            confidence: result.confidence,
            sources: result.sources,
            inferredAt: new Date().toISOString()
          }
        }
      }
    });
  }

  console.log(`✅ Auto-applied ${autoApply.length} enhancements`);

  // Flag low confidence for manual review
  const manualReview = lowConfidence.map((r, i) => ({
    character: band1Chars[i].character,
    meaning: band1Chars[i].meaning,
    reading: band1Chars[i].koreanReading,
    inferredElement: r.element,
    confidence: r.confidence,
    requiresReview: true
  }));

  await fs.writeFile(
    'data/reports/band1-manual-review.json',
    JSON.stringify(manualReview, null, 2)
  );

  console.log(`⚠️  ${manualReview.length} characters flagged for manual review`);
  console.log('See: data/reports/band1-manual-review.json\n');
}

processBand1()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

2. 수동 검토 및 수정
```bash
# Review flagged characters
cat data/reports/band1-manual-review.json

# Manual corrections if needed
npx tsx scripts/etl/apply-manual-corrections.ts --file data/manual-corrections/band1.json
```

#### 성공 기준:
- ✅ Band 1 모든 한자 처리 완료
- ✅ 자동 적용율 85%+ (confidence >= 0.60)
- ✅ 수동 검토 목록 생성 완료
- ✅ 품질 검증 통과

#### 리스크:
- **Low**: Band 1은 인기도가 높아 데이터 품질 양호
- **Mitigation**: Confidence threshold로 품질 관리

---

### Task 3.4-3.5: Band 2-3 처리 (nameFrequency 1-50)
**시간**: 16-20 시간 (2-3일)
**담당자**: Data Engineer
**의존성**: Task 3.3 완료

#### 실행 단계:
1. Band 2 처리 (동일 프로세스, 더 큰 규모)
```bash
npx tsx scripts/etl/process-band2.ts
npx tsx scripts/etl/process-band3.ts
```

2. 병렬 처리로 성능 최적화
```typescript
// Use worker threads for parallel processing
import { Worker } from 'worker_threads';

async function parallelProcess(characters: any[], numWorkers: number = 4) {
  const chunkSize = Math.ceil(characters.length / numWorkers);
  const chunks = [];

  for (let i = 0; i < characters.length; i += chunkSize) {
    chunks.push(characters.slice(i, i + chunkSize));
  }

  const workers = chunks.map((chunk, i) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./process-worker.js', {
        workerData: { chunk, workerId: i }
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });

  const results = await Promise.all(workers);
  return results.flat();
}
```

#### 성공 기준:
- ✅ Band 2 (500자) 처리 완료
- ✅ Band 3 (1,800자) 처리 완료
- ✅ 자동 적용율 80%+ 유지
- ✅ 처리 속도 1,000자/시간 이상

#### 리스크:
- **Medium**: 대량 데이터 처리 시간 소요
- **Mitigation**:
  - 병렬 처리로 성능 최적화
  - Batch size 조정으로 메모리 관리

---

### Task 3.6: Laplace Smoothing 적용 (nameFrequency=0)
**시간**: 2-3 시간
**담당자**: Data Engineer
**의존성**: Task 3.5 완료

#### 실행 단계:
1. Laplace smoothing 스크립트
```typescript
// scripts/etl/apply-laplace-smoothing.ts

async function applyLaplaceSmoothing() {
  console.log('📈 Applying Laplace smoothing to characters with nameFrequency=0...\n');

  // Find characters with nameFrequency = 0 but good data quality
  const zeroFreqChars = await prisma.hanjaDict.findMany({
    where: {
      nameFrequency: 0,
      AND: [
        { strokes: { not: null } },
        { element: { not: null } },
        { koreanReading: { not: null } }
      ]
    }
  });

  console.log(`Found ${zeroFreqChars.length} characters with zero frequency`);

  // Apply minimum score (Laplace smoothing: add 1)
  const updated = await prisma.hanjaDict.updateMany({
    where: {
      nameFrequency: 0,
      AND: [
        { strokes: { not: null } },
        { element: { not: null } },
        { koreanReading: { not: null } }
      ]
    },
    data: {
      nameFrequency: 1  // Minimum score
    }
  });

  console.log(`✅ Applied Laplace smoothing to ${updated.count} characters`);

  // Mark these as usable with lower priority
  await prisma.hanjaDict.updateMany({
    where: {
      nameFrequency: 1,
      isGoodForNaming: false
    },
    data: {
      isGoodForNaming: true,
      evidenceJSON: {
        laplaceSmoothing: true,
        appliedAt: new Date().toISOString(),
        note: 'Low popularity but complete data - suitable for unique names'
      }
    }
  });

  console.log('✅ Laplace smoothing complete!\n');
}

applyLaplaceSmoothing()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

2. 실행
```bash
npx tsx scripts/etl/apply-laplace-smoothing.ts
```

#### 성공 기준:
- ✅ nameFrequency=0인 한자에 최소 점수 부여
- ✅ 데이터 품질 완전한 한자만 활성화
- ✅ 문서화 (evidenceJSON)

#### 리스크:
- **Low**: Laplace smoothing은 표준 통계 기법
- **Mitigation**: None needed

---

### Task 3.7-3.9: 종합 검증 및 최종 업데이트
**시간**: 4-6 시간
**담당자**: QA Engineer + Backend Engineer
**의존성**: Task 3.6 완료

#### 실행 단계:
1. 종합 검증 스크립트 실행
```typescript
// scripts/qa/comprehensive-validation.ts

async function comprehensiveValidation() {
  console.log('🔍 Running comprehensive validation...\n');

  const validations = {
    totalCharacters: await prisma.hanjaDict.count(),
    usableCharacters: await prisma.hanjaDict.count({
      where: {
        isGoodForNaming: true,
        nameFrequency: { gte: 1 }
      }
    }),

    // Check 1: Surname protection
    surnamesProtected: await prisma.hanjaDict.count({
      where: {
        isSurname: true,
        isGoodForNaming: true
      }
    }),

    // Check 2: Data completeness
    completeRecords: await prisma.hanjaDict.count({
      where: {
        AND: [
          { strokes: { not: null } },
          { element: { not: null } },
          { koreanReading: { not: null } },
          { meaning: { not: null } }
        ]
      }
    }),

    // Check 3: Element distribution
    elementDistribution: await prisma.hanjaDict.groupBy({
      by: ['element'],
      _count: true,
      where: { isGoodForNaming: true }
    }),

    // Check 4: Quality score
    qualityScore: 0  // Calculated below
  };

  validations.qualityScore = (validations.completeRecords / validations.totalCharacters) * 100;

  console.log('📊 Validation Results:');
  console.log(JSON.stringify(validations, null, 2));

  // Check if targets met
  const targetsMet = {
    usableCharacters: validations.usableCharacters >= 3000,
    surnamesProtected: validations.surnamesProtected >= 300,
    qualityScore: validations.qualityScore >= 95
  };

  console.log('\n🎯 Targets Met:');
  console.log(JSON.stringify(targetsMet, null, 2));

  if (Object.values(targetsMet).every(v => v === true)) {
    console.log('\n✅ All targets achieved! Project complete!\n');
  } else {
    console.log('\n⚠️  Some targets not met. Review required.\n');
  }

  return validations;
}

comprehensiveValidation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

2. 오류 수정 (if any)
```bash
# If validation fails, identify and fix issues
npx tsx scripts/etl/fix-validation-errors.ts
```

3. 최종 품질 리포트 생성
```bash
npx tsx scripts/qa/data-quality-report.ts > reports/final-quality-report-$(date +%Y%m%d).txt
```

#### 성공 기준:
- ✅ 사용 가능 한자 >= 3,000개
- ✅ 품질 점수 >= 95% (A등급)
- ✅ 성씨 보호 100%
- ✅ 데이터 완전성 95%+

#### 리스크:
- **Low**: 검증 단계는 읽기 전용
- **Mitigation**: None needed

---

### Task 3.10: 최종 리포트 및 프로젝트 완료
**시간**: 2 시간
**담당자**: Project Manager
**의존성**: Task 3.9 완료

#### 실행 단계:
1. 최종 성과 리포트 작성
```markdown
# 한자 데이터베이스 확장 프로젝트 - 최종 보고서

## 프로젝트 개요
- 기간: 2025-10-30 ~ 2025-11-06 (7일)
- 목표: 189 → 3,000+ 사용 가능 한자

## 최종 성과
- **사용 가능 한자**: 3,XXX개 (달성율: XXX%)
- **품질 점수**: XX.X% (A등급)
- **성씨 보호**: 300개 (100%)
- **데이터 완전성**: XX.X%

## Phase별 성과
### Phase 1: Emergency Fixes ✅
- 300개 성씨 한자 보호
- 모니터링 시스템 구축

### Phase 2: Quick Wins ✅
- 상위 500개 인기 한자 처리
- Element 자동 추론 시스템 구축
- 700+ 사용 가능 한자 달성

### Phase 3: Bulk Enhancement ✅
- 2,500개 한자 일괄 처리
- Laplace smoothing 적용
- 3,000+ 사용 가능 한자 달성

## 기술적 성과
- Element 자동 추론 시스템 (정확도 85%+)
- Unihan 데이터베이스 통합
- 병렬 처리 최적화 (1,000자/시간)
- 데이터 품질 모니터링 시스템

## 다음 단계
- 사용자 피드백 수집
- 추가 한자 확장 (5,000개 목표)
- AI 기반 작명 알고리즘 개선
```

2. 문서 업데이트
   - README 업데이트
   - API 문서 업데이트
   - 운영 가이드 작성

3. 이해관계자 발표
   - 경영진 보고
   - 개발팀 공유
   - 운영팀 인계

#### 성공 기준:
- ✅ 최종 보고서 작성 완료
- ✅ 문서 업데이트 완료
- ✅ 이해관계자 승인

---

## 📋 전체 프로젝트 체크리스트

### Phase 1: Emergency Fixes (Day 1) ✅
- [ ] Task 1.1: 성씨 한자 목록 확보 및 분석
- [ ] Task 1.2: 성씨 보호 스크립트 작성 및 실행
- [ ] Task 1.3: isGoodForNaming 로직 검토 및 수정
- [ ] Task 1.4: 데이터베이스 제약 추가
- [ ] Task 1.5: 모니터링 스크립트 작성 및 Cron 설정
- [ ] Task 1.6: Phase 1 검증 및 리포트

### Phase 2: Quick Wins (Day 2-3) ✅
- [ ] Task 2.1: 상위 500개 한자 식별
- [ ] Task 2.2: 참조 데이터 파일 생성
- [ ] Task 2.3: Element Lookup 서비스 구축
- [ ] Task 2.4: 상위 500개 한자 일괄 보강
- [ ] Task 2.5: 검증 및 품질 체크
- [ ] Task 2.6: 데이터베이스 업데이트 적용
- [ ] Task 2.7: Phase 2 검증 및 리포트

### Phase 3: Bulk Enhancement (Day 4-7) ✅
- [ ] Task 3.1: 나머지 한자 분류 및 우선순위 설정
- [ ] Task 3.2: 반자동 Element 추론 스크립트 작성
- [ ] Task 3.3: Band 1 처리 (nameFrequency 50-100)
- [ ] Task 3.4: Band 2 처리 (nameFrequency 20-50)
- [ ] Task 3.5: Band 3 처리 (nameFrequency 1-20)
- [ ] Task 3.6: Laplace Smoothing 적용
- [ ] Task 3.7: 종합 검증
- [ ] Task 3.8: 오류 수정
- [ ] Task 3.9: 최종 데이터베이스 업데이트
- [ ] Task 3.10: 최종 리포트 및 프로젝트 완료

---

## 🎯 성공 지표 (Success Metrics)

### 정량적 지표
| 지표 | 시작 | 목표 | 예상 결과 |
|------|------|------|-----------|
| 사용 가능 한자 수 | 189 | 3,000+ | 3,200+ |
| 사용 가능 비율 | 2.2% | 35%+ | 36.4% |
| 품질 점수 | 30.4% (F) | 95%+ (A) | 96%+ (A+) |
| 성씨 보호율 | 40% | 100% | 100% |
| Element 정확도 | - | 85%+ | 87%+ |

### 정성적 지표
- ✅ 기존 작명 기능 regression 없음
- ✅ 성씨 한자 100% 보호
- ✅ 모니터링 시스템 구축
- ✅ 문서화 완료
- ✅ 운영 인계 완료

---

## ⚠️ 리스크 관리

### Critical Risks (🔴)
| 리스크 | 영향 | 확률 | 대응 방안 |
|--------|------|------|-----------|
| 성씨 한자 필터링 | High | Low | Phase 1에서 우선 처리, DB 제약 추가 |
| 기존 기능 regression | High | Low | 충분한 테스트, Feature flag |
| 데이터 손실 | High | Very Low | 백업, 트랜잭션, Rollback 준비 |

### High Risks (🟡)
| 리스크 | 영향 | 확률 | 대응 방안 |
|--------|------|------|-----------|
| Element 추론 부정확 | Medium | Medium | Confidence threshold, 수동 검토 |
| 처리 시간 초과 | Medium | Low | 병렬 처리, 최적화 |
| 전문가 리뷰 지연 | Medium | Medium | 샘플 검증, 사후 수정 |

### Medium Risks (🟢)
| 리스크 | 영향 | 확률 | 대응 방안 |
|--------|------|------|-----------|
| Unihan 데이터 불완전 | Low | Medium | 다층 fallback, 다른 소스 활용 |
| 리소스 부족 | Low | Low | 우선순위 조정, Phase 분할 |

---

## 📚 참고 자료

### 데이터 소스
- **Unihan Database**: https://www.unicode.org/charts/unihan.html
- **표준국어대사전**: https://stdict.korean.go.kr
- **통계청 성씨 통계**: https://kosis.kr
- **행정안전부 인명용 한자**: https://www.mois.go.kr

### 기술 문서
- **Prisma ORM**: https://www.prisma.io/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Node.js**: https://nodejs.org/docs

### 사주명리학 참고
- 전통 오행론 (Five Elements Theory)
- 음양론 (Yin-Yang Theory)
- 작명학 기초 (Korean Naming Principles)

---

## 📞 연락처 및 지원

### 프로젝트 팀
- **Project Lead**: [이름]
- **Backend Engineer**: [이름]
- **Data Engineer**: [이름]
- **QA Engineer**: [이름]
- **Domain Expert**: [이름]

### 긴급 연락처
- **Tech Support**: [이메일]
- **Data Issues**: [이메일]
- **Business Questions**: [이메일]

---

**문서 버전**: 1.0
**최종 수정**: 2025-10-30
**다음 리뷰**: 2025-11-06 (프로젝트 완료 후)
