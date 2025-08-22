#!/usr/bin/env npx tsx
// 필수 성씨 30종 스모크 테스트
// 각 성씨의 대표 한자가 첫 페이지에 노출되는지 검증

interface TestCase {
  reading: string;
  expectedChar: string;
  alternativeReadings?: string[];
  displayName: string;
}

// 필수 성씨 30종 테스트 케이스
const ESSENTIAL_SURNAME_TESTS: TestCase[] = [
  // 최상위군(10)
  { reading: '김', expectedChar: '金', alternativeReadings: ['금'], displayName: '김(金)' },
  { reading: '이', expectedChar: '李', alternativeReadings: ['리'], displayName: '이(李)' },
  { reading: '박', expectedChar: '朴', displayName: '박(朴)' },
  { reading: '최', expectedChar: '崔', displayName: '최(崔)' },
  { reading: '정', expectedChar: '鄭', displayName: '정(鄭)' },
  { reading: '조', expectedChar: '趙', displayName: '조(趙)' },
  { reading: '윤', expectedChar: '尹', displayName: '윤(尹)' },
  { reading: '장', expectedChar: '張', displayName: '장(張)' },
  { reading: '강', expectedChar: '姜', displayName: '강(姜)' },
  // 조(曺)는 조(趙)와 같은 읽기이므로 둘 다 확인
  
  // 상위군(10)
  { reading: '임', expectedChar: '林', alternativeReadings: ['림'], displayName: '임(林)' },
  { reading: '오', expectedChar: '吳', displayName: '오(吳)' },
  { reading: '한', expectedChar: '韓', displayName: '한(韓)' },
  { reading: '신', expectedChar: '申', displayName: '신(申)' },
  { reading: '양', expectedChar: '梁', alternativeReadings: ['량'], displayName: '양(梁)' },
  { reading: '송', expectedChar: '宋', displayName: '송(宋)' },
  { reading: '현', expectedChar: '玄', displayName: '현(玄)' },
  { reading: '고', expectedChar: '高', displayName: '고(高)' },
  { reading: '주', expectedChar: '朱', displayName: '주(朱)' },
  { reading: '서', expectedChar: '徐', displayName: '서(徐)' },
  
  // 보강군(10)
  { reading: '문', expectedChar: '文', displayName: '문(文)' },
  { reading: '손', expectedChar: '孫', displayName: '손(孫)' },
  { reading: '안', expectedChar: '安', displayName: '안(安)' },
  { reading: '유', expectedChar: '柳', alternativeReadings: ['류'], displayName: '유(柳)' },
  { reading: '전', expectedChar: '田', displayName: '전(田)' },
  { reading: '차', expectedChar: '車', displayName: '차(車)' },
  { reading: '천', expectedChar: '千', displayName: '천(千)' },
  { reading: '하', expectedChar: '河', displayName: '하(河)' },
  { reading: '노', expectedChar: '盧', alternativeReadings: ['로'], displayName: '노(盧)' },
  { reading: '허', expectedChar: '許', displayName: '허(許)' },
];

async function testSurname(testCase: TestCase, baseURL: string): Promise<{
  success: boolean;
  message: string;
  responseTime: number;
}> {
  const startTime = Date.now();
  
  try {
    // API 호출 (성씨 모드)
    const url = `${baseURL}/api/hanja/search?reading=${encodeURIComponent(testCase.reading)}&surname=true&limit=20`;
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: `HTTP ${response.status}: ${error.message || '알 수 없는 오류'}`,
        responseTime
      };
    }
    
    const result = await response.json();
    
    // 응답 데이터 추출 (페이지네이션 응답 또는 배열)
    const hanjaList = result.data || result || [];
    
    if (!Array.isArray(hanjaList)) {
      return {
        success: false,
        message: '잘못된 응답 형식 (배열이 아님)',
        responseTime
      };
    }
    
    if (hanjaList.length === 0) {
      return {
        success: false,
        message: '검색 결과 없음',
        responseTime
      };
    }
    
    // 대표 한자 찾기
    const found = hanjaList.find((h: any) => h.char === testCase.expectedChar);
    
    if (found) {
      // 첫 번째 결과인지 확인
      const isFirst = hanjaList[0].char === testCase.expectedChar;
      const position = hanjaList.findIndex((h: any) => h.char === testCase.expectedChar) + 1;
      
      return {
        success: true,
        message: `✓ ${found.char} 발견 (${position}번째, ${found.meaning || '의미없음'}, ${responseTime}ms)`,
        responseTime
      };
    }
    
    // 못 찾은 경우, 상위 3개 표시
    const top3 = hanjaList.slice(0, 3).map((h: any) => h.char).join(', ');
    return {
      success: false,
      message: `✗ ${testCase.expectedChar} 없음. 상위3: [${top3}]`,
      responseTime
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: `네트워크 오류: ${error.message}`,
      responseTime: Date.now() - startTime
    };
  }
}

async function testAlternativeReading(testCase: TestCase, altReading: string, baseURL: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const url = `${baseURL}/api/hanja/search?reading=${encodeURIComponent(altReading)}&surname=true&limit=20`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}`
      };
    }
    
    const result = await response.json();
    const hanjaList = result.data || result || [];
    const found = hanjaList.find((h: any) => h.char === testCase.expectedChar);
    
    return {
      success: !!found,
      message: found ? `✓ ${altReading}→${found.char}` : `✗ ${altReading}에서 ${testCase.expectedChar} 없음`
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: `오류: ${error.message}`
    };
  }
}

async function main() {
  console.log('🔍 필수 성씨 30종 스모크 테스트\n');
  console.log('=' .repeat(80));
  
  const baseURL = process.env.API_URL || 'http://localhost:3003';
  console.log(`🌐 API URL: ${baseURL}\n`);
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let totalResponseTime = 0;
  const failedSurnames: string[] = [];
  
  // 각 성씨 테스트
  for (const testCase of ESSENTIAL_SURNAME_TESTS) {
    totalTests++;
    process.stdout.write(`\n📌 ${testCase.displayName}: `);
    
    const result = await testSurname(testCase, baseURL);
    totalResponseTime += result.responseTime;
    
    if (result.success) {
      passedTests++;
      console.log(result.message);
    } else {
      failedTests++;
      failedSurnames.push(testCase.displayName);
      console.log(result.message);
    }
    
    // 대체 읽기 테스트
    if (testCase.alternativeReadings) {
      for (const altReading of testCase.alternativeReadings) {
        process.stdout.write(`   └─ 두음법칙 ${altReading}: `);
        const altResult = await testAlternativeReading(testCase, altReading, baseURL);
        console.log(altResult.message);
        
        if (!altResult.success) {
          console.log(`      ⚠️  두음법칙 매핑 누락`);
        }
      }
    }
    
    // Rate limiting 방지
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 조(曺) 추가 테스트
  console.log('\n📌 조(曺) 중복 확인:');
  const joUrl = `${baseURL}/api/hanja/search?reading=${encodeURIComponent('조')}&surname=true&limit=20`;
  try {
    const response = await fetch(joUrl);
    const result = await response.json();
    const hanjaList = result.data || result || [];
    
    const hasJo1 = hanjaList.find((h: any) => h.char === '趙');
    const hasJo2 = hanjaList.find((h: any) => h.char === '曺');
    
    if (hasJo1 && hasJo2) {
      console.log(`   ✓ 趙와 曺 모두 검색됨`);
    } else if (hasJo1) {
      console.log(`   ⚠️  趙만 검색됨 (曺 누락)`);
    } else if (hasJo2) {
      console.log(`   ⚠️  曺만 검색됨 (趙 누락)`);
    } else {
      console.log(`   ✗ 趙와 曺 모두 없음`);
    }
  } catch (error) {
    console.log(`   ✗ 오류 발생`);
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 테스트 결과 요약:\n');
  console.log(`   총 테스트: ${totalTests}개`);
  console.log(`   ✅ 성공: ${passedTests}개 (${(passedTests/totalTests*100).toFixed(1)}%)`);
  console.log(`   ❌ 실패: ${failedTests}개 (${(failedTests/totalTests*100).toFixed(1)}%)`);
  console.log(`   ⏱️  평균 응답시간: ${Math.round(totalResponseTime / totalTests)}ms`);
  
  if (failedSurnames.length > 0) {
    console.log(`\n❌ 실패한 성씨 목록:`);
    failedSurnames.forEach(surname => {
      console.log(`   - ${surname}`);
    });
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
  const successRate = (passedTests / totalTests) * 100;
  console.log('\n🎯 최종 판정:');
  if (successRate === 100) {
    console.log('   ✅ 모든 필수 성씨 검색 성공! QA 통과');
  } else if (successRate >= 90) {
    console.log(`   ⚠️  ${successRate.toFixed(1)}% 성공률 - 일부 개선 필요`);
  } else {
    console.log(`   ❌ ${successRate.toFixed(1)}% 성공률 - 주요 개선 필요`);
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// 실행
main().catch(console.error);