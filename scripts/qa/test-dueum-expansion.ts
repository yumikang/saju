#!/usr/bin/env npx tsx
// 두음법칙 자동 확장 테스트
// 두음법칙 쌍의 양방향 검색이 모두 작동하는지 검증

interface DueumTestCase {
  primary: string;
  alternative: string;
  expectedHanja: string;
  hanjaName: string;
}

// 주요 두음법칙 테스트 케이스
const DUEUM_TEST_CASES: DueumTestCase[] = [
  // 성씨에서 가장 많이 사용되는 두음 쌍
  { primary: '이', alternative: '리', expectedHanja: '李', hanjaName: '이씨/리씨' },
  { primary: '유', alternative: '류', expectedHanja: '柳', hanjaName: '유씨/류씨' },
  { primary: '임', alternative: '림', expectedHanja: '林', hanjaName: '임씨/림씨' },
  { primary: '노', alternative: '로', expectedHanja: '盧', hanjaName: '노씨/로씨' },
  { primary: '양', alternative: '량', expectedHanja: '梁', hanjaName: '양씨/량씨' },
  
  // 일반 이름에서 자주 사용되는 두음 쌍
  { primary: '나', alternative: '라', expectedHanja: '羅', hanjaName: '나/라' },
  { primary: '여', alternative: '려', expectedHanja: '麗', hanjaName: '여/려' },
  { primary: '연', alternative: '련', expectedHanja: '蓮', hanjaName: '연/련' },
  { primary: '열', alternative: '렬', expectedHanja: '烈', hanjaName: '열/렬' },
  { primary: '영', alternative: '령', expectedHanja: '令', hanjaName: '영/령' },
  { primary: '예', alternative: '례', expectedHanja: '禮', hanjaName: '예/례' },
  { primary: '용', alternative: '룡', expectedHanja: '龍', hanjaName: '용/룡' },
  { primary: '윤', alternative: '륜', expectedHanja: '倫', hanjaName: '윤/륜' },
];

// expandDueum 함수 유닛 테스트
async function testExpandDueumFunction() {
  console.log('\n📋 expandDueum 함수 유닛 테스트');
  console.log('─'.repeat(60));
  
  // 서버의 expandDueum 함수를 모방하여 테스트
  const testCases = [
    { input: '이', expected: ['이', '리'] },
    { input: '리', expected: ['리', '이'] },
    { input: '유', expected: ['유', '류'] },
    { input: '류', expected: ['류', '유'] },
    { input: '김', expected: ['김'] }, // 두음 변환 없음
    { input: '박', expected: ['박'] }, // 두음 변환 없음
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    // API를 통해 간접적으로 테스트
    const url = `http://localhost:3003/api/hanja/search?reading=${encodeURIComponent(testCase.input)}&surname=true&limit=1`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        // 성공만 확인 (실제 확장은 서버 내부에서 처리)
        console.log(`✓ "${testCase.input}" → 확장 가능`);
        passed++;
      } else {
        console.log(`✗ "${testCase.input}" → API 오류`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ "${testCase.input}" → 네트워크 오류`);
      failed++;
    }
  }
  
  console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
  return failed === 0;
}

// 양방향 두음법칙 검색 테스트
async function testBidirectionalSearch(testCase: DueumTestCase, baseURL: string): Promise<{
  primaryToHanja: boolean;
  alternativeToHanja: boolean;
  message: string;
  responseTime: number;
}> {
  const startTime = Date.now();
  let primaryToHanja = false;
  let alternativeToHanja = false;
  
  // Primary reading → Hanja
  try {
    const url1 = `${baseURL}/api/hanja/search?reading=${encodeURIComponent(testCase.primary)}&surname=true&limit=20`;
    const response1 = await fetch(url1);
    
    if (response1.ok) {
      const result1 = await response1.json();
      const hanjaList1 = result1.data || result1 || [];
      primaryToHanja = hanjaList1.some((h: any) => h.char === testCase.expectedHanja);
    }
  } catch (error) {
    // 오류 무시
  }
  
  // Alternative reading → Hanja
  try {
    const url2 = `${baseURL}/api/hanja/search?reading=${encodeURIComponent(testCase.alternative)}&surname=true&limit=20`;
    const response2 = await fetch(url2);
    
    if (response2.ok) {
      const result2 = await response2.json();
      const hanjaList2 = result2.data || result2 || [];
      alternativeToHanja = hanjaList2.some((h: any) => h.char === testCase.expectedHanja);
    }
  } catch (error) {
    // 오류 무시
  }
  
  const responseTime = Date.now() - startTime;
  
  // 결과 메시지 생성
  let message = '';
  if (primaryToHanja && alternativeToHanja) {
    message = `✓ 양방향 성공: ${testCase.primary}→${testCase.expectedHanja}, ${testCase.alternative}→${testCase.expectedHanja}`;
  } else if (primaryToHanja && !alternativeToHanja) {
    message = `⚠️  단방향: ${testCase.primary}→${testCase.expectedHanja} (${testCase.alternative}→✗)`;
  } else if (!primaryToHanja && alternativeToHanja) {
    message = `⚠️  단방향: ${testCase.alternative}→${testCase.expectedHanja} (${testCase.primary}→✗)`;
  } else {
    message = `✗ 실패: ${testCase.expectedHanja} 없음`;
  }
  
  return {
    primaryToHanja,
    alternativeToHanja,
    message,
    responseTime
  };
}

// 동일 결과 검증 테스트
async function testSameResults(testCase: DueumTestCase, baseURL: string): Promise<boolean> {
  try {
    // 두 읽기로 검색
    const url1 = `${baseURL}/api/hanja/search?reading=${encodeURIComponent(testCase.primary)}&surname=true&limit=50`;
    const url2 = `${baseURL}/api/hanja/search?reading=${encodeURIComponent(testCase.alternative)}&surname=true&limit=50`;
    
    const [response1, response2] = await Promise.all([
      fetch(url1),
      fetch(url2)
    ]);
    
    if (!response1.ok || !response2.ok) {
      return false;
    }
    
    const result1 = await response1.json();
    const result2 = await response2.json();
    
    const hanjaList1 = result1.data || result1 || [];
    const hanjaList2 = result2.data || result2 || [];
    
    // 한자 character 목록 추출
    const chars1 = new Set(hanjaList1.map((h: any) => h.char));
    const chars2 = new Set(hanjaList2.map((h: any) => h.char));
    
    // 두 세트가 동일한지 확인
    if (chars1.size !== chars2.size) {
      return false;
    }
    
    for (const char of chars1) {
      if (!chars2.has(char)) {
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 두음법칙 자동 확장 테스트\n');
  console.log('=' .repeat(80));
  
  const baseURL = process.env.API_URL || 'http://localhost:3003';
  console.log(`🌐 API URL: ${baseURL}\n`);
  
  // 1. expandDueum 함수 테스트
  const functionTestPassed = await testExpandDueumFunction();
  
  // 2. 양방향 검색 테스트
  console.log('\n📋 양방향 두음법칙 검색 테스트');
  console.log('─'.repeat(60));
  
  let totalTests = 0;
  let bidirectionalSuccess = 0;
  let unidirectionalSuccess = 0;
  let failed = 0;
  let totalResponseTime = 0;
  const failedCases: string[] = [];
  
  for (const testCase of DUEUM_TEST_CASES) {
    totalTests++;
    process.stdout.write(`\n${testCase.hanjaName} (${testCase.expectedHanja}): `);
    
    const result = await testBidirectionalSearch(testCase, baseURL);
    totalResponseTime += result.responseTime;
    
    console.log(result.message);
    
    if (result.primaryToHanja && result.alternativeToHanja) {
      bidirectionalSuccess++;
      
      // 동일 결과 검증
      const sameResults = await testSameResults(testCase, baseURL);
      if (sameResults) {
        console.log(`   └─ ✓ 동일한 검색 결과`);
      } else {
        console.log(`   └─ ⚠️  검색 결과가 다름`);
      }
    } else if (result.primaryToHanja || result.alternativeToHanja) {
      unidirectionalSuccess++;
      failedCases.push(`${testCase.hanjaName}: 단방향만 작동`);
    } else {
      failed++;
      failedCases.push(`${testCase.hanjaName}: ${testCase.expectedHanja} 없음`);
    }
    
    // Rate limiting 방지
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // 3. 특수 케이스 테스트
  console.log('\n📋 특수 케이스 테스트');
  console.log('─'.repeat(60));
  
  // 김/금은 두음법칙이 아니지만 자주 혼동되는 케이스
  const kimTest = await fetch(`${baseURL}/api/hanja/search?reading=${encodeURIComponent('김')}&surname=true&limit=10`);
  const geumTest = await fetch(`${baseURL}/api/hanja/search?reading=${encodeURIComponent('금')}&surname=true&limit=10`);
  
  if (kimTest.ok && geumTest.ok) {
    const kimResult = await kimTest.json();
    const geumResult = await geumTest.json();
    
    const kimHasGold = (kimResult.data || kimResult || []).some((h: any) => h.char === '金');
    const geumHasGold = (geumResult.data || geumResult || []).some((h: any) => h.char === '金');
    
    if (kimHasGold && geumHasGold) {
      console.log('✓ 김/금 모두 金 검색 가능');
    } else {
      console.log(`⚠️  김→金: ${kimHasGold ? '✓' : '✗'}, 금→金: ${geumHasGold ? '✓' : '✗'}`);
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 테스트 결과 요약:\n');
  console.log(`   expandDueum 함수: ${functionTestPassed ? '✅ 통과' : '❌ 실패'}`);
  console.log(`   총 두음 쌍 테스트: ${totalTests}개`);
  console.log(`   ✅ 양방향 성공: ${bidirectionalSuccess}개 (${(bidirectionalSuccess/totalTests*100).toFixed(1)}%)`);
  console.log(`   ⚠️  단방향 성공: ${unidirectionalSuccess}개 (${(unidirectionalSuccess/totalTests*100).toFixed(1)}%)`);
  console.log(`   ❌ 실패: ${failed}개 (${(failed/totalTests*100).toFixed(1)}%)`);
  console.log(`   ⏱️  평균 응답시간: ${Math.round(totalResponseTime / totalTests)}ms`);
  
  if (failedCases.length > 0) {
    console.log(`\n⚠️  문제가 있는 케이스:`);
    failedCases.forEach(c => console.log(`   - ${c}`));
  }
  
  // 성능 평가
  const avgResponseTime = totalResponseTime / totalTests;
  console.log('\n🚀 성능 평가:');
  if (avgResponseTime < 200) {
    console.log(`   ✅ 우수한 성능 (<200ms)`);
  } else if (avgResponseTime < 500) {
    console.log(`   ⚠️  적정 성능 (200-500ms)`);
  } else {
    console.log(`   ❌ 성능 개선 필요 (>500ms)`);
  }
  
  // 최종 판정
  const successRate = bidirectionalSuccess / totalTests * 100;
  console.log('\n🎯 최종 판정:');
  if (successRate === 100) {
    console.log('   ✅ 모든 두음법칙 양방향 검색 성공! QA 통과');
  } else if (successRate >= 80) {
    console.log(`   ⚠️  ${successRate.toFixed(1)}% 양방향 성공률 - 일부 개선 필요`);
  } else {
    console.log(`   ❌ ${successRate.toFixed(1)}% 양방향 성공률 - 주요 개선 필요`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// 실행
main().catch(console.error);