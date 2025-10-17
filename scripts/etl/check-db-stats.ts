/**
 * Check current HanjaDict database statistics
 * Provides baseline metrics for data enhancement planning
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 한자 데이터베이스 현황 분석\n');
  console.log('='.repeat(60));

  // Total count
  const total = await prisma.hanjaDict.count();
  console.log(`\n총 한자 수: ${total.toLocaleString()}개`);

  // Gender classification stats
  const genderStats = await prisma.hanjaDict.groupBy({
    by: ['gender'],
    _count: true,
  });

  console.log('\n📋 성별 분류 현황:');
  const maleCount = genderStats.find(g => g.gender === 'male')?._count || 0;
  const femaleCount = genderStats.find(g => g.gender === 'female')?._count || 0;
  const neutralCount = genderStats.find(g => g.gender === 'neutral')?._count || 0;
  const unclassifiedCount = genderStats.find(g => g.gender === null)?._count || 0;

  console.log(`  남성 선호: ${maleCount}개 (${((maleCount/total)*100).toFixed(2)}%)`);
  console.log(`  여성 선호: ${femaleCount}개 (${((femaleCount/total)*100).toFixed(2)}%)`);
  console.log(`  중성: ${neutralCount}개 (${((neutralCount/total)*100).toFixed(2)}%)`);
  console.log(`  미분류: ${unclassifiedCount}개 (${((unclassifiedCount/total)*100).toFixed(2)}%)`);

  const classifiedCount = maleCount + femaleCount + neutralCount;
  console.log(`  ✅ 분류 완료: ${classifiedCount}개 (${((classifiedCount/total)*100).toFixed(2)}%)`);
  console.log(`  ❌ 분류 필요: ${unclassifiedCount}개 (${((unclassifiedCount/total)*100).toFixed(2)}%)`);

  // Name frequency stats
  const freqStats = await prisma.hanjaDict.aggregate({
    _count: true,
    _avg: { nameFrequency: true },
    _max: { nameFrequency: true },
    _min: { nameFrequency: true },
  });

  const withFrequency = await prisma.hanjaDict.count({
    where: { nameFrequency: { gt: 0 } },
  });

  const zeroFrequency = await prisma.hanjaDict.count({
    where: { nameFrequency: 0 },
  });

  console.log('\n📈 이름 빈도 현황:');
  console.log(`  평균 빈도: ${freqStats._avg.nameFrequency?.toFixed(2) || 0}`);
  console.log(`  최대 빈도: ${freqStats._max.nameFrequency || 0}`);
  console.log(`  최소 빈도: ${freqStats._min.nameFrequency || 0}`);
  console.log(`  빈도 데이터 있음: ${withFrequency}개 (${((withFrequency/total)*100).toFixed(2)}%)`);
  console.log(`  빈도 데이터 없음: ${zeroFrequency}개 (${((zeroFrequency/total)*100).toFixed(2)}%)`);

  // Negative character filtering
  const goodForNaming = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true },
  });

  const badForNaming = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false },
  });

  console.log('\n🛡️ 작명 적합성 필터링:');
  console.log(`  작명 적합: ${goodForNaming}개 (${((goodForNaming/total)*100).toFixed(2)}%)`);
  console.log(`  작명 부적합: ${badForNaming}개 (${((badForNaming/total)*100).toFixed(2)}%)`);
  console.log(`  필터링율: ${((badForNaming/total)*100).toFixed(2)}%`);

  // Element distribution
  const elementStats = await prisma.hanjaDict.groupBy({
    by: ['element'],
    _count: true,
  });

  console.log('\n🌟 오행 분포:');
  elementStats
    .filter(e => e.element !== null)
    .sort((a, b) => b._count - a._count)
    .forEach(stat => {
      console.log(`  ${stat.element}: ${stat._count}개 (${((stat._count/total)*100).toFixed(2)}%)`);
    });

  // Sample popular characters
  const popularChars = await prisma.hanjaDict.findMany({
    where: { nameFrequency: { gt: 0 } },
    orderBy: { nameFrequency: 'desc' },
    take: 10,
  });

  if (popularChars.length > 0) {
    console.log('\n⭐ 인기 한자 TOP 10:');
    popularChars.forEach((char, idx) => {
      console.log(`  ${idx + 1}. ${char.character} (빈도: ${char.nameFrequency}, 의미: ${char.meaning?.substring(0, 20)}...)`);
    });
  }

  // Summary recommendations
  console.log('\n' + '='.repeat(60));
  console.log('📝 개선 권장사항:\n');

  if (unclassifiedCount > total * 0.5) {
    console.log(`⚠️  성별 분류가 ${((unclassifiedCount/total)*100).toFixed(1)}% 미완료 → 긴급 분류 필요`);
  }

  if (zeroFrequency > total * 0.5) {
    console.log(`⚠️  이름 빈도 데이터가 ${((zeroFrequency/total)*100).toFixed(1)}% 누락 → 2024 통계 적용 필요`);
  }

  if (badForNaming < 100) {
    console.log(`⚠️  부정적 한자 필터링 ${badForNaming}개만 적용 → 추가 확장 권장`);
  }

  console.log('\n✅ 분석 완료!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
