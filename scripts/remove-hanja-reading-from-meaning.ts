#!/usr/bin/env npx tsx
/**
 * 의미에서 한자 음 표기 제거
 * 예: "부드러울 유" → "부드러울"
 * 성씨는 관례상 유지: "성 유" → 그대로
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  한자 의미에서 음 표기 제거                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Step 1: 모든 한자 가져오기
  const allHanja = await prisma.hanjaDict.findMany({
    where: {
      isSurname: false  // 성씨가 아닌 것만
    },
    select: {
      id: true,
      character: true,
      meaning: true,
      koreanReading: true,
      isSurname: true
    }
  });

  console.log(`총 ${allHanja.length}개 한자 검사 중...\n`);

  let updated = 0;
  const updates: { id: number; oldMeaning: string; newMeaning: string }[] = [];

  for (const hanja of allHanja) {
    if (!hanja.meaning || !hanja.koreanReading) continue;

    const reading = hanja.koreanReading;
    const meaning = hanja.meaning;
    let newMeaning = meaning;

    // 제외 패턴 (단어의 일부인 경우)
    const skipPatterns = ['유자나무', '수유나무', '향유', '효유할'];
    const shouldSkip = skipPatterns.some(pattern => meaning.includes(pattern));

    // 성씨 패턴도 제외
    if (shouldSkip || meaning.startsWith('성 ')) {
      continue;
    }

    // 두음법칙 고려 (유↔류, 이↔리 등)
    const dueumMap: Record<string, string> = {
      '유': '류', '류': '유',
      '이': '리', '리': '이',
      '임': '림', '림': '임',
      '노': '로', '로': '노',
      '나': '라', '라': '나'
    };
    const alternateReading = dueumMap[reading];

    // 패턴 1: "xxx 유" 또는 "xxx 류" 끝나는 경우 → "xxx"
    if (meaning.endsWith(` ${reading}`)) {
      newMeaning = meaning.substring(0, meaning.length - reading.length - 1).trim();
    } else if (alternateReading && meaning.endsWith(` ${alternateReading}`)) {
      newMeaning = meaning.substring(0, meaning.length - alternateReading.length - 1).trim();
    }

    // 패턴 2: "xxx 유/yyy 유" → "xxx/yyy"
    if (newMeaning.includes(` ${reading}/`)) {
      newMeaning = newMeaning.replace(new RegExp(` ${reading}/`, 'g'), '/');
    }
    if (alternateReading && newMeaning.includes(` ${alternateReading}/`)) {
      newMeaning = newMeaning.replace(new RegExp(` ${alternateReading}/`, 'g'), '/');
    }

    if (newMeaning !== meaning) {
      updates.push({
        id: hanja.id,
        oldMeaning: meaning,
        newMeaning: newMeaning
      });
    }
  }

  // Step 2: 변경사항 미리보기
  console.log('변경될 한자 미리보기 (상위 20개):\n');
  updates.slice(0, 20).forEach((u, idx) => {
    const hanja = allHanja.find(h => h.id === u.id);
    console.log(`${idx + 1}. ${hanja?.character}`);
    console.log(`   Before: ${u.oldMeaning}`);
    console.log(`   After:  ${u.newMeaning}\n`);
  });

  console.log(`\n총 ${updates.length}개 한자 업데이트 예정\n`);

  // Step 3: 실제 업데이트
  if (updates.length > 0) {
    console.log('업데이트 시작...\n');

    for (const update of updates) {
      await prisma.hanjaDict.update({
        where: { id: update.id },
        data: { meaning: update.newMeaning }
      });
      updated++;

      if (updated % 100 === 0) {
        console.log(`  ${updated}개 업데이트...`);
      }
    }

    console.log(`\n✅ ${updated}개 한자 업데이트 완료!`);
  } else {
    console.log('변경할 한자가 없습니다.');
  }

  // Step 4: 검증
  console.log('\n검증 샘플:');
  const samples = await prisma.hanjaDict.findMany({
    where: {
      character: { in: ['柔', '宥', '柳'] }
    },
    select: {
      character: true,
      meaning: true,
      koreanReading: true
    }
  });

  console.table(samples);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
