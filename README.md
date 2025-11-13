# 사주 기반 AI 작명 플랫폼 v2.0

[![Production](https://img.shields.io/badge/Production-Live-green)](https://saju-naming.one-q.xyz/)
[![Last Deploy](https://img.shields.io/badge/Last%20Deploy-2025--11--13-blue)]()
[![Node](https://img.shields.io/badge/Node-18+-green)]()

## 🎯 프로젝트 개요

사주팔자 기반 한국형 작명 서비스 플랫폼입니다. 고급 점수 알고리즘, 부적절 한자 필터링, 프리미엄 기능을 제공합니다.

**프로덕션 URL**: https://saju-naming.one-q.xyz/

## 🚀 주요 기능

### 1. 고급 이름 점수 시스템 (2025-11-13 업데이트)
- **용신 중심 차별화**: 60% 가중치로 사주 적합도 극대화
- **엄격한 보너스 시스템**: 3가지 조건 모두 충족 시 +5점
- **점수 범위**: 80-100점 (넓은 분포로 명확한 품질 차이)
- **실시간 필터링**: 부적절 한자 12종 완전 차단

### 2. 사주팔자 분석 엔진
- 사주팔자 계산 (오행, 용신/기신)
- 한자 의미와 획수 분석
- 음양오행 균형 평가 (≥90점 기준)
- 부모 가치 연계 분석 (≥80점 기준)

### 3. 부적절 한자 필터링
- **명시적 차단**: 愚(어리석음), 滯(막힘), 重(무거움), 尤(허물), 蹲(쭈그리다), 薯(고구마), 猶(같을), 雖(비록), 猢(원숭이), 鵞(거위) 등
- **의미 기반 필터**: 부정적 키워드 자동 감지
- **Early Filtering**: 점수 계산 전 사전 차단

### 4. OAuth 에러 핸들링 (2025-11-13 업데이트)
- 설정 누락 시 친절한 한글 안내 (500 에러 방지)
- Kakao/Google/Naver 로그인 통합 지원
- React Hydration 에러 해결

### 5. 프리미엄 기능
- 프리미엄: 3개 무료 + 97개 유료 (₩69,000)
- 개명: 전문가 분석 + 추천 (₩169,000)
- TossPayments 결제 연동
- PDF 리포트 다운로드

## 📦 기술 스택

### Frontend
- **Framework**: Remix (React SSR)
- **Styling**: TailwindCSS
- **Animation**: Framer Motion
- **State**: Zustand
- **UI Components**: Radix UI
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express + Socket.IO
- **Database**: Prisma + SQLite/PostgreSQL
- **Cache/Queue**: Redis
- **AI**: OpenAI API

### DevOps
- **Build**: Vite
- **Testing**: Vitest
- **Container**: Docker Compose
- **Monitoring**: Redis Commander

## 🛠️ 설치 및 실행

### 사전 요구사항
- Node.js 18+
- Redis 7+
- Docker & Docker Compose (선택사항)

### 1. 의존성 설치

```bash
npm install

# 테스트 패키지 추가 설치
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 필요한 값들을 설정하세요
```

### 3. Redis 실행 (Docker)

```bash
docker-compose up -d redis
```

또는 로컬 Redis 실행:
```bash
redis-server
```

### 4. 데이터베이스 설정

```bash
npx prisma generate
npx prisma db push
```

### 5. 개발 서버 실행

```bash
# 모든 서비스 동시 실행
npm run dev:all

# 또는 개별 실행
npm run dev        # Remix 개발 서버 (포트 3000)
npm run dev:socket # Socket.IO 서버 (포트 3001)
```

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# Socket.IO 통합 테스트
npm run test:socket

# 테스트 커버리지
npm run test:coverage

# UI 테스트 러너
npm run test:ui
```

## 📱 모바일 최적화 모드

배터리 상태에 따라 자동으로 최적화 모드가 전환됩니다:

- **충전 중**: 최적 성능 모드
- **일반 (>20%)**: 균형 모드
- **저전력 (≤20%)**: 절전 모드
- **긴급 (≤10%)**: 최소 기능 모드

## 🔄 실시간 기능 아키텍처

```
Client (Zustand + Socket.IO)
    ↓↑
Socket.IO Server (Port 3001)
    ↓↑
Redis (Queue + Pub/Sub)
    ↓↑
Naming Handler + Queue Processor
```

## 📊 대기열 시스템

- **처리 용량**: 동시 5개 요청 (조정 가능)
- **평균 처리 시간**: 30초
- **우선순위**: 프리미엄 사용자 우선 처리
- **자동 정리**: 1시간마다 오래된 항목 제거

## 🚢 프로덕션 배포

### 서버 정보
- **서버**: 141.164.60.51
- **프로젝트 경로**: `/var/www/saju`
- **프로세스 관리**: PM2 (saju-naming)
- **포트**: 10281

### 배포 프로세스

#### 1. 로컬에서 변경사항 Push
```bash
git add .
git commit -m "feat: 설명"
git push origin main
```

#### 2. 서버 접속 및 배포
```bash
# SSH 접속
ssh root@141.164.60.51

# 프로젝트 디렉토리 이동
cd /var/www/saju

# 배포 스크립트 실행 (권장)
./deploy.sh

# 또는 수동 배포
git pull origin main
npm install
npm run build
pm2 restart saju-naming
pm2 logs saju-naming --lines 50
```

#### 3. 배포 확인
```bash
# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs saju-naming --lines 100

# 웹사이트 확인
curl https://saju-naming.one-q.xyz/
```

### 환경 변수 설정 (서버)

프로덕션 서버에서 `.env.production` 파일 필요:
```bash
# 데이터베이스
DATABASE_URL=postgresql://...

# Redis (옵션)
REDIS_URL=redis://...

# OAuth (현재 미설정 - 에러 핸들링됨)
KAKAO_CLIENT_ID=your_kakao_client_id
GOOGLE_CLIENT_ID=your_google_client_id
NAVER_CLIENT_ID=your_naver_client_id

# TossPayments
TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...
```

## 📝 API 문서

### Socket.IO 이벤트

#### Naming Namespace (`/naming`)

**Client → Server:**
- `naming:start` - 작명 시작 요청
- `naming:cancel` - 작명 취소

**Server → Client:**
- `naming:started` - 작명 시작 확인
- `naming:progress` - 진행상황 업데이트
- `naming:complete` - 작명 완료
- `naming:error` - 오류 발생

#### Queue Namespace (`/queue`)

**Client → Server:**
- `queue:join` - 대기열 참가
- `queue:leave` - 대기열 이탈
- `queue:status` - 상태 조회

**Server → Client:**
- `queue:joined` - 참가 확인
- `queue:status` - 현재 상태
- `queue:ready` - 처리 준비 완료
- `queue:processing` - 처리 시작

## 🔐 보안 고려사항

- Rate Limiting 적용
- Redis 비밀번호 설정
- CORS 정책 설정
- Socket.IO 인증 미들웨어
- 환경 변수 암호화

## 📈 성능 최적화

- 코드 스플리팅 (Vite)
- 이미지 최적화
- Redis 캐싱
- Socket.IO 압축
- 번들 크기 최적화

## 🤝 기여 가이드

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License.

## 🙏 감사의 글

- OpenAI for GPT API
- Remix team for the amazing framework
- Socket.IO for real-time capabilities
- Redis for queue management

---

**Version**: 2.0.0  
**Last Updated**: 2025-08-14  
**Author**: 사주작명 팀