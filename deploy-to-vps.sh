#!/bin/bash

# VPS 배포 스크립트
# VPS IP: 141.164.60.51
# Domain: saju-naming.one-q.xyz

set -e

echo "🚀 VPS 배포 시작..."
echo ""

# VPS 서버 정보
VPS_IP="141.164.60.51"
VPS_USER="root"
VPS_DIR="/opt/saju"

echo "📡 서버: $VPS_USER@$VPS_IP"
echo "📁 디렉토리: $VPS_DIR"
echo ""

# SSH 연결 확인
echo "🔐 SSH 연결 테스트..."
if ! ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo '✅ SSH 연결 성공'" 2>/dev/null; then
  echo "❌ SSH 연결 실패"
  echo ""
  echo "수동 배포 명령어:"
  echo "  ssh $VPS_USER@$VPS_IP"
  echo "  cd $VPS_DIR"
  echo "  git pull origin main"
  echo "  npm ci"
  echo "  npm run build"
  echo "  npx prisma migrate deploy"
  echo "  pm2 restart saju-app"
  exit 1
fi

echo ""
echo "📦 배포 진행 중..."
echo ""

# VPS에서 배포 실행
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
set -e

cd /opt/saju

echo "1️⃣ Git 업데이트..."
git pull origin main

echo ""
echo "2️⃣ 의존성 설치..."
npm ci

echo ""
echo "3️⃣ 프로젝트 빌드..."
npm run build

echo ""
echo "4️⃣ Prisma 마이그레이션..."
npx prisma migrate deploy
npx prisma generate

echo ""
echo "5️⃣ 애플리케이션 재시작..."
# PM2 사용 시
if command -v pm2 &> /dev/null; then
  pm2 restart saju-app 2>/dev/null || pm2 start npm --name saju-app -- start
else
  echo "⚠️  PM2가 설치되지 않았습니다. 수동으로 재시작하세요."
fi

echo ""
echo "✅ 배포 완료!"
ENDSSH

echo ""
echo "🌐 서비스 확인:"
echo "  https://saju-naming.one-q.xyz"
echo ""
echo "🎉 배포가 성공적으로 완료되었습니다!"
