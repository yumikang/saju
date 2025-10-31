/**
 * Comprehensive meaning field analysis
 * Analyzes all 2,748 good-for-naming characters
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 전체 작명 한자 meaning 필드 분석\n');
  console.log('='.repeat(80));

  // Get all good-for-naming characters
  const allGoodHanja = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true },
    select: {
      character: true,
      meaning: true,
      element: true,
      strokes: true,
      nameFrequency: true,
      seedProtected: true,
    },
    orderBy: { nameFrequency: 'desc' },
  });

  console.log(`\n📊 총 ${allGoodHanja.length}개 한자 분석 중...\n`);

  // Pattern categories
  const patterns = {
    ideal: {
      name: '✅ 이상적 형식',
      patterns: [
        /^[가-힣]+\s+[가-힣]{1,2}$/,  // "밝을 명" 형식
        /^[가-힣]+\s+[가-힣]{1,2}\([^)]+\)$/,  // "밝을 철(슬기로움)" 형식
        /^[가-힣]+\s+[가-힣]{1,2}\/[가-힣]+\s+[가-힣]{1,2}$/,  // "밝을 명/빛날 명" 형식
      ],
      matches: [] as typeof allGoodHanja,
    },
    specificNouns: {
      name: '⚠️  구체명사 (나무, 산, 물)',
      patterns: [
        /나무/,
        /이름/,
        /산이름/,
        /물이름/,
        /꽃이름/,
      ],
      matches: [] as typeof allGoodHanja,
    },
    tools: {
      name: '⚠️  도구명/일상용품',
      patterns: [
        /가마/,
        /그릇/,
        /수레/,
        /도구/,
      ],
      matches: [] as typeof allGoodHanja,
    },
    verbs: {
      name: '⚠️  동사형 종결',
      patterns: [
        /할\s*\w+$/,
      ],
      matches: [] as typeof allGoodHanja,
    },
    negative: {
      name: '🚫 부정적 의미',
      patterns: [
        /^(죽을|병|악할|흉할|재앙|해칠|주검|죽일|쇠할|망할|깨질|상할|해로울)/,
      ],
      matches: [] as typeof allGoodHanja,
    },
    empty: {
      name: '❌ meaning 없음',
      patterns: [],
      matches: [] as typeof allGoodHanja,
    },
  };

  // Classify each character
  for (const hanja of allGoodHanja) {
    if (!hanja.meaning) {
      patterns.empty.matches.push(hanja);
      continue;
    }

    let classified = false;

    // Check negative first (highest priority)
    if (patterns.negative.patterns.some(p => p.test(hanja.meaning!))) {
      patterns.negative.matches.push(hanja);
      classified = true;
      continue;
    }

    // Check ideal format
    if (patterns.ideal.patterns.some(p => p.test(hanja.meaning!))) {
      patterns.ideal.matches.push(hanja);
      classified = true;
      continue;
    }

    // Check problematic patterns
    if (patterns.specificNouns.patterns.some(p => p.test(hanja.meaning!))) {
      patterns.specificNouns.matches.push(hanja);
      classified = true;
    }

    if (patterns.tools.patterns.some(p => p.test(hanja.meaning!))) {
      patterns.tools.matches.push(hanja);
      classified = true;
    }

    if (patterns.verbs.patterns.some(p => p.test(hanja.meaning!))) {
      patterns.verbs.matches.push(hanja);
      classified = true;
    }
  }

  // Report findings
  console.log('📈 분류 결과:\n');

  for (const [key, category] of Object.entries(patterns)) {
    const count = category.matches.length;
    const percentage = ((count / allGoodHanja.length) * 100).toFixed(1);
    console.log(`${category.name}: ${count}개 (${percentage}%)`);

    if (count > 0 && key !== 'ideal') {
      console.log('  샘플:');
      category.matches.slice(0, 10).forEach(h => {
        const freq = h.nameFrequency || 0;
        const protected_mark = h.seedProtected ? '🔒' : '  ';
        console.log(`    ${protected_mark} ${h.character} (${h.element}) [빈도:${freq}] → "${h.meaning}"`);
      });
      console.log('');
    }
  }

  // Seed analysis
  const seedCount = allGoodHanja.filter(h => h.seedProtected).length;
  console.log('\n📦 Seed 데이터 분석:');
  console.log(`  Seed 보호 한자: ${seedCount}개 (${((seedCount/allGoodHanja.length)*100).toFixed(1)}%)`);
  console.log(`  개선 필요 한자: ${allGoodHanja.length - seedCount}개 (${(((allGoodHanja.length - seedCount)/allGoodHanja.length)*100).toFixed(1)}%)`);

  // Priority recommendations
  console.log('\n\n🎯 우선순위 전략:\n');

  const highPriority = patterns.negative.matches.length;
  const mediumPriority = patterns.specificNouns.matches.length + patterns.tools.matches.length + patterns.verbs.matches.length;
  const lowPriority = patterns.empty.matches.length;

  console.log(`  🔴 긴급 (부정적 의미): ${highPriority}개`);
  console.log(`  🟡 중요 (구체명사/도구/동사): ${mediumPriority}개`);
  console.log(`  🟢 보통 (meaning 없음): ${lowPriority}개`);
  console.log(`  ✅ 양호 (이상적 형식): ${patterns.ideal.matches.length}개`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ 분석 완료!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
