# 🎯 Unihan + 수리오행 구현 가이드

TypeScript 단일 스택으로 획수 데이터 확보 및 오행 자동 계산

---

## 📋 전체 플랜

### Week 1: 획수 데이터 & 수리오행
- **Day 1-2**: Unihan 다운로드 및 파싱
- **Day 3**: 수리오행 구현 (5줄)
- **Day 4**: DB 마이그레이션

### Week 2: 사주 계산 엔진
- **Day 5-7**: TypeScript 사주 계산 직접 구현

---

## ⚡ Quick Start

### 1. Unihan 데이터 다운로드

```bash
# 공식 사이트에서 다운로드
curl -O https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip

# 압축 해제
unzip Unihan.zip -d scripts/etl/data/unihan/

# 필요 파일: Unihan_IRGSources.txt
```

### 2. 획수 데이터 추출

```bash
# TypeScript 실행
npx ts-node scripts/etl/fetch-unihan.ts

# 결과: scripts/etl/data/unihan/unihan-strokes.json
```

### 3. 수리오행 테스트

```bash
# 함수 테스트
npx ts-node -e "
const { getElementFromStrokes } = require('./app/lib/hanja/stroke-element');

console.log('13획:', getElementFromStrokes(13));  // WOOD
console.log('27획:', getElementFromStrokes(27));  // FIRE
console.log('35획:', getElementFromStrokes(35));  // EARTH
"
```

### 4. DB 마이그레이션

```bash
# PostgreSQL 업데이트
npx ts-node scripts/etl/migrate-unihan-strokes.ts

# 결과 확인
psql -d saju_naming -c "SELECT character, strokes, element FROM hanja_dict LIMIT 10;"
```

### 5. 사주 계산 테스트

```bash
# 계산 테스트
npx ts-node app/lib/saju/calculator.ts

# 예상 출력:
# 🔮 사주 계산 결과
# 년주: { stem: '경', branch: '오' }
# 월주: { stem: '신', branch: '사' }
# ...
```

---

## 📊 데이터 구조

### Unihan 획수 JSON

```json
[
  {
    "codepoint": "U+4E00",
    "character": "一",
    "totalStrokes": 1,
    "radical": "⼀",
    "radicalStrokes": 0
  },
  {
    "codepoint": "U+4E8C",
    "character": "二",
    "totalStrokes": 2,
    "radical": "⼀",
    "radicalStrokes": 1
  }
]
```

### 수리오행 규칙

```typescript
1, 6  → 水 (수)
2, 7  → 火 (화)
3, 8  → 木 (목)
4, 9  → 金 (금)
5, 10 → 土 (토)

// 10 이상: 끝자리로 판단
13획 = 3 → 木
27획 = 7 → 火
35획 = 5 → 土
```

---

## 🧪 검증 방법

### 1. 획수 정확성

```sql
-- 샘플 한자 확인
SELECT character, strokes, element
FROM hanja_dict
WHERE character IN ('一', '二', '三', '水', '火', '木', '金', '土')
ORDER BY strokes;

-- 예상 결과:
-- 一: 1획 → 수(水)
-- 二: 2획 → 화(火)
-- 三: 3획 → 목(木)
```

### 2. 오행 분포

```sql
-- 오행별 개수
SELECT element, COUNT(*) as count
FROM hanja_dict
WHERE element IS NOT NULL
GROUP BY element
ORDER BY count DESC;
```

### 3. 사주 계산

```typescript
// 알려진 사주로 검증
const calculator = new SajuCalculator();

// 예: 1990년 5월 15일 14:30
const result = calculator.calculate(
  new Date(1990, 4, 15),
  '14:30',
  false
);

// 년주 확인: 경오년 (庚午)
console.assert(result.pillars.year.stem === '경');
console.assert(result.pillars.year.branch === '오');
```

---

## ⚠️ 알려진 제한사항

### 1. 음력 변환 미구현

```typescript
// 현재: 임시로 양력 그대로 사용
// TODO: lunar-typescript 라이브러리 추가
// npm install lunar-typescript
```

### 2. 절기 계산 간략화

```typescript
// 현재: 입춘을 2월 4일로 고정
// TODO: 천문학 공식으로 정확한 절기 계산
// 참고: https://github.com/choigwanho/korean-solar-terms
```

### 3. 월간/시간 공식 간략화

```typescript
// 현재: 근사 공식 사용
// TODO: 정확한 육십갑자 공식 적용
```

---

## 🔧 향후 개선사항

### Phase 1 (즉시)
- ✅ Unihan 획수 확보
- ✅ 수리오행 구현
- ✅ 기본 사주 계산

### Phase 2 (2주 내)
- [ ] 음력 변환 라이브러리 통합
- [ ] 정확한 절기 계산
- [ ] 월간/시간 공식 개선

### Phase 3 (1달 내)
- [ ] 대운/세운 계산
- [ ] 십성 분석
- [ ] 신살 판단

---

## 📚 참고 자료

### Unihan Database
- 공식 사이트: https://www.unicode.org/charts/unihan.html
- GitHub: https://github.com/unicode-org/unihan-database
- 문서: https://www.unicode.org/reports/tr38/

### 성명학 수리오행
- 81수리 이론
- 수리오행 변환 규칙
- 획수 계산 방법 (원획법)

### 사주명리학
- 육십갑자 순환
- 천간지지 오행
- 용신 결정법

---

## 💡 팁

### 빠른 검증

```bash
# 한 줄 명령어로 전체 확인
npx ts-node -e "
const calc = require('./app/lib/saju/calculator').SajuCalculator;
const elem = require('./app/lib/hanja/stroke-element');

console.log('수리오행:', elem.getElementFromStrokes(13));
console.log('사주:', new calc().calculate(new Date(1990,4,15), '14:30', false));
"
```

### 성능 최적화

```typescript
// 캐싱 추가
const cache = new Map();
function getCachedElement(strokes: number) {
  if (!cache.has(strokes)) {
    cache.set(strokes, getElementFromStrokes(strokes));
  }
  return cache.get(strokes);
}
```

---

## 🆘 문제 해결

### Unihan 다운로드 실패

```bash
# 미러 사이트 사용
wget https://github.com/unicode-org/unihan-database/releases/latest/download/Unihan.zip
```

### PostgreSQL 연결 오류

```bash
# .env.production 확인
DATABASE_URL="postgresql://saju_user:saju_secure_2024!@localhost:5437/saju_naming?schema=public"
```

### TypeScript 컴파일 오류

```bash
# Prisma 클라이언트 재생성
npx prisma generate
```

---

## ✅ 체크리스트

### Week 1
- [ ] Unihan.zip 다운로드
- [ ] unihan-strokes.json 생성
- [ ] stroke-element.ts 테스트 통과
- [ ] DB 마이그레이션 완료
- [ ] 8,000자 이상 매칭 확인

### Week 2
- [ ] SajuCalculator 기본 동작 확인
- [ ] 알려진 사주로 검증
- [ ] 오행 카운트 정확성 확인
- [ ] 용신 결정 로직 검증

---

**🎉 완료되면 바로 작명 서비스에 적용 가능합니다!**
