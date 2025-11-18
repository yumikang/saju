# 🚀 프로덕션 환경 설정 가이드

Phase 2: 프로덕션 배포를 위한 환경 설정 가이드입니다.

## 📋 사전 준비사항

### 1. TossPayments 계정 설정

#### ① TossPayments 가입
- URL: https://developers.tosspayments.com/
- 사업자 정보 등록
- 계약 체결 및 승인 대기

#### ② API 키 발급
```bash
1. 개발자센터 로그인
2. [내 정보] > [API 키] 메뉴 이동
3. 실제(live) 키 발급 요청

발급되는 키 형식:
- Client Key: live_ck_xxxxxxxxxxxxxxxxxxxxxxxxx
- Secret Key: live_sk_xxxxxxxxxxxxxxxxxxxxxxxxx
```

#### ③ 결제 설정
- 결제 수단: 카드 결제 활성화
- 결제 금액: 69,000원
- 정산 계좌: 사업자 계좌 등록

---

### 2. 프로덕션 데이터베이스 준비

#### PostgreSQL 설정
```bash
# 프로덕션 DB 생성
createdb saju_naming_prod

# 사용자 및 권한 설정
CREATE USER saju_prod_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE saju_naming_prod TO saju_prod_user;
```

#### 연결 문자열 확인
```env
DATABASE_URL="postgresql://saju_prod_user:strong_password_here@host:5432/saju_naming_prod?schema=public"
```

---

### 3. Redis 서버 설정

```bash
# Redis 설치 및 실행 (프로덕션)
# 또는 Redis Cloud 사용 권장: https://redis.com/

# Redis 비밀번호 설정 필수!
redis-cli CONFIG SET requirepass "your_strong_redis_password"
```

---

## ⚙️ 환경 변수 설정

### Step 1: 템플릿 복사

```bash
# 프로덕션 환경 변수 파일 생성
cp .env.production.template .env.production
```

### Step 2: 필수 값 입력

`.env.production` 파일을 열고 다음 값들을 **반드시** 실제 값으로 교체:

```env
# 🔴 CRITICAL: 필수 항목
TOSS_CLIENT_KEY=live_ck_REPLACE_WITH_REAL_CLIENT_KEY
TOSS_SECRET_KEY=live_sk_REPLACE_WITH_REAL_SECRET_KEY
SESSION_SECRET=REPLACE_WITH_STRONG_RANDOM_SECRET  # 최소 32자
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Step 3: SESSION_SECRET 생성

```bash
# 강력한 랜덤 시크릿 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 출력 예시:
# a1b2c3d4e5f6...  (64자 hex 문자열)
```

### Step 4: 환경 변수 검증

```bash
# 환경 변수 검증 스크립트 실행
npm run check-env:production

# 또는 직접 검증
npx tsx scripts/check-env.ts production
```

---

## 🔒 보안 체크리스트

### ✅ 필수 보안 조치

- [ ] `.env.production` 파일이 `.gitignore`에 포함되었는지 확인
- [ ] 모든 API 키가 실제(live) 키로 교체되었는지 확인
- [ ] SESSION_SECRET이 강력한 랜덤 문자열인지 확인 (최소 32자)
- [ ] DATABASE_URL에 강력한 비밀번호 사용
- [ ] REDIS_PASSWORD 설정 완료
- [ ] 프로덕션 서버에서만 .env.production 파일 존재
- [ ] Git 커밋 전 민감 정보 제거 확인

### ⚠️ 보안 권장사항

- [ ] 환경 변수는 서버 환경 변수로 관리 (파일 대신)
- [ ] 정기적인 키 로테이션 (3-6개월)
- [ ] 접근 제어: DB, Redis에 IP 화이트리스트 설정
- [ ] HTTPS 필수 (Let's Encrypt 권장)
- [ ] Rate Limiting 설정 (DDoS 방어)

---

## 📊 배포 전 검증

### 1. 로컬 프로덕션 모드 테스트

```bash
# 프로덕션 모드로 빌드
npm run build

# 프로덕션 모드 실행
NODE_ENV=production npm start

# 테스트 체크리스트:
# - [ ] 서버 정상 시작
# - [ ] DB 연결 성공
# - [ ] Redis 연결 성공
# - [ ] TossPayments 테스트 결제 성공
# - [ ] 모든 페이지 정상 로드
```

### 2. 환경 변수 검증 스크립트

```bash
# 자동 검증
npm run validate:production

# 수동 검증
node -e "
const required = [
  'TOSS_CLIENT_KEY',
  'TOSS_SECRET_KEY',
  'DATABASE_URL',
  'SESSION_SECRET',
  'REDIS_URL',
];

require('dotenv').config({ path: '.env.production' });

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ Missing:', missing.join(', '));
  process.exit(1);
}
console.log('✅ All required variables set');
"
```

### 3. 데이터베이스 마이그레이션

```bash
# ⚠️ 주의: 프로덕션 DB 백업 후 실행!

# 백업
pg_dump saju_naming_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 마이그레이션 실행
npx prisma migrate deploy

# 검증
npx prisma migrate status
```

---

## 🚀 배포 절차 (VPS + PM2 + Caddy)

### 배포 인프라 정보

```yaml
도메인: https://saju-naming.one-q.xyz
서버: 커스텀 VPS (141.164.60.51)
프로세스 관리: PM2 (포트 3001에서 실행)
웹 서버: Caddy (HTTPS 리버스 프록시, 자동 SSL)
배포 방식: Git push → 서버에서 직접 빌드 및 PM2 재시작
```

### Step 1: 로컬에서 코드 푸시

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: Phase 2 프로덕션 배포 준비"

# 2. 원격 저장소에 푸시
git push origin main
```

### Step 2: 서버 SSH 접속

```bash
# VPS 서버 접속
ssh root@141.164.60.51
# 또는 사용자 계정으로
ssh your-user@141.164.60.51
```

### Step 3: 서버에서 배포 실행

```bash
# 1. 프로젝트 디렉토리 이동
cd /path/to/saju-naming

# 2. 최신 코드 pull
git pull origin main

# 3. 의존성 설치
npm ci

# 4. 환경 변수 설정 (최초 1회만)
cp .env.production.template .env.production
nano .env.production  # 실제 값 입력

# 5. 프로덕션 빌드
npm run build

# 6. DB 마이그레이션 (필요시)
npx prisma migrate deploy

# 7. PM2로 재시작
pm2 restart saju-naming
# 또는 새로 시작하는 경우
pm2 start npm --name "saju-naming" -- start

# 8. 상태 확인
pm2 status
pm2 logs saju-naming --lines 50
```

### Step 4: 배포 자동화 스크립트 (선택)

서버에 배포 스크립트 생성:

```bash
# /path/to/saju-naming/deploy.sh
#!/bin/bash

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 3. Build
echo "🔨 Building application..."
npm run build

# 4. Database migration
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# 5. Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart saju-naming

# 6. Check status
echo "✅ Deployment complete!"
pm2 status
pm2 logs saju-naming --lines 10
```

실행 권한 부여:
```bash
chmod +x deploy.sh
```

배포 실행:
```bash
./deploy.sh
```

---

## 📈 모니터링 설정

### Sentry 에러 추적 (선택)

```bash
# 1. Sentry 계정 생성: https://sentry.io/

# 2. 프로젝트 생성 및 DSN 복사

# 3. .env.production에 추가
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 4. Sentry SDK 설치
npm install @sentry/remix --save
```

### Google Analytics (선택)

```env
# .env.production
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🔧 트러블슈팅

### 문제 1: TossPayments 결제 실패

```bash
# 증상: "결제 요청 실패" 에러

# 해결:
1. API 키 확인 (live_ck_, live_sk_ 접두사 확인)
2. TossPayments 계약 상태 확인 (승인 완료?)
3. 브라우저 콘솔 로그 확인
4. 네트워크 탭에서 API 응답 확인
```

### 문제 2: DATABASE_URL 연결 실패

```bash
# 증상: "Connection refused" 에러

# 해결:
1. DB 서버 실행 확인
2. 호스트/포트 정확성 확인
3. 방화벽 설정 확인 (5432 포트 개방)
4. 사용자 권한 확인
```

### 문제 3: SESSION_SECRET 관련 에러

```bash
# 증상: 세션 관련 에러

# 해결:
SESSION_SECRET이 최소 32자인지 확인
강력한 랜덤 문자열로 교체
```

---

## 📞 지원

문제가 계속되면:
- GitHub Issues: [프로젝트 이슈 페이지]
- TossPayments 고객센터: 1644-8051
- 개발자 문의: [이메일 주소]

---

## 📝 체크리스트

배포 전 최종 점검:

```
환경 설정:
- [ ] .env.production 파일 생성 완료
- [ ] 모든 필수 환경 변수 입력 완료
- [ ] 환경 변수 검증 스크립트 통과
- [ ] .gitignore에 .env.production 포함 확인

TossPayments:
- [ ] 실제(live) API 키 발급 완료
- [ ] 결제 설정 완료
- [ ] 테스트 결제 1건 성공

데이터베이스:
- [ ] 프로덕션 DB 생성 완료
- [ ] 백업 시스템 구축
- [ ] 마이그레이션 실행 완료

보안:
- [ ] 모든 비밀번호 강력함
- [ ] HTTPS 설정 완료
- [ ] 민감 정보 Git 커밋 없음

모니터링:
- [ ] Sentry 설정 (선택)
- [ ] 로그 수집 시스템
- [ ] 알림 시스템 구축

성능:
- [ ] 프로덕션 빌드 테스트 완료
- [ ] 로드 테스트 (선택)
- [ ] CDN 설정 (선택)
```

---

✅ **모든 항목을 완료하셨다면 배포를 진행하세요!**
