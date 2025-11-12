/**
 * 🚑 긴급 하드블록: 명백히 부적절한 한자 차단
 *
 * 차단 대상:
 * - 벌레/배설/질병/재앙/폭력성 관련
 * - 이름에 절대 사용 불가한 한자들
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 하드블록 대상 한자 리스트
const HARD_BLOCK_CHARS = [
  // 🪲 벌레/동물 관련 (부정적)
  '虫', '蛆', '蟲', '蚊', '蠅', '蟻', '蛇', '蝎', '蠍', '蜈',

  // 💩 배설/불결 관련
  '屎', '尿', '糞', '粪', '膿', '穢', '臭', '腐', '爛',

  // 🦠 질병/고통 관련
  '病', '疾', '癌', '毒', '瘟', '疫', '痛', '痲', '癱', '瘋',
  '痴', '癩', '瘡', '疹', '瘤', '傷', '殘',

  // ☠️ 죽음/재앙 관련
  '死', '殺', '屍', '殃', '災', '禍', '凶', '喪', '哭', '悲',
  '棺', '墓', '墳', '葬', '祭', '弔',

  // 😈 악덕/범죄 관련
  '淫', '邪', '姦', '仇', '怨', '恨', '辱', '罪', '盜', '賊',
  '賂', '詐', '騙',

  // 🔪 폭력/무기 관련
  '刃', '刑', '刺', '劍', '槍', '砲', '彈', '爆', '炸',

  // 🌿 식물이지만 부적절한 의미
  '榇', // 두릅나무 유 - "관을 만드는 나무"
  '蓚', // 꼴 준 - "쇠나 말의 먹이"
  '莠', // 돌피 유 - "잡초"
  '稗', // 피 패 - "잡초"

  // 기타 부정적 의미
  '醜', '陋', '劣', '惡', '賤', '卑', '奴', '婢', '妾',
  '貧', '窮', '困', '厄', '難', '苦', '愁', '憂',
];

async function main() {
  console.log('🚑 긴급 하드블록 시작...\n');

  // 1. 차단 대상 확인
  const existingCount = await prisma.hanjaDict.count({
    where: {
      character: { in: HARD_BLOCK_CHARS },
      isGoodForNaming: true
    }
  });

  console.log(`📊 차단 대상: ${HARD_BLOCK_CHARS.length}자`);
  console.log(`📊 현재 isGoodForNaming=true인 차단 대상: ${existingCount}자\n`);

  if (existingCount === 0) {
    console.log('✅ 차단 대상 없음 - 이미 모두 차단됨');
    return;
  }

  // 2. 차단 대상 한자 상세 정보 출력
  const targets = await prisma.hanjaDict.findMany({
    where: {
      character: { in: HARD_BLOCK_CHARS },
      isGoodForNaming: true
    },
    select: {
      character: true,
      meaning: true,
      nameFrequency: true
    },
    orderBy: { nameFrequency: 'desc' }
  });

  console.log('🎯 차단할 한자 목록:');
  targets.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.character} - ${h.meaning} (빈도: ${h.nameFrequency || 0})`);
  });
  console.log();

  // 3. 하드블록 실행
  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: HARD_BLOCK_CHARS }
    },
    data: {
      isGoodForNaming: false,
      review: 'needs_review' // ReviewStatus enum - 차단된 한자는 리뷰 필요
    }
  });

  console.log(`✅ ${result.count}자 차단 완료\n`);

  // 4. 검증
  const remainingCount = await prisma.hanjaDict.count({
    where: {
      character: { in: HARD_BLOCK_CHARS },
      isGoodForNaming: true
    }
  });

  if (remainingCount === 0) {
    console.log('✅ 검증 성공: 모든 부적절 한자 차단됨');
  } else {
    console.log(`⚠️  경고: ${remainingCount}자가 여전히 isGoodForNaming=true`);
  }

  // 5. 통계 출력
  const stats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true
  });

  console.log('\n📊 최종 통계:');
  stats.forEach(s => {
    console.log(`  isGoodForNaming=${s.isGoodForNaming}: ${s._count}자`);
  });
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
