# HanjaSelector 컴포넌트 분석 보고서

## 현재 구조 분석

### 1. Props 인터페이스
```typescript
interface HanjaSelectorProps {
  reading: string           // 검색할 한글 읽기
  selectedHanja?: HanjaChar // 선택된 한자
  onSelect: (hanja: HanjaChar) => void // 선택 콜백
  placeholder?: string      // 플레이스홀더 텍스트
  required?: boolean        // 필수 여부
  debounceDelay?: number   // 디바운스 지연 시간
}
```

### 2. 상태 관리
- `isOpen`: 드롭다운 열림/닫힘 상태
- `isComposing`: IME 조합 중 상태
- `fetcher`: Remix의 useFetcher로 API 호출 관리
- `debouncedReading`: 디바운스된 검색어

### 3. API 호출 로직
- **현재 문제점**: 60번 줄에 `isSurname = true`로 하드코딩됨
- 모든 검색이 성씨 모드로만 동작
- sort, limit 파라미터가 하드코딩되어 있지 않음 (서버 기본값 사용)

### 4. 접근성 현황
- **부분 구현**: 
  - `role="combobox"` 적용됨 (119번 줄)
  - `aria-expanded` 속성 있음 (122번 줄)
- **미구현**:
  - `aria-controls` 없음
  - `aria-activedescendant` 없음
  - `role="listbox"`, `role="option"` 없음
  - 키보드 네비게이션 없음
  - 스크린리더 안내 텍스트 없음

### 5. UX 상태 처리
- **구현됨**:
  - 로딩 상태 표시 (89-96번 줄)
  - 에러 상태 표시 (79-86번 줄)
  - 빈 결과 표시 (99-105번 줄)
- **미구현**:
  - 두음법칙 안내 없음
  - 재시도 버튼 없음
  - 최소 로딩 시간 없음

## 개선 필요 사항

### A. Prop 분리 (우선순위: 높음)
- ✅ **필요**: `mode` prop 추가 ('surname' | 'general')
- ✅ **필요**: mode에 따른 API 파라미터 자동 설정
- 현재 60번 줄의 하드코딩된 `isSurname = true` 제거 필요

### B. ARIA/접근성 (우선순위: 높음)
- ✅ **필요**: 완전한 combobox 패턴 구현
- ✅ **필요**: 키보드 네비게이션 (↑/↓/Enter/Esc)
- ✅ **필요**: 스크린리더 지원 강화
- ✅ **필요**: focus 관리 및 `aria-activedescendant`

### C. Empty/Retry UX (우선순위: 중간)
- ✅ **필요**: 두음법칙 안내 메시지
- ✅ **필요**: 네트워크 오류 시 재시도 버튼
- ✅ **필요**: 로딩 최소 시간 (깜빡임 방지)
- ✅ **필요**: exponential backoff 재시도 로직

## 구현 전략

1. **Phase 1**: Mode prop 추가 및 API 파라미터 분리
   - 기존 동작을 유지하면서 점진적 개선
   - 타입 안전성 확보

2. **Phase 2**: 접근성 완전 구현
   - WAI-ARIA 1.2 combobox 패턴 준수
   - 키보드 사용자 완전 지원

3. **Phase 3**: UX 개선
   - 사용자 친화적 메시지
   - 오류 복구 메커니즘

## 테스트 계획

1. **기능 테스트**
   - mode 변경 시 API 파라미터 확인
   - 키보드 네비게이션 동작 확인

2. **접근성 테스트**
   - Lighthouse Accessibility 점수 목표: ≥95
   - axe-core 에러: 0개

3. **UX 테스트**
   - 각 상태별 메시지 표시 확인
   - 재시도 메커니즘 동작 확인