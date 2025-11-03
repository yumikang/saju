import { PrismaClient } from '@prisma/client';
import { isSurnameHanja } from '../app/lib/korean-surnames.data';

const prisma = new PrismaClient();

/**
 * Comprehensive verification script for surname protection migration
 * Run this AFTER applying the migration to verify everything worked correctly
 */
async function verifySurnameMigration() {
  console.log('='.repeat(80));
  console.log('SURNAME MIGRATION VERIFICATION');
  console.log('='.repeat(80));

  let allPassed = true;

  // Test 1: Count check
  console.log('\n📊 Test 1: Surname Count Verification');
  console.log('-'.repeat(80));
  const surnameCount = await prisma.hanjaDict.count({
    where: { isSurname: true }
  });
  const expected = 132;
  const test1Pass = surnameCount === expected;
  console.log(`Expected: ${expected}`);
  console.log(`Actual: ${surnameCount}`);
  console.log(`Result: ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
  allPassed = allPassed && test1Pass;

  // Test 2: Element distribution check
  console.log('\n📊 Test 2: Element Distribution');
  console.log('-'.repeat(80));
  const elementDist = await prisma.hanjaDict.groupBy({
    by: ['element'],
    where: { isSurname: true },
    _count: true
  });
  let surnameTotal = 0;
  elementDist.forEach(e => {
    console.log(`  ${e.element}: ${e._count}`);
    surnameTotal += e._count;
  });
  const test2Pass = surnameTotal === expected;
  console.log(`Total: ${surnameTotal}`);
  console.log(`Result: ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
  allPassed = allPassed && test2Pass;

  // Test 3: Remaining pool check
  console.log('\n📊 Test 3: Remaining Pool Size');
  console.log('-'.repeat(80));
  const totalHanja = await prisma.hanjaDict.count();
  const nonSurnames = await prisma.hanjaDict.count({
    where: { isSurname: false }
  });
  const remainingUsable = await prisma.hanjaDict.count({
    where: {
      isSurname: false,
      isGoodForNaming: true
    }
  });
  console.log(`Total hanja: ${totalHanja.toLocaleString()}`);
  console.log(`Non-surnames: ${nonSurnames.toLocaleString()}`);
  console.log(`Usable for names: ${remainingUsable.toLocaleString()}`);
  const test3Pass = nonSurnames === (totalHanja - surnameCount);
  console.log(`Result: ${test3Pass ? '✅ PASS' : '❌ FAIL'}`);
  allPassed = allPassed && test3Pass;

  // Test 4: Spot check top surnames
  console.log('\n📊 Test 4: Top 10 Surnames Spot Check');
  console.log('-'.repeat(80));
  const topSurnames = ['金', '李', '朴', '崔', '鄭', '姜', '趙', '尹', '張', '林'];
  let spotCheckPassed = true;
  for (const char of topSurnames) {
    const record = await prisma.hanjaDict.findUnique({
      where: { character: char },
      select: { character: true, isSurname: true, element: true }
    });
    const isMarked = record?.isSurname === true;
    console.log(`  ${char}: ${isMarked ? '✅ marked' : '❌ NOT marked'} (${record?.element})`);
    spotCheckPassed = spotCheckPassed && isMarked;
  }
  console.log(`Result: ${spotCheckPassed ? '✅ PASS' : '❌ FAIL'}`);
  allPassed = allPassed && spotCheckPassed;

  // Test 5: Query performance check
  console.log('\n📊 Test 5: Query Performance Test');
  console.log('-'.repeat(80));
  const startTime = Date.now();
  const sampleQuery = await prisma.hanjaDict.findMany({
    where: {
      element: 'FIRE',
      isSurname: false,
      isGoodForNaming: true,
      strokes: { gte: 5, lte: 15 }
    },
    take: 100
  });
  const queryTime = Date.now() - startTime;
  console.log(`Query returned: ${sampleQuery.length} results`);
  console.log(`Query time: ${queryTime}ms`);
  const test5Pass = queryTime < 1000; // Should be fast with indexes
  console.log(`Result: ${test5Pass ? '✅ PASS (< 1s)' : '⚠️  SLOW (> 1s)'}`);
  allPassed = allPassed && test5Pass;

  // Test 6: Cross-reference with korean-surnames.data.ts
  console.log('\n📊 Test 6: Cross-Reference with Source Data');
  console.log('-'.repeat(80));
  const allSurnames = await prisma.hanjaDict.findMany({
    where: { isSurname: true },
    select: { character: true }
  });
  let crossRefPassed = true;
  let mismatchCount = 0;
  for (const { character } of allSurnames) {
    const isInSourceData = isSurnameHanja(character);
    if (!isInSourceData) {
      console.log(`  ⚠️  ${character} marked as surname but not in source data`);
      crossRefPassed = false;
      mismatchCount++;
    }
  }
  if (crossRefPassed) {
    console.log(`  ✅ All ${allSurnames.length} surnames match source data`);
  } else {
    console.log(`  ❌ ${mismatchCount} mismatches found`);
  }
  console.log(`Result: ${crossRefPassed ? '✅ PASS' : '❌ FAIL'}`);
  allPassed = allPassed && crossRefPassed;

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL RESULT');
  console.log('='.repeat(80));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Migration successful!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update application code to filter isSurname: false');
    console.log('   2. Run integration tests with naming algorithm');
    console.log('   3. Deploy to production');
  } else {
    console.log('❌ SOME TESTS FAILED - Review issues above');
    console.log('\n⚠️  Do NOT deploy until all tests pass');
  }
  console.log('='.repeat(80));

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

verifySurnameMigration().catch((error) => {
  console.error('💥 Error during verification:', error);
  process.exit(1);
});
