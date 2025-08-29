import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const pgPrisma = new PrismaClient();

async function fixHanjaReading() {
  try {
    console.log('Fixing hanja_reading data...');
    
    // SQLite 연결
    const db = new Database('./prisma/dev.db');
    
    // SQLite에서 모든 hanja_reading 데이터 가져오기
    const sqliteReadings = db.prepare('SELECT * FROM hanja_reading ORDER BY id').all();
    console.log(`Found ${sqliteReadings.length} readings in SQLite`);
    
    // PostgreSQL에서 기존 데이터 확인
    const existingReadings = await pgPrisma.hanjaReading.findMany();
    console.log(`Found ${existingReadings.length} readings in PostgreSQL`);
    
    // 기존 데이터를 Set으로 변환 (중복 방지용)
    const existingKeys = new Set();
    existingReadings.forEach(r => {
      existingKeys.add(`${r.character}-${r.reading}`);
    });
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const reading of sqliteReadings) {
      const key = `${reading.character}-${reading.reading}`;
      
      if (existingKeys.has(key)) {
        skippedCount++;
        continue;
      }
      
      try {
        // soundElem 변환 (Element enum)
        let soundElemValue = null;
        if (reading.sound_elem) {
          const elementMap = {
            '金': 'METAL',
            '木': 'WOOD',
            '水': 'WATER',
            '火': 'FIRE',
            '土': 'EARTH'
          };
          soundElemValue = elementMap[reading.sound_elem] || null;
        }
        
        await pgPrisma.hanjaReading.create({
          data: {
            id: reading.id,
            character: reading.character,
            reading: reading.reading,
            soundElem: soundElemValue,
            isPrimary: Boolean(reading.is_primary)
          }
        });
        addedCount++;
        
        if (addedCount % 100 === 0) {
          console.log(`Added ${addedCount} new readings...`);
        }
        
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation - 이미 존재함
          skippedCount++;
        } else {
          console.error(`Failed to add reading ${reading.character}-${reading.reading}:`, error.message);
        }
      }
    }
    
    console.log(`Completed: ${addedCount} added, ${skippedCount} skipped`);
    
    // 김/金 관련 데이터 재확인
    const kimReadings = await pgPrisma.hanjaReading.findMany({
      where: {
        OR: [
          { reading: '김' },
          { character: '金' }
        ]
      }
    });
    
    console.log('\nKim/金 readings after fix:');
    kimReadings.forEach(r => console.log(`  ${r.id}: ${r.character} = ${r.reading} (primary: ${r.isPrimary})`));
    
    db.close();
    
  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    await pgPrisma.$disconnect();
  }
}

fixHanjaReading();