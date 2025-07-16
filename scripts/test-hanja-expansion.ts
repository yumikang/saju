// 한자 데이터베이스 확장 테스트 스크립트
import { 
  getAllExpandedHanja, 
  getExpandedHanjaByReading,
  getHanjaByCategory,
  getHanjaByGenderPreference,
  getHanjaByElement,
  getHanjaByFortune,
  getHanjaByTags,
  getTopPopularHanja,
  hanjaStatistics
} from '../app/lib/hanja-expanded-data';

// 데이터베이스 확장 현황 분석
function analyzeHanjaExpansion() {
  console.log('=== 한자 데이터베이스 확장 분석 ===\n');
  
  // 1. 전체 통계
  console.log('📊 전체 통계:');
  console.log(`- 총 한자 수: ${hanjaStatistics.total}개`);
  console.log(`- 성씨 한자: ${hanjaStatistics.by_category.성씨}개`);
  console.log(`- 이름 한자: ${hanjaStatistics.by_category.이름}개`);
  console.log(`- 공통 한자: ${hanjaStatistics.by_category.공통}개\n`);
  
  // 2. 오행별 분포
  console.log('🌟 오행별 분포:');
  Object.entries(hanjaStatistics.by_element).forEach(([element, count]) => {
    console.log(`- ${element}: ${count}개`);
  });
  console.log('');
  
  // 3. 길흉별 분포
  console.log('🔮 길흉별 분포:');
  Object.entries(hanjaStatistics.by_fortune).forEach(([fortune, count]) => {
    console.log(`- ${fortune}: ${count}개`);
  });
  console.log('');
  
  // 4. 인기 한자 TOP 10
  console.log('🏆 인기 한자 TOP 10:');
  const topHanja = getTopPopularHanja(10);
  topHanja.forEach((hanja, index) => {
    console.log(`${index + 1}. ${hanja.char}(${hanja.reading}) - ${hanja.popularity_score}점 [${hanja.meaning}]`);
  });
  console.log('');
  
  // 5. 특정 검색 테스트
  console.log('🔍 검색 기능 테스트:');
  
  // 남성 선호 한자
  const maleHanja = getHanjaByGenderPreference('남성');
  console.log(`- 남성 선호 한자: ${maleHanja.length}개`);
  console.log(`  예시: ${maleHanja.slice(0, 5).map(h => h.char).join(', ')}`);
  
  // 여성 선호 한자
  const femaleHanja = getHanjaByGenderPreference('여성');
  console.log(`- 여성 선호 한자: ${femaleHanja.length}개`);
  console.log(`  예시: ${femaleHanja.slice(0, 5).map(h => h.char).join(', ')}`);
  
  // 지혜 관련 한자
  const wisdomHanja = getHanjaByTags(['지혜']);
  console.log(`- 지혜 관련 한자: ${wisdomHanja.length}개`);
  console.log(`  예시: ${wisdomHanja.map(h => `${h.char}(${h.meaning})`).join(', ')}`);
  
  // 물 오행 한자
  const waterHanja = getHanjaByElement('水');
  console.log(`- 水 오행 한자: ${waterHanja.length}개`);
  console.log(`  예시: ${waterHanja.slice(0, 5).map(h => h.char).join(', ')}`);
  
  console.log('');
}

// 특정 음절 검색 테스트
function testSpecificReadings() {
  console.log('🎯 특정 음절 검색 테스트:\n');
  
  const testReadings = ['민', '서', '연', '하', '지', '현'];
  
  testReadings.forEach(reading => {
    const hanjas = getExpandedHanjaByReading(reading);
    console.log(`"${reading}" 음절:`);
    if (hanjas.length > 0) {
      hanjas.forEach(hanja => {
        console.log(`  - ${hanja.char}: ${hanja.meaning} (${hanja.primary_element}행, ${hanja.fortune}, 인기도: ${hanja.popularity_score})`);
      });
    } else {
      console.log(`  - 데이터 없음`);
    }
    console.log('');
  });
}

// 데이터 품질 검증
function validateDataQuality() {
  console.log('✅ 데이터 품질 검증:\n');
  
  const allHanja = getAllExpandedHanja();
  
  // 필수 필드 검증
  const missingFields = allHanja.filter(hanja => 
    !hanja.id || !hanja.char || !hanja.meaning || !hanja.reading
  );
  console.log(`- 필수 필드 누락: ${missingFields.length}개`);
  
  // 중복 ID 검증
  const ids = allHanja.map(h => h.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  console.log(`- 중복 ID: ${duplicateIds.length}개`);
  if (duplicateIds.length > 0) {
    console.log(`  중복: ${duplicateIds.join(', ')}`);
  }
  
  // 획수 범위 검증
  const invalidStrokes = allHanja.filter(hanja => 
    hanja.strokes < 1 || hanja.strokes > 50
  );
  console.log(`- 비정상 획수: ${invalidStrokes.length}개`);
  
  // 인기도 점수 범위 검증
  const invalidPopularity = allHanja.filter(hanja => 
    hanja.popularity_score < 0 || hanja.popularity_score > 100
  );
  console.log(`- 비정상 인기도: ${invalidPopularity.length}개`);
  
  console.log('');
}

// 성능 테스트
function performanceTest() {
  console.log('⚡ 성능 테스트:\n');
  
  const iterations = 1000;
  
  // 전체 데이터 로딩 시간
  const startAll = performance.now();
  for (let i = 0; i < iterations; i++) {
    getAllExpandedHanja();
  }
  const endAll = performance.now();
  console.log(`- 전체 데이터 로딩 (${iterations}회): ${(endAll - startAll).toFixed(2)}ms`);
  
  // 특정 음절 검색 시간
  const startSearch = performance.now();
  for (let i = 0; i < iterations; i++) {
    getExpandedHanjaByReading('민');
  }
  const endSearch = performance.now();
  console.log(`- 음절 검색 (${iterations}회): ${(endSearch - startSearch).toFixed(2)}ms`);
  
  // 필터 검색 시간
  const startFilter = performance.now();
  for (let i = 0; i < iterations; i++) {
    getHanjaByGenderPreference('남성');
  }
  const endFilter = performance.now();
  console.log(`- 성별 필터 (${iterations}회): ${(endFilter - startFilter).toFixed(2)}ms`);
  
  console.log('');
}

// 메인 실행
function main() {
  console.log('한자 데이터베이스 확장 테스트를 시작합니다...\n');
  
  analyzeHanjaExpansion();
  testSpecificReadings();
  validateDataQuality();
  performanceTest();
  
  console.log('✨ 테스트 완료!');
}

// 실행 (Node.js 환경에서)
if (typeof window === 'undefined') {
  main();
}

export { 
  analyzeHanjaExpansion, 
  testSpecificReadings, 
  validateDataQuality, 
  performanceTest 
};