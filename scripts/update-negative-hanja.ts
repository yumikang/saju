/**
 * Update negative/inauspicious hanja characters
 *
 * Marks characters with negative connotations as not suitable for naming.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 작명에 부적합한 한자 (부정적 의미)
const NEGATIVE_CHARACTERS = [
  // 죽음/재난 관련
  '死', '亡', '喪', '殺', '殺', '屠', '刑', '斬',

  // 질병 관련
  '病', '患', '疾', '痛', '傷', '殘', '弱',

  // 재난/불행 관련
  '災', '禍', '凶', '惡', '危', '險', '害', '難',

  // 가난/실패 관련
  '貧', '窮', '困', '敗', '衰', '破', '亡', '喪',

  // 부정적 감정
  '苦', '悲', '哀', '憂', '愁', '怨', '恨', '恥',

  // 추가 부정적 의미
  '賤', '卑', '陋', '醜', '劣', '拙', '僞', '欺',
  '盜', '奸', '詐', '騙', '妖', '魔', '鬼', '怪',
];

// 성별이 명확한 한자들 (선택적 업데이트)
const MALE_CHARACTERS = [
  '雄', '男', '夫', '父', '子', '兄', '弟', '公', '侯', '將', '帥', '武',
];

const FEMALE_CHARACTERS = [
  '淑', '姬', '娥', '妍', '嬪', '姸', '娟', '妃', '姝', '媛', '婉', '嬌',
];

async function main() {
  console.log('🔄 한자 데이터 업데이트 시작...\n');

  // 1. 부정적 한자 업데이트
  console.log('1️⃣ 부정적 한자 마킹...');
  const negativeUpdate = await prisma.hanjaDict.updateMany({
    where: {
      character: {
        in: NEGATIVE_CHARACTERS,
      },
    },
    data: {
      isGoodForNaming: false,
    },
  });
  console.log(`✓ ${negativeUpdate.count}개 한자를 작명 부적합으로 표시\n`);

  // 2. 남성 선호 한자 업데이트 (선택적)
  console.log('2️⃣ 남성 선호 한자 업데이트...');
  const maleUpdate = await prisma.hanjaDict.updateMany({
    where: {
      character: {
        in: MALE_CHARACTERS,
      },
    },
    data: {
      gender: 'male',
    },
  });
  console.log(`✓ ${maleUpdate.count}개 한자를 남성 선호로 표시\n`);

  // 3. 여성 선호 한자 업데이트 (선택적)
  console.log('3️⃣ 여성 선호 한자 업데이트...');
  const femaleUpdate = await prisma.hanjaDict.updateMany({
    where: {
      character: {
        in: FEMALE_CHARACTERS,
      },
    },
    data: {
      gender: 'female',
    },
  });
  console.log(`✓ ${femaleUpdate.count}개 한자를 여성 선호로 표시\n`);

  // 4. 통계 확인
  console.log('📊 업데이트 통계:');
  const totalCount = await prisma.hanjaDict.count();
  const goodCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true },
  });
  const badCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false },
  });
  const maleCount = await prisma.hanjaDict.count({
    where: { gender: 'male' },
  });
  const femaleCount = await prisma.hanjaDict.count({
    where: { gender: 'female' },
  });

  console.log(`전체 한자: ${totalCount}개`);
  console.log(`작명 적합: ${goodCount}개`);
  console.log(`작명 부적합: ${badCount}개`);
  console.log(`남성 선호: ${maleCount}개`);
  console.log(`여성 선호: ${femaleCount}개`);

  console.log('\n✅ 업데이트 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
