import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHanjaCounts() {
  try {
    // Total count
    const total = await prisma.hanjaDict.count();
    console.log(`📊 Total hanja in DB: ${total}`);

    // Count by isGoodForNaming
    const goodCount = await prisma.hanjaDict.count({
      where: { isGoodForNaming: true }
    });
    console.log(`✅ isGoodForNaming = true: ${goodCount}`);

    const notGoodCount = await prisma.hanjaDict.count({
      where: { isGoodForNaming: false }
    });
    console.log(`❌ isGoodForNaming = false: ${notGoodCount}`);

    // isGoodForNaming field is NOT NULL, so no null count needed
    console.log(`⚪ isGoodForNaming = null: 0 (field is NOT NULL)`);

    // Count by element
    console.log('\n📈 By Element (only isGoodForNaming = true):');
    const elements = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];
    for (const elem of elements) {
      const count = await prisma.hanjaDict.count({
        where: {
          element: elem as any,
          isGoodForNaming: true
        }
      });
      console.log(`  ${elem}: ${count}`);
    }

    // Sample query like pipeline does
    console.log('\n🔍 Sample query (WOOD element, isGoodForNaming=true, 3-20 strokes):');
    const sampleResults = await prisma.hanjaDict.findMany({
      where: {
        element: 'WOOD',
        isGoodForNaming: true,
        strokes: {
          gte: 3,
          lte: 20
        }
      },
      take: 5
    });
    console.log(`  Found ${sampleResults.length} results (showing first 5):`);
    sampleResults.forEach(h => {
      console.log(`    ${h.character} - ${h.meaning} (${h.strokeCount}획, freq:${h.nameFrequency || 0})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHanjaCounts();
