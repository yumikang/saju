#!/usr/bin/env npx tsx
/**
 * Show first 25 "유" characters in stroke order
 * This shows what the user will see when scrolling the dropdown
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const results = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: { in: ['유', '류'] },
      isGoodForNaming: true,
      inferredNameFrequency: { gt: 0 },
      nameFrequency: { gte: 50 }
    },
    select: {
      character: true,
      meaning: true,
      strokes: true,
      element: true,
    },
    orderBy: [
      { strokes: 'asc' },
      { id: 'asc' }
    ],
    take: 25
  });

  console.log('\n=== "유" 드롭다운 - 획수순 상위 25개 ===\n');
  console.log('💡 드롭다운은 한 번에 3-4개만 보이고 스크롤이 필요합니다.\n');

  // Group by what would be visible in viewport
  const groups = [
    { name: '🟢 처음 보이는 항목 (1-4)', range: [0, 4] },
    { name: '🔵 한 번 스크롤 (5-8)', range: [4, 8] },
    { name: '🟡 두 번 스크롤 (9-12)', range: [8, 12] },
    { name: '🟠 세 번 스크롤 (13-16)', range: [12, 16] },
    { name: '🔴 네 번 스크롤 (17-20)', range: [16, 20] },
    { name: '🟣 다섯 번 스크롤 (21-25)', range: [20, 25] },
  ];

  groups.forEach(group => {
    console.log(`\n${group.name}`);
    console.log('─'.repeat(50));
    results.slice(group.range[0], group.range[1]).forEach((h, relIdx) => {
      const absoluteIdx = group.range[0] + relIdx + 1;
      const marker = h.character === '有' ? '👉 ' : '   ';
      const elementKr = {
        'WOOD': '목', 'FIRE': '화', 'EARTH': '토',
        'METAL': '금', 'WATER': '수'
      }[h.element || ''] || '?';
      console.log(`${marker}${absoluteIdx}. ${h.character} (${h.meaning}) - ${h.strokes}획 • ${elementKr}행`);
    });
  });

  const youIndex = results.findIndex(h => h.character === '有');
  if (youIndex >= 0) {
    console.log(`\n\n✅ 有는 ${youIndex + 1}번째에 있습니다!`);
    console.log(`📍 위치: ${youIndex < 4 ? '처음 보임' : `${Math.floor(youIndex / 4)}번 스크롤 필요`}`);
  }

  console.log('\n💡 사용 방법:');
  console.log('   1. "유" 드롭다운을 클릭하여 열기');
  console.log('   2. 마우스 휠이나 스크롤바로 아래로 스크롤');
  console.log('   3. 또는 키보드 화살표 ↓↓↓ 키로 이동\n');
}

main().finally(() => prisma.$disconnect());
