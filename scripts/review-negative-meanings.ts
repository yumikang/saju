#!/usr/bin/env npx tsx
/**
 * 부정적 의미 한자 수동 검토
 *
 * analyze-all-meanings.ts에서 발견된 9개 부정적 의미 한자를
 * 상세 검토하여 isGoodForNaming=false 처리 또는 meaning 개선 결정
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 부정적 의미 키워드
const NEGATIVE_KEYWORDS = [
  '주검', '시', '죽', '병', '재앙', '슬', '아픔', '악', '흉'
];

async function main() {
  console.log('\n🚫 부정적 의미 한자 상세 검토\n');
  console.log('='.repeat(80) + '\n');

  // 부정적 키워드가 포함된 한자 조회
  const negativeChars = await prisma.hanjaDict.findMany({
    where: {
      isGoodForNaming: true,
      OR: NEGATIVE_KEYWORDS.map(keyword => ({
        meaning: { contains: keyword }
      }))
    },
    select: {
      character: true,
      koreanReading: true,
      meaning: true,
      nameFrequency: true,
      element: true,
      seedProtected: true,
      genderHint: true
    },
    orderBy: { nameFrequency: 'desc' }
  });

  console.log(`발견된 부정적 의미 한자: ${negativeChars.length}개\n`);

  if (negativeChars.length === 0) {
    console.log('✅ 부정적 의미 한자가 없습니다!\n');
    return;
  }

  console.log('┌─────┬────┬──────┬────────────────┬──────┬──────┬──────┬──────┐');
  console.log('│ No. │ 한자│ 읽기 │ meaning        │ 빈도 │ 오행 │성별  │ Seed │');
  console.log('├─────┼────┼──────┼────────────────┼──────┼──────┼──────┼──────┤');

  negativeChars.forEach((char, idx) => {
    const no = String(idx + 1).padStart(3);
    const character = char.character.padEnd(2);
    const reading = (char.koreanReading || '-').padEnd(4);
    const meaning = (char.meaning || '-').padEnd(16);
    const freq = String(char.nameFrequency || 0).padStart(4);
    const element = (char.element || '-').padEnd(5);
    const gender = (char.genderHint || '-').padEnd(5);
    const seed = char.seedProtected ? '  ✓' : '   ';

    console.log(`│ ${no} │ ${character} │ ${reading} │ ${meaning} │ ${freq} │ ${element} │ ${gender} │ ${seed} │`);
  });

  console.log('└─────┴────┴──────┴────────────────┴──────┴──────┴──────┴──────┘\n');

  // 처리 권장 사항
  console.log('📋 처리 권장 사항:\n');
  console.log('🔴 즉시 제외 (isGoodForNaming=false):');
  console.log('   - "주검", "죽일", "재앙" → 명백히 부정적\n');

  console.log('🟡 meaning 개선 고려:');
  console.log('   - "병" → 일부는 "항아리 병(甁/瓶)"일 수 있음');
  console.log('   - 한자 의미 재확인 후 결정\n');

  console.log('⚠️  Seed 보호 한자:');
  const seedProtected = negativeChars.filter(c => c.seedProtected);
  if (seedProtected.length > 0) {
    console.log(`   ${seedProtected.length}개 발견 - 수동 검토 필수!`);
    seedProtected.forEach(c => {
      console.log(`   - ${c.character} (${c.koreanReading}): ${c.meaning}`);
    });
  } else {
    console.log('   없음 ✅');
  }

  console.log('\n' + '='.repeat(80) + '\n');
  console.log('다음 단계:');
  console.log('1. 각 한자의 정확한 의미 확인 (한자 사전 참고)');
  console.log('2. isGoodForNaming=false 처리 또는 meaning 개선 결정');
  console.log('3. scripts/fix-negative-meanings.ts 스크립트 작성\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
