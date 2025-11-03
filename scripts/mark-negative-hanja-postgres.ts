#!/usr/bin/env npx tsx
/**
 * PostgreSQL에 부정적 한자 64개를 FALSE로 마킹
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SQLite에서 추출한 부정적 한자 64개
const NEGATIVE_HANJA = [
  '辜', '僙', '誆', '誑', '拐', '窶', '忮', '欺', '癉', '疼',
  '儡', '戮', '瞞', '罔', '歿', '病', '悲', '貧', '死', '詐',
  '殺', '煞', '殤', '愁', '弒', '疴', '殃', '哀', '厄', '戹',
  '阨', '恙', '夭', '殀', '祅', '憂', '頊', '殞', '僞', '瘐',
  '殘', '戕', '災', '灾', '殂', '罪', '疾', '慘', '憯', '瘁',
  '詫', '殆', '痛', '慝', '敗', '騙', '斃', '獘', '殍', '披',
  '禍', '薨', '兇', '凶'
];

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  PostgreSQL 부정적 한자 마킹               ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`부정적 한자: ${NEGATIVE_HANJA.length}개`);
  console.log(`샘플: ${NEGATIVE_HANJA.slice(0, 10).join(', ')}...\n`);

  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: NEGATIVE_HANJA },
    },
    data: {
      isGoodForNaming: false,
    },
  });

  console.log(`✅ ${result.count}개 한자를 isGoodForNaming = false로 마킹\n`);

  // 검증
  const verification = await prisma.hanjaDict.findMany({
    where: {
      character: { in: NEGATIVE_HANJA.slice(0, 5) },  // 샘플 5개만
    },
    select: {
      character: true,
      meaning: true,
      isGoodForNaming: true,
    },
  });

  console.log('검증 샘플:');
  verification.forEach(h => {
    const status = h.isGoodForNaming === false ? '🚫' : '⚠️';
    console.log(`  ${status} ${h.character} (${h.meaning}) - ${h.isGoodForNaming}`);
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
