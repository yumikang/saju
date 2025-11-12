#!/usr/bin/env npx tsx
/**
 * 자동 의미 기반 하드블록 스크립트 (ver.2 - 정교화)
 * ------------------------------------------
 * 작명에 어울리지 않는 한자를 의미 기반으로 자동 차단합니다.
 * v2: 화이트리스트 확장, 패턴 매칭 정교화, 부정어 중심 필터링
 *
 * 실행 명령:
 *   npx tsx scripts/auto-hardblock-from-meaning-v2.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 명백한 부정적 키워드 (변경 없음)
const NEGATIVE_KEYWORDS = [
  // 부정어/질병/재앙
  "더럽", "냄새", "피", "죽음", "병", "독", "괴물", "요괴", "귀신",
  "죄", "벌", "원망", "슬픔", "눈물", "고통", "근심", "한탄",
];

// 식물명 패턴 (더 구체적으로)
const PLANT_PATTERNS = [
  "~풀", "~나무", "이끼", "버섯", "잡초", "수초", "모시풀",
  "오동나무", "느릅나무", "두릅나무", "버드나무", "뽕나무", "밤나무",
  "대나무", "갈대", "띠풀", "억새", "쑥", "쇠비름", "마름",
];

// 동물/곤충 (구체적 이름만)
const ANIMAL_PATTERNS = [
  "개미", "모기", "파리", "구더기", "메뚜기", "거미", "벌레",
  "쥐", "돼지", "개", "말", "소", "닭", "고양이",
  "물고기", "게", "새우", "조개",
];

// 도구/물건 (일상적이지 않은 것만)
const TOOL_PATTERNS = [
  "칼", "도끼", "창", "활", "방패", "수레", "바퀴", "낚시", "망",
  "솥", "관", "무덤", "묘", "가마", "돛",
];

// 화이트리스트 대폭 확장 (이름에 자주 쓰이는 한자)
const SAFE_EXCEPTIONS = [
  // 자연물이지만 긍정적 상징
  "花", "梅", "竹", "松", "蘭", "芳", "荷", "蓮", "菊", "柳", "桐", "楠", "榆",
  "星", "海", "山", "川", "湖", "江", "河", "水", "雨", "雪", "雲", "霞",
  "珍", "珠", "玉", "瑛", "瑜", "璟", "瑞", "璇", "琳", "琇", "琦", "瑩",
  "英", "秀", "麗", "美", "嬌", "妍", "姸", "嫣", "媛",
  "宇", "宙", "宸", "家", "安", "寧", "容", "宏",
  "樹", "林", "森", "木", "材",
  "民", "人", "仁", "伊", "佑", "侑", "俊", "傑",
  "地", "天", "明", "日", "月", "光", "輝", "曜",
  // 성씨도 안전 리스트에 포함
  "尹", "李", "劉", "文", "吳", "張", "趙", "陳", "楊", "孫", "金", "朴", "崔", "鄭",
];

function shouldBlock(char: string, meaning: string): { block: boolean; reason?: string } {
  // 화이트리스트 체크
  if (SAFE_EXCEPTIONS.includes(char)) {
    return { block: false };
  }

  // 1. 명백한 부정어
  for (const kw of NEGATIVE_KEYWORDS) {
    if (meaning.includes(kw)) {
      return { block: true, reason: `부정어: ${kw}` };
    }
  }

  // 2. 식물명 패턴
  for (const pattern of PLANT_PATTERNS) {
    if (pattern.startsWith("~")) {
      // 패턴 매칭: "~풀"이면 "모시풀", "띠풀" 등
      const suffix = pattern.slice(1);
      if (meaning.endsWith(suffix) && meaning.length > suffix.length + 1) {
        return { block: true, reason: `식물명: ${pattern}` };
      }
    } else {
      // 직접 매칭
      if (meaning.includes(pattern)) {
        return { block: true, reason: `식물명: ${pattern}` };
      }
    }
  }

  // 3. 동물/곤충
  for (const animal of ANIMAL_PATTERNS) {
    if (meaning.includes(animal)) {
      return { block: true, reason: `동물명: ${animal}` };
    }
  }

  // 4. 도구/물건
  for (const tool of TOOL_PATTERNS) {
    if (meaning.includes(tool)) {
      return { block: true, reason: `도구명: ${tool}` };
    }
  }

  return { block: false };
}

async function main() {
  console.log("🔍 의미 기반 하드블록 탐지 시작 (v2 - 정교화)...\n");

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
      await prisma.hanjaDict.update({
        where: { id: h.id },
        data: {
          isGoodForNaming: false,
          review: 'needs_review'
        },
      });
      updated++;
      blockedList.push({ char, meaning, reason: result.reason });

      // 처음 100개만 출력
      if (updated <= 100) {
        console.log(`🚫 차단: ${char} - ${meaning} [${result.reason}]`);
      }
    } else {
      skipped++;
    }
  }

  if (updated > 100) {
    console.log(`... 외 ${updated - 100}자 더 차단됨\n`);
  }

  // 최종 통계
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

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
