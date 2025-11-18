# Remix 네비게이션 가이드라인

> **중요**: Remix에서 Client Side Routing(CSR)을 유지하기 위한 필수 원칙들

## 🚫 절대 하지 말아야 할 것들

### 1. window.location 사용 금지

```javascript
// ❌ 절대 사용 금지 - 전체 페이지 새로고침 발생
window.location.href = '/naming'
window.location.assign('/naming')
window.location.replace('/naming')
```

**이유**: 전체 페이지가 새로고침되어 Remix의 CSR이 중단됨

### 2. 일반 a 태그로 내부 링크 만들기 금지

```html
<!-- ❌ 절대 사용 금지 (내부 링크인 경우) -->
<a href="/naming">작명 서비스</a>
<a href="/renaming" onclick="handleClick()">개명 서비스</a>
```

**예외**: 외부 링크나 새 탭에서 열기만 허용
```html
<!-- ✅ 외부 링크는 OK -->
<a href="https://google.com" target="_blank">구글</a>
```

### 3. form의 기본 submit으로 페이지 이동 금지

```html
<!-- ❌ 절대 사용 금지 -->
<form action="/naming" method="get">
  <button type="submit">이동</button>
</form>
```

## ✅ Remix에서 올바른 네비게이션 방법

### 1. Link 컴포넌트 사용 (가장 기본적이고 권장)

```tsx
import { Link } from "@remix-run/react"

// ✅ 기본 링크
<Link to="/naming">작명 서비스</Link>

// ✅ 버튼을 Link로 감싸기
<Link to="/naming">
  <Button>서비스 선택</Button>
</Link>

// ✅ 스타일링도 가능
<Link 
  to="/naming" 
  className="text-blue-500 hover:text-blue-700"
>
  작명 서비스
</Link>
```

### 2. useNavigate 훅 사용 (프로그래매틱 네비게이션)

```tsx
import { useNavigate } from "@remix-run/react"

function MyComponent() {
  const navigate = useNavigate()
  
  const handleClick = () => {
    // 조건부 로직 후 네비게이션
    if (userLoggedIn) {
      navigate("/naming")
    } else {
      navigate("/login")
    }
  }
  
  const handleSubmit = async () => {
    // API 호출 후 네비게이션
    await saveData()
    navigate("/success")
  }
  
  return (
    <div>
      <button onClick={handleClick}>조건부 이동</button>
      <button onClick={handleSubmit}>저장 후 이동</button>
    </div>
  )
}
```

### 3. Form 컴포넌트 사용 (데이터 전송과 함께)

```tsx
import { Form } from "@remix-run/react"

// ✅ 검색이나 필터링
<Form method="get" action="/search">
  <input name="q" placeholder="검색어" />
  <button type="submit">검색</button>
</Form>

// ✅ 데이터 제출
<Form method="post" action="/contact">
  <input name="email" type="email" />
  <button type="submit">제출</button>
</Form>
```

## 🔍 디버깅 시 주의사항

### ❌ 디버깅용이라도 피해야 할 코드

```tsx
// ❌ 임시로라도 사용 금지
window.location.href = '/test'
document.location = '/test'

// ❌ 디버그 로그도 프로덕션 전에 제거
console.log("테스트용 - 삭제 예정")

// ❌ TODO 주석과 함께 남겨진 임시 코드
// TODO: 임시 코드 - 나중에 삭제
onClick={() => window.location.href = '/temp'}
```

### ✅ 디버깅용 올바른 방법

```tsx
// ✅ 디버깅용으로도 Link 사용
<Link to="/test" className="debug-link bg-yellow-200">
  🔧 테스트 페이지
</Link>

// ✅ 조건부 디버그 네비게이션
const navigate = useNavigate()
const debugNavigation = () => {
  if (process.env.NODE_ENV === 'development') {
    navigate('/debug')
  }
}

// ✅ 개발 환경에서만 보이는 디버그 컴포넌트
{process.env.NODE_ENV === 'development' && (
  <div className="fixed top-0 right-0 p-4 bg-yellow-100">
    <Link to="/debug">디버그</Link>
  </div>
)}
```

## 🛠️ 실전 체크리스트

### 코드 리뷰 시 확인사항

- [ ] `window.location` 사용하는 코드가 있는가?
- [ ] 내부 링크에 `<a href="">` 사용하는가?
- [ ] 모든 네비게이션이 `<Link>` 또는 `useNavigate()` 사용하는가?
- [ ] 디버깅용 임시 코드가 남아있는가?
- [ ] `console.log` 등 개발용 코드가 프로덕션에 포함되는가?

### 파일별 점검 포인트

#### components/layout/Header.tsx
```tsx
// ✅ 올바른 헤더 네비게이션
<nav>
  <Link to="/">홈</Link>
  <Link to="/naming">작명</Link>
  <Link to="/renaming">개명</Link>
</nav>
```

#### routes/*.tsx
```tsx
// ✅ 페이지 내 네비게이션
export default function SomePage() {
  const navigate = useNavigate()
  
  return (
    <div>
      <Link to="/back">뒤로가기</Link>
      <button onClick={() => navigate('/next')}>
        다음 단계
      </button>
    </div>
  )
}
```

## 🚨 에러 해결 가이드

### "네비게이션이 안 됩니다"
1. `window.location` 사용 여부 확인
2. `<a href="">` 사용 여부 확인  
3. 개발자 도구에서 JavaScript 에러 확인
4. 네트워크 탭에서 전체 페이지 로드 여부 확인

### "페이지가 새로고침됩니다"
- Remix CSR이 중단된 상황
- 위의 금지 사항들을 사용했을 가능성 높음
- 모든 네비게이션을 `<Link>` 컴포넌트로 교체

## 📋 ESLint 규칙 (선택사항)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.object.name='window'][callee.property.name='location']",
        message: "window.location.* 사용 금지 – Remix에서는 useNavigate 또는 <Link>를 사용하세요."
      }
    ],
    "no-restricted-globals": [
      "error",
      {
        name: "location",
        message: "location 전역 객체 사용 금지 – useLocation 훅을 사용하세요."
      }
    ]
  }
}
```

---

## 💡 기억하세요!

> **Remix = Single Page Application (SPA)**  
> 모든 네비게이션은 JavaScript로 처리되어야 합니다.  
> 전체 페이지 새로고침은 성능 저하와 상태 손실을 일으킵니다.

**원칙**: *의심스러우면 `<Link>` 컴포넌트 사용하기* ✨