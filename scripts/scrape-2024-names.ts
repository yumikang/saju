#!/usr/bin/env npx tsx
/**
 * 2024년 인기 이름 TOP 100 스크래핑
 *
 * 출처: https://www.namechart.kr/chart/2024
 * - 남아: ?gender=m (page 1, 2)
 * - 여아: ?gender=f (page 1, 2)
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface NameData {
  rank: number;
  name: string;
  count?: number;
  gender: 'M' | 'F';
}

async function scrapeNames() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  2024 TOP 100 Names Scraper                ║');
  console.log('║  Source: namechart.kr                      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const urls = [
    { url: 'https://www.namechart.kr/chart/2024?gender=m', gender: 'M' as const, page: 1 },
    { url: 'https://www.namechart.kr/chart/2024?gender=m&page=2', gender: 'M' as const, page: 2 },
    { url: 'https://www.namechart.kr/chart/2024?gender=f', gender: 'F' as const, page: 1 },
    { url: 'https://www.namechart.kr/chart/2024?gender=f&page=2', gender: 'F' as const, page: 2 },
  ];

  const allNames: NameData[] = [];

  for (const { url, gender, page: pageNum } of urls) {
    console.log(`📄 Scraping ${gender === 'M' ? 'Male' : 'Female'} names (page ${pageNum}): ${url}\n`);

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000); // Wait for dynamic content

      // Extract names from the page
      // Assuming the structure has name elements - we'll need to inspect the actual HTML
      const names = await page.evaluate(() => {
        const results: { rank: number; name: string }[] = [];

        // Try multiple selectors to find the name list
        // Common patterns for ranking lists
        const selectors = [
          '.name-item',
          '.chart-item',
          'tr td',
          '.ranking-name',
          '[class*="name"]',
        ];

        // Try to find table rows or list items
        const rows = document.querySelectorAll('tr, li, .item, [class*="rank"]');

        rows.forEach((row, index) => {
          const text = row.textContent?.trim() || '';

          // Korean name pattern: 2-3 Hangul characters
          const nameMatch = text.match(/([가-힣]{2,3})/);

          if (nameMatch) {
            const name = nameMatch[1];
            // Avoid common non-name words
            if (!['남자', '여자', '순위', '이름', '년도', '통계'].includes(name)) {
              results.push({
                rank: index + 1,
                name: name,
              });
            }
          }
        });

        return results;
      });

      console.log(`  ✅ Found ${names.length} names\n`);

      // Add to collection with gender
      names.forEach((n) => {
        allNames.push({ ...n, gender });
      });

      // Show first 5 as preview
      console.log('  Preview:');
      names.slice(0, 5).forEach((n) => {
        console.log(`    ${n.rank}. ${n.name}`);
      });
      console.log('\n');
    } catch (error) {
      console.error(`  ❌ Error scraping ${url}:`, error);
    }
  }

  await browser.close();

  // Process and deduplicate
  console.log('📊 Processing Results\n');

  const maleNames = allNames
    .filter((n) => n.gender === 'M')
    .map((n) => n.name)
    .filter((name, index, self) => self.indexOf(name) === index) // Deduplicate
    .slice(0, 100); // TOP 100

  const femaleNames = allNames
    .filter((n) => n.gender === 'F')
    .map((n) => n.name)
    .filter((name, index, self) => self.indexOf(name) === index) // Deduplicate
    .slice(0, 100); // TOP 100

  console.log(`  Male names: ${maleNames.length}`);
  console.log(`  Female names: ${femaleNames.length}\n`);

  // Save to file
  const outputDir = path.join(process.cwd(), 'data', 'names');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    source: 'namechart.kr',
    year: 2024,
    scrapedAt: new Date().toISOString(),
    maleNames,
    femaleNames,
    stats: {
      totalMale: maleNames.length,
      totalFemale: femaleNames.length,
      overlap: maleNames.filter((n) => femaleNames.includes(n)).length,
    },
  };

  const outputPath = path.join(outputDir, '2024-top100-names.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`💾 Saved to: ${outputPath}\n`);

  // Display stats
  console.log('📈 Statistics:\n');
  console.log(`  Male names: ${output.stats.totalMale}`);
  console.log(`  Female names: ${output.stats.totalFemale}`);
  console.log(`  Overlap (unisex): ${output.stats.overlap}\n`);

  // Show samples
  console.log('👦 Sample Male Names (first 20):\n');
  console.log('  ' + maleNames.slice(0, 20).join(', ') + '\n');

  console.log('👧 Sample Female Names (first 20):\n');
  console.log('  ' + femaleNames.slice(0, 20).join(', ') + '\n');

  console.log('✅ Scraping Complete!\n');
}

scrapeNames().catch(console.error);
