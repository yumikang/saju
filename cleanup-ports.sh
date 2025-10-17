#!/bin/bash

echo "🧹 로컬 포트 정리 스크립트"
echo "=========================="
echo ""

# 1. 포트 확인
echo "📊 현재 포트 상태:"
for port in 3000 3001 3002 3003 3004 3005 5556; do
  if lsof -ti:$port 2>/dev/null > /dev/null; then
    echo "  ❌ Port $port: 사용 중"
  else
    echo "  ✅ Port $port: 비어있음"
  fi
done
echo ""

# 2. 프로세스 종료 확인
read -p "모든 개발 서버를 종료하시겠습니까? (y/N): " confirm
if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
  echo ""
  echo "🔄 프로세스 종료 중..."
  pkill -9 -f "remix vite:dev"
  pkill -9 -f "prisma studio"
  pkill -9 -f "vite"
  sleep 2
  echo "✅ 프로세스 종료 완료"
  echo ""
  
  # 3. 캐시 정리
  echo "🗑️  캐시 정리 중..."
  rm -rf .cache node_modules/.cache node_modules/.vite build/.cache 2>/dev/null
  echo "✅ 캐시 정리 완료"
  echo ""
  
  # 4. 최종 확인
  echo "📊 최종 포트 상태:"
  for port in 3000 3001 3002 3003 3004 3005 5556; do
    if lsof -ti:$port 2>/dev/null > /dev/null; then
      echo "  ❌ Port $port: 사용 중"
    else
      echo "  ✅ Port $port: 비어있음"
    fi
  done
  echo ""
  echo "🎉 정리 완료!"
else
  echo "취소되었습니다."
fi
