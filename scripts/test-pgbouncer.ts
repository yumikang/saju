#!/usr/bin/env npx tsx
/**
 * PgBouncer 연결 풀 테스트 스크립트
 * 
 * 이 스크립트는 PgBouncer를 통한 데이터베이스 연결을 테스트하고
 * 연결 풀의 성능과 동작을 검증합니다.
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// PgBouncer를 통한 Prisma 클라이언트
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// 직접 연결용 Prisma 클라이언트 (비교용)
const prismaDirect = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DIRECT
    }
  }
});

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow
  };
  console.log(`${colorMap[type]}${message}${colors.reset}`);
}

async function testBasicConnection() {
  log('\n=== 기본 연결 테스트 ===', 'info');
  
  try {
    // PgBouncer 연결 테스트
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT current_database() as db, current_user as user, version() as version`;
    const elapsed = Date.now() - start;
    
    log(`✅ PgBouncer 연결 성공 (${elapsed}ms)`, 'success');
    console.log(result);
    
    // 직접 연결과 비교
    const startDirect = Date.now();
    await prismaDirect.$queryRaw`SELECT 1`;
    const elapsedDirect = Date.now() - startDirect;
    
    log(`📊 연결 시간 비교:`, 'info');
    log(`  - PgBouncer: ${elapsed}ms`, 'info');
    log(`  - Direct: ${elapsedDirect}ms`, 'info');
    
  } catch (error) {
    log(`❌ 연결 실패: ${error}`, 'error');
    throw error;
  }
}

async function testConcurrentConnections() {
  log('\n=== 동시 연결 테스트 ===', 'info');
  
  const concurrentCount = 20;
  const queries: Promise<any>[] = [];
  
  log(`${concurrentCount}개의 동시 쿼리 실행...`, 'info');
  const start = Date.now();
  
  for (let i = 0; i < concurrentCount; i++) {
    queries.push(
      prisma.hanjaDict.findFirst()
    );
  }
  
  try {
    await Promise.all(queries);
    const elapsed = Date.now() - start;
    
    log(`✅ ${concurrentCount}개 동시 쿼리 완료 (${elapsed}ms)`, 'success');
    log(`  평균 쿼리 시간: ${(elapsed / concurrentCount).toFixed(2)}ms`, 'info');
    
  } catch (error) {
    log(`❌ 동시 연결 테스트 실패: ${error}`, 'error');
  }
}

async function testTransactionMode() {
  log('\n=== 트랜잭션 모드 테스트 ===', 'info');
  
  try {
    // 트랜잭션 테스트
    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.hanjaDict.count();
      const sample = await tx.hanjaDict.findFirst();
      return { count, sample };
    });
    
    log(`✅ 트랜잭션 모드 정상 작동`, 'success');
    log(`  - 한자 사전 레코드 수: ${result.count}`, 'info');
    
  } catch (error) {
    log(`❌ 트랜잭션 테스트 실패: ${error}`, 'error');
  }
}

async function showPoolStats() {
  log('\n=== PgBouncer 풀 통계 ===', 'info');
  
  try {
    // PgBouncer 관리 콘솔 접속
    const poolsCmd = `PGPASSWORD=saju_secure_2024! /opt/homebrew/opt/postgresql@15/bin/psql -h localhost -p 6432 -U saju_user pgbouncer -c "SHOW POOLS;"`;
    const statsCmd = `PGPASSWORD=saju_secure_2024! /opt/homebrew/opt/postgresql@15/bin/psql -h localhost -p 6432 -U saju_user pgbouncer -c "SHOW STATS;"`;
    
    const { stdout: poolsOutput } = await execAsync(poolsCmd);
    const { stdout: statsOutput } = await execAsync(statsCmd);
    
    log('📊 연결 풀 상태:', 'info');
    console.log(poolsOutput);
    
    log('📈 통계 정보:', 'info');
    console.log(statsOutput);
    
  } catch (error) {
    log(`⚠️ PgBouncer 통계 조회 실패 (관리자 권한 필요): ${error}`, 'warning');
  }
}

async function performanceComparison() {
  log('\n=== 성능 비교 테스트 ===', 'info');
  
  const iterations = 100;
  
  // PgBouncer를 통한 쿼리
  log(`PgBouncer를 통한 ${iterations}회 쿼리 실행...`, 'info');
  const pgbouncerStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await prisma.$queryRaw`SELECT 1`;
  }
  const pgbouncerTime = Date.now() - pgbouncerStart;
  
  // 직접 연결 쿼리
  log(`직접 연결로 ${iterations}회 쿼리 실행...`, 'info');
  const directStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await prismaDirect.$queryRaw`SELECT 1`;
  }
  const directTime = Date.now() - directStart;
  
  log('\n📊 성능 비교 결과:', 'success');
  log(`  PgBouncer: ${pgbouncerTime}ms (평균 ${(pgbouncerTime/iterations).toFixed(2)}ms/query)`, 'info');
  log(`  Direct: ${directTime}ms (평균 ${(directTime/iterations).toFixed(2)}ms/query)`, 'info');
  
  const improvement = ((directTime - pgbouncerTime) / directTime * 100).toFixed(1);
  if (parseFloat(improvement) > 0) {
    log(`  🚀 PgBouncer가 ${improvement}% 더 빠름!`, 'success');
  } else {
    log(`  ℹ️ 직접 연결이 ${Math.abs(parseFloat(improvement))}% 더 빠름 (정상 - 오버헤드 있음)`, 'warning');
  }
}

async function testPreparedStatements() {
  log('\n=== Prepared Statements 호환성 테스트 ===', 'info');
  
  try {
    // Prisma는 기본적으로 prepared statements를 사용
    const queries = [];
    for (let i = 0; i < 5; i++) {
      queries.push(
        prisma.hanjaDict.findMany({
          where: { strokes: i + 1 },
          take: 1
        })
      );
    }
    
    await Promise.all(queries);
    log('✅ Prepared statements 호환성 확인', 'success');
    
  } catch (error) {
    log(`⚠️ Prepared statements 이슈 발생: ${error}`, 'warning');
    log('  트랜잭션 모드에서는 prepared statements 제한이 있을 수 있습니다.', 'info');
  }
}

async function main() {
  log(`${colors.bold}🚀 PgBouncer 연결 풀 테스트 시작${colors.reset}\n`, 'success');
  
  try {
    // 1. 기본 연결 테스트
    await testBasicConnection();
    
    // 2. 동시 연결 테스트
    await testConcurrentConnections();
    
    // 3. 트랜잭션 모드 테스트
    await testTransactionMode();
    
    // 4. Prepared Statements 테스트
    await testPreparedStatements();
    
    // 5. 성능 비교
    await performanceComparison();
    
    // 6. 풀 통계 표시
    await showPoolStats();
    
    log(`\n${colors.bold}✅ 모든 테스트 완료!${colors.reset}`, 'success');
    
    log('\n📋 권장사항:', 'info');
    log('  1. 프로덕션에서는 pool_mode를 transaction으로 유지', 'info');
    log('  2. max_client_conn을 애플리케이션 요구사항에 맞게 조정', 'info');
    log('  3. 모니터링 도구로 연결 풀 사용률 추적', 'info');
    log('  4. 정기적으로 SHOW POOLS로 상태 확인', 'info');
    
  } catch (error) {
    log(`\n❌ 테스트 중 오류 발생: ${error}`, 'error');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await prismaDirect.$disconnect();
  }
}

// 스크립트 실행
main().catch(console.error);