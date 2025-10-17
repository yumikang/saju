import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 사주 네이밍 서비스 DB 분석 리포트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalCount = await prisma.hanjaDict.count();
  console.log(`1️⃣ 전체 한자 수: ${totalCount}개\n`);

  // 성별 분포 (gender 필드 사용)
  console.log('2️⃣ 성별 선호도 현황');
  const genderStats = await prisma.hanjaDict.groupBy({
    by: ['gender'],
    _count: true,
  });

  for (const stat of genderStats) {
    const pct = ((stat._count / totalCount) * 100).toFixed(2);
    const gender = stat.gender || 'null';
    const emoji = gender === 'male' ? '👨' : gender === 'female' ? '👩' : gender === 'neutral' ? '⚧️' : '❓';
    console.log(`   ${emoji} ${gender}: ${stat._count}개 (${pct}%)`);
  }

  const nullGender = await prisma.hanjaDict.count({ where: { gender: null } });
  console.log(`\n   ❌ 미분류: ${nullGender}개 (${((nullGender/totalCount)*100).toFixed(2)}%)`);

  if (nullGender > 0) {
    console.log('   ⚠️  문제: 성별 필터링이 작동하지 않습니다!\n');
  } else {
    console.log('   ✅ 성별 분류 완료\n');
  }

  // 이름 적합성
  console.log('3️⃣ 이름 적합성');
  const goodCount = await prisma.hanjaDict.count({ where: { isGoodForNaming: true } });
  const badCount = await prisma.hanjaDict.count({ where: { isGoodForNaming: false } });
  console.log(`   ✅ 좋음: ${goodCount}개 (${((goodCount/totalCount)*100).toFixed(2)}%)`);
  console.log(`   ❌ 부적합: ${badCount}개 (${((badCount/totalCount)*100).toFixed(2)}%)\n`);

  // 오행 분포
  console.log('4️⃣ 오행 분포');
  const elementStats = await prisma.hanjaDict.groupBy({
    by: ['element'],
    _count: true,
  });

  for (const stat of elementStats) {
    const pct = ((stat._count / totalCount) * 100).toFixed(2);
    const elem = stat.element || 'null';
    const emoji = elem === 'WOOD' ? '🌳' : elem === 'FIRE' ? '🔥' : elem === 'EARTH' ? '🌍' : elem === 'METAL' ? '⚙️' : elem === 'WATER' ? '💧' : '❓';
    console.log(`   ${emoji} ${elem}: ${stat._count}개 (${pct}%)`);
  }

  // 샘플 데이터
  console.log('\n5️⃣ 샘플 데이터 (이름에 좋은 한자 상위 10개)');
  const samples = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: true },
    orderBy: { nameFrequency: 'desc' },
    take: 10,
    select: { character: true, meaning: true, element: true, gender: true, nameFrequency: true },
  });

  for (const s of samples) {
    const g = s.gender || 'null';
    const e = g === 'male' ? '👨' : g === 'female' ? '👩' : g === 'neutral' ? '⚧️' : '❓';
    console.log(`   ${s.character} (${s.meaning}) - ${e} ${g} | ${s.element} | 인기: ${s.nameFrequency || 0}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 분석 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

analyzeDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
