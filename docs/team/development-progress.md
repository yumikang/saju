# 사주 작명 서비스 개발 진행 문서

## 📅 개발 일자: 2025-01-15

## 🎯 프로젝트 개요
사주 기반 AI 작명 서비스로 퀵생성(100만원), 전문가 상담(100만원), 그룹 상담(10-30만원) 서비스 제공

## 🛠 기술 스택
- **프레임워크**: Remix
- **UI 라이브러리**: Shadcn/UI
- **스타일링**: Tailwind CSS
- **상태관리**: Zustand
- **애니메이션**: Framer Motion
- **차트**: Chart.js
- **문서화**: Storybook

## 📋 완료된 작업 목록

### 1. 기본 설정 및 라이브러리 설치
- [x] Shadcn/UI 설치 및 기본 컴포넌트 셋업
- [x] Tailwind CSS 설정
- [x] 컴포넌트 유틸리티 함수 (`cn`) 구현

### 2. UI 컴포넌트 구축
- [x] **Button**: 다양한 변형 지원 (default, destructive, outline 등)
- [x] **Toast**: 알림 시스템 구현
- [x] **Card**: 카드 레이아웃 컴포넌트
- [x] **Table**: 데이터 테이블 컴포넌트

### 3. Toast 시스템
- [x] `useToast` 훅 구현
- [x] `Toaster` 컴포넌트 구현
- [x] 자동 dismiss 기능

### 4. Storybook 설정
- [x] Vite 기반 Storybook 설치
- [x] 기본 설정 완료

### 5. 디자인 시스템
- [x] **폰트**: Pretendard 한글 폰트 적용
- [x] **색상 팔레트**:
  - Primary, Secondary, Success, Danger, Warning 색상
  - 사주 특화 색상 (목, 화, 토, 금, 수)
  - 음양 색상
- [x] **애니메이션**: 키프레임 및 이징 함수 정의

### 6. 상태관리 (Zustand)
- [x] **useNamingStore**: 작명 데이터 관리
  - 작명 추가/수정
  - 통계 계산
- [x] **useCouponStore**: 쿠폰 시스템
  - 쿠폰 검증
  - 할인 계산

### 7. 퀵생성 서비스 UI
- [x] **AnimatedLoader**: 단계별 애니메이션 로더
  - 사주 분석 → 획수 계산 → 이름 생성
  - 오행 요소 회전 애니메이션
  - 진행률 표시
- [x] **QuickNamingFlow**: 퀵생성 플로우 UI
  - 타임세일 가격 표시 (100만원 → 70만원)
  - 3초 완성 강조

### 8. 전문가 서비스 UI
- [x] **PricingCards**: 가격 티어 카드
  - 프리미엄 1:1 (100만원 → 80만원)
  - 그룹 10명 (10만원)
  - 그룹 5명 (20만원)
  - 그룹 3명 (30만원)
- [x] **ExpertConsultation**: 전문가 상담 메인 UI
  - 서비스 특징 카드
  - 가격 선택 인터페이스

### 9. 관리자 패널
- [x] **AdminDashboard**: 관리자 대시보드
  - 통계 카드 (매출, 사용자, 작명 건수, 평균 결제액)
  - 월별 매출 차트 (Line Chart)
  - 서비스별 이용 통계 (Bar Chart)
  - 최근 작명 리스트 테이블

### 10. 통계 및 분석
- [x] Chart.js 설치 및 설정
- [x] 반응형 차트 구현
- [x] 한국어 날짜 포맷 (date-fns)

## 📁 프로젝트 구조

```
saju/
├── app/
│   ├── components/
│   │   ├── ui/                    # Shadcn/UI 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── card.tsx
│   │   │   └── table.tsx
│   │   ├── quick-naming/          # 퀵생성 컴포넌트
│   │   │   ├── AnimatedLoader.tsx
│   │   │   └── QuickNamingFlow.tsx
│   │   ├── expert/                # 전문가 서비스 컴포넌트
│   │   │   ├── PricingCards.tsx
│   │   │   └── ExpertConsultation.tsx
│   │   └── admin/                 # 관리자 컴포넌트
│   │       └── AdminDashboard.tsx
│   ├── hooks/
│   │   └── use-toast.ts          # Toast 훅
│   ├── lib/
│   │   └── utils.ts              # 유틸리티 함수
│   ├── stores/                   # Zustand 스토어
│   │   ├── useNamingStore.ts
│   │   └── useCouponStore.ts
│   ├── styles/
│   │   └── themes/
│   │       ├── colors.ts         # 색상 정의
│   │       └── animations.ts     # 애니메이션 정의
│   └── globals.css               # 전역 스타일
├── components.json               # Shadcn/UI 설정
└── docs/
    └── development-progress.md   # 개발 진행 문서
```

## 🔧 주요 기능 구현 상세

### 1. 타임세일 쿠폰 시스템
- TIMESALE30: 퀵생성 30% 할인
- EXPERT20: 전문가 상담 20% 할인
- 자동 유효기간 검증
- 사용 횟수 제한

### 2. 애니메이션 시스템
- Framer Motion 기반 부드러운 전환
- 오행 요소 회전 애니메이션
- 단계별 진행 시각화
- 로딩 상태 표시

### 3. 가격 체계
```typescript
const pricing = {
  quick: {
    original: 1000000,
    discounted: 700000,  // 30% 할인
    duration: "3초"
  },
  expert: {
    original: 1000000,
    discounted: 800000,  // 20% 할인
    duration: "48시간"
  },
  group: [
    { price: 100000, participants: 10 },  // 1인당 10,000원
    { price: 200000, participants: 5 },   // 1인당 40,000원
    { price: 300000, participants: 3 }    // 1인당 100,000원
  ]
}
```

## 🚀 다음 단계 계획

### 1. 라우팅 설정
- [ ] Remix 라우트 구조 설계
- [ ] 페이지별 라우트 생성
- [ ] 네비게이션 구현

### 2. 결제 시스템
- [ ] 토스페이먼츠 연동
- [ ] 결제 플로우 구현
- [ ] 결제 확인 페이지

### 3. AI 작명 로직
- [ ] OpenAI API 연동
- [ ] 사주 분석 알고리즘
- [ ] 이름 생성 로직

### 4. 인증 시스템
- [ ] 회원가입/로그인
- [ ] 소셜 로그인
- [ ] 관리자 권한

### 5. 데이터베이스
- [ ] PostgreSQL 설정
- [ ] Prisma ORM 설정
- [ ] 데이터 모델 설계

## 📝 참고사항
- 모든 가격은 원화(₩) 기준
- 한글 폰트 Pretendard 사용
- 반응형 디자인 적용
- 다크모드 지원 준비

## 🔗 관련 링크
- [Shadcn/UI 문서](https://ui.shadcn.com/)
- [Remix 문서](https://remix.run/docs)
- [Zustand 문서](https://github.com/pmndrs/zustand)