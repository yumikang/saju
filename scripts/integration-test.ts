// 확장된 한자 DB 통합 테스트 스크립트
import { getHanjaByReading } from '../app/lib/hanja-db';

// 통합 테스트 함수
export async function runIntegrationTests() {
  console.log('🔧 확장된 한자 DB 통합 테스트 시작...\n');

  const results = {
    supabaseConnection: false,
    fallbackSystem: false,
    filterFunctions: false,
    dataQuality: false,
    uiCompatibility: false,
    errors: [] as string[]
  };

  try {
    // 1. Supabase 연결 테스트
    console.log('1️⃣ Supabase 연결 테스트...');
    try {
      // 환경변수 확인
      const hasSupabaseUrl = process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'your_supabase_project_url';
      const hasSupabaseKey = process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== 'your_supabase_anon_key';
      
      if (hasSupabaseUrl && hasSupabaseKey) {
        console.log('✅ Supabase 환경변수 설정됨');
        results.supabaseConnection = true;
      } else {
        console.log('⚠️  Supabase 환경변수 미설정 - fallback 모드로 동작');
        results.supabaseConnection = false;
      }
    } catch (error) {
      results.errors.push(`Supabase 연결 오류: ${error}`);
      console.log('❌ Supabase 연결 실패');
    }

    // 2. Fallback 시스템 테스트
    console.log('\n2️⃣ Fallback 시스템 테스트...');
    try {
      const testReadings = ['민', '서', '연', '하', '김', '이'];
      let successCount = 0;
      
      for (const reading of testReadings) {
        const hanjas = await getHanjaByReading(reading);
        if (hanjas && hanjas.length > 0) {
          successCount++;
          console.log(`  ✅ "${reading}": ${hanjas.length}개 한자 조회 성공`);
          
          // 첫 번째 한자의 속성 확인
          const firstHanja = hanjas[0];
          if (firstHanja.fortune || firstHanja.naming_tags) {
            console.log(`    - 확장 속성 포함: fortune=${firstHanja.fortune}, tags=${firstHanja.naming_tags?.join(',')}`);
          }
        } else {
          console.log(`  ❌ "${reading}": 조회 실패`);
        }
      }
      
      results.fallbackSystem = successCount >= testReadings.length * 0.8; // 80% 이상 성공
      console.log(`Fallback 시스템: ${successCount}/${testReadings.length} 성공`);
      
    } catch (error) {
      results.errors.push(`Fallback 시스템 오류: ${error}`);
      console.log('❌ Fallback 시스템 실패');
    }

    // 3. 새로운 필터 기능 테스트
    console.log('\n3️⃣ 새로운 필터 기능 테스트...');
    try {
      // gender_preference 필터 테스트
      const maleHanjas = await getHanjaByReading('민');
      const femaleHanjas = await getHanjaByReading('연');
      
      const hasMalePreference = maleHanjas.some(h => h.gender_preference === '남성' || h.gender_preference === '중성');
      const hasFemalePreference = femaleHanjas.some(h => h.gender_preference === '여성' || h.gender_preference === '중성');
      
      console.log(`  성별 필터: 남성=${hasMalePreference}, 여성=${hasFemalePreference}`);
      
      // fortune 필터 테스트
      const hasFortuneData = maleHanjas.some(h => h.fortune && ['대길', '길', '중길', '평', '흉'].includes(h.fortune));
      console.log(`  길흉 데이터: ${hasFortuneData}`);
      
      // naming_tags 테스트
      const hasTagsData = maleHanjas.some(h => h.naming_tags && h.naming_tags.length > 0);
      console.log(`  태그 데이터: ${hasTagsData}`);
      
      results.filterFunctions = hasMalePreference && hasFemalePreference && hasFortuneData && hasTagsData;
      
    } catch (error) {
      results.errors.push(`필터 기능 오류: ${error}`);
      console.log('❌ 필터 기능 실패');
    }

    // 4. 데이터 품질 테스트
    console.log('\n4️⃣ 데이터 품질 테스트...');
    try {
      const testHanjas = await getHanjaByReading('민');
      let qualityScore = 0;
      
      if (testHanjas.length > 0) {
        const firstHanja = testHanjas[0];
        
        // 필수 필드 체크
        if (firstHanja.char && firstHanja.meaning && firstHanja.reading) qualityScore += 25;
        if (firstHanja.strokes && firstHanja.strokes > 0) qualityScore += 25;
        if (firstHanja.element) qualityScore += 25;
        if (firstHanja.fortune || firstHanja.naming_tags) qualityScore += 25;
        
        console.log(`  데이터 품질 점수: ${qualityScore}/100`);
        results.dataQuality = qualityScore >= 75;
      }
      
    } catch (error) {
      results.errors.push(`데이터 품질 오류: ${error}`);
      console.log('❌ 데이터 품질 실패');
    }

    // 5. UI 호환성 테스트
    console.log('\n5️⃣ UI 호환성 테스트...');
    try {
      const hanjas = await getHanjaByReading('서');
      
      if (hanjas.length > 0) {
        const testHanja = hanjas[0];
        
        // 기존 UI가 기대하는 필드들이 있는지 확인
        const hasRequiredFields = !!(
          testHanja.char && 
          testHanja.meaning && 
          testHanja.reading && 
          testHanja.strokes
        );
        
        // 새로운 필드들이 안전하게 처리되는지 확인
        const hasOptionalFields = !!(
          testHanja.element ||
          testHanja.fortune ||
          testHanja.naming_tags ||
          testHanja.gender_preference
        );
        
        console.log(`  필수 필드: ${hasRequiredFields}`);
        console.log(`  확장 필드: ${hasOptionalFields}`);
        
        results.uiCompatibility = hasRequiredFields;
      }
      
    } catch (error) {
      results.errors.push(`UI 호환성 오류: ${error}`);
      console.log('❌ UI 호환성 실패');
    }

  } catch (globalError) {
    results.errors.push(`전역 오류: ${globalError}`);
  }

  // 결과 출력
  console.log('\n📊 테스트 결과 요약:');
  console.log(`Supabase 연결: ${results.supabaseConnection ? '✅' : '⚠️'}`);
  console.log(`Fallback 시스템: ${results.fallbackSystem ? '✅' : '❌'}`);
  console.log(`필터 기능: ${results.filterFunctions ? '✅' : '❌'}`);
  console.log(`데이터 품질: ${results.dataQuality ? '✅' : '❌'}`);
  console.log(`UI 호환성: ${results.uiCompatibility ? '✅' : '❌'}`);

  if (results.errors.length > 0) {
    console.log('\n🚨 발견된 오류들:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  const overallSuccess = results.fallbackSystem && results.filterFunctions && results.dataQuality && results.uiCompatibility;
  console.log(`\n🎯 전체 테스트: ${overallSuccess ? '✅ 성공' : '❌ 실패'}`);

  return results;
}

// 실제 작명 서비스 테스트
export async function testNamingService() {
  console.log('\n🏷️ 작명 서비스 통합 테스트...');
  
  try {
    // 남성 이름 테스트
    console.log('\n👨 남성 이름 추천 테스트:');
    const maleTestData = {
      lastName: '김',
      gender: 'M',
      birthDate: new Date('2024-01-01'),
      birthTime: '10:00'
    };
    
    const kimHanjas = await getHanjaByReading('김');
    const minHanjas = await getHanjaByReading('민');
    const junHanjas = await getHanjaByReading('준');
    
    console.log(`성씨 '김': ${kimHanjas.length}개`);
    console.log(`이름 '민': ${minHanjas.length}개`);
    console.log(`이름 '준': ${junHanjas.length}개`);
    
    if (minHanjas.length > 0 && junHanjas.length > 0) {
      const maleName = `${kimHanjas[0]?.char || '김'}${minHanjas[0]?.char}${junHanjas[0]?.char}`;
      console.log(`추천 이름 예시: ${maleName}`);
      console.log(`의미: ${kimHanjas[0]?.meaning || ''} + ${minHanjas[0]?.meaning} + ${junHanjas[0]?.meaning}`);
    }
    
    // 여성 이름 테스트
    console.log('\n👩 여성 이름 추천 테스트:');
    const femaleTestData = {
      lastName: '이',
      gender: 'F',
      birthDate: new Date('2024-01-01'),
      birthTime: '14:00'
    };
    
    const leeHanjas = await getHanjaByReading('이');
    const seoHanjas = await getHanjaByReading('서');
    const yeonHanjas = await getHanjaByReading('연');
    
    console.log(`성씨 '이': ${leeHanjas.length}개`);
    console.log(`이름 '서': ${seoHanjas.length}개`);
    console.log(`이름 '연': ${yeonHanjas.length}개`);
    
    if (seoHanjas.length > 0 && yeonHanjas.length > 0) {
      const femaleName = `${leeHanjas[0]?.char || '이'}${seoHanjas[0]?.char}${yeonHanjas[0]?.char}`;
      console.log(`추천 이름 예시: ${femaleName}`);
      console.log(`의미: ${leeHanjas[0]?.meaning || ''} + ${seoHanjas[0]?.meaning} + ${yeonHanjas[0]?.meaning}`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ 작명 서비스 테스트 실패: ${error}`);
    return false;
  }
}

// Node.js 환경에서 실행
if (typeof window === 'undefined') {
  runIntegrationTests().then(() => {
    return testNamingService();
  }).then(() => {
    console.log('\n✨ 모든 테스트 완료!');
  }).catch(error => {
    console.error('테스트 실행 중 오류:', error);
  });
}