#!/usr/bin/env npx tsx
/**
 * Direct API test: /api/hanja/search?reading=유&sort=strokes&limit=50
 */
import fetch from 'node-fetch';

async function main() {
  const url = 'http://localhost:3002/api/hanja/search?reading=%EC%9C%A0&sort=strokes&limit=50';

  console.log('\n=== Testing API directly ===');
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.hanja) {
      console.log(`Total results: ${data.hanja.length}\n`);

      // Find 有 position
      const youIndex = data.hanja.findIndex((h: any) => h.char === '有');

      if (youIndex >= 0) {
        console.log(`✅ 有 found at position ${youIndex + 1}`);
        console.log(`   Character: ${data.hanja[youIndex].char}`);
        console.log(`   Meaning: ${data.hanja[youIndex].meaning}`);
        console.log(`   Strokes: ${data.hanja[youIndex].strokes}\n`);
      } else {
        console.log(`❌ 有 NOT found in results!\n`);
      }

      // Show first 20 characters
      console.log('First 20 characters:');
      data.hanja.slice(0, 20).forEach((h: any, idx: number) => {
        const marker = h.char === '有' ? '👉' : '  ';
        console.log(`${marker} ${idx + 1}. ${h.char} (${h.meaning}) - ${h.strokes}획`);
      });
    } else {
      console.log('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Fetch error:', error);
  }
}

main();
