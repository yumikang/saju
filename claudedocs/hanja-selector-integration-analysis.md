# HanjaSelector 통합 분석 보고서

## 분석 일시
2025-10-15

## 분석 범위
HanjaSelector 컴포넌트를 naming.analysis.$id.tsx와 naming._index.tsx 페이지에 통합하기 위한 요구사항 및 구현 방안 분석

---

## 1. API 엔드포인트 분석

### 1.1 API 경로
- **엔드포인트**: `/api/hanja/search`
- **파일 위치**: `/Users/blee/Downloads/saju/saju/app/routes/api.hanja.search.ts`
- **HTTP 메서드**: GET (Remix loader 사용)

### 1.2 요청 파라미터
```typescript
interface SearchParams {
  reading: string        // 필수: 한글 음절 (예: "김", "민", "준")
  surname: string        // 선택: "true" or "false" (기본값: false)
  limit: string          // 선택: 숫자 (기본값: 20, 최대: 50)
  cursor: string         // 선택: 페이지네이션 커서
  sort: string          // 선택: 'popularity' | 'strokes' | 'element'
}
```

### 1.3 응답 형식
```typescript
interface ApiResponse {
  data: HanjaChar[]      // 한자 배열
  pagination: {
    total: number        // 전체 결과 수
    limit: number        // 현재 limit
    cursor?: string      // 다음 페이지 커서
    hasMore: boolean     // 추가 결과 여부
  }
}

// 에러 응답
interface ApiError {
  code: string          // 'MISSING_PARAMETER' | 'INVALID_INPUT' | 'TIMEOUT' | 'INTERNAL_ERROR'
  message: string       // 에러 메시지
  details?: any         // 추가 정보 (개발 환경만)
}
```

### 1.4 API 동작 방식
1. **입력값 검증**: 한글 완성형 문자만 허용 (자음/모음 제외)
2. **두음법칙 처리**: 자동으로 변환 가능한 음절 포함 검색
   - 예: "이" 검색 시 "리"도 함께 검색
3. **캐싱**: Redis 캐시 사용 (존재 시)
4. **정렬 옵션**:
   - `popularity`: nameFrequency + usageFrequency 기준
   - `strokes`: 획수 오름차순
   - `element`: 오행 순서
5. **타임아웃**: 5초

---

## 2. HanjaChar 타입 정의

### 2.1 서버 타입 (hanja-service.server.ts)
```typescript
export interface HanjaChar {
  id: string                      // UUID
  char: string                    // 한자 (예: "金")
  meaning: string                 // 뜻 (예: "쇠, 금")
  strokes: number                 // 획수
  element: Element | null         // 오행 (METAL, WOOD, WATER, FIRE, EARTH)
  koreanReading: string           // 한글 읽기 (예: "김")
  alternativeReadings?: string[]  // 대체 읽기들
  isSurname?: boolean            // 성씨 여부
  priority?: number              // 우선순위 (낮을수록 높음)
  usageFrequency?: number        // 사용 빈도
  nameFrequency?: number         // 작명 빈도
}
```

### 2.2 프론트엔드 타입 (hanja-data.ts - 레거시)
```typescript
export interface HanjaChar {
  char: string      // 한자
  meaning: string   // 뜻
  reading: string   // 읽기
  strokes: number   // 획수
  element?: string  // 오행 (한글: "금", "목", "수", "화", "토")
}
```

### 2.3 타입 불일치 분석
**주요 차이점**:
- 서버: `element: Element | null` (Enum)
- 프론트: `element?: string` (한글 문자열)
- 서버: 추가 필드 (id, koreanReading, alternativeReadings, isSurname, priority, frequencies)

**통합 시 필요한 작업**:
- Element enum과 한글 문자열 간 변환 유틸리티 필요
- 또는 프론트엔드 타입을 서버 타입에 맞춰 업데이트

---

## 3. 데이터베이스 스키마 분석

### 3.1 NamingResult 모델 (현재)
```prisma
model NamingResult {
  id               String     @id @default(uuid())
  userId           String
  sajuDataId       String
  lastName         String     // 성씨 (한글)
  firstName        String     // 이름 (한글)
  fullName         String     // 전체 이름
  lastNameHanja    String?    // 성씨 한자 (문자열)
  firstNameHanja   String?    // 이름 한자 (문자열)
  totalStrokes     Int        // 총 획수
  balanceScore     Float
  soundScore       Float
  meaningScore     Float
  overallScore     Float
  generationMethod String
  aiModel          String?
  aiPrompt         String?
  preferredValues  Json?
  notes            String?
  createdAt        DateTime
  // ... relations
}
```

### 3.2 획수 저장 분석
**현재 상태**:
- ✅ `totalStrokes` 필드 존재 (총 획수)
- ✅ 이미 획수 계산 및 저장 로직 구현됨

**획수 계산 위치**:
- 이름 추천 생성 시: `app/lib/naming-evaluator.ts`
- 수동 입력 시: 프론트엔드에서 계산 필요

**추가 필드 필요 여부**:
- ❌ 불필요: 총 획수만 저장하면 충분
- 개별 한자 획수는 `HanjaDict.strokes`에서 조회 가능
- 필요 시 `firstNameHanja`를 파싱하여 계산 가능

---

## 4. 현재 페이지 구조 분석

### 4.1 naming._index.tsx (1단계: 입력 페이지)
**현재 필드**:
```typescript
- lastName: string     // Input 텍스트 (한글만)
- birthDate: Date      // 달력 선택
- birthTime: string    // 시간 입력
- calendarType: 'solar' | 'lunar'
- gender: 'male' | 'female'
```

**통합 가능성**:
- ✅ 성씨 입력 → HanjaSelector로 대체 가능
- HanjaSelector를 mode='surname'로 사용
- 선택된 한자 → 한글 읽기 자동 입력

### 4.2 naming.analysis.$id.tsx (2단계: 분석 결과)
**현재 필드**:
```typescript
- lastName: string     // Input 텍스트 (URL에서 전달됨)
```

**통합 가능성**:
- ✅ 성씨 입력 → HanjaSelector로 대체 가능
- 1단계에서 이미 선택했다면 표시만

---

## 5. 통합 시나리오 및 구현 방안

### 시나리오 A: 1단계에서만 한자 선택
**장점**:
- 사용자 경험 일관성 (한 번만 선택)
- 구현 간단

**단점**:
- 1단계에서 한자를 선택하지 않으면 2단계에서 다시 선택 필요
- 상태 관리 복잡도 증가 (선택 정보 전달)

**구현 방법**:
1. naming._index.tsx에 HanjaSelector 추가
2. 선택된 한자 정보를 query param 또는 hidden form으로 전달
3. naming.analysis.$id.tsx에서 표시만

### 시나리오 B: 2단계에서만 한자 선택
**장점**:
- 사주 분석 결과를 보고 성씨 한자 선택 (맥락 제공)
- 구현 간단

**단점**:
- 1단계와 2단계 간 일관성 부족

**구현 방법**:
1. naming._index.tsx는 한글만 입력 유지
2. naming.analysis.$id.tsx에 HanjaSelector 추가
3. Form 제출 시 한자 정보 포함

### 시나리오 C: 두 단계 모두 한자 선택 (권장)
**장점**:
- 유연성: 1단계에서 선택 가능, 2단계에서 변경 가능
- 사용자 선택권 최대화

**단점**:
- 구현 복잡도 증가

**구현 방법**:
1. naming._index.tsx:
   - HanjaSelector 추가 (mode='surname')
   - 선택 정보를 query param으로 전달
2. naming.analysis.$id.tsx:
   - URL에서 한자 정보 로드
   - HanjaSelector로 수정 가능하게 표시
   - Form 제출 시 최종 선택 한자 사용

---

## 6. 구현 체크리스트

### 6.1 타입 정의 통일
- [ ] Element enum ↔ 한글 문자열 변환 유틸리티
  ```typescript
  // app/lib/element-utils.ts
  export function elementToKorean(element: Element | null): string | undefined
  export function koreanToElement(korean: string): Element | null
  ```

### 6.2 컴포넌트 수정
- [ ] naming._index.tsx:
  ```typescript
  const [lastNameHanja, setLastNameHanja] = useState<HanjaChar | null>(null)

  <HanjaSelector
    reading={lastName}
    selectedHanja={lastNameHanja}
    onSelect={setLastNameHanja}
    mode="surname"
    required
  />

  // Form 제출 시
  <input type="hidden" name="lastNameChar" value={lastNameHanja?.char} />
  <input type="hidden" name="lastNameStrokes" value={lastNameHanja?.strokes} />
  ```

- [ ] naming.analysis.$id.tsx:
  ```typescript
  // Loader: URL에서 한자 정보 추출
  const url = new URL(request.url)
  const lastNameChar = url.searchParams.get('lastNameChar')
  const lastNameStrokes = url.searchParams.get('lastNameStrokes')

  // Component
  const [lastNameHanja, setLastNameHanja] = useState<HanjaChar | null>(
    initialHanja // loader에서 전달
  )

  <HanjaSelector
    reading={lastName}
    selectedHanja={lastNameHanja}
    onSelect={setLastNameHanja}
    mode="surname"
    required
  />
  ```

### 6.3 API Action 수정
- [ ] naming._index.tsx action:
  ```typescript
  const lastNameChar = formData.get('lastNameChar') as string
  const lastNameStrokes = formData.get('lastNameStrokes') as string

  // Redirect with hanja info
  return redirect(
    `/naming/analysis/${sajuDataId}?` +
    `lastName=${encodeURIComponent(lastName)}` +
    `&lastNameChar=${encodeURIComponent(lastNameChar)}` +
    `&lastNameStrokes=${lastNameStrokes}`
  )
  ```

- [ ] naming.analysis.$id.tsx action:
  ```typescript
  const lastNameChar = formData.get('lastNameChar') as string

  // POST /api/naming/recommend에 한자 정보 포함
  body: JSON.stringify({
    sajuDataId: id,
    lastName,
    lastNameChar,  // 추가
    preferences: { ... }
  })
  ```

### 6.4 백엔드 수정
- [ ] `/api/naming/recommend` 수정:
  - 요청 파라미터에 `lastNameChar` 추가 (선택)
  - 성씨 한자가 있으면 획수 및 오행 정보 활용

- [ ] NamingResult 저장 시:
  - `lastNameHanja` 필드에 한자 저장
  - `totalStrokes`에 총 획수 저장 (기존 로직 유지)

### 6.5 테스트 시나리오
- [ ] 1단계에서 한자 선택 → 2단계에서 표시 확인
- [ ] 1단계에서 선택 안 함 → 2단계에서 선택 가능 확인
- [ ] 2단계에서 한자 변경 → Form 제출 시 변경된 한자 사용 확인
- [ ] API 호출 시 올바른 파라미터 전달 확인
- [ ] 한자 없는 성씨 입력 시 에러 처리 확인

---

## 7. 예상 이슈 및 해결 방안

### 7.1 타입 불일치
**문제**: Element enum vs 한글 문자열
**해결**: 변환 유틸리티 작성
```typescript
// app/lib/element-utils.ts
const ELEMENT_MAP: Record<Element, string> = {
  [Element.METAL]: '금',
  [Element.WOOD]: '목',
  [Element.WATER]: '수',
  [Element.FIRE]: '화',
  [Element.EARTH]: '토',
}

export function elementToKorean(element: Element | null): string | undefined {
  return element ? ELEMENT_MAP[element] : undefined
}

export function koreanToElement(korean: string): Element | null {
  const entry = Object.entries(ELEMENT_MAP).find(([_, k]) => k === korean)
  return entry ? (entry[0] as Element) : null
}
```

### 7.2 상태 관리
**문제**: 두 페이지 간 한자 정보 전달
**해결**: URL query params 사용 (간단하고 명확)

### 7.3 필수 입력 처리
**문제**: 한자를 선택하지 않은 경우
**해결**:
- HanjaSelector에 `required` prop 적용
- Form validation으로 선택 강제
- 또는 한글만으로도 진행 가능하게 설계 (선택)

### 7.4 한자 없는 음절
**문제**: "딸기", "사과" 등 한자가 없는 경우
**해결**:
- API에서 빈 배열 반환
- UI에서 "해당 음절의 한자가 없습니다" 메시지 표시
- 한글만으로 진행 허용

---

## 8. 권장 구현 순서

1. **타입 통일 작업** (30분)
   - element-utils.ts 작성
   - 타입 변환 테스트

2. **naming._index.tsx 수정** (1시간)
   - HanjaSelector 통합
   - Form 데이터 전달 구조 수정
   - 테스트

3. **naming.analysis.$id.tsx 수정** (1시간)
   - Loader에서 한자 정보 로드
   - HanjaSelector 통합
   - Action 수정

4. **백엔드 API 수정** (30분)
   - `/api/naming/recommend` 파라미터 추가
   - NamingResult 저장 로직 확인

5. **통합 테스트** (1시간)
   - E2E 플로우 테스트
   - 엣지 케이스 확인

**예상 총 소요 시간**: 4시간

---

## 9. 최종 결론

### 필요한 코드 변경사항 요약
1. ✅ **API 엔드포인트**: 이미 존재, 추가 작업 불필요
2. ✅ **HanjaChar 타입**: 서버와 프론트 간 변환 유틸리티 필요
3. ✅ **데이터베이스 스키마**: 변경 불필요 (기존 필드 활용)
4. 🔧 **페이지 컴포넌트**: 두 페이지 모두 수정 필요
5. 🔧 **상태 관리**: URL query params로 전달
6. 🔧 **타입 변환**: Element enum ↔ 한글 문자열

### 권장 구현 방식
**시나리오 C (두 단계 모두 한자 선택)** 채택
- 유연성과 사용자 경험 최적화
- 1단계: 선택 가능
- 2단계: 표시 및 수정 가능

### 리스크 평가
- **낮음**: 기존 API 재사용 가능
- **낮음**: 데이터베이스 스키마 변경 불필요
- **중간**: 타입 변환 로직 필요
- **중간**: 상태 전달 구조 설계 필요

---

## 참고 파일 경로
- HanjaSelector: `/Users/blee/Downloads/saju/saju/app/components/ui/hanja-selector.tsx`
- API 엔드포인트: `/Users/blee/Downloads/saju/saju/app/routes/api.hanja.search.ts`
- 타입 정의: `/Users/blee/Downloads/saju/saju/app/lib/hanja-data.ts`
- 서비스 로직: `/Users/blee/Downloads/saju/saju/app/lib/hanja-service.server.ts`
- DB 스키마: `/Users/blee/Downloads/saju/saju/prisma/schema.prisma`
- 1단계 페이지: `/Users/blee/Downloads/saju/saju/app/routes/naming._index.tsx`
- 2단계 페이지: `/Users/blee/Downloads/saju/saju/app/routes/naming.analysis.$id.tsx`
