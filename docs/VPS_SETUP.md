# VPS 서버 배포 가이드

## 🎯 개요
커스텀 VPS 서버에 Podman을 사용하여 PostgreSQL, Redis 및 애플리케이션 배포

### 서버 정보
- **VPS IP**: 141.164.60.51
- **도메인**: saju-naming.one-q.xyz
- **프로토콜**: HTTPS (SSL 인증서 포함)

## 📋 사전 요구사항

### VPS 서버 접속
```bash
ssh root@141.164.60.51
# 또는
ssh your_user@141.164.60.51
```

### Podman 설치 (CentOS/RHEL/Fedora)
```bash
sudo dnf install -y podman podman-compose
```

### Podman 설치 (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y podman
```

## 🗄️ 1. PostgreSQL 설정

### 1.1 PostgreSQL 컨테이너 실행
```bash
podman run -d \
  --name saju-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=saju_user \
  -e POSTGRES_PASSWORD=saju_secure_2024! \
  -e POSTGRES_DB=saju_naming \
  -v /var/lib/containers/volumes/saju-postgres-data:/var/lib/postgresql/data \
  --restart=always \
  postgres:15-alpine
```

### 1.2 PostgreSQL 상태 확인
```bash
podman ps | grep saju-postgres
podman logs saju-postgres
```

### 1.3 PostgreSQL 연결 테스트
```bash
podman exec -it saju-postgres psql -U saju_user -d saju_naming
```

## 🔄 2. Redis 설정

### 2.1 Redis 컨테이너 실행
```bash
podman run -d \
  --name saju-redis \
  -p 6379:6379 \
  -v /var/lib/containers/volumes/saju-redis-data:/data \
  --restart=always \
  redis:7-alpine redis-server --appendonly yes --requirepass saju2024
```

### 2.2 Redis 상태 확인
```bash
podman ps | grep saju-redis
podman exec -it saju-redis redis-cli -a saju2024 ping
```

## 🌐 3. 방화벽 설정

### Firewalld (CentOS/RHEL/Fedora)
```bash
sudo firewall-cmd --permanent --add-port=5432/tcp  # PostgreSQL
sudo firewall-cmd --permanent --add-port=6379/tcp  # Redis
sudo firewall-cmd --permanent --add-port=3000/tcp  # Application
sudo firewall-cmd --permanent --add-port=80/tcp    # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp   # HTTPS
sudo firewall-cmd --reload
```

### UFW (Ubuntu/Debian)
```bash
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw allow 6379/tcp  # Redis
sudo ufw allow 3000/tcp  # Application
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw reload
```

## 🚀 4. 애플리케이션 배포

### 4.1 프로젝트 준비
```bash
# VPS 서버에서
cd /opt
git clone <your-repository-url> saju
cd saju
```

### 4.2 환경 변수 설정 (.env.production)
```bash
cat > .env.production << 'EOF'
NODE_ENV=production
APP_URL=https://saju-naming.one-q.xyz
SOCKET_PORT=3001

# Database
DATABASE_URL="postgresql://saju_user:saju_secure_2024!@localhost:5432/saju_naming?schema=public"

# Redis
REDIS_URL=redis://:saju2024@localhost:6379/0
REDIS_PASSWORD=saju2024

# Session Secret (변경 필요!)
SESSION_SECRET=your_production_secret_key_here
SESSION_SECRET_USER=your_production_user_session_key_here

# OpenAI (실제 키로 변경)
OPENAI_API_KEY=your_openai_api_key

# Supabase (사용시)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EOF
```

### 4.3 Node.js 설치
```bash
# NodeSource를 통한 Node.js 20 설치
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 또는 Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

### 4.4 의존성 설치 및 빌드
```bash
npm ci
npm run build
```

### 4.5 Prisma 마이그레이션
```bash
npx prisma migrate deploy
npx prisma generate
```

## 📦 5. Podman 컨테이너로 애플리케이션 실행

### 5.1 Dockerfile 생성
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 5.2 컨테이너 빌드 및 실행
```bash
# 이미지 빌드
podman build -t saju-app .

# 컨테이너 실행
podman run -d \
  --name saju-app \
  -p 3000:3000 \
  --env-file .env.production \
  --restart=always \
  saju-app
```

## 🔧 6. Systemd 서비스 설정 (선택)

### 6.1 Podman 컨테이너를 systemd 서비스로 생성
```bash
# PostgreSQL
podman generate systemd --new --name saju-postgres > /etc/systemd/system/saju-postgres.service

# Redis
podman generate systemd --new --name saju-redis > /etc/systemd/system/saju-redis.service

# Application
podman generate systemd --new --name saju-app > /etc/systemd/system/saju-app.service

# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable saju-postgres saju-redis saju-app
sudo systemctl start saju-postgres saju-redis saju-app
```

## 🔒 7. 보안 설정

### 7.1 PostgreSQL 보안
```bash
# PostgreSQL 외부 접근 제한 (애플리케이션만 접근)
sudo firewall-cmd --permanent --remove-port=5432/tcp
sudo firewall-cmd --reload
```

### 7.2 Redis 보안
```bash
# Redis 외부 접근 제한
sudo firewall-cmd --permanent --remove-port=6379/tcp
sudo firewall-cmd --reload
```

### 7.3 강력한 비밀번호로 변경
.env.production 파일의 모든 비밀번호를 강력한 값으로 변경

## 🌍 8. 도메인 및 SSL 설정 (선택)

### 8.1 Nginx 설치
```bash
sudo dnf install -y nginx
# 또는
sudo apt-get install -y nginx
```

### 8.2 Nginx 설정
```nginx
# /etc/nginx/conf.d/saju.conf
server {
    listen 80;
    server_name saju-naming.one-q.xyz;

    # HTTP to HTTPS 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name saju-naming.one-q.xyz;

    # SSL 인증서 (certbot이 자동으로 추가)
    ssl_certificate /etc/letsencrypt/live/saju-naming.one-q.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saju-naming.one-q.xyz/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8.3 SSL 인증서 (Let's Encrypt)
```bash
# Certbot 설치 (RHEL/CentOS/Fedora)
sudo dnf install -y certbot python3-certbot-nginx

# 또는 Ubuntu/Debian
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d saju-naming.one-q.xyz

# 자동 갱신 테스트
sudo certbot renew --dry-run

# Nginx 재시작
sudo systemctl restart nginx
```

## 📊 9. 모니터링 및 로그

### 컨테이너 상태 확인
```bash
podman ps -a
```

### 로그 확인
```bash
podman logs -f saju-postgres
podman logs -f saju-redis
podman logs -f saju-app
```

### 리소스 사용량
```bash
podman stats
```

## 🔄 10. 업데이트 및 배포 스크립트

### deploy.sh 생성
```bash
cat > /opt/saju/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# 최신 코드 가져오기
git pull origin main

# 의존성 설치
npm ci

# 빌드
npm run build

# Prisma 마이그레이션
npx prisma migrate deploy
npx prisma generate

# 컨테이너 재시작
podman stop saju-app || true
podman rm saju-app || true
podman build -t saju-app .
podman run -d \
  --name saju-app \
  -p 3000:3000 \
  --env-file .env.production \
  --restart=always \
  saju-app

echo "✅ Deployment complete!"
EOF

chmod +x /opt/saju/deploy.sh
```

## 🆘 문제 해결

### 컨테이너 재시작
```bash
podman restart saju-postgres
podman restart saju-redis
podman restart saju-app
```

### 컨테이너 삭제 및 재생성
```bash
podman stop saju-app
podman rm saju-app
# 위의 명령어로 재생성
```

### 데이터베이스 백업
```bash
podman exec saju-postgres pg_dump -U saju_user saju_naming > backup_$(date +%Y%m%d).sql
```

### 데이터베이스 복원
```bash
cat backup.sql | podman exec -i saju-postgres psql -U saju_user -d saju_naming
```

## 📝 체크리스트

### 로컬 설정
- [x] Podman 설치 완료
- [x] PostgreSQL 컨테이너 실행 및 테스트
- [x] Redis 컨테이너 실행 및 테스트
- [x] 로컬 개발 서버 정상 작동 확인

### DNS 설정
- [ ] DNS A 레코드 추가 (saju-naming → 141.164.60.51)
- [ ] DNS 전파 확인 (`nslookup saju-naming.one-q.xyz`)

### VPS 서버 설정
- [ ] VPS 서버 접속 확인
- [ ] Podman 설치 완료
- [ ] PostgreSQL 컨테이너 실행 및 테스트
- [ ] Redis 컨테이너 실행 및 테스트
- [ ] 방화벽 설정 완료 (포트 80, 443, 3000)
- [ ] .env.production 파일 생성 및 비밀번호 변경
- [ ] 애플리케이션 빌드 및 배포
- [ ] Prisma 마이그레이션 실행
- [ ] Nginx 설치 및 설정
- [ ] SSL 인증서 발급 (Let's Encrypt)
- [ ] HTTPS 접속 확인 (https://saju-naming.one-q.xyz)
- [ ] 백업 스크립트 설정

## 🔗 유용한 명령어 모음

```bash
# 모든 컨테이너 상태 확인
podman ps -a

# 특정 컨테이너 로그 실시간 확인
podman logs -f saju-app

# 컨테이너 내부 접속
podman exec -it saju-app sh

# 볼륨 확인
podman volume ls

# 네트워크 확인
podman network ls

# 시스템 정리 (사용하지 않는 이미지/컨테이너 삭제)
podman system prune -a
```
