/**
 * Sample problematic meaning fields for analysis
 * Identifies patterns in inappropriate meaning descriptions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 작명용 한자의 meaning 필드 샘플 분석\n');
  console.log('='.repeat(80));

  // Get sample of good-for-naming characters
  const goodHanja = await prisma.hanjaDict.findMany({
    where: {
      isGoodForNaming: true,
      meaning: { not: null },
    },
    select: {
      character: true,
      meaning: true,
      element: true,
      strokes: true,
      nameFrequency: true,
      seedProtected: true,
    },
    orderBy: { nameFrequency: 'desc' },
    take: 50,
  });

  // Pattern detection: problematic meanings
  const problematicPatterns = [
    { pattern: /할\s*\w+$/, category: '동사형 (부적절)', example: '꼭두서니할, 작은가마할' },
    { pattern: /이름\s*\w+/, category: '명사형 (중립)', example: '물이름, 산이름' },
    { pattern: /나무\s*\w+/, category: '식물명 (구체명사)', example: '오동나무, 측백나무' },
    { pattern: /\w+\s*가마/, category: '도구명 (부적절)', example: '작은가마' },
    { pattern: /^(죽을|병|악할|흉할|재앙|해칠|주검|죽일)/, category: '부정적 의미 (필터 대상)', example: '죽을, 병' },
    { pattern: /\(.*\)/, category: '설명 포함 (좋음)', example: '밝을 철(슬기로움)' },
    { pattern: /\//, category: '다중 의미 (좋음)', example: '밝을 명/빛날 명' },
  ];

  console.log('\n📊 패턴별 분류:\n');

  for (const { pattern, category, example } of problematicPatterns) {
    const matches = goodHanja.filter(h => h.meaning && pattern.test(h.meaning));
    if (matches.length > 0) {
      console.log(`\n${category} (예: ${example})`);
      console.log(`  발견: ${matches.length}개`);
      console.log(`  샘플:`);
      matches.slice(0, 5).forEach(h => {
        const freq = h.nameFrequency || 0;
        const protected_mark = h.seedProtected ? '🔒' : '  ';
        console.log(`    ${protected_mark} ${h.character} (${h.element}) [빈도:${freq}] → "${h.meaning}"`);
      });
    }
  }

  // Ideal format examples (from seed)
  const seedExamples = goodHanja.filter(h => h.seedProtected);
  console.log('\n\n✅ 이상적인 meaning 형식 (seed 데이터):\n');
  seedExamples.slice(0, 20).forEach(h => {
    console.log(`  ${h.character} (${h.element}) → "${h.meaning}"`);
  });

  // Problematic examples needing improvement
  const needsImprovement = goodHanja.filter(h =>
    h.meaning &&
    !h.seedProtected &&
    (h.meaning.includes('나무') || h.meaning.includes('이름') || /할\s*\w+$/.test(h.meaning))
  );

  console.log('\n\n⚠️  개선 필요 샘플:\n');
  needsImprovement.slice(0, 20).forEach(h => {
    const freq = h.nameFrequency || 0;
    console.log(`  ${h.character} (${h.element}) [빈도:${freq}] → "${h.meaning}"`);
  });

  // Statistics
  const total = goodHanja.length;
  const withParentheses = goodHanja.filter(h => h.meaning?.includes('(')).length;
  const withSlash = goodHanja.filter(h => h.meaning?.includes('/')).length;
  const seedCount = seedExamples.length;

  console.log('\n\n📈 통계:\n');
  console.log(`  전체 샘플: ${total}개`);
  console.log(`  Seed 보호 한자: ${seedCount}개 (${((seedCount/total)*100).toFixed(1)}%)`);
  console.log(`  설명 포함 (): ${withParentheses}개 (${((withParentheses/total)*100).toFixed(1)}%)`);
  console.log(`  다중 의미 /: ${withSlash}개 (${((withSlash/total)*100).toFixed(1)}%)`);
  console.log(`  개선 필요: ${needsImprovement.length}개 (${((needsImprovement.length/total)*100).toFixed(1)}%)`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ 분석 완료!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
