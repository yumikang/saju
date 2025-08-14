# 사주 기반 AI 작명 플랫폼 v2.0

## 🎯 프로젝트 개요

사주팔자와 AI를 결합한 한국형 작명 서비스 플랫폼입니다. 실시간 작명 프로세스, 대기열 관리, 모바일 최적화 기능을 제공합니다.

## 🚀 주요 기능

### 1. AI 작명 시스템
- OpenAI GPT 기반 지능형 작명
- 사주팔자 분석 (오행, 용신/기신)
- 한자 의미와 획수 분석
- 음양오행 균형 평가

### 2. 실시간 기능 (Socket.IO)
- 실시간 작명 진행상황 표시
- 대기열 관리 시스템
- 양방향 통신으로 즉각적인 피드백

### 3. Redis 기반 대기열 관리
- 공정한 순서 처리 (FIFO)
- 우선순위 큐 지원
- 분산 시스템 대응 가능

### 4. 모바일 배터리 최적화
- Battery Status API 활용
- 적응형 폴링 간격
- 오프라인 메시지 큐잉
- 페이지 가시성 감지

### 5. 반응형 UI/UX
- 모바일 우선 디자인
- Framer Motion 애니메이션
- 터치 최적화 인터페이스
- 프로그레시브 웹 앱 지원

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

### 1. 빌드

```bash
npm run build
```

### 2. 환경 변수 설정

```bash
NODE_ENV=production
REDIS_URL=redis://your-redis-server:6379
# 기타 프로덕션 설정
```

### 3. 서버 실행

```bash
npm start           # Remix 서버
node socket-server.mjs  # Socket.IO 서버
```

### 4. 프로세스 관리 (PM2)

```bash
pm2 start ecosystem.config.js
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