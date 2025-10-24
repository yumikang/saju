/**
 * NamingPipeline 통합 테스트
 */

import { createNamingPipeline, createHanjaService, createCacheService } from '../app/lib/naming/pipeline';

async function testPipeline() {
  console.log('🧪 NamingPipeline 통합 테스트 시작\n');

  try {
    // 1. 서비스 초기화
    console.log('1️⃣ 서비스 초기화...');
    const hanjaService = createHanjaService('mock');
    const cacheService = createCacheService('null');
    const pipeline = createNamingPipeline(hanjaService, cacheService);
    console.log('✅ 초기화 완료\n');

    // 2. 테스트 케이스 실행
    console.log('2️⃣ 테스트 케이스 실행...');
    const testCase = {
      birthInfo: {
        year: 1990,
        month: 5,
        day: 15,
        hour: 14,
        minute: 30,
        isLunar: false,
        gender: 'M' as const,
      },
      lastName: '김',
      lastNameStrokes: 8,
    };

    console.log('입력 정보:');
    console.log(`  - 생년월일시: ${testCase.birthInfo.year}-${testCase.birthInfo.month}-${testCase.birthInfo.day} ${testCase.birthInfo.hour}:${testCase.birthInfo.minute}`);
    console.log(`  - 성: ${testCase.lastName} (${testCase.lastNameStrokes}획)`);
    console.log(`  - 성별: ${testCase.birthInfo.gender === 'M' ? '남자' : '여자'}\n`);

    // 3. 파이프라인 실행
    console.log('3️⃣ 파이프라인 실행 중...');
    const startTime = Date.now();

    const result = await pipeline.execute(
      testCase.birthInfo,
      testCase.lastName,
      testCase.lastNameStrokes
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ 실행 완료 (${duration}ms)\n`);

    // 4. 결과 출력
    console.log('4️⃣ 결과 분석');
    console.log('═'.repeat(60));
    console.log(`총 후보: ${result.candidates.length}개`);
    console.log(`실행 시간: ${duration}ms ${duration < 10000 ? '✅' : '❌'} (<10초 목표)`);
    console.log('═'.repeat(60));

    if (result.candidates.length > 0) {
      console.log('\n🏆 Top 5 이름:\n');
      result.candidates.slice(0, 5).forEach((candidate, index) => {
        const totalStrokes = candidate.characters.reduce((sum, char) => sum + char.strokes, 0);
        console.log(`${index + 1}. ${testCase.lastName}${candidate.firstName.join('')}`);
        console.log(`   한자: ${candidate.characters.map((h) => h.character).join('')}`);
        console.log(`   총점: ${candidate.score.toFixed(1)}점`);
        console.log(`   - 오행 조화: ${candidate.breakdown.element.toFixed(1)}점`);
        console.log(`   - 음양 균형: ${candidate.breakdown.yinyang.toFixed(1)}점`);
        console.log(`   - 81수리: ${candidate.breakdown.numerology.toFixed(1)}점`);
        console.log(`   - 의미 조화: ${candidate.breakdown.meaning.toFixed(1)}점`);
        console.log(`   획수: ${candidate.characters.map((h) => h.strokes).join('+')} = ${totalStrokes}획`);
        console.log('');
      });
    } else {
      console.log('\n⚠️ 추천 이름이 없습니다.');
    }

    // 5. 메타데이터
    console.log('📊 메타데이터:');
    console.log(`  - 총 생성: ${result.metadata.totalGenerated}개`);
    console.log(`  - 점수 계산: ${result.metadata.totalScored}개`);
    console.log(`  - 실행 시간: ${result.metadata.executionTime}ms`);
    console.log(`  - 타임스탬프: ${result.metadata.timestamp}`);

    // 6. 사주 정보
    console.log('\n🔮 사주 분석:');
    console.log(`  - 부족한 오행: ${result.saju.lackingElements.join(', ') || 'N/A'}`);
    console.log(`  - 유리한 오행: ${result.saju.favorableElements.join(', ') || 'N/A'}`);
    console.log(`  - 오행 개수: ${JSON.stringify(result.saju.elementCounts)}`);


    console.log('\n✅ 테스트 성공!');
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('스택:', error.stack);
    }
    process.exit(1);
  }
}

testPipeline();
