/**
 * DatabaseHanjaService 실제 DB 연동 테스트
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseHanjaService } from '~/lib/naming/pipeline';

async function testDatabaseService() {
  console.log('🧪 DatabaseHanjaService 테스트 시작\n');

  const prisma = new PrismaClient();

  try {
    // 1. 한자 총 개수 확인
    console.log('1️⃣ 데이터베이스 상태 확인...');
    const totalCount = await prisma.hanjaDict.count();
    console.log(`  - 총 한자 개수: ${totalCount}개\n`);

    if (totalCount === 0) {
      console.log('⚠️  한자 데이터가 없습니다. 먼저 한자 데이터를 import해주세요.');
      return;
    }

    // 2. 각 오행별 개수 확인
    console.log('2️⃣ 오행별 한자 개수...');
    for (const element of ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER']) {
      const count = await prisma.hanjaDict.count({
        where: { element: element as any },
      });
      console.log(`  - ${element}: ${count}개`);
    }
    console.log('');

    // 3. DatabaseHanjaService 초기화
    console.log('3️⃣ DatabaseHanjaService 초기화...');
    const service = new DatabaseHanjaService(prisma);
    console.log('✅ 초기화 완료\n');

    // 4. 오행별 조회 테스트
    console.log('4️⃣ WOOD 오행 한자 조회 (작명 적합, 3-20획)...');
    const woodHanja = await service.findByElement('WOOD' as any, {
      minStrokes: 3,
      maxStrokes: 20,
      isGoodForNaming: true,
    });
    console.log(`  - 조회 결과: ${woodHanja.length}개`);

    if (woodHanja.length > 0) {
      console.log('\n📋 샘플 한자 (처음 5개):');
      woodHanja.slice(0, 5).forEach((hanja, index) => {
        console.log(`${index + 1}. ${hanja.character} (${hanja.koreanReading})`);
        console.log(`   의미: ${hanja.meaning}`);
        console.log(`   획수: ${hanja.strokes}획`);
        console.log(`   오행: ${hanja.element}, 음양: ${hanja.yinYang}`);
        console.log(`   작명 적합: ${hanja.isGoodForNaming ? '✅' : '❌'}`);
        console.log(`   인기도: 이름=${hanja.nameFrequency}, 사용=${hanja.usageFrequency}`);
        console.log('');
      });
    }

    // 5. 성별 필터링 테스트
    console.log('5️⃣ 남성용 FIRE 오행 한자 조회...');
    const maleFireHanja = await service.findByElement('FIRE' as any, {
      minStrokes: 3,
      maxStrokes: 20,
      isGoodForNaming: true,
      gender: 'M',
    });
    console.log(`  - 조회 결과: ${maleFireHanja.length}개\n`);

    console.log('✅ 모든 테스트 성공!');
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('스택:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseService();
