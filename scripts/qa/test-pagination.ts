#!/usr/bin/env npx tsx
// 페이징 및 정렬 일관성 테스트
// 커서 기반 페이지네이션의 안정성 검증

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  duplicates?: string[];
  missing?: string[];
}

async function testPaginationConsistency() {
  console.log('🔍 페이징 및 정렬 일관성 테스트\n');
  console.log('=' .repeat(80));
  
  const baseURL = 'http://localhost:3003';
  const results: TestResult[] = [];
  
  // 테스트 1: 중복/누락 검사 (popularity 정렬)
  console.log('\n📌 테스트 1: 중복/누락 검사 (popularity 정렬)');
  console.log('   전체 페이지를 순회하며 중복/누락 확인');
  
  const allCharacters = new Set<string>();
  const seenCharacters = new Set<string>();
  const duplicateCharacters = new Set<string>();
  let cursor: string | undefined = undefined;
  let pageNum = 1;
  let hasMore = true;
  
  while (hasMore && pageNum <= 10) {  // 최대 10페이지까지
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', '김');
    url.searchParams.set('surname', 'true');
    url.searchParams.set('limit', '5');
    url.searchParams.set('sort', 'popularity');
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      console.log(`   페이지 ${pageNum}: ${data.data?.length || 0}개 결과`);
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((hanja: any) => {
          const key = `${hanja.char}(${hanja.id})`;
          
          if (seenCharacters.has(key)) {
            duplicateCharacters.add(key);
            console.log(`     ❌ 중복 발견: ${key}`);
          }
          seenCharacters.add(key);
          allCharacters.add(key);
        });
      }
      
      cursor = data.pagination?.cursor;
      hasMore = data.pagination?.hasMore || false;
      pageNum++;
      
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
      hasMore = false;
    }
  }
  
  results.push({
    testName: '중복/누락 검사 (popularity)',
    passed: duplicateCharacters.size === 0,
    details: `총 ${allCharacters.size}개 한자, 중복 ${duplicateCharacters.size}개`,
    duplicates: Array.from(duplicateCharacters)
  });
  
  // 테스트 2: 정렬 기준 변경 시 일관성
  console.log('\n📌 테스트 2: 정렬 기준 변경 시 일관성');
  console.log('   같은 reading에 대해 다른 정렬 기준 적용');
  
  const sortTypes = ['popularity', 'strokes', 'element'];
  const sortResults: Record<string, Set<string>> = {};
  
  for (const sortType of sortTypes) {
    console.log(`\n   정렬: ${sortType}`);
    const collected = new Set<string>();
    let sortCursor: string | undefined = undefined;
    let page = 1;
    
    for (let i = 0; i < 3; i++) {  // 3페이지까지
      const url = new URL(`${baseURL}/api/hanja/search`);
      url.searchParams.set('reading', '이');
      url.searchParams.set('surname', 'true');
      url.searchParams.set('limit', '5');
      url.searchParams.set('sort', sortType);
      if (sortCursor) {
        url.searchParams.set('cursor', sortCursor);
      }
      
      try {
        const response = await fetch(url.toString());
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((hanja: any) => {
            const info = `${hanja.char}(${sortType === 'strokes' ? hanja.strokes : 
                          sortType === 'element' ? hanja.element : 
                          hanja.nameFrequency})`;
            collected.add(info);
            console.log(`     ${info}`);
          });
        }
        
        sortCursor = data.pagination?.cursor;
        if (!data.pagination?.hasMore) break;
        
      } catch (error) {
        console.log(`     ❌ 에러: ${error}`);
        break;
      }
    }
    
    sortResults[sortType] = collected;
  }
  
  // 각 정렬에서 중복 체크
  let sortTestPassed = true;
  for (const [sortType, chars] of Object.entries(sortResults)) {
    const charArray = Array.from(chars);
    const uniqueChars = new Set(charArray.map(c => c.split('(')[0]));
    if (uniqueChars.size !== charArray.length) {
      console.log(`   ❌ ${sortType} 정렬에서 중복 발견`);
      sortTestPassed = false;
    }
  }
  
  results.push({
    testName: '정렬 기준 변경 일관성',
    passed: sortTestPassed,
    details: `${sortTypes.length}개 정렬 모드 테스트 완료`
  });
  
  // 테스트 3: 재현성 테스트
  console.log('\n📌 테스트 3: 재현성 테스트');
  console.log('   동일한 요청을 반복했을 때 같은 결과 반환');
  
  const testReading = '박';
  const testSort = 'popularity';
  const testLimit = '10';
  
  const firstRequest: string[] = [];
  const secondRequest: string[] = [];
  
  // 첫 번째 요청
  const url1 = new URL(`${baseURL}/api/hanja/search`);
  url1.searchParams.set('reading', testReading);
  url1.searchParams.set('surname', 'true');
  url1.searchParams.set('limit', testLimit);
  url1.searchParams.set('sort', testSort);
  
  try {
    const response1 = await fetch(url1.toString());
    const data1 = await response1.json();
    
    if (data1.data && Array.isArray(data1.data)) {
      data1.data.forEach((hanja: any) => {
        firstRequest.push(`${hanja.char}:${hanja.id}`);
      });
    }
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 두 번째 요청 (동일)
    const response2 = await fetch(url1.toString());
    const data2 = await response2.json();
    
    if (data2.data && Array.isArray(data2.data)) {
      data2.data.forEach((hanja: any) => {
        secondRequest.push(`${hanja.char}:${hanja.id}`);
      });
    }
    
  } catch (error) {
    console.log(`   ❌ 에러: ${error}`);
  }
  
  const isIdentical = firstRequest.length === secondRequest.length &&
                      firstRequest.every((item, index) => item === secondRequest[index]);
  
  results.push({
    testName: '재현성 테스트',
    passed: isIdentical,
    details: `첫 번째: ${firstRequest.length}개, 두 번째: ${secondRequest.length}개`
  });
  
  // 테스트 4: 커서 왕복 테스트
  console.log('\n📌 테스트 4: 커서 왕복 테스트');
  console.log('   1페이지 → 2페이지 → 3페이지 순회 후 확인');
  
  const pages: Array<string[]> = [];
  let navCursor: string | undefined = undefined;
  
  for (let i = 0; i < 3; i++) {
    const url = new URL(`${baseURL}/api/hanja/search`);
    url.searchParams.set('reading', '최');
    url.searchParams.set('surname', 'true');
    url.searchParams.set('limit', '3');
    url.searchParams.set('sort', 'strokes');
    if (navCursor) {
      url.searchParams.set('cursor', navCursor);
    }
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      const pageData: string[] = [];
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((hanja: any) => {
          pageData.push(`${hanja.char}(${hanja.strokes}획)`);
        });
      }
      
      pages.push(pageData);
      navCursor = data.pagination?.cursor;
      
      console.log(`   페이지 ${i + 1}: ${pageData.join(', ')}`);
      
      if (!data.pagination?.hasMore) break;
      
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`);
      break;
    }
  }
  
  // 중복 체크
  const allItems = pages.flat();
  const uniqueItems = new Set(allItems);
  const navigationPassed = allItems.length === uniqueItems.size;
  
  results.push({
    testName: '커서 왕복 테스트',
    passed: navigationPassed,
    details: `${pages.length}페이지 순회, 총 ${allItems.length}개 항목, 중복 ${allItems.length - uniqueItems.size}개`
  });
  
  // 결과 요약
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 테스트 결과 요약:\n');
  
  let totalPassed = 0;
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.testName}`);
    console.log(`   ${result.details}`);
    
    if (result.duplicates && result.duplicates.length > 0) {
      console.log(`   중복 항목: ${result.duplicates.join(', ')}`);
    }
    
    if (result.passed) totalPassed++;
  });
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n🎯 합격률: ${totalPassed}/${results.length} (${Math.round(totalPassed/results.length * 100)}%)`);
  
  // 개선 제안
  if (totalPassed < results.length) {
    console.log('\n💡 개선 제안:');
    console.log('1. 커서를 단순 ID가 아닌 (정렬키, ID) 복합키로 구성');
    console.log('2. 정렬 기준별로 다른 커서 전략 적용');
    console.log('3. 커서 토큰화로 내부 구조 은닉');
    console.log('4. 정렬 안정성을 위한 보조 정렬 키 추가');
  }
}

// 실행
testPaginationConsistency().catch(console.error);