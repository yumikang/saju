/**
 * DB 한자 자동 스캔 및 불용한자 검출 스크립트
 *
 * 사용법:
 *   npx tsx scripts/scan-taboo-characters.ts [--auto-update]
 *
 * 기능:
 * 1. DB의 모든 한자를 TABOO_RULES로 검사
 * 2. risky/rejected 한자 리스트 출력
 * 3. --auto-update 플래그 시 DB 자동 업데이트
 */

import { PrismaClient } from '@prisma/client';
import {
  checkCharacterSafety,
  batchCheckCharacters,
  type TabooCheckResult
} from '../app/lib/naming/filters/taboo-rules';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

interface ScanOptions {
  autoUpdate: boolean;
  dryRun: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const options: ScanOptions = {
    autoUpdate: args.includes('--auto-update'),
    dryRun: args.includes('--dry-run')
  };

  console.log('🔍 DB 한자 불용한자 스캔 시작...\n');
  console.log(`옵션: ${options.autoUpdate ? '자동 업데이트 활성화' : '스캔만 실행'}\n`);

  // 1. 모든 한자 조회
  const allCharacters = await prisma.hanjaDict.findMany({
    select: {
      id: true,
      character: true,
      meaning: true,
      review: true,
      isGoodForNaming: true
    }
  });

  console.log(`📊 총 ${allCharacters.length}개 한자 스캔 중...\n`);

  // 2. 배치 검사
  const results = batchCheckCharacters(
    allCharacters.map(c => ({ character: c.character, meaning: c.meaning }))
  );

  // 3. 결과 출력
  console.log('='.repeat(80));
  console.log('📈 스캔 결과 요약');
  console.log('='.repeat(80));
  console.log(`✅ 안전 (safe):        ${results.safe.length}개`);
  console.log(`⚠️  주의 (caution):     ${results.caution.length}개`);
  console.log(`🚨 위험 (risky):       ${results.risky.length}개`);
  console.log(`❌ 거부 (rejected):    ${results.rejected.length}개`);
  console.log('='.repeat(80));
  console.log();

  // 4. Rejected 한자 상세 출력
  if (results.rejected.length > 0) {
    console.log('❌ REJECTED 한자 (즉시 제외 필요):');
    console.log('-'.repeat(80));
    for (const result of results.rejected.slice(0, 20)) { // 최대 20개만 출력
      const dbChar = allCharacters.find(c => c.character === result.character);
      console.log(`  ${result.character} - ${dbChar?.meaning}`);
      result.issues.forEach(issue => {
        console.log(`    → [${issue.severity}] ${issue.reason}`);
      });
      console.log();
    }
    if (results.rejected.length > 20) {
      console.log(`  ... 외 ${results.rejected.length - 20}개 더 있음\n`);
    }
  }

  // 5. Risky 한자 상세 출력
  if (results.risky.length > 0) {
    console.log('🚨 RISKY 한자 (검토 필요):');
    console.log('-'.repeat(80));
    for (const result of results.risky.slice(0, 20)) {
      const dbChar = allCharacters.find(c => c.character === result.character);
      console.log(`  ${result.character} - ${dbChar?.meaning}`);
      result.issues.forEach(issue => {
        console.log(`    → [${issue.severity}] ${issue.reason}`);
      });
      console.log();
    }
    if (results.risky.length > 20) {
      console.log(`  ... 외 ${results.risky.length - 20}개 더 있음\n`);
    }
  }

  // 6. Caution 한자 샘플 출력
  if (results.caution.length > 0) {
    console.log('⚠️  CAUTION 한자 (샘플 10개):');
    console.log('-'.repeat(80));
    for (const result of results.caution.slice(0, 10)) {
      const dbChar = allCharacters.find(c => c.character === result.character);
      console.log(`  ${result.character} - ${dbChar?.meaning}`);
      result.issues.forEach(issue => {
        console.log(`    → [${issue.severity}] ${issue.reason}`);
      });
    }
    console.log(`  (총 ${results.caution.length}개)\n`);
  }

  // 7. 자동 업데이트 실행
  if (options.autoUpdate && !options.dryRun) {
    console.log('\n🔄 DB 자동 업데이트 시작...\n');

    // Rejected → review='needs_review', isGoodForNaming=false (완전 제외)
    const rejectedChars = results.rejected.map(r => r.character);
    if (rejectedChars.length > 0) {
      const rejectedUpdate = await prisma.hanjaDict.updateMany({
        where: { character: { in: rejectedChars } },
        data: {
          review: 'needs_review',
          isGoodForNaming: false
        }
      });
      console.log(`  ❌ ${rejectedUpdate.count}개 한자를 'needs_review' + isGoodForNaming=false로 업데이트`);
    }

    // Risky → review='needs_review', isGoodForNaming=false (검토 필요)
    const riskyChars = results.risky.map(r => r.character);
    if (riskyChars.length > 0) {
      const riskyUpdate = await prisma.hanjaDict.updateMany({
        where: { character: { in: riskyChars } },
        data: {
          review: 'needs_review',
          isGoodForNaming: false
        }
      });
      console.log(`  🚨 ${riskyUpdate.count}개 한자를 'needs_review' + isGoodForNaming=false로 업데이트`);
    }

    // Caution → review='needs_review' (isGoodForNaming은 유지 - 수동 검토 필요)
    const cautionChars = results.caution.map(r => r.character);
    if (cautionChars.length > 0) {
      const cautionUpdate = await prisma.hanjaDict.updateMany({
        where: { character: { in: cautionChars } },
        data: {
          review: 'needs_review'
        }
      });
      console.log(`  ⚠️  ${cautionUpdate.count}개 한자를 'needs_review'로 업데이트 (isGoodForNaming 유지)`);
    }

    // Safe → review='ok', isGoodForNaming=true (기존에 false였던 것만)
    const safeChars = results.safe.map(r => r.character);
    if (safeChars.length > 0) {
      const safeUpdate = await prisma.hanjaDict.updateMany({
        where: {
          character: { in: safeChars },
          isGoodForNaming: false
        },
        data: {
          review: 'ok',
          isGoodForNaming: true
        }
      });
      console.log(`  ✅ ${safeUpdate.count}개 한자를 'ok' + isGoodForNaming=true로 업데이트`);
    }

    console.log('\n✅ DB 업데이트 완료!\n');
  } else if (options.dryRun) {
    console.log('\n🔍 DRY-RUN 모드: 실제 업데이트는 실행하지 않음\n');
  } else {
    console.log('\n💡 DB를 업데이트하려면 --auto-update 플래그를 사용하세요:');
    console.log('   npx tsx scripts/scan-taboo-characters.ts --auto-update\n');
  }

  // 8. 리뷰 필요 통계
  console.log('='.repeat(80));
  console.log('📋 리뷰 필요 항목 요약');
  console.log('='.repeat(80));
  console.log(`🚨 Risky (높은 우선순위):    ${results.risky.length}개`);
  console.log(`⚠️  Caution (낮은 우선순위):   ${results.caution.length}개`);
  console.log(`❌ Rejected (자동 제외됨):    ${results.rejected.length}개`);
  console.log('='.repeat(80));
  console.log();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
