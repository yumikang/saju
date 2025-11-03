#!/usr/bin/env npx tsx
/**
 * 부적절한 의미의 한자를 FALSE로 마킹
 * - 벌레, 동물, 짐승 이름 등
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 부적절한 의미 키워드
const INAPPROPRIATE_KEYWORDS = [
  '벌레', '충', '짐승', '쥐', '개미', '파리', '모기', '거미',
  '그리마', '족제비', '유충', '메뚜기', '지렁이', '달팽이',
  '거머리', '바퀴', '이', '진드기', '벼룩',
  // 추가 동물
  '뱀', '두꺼비', '개구리', '까마귀',
  // 부정적
  '시체', '썩', '부패', '오물', '똥', '오줌'
];

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  부적절한 의미 한자 FALSE 마킹             ║');
  console.log('╚════════════════════════════════════════════╝\n');

  let totalMarked = 0;

  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    const result = await prisma.hanjaDict.updateMany({
      where: {
        meaning: { contains: keyword },
        isGoodForNaming: true,  // TRUE인 것만 FALSE로 변경
      },
      data: {
        isGoodForNaming: false,
      },
    });

    if (result.count > 0) {
      console.log(`"${keyword}" 포함: ${result.count}개 → FALSE`);
      totalMarked += result.count;
    }
  }

  console.log(`\n✅ 총 ${totalMarked}개 한자 FALSE로 마킹\n`);

  // 검증: 문제의 한자들 확인
  const verification = await prisma.hanjaDict.findMany({
    where: {
      character: { in: ['蚰', '鼬', '蚴'] }
    },
    select: {
      character: true,
      meaning: true,
      isGoodForNaming: true,
    }
  });

  console.log('검증:');
  verification.forEach(h => {
    const status = h.isGoodForNaming === false ? '✅ FALSE' : '⚠️ ' + h.isGoodForNaming;
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
