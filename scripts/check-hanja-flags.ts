/**
 * Check isGoodForNaming flags for specific characters
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const problemChars = ['遊', '味', '衝', '齒', '種'];

  console.log('\n=== Checking isGoodForNaming flags ===\n');

  for (const char of problemChars) {
    const result = await prisma.hanjaDict.findFirst({
      where: { character: char },
      select: {
        character: true,
        meaning: true,
        isGoodForNaming: true,
        nameFrequency: true,
        koreanReading: true,
      }
    });

    if (result) {
      console.log(`${result.character} (${result.koreanReading}): ${result.meaning}`);
      console.log(`  isGoodForNaming: ${result.isGoodForNaming}`);
      console.log(`  nameFrequency: ${result.nameFrequency}\n`);
    } else {
      console.log(`${char}: NOT FOUND\n`);
    }
  }

  // Also check how many total characters have isGoodForNaming = true
  const totalGood = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  const totalAll = await prisma.hanjaDict.count();

  console.log(`\n=== Summary ===`);
  console.log(`Total characters with isGoodForNaming=true: ${totalGood}`);
  console.log(`Total characters in database: ${totalAll}`);
  console.log(`Percentage: ${((totalGood / totalAll) * 100).toFixed(1)}%\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
