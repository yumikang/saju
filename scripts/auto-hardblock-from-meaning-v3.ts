#!/usr/bin/env npx tsx
/**
 * 자동 의미 기반 하드블록 스크립트 (ver.3 - 정규표현식 기반)
 * ------------------------------------------
 * 작명에 어울리지 않는 한자를 의미 기반으로 자동 차단합니다.
 * v3: 정규표현식으로 완전 단어 매칭, false positive 최소화
 *
 * 실행 명령:
 *   npx tsx scripts/auto-hardblock-from-meaning-v3.ts --dry-run  (테스트)
 *   npx tsx scripts/auto-hardblock-from-meaning-v3.ts             (실제 적용)
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

// 화이트리스트 대폭 확장
const SAFE_EXCEPTIONS = [
  // 자연물이지만 긍정적 상징
  "花", "梅", "竹", "松", "蘭", "芳", "荷", "蓮", "菊", "柳", "桐", "楠", "榆",
  "星", "海", "山", "川", "湖", "江", "河", "水", "雨", "雪", "雲", "霞", "泉",
  "珍", "珠", "玉", "瑛", "瑜", "璟", "瑞", "璇", "琳", "琇", "琦", "瑩",
  "英", "秀", "麗", "美", "嬌", "妍", "姸", "嫣", "媛",
  "宇", "宙", "宸", "家", "安", "寧", "容", "宏",
  "樹", "林", "森", "木", "材", "栢",
  "民", "人", "仁", "伊", "佑", "侑", "俊", "傑",
  "地", "天", "明", "日", "月", "光", "輝", "曜",
  // 성씨도 안전 리스트에 포함
  "尹", "李", "劉", "文", "吳", "張", "趙", "陳", "楊", "孫", "金", "朴", "崔", "鄭",
  // 긍정적 의미의 한자들
  "由", "袖", "袂", "翤", "户", "戶", "而", "竽", "弦", "琴",
];

// 차단 규칙: 정규표현식으로 완전 매칭
interface BlockRule {
  pattern: RegExp;
  reason: string;
  category: 'negative' | 'plant' | 'animal' | 'tool';
}

const BLOCK_RULES: BlockRule[] = [
  // === 부정어 (완전 단어 매칭) ===
  { pattern: /^똥$/, reason: '배설물', category: 'negative' },
  { pattern: /^오줌$/, reason: '배설물', category: 'negative' },
  { pattern: /^분뇨$/, reason: '배설물', category: 'negative' },
  { pattern: /^고름$/, reason: '불결', category: 'negative' },
  { pattern: /^더러울$/, reason: '불결', category: 'negative' },
  { pattern: /^죽음$/, reason: '죽음', category: 'negative' },
  { pattern: /^주검$/, reason: '죽음', category: 'negative' },
  { pattern: /^시체$/, reason: '죽음', category: 'negative' },
  { pattern: /^무덤$/, reason: '죽음', category: 'negative' },
  { pattern: /^문둥병$/, reason: '질병', category: 'negative' },
  { pattern: /^악창$/, reason: '질병', category: 'negative' },
  { pattern: /^두창$/, reason: '질병', category: 'negative' },
  { pattern: /^염병$/, reason: '질병', category: 'negative' },
  { pattern: /^재앙$/, reason: '흉의', category: 'negative' },
  { pattern: /^귀신$/, reason: '음습', category: 'negative' },
  { pattern: /^마귀$/, reason: '음습', category: 'negative' },
  { pattern: /^요괴$/, reason: '음습', category: 'negative' },
  { pattern: /^도깨비$/, reason: '음습', category: 'negative' },

  // === 식물명 (구체적 패턴) ===
  { pattern: /풀$/, reason: '식물명', category: 'plant' }, // ~풀로 끝나는 것
  { pattern: /^(오동|느릅|두릅|버드|뽕|밤|유자|수유|측백|포도)나무$/, reason: '나무명', category: 'plant' },
  { pattern: /^(이끼|버섯|잡초|수초|갈대|억새|쑥|마름)$/, reason: '식물명', category: 'plant' },

  // === 동물명 (완전 단어) ===
  { pattern: /^(쥐|돼지|개미|모기|파리|거미|구더기|메뚜기)$/, reason: '동물/곤충명', category: 'animal' },
  { pattern: /^(물고기|새우|조개|꽃게|갈거미|왕개미)$/, reason: '동물/곤충명', category: 'animal' },

  // === 도구/물건 (명확한 패턴) ===
  { pattern: /^(칼|도끼|창|활|방패|수레|낚시|가마|관|솥)$/, reason: '도구명', category: 'tool' },
];

function shouldBlock(char: string, meaning: string): { block: boolean; reason?: string } {
  // 화이트리스트 체크
  if (SAFE_EXCEPTIONS.includes(char)) {
    return { block: false };
  }

  // 의미가 없거나 너무 짧으면 패스
  if (!meaning || meaning.length < 1) {
    return { block: false };
  }

  // 규칙 기반 필터링
  for (const rule of BLOCK_RULES) {
    if (rule.pattern.test(meaning)) {
      return { block: true, reason: rule.reason };
    }
  }

  return { block: false };
}

async function main() {
  console.log(`🔍 의미 기반 하드블록 탐지 시작 (v3 - 정규표현식)...`);
  if (DRY_RUN) {
    console.log(`⚠️  DRY-RUN 모드: DB 변경하지 않음\n`);
  } else {
    console.log(`⚠️  실제 적용 모드: DB 업데이트 진행\n`);
  }

  // 현재 상태 확인
  const totalCount = await prisma.hanjaDict.count();
  const currentBadCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false }
  });
  const currentGoodCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  console.log(`📊 현재 상태:`);
  console.log(`  전체: ${totalCount}자`);
  console.log(`  isGoodForNaming=false: ${currentBadCount}자`);
  console.log(`  isGoodForNaming=true: ${currentGoodCount}자\n`);

  const hanjas = await prisma.hanjaDict.findMany({
    where: {
      meaning: { not: null },
      isGoodForNaming: true
    },
    select: { id: true, character: true, meaning: true },
  });

  console.log(`🎯 검사 대상: ${hanjas.length}자\n`);

  let updated = 0;
  let skipped = 0;
  const blockedList: Array<{ char: string; meaning: string; reason: string }> = [];

  for (const h of hanjas) {
    const meaning = h.meaning ?? "";
    const char = h.character;

    const result = shouldBlock(char, meaning);

    if (result.block && result.reason) {
      if (!DRY_RUN) {
        await prisma.hanjaDict.update({
          where: { id: h.id },
          data: {
            isGoodForNaming: false,
            review: 'needs_review'
          },
        });
      }
      updated++;
      blockedList.push({ char, meaning, reason: result.reason });

      // 처음 100개만 출력
      if (updated <= 100) {
        console.log(`${DRY_RUN ? '🔸' : '🚫'} 차단: ${char} - ${meaning} [${result.reason}]`);
      }
    } else {
      skipped++;
    }
  }

  if (updated > 100) {
    console.log(`... 외 ${updated - 100}자 더 차단됨\n`);
  }

  // 최종 통계
  if (!DRY_RUN) {
    const finalBadCount = await prisma.hanjaDict.count({
      where: { isGoodForNaming: false }
    });
    const finalGoodCount = await prisma.hanjaDict.count({
      where: { isGoodForNaming: true }
    });

    console.log(`\n✅ 완료!`);
    console.log(`  새로 차단: ${updated}자`);
    console.log(`  유지: ${skipped}자`);
    console.log(`\n📊 최종 통계:`);
    console.log(`  isGoodForNaming=false: ${currentBadCount} → ${finalBadCount}자 (+${finalBadCount - currentBadCount})`);
    console.log(`  isGoodForNaming=true: ${currentGoodCount} → ${finalGoodCount}자 (-${currentGoodCount - finalGoodCount})`);
  } else {
    console.log(`\n📊 DRY-RUN 결과:`);
    console.log(`  차단 예정: ${updated}자`);
    console.log(`  유지 예정: ${skipped}자`);
    console.log(`  예상 최종: isGoodForNaming=true ${currentGoodCount - updated}자`);
  }

  // 이유별 통계
  console.log(`\n📈 차단 사유별 통계:`);
  const reasonStats = new Map<string, number>();
  blockedList.forEach(({ reason }) => {
    reasonStats.set(reason, (reasonStats.get(reason) || 0) + 1);
  });

  Array.from(reasonStats.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count}자`);
    });

  // 차단 대상 샘플 출력 (DRY-RUN 시 유용)
  if (DRY_RUN && blockedList.length > 0) {
    console.log(`\n📋 차단 대상 샘플 (처음 30개):`);
    blockedList.slice(0, 30).forEach(({ char, meaning, reason }) => {
      console.log(`  ${char} - ${meaning} [${reason}]`);
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
