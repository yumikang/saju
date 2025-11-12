#!/usr/bin/env npx tsx
/**
 * 자주 쓰이는 한자들의 획수와 오행을 검증
 * 웹 검색 결과와 비교
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 웹 검색으로 확인한 정확한 획수 (강희자전 기준)
const CORRECT_STROKES: Record<string, { strokes: number; element: string }> = {
  '有': { strokes: 6, element: 'WATER' },   // 있을 유
  '美': { strokes: 9, element: 'METAL' },   // 아름다울 미
  '宥': { strokes: 9, element: 'METAL' },   // 너그러울 유
  '柔': { strokes: 9, element: 'METAL' },   // 부드러울 유
  '瑜': { strokes: 13, element: 'WOOD' },   // 구슬 유
  '民': { strokes: 5, element: 'EARTH' },   // 백성 민
  '敏': { strokes: 11, element: 'WATER' },  // 민첩할 민
  '準': { strokes: 13, element: 'WOOD' },   // 준할 준
  '俊': { strokes: 9, element: 'METAL' },   // 준걸 준
  '書': { strokes: 10, element: 'EARTH' },  // 글 서
  '瑞': { strokes: 13, element: 'WOOD' },   // 상서로울 서
  '賢': { strokes: 15, element: 'EARTH' },  // 어질 현
  '玄': { strokes: 5, element: 'EARTH' },   // 검을 현
  '眞': { strokes: 10, element: 'EARTH' },  // 참 진
  '振': { strokes: 10, element: 'EARTH' },  // 떨칠 진
};

// 오행 계산 (획수 끝자리로)
function calculateElement(strokes: number): string {
  const lastDigit = strokes % 10;
  const elementMap: Record<number, string> = {
    1: 'WATER', 6: 'WATER',
    2: 'FIRE', 7: 'FIRE',
    3: 'WOOD', 8: 'WOOD',
    4: 'METAL', 9: 'METAL',
    5: 'EARTH', 0: 'EARTH',
  };
  return elementMap[lastDigit] || 'UNKNOWN';
}

async function main() {
  console.log('='.repeat(80));
  console.log('한자 획수 및 오행 검증');
  console.log('='.repeat(80));

  const characters = Object.keys(CORRECT_STROKES);

  for (const char of characters) {
    const dbData = await prisma.hanjaDict.findFirst({
      where: { character: char },
      select: { character: true, meaning: true, strokes: true, element: true }
    });

    if (!dbData) {
      console.log(`\n❓ ${char}: 데이터베이스에 없음`);
      continue;
    }

    const correct = CORRECT_STROKES[char];
    const correctElement = calculateElement(correct.strokes);
    const dbMatches = dbData.strokes === correct.strokes && dbData.element === correctElement;

    console.log(`\n${dbMatches ? '✅' : '❌'} ${char} (${dbData.meaning})`);
    console.log(`   DB: ${dbData.strokes}획 → ${dbData.element}`);
    console.log(`   실제: ${correct.strokes}획 → ${correctElement}`);

    if (!dbMatches) {
      console.log(`   ⚠️  불일치! 수정 필요`);
    }
  }

  // 통계
  const allHanja = await prisma.hanjaDict.count();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`총 ${characters.length}개 샘플 중 검증 완료`);
  console.log(`전체 데이터베이스: ${allHanja}개 한자`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
