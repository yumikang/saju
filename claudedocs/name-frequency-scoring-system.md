# 한자 작명 인기도 점수 업데이트 시스템

## 개요

2024년 신생아 이름 통계를 기반으로 8,787개 한자 캐릭터의 `nameFrequency` 필드에 0-100 점수를 할당하는 시스템입니다.

### 데이터 출처
- **주요 출처**: 대한민국 법원 전자가족관계등록시스템 출생신고 통계
- **보조 출처**: namechart.kr, baby-name.kr
- **참고**: 행정안전부가 아닌 법원 시스템 데이터 기반

## 점수 체계

### 점수별 분류

| 점수 | 분류 | 설명 | 예상 한자 수 |
|------|------|------|-------------|
| 100 | 매우 인기 많음 | TOP 10 이름에 사용 | ~30개 |
| 90 | 인기 많음 | TOP 11-50 이름에 사용 | ~80개 |
| 70 | 인기 있음 | TOP 51-100 이름에 사용 | ~120개 |
| 50 | 보통 | 자주 사용되는 작명용 한자 | ~200개 |
| 30 | 가끔 사용 | 간혹 사용되는 한자 | ~100개 |
| 10 | 거의 사용 안 함 | 매우 드물게 사용 | ~300개 |
| 0 | 미사용 | 현대 작명에 사용 안 함 | ~7,957개 |

### 점수 산정 로직

#### 1단계: TOP 10 이름 분석 (점수 100)
- **남아 TOP 10**: 이준, 하준, 도윤, 은우, 시우, 서준, 선우, 유준, 수호, 도현
- **여아 TOP 10**: 이서, 서아, 하린, 지유, 하윤, 지안, 지아, 서윤, 아린, 시아
- **추출 방법**: 각 이름의 음절에 대응하는 모든 한자 추출
- **예시**: "이준" → 伊/李/異 (이) + 俊/準/峻/竣/駿 (준)

#### 2단계: TOP 11-50 이름 분석 (점수 90)
- **남아 TOP 50**: 지호, 예준, 주원, 우진, 민준 등 40개 이름
- **여아 TOP 50**: 유주, 채원, 수아, 윤서, 채아 등 40개 이름
- **중복 처리**: TOP 10에 이미 포함된 한자는 제외

#### 3단계: TOP 51-100 이름 분석 (점수 70)
- **남아 TOP 100**: 정우, 승민, 상우, 진우, 지안 등 50개 이름
- **여아 TOP 100**: 지효, 서연, 가은, 서희, 은채 등 50개 이름
- **중복 처리**: TOP 50 이상에 포함된 한자는 제외

#### 4단계: 자주 사용되는 한자 (점수 50)
- **남성 선호 한자**: 俊/準/峻, 宇/佑/祐, 瑞/端, 夏/河/荷 등
- **여성 선호 한자**: 書/徐/西, 智/知/池, 雅/娥/亞, 潤/胤/允 등
- **중성 한자**: 仁/義/禮/智/信, 福/壽/康/寧/安 등
- **총 ~200개**: 작명 사전 및 전문가 의견 기반 선정

#### 5단계: 간혹 사용되는 한자 (점수 30)
- **고전적 한자**: 鳳/龍/虎/熊/鶴 (동물), 梅/蘭/菊/竹/松 (식물)
- **특수 의미**: 璧/璋/瑜/瑾 (보석), 劍/弓/戟 (무기)
- **총 ~100개**: 전통적이지만 현대에 덜 사용

#### 6단계: 나머지 한자 (점수 0)
- **미사용 한자**: 작명에 거의 사용되지 않는 한자
- **총 ~7,957개**: 전체의 약 90.5%

## 기술 구현

### TypeScript 타입 안전성

```typescript
// 점수 타입 (0-100)
type FrequencyScore = number;

// 업데이트 데이터 인터페이스
interface HanjaFrequencyUpdate {
  character: string;
  score: FrequencyScore;
}

// 이름 상수 타입 (readonly)
const TOP_10_MALE_NAMES = [
  '이준', '하준', '도윤', '은우', '시우',
  '서준', '선우', '유준', '수호', '도현',
] as const;
```

### Prisma 배치 업데이트 패턴

```typescript
async function bulkUpdateFrequency(
  updates: readonly HanjaFrequencyUpdate[],
  score: FrequencyScore
): Promise<void> {
  const characters = updates.map(u => u.character);

  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: characters },
    },
    data: { nameFrequency: score },
  });

  console.log(`✅ ${result.count}/${updates.length}개 업데이트 완료`);
}
```

### 음절-한자 매칭 로직

```typescript
// 한글 이름 → 음절 분리
function extractSyllables(name: string): string[] {
  return name.split('');
}

// 음절 → 한자 조회 (DB 기반)
async function findHanjaForSyllable(syllable: string): Promise<string[]> {
  const results = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: {
        contains: syllable,
        mode: 'insensitive',
      },
    },
    select: { character: true },
  });

  return results.map(r => r.character);
}
```

## 실행 방법

### 스크립트 실행

```bash
# TypeScript로 직접 실행
npx tsx scripts/update-name-frequency.ts

# 또는 Node.js로 실행 (컴파일 후)
npm run build
node dist/scripts/update-name-frequency.js
```

### 예상 실행 시간
- **전체 실행**: 약 2-5분
- **TOP 10 분석**: ~30초
- **TOP 50 분석**: ~1분
- **TOP 100 분석**: ~1분 30초
- **자주 사용 한자**: ~30초
- **나머지 처리**: ~1분

### 성능 최적화
- **배치 업데이트**: `updateMany` 사용으로 단일 쿼리 실행
- **인덱스 활용**: `nameFrequency` 필드에 인덱스 존재
- **병렬 처리**: 가능한 경우 Promise.all 사용

## 데이터 검증

### 실행 후 확인 사항

```sql
-- 점수별 분포 확인
SELECT
  name_frequency,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM hanja_dict), 2) as percentage
FROM hanja_dict
GROUP BY name_frequency
ORDER BY name_frequency DESC;

-- TOP 점수 한자 확인
SELECT character, korean_reading, meaning, name_frequency
FROM hanja_dict
WHERE name_frequency = 100
ORDER BY character;

-- 0점 한자 샘플 확인
SELECT character, korean_reading, meaning, name_frequency
FROM hanja_dict
WHERE name_frequency = 0
LIMIT 20;
```

### 기대 결과

```
점수 분포 예상:
- 100점: ~30개 (0.34%)
- 90점: ~80개 (0.91%)
- 70점: ~120개 (1.37%)
- 50점: ~200개 (2.28%)
- 30점: ~100개 (1.14%)
- 0점: ~7,957개 (90.55%)
- null: 0개 (0%)
```

## 2024년 이름 통계 분석

### TOP 10 남아 이름 (실제 인원)

| 순위 | 이름 | 출생신고 수 | 주요 한자 |
|------|------|------------|----------|
| 1 | 이준 | 1,593명 | 伊俊, 李俊, 異俊 |
| 2 | 하준 | 1,512명 | 夏俊, 河俊, 荷俊 |
| 3 | 도윤 | 1,492명 | 道允, 都允, 度允 |
| 4 | 은우 | 1,353명 | 恩宇, 銀宇, 殷宇 |
| 5 | 시우 | 1,351명 | 時宇, 是宇, 詩宇 |
| 6 | 서준 | 1,324명 | 瑞俊, 徐俊, 西俊 |
| 7 | 선우 | 1,218명 | 善宇, 鮮宇, 璿宇 |
| 8 | 유준 | 1,204명 | 有俊, 柔俊, 維俊 |
| 9 | 수호 | 1,156명 | 守護, 秀護, 洙護 |
| 10 | 도현 | 1,135명 | 道賢, 都賢, 度賢 |

### TOP 10 여아 이름 (실제 인원)

| 순위 | 이름 | 출생신고 수 | 주요 한자 |
|------|------|------------|----------|
| 1 | 이서 | 1,689명 | 伊書, 李書, 異書 |
| 2 | 서아 | 1,682명 | 書雅, 瑞雅, 徐雅 |
| 3 | 하린 | 1,320명 | 夏麟, 河麟, 荷麟 |
| 4 | 지유 | 1,238명 | 智有, 知有, 池有 |
| 5 | 하윤 | 1,224명 | 夏允, 河允, 荷允 |
| 6 | 지안 | 1,194명 | 智安, 知安, 池安 |
| 7 | 지아 | 1,133명 | 智雅, 知雅, 池雅 |
| 8 | 서윤 | 1,121명 | 書允, 瑞允, 徐允 |
| 9 | 아린 | 1,116명 | 雅麟, 我麟, 娥麟 |
| 10 | 시아 | 1,087명 | 時雅, 詩雅, 是雅 |

### 이름 트렌드 분석

#### 남아 이름 특징
- **"준" 음절 인기**: TOP 10 중 6개 이름 (이준, 하준, 서준, 유준)
- **"우" 음절 선호**: 은우, 시우, 선우 등
- **"도" 음절 부상**: 도윤, 도현 신규 진입
- **전통 + 현대 조화**: 고전적 한자 + 현대적 어감

#### 여아 이름 특징
- **"서" 음절 압도적**: 이서, 서아, 서윤 등
- **"아" 음절 선호**: 서아, 지아, 시아 등
- **"지" 음절 다수**: 지유, 지안, 지아 등
- **부드러운 어감**: 柔軟한 발음 선호

#### 공통 트렌드
- **2음절 이름 주류**: 거의 모든 TOP 10 이름
- **순우리말 표기 증가**: 한자 표기 없이 한글로만 신고 증가
- **성별 중성 이름**: "지안", "시우" 등 남녀 공통 사용
- **현대적 감각**: 전통보다 발음과 의미 중시

## 향후 개선 방안

### 데이터 확장
1. **TOP 500 확장**: 더 많은 이름 데이터 수집
2. **연도별 추적**: 2023, 2022 데이터 추가로 트렌드 분석
3. **지역별 분석**: 서울/경기/부산 등 지역별 선호도
4. **성별 교차 분석**: 남녀 공통 사용 한자 식별

### 알고리즘 개선
1. **가중 평균 점수**: 이름 빈도수를 반영한 가중치
2. **시계열 분석**: 최근 3년 평균으로 안정적 점수
3. **머신러닝**: 이름 패턴 학습으로 자동 분류
4. **의미 기반 점수**: 긍정/부정 의미 반영

### 사용자 경험
1. **실시간 인기도**: 월별/분기별 업데이트
2. **트렌드 예측**: 향후 인기 예상 한자 제시
3. **유사 한자 추천**: 같은 음절의 대체 한자 제안
4. **조합 최적화**: 성+이름 전체 조화도 분석

## 참고 자료

### 공식 통계 출처
- [대한민국 법원 전자가족관계등록시스템](https://efamily.scourt.go.kr)
- [네임차트](https://www.namechart.kr/chart/2024)
- [아기 이름 통계](https://baby-name.kr/annalRanking/2024/)

### 관련 스크립트
- `scripts/classify-gender-comprehensive.ts`: 성별 분류 시스템 (유사 패턴)
- `app/repositories/hanja.repository.ts`: 한자 DB 접근 레이어
- `prisma/schema.prisma`: 데이터베이스 스키마 정의

### 데이터베이스 인덱스
```sql
-- nameFrequency 인덱스 (이미 존재)
CREATE INDEX idx_hanja_dict_name_frequency
ON hanja_dict(name_frequency DESC);

-- 복합 인덱스 (성별 + 인기도)
CREATE INDEX idx_hanja_dict_gender_frequency
ON hanja_dict(gender, name_frequency DESC);
```

## 라이선스 및 저작권

### 데이터 출처 표시
- **통계 데이터**: 대한민국 법원 전자가족관계등록시스템 (공공데이터)
- **분석 및 가공**: 본 프로젝트 독자적 분석
- **상업적 사용**: 통계 데이터는 공공 목적 활용 가능

### 주의 사항
- 통계 데이터는 참고용이며, 실제 한자 사용 비율과 다를 수 있음
- 순우리말 이름 증가로 한자 표기 없는 경우 제외됨
- 지역/계층별 차이는 반영되지 않음

---

**작성일**: 2025-10-17
**버전**: 1.0.0
**작성자**: Claude Code
**마지막 업데이트**: 2025-10-17
