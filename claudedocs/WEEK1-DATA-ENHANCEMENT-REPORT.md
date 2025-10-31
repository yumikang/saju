# Week 1 데이터 개선 작업 종합 리포트

**작성일**: 2025-10-30
**작업 기간**: Day 3 ~ Day 5
**목표**: 5축 필터링 시스템 구축

---

## 📊 Executive Summary

### 핵심 성과
- ✅ **5축 필터링 시스템** 완성 (오행 + 빈도/Seed + 성씨제외 + 성별 + 한글음운)
- ✅ **120자 Seed 보호** (레어하지만 아름다운 한자)
- ✅ **105자 Gender 큐레이션** (성별 적합 한자)
- ✅ **2,700+자 추천 풀** (여아/남아 각각)
- ✅ **런타임 음운 보정** (한글 종성 기반 ±6점)

### 데이터베이스 현황
| 항목 | 수량 | 비율 |
|------|------|------|
| 전체 한자 | 8,787자 | 100% |
| 작명 적합 | 2,748자 | 31.3% |
| 불용한자 | 6,039자 | 68.7% |
| Seed 보호 | 120자 | 4.4% (적합 한자 대비) |
| Gender 큐레 | 105자 | 3.8% (적합 한자 대비) |

---

## 🛡️ Day 3: Seed Protection 시스템

### 목적
**"빈도 낮아도 예쁜 한자는 살려야지!"**

기존 시스템의 문제점:
- `nameFrequency >= 50` 하드컷으로 인해 레어 한자 전부 탈락
- 曄(빛날 엽), 渼(아름다울 미), 姸(아름다울 연) 같은 아름다운 한자가 제외됨

### 구현
```sql
-- 기존 (하드컷)
WHERE nameFrequency >= 50

-- 개선 (OR 로직)
WHERE seedProtected = true OR nameFrequency >= 50
```

### 성과
| 지표 | 수치 |
|------|------|
| 보호된 한자 | **120자** |
| 빈도 <10인 레어 | **57자** (보호 효과) |
| 추가 확보 한자 | **+59자** (2.2% 증가) |

### 오행별 분포
```
WOOD  : 29자 (24.2%)
FIRE  : 28자 (23.3%)
EARTH : 26자 (21.7%)
WATER : 21자 (17.5%)
METAL : 16자 (13.3%)
```

### 보호된 레어 한자 예시
| 한자 | 의미 | 빈도 | 오행 |
|------|------|------|------|
| 曄 | 빛날 엽 | 0 | FIRE |
| 渼 | 아름다울 미 | 0 | WATER |
| 姸 | 아름다울 연 | 0 | EARTH |
| 璟 | 옥빛 경 | 0 | METAL |
| 桂 | 계수나무 계 | 0 | WOOD |

---

## 👫 Day 4: Gender Hint 시스템

### 목적
**"여자 이름엔 여자 한자, 남자 이름엔 남자 한자!"**

DB 레벨에서 성별 적합 한자를 구분하여 추천 품질 향상

### 구현
```typescript
// Prisma Schema
model HanjaDict {
  genderHint  String?  @map("gender_hint")  // 'female' | 'male' | 'unisex'
}

// Query Logic (여아)
WHERE genderHint IN ['female', 'unisex'] OR genderHint IS NULL

// Query Logic (남아)
WHERE genderHint IN ['male', 'unisex'] OR genderHint IS NULL
```

### 큐레이션 데이터
- **`female-hanja-seed.json`**: 50자 (여아 전용)
- **`male-hanja-seed.json`**: 51자 (남아 전용)
- **`unisex-hanja-seed.json`**: 16자 (공통)

### 성과
| 지표 | 수치 |
|------|------|
| Female 한자 | **45자** |
| Male 한자 | **44자** |
| Unisex 한자 | **16자** |
| 큐레이션 비율 | **1.2%** (전체 대비) |

### 오행별 성별 분포

**Female (45자)**
```
WOOD  : 13자 (28.9%)
WATER : 12자 (26.7%)
FIRE  : 11자 (24.4%)
METAL : 5자  (11.1%)
EARTH : 4자  (8.9%)
```

**Male (44자)**
```
WOOD  : 12자 (27.3%)
FIRE  : 12자 (27.3%)
METAL : 7자  (15.9%)
WATER : 7자  (15.9%)
EARTH : 6자  (13.6%)
```

### 샘플 한자

**👧 Female 샘플**
```
嬉(놀)  妃(왕비)  潼(물이름)  瑛(옥빛)🛡️  嫺(아담할)🛡️
喜(기쁠)  娥(예쁠)  美(아름다울)🛡️  蓉(부용)  淸(맑을 청)🛡️
```

**👦 Male 샘플**
```
炯(밝을)  義(의)  允(허락할)  昊(클 호)🛡️  昶(해길)
溶(녹을)  鋒(칼날)  建(세울)  桓(굳셀 환)🛡️  敬(공경할)
```

---

## 🎵 Day 5: 한글 음운 기반 성별 보정 (5축)

### 목적
**"'수아'는 여자 이름 느낌, '민준'은 남자 이름 느낌!"**

한글 종성 기반으로 런타임에서 성별 적합도 보정

### 설계 철학
- **DB는 보수적으로**: 한자 단위 성별만 표기
- **결과는 한국 감성으로**: 한글 이름 후보에 음운 보정 적용
- **절대 하드컷 금지**: 보너스만 부여, 감점은 약하게

### 구현
```typescript
// app/lib/naming/utils/gender-boost.ts
export function genderBoost(
  koreanName: string,
  targetGender: 'M' | 'F' | null
): number {
  // 여성형 강한 어미 (+6)
  const strongFemale = ['아', '라', '나', '다', '사', '예', '연'];

  // 남성형 강한 어미 (+6)
  const strongMale = ['준', '호', '현', '우', '석', '범', '태', '진', '환'];

  // 중립형 어미 (+3)
  const neutralFemale = ['은', '윤', '서', '유'];
  const neutralMale = ['민', '빈', '원', '서', '하', '솔'];

  // 반대 성별 (-2)
  // ...
}

// app/lib/naming/pipeline/naming-pipeline.ts
const hangulGenderBoost = genderBoost(combo.firstName, context.birthInfo.gender);
const finalTotalScore = totalScore + hangulGenderBoost;
```

### 보정 규칙

| 종성 타입 | 여아 | 남아 | 보정 점수 |
|-----------|------|------|-----------|
| 강한 여성형 | 아/라/나/다/사/예/연 | - | +6 |
| 강한 남성형 | - | 준/호/현/우/석/범/태/진/환 | +6 |
| 중립형 (여) | 은/윤/서/유 | - | +3 |
| 중립형 (남) | - | 민/빈/원/서/하/솔 | +3 |
| 반대 성별 | 준/호/현... | 아/라/나... | -2 |

### 시대성 반영
- **2000년대 이후 트렌드**: 서/윤/유는 중립형으로 (+3점)
- **강한 성별 어미**: 아/라/나 (여), 준/호/현 (남) → +6점
- **약한 감점**: 반대 성별도 -2점만 (하드컷 방지)

### 효과 검증
```
수아 (여아): Base 75.5 + Gender +6 = 81.5 ✨
민준 (남아): Base 78.2 + Gender +6 = 84.2 ✨
서은 (여아): Base 72.8 + Gender +3 = 75.8
지민 (남아): Base 70.5 + Gender +3 = 73.5
```

---

## 🎯 5축 필터링 시스템 종합

### 시스템 구조

```
┌─────┬────────────────┬──────────────┬────────────┐
│ 축  │ 시스템         │ 구현         │ 레벨       │
├─────┼────────────────┼──────────────┼────────────┤
│ 1축 │ 오행           │ 사주 용신    │ DB Query   │
│ 2축 │ 빈도/Seed      │ 120자 보호   │ DB Query   │
│ 3축 │ 성씨 제외      │ 132자 제외   │ DB Query   │
│ 4축 │ Gender Hint    │ 105자 큐레   │ DB Query   │
│ 5축 │ 한글 음운      │ 종성 보정    │ Runtime    │
└─────┴────────────────┴──────────────┴────────────┘
```

### 데이터 흐름

```
사주 입력
    ↓
[1축] 오행 필터링 (용신 기반)
    ↓
[2축] 빈도/Seed 필터링 (120자 보호)
    ↓
[3축] 성씨 제외 필터링 (132자 제외)
    ↓
[4축] Gender Hint 필터링 (105자 큐레)
    ↓
후보 한자 선정 (약 2,700자)
    ↓
2자 이름 조합 생성 (약 1,500개)
    ↓
기본 점수 계산 (오행 + 음양 + 수리 + 의미)
    ↓
[5축] 한글 음운 보정 (+6/+3/-2)
    ↓
최종 점수 = baseScore + genderBoost
    ↓
Top 20 추천
```

---

## 📈 4축 필터링 효과 분석

### 필터링 결과

| 구분 | 수량 | 비율 |
|------|------|------|
| 여아 가능 한자 | **2,704자** | 30.8% (전체 대비) |
| 남아 가능 한자 | **2,703자** | 30.8% (전체 대비) |
| 고품질 여아 한자 | **1,068자** | Seed OR 빈도≥100 |
| 고품질 남아 한자 | **1,073자** | Seed OR 빈도≥100 |

### 빈도 분포 (isGoodForNaming = true)

```
평균 빈도: 85.5

고빈도 (≥100):   984자 (35.8%)  ████████████████████
중빈도 (50-99): 1,652자 (60.1%)  ████████████████████████████████
저빈도 (<50):    112자 (4.1%)   ██

→ Seed 보호 효과: 저빈도 중 57자 보호됨 (50.9%)
```

### 오행 분포 (isGoodForNaming = true)

```
FIRE  :  587자 (21.4%)  ███████████████████████
WOOD  :  567자 (20.6%)  ██████████████████████
METAL :  547자 (19.9%)  █████████████████████
EARTH :  534자 (19.4%)  █████████████████████
WATER :  513자 (18.7%)  ████████████████████
```

→ 거의 균등 분포! (18.7% ~ 21.4%)

---

## ✨ 개선 효과 요약

### 📊 정량적 개선

| 지표 | 성과 |
|------|------|
| 🛡️ Seed 보호 | **120자** (레어 한자 보호) |
| 👫 Gender 큐레이션 | **105자** (성별 적합 한자) |
| 👧 여아 한자 풀 | **2,704자** (4축 필터링 후) |
| 👦 남아 한자 풀 | **2,703자** (4축 필터링 후) |
| 🎵 런타임 보정 | **5축** (한글 음운 +6/+3/-2) |

### 🎯 정성적 개선

1. **🛡️ 레어 보호**
   - 빈도 낮아도 아름다운 한자 보호
   - 曄, 渼, 姸, 璟 같은 보석 한자 살림

2. **👫 성별 적합**
   - DB 레벨 + 런타임 이중 보정
   - 여자 이름엔 여자 한자, 남자 이름엔 남자 한자

3. **🎵 한글 감성**
   - 2000년대 이후 트렌드 반영
   - "수아", "민준" 같은 현대 감성

4. **🚫 절대 컷 금지**
   - 하드컷 없음, 보너스만 부여
   - 모든 한자에 기회 제공

5. **📈 품질 향상**
   - 사람 큐레이션 + 머신 필터링
   - "사람이 고른 것 > 머신이 고른 것"

---

## 🔧 기술적 구현

### Prisma Schema 변경

```typescript
model HanjaDict {
  // Day 3: Seed Protection
  seedProtected    Boolean      @default(false) @map("seed_protected")

  // Day 4: Gender Hint
  genderHint       String?      @map("gender_hint")  // 'female' | 'male' | 'unisex'

  // Indexes
  @@index([seedProtected])
  @@index([genderHint])
}
```

### Repository 로직 (hanja.repository.ts)

```typescript
async recommendForSaju(params: {
  lackingElements?: string[];
  gender?: 'M' | 'F' | null;
  minPopularity?: number;
  limit?: number;
}): Promise<HanjaDict[]> {
  const where: Prisma.HanjaDictWhereInput = {
    AND: [
      // 0. Seed Protection (OR 로직)
      {
        OR: [
          { seedProtected: true },
          {
            isGoodForNaming: true,
            nameFrequency: { gte: minPopularity },
          },
        ],
      },

      // 1. 성씨 제외
      { isSurname: false },

      // 2. 부족한 오행
      lackingElements.length > 0
        ? { element: { in: lackingElements } }
        : {},

      // 3. Gender Hint 필터
      gender === 'M'
        ? {
            OR: [
              { genderHint: { in: ['male', 'unisex'] } },
              { genderHint: null },
            ],
          }
        : gender === 'F'
        ? {
            OR: [
              { genderHint: { in: ['female', 'unisex'] } },
              { genderHint: null },
            ],
          }
        : {},
    ],
  };

  return this.prisma.hanjaDict.findMany({ where, ... });
}
```

### Pipeline 통합 (naming-pipeline.ts)

```typescript
// 기본 점수 계산
const totalScore =
  scores.yongsin * context.config.weights.yongsin +
  scores.yinyang * context.config.weights.yinyang +
  scores.pronunciation * context.config.weights.pronunciation +
  scores.meaning * context.config.weights.meaning +
  scores.numerology * context.config.weights.numerology +
  scores.taboo * context.config.weights.taboo;

// 5축: 한글 음운 기반 성별 보정
const hangulGenderBoost = genderBoost(combo.firstName, context.birthInfo.gender);
const finalTotalScore = totalScore + hangulGenderBoost;
```

---

## 📝 커밋 히스토리

```bash
1cf6572 feat: Integrate hangul phonetic gender boost into naming pipeline (Day 5 완성)
00e2871 feat: Day 5 - 한글 음운 기반 성별 보정 시스템 (5축 필터링 완성)
805c915 feat: Day 4 - Gender Hint 시스템 구축 (4축 필터링 완성)
ed70565 feat: Day 3 - Seed Protection 시스템 구축 (사람이 고른 것 > 머신이 고른 것)
```

---

## 🚀 다음 단계

### Immediate (Week 2)
1. **End-to-End 테스트**
   - 실제 사주 입력 → 이름 추천 전체 플로우
   - 여아/남아 각 10케이스씩 검증

2. **성능 측정**
   - 5축 필터링 성능 영향 측정
   - 목표: <3초 응답 시간 유지

3. **사용자 테스트**
   - 추천 이름 품질 사용자 평가
   - A/B 테스트 (5축 vs 4축)

### Short-term (Week 3-4)
1. **데이터 확장**
   - Seed 보호 한자 200자로 확대
   - Gender Hint 150자로 확대

2. **보정 로직 개선**
   - 3글자 이름 패턴 추가
   - 지역별 선호도 반영

### Long-term (Month 2+)
1. **ML 기반 최적화**
   - 사용자 선택 패턴 학습
   - 동적 가중치 조정

2. **A/B 테스트 & 최적화**
   - 보정 점수 최적화 (+6 vs +5)
   - 감점 정도 조정 (-2 vs -3)

---

## 📚 참고 자료

### 생성된 파일
- `app/lib/naming/utils/gender-boost.ts` - 한글 음운 보정 유틸
- `scripts/mark-seed-protected.ts` - Seed 보호 마킹 스크립트
- `scripts/mark-gender-hints.ts` - Gender Hint 마킹 스크립트
- `scripts/test-gender-boost.ts` - Gender Boost 기능 테스트
- `scripts/test-gender-boost-integration.ts` - 통합 테스트
- `scripts/analyze-data-quality.ts` - 데이터 품질 분석

### 데이터 파일
- `scripts/etl/data/good-hanja-seed.json` (110자)
- `scripts/etl/data/female-hanja-seed.json` (50자)
- `scripts/etl/data/male-hanja-seed.json` (51자)
- `scripts/etl/data/unisex-hanja-seed.json` (16자)

---

## 🎯 결론

**5축 필터링 시스템**이 완전히 구축되어, 한국 전통 사주 명리와 현대 한국어 감성을 모두 반영하는 **고품질 이름 추천 시스템**이 완성되었습니다.

**핵심 성과:**
- ✅ 2,700+ 추천 한자 풀 확보
- ✅ 레어 한자 보호 (120자)
- ✅ 성별 적합 큐레이션 (105자)
- ✅ 한글 음운 보정 (런타임)
- ✅ 사람 + 머신 하이브리드 시스템

**사용자 혜택:**
- 🎯 더 정확한 성별 적합 추천
- 💎 레어하지만 아름다운 한자 발견
- 🎵 현대 한국어 감성 반영
- 📈 전반적인 추천 품질 향상

---

**Report End** | 2025-10-30 | Week 1 Complete ✅
