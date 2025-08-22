#!/usr/bin/env npx tsx

async function testImprovedAPI() {
  console.log('🔍 개선된 Hanja Search API 테스트\n');
  console.log('='.repeat(80));
  
  const baseURL = 'http://localhost:3003';
  
  // 테스트 케이스
  const tests = [
    {
      name: '기본 검색 - 천',
      params: { reading: '천' },
      expected: { char: '千', hasData: true }
    },
    {
      name: '두음법칙 - 이→李',
      params: { reading: '이', surname: 'true' },
      expected: { char: '李', hasData: true }
    },
    {
      name: '두음법칙 - 리→李',
      params: { reading: '리', surname: 'true' },
      expected: { char: '李', hasData: true }
    },
    {
      name: '페이지네이션',
      params: { reading: '이', limit: '5' },
      expected: { maxCount: 5, hasData: true }
    },
    {
      name: '정렬 - 획수',
      params: { reading: '정', sort: 'strokes' },
      expected: { hasData: true, checkOrder: 'strokes' }
    },
    {
      name: '잘못된 입력 - 빈 문자열',
      params: { reading: '' },
      expected: { error: true, code: 'MISSING_PARAMETER' }
    },
    {
      name: '잘못된 입력 - 너무 긴 문자열',
      params: { reading: '가나다라마바사아자차카타' },
      expected: { error: true, code: 'INVALID_INPUT' }
    },
    {
      name: '잘못된 입력 - 영문',
      params: { reading: 'abc' },
      expected: { error: true, code: 'INVALID_INPUT' }
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📌 ${test.name}`);
    
    const params = new URLSearchParams(test.params);
    const url = `${baseURL}/api/hanja/search?${params}`;
    
    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const elapsed = Date.now() - startTime;
      
      const data = await response.json();
      
      // 응답 시간 체크
      console.log(`  ⏱️  응답 시간: ${elapsed}ms`);
      
      // 에러 케이스 검증
      if (test.expected.error) {
        if (response.ok) {
          console.log(`  ❌ 에러가 예상되었지만 성공 응답`);
        } else if (data.code === test.expected.code) {
          console.log(`  ✅ 예상된 에러 코드: ${data.code}`);
          console.log(`     메시지: ${data.message}`);
        } else {
          console.log(`  ❌ 다른 에러 코드: ${data.code} (예상: ${test.expected.code})`);
        }
        continue;
      }
      
      // 성공 케이스 검증
      if (!response.ok) {
        console.log(`  ❌ HTTP ${response.status}: ${data.message || response.statusText}`);
        continue;
      }
      
      // 페이지네이션 응답 확인
      if (data.data && Array.isArray(data.data)) {
        console.log(`  ✅ 결과 수: ${data.data.length}개`);
        
        if (data.pagination) {
          console.log(`     페이지네이션: 총 ${data.pagination.total}개, hasMore: ${data.pagination.hasMore}`);
        }
        
        // 최대 개수 체크
        if (test.expected.maxCount && data.data.length > test.expected.maxCount) {
          console.log(`  ❌ 결과가 너무 많음: ${data.data.length} > ${test.expected.maxCount}`);
        }
        
        // 특정 한자 찾기
        if (test.expected.char) {
          const found = data.data.find((h: any) => h.char === test.expected.char);
          if (found) {
            console.log(`  ✅ ${test.expected.char} 발견: ${found.meaning} (${found.koreanReading})`);
            if (found.alternativeReadings?.length > 0) {
              console.log(`     대체 읽기: ${found.alternativeReadings.join(', ')}`);
            }
          } else {
            console.log(`  ❌ ${test.expected.char} 없음`);
          }
        }
        
        // 정렬 체크
        if (test.expected.checkOrder === 'strokes' && data.data.length > 1) {
          const sorted = data.data.every((h: any, i: number) => {
            if (i === 0) return true;
            return h.strokes >= data.data[i - 1].strokes;
          });
          console.log(`  ${sorted ? '✅' : '❌'} 획수 정렬 확인`);
        }
        
        // 처음 3개 출력
        data.data.slice(0, 3).forEach((h: any) => {
          console.log(`     - ${h.char}: ${h.meaning} (${h.strokes}획)`);
        });
      } else if (Array.isArray(data)) {
        // 레거시 응답 형식
        console.log(`  ⚠️  레거시 응답 형식 (배열)`);
        console.log(`  결과 수: ${data.length}개`);
      }
      
      // 성능 목표 체크
      if (elapsed < 200) {
        console.log(`  🚀 우수한 성능 (<200ms)`);
      } else if (elapsed < 500) {
        console.log(`  ✅ 적정 성능 (<500ms)`);
      } else {
        console.log(`  ⚠️  성능 개선 필요 (>500ms)`);
      }
      
    } catch (error: any) {
      console.log(`  ❌ 오류: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 테스트 완료');
}

testImprovedAPI().catch(console.error);