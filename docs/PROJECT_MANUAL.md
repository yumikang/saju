# 사주 기반 AI 작명 서비스 프로젝트 메뉴얼

## 📌 프로젝트 개요

전통 사주명리학과 AI 기술을 결합한 작명 서비스입니다. 사용자의 생년월일시를 바탕으로 사주를 분석하고, 부족한 오행을 보완하는 최적의 이름을 추천합니다.

## 🏗 기술 스택

- **프레임워크**: Remix v2.16.8 (Vite 빌드)
- **언어**: TypeScript
- **UI 라이브러리**: Shadcn/UI (Radix UI 기반)
- **스타일링**: Tailwind CSS v3
- **상태관리**: Zustand
- **애니메이션**: Framer Motion
- **차트**: Chart.js + react-chartjs-2
- **폰트**: Pretendard (한글 폰트)
- **문서화**: Storybook

## 📁 프로젝트 구조

```
saju/
├── app/
│   ├── components/           # 컴포넌트
│   │   ├── ui/              # Shadcn/UI 기본 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── table.tsx
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx   # 헤더 (네비게이션)
│   │   │   └── Footer.tsx   # 푸터
│   │   ├── quick-naming/    # 퀵생성 관련 컴포넌트
│   │   │   ├── AnimatedLoader.tsx
│   │   │   └── QuickNamingFlow.tsx
│   │   ├── expert/          # 전문가 서비스 컴포넌트
│   │   │   ├── ExpertConsultation.tsx
│   │   │   └── PricingCards.tsx
│   │   └── admin/           # 관리자 컴포넌트
│   │       └── AdminDashboard.tsx
│   ├── routes/              # 페이지 라우트
│   │   ├── _index.tsx       # 메인페이지
│   │   ├── quick.tsx        # AI 퀵생성
│   │   ├── expert.tsx       # 전문가 상담
│   │   └── group.tsx        # 그룹 상담
│   ├── stores/              # Zustand 스토어
│   │   ├── useNamingStore.ts
│   │   └── useCouponStore.ts
│   ├── styles/              # 스타일 관련
│   │   └── themes/
│   │       ├── colors.ts    # 색상 팔레트
│   │       └── animations.ts # 애니메이션 정의
│   ├── hooks/               # 커스텀 훅
│   │   └── use-toast.ts
│   ├── lib/                 # 유틸리티
│   │   └── utils.ts
│   ├── globals.css          # 전역 스타일
│   └── root.tsx             # 루트 레이아웃
├── docs/                    # 문서
├── stories/                 # Storybook 스토리
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── tsconfig.json
```

## 🚀 시작하기

### 1. 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

기본 포트는 3000번이며, 사용 중인 경우 자동으로 다른 포트가 할당됩니다.

### 3. 빌드

```bash
npm run build
```

### 4. Storybook 실행

```bash
npm run storybook
```

## 💡 주요 기능

### 1. AI 퀵생성 서비스 (/quick)

4단계 프로세스로 구성:

1. **정보입력**
   - 성씨
   - 성별 (남아/여아)
   - 생년월일
   - 출생시간
   - 부모님이 중요하게 생각하는 가치

2. **사주분석**
   - 오행(목, 화, 토, 금, 수) 분포 계산
   - 부족한 오행 파악
   - 용신 추출

3. **이름추천**
   - AI가 분석한 5개 이름 제시
   - 한자 표기 및 의미 설명
   - 종합 점수 표시

4. **결제 또는 전문가 제안**
   - 결제 (70,000원) → 상세 분석 보고서
   - "다음에 하기" → 전문가 견적 마켓플레이스

### 2. 전문가 견적 시스템

- 사용자가 결제하지 않으면 전문가들이 개별 견적 제안
- 각 전문가별 정보:
  - 이름, 경력, 전문 분야
  - 평점 및 리뷰 수
  - 개별 메시지
  - 견적 가격 (8만원~15만원)
- 마켓플레이스 방식으로 전문가 선택 가능

### 3. 레이아웃 시스템

- **헤더**: 로고, 네비게이션 메뉴, CTA 버튼
- **푸터**: 회사 정보, 서비스 링크, 고객지원
- 모든 페이지에 자동 적용

## 🎨 디자인 시스템

### 색상 팔레트

- **Primary**: Orange (주황색) - 브랜드 컬러
- **Secondary**: 보조 색상
- **사주 특화 색상**:
  - 목(木): 녹색 (#22c55e)
  - 화(火): 빨강 (#ef4444)
  - 토(土): 노랑 (#f59e0b)
  - 금(金): 은색 (#e5e7eb)
  - 수(水): 파랑 (#3b82f6)

### 애니메이션

- Framer Motion을 활용한 부드러운 전환
- 오행 요소 회전 애니메이션
- 단계별 진행 표시 애니메이션

## 📊 상태관리

### useNamingStore

작명 데이터 관리:
- 작명 정보 추가/수정
- 통계 계산 (총 건수, 완료 건수, 매출)

### useCouponStore

쿠폰 시스템 관리:
- 쿠폰 검증
- 할인 계산
- 타임세일 쿠폰 자동 적용

## 🔧 환경 설정

### TypeScript 설정

```json
{
  "paths": {
    "~/*": ["./app/*"]
  }
}
```

### Tailwind CSS 설정

```javascript
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## 📝 스크립트

```json
{
  "scripts": {
    "dev": "remix vite:dev",
    "build": "remix vite:build",
    "start": "remix-serve ./build/server/index.js",
    "typecheck": "tsc",
    "storybook": "storybook dev -p 6006"
  }
}
```

## 🚨 주의사항

1. **saju-naming 폴더**: 별도의 프로젝트가 포함되어 있으므로 git에서 제외됨
2. **포트 충돌**: 개발 서버 실행 시 포트가 사용 중이면 자동으로 다른 포트 할당
3. **CSS 로딩**: Tailwind CSS v3 사용, globals.css에서 폰트 import

## 🔄 업데이트 내역

### 2025-01-15
- 초기 프로젝트 구축
- Remix + Shadcn/UI 기반 구조 설정
- AI 퀵생성 서비스 구현
- 전문가 견적 마켓플레이스 시스템 구현
- 헤더/푸터 레이아웃 적용

## 📞 문의사항

프로젝트 관련 문의사항은 이슈 트래커를 통해 등록해주세요.