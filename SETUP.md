# 사주 프로젝트 설치 가이드

## 설치 완료 사항 (2025-09-09)

### 1. 프로젝트 클론
```bash
git clone git@github.com:yumikang/saju.git
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 데이터베이스 설정
- PostgreSQL 데이터베이스 생성: `saju_db`
- Prisma 마이그레이션 실행 완료

### 4. 환경변수 설정
`.env` 파일 생성 완료 (`.env.example` 기반)

주요 환경변수:
- `DATABASE_URL`: PostgreSQL 연결 정보
- `SESSION_SECRET_USER`: 세션 보안 키 설정

### 5. 개발 서버 실행
```bash
npm run dev
```

## 접속 정보
- 애플리케이션: http://localhost:3001/
- 데이터베이스: PostgreSQL (localhost:5432/saju_db)

## 필요한 추가 설정
- Redis 서버 (선택사항)
- OpenAI API 키 (AI 기능 사용 시)
- Supabase 설정 (인증 기능 사용 시)