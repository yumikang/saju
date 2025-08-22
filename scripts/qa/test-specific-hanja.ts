#!/usr/bin/env npx tsx

async function testSpecificHanja() {
  const tests = [
    { reading: '여', char: '麗' },
    { reading: '려', char: '麗' },
    { reading: '연', char: '蓮' },
    { reading: '련', char: '蓮' },
    { reading: '예', char: '禮' },
    { reading: '례', char: '禮' }
  ];
  
  console.log('Testing specific problematic hanja:');
  console.log('='.repeat(40));
  
  for (const test of tests) {
    try {
      // Test with surname=true
      const res1 = await fetch(`http://localhost:3003/api/hanja/search?reading=${encodeURIComponent(test.reading)}&surname=true&limit=20`);
      const data1 = await res1.json();
      const list1 = data1.data || data1 || [];
      const found1 = list1.find((h: any) => h.char === test.char);
      
      // Test without surname
      const res2 = await fetch(`http://localhost:3003/api/hanja/search?reading=${encodeURIComponent(test.reading)}&limit=20`);
      const data2 = await res2.json();
      const list2 = data2.data || data2 || [];
      const found2 = list2.find((h: any) => h.char === test.char);
      
      const pos1 = found1 ? list1.findIndex((h: any) => h.char === test.char) + 1 : 0;
      const pos2 = found2 ? list2.findIndex((h: any) => h.char === test.char) + 1 : 0;
      
      console.log(`${test.reading}→${test.char}: surname=${found1 ? `✓(${pos1}위)` : '✗'}, normal=${found2 ? `✓(${pos2}위)` : '✗'}`);
      
      if (!found1 && !found2) {
        console.log(`  Top 3: ${list2.slice(0,3).map((h: any) => h.char).join(', ')}`);
      }
    } catch (e: any) {
      console.log(`${test.reading}→${test.char}: Error: ${e.message}`);
    }
  }
}

testSpecificHanja();