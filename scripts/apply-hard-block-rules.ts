#!/usr/bin/env npx tsx
/**
 * 하드차단 룰 적용 (3단계 필터 - 단계 A)
 * 1. 인체/생리 키워드
 * 2. 질병/재앙/죽음 키워드
 * 3. 부수 기반 차단 (예외 화이트리스트 포함)
 * 4. 유니코드 확장영역 차단
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 하드차단 키워드 (의미에 포함 시 차단)
const HARD_BLOCK_KEYWORDS = [
  // 인체/생리
  '젖', '똥', '오줌', '소변', '대변', '피', '피묻', '냄새', '고름', '땀', '침',
  // 질병/재앙/죽음
  '병', '질병', '암', '독', '재앙', '화', '죽음', '살', '주검', '시체', '흉', '슬픔', '근심', '우울',
  // 추가 생리/신체
  '배설', '분비', '체액', '상처', '궤양', '염증',
];

// 하드차단 한자 (직접 지정)
const HARD_BLOCK_CHARS = [
  '乳', '屎', '尿', '血', '膿', '汗', '唾', '涎', // 인체/생리
  '病', '疾', '癌', '毒', '疼', '痛', '痒', '瘡', '疲', // 질병
  '災', '禍', '凶', '厄', '殃', '咎', '殺', '死', '屍', '喪', '弔', // 재앙/죽음
  '愁', '憂', '悲', '哀', '嘆', '泣', '慟', // 슬픔
];

// 부수 기반 차단 (예외 있음)
const HARD_BLOCK_RADICALS = [
  '疒', // 병질엄
  '歹', // 죽을 알
  '尸', // 주검 시
  '鬼', // 귀신 귀
];

// 예외 화이트리스트 (부수가 나쁘지만 의미는 좋은 경우)
const RADICAL_EXCEPTIONS: Record<string, string[]> = {
  '疒': ['痊', '癒'], // 나을 전, 나을 유 - 치유의 의미
  '歹': [], // 예외 없음
  '尸': ['屆'], // 이를 계 - 도달의 의미
  '鬼': ['魂', '魄'], // 넋 혼, 넋 백 - 정신의 의미
};

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  하드차단 룰 적용 (단계 A)                 ║');
  console.log('╚════════════════════════════════════════════╝\n');

  let totalBlocked = 0;

  // Step 1: 키워드 기반 차단
  console.log('Step 1: 키워드 기반 차단\n');

  for (const keyword of HARD_BLOCK_KEYWORDS) {
    const result = await prisma.hanjaDict.updateMany({
      where: {
        meaning: { contains: keyword },
        isGoodForNaming: { not: false }, // 이미 FALSE가 아닌 것만
        isSurname: false, // 성씨 제외
      },
      data: {
        isGoodForNaming: false,
      },
    });

    if (result.count > 0) {
      console.log(`  "${keyword}" 포함: ${result.count}개 차단`);
      totalBlocked += result.count;
    }
  }

  // Step 2: 직접 지정 한자 차단
  console.log('\nStep 2: 직접 지정 한자 차단\n');

  const directResult = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: HARD_BLOCK_CHARS },
      isGoodForNaming: { not: false },
      isSurname: false,
    },
    data: {
      isGoodForNaming: false,
    },
  });

  console.log(`  직접 지정 한자: ${directResult.count}개 차단`);
  totalBlocked += directResult.count;

  // Step 3: 부수 기반 차단 (예외 제외)
  console.log('\nStep 3: 부수 기반 차단\n');

  for (const radical of HARD_BLOCK_RADICALS) {
    const exceptions = RADICAL_EXCEPTIONS[radical] || [];

    // radical 필드가 없으므로 meaning으로 근사 (나중에 radical 필드 추가 필요)
    // 일단 직접 알려진 한자 리스트로 처리
    const radicalChars = await prisma.hanjaDict.findMany({
      where: {
        meaning: { contains: radical },
        character: { notIn: exceptions },
        isGoodForNaming: { not: false },
        isSurname: false,
      },
      select: { character: true },
    });

    if (radicalChars.length > 0) {
      const result = await prisma.hanjaDict.updateMany({
        where: {
          character: { in: radicalChars.map(c => c.character) },
          isGoodForNaming: { not: false },
          isSurname: false,
        },
        data: {
          isGoodForNaming: false,
        },
      });

      console.log(`  부수 "${radical}": ${result.count}개 차단 (예외: ${exceptions.length}개)`);
      totalBlocked += result.count;
    }
  }

  // Step 4: 유니코드 확장영역 차단 (CJK Ext. B 이상)
  console.log('\nStep 4: 유니코드 확장영역 차단\n');

  const extResult = await prisma.hanjaDict.updateMany({
    where: {
      codepoint: { gte: 0x20000 }, // CJK Ext. B 시작
      isGoodForNaming: { not: false },
      isSurname: false,
    },
    data: {
      isGoodForNaming: false,
    },
  });

  console.log(`  확장영역(U+20000+): ${extResult.count}개 차단`);
  totalBlocked += extResult.count;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 총 ${totalBlocked}개 한자 하드차단 완료`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 검증: 최종 통계
  const stats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true,
    where: { isSurname: false },
  });

  console.log('최종 통계 (비성씨):');
  stats.forEach(stat => {
    const label = stat.isGoodForNaming === true ? '✅ TRUE (검증됨)'
                : stat.isGoodForNaming === false ? '🚫 FALSE (차단됨)'
                : '❓ NULL (미분류)';
    console.log(`  ${label}: ${stat._count}개`);
  });
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
