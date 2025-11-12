#!/usr/bin/env npx tsx
/**
 * 새로운 점수 시스템 테스트
 */
import { PrismaClient } from '@prisma/client';
import { sortHanjaByScore } from '../app/lib/hanja-scoring';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 점수 기반 정렬 시스템 테스트 ===\n');

  // "유" 한자 가져오기
  const candidates = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isGoodForNaming: true,
      nameFrequency: { gte: 50 }
    },
    select: {
      character: true,
      meaning: true,
      seedProtected: true,
      isGoodForNaming: true,
      genderHint: true,
      inferredNameFrequency: true,
      nameFrequency: true,
    }
  });

  console.log(`총 후보: ${candidates.length}개\n`);

  // 점수 계산 및 정렬
  const sorted = sortHanjaByScore(candidates, null);

  // 상위 30개
  const top30 = sorted.slice(0, 30);

  console.log('🏆 상위 30개 (드롭다운 표시):\n');

  top30.forEach((h, idx) => {
    const seed = h.seedProtected ? '🌱' : '  ';
    const marker = h.character === '有' ? '👉' : '  ';
    console.log(`${seed}${marker} ${idx + 1}. ${h.character} (${h.meaning})`);
  });

  // 有 위치 확인
  const youIndex = top30.findIndex(h => h.character === '有');
  if (youIndex >= 0) {
    console.log(`\n✅ 有는 ${youIndex + 1}번째에 있습니다!`);
  } else {
    const fullIndex = sorted.findIndex(h => h.character === '有');
    if (fullIndex >= 0) {
      console.log(`\n⚠️ 有는 ${fullIndex + 1}번째에 있습니다 (30개 밖)`);
    } else {
      console.log(`\n❌ 有가 목록에 없습니다!`);
    }
  }

  // 부적절한 한자 차단 확인
  console.log('\n🚫 부적절한 한자 차단 검증:');
  const toCheck = ['乳', '冘', '壝', '屎', '病'];
  for (const char of toCheck) {
    const found = await prisma.hanjaDict.findFirst({
      where: { character: char },
      select: { character: true, meaning: true, isGoodForNaming: true }
    });
    if (found) {
      // Check if in top 30
      const inTop30 = top30.some(h => h.character === char);
      // Check if hard-blocked
      const hardBlocked = found.isGoodForNaming === false;

      let status;
      if (hardBlocked) {
        status = '✅ 하드차단됨 (FALSE)';
      } else if (inTop30) {
        status = '❌ 상위 30개에 표시됨';
      } else {
        status = '✅ 상위 30 밖 (소프트 패널티)';
      }
      console.log(`  ${found.character} (${found.meaning}): ${status}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
