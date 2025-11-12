#!/usr/bin/env npx tsx
/**
 * 자동 의미 기반 하드블록 스크립트 (ver.1)
 * ------------------------------------------
 * 작명에 어울리지 않는 한자를 의미 기반으로 자동 차단합니다.
 * (예: 식물명, 동물명, 도구, 지명 등)
 *
 * 실행 명령:
 *   npx tsx scripts/auto-hardblock-from-meaning.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const HARD_BLOCK_KEYWORDS = [
  // 자연물
  "풀", "꽃", "잎", "나무", "열매", "뿌리", "씨", "줄기",
  "산", "강", "물", "바다", "바위", "돌", "흙", "모래", "늪", "못",
  "새", "말", "소", "돼지", "개", "쥐", "닭", "고양이", "호랑이", "사자", "용",
  "벌레", "모기", "개미", "거미", "파리", "구더기", "나비", "벌", "메뚜기", "모충",
  "조개", "고기", "물고기", "게", "새우",
  // 도구/물건
  "칼", "도끼", "창", "활", "방패", "기구", "도구", "그릇", "솥", "배", "돛", "집", "문", "울타리", "수레", "바퀴",
  "솜", "베", "천", "실", "끈", "줄", "낚시", "망", "물건", "기계", "기기",
  // 식물명/곡식
  "대나무", "벼", "보리", "콩", "깨", "쌀", "곡식", "잎사귀", "뿌리", "과일", "버섯", "이끼", "잡초", "수초",
  // 특수명사/지명
  "성", "나라", "도시", "고을", "지명", "땅", "지역", "관", "묘", "무덤", "절", "사찰",
  // 추상 부정어 (보조 필터)
  "더럽", "냄새", "피", "죽음", "병", "독", "벌레", "괴물", "요괴", "귀신",
  "죄", "벌", "한", "원망", "슬픔", "눈물", "고통", "근심",
];

// 예외 화이트리스트 (자연물 단어 포함돼도 이름으로 쓰이는 글자)
const SAFE_EXCEPTIONS = [
  "花", "梅", "竹", "松", "蘭", "芳", "荷", "蓮", "菊", // 자연/꽃 중에서도 작명에 자주 쓰임
  "星", "海", "山", "川", "湖", // 자연물 중에서도 긍정 상징
];

async function main() {
  console.log("🔍 의미 기반 하드블록 탐지 시작...\n");

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
      isGoodForNaming: true // 아직 차단되지 않은 것만
    },
    select: { id: true, character: true, meaning: true, isGoodForNaming: true },
  });

  console.log(`🎯 검사 대상: ${hanjas.length}자\n`);

  let updated = 0;
  let skipped = 0;
  const blockedList: Array<{ char: string; meaning: string; keyword: string }> = [];

  for (const h of hanjas) {
    const meaning = h.meaning ?? "";
    const char = h.character;

    // 화이트리스트 예외 처리
    if (SAFE_EXCEPTIONS.includes(char)) {
      skipped++;
      continue;
    }

    // 의미 기반 필터링
    const matchedKeyword = HARD_BLOCK_KEYWORDS.find((kw) => meaning.includes(kw));

    if (matchedKeyword) {
      await prisma.hanjaDict.update({
        where: { id: h.id },
        data: {
          isGoodForNaming: false,
          review: 'needs_review'
        },
      });
      updated++;
      blockedList.push({ char, meaning, keyword: matchedKeyword });

      // 처음 50개만 출력
      if (updated <= 50) {
        console.log(`🚫 차단: ${char} - ${meaning} [키워드: ${matchedKeyword}]`);
      }
    }
  }

  if (updated > 50) {
    console.log(`... 외 ${updated - 50}자 더 차단됨\n`);
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
  console.log(`  예외 처리: ${skipped}자`);
  console.log(`\n📊 최종 통계:`);
  console.log(`  isGoodForNaming=false: ${currentBadCount} → ${finalBadCount}자 (+${finalBadCount - currentBadCount})`);
  console.log(`  isGoodForNaming=true: ${currentGoodCount} → ${finalGoodCount}자 (-${currentGoodCount - finalGoodCount})`);

  // 키워드별 통계
  console.log(`\n📈 키워드별 차단 통계 (상위 20개):`);
  const keywordStats = new Map<string, number>();
  blockedList.forEach(({ keyword }) => {
    keywordStats.set(keyword, (keywordStats.get(keyword) || 0) + 1);
  });

  Array.from(keywordStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([keyword, count]) => {
      console.log(`  ${keyword}: ${count}자`);
    });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
