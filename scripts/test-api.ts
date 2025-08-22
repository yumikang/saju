#!/usr/bin/env npx tsx

async function testAPI() {
  console.log('🔍 Testing Hanja Search API...\n');
  
  const baseURL = 'http://localhost:3003';
  const testCases = [
    { reading: '천', expected: '千' },
    { reading: '이', expected: '李' },
    { reading: '김', expected: '金' }
  ];
  
  for (const test of testCases) {
    console.log(`Testing: ${test.reading}`);
    
    try {
      const response = await fetch(`${baseURL}/api/hanja/search?reading=${test.reading}`);
      
      if (!response.ok) {
        console.error(`  ❌ HTTP ${response.status}: ${response.statusText}`);
        const text = await response.text();
        console.error(`  Response: ${text.substring(0, 200)}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`  ✅ Found ${data.length} results`);
      
      const expectedChar = data.find((h: any) => h.char === test.expected);
      if (expectedChar) {
        console.log(`  ✅ Found expected character: ${expectedChar.char} (${expectedChar.meaning})`);
      } else {
        console.log(`  ⚠️ Expected character ${test.expected} not found`);
      }
      
      // 처음 3개 결과 출력
      data.slice(0, 3).forEach((hanja: any) => {
        console.log(`    - ${hanja.char}: ${hanja.meaning} (${hanja.koreanReading})`);
      });
      
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
    
    console.log('');
  }
}

testAPI().catch(console.error);