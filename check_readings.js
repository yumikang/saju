import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReadings() {
  try {
    console.log('Checking hanja_reading data...');
    
    // 전체 읽기 샘플
    const sampleReadings = await prisma.hanjaReading.findMany({
      take: 10
    });
    console.log('Sample readings:');
    sampleReadings.forEach(r => console.log(`  ${r.id}: ${r.character} = ${r.reading}`));
    
    // 김/金 관련 검색
    const kimRelated = await prisma.hanjaReading.findMany({
      where: {
        OR: [
          { reading: '김' },
          { character: '金' }
        ]
      }
    });
    console.log('\nKim/金 related readings:');
    kimRelated.forEach(r => console.log(`  ${r.id}: ${r.character} = ${r.reading}`));
    
    // 모든 고유 읽기 확인 (처음 20개만)
    const allReadings = await prisma.hanjaReading.findMany({
      select: { reading: true },
      distinct: ['reading'],
      take: 20
    });
    console.log('\nFirst 20 unique readings:');
    allReadings.forEach(r => console.log(`  - ${r.reading}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReadings();