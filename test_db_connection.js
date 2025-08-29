import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // 연결 테스트
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 테이블 데이터 확인
    const hanjaReadingCount = await prisma.hanjaReading.count();
    console.log(`hanja_reading count: ${hanjaReadingCount}`);
    
    const hanjaDictCount = await prisma.hanjaDict.count();
    console.log(`hanja_dict count: ${hanjaDictCount}`);
    
    // 김 관련 데이터 확인
    const kimReadings = await prisma.hanjaReading.findMany({
      where: {
        reading: '김'
      }
    });
    console.log(`김 readings found: ${kimReadings.length}`);
    kimReadings.forEach(r => console.log(`  - ${r.character}: ${r.reading}`));
    
    // 金 한자 확인
    const goldHanja = await prisma.hanjaDict.findFirst({
      where: {
        character: '金'
      }
    });
    console.log('금(金) hanja:', goldHanja ? {
      character: goldHanja.character,
      meaning: goldHanja.meaning,
      koreanReading: goldHanja.koreanReading
    } : 'NOT FOUND');
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();