#!/bin/bash
# Prisma + PgBouncer 설정 가이드 스크립트
# 마이그레이션과 애플리케이션 실행을 위한 환경 설정

echo "======================================"
echo "Prisma + PgBouncer 설정 가이드"
echo "======================================"
echo ""

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 현재 설정 확인${NC}"
echo "======================================"

# .env 파일 확인
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env 파일 발견${NC}"
    echo ""
    echo "현재 DATABASE_URL 설정:"
    grep "DATABASE_URL" .env | grep -v "^#"
    echo ""
else
    echo -e "${RED}❌ .env 파일이 없습니다${NC}"
fi

echo ""
echo -e "${BLUE}🔧 권장 설정${NC}"
echo "======================================"
echo ""

cat << 'EOF'
1. 환경 변수 설정 (.env 파일):
   --------------------------------
   # PgBouncer를 통한 애플리케이션 연결 (포트 6432)
   DATABASE_URL="postgresql://saju_user:saju_secure_2024!@localhost:6432/saju_naming?schema=public&pgbouncer=true&statement_cache_size=0"
   
   # 직접 연결 (마이그레이션/ETL용, 포트 5432)
   DATABASE_URL_DIRECT="postgresql://saju_user:saju_secure_2024!@localhost:5432/saju_naming?schema=public"

2. Prisma 마이그레이션 실행:
   --------------------------------
   # 마이그레이션은 직접 연결 사용
   DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate deploy
   
   # 또는 package.json 스크립트에 추가:
   "migrate:prod": "DATABASE_URL=$DATABASE_URL_DIRECT prisma migrate deploy"

3. PgBouncer 설정 확인 (pgbouncer.ini):
   --------------------------------
   pool_mode = transaction              # ✅ Transaction 모드 (권장)
   server_reset_query = DISCARD ALL     # ✅ 연결 재사용시 리셋
   server_reset_query_always = 0        # ✅ 필요시에만 리셋
   
4. Prepared Statements 제한 회피:
   --------------------------------
   • statement_cache_size=0 추가 (DATABASE_URL에)
   • PgBouncer transaction 모드 사용
   • DISCARD ALL로 세션 리셋

5. Prisma Client 설정 (선택사항):
   --------------------------------
EOF

cat << 'EOF' > prisma-client-config.ts
// prisma-client-config.ts
import { PrismaClient } from '@prisma/client';

// 애플리케이션용 (PgBouncer 경유)
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // 6432 포트
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// 마이그레이션/관리용 (직접 연결)
export const prismaDirect = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DIRECT, // 5432 포트
    },
  },
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await prismaDirect.$disconnect();
});
EOF

echo ""
echo -e "${GREEN}✅ prisma-client-config.ts 파일 생성됨${NC}"
echo ""

echo -e "${BLUE}🚀 실행 예제${NC}"
echo "======================================"
echo ""

cat << 'EOF'
# 1. 마이그레이션 실행 (직접 연결)
DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate deploy

# 2. Prisma Studio 실행 (직접 연결)
DATABASE_URL=$DATABASE_URL_DIRECT npx prisma studio

# 3. 애플리케이션 실행 (PgBouncer 경유)
npm run dev  # DATABASE_URL 사용 (6432 포트)

# 4. ETL/배치 작업 (직접 연결)
DATABASE_URL=$DATABASE_URL_DIRECT npx tsx scripts/etl/60_load.ts
EOF

echo ""
echo -e "${YELLOW}⚠️  주의사항${NC}"
echo "======================================"
echo ""
cat << 'EOF'
1. 마이그레이션은 반드시 DATABASE_URL_DIRECT 사용
   - PgBouncer는 DDL 명령어 제한 있음
   
2. Prepared Statements 이슈 발생시:
   - statement_cache_size=0 추가
   - pgbouncer=true 쿼리 파라미터 확인
   
3. 연결 수 모니터링:
   - SHOW POOLS; (PgBouncer 관리 콘솔)
   - pg_stat_activity (PostgreSQL)
   
4. 트랜잭션 모드 제한사항:
   - Session 레벨 설정 사용 불가
   - Prepared statements 제한
   - LISTEN/NOTIFY 사용 불가
EOF

echo ""
echo -e "${GREEN}✅ 설정 가이드 완료!${NC}"
echo ""

# PgBouncer 상태 확인
echo -e "${BLUE}📊 PgBouncer 현재 상태${NC}"
echo "======================================"

if pgrep -x "pgbouncer" > /dev/null; then
    echo -e "${GREEN}✅ PgBouncer 실행 중${NC}"
    
    # 연결 풀 상태 확인
    PGPASSWORD=saju_secure_2024! /opt/homebrew/opt/postgresql@15/bin/psql \
        -h localhost -p 6432 -U saju_user pgbouncer \
        -c "SHOW POOLS;" 2>/dev/null || echo "풀 상태 조회 실패 (관리자 권한 필요)"
else
    echo -e "${RED}❌ PgBouncer가 실행되고 있지 않습니다${NC}"
    echo "시작하려면: brew services start pgbouncer"
fi

echo ""
echo "======================================"
echo "설정 완료!"