import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const pgPrisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('Starting simple migration...');
    
    // CSV 파일 읽기 (수동 파싱)
    const hanjaDict = fs.readFileSync('data_migration/hanja_dict.csv', 'utf8');
    const hanjaReading = fs.readFileSync('data_migration/hanja_reading.csv', 'utf8');
    
    // HanjaDict CSV 파싱
    const hanjaDictLines = hanjaDict.split('\n').slice(1); // 헤더 제외
    console.log(`Processing ${hanjaDictLines.length - 1} hanja_dict records...`);
    
    let hanjaCount = 0;
    for (const line of hanjaDictLines) {
      if (!line.trim()) continue;
      
      // CSV 파싱 (간단한 구현)
      const parts = line.split('","');
      if (parts.length < 20) continue;
      
      try {
        const [
          id, character, meaning, strokes, element, yinYang, review, evidenceJSON, 
          decidedBy, ruleset, codepoint, koreanReading, chineseReading, radical,
          usageFrequency, nameFrequency, category, gender, createdAt, updatedAt
        ] = parts.map(p => p.replace(/^"|"$/g, ''));
        
        await pgPrisma.hanjaDict.create({
          data: {
            id,
            character,
            meaning: meaning || null,
            strokes: parseInt(strokes) || null,
            element: element || null,
            yinYang: yinYang || null,
            review: review || null,
            evidenceJSON: evidenceJSON || null,
            decidedBy: decidedBy || null,
            ruleset: ruleset || null,
            codepoint: parseInt(codepoint) || null,
            koreanReading: koreanReading || null,
            chineseReading: chineseReading || null,
            radical: radical || null,
            usageFrequency: parseInt(usageFrequency) || 0,
            nameFrequency: parseInt(nameFrequency) || 0,
            category: category || null,
            gender: gender || null,
            createdAt: createdAt ? new Date(parseInt(createdAt)) : new Date(),
            updatedAt: updatedAt ? new Date(parseInt(updatedAt)) : new Date()
          }
        });
        
        hanjaCount++;
        if (hanjaCount % 100 === 0) {
          console.log(`Migrated ${hanjaCount} hanja_dict records...`);
        }
      } catch (error) {
        console.error(`Failed to migrate hanja line:`, error.message);
      }
    }
    console.log(`Migrated ${hanjaCount} hanja_dict records total`);
    
    // HanjaReading CSV 파싱
    const hanjaReadingLines = hanjaReading.split('\n').slice(1); // 헤더 제외
    console.log(`Processing ${hanjaReadingLines.length - 1} hanja_reading records...`);
    
    let readingCount = 0;
    for (const line of hanjaReadingLines) {
      if (!line.trim()) continue;
      
      const parts = line.split(',');
      if (parts.length < 5) continue;
      
      try {
        const [id, character, reading, soundElem, isPrimary] = parts;
        
        await pgPrisma.hanjaReading.create({
          data: {
            id: parseInt(id),
            character: character.replace(/"/g, ''),
            reading: reading.replace(/"/g, ''),
            soundElem: soundElem.replace(/"/g, '') || null,
            isPrimary: isPrimary.trim() === '1'
          }
        });
        
        readingCount++;
        if (readingCount % 100 === 0) {
          console.log(`Migrated ${readingCount} hanja_reading records...`);
        }
      } catch (error) {
        console.error(`Failed to migrate reading line:`, error.message);
      }
    }
    console.log(`Migrated ${readingCount} hanja_reading records total`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgPrisma.$disconnect();
  }
}

migrateData();