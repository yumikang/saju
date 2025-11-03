#!/usr/bin/env npx tsx
/**
 * 부적절한 의미 한자 수정
 * 1. "이" 포함으로 막힌 한자 복구 (inferredNameFrequency > 0인 것만)
 * 2. 더 정확한 키워드로 재마킹
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  부적절한 의미 한자 수정                   ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Step 1: "이" 포함으로 막힌 한자 중 출생 데이터 있는 것 복구
  console.log('Step 1: "이" 포함 한자 복구 (출생 데이터 있음)');
  const restored = await prisma.hanjaDict.updateMany({
    where: {
      meaning: { contains: '이' },
      isGoodForNaming: false,
      inferredNameFrequency: { gt: 0 }
    },
    data: {
      isGoodForNaming: true,
    },
  });

  console.log(`✅ ${restored.count}개 복구\n`);

  // Step 2: 정확한 키워드로 재마킹 (전체 의미가 그것인 경우만)
  console.log('Step 2: 정확한 키워드로 재마킹');

  const PRECISE_KEYWORDS = [
    // 벌레류 (전체 단어)
    { keyword: '그리마', partial: false },
    { keyword: '족제비', partial: false },
    { keyword: '유충', partial: false },
    { keyword: '메뚜기', partial: false },
    { keyword: '지렁이', partial: false },
    { keyword: '달팽이', partial: false },
    { keyword: '거머리', partial: false },
    { keyword: '벼룩', partial: false },
    { keyword: '진드기', partial: false },

    // 접두사로 사용 (부분 매칭)
    { keyword: '벌레', partial: true },
    { keyword: '거미', partial: true },
    { keyword: '쥐', partial: true },

    // 동물
    { keyword: '두꺼비', partial: false },
    { keyword: '까마귀', partial: false },

    // 부정적
    { keyword: '시체', partial: true },
    { keyword: '썩', partial: true },
    { keyword: '똥', partial: false },
    { keyword: '오줌', partial: false },
  ];

  let totalMarked = 0;

  for (const { keyword, partial } of PRECISE_KEYWORDS) {
    // partial이면 포함, 아니면 정확한 매칭
    const result = await prisma.hanjaDict.updateMany({
      where: {
        ...(partial
          ? { meaning: { contains: keyword } }
          : { meaning: keyword }),
        isGoodForNaming: true,
      },
      data: {
        isGoodForNaming: false,
      },
    });

    if (result.count > 0) {
      console.log(`"${keyword}" ${partial ? '포함' : '정확'}: ${result.count}개 → FALSE`);
      totalMarked += result.count;
    }
  }

  console.log(`\n✅ 총 ${totalMarked}개 한자 FALSE로 마킹\n`);

  // 검증
  const verification = await prisma.hanjaDict.findMany({
    where: {
      character: { in: ['蚰', '鼬', '蚴', '兒'] }
    },
    select: {
      character: true,
      meaning: true,
      isGoodForNaming: true,
    }
  });

  console.log('검증:');
  verification.forEach(h => {
    const status = h.isGoodForNaming === true ? '✅ TRUE'
                 : h.isGoodForNaming === false ? '🚫 FALSE'
                 : '❓ NULL';
    console.log(`  ${h.character} (${h.meaning}) - ${status}`);
  });

  // 최종 통계
  const stats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true,
    where: {
      isSurname: false,
    },
  });

  console.log('\n최종 통계 (비성씨):');
  stats.forEach(stat => {
    const label = stat.isGoodForNaming === true ? '✅ TRUE'
                : stat.isGoodForNaming === false ? '🚫 FALSE'
                : '❓ NULL';
    console.log(`  ${label}: ${stat._count}개`);
  });

  console.log('\n✅ 완료!\n');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
