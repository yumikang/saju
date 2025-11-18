# 팀원 온보딩 가이드

> 사주 기반 AI 작명 플랫폼 개발팀에 오신 것을 환영합니다!

## 📋 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [개발 환경 설정](#개발-환경-설정)
3. [프로젝트 구조](#프로젝트-구조)
4. [핵심 개념](#핵심-개념)
5. [개발 워크플로우](#개발-워크플로우)
6. [배포 가이드](#배포-가이드)
7. [문제 해결](#문제-해결)
8. [연락처](#연락처)

---

## 프로젝트 소개

### 개요
사주팔자를 기반으로 한국 전통 작명법과 AI를 결합한 작명 플랫폼입니다.

**프로덕션 URL**: https://saju-naming.one-q.xyz/

### 핵심 기능
- 🎯 사주팔자 기반 이름 추천 (용신 60% 가중치)
- 🛡️ 부적절 한자 자동 필터링 (12종 완전 차단)
- 💳 프리미엄/개명 서비스 (TossPayments 연동)
- ⚡ 실시간 처리 (Socket.IO + Redis Queue)
- 📊 고급 점수 알고리즘 (80-100점 분포)

### 기술 스택
- **Frontend**: Remix (React SSR), TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Prisma, PostgreSQL (production), SQLite (dev)
- **Infrastructure**: Redis, Docker, PM2

---

## 개발 환경 설정

### 1️⃣ 사전 요구사항

```bash
# Node.js 18 이상
node -v  # v18.x.x 이상

# npm
npm -v   # 9.x.x 이상

# Git
git --version

# (선택) Docker
docker --version
```

### 2️⃣ 저장소 클론

```bash
# HTTPS
git clone https://github.com/yumikang/saju.git

# SSH (권장)
git clone git@github.com:yumikang/saju.git

cd saju
```

### 3️⃣ 의존성 설치

```bash
npm install
```

### 4️⃣ 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

**필수 환경 변수** (`.env`):
```bash
# 데이터베이스 (개발용 SQLite)
DATABASE_URL="file:./dev.db"

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Redis (선택 - 로컬 개발 시)
REDIS_URL=redis://localhost:6379

# TossPayments (선택 - 결제 테스트 시)
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# OAuth (선택 - 소셜 로그인 테스트 시)
KAKAO_CLIENT_ID=your_kakao_id
KAKAO_CLIENT_SECRET=your_kakao_secret
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
NAVER_CLIENT_ID=your_naver_id
NAVER_CLIENT_SECRET=your_naver_secret
```

### 5️⃣ 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 적용
npx prisma db push

# (선택) 데이터베이스 시드
npx prisma db seed
```

### 6️⃣ Redis 실행 (선택)

**Docker 사용**:
```bash
docker-compose up -d redis
```

**로컬 설치**:
```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### 7️⃣ 개발 서버 실행

```bash
# 모든 서비스 동시 실행 (Remix + Socket.IO)
npm run dev:all

# 또는 개별 실행
npm run dev        # Remix 개발 서버 (http://localhost:3000)
npm run dev:socket # Socket.IO 서버 (http://localhost:3001)
```

**성공 확인**:
- 브라우저에서 http://localhost:3000 접속
- 작명 프로세스 테스트 (성/생년월일/성별 입력)

---

## 프로젝트 구조

```
saju/
├── app/                          # Remix 애플리케이션
│   ├── components/               # React 컴포넌트
│   │   ├── naming/              # 작명 관련 컴포넌트
│   │   ├── renaming/            # 개명 관련 컴포넌트
│   │   └── ui/                  # 공통 UI 컴포넌트
│   ├── lib/                     # 핵심 비즈니스 로직
│   │   ├── naming/              # 작명 알고리즘
│   │   │   ├── pipeline/        # 작명 파이프라인
│   │   │   ├── scorers/         # 점수 계산 로직
│   │   │   ├── filters/         # 필터링 규칙
│   │   │   └── types/           # TypeScript 타입
│   │   ├── saju/                # 사주팔자 계산
│   │   ├── hanja-service.server.ts  # 한자 서비스
│   │   └── korean-surnames.data.ts  # 한국 성씨 데이터
│   ├── routes/                  # Remix 라우트
│   │   ├── api/                 # API 엔드포인트
│   │   ├── auth/                # 인증 관련
│   │   └── *.tsx                # 페이지 라우트
│   └── utils/                   # 유틸리티 함수
├── prisma/                      # Prisma ORM
│   ├── schema.prisma           # 데이터베이스 스키마
│   └── migrations/             # 마이그레이션 파일
├── socket-server/              # Socket.IO 서버
│   ├── index.ts                # 서버 진입점
│   ├── naming-handler.ts       # 작명 핸들러
│   └── queue.ts                # Redis 큐 관리
├── scripts/                    # 유틸리티 스크립트
├── claudedocs/                 # AI 어시스턴트 문서
├── public/                     # 정적 파일
└── tests/                      # 테스트 파일
```

### 주요 파일 설명

| 파일 | 역할 |
|-----|------|
| `app/lib/naming/pipeline/naming-pipeline.ts` | 이름 생성 및 점수 계산 파이프라인 |
| `app/lib/naming/scorers/scoring-pipeline.ts` | 점수 계산 로직 (용신 60% 적용) |
| `app/lib/naming/filters/taboo-rules.ts` | 부적절 한자 차단 규칙 (12종) |
| `app/lib/saju/calculator.ts` | 사주팔자 계산 엔진 |
| `app/lib/hanja-service.server.ts` | 한자 데이터베이스 조회 |
| `socket-server/naming-handler.ts` | 실시간 작명 처리 |
| `prisma/schema.prisma` | 데이터베이스 모델 정의 |

---

## 핵심 개념

### 1. 사주팔자 (四柱八字)

출생 년월일시를 기반으로 운명을 파악하는 한국 전통 명리학.

**주요 요소**:
- **오행 (五行)**: WOOD, FIRE, EARTH, METAL, WATER
- **용신 (用神)**: 사주에 도움이 되는 오행 (Beneficial Element)
- **기신 (忌神)**: 사주에 해로운 오행 (Harmful Element)

**코드 위치**: `app/lib/saju/calculator.ts`

### 2. 점수 계산 시스템

**가중치 (2025-11-13 업데이트)**:
```typescript
{
  yongsin: 0.60,      // 용신 적합도 60%
  yinyang: 0.10,      // 음양 균형 10%
  pronunciation: 0.10, // 발음 품질 10%
  meaning: 0.10       // 의미 품질 10%
}
```

**보너스 조건**:
- 음양오행 점수 ≥ 90점
- 발음 품질 점수 ≥ 90점
- 의미 품질 점수 ≥ 80점
- **모두 충족 시 +5점 추가**

**점수 범위**: 80-100점

**코드 위치**: `app/lib/naming/scorers/scoring-pipeline.ts`

### 3. 부적절 한자 필터링

**12개 명시적 차단 한자**:
```typescript
// app/lib/naming/filters/taboo-rules.ts
const EXPLICIT_TABOO_CHARACTERS = [
  { character: '愚', reason: '어리석음' },
  { character: '滯', reason: '막힘, 정체' },
  { character: '重', reason: '무거움' },
  { character: '尤', reason: '허물, 원망' },
  { character: '蹲', reason: '쭈그리다' },
  { character: '薯', reason: '고구마' },
  { character: '猶', reason: '같을' },
  { character: '雖', reason: '비록' },
  { character: '猢', reason: '원숭이' },
  { character: '鵞', reason: '거위' },
  // ... 2개 더
];
```

**Early Filtering**: 점수 계산 전 즉시 차단
**코드 위치**: `app/lib/naming/pipeline/naming-pipeline.ts` (L560-576)

### 4. 실시간 처리 아키텍처

```
User Request
    ↓
Remix Route (API)
    ↓
Socket.IO Emit
    ↓
Redis Queue (선택적)
    ↓
Naming Handler
    ↓
Pipeline Processing
    ↓
Socket.IO Response
    ↓
Real-time UI Update
```

---

## 개발 워크플로우

### Git 브랜치 전략

```bash
main           # 프로덕션 배포 브랜치
  ├── develop  # 개발 통합 브랜치
  └── feature/* # 기능 개발 브랜치
```

### 기능 개발 프로세스

#### 1. 브랜치 생성
```bash
# main에서 최신 코드 받기
git checkout main
git pull origin main

# 기능 브랜치 생성
git checkout -b feature/your-feature-name
```

#### 2. 개발 및 테스트
```bash
# 코드 작성
# ...

# 테스트 실행
npm test

# 타입 체크
npm run typecheck

# 린트 체크
npm run lint
```

#### 3. 커밋
```bash
git add .
git commit -m "feat: 기능 설명"

# 커밋 메시지 컨벤션
# feat: 새로운 기능
# fix: 버그 수정
# docs: 문서 수정
# style: 코드 포맷팅
# refactor: 코드 리팩토링
# test: 테스트 추가/수정
# chore: 빌드/설정 변경
```

#### 4. Push 및 Pull Request
```bash
git push origin feature/your-feature-name

# GitHub에서 Pull Request 생성
# 리뷰어 지정 및 설명 작성
```

### 코드 리뷰 가이드

**리뷰어 체크리스트**:
- [ ] 코드가 프로젝트 스타일 가이드를 따르는가?
- [ ] 비즈니스 로직이 올바른가?
- [ ] 에지 케이스가 처리되는가?
- [ ] 테스트가 충분한가?
- [ ] 성능 이슈가 없는가?
- [ ] 보안 취약점이 없는가?

---

## 배포 가이드

### 프로덕션 정보

**서버**: 141.164.60.51
**경로**: /var/www/saju
**프로세스**: PM2 (saju-naming)
**포트**: 10281
**URL**: https://saju-naming.one-q.xyz/

### 배포 프로세스

#### 1단계: 로컬에서 준비

```bash
# 최신 코드로 업데이트
git checkout main
git pull origin main

# 테스트 실행
npm test

# 빌드 테스트
npm run build

# 변경사항 확인
git log --oneline -5
```

#### 2단계: 서버 접속

```bash
# SSH 접속 (비밀번호 또는 SSH 키 필요)
ssh root@141.164.60.51

# 프로젝트 디렉토리로 이동
cd /var/www/saju
```

#### 3단계: 배포 실행

**방법 1: 자동 배포 스크립트 (권장)**
```bash
./deploy.sh
```

**방법 2: 수동 배포**
```bash
# 최신 코드 받기
git pull origin main

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# PM2 재시작
pm2 restart saju-naming

# 로그 확인
pm2 logs saju-naming --lines 50
```

#### 4단계: 배포 검증

```bash
# PM2 상태 확인
pm2 status

# 프로세스 로그 확인
pm2 logs saju-naming --lines 100

# 서버 응답 확인
curl https://saju-naming.one-q.xyz/

# 또는 브라우저에서 직접 확인
```

### 롤백 방법

```bash
# SSH 접속
ssh root@141.164.60.51
cd /var/www/saju

# 이전 커밋으로 롤백
git log --oneline -10  # 커밋 해시 확인
git checkout <commit-hash>

# 재배포
npm install
npm run build
pm2 restart saju-naming
```

### 환경 변수 관리

프로덕션 서버의 `.env.production` 파일:

```bash
# 서버에서 환경 변수 확인
ssh root@141.164.60.51
cd /var/www/saju
cat .env.production  # 보안상 민감한 정보 주의

# 환경 변수 수정 (필요 시)
nano .env.production
pm2 restart saju-naming  # 재시작 필수
```

---

## 문제 해결

### 자주 발생하는 문제

#### 1. Prisma 클라이언트 에러
```bash
Error: @prisma/client did not initialize yet
```

**해결 방법**:
```bash
npx prisma generate
npm run dev
```

#### 2. Redis 연결 실패
```bash
Error: Redis connection failed
```

**해결 방법**:
```bash
# Redis 서버 시작
redis-server

# 또는 Docker
docker-compose up -d redis

# 연결 확인
redis-cli ping  # PONG 응답 확인
```

#### 3. Socket.IO 연결 안됨
```bash
WebSocket connection failed
```

**해결 방법**:
```bash
# Socket.IO 서버 실행 확인
npm run dev:socket

# 포트 3001 사용 중인지 확인
lsof -i :3001
```

#### 4. 빌드 실패
```bash
Error: Build failed with X errors
```

**해결 방법**:
```bash
# TypeScript 타입 체크
npm run typecheck

# 린트 오류 확인
npm run lint

# 의존성 재설치
rm -rf node_modules
npm install
```

#### 5. OAuth 500 에러
```bash
Internal Server Error (500)
```

**해결 방법**:
```bash
# .env 파일에 OAuth 환경변수 확인
echo $KAKAO_CLIENT_ID
echo $KAKAO_CLIENT_SECRET

# 없으면 설정하거나
# 2025-11-13 업데이트로 친절한 에러 메시지 표시됨
```

### 데이터베이스 관련

#### 데이터베이스 리셋
```bash
# 개발 환경에서만!
npx prisma db push --force-reset

# 프로덕션은 마이그레이션 사용
npx prisma migrate deploy
```

#### 데이터베이스 GUI
```bash
# Prisma Studio 실행
npx prisma studio

# http://localhost:5555 에서 확인
```

### 디버깅 팁

#### 1. 로그 확인
```typescript
// 개발 환경에서
console.log('[DEBUG]', data);

// 프로덕션에서
console.error('[ERROR]', error);
```

#### 2. Remix 디버깅
```bash
# 서버 로그 확인
npm run dev  # 터미널에서 직접 확인

# 클라이언트 디버깅
# 브라우저 개발자 도구 → Console 탭
```

#### 3. PM2 로그 (프로덕션)
```bash
# 실시간 로그
pm2 logs saju-naming

# 최근 100줄
pm2 logs saju-naming --lines 100

# 에러 로그만
pm2 logs saju-naming --err
```

---

## 연락처

### 개발팀

**팀 리더**: [이름]
**이메일**: [이메일]
**Slack**: [채널]

### 긴급 연락처

**프로덕션 장애**: [전화번호]
**보안 이슈**: [이메일]

### 리소스

- **GitHub**: https://github.com/yumikang/saju
- **프로덕션**: https://saju-naming.one-q.xyz/
- **문서**: 이 저장소의 README.md, CHANGELOG.md
- **이슈 트래킹**: GitHub Issues

---

## 다음 단계

### 첫 기여하기

1. ✅ 개발 환경 설정 완료
2. 📖 코드베이스 탐색 (주요 파일부터)
3. 🐛 간단한 버그 픽스 또는 문서 개선
4. 💡 팀원에게 코드 리뷰 요청
5. 🚀 첫 Pull Request 생성!

### 추천 학습 경로

1. **Remix 프레임워크**: https://remix.run/docs
2. **Prisma ORM**: https://www.prisma.io/docs
3. **Socket.IO**: https://socket.io/docs/v4/
4. **사주팔자 기초**: `app/lib/saju/calculator.ts` 주석 참고

---

**환영합니다! 궁금한 점이 있으면 언제든지 팀원에게 문의하세요.** 🎉
