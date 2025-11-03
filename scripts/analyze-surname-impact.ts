import { PrismaClient } from '@prisma/client';
import { KOREAN_SURNAMES_DATA } from '../app/lib/korean-surnames.data';

const prisma = new PrismaClient();

// Extract unique surname hanja (same logic as before)
function extractUniqueSurnameHanja(): string[] {
  const allHanja = KOREAN_SURNAMES_DATA.flatMap(item => item.hanja);
  const expandedHanja: string[] = [];
  for (const hanja of allHanja) {
    if (hanja.length > 1) {
      expandedHanja.push(...hanja.split(''));
    } else {
      expandedHanja.push(hanja);
    }
  }
  return [...new Set(expandedHanja)].sort();
}

async function analyzeSurnameImpact() {
  console.log('='.repeat(80));
  console.log('SURNAME DATABASE IMPACT ANALYSIS');
  console.log('='.repeat(80));

  const surnameHanja = extractUniqueSurnameHanja();
  console.log(`\n📊 Step 1: Extracted ${surnameHanja.length} unique surname hanja from data file\n`);

  // Step 2: Check database status
  console.log('📊 Step 2: Database Status Check');
  console.log('-'.repeat(80));

  const totalHanja = await prisma.hanjaDict.count();
  console.log(`Total hanja in database: ${totalHanja.toLocaleString()}`);

  const usableHanja = await prisma.hanjaDict.count({
    where: { element: { not: null } }
  });
  console.log(`Current usable pool (element IS NOT NULL): ${usableHanja}`);

  // Step 3: Cross-check surnames in database
  console.log('\n📊 Step 3: Surname Cross-Check');
  console.log('-'.repeat(80));

  const surnamesInDb = await prisma.hanjaDict.findMany({
    where: {
      character: { in: surnameHanja }
    },
    select: {
      character: true,
      element: true,
      nameFrequency: true,
      strokes: true,
      meaning: true
    }
  });

  console.log(`Surnames found in database: ${surnamesInDb.length} / ${surnameHanja.length}`);

  const surnamesWithElement = surnamesInDb.filter(h => h.element !== null);
  console.log(`Surnames in usable pool (have element): ${surnamesWithElement.length}`);
  console.log(`Surnames NOT in usable pool: ${surnamesInDb.length - surnamesWithElement.length}`);

  // Missing surnames
  const foundCharacters = new Set(surnamesInDb.map(h => h.character));
  const missingSurnames = surnameHanja.filter(h => !foundCharacters.has(h));
  if (missingSurnames.length > 0) {
    console.log(`\n⚠️  Missing from database (${missingSurnames.length}): ${missingSurnames.join(', ')}`);
  }

  // Step 4: Impact Analysis
  console.log('\n📊 Step 4: Impact Analysis');
  console.log('-'.repeat(80));

  const impactPercentage = ((surnamesWithElement.length / usableHanja) * 100).toFixed(1);
  const remainingPool = usableHanja - surnamesWithElement.length;

  console.log(`Current usable pool: ${usableHanja} hanja`);
  console.log(`Surnames in usable pool: ${surnamesWithElement.length} hanja (${impactPercentage}%)`);
  console.log(`Remaining after filtering: ${remainingPool} hanja`);
  console.log(`\n🎯 Pool reduction: ${usableHanja} → ${remainingPool} (-${surnamesWithElement.length} surnames)`);

  // Step 5: Top surnames analysis
  console.log('\n📊 Step 5: Top Surnames Status (Top 30)');
  console.log('-'.repeat(80));

  const top30 = KOREAN_SURNAMES_DATA.slice(0, 30);
  const top30Hanja = top30.flatMap(item => {
    return item.hanja.flatMap(h => h.length > 1 ? h.split('') : [h]);
  });
  const uniqueTop30 = [...new Set(top30Hanja)];

  console.log('Rank | Korean | Hanja | In DB? | Element | Name Freq');
  console.log('-'.repeat(80));

  for (const surname of top30) {
    const hanjaList = surname.hanja;
    for (const hanja of hanjaList) {
      const chars = hanja.length > 1 ? hanja.split('') : [hanja];
      for (const char of chars) {
        const dbRecord = surnamesInDb.find(h => h.character === char);
        const inDb = dbRecord ? '✓' : '✗';
        const element = dbRecord?.element || '-';
        const nameFreq = dbRecord?.nameFrequency || 0;
        console.log(`${surname.rank.toString().padStart(4)} | ${surname.korean.padEnd(6)} | ${char} | ${inDb.padEnd(6)} | ${element?.padEnd(7) || '-'.padEnd(7)} | ${nameFreq}`);
      }
    }
  }

  // Step 6: Recommendations
  console.log('\n📊 Step 6: Recommendations');
  console.log('-'.repeat(80));

  if (remainingPool < 100) {
    console.log('🚨 CRITICAL: Remaining pool very small (<100), consider:');
    console.log('   1. Emergency review of filtered hanja');
    console.log('   2. Adding more hanja with element data');
    console.log('   3. Re-evaluate filtering criteria');
  } else if (remainingPool < 150) {
    console.log('⚠️  WARNING: Remaining pool moderate (100-150), monitor closely');
    console.log('   1. Consider expanding hanja database');
    console.log('   2. Review surname filtering policy');
  } else {
    console.log('✅ ACCEPTABLE: Remaining pool sufficient (>150)');
    console.log('   1. Proceed with surname filtering');
    console.log('   2. Monitor usage patterns');
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Review SQL migration scripts');
  console.log('   2. Add isSurname column to schema');
  console.log('   3. Mark all 132 surnames in database');
  console.log('   4. Update WHERE clauses to exclude surnames');
  console.log('   5. Test naming algorithm with new filter');

  await prisma.$disconnect();
}

analyzeSurnameImpact().catch(console.error);
