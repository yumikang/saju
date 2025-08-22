#!/usr/bin/env npx tsx
// 고급 페이징 테스트 - 엣지 케이스 및 스트레스 테스트

interface PageData {
  pageNum: number;
  items: Array<{ char: string; id: string; order: number | string }>;
  cursor?: string;
}

async function advancedPaginationTest() {
  console.log('🔬 고급 페이징 일관성 테스트\n');
  console.log('=' .repeat(80));
  
  const baseURL = 'http://localhost:3003';
  
  // 테스트 1: 대량 데이터 페이징 (limit=50)
  console.log('\n📌 테스트 1: 대량 데이터 페이징');
  console.log('   limit=50으로 여러 페이지 순회');
  
  const largeSetIds = new Set<string>();
  const largeSetChars: string[] = [];
  let largeCursor: string | undefined = undefined;
  let totalFetched = 0;
  
  for (let page = 1; page <= 3; page++) {
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', '이');
    url.searchParams.set('surname', 'false');  // 성씨 아닌 일반 검색
    url.searchParams.set('limit', '50');
    url.searchParams.set('sort', 'strokes');
    if (largeCursor) {
      url.searchParams.set('cursor', largeCursor);
    }
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        console.log(`   페이지 ${page}: ${data.data.length}개 (누적: ${totalFetched + data.data.length}개)`);
        
        data.data.forEach((hanja: any, idx: number) => {
          if (largeSetIds.has(hanja.id)) {
            console.log(`     ❌ 중복 ID 발견: ${hanja.char}(${hanja.id})`);
          }
          largeSetIds.add(hanja.id);
          largeSetChars.push(hanja.char);
          
          // 처음 몇 개만 표시
          if (idx < 3 || idx >= data.data.length - 2) {
            console.log(`     ${totalFetched + idx + 1}. ${hanja.char} (${hanja.strokes}획)`);
          } else if (idx === 3) {
            console.log(`     ...`);
          }
        });
        
        totalFetched += data.data.length;
        largeCursor = data.pagination?.cursor;
        
        if (!data.pagination?.hasMore) {
          console.log(`   ✓ 마지막 페이지 도달`);
          break;
        }
      }
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
      break;
    }
  }
  
  console.log(`   총 ${totalFetched}개 한자 로드, 중복: ${totalFetched - largeSetIds.size}개`);
  
  // 테스트 2: 정렬 순서 검증
  console.log('\n📌 테스트 2: 정렬 순서 검증');
  console.log('   각 정렬 모드에서 올바른 순서 유지 확인');
  
  const sortTests = [
    { sort: 'strokes', reading: '김', checkField: 'strokes' },
    { sort: 'popularity', reading: '이', checkField: 'nameFrequency' }
  ];
  
  for (const test of sortTests) {
    console.log(`\n   ${test.sort} 정렬 테스트 (${test.reading})`);
    
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', test.reading);
    url.searchParams.set('surname', 'true');
    url.searchParams.set('limit', '10');
    url.searchParams.set('sort', test.sort);
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        let previousValue: number | null = null;
        let isOrdered = true;
        
        data.data.forEach((hanja: any, idx: number) => {
          const value = hanja[test.checkField] || 0;
          console.log(`     ${idx + 1}. ${hanja.char}: ${value}`);
          
          if (previousValue !== null) {
            if (test.sort === 'popularity' && value > previousValue) {
              // popularity는 내림차순
              console.log(`       ❌ 순서 오류: ${value} > ${previousValue}`);
              isOrdered = false;
            } else if (test.sort === 'strokes' && value < previousValue) {
              // strokes는 오름차순
              console.log(`       ❌ 순서 오류: ${value} < ${previousValue}`);
              isOrdered = false;
            }
          }
          previousValue = value;
        });
        
        console.log(`     ${isOrdered ? '✅' : '❌'} 정렬 순서 ${isOrdered ? '올바름' : '오류'}`);
      }
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
    }
  }
  
  // 테스트 3: 커서 점프 테스트
  console.log('\n📌 테스트 3: 커서 점프 테스트');
  console.log('   1페이지 → 3페이지 직접 이동 시도');
  
  const pages: PageData[] = [];
  let jumpCursor: string | undefined = undefined;
  
  // 먼저 3페이지까지 순차 로드하여 커서 수집
  for (let i = 0; i < 3; i++) {
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', '박');
    url.searchParams.set('surname', 'true');
    url.searchParams.set('limit', '3');
    url.searchParams.set('sort', 'strokes');
    if (jumpCursor) {
      url.searchParams.set('cursor', jumpCursor);
    }
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      const pageData: PageData = {
        pageNum: i + 1,
        items: [],
        cursor: data.pagination?.cursor
      };
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((hanja: any) => {
          pageData.items.push({
            char: hanja.char,
            id: hanja.id,
            order: hanja.strokes
          });
        });
      }
      
      pages.push(pageData);
      jumpCursor = data.pagination?.cursor;
      
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
      break;
    }
  }
  
  // 2페이지 커서로 직접 3페이지 접근
  if (pages.length >= 2 && pages[1].cursor) {
    console.log(`   2페이지 커서로 3페이지 직접 접근 시도`);
    
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', '박');
    url.searchParams.set('surname', 'true');
    url.searchParams.set('limit', '3');
    url.searchParams.set('sort', 'strokes');
    url.searchParams.set('cursor', pages[1].cursor);
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const directPage3 = data.data.map((h: any) => h.char).join(', ');
        const originalPage3 = pages[2]?.items.map(i => i.char).join(', ') || 'N/A';
        
        console.log(`   원래 3페이지: ${originalPage3}`);
        console.log(`   직접 접근 3페이지: ${directPage3}`);
        console.log(`   ${directPage3 === originalPage3 ? '✅ 일치' : '❌ 불일치'}`);
      }
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
    }
  }
  
  // 테스트 4: 동시 요청 테스트
  console.log('\n📌 테스트 4: 동시 요청 테스트');
  console.log('   여러 요청을 동시에 보내도 일관된 결과 반환');
  
  const concurrentPromises = [];
  for (let i = 0; i < 5; i++) {
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', '정');
    url.searchParams.set('surname', 'true');
    url.searchParams.set('limit', '5');
    url.searchParams.set('sort', 'popularity');
    
    concurrentPromises.push(
      fetch(url.toString()).then(r => r.json())
    );
  }
  
  try {
    const results = await Promise.all(concurrentPromises);
    const firstResult = results[0].data?.map((h: any) => h.char).join('') || '';
    let allSame = true;
    
    results.forEach((result, idx) => {
      const chars = result.data?.map((h: any) => h.char).join('') || '';
      if (chars !== firstResult) {
        console.log(`   ❌ 요청 ${idx + 1} 결과 불일치: ${chars}`);
        allSame = false;
      }
    });
    
    console.log(`   ${allSame ? '✅' : '❌'} ${results.length}개 동시 요청 ${allSame ? '모두 일치' : '불일치 발생'}`);
    
  } catch (error) {
    console.log(`   ❌ 에러: ${error}`);
  }
  
  // 테스트 5: 빈 결과 처리
  console.log('\n📌 테스트 5: 빈 결과 및 엣지 케이스');
  
  const edgeCases = [
    { reading: 'zzz', desc: '존재하지 않는 읽기' },
    { reading: '팥', desc: '드문 읽기' }
  ];
  
  for (const testCase of edgeCases) {
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', testCase.reading);
    url.searchParams.set('surname', 'false');
    url.searchParams.set('limit', '10');
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      console.log(`   ${testCase.desc} (${testCase.reading}): ${data.data?.length || 0}개 결과`);
      console.log(`     pagination: ${JSON.stringify(data.pagination)}`);
      
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n✅ 고급 페이징 테스트 완료');
}

// 실행
advancedPaginationTest().catch(console.error);