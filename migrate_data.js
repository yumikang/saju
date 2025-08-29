import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const pgPrisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // SQLite에서 JSON 형태로 데이터 추출
    console.log('Exporting data from SQLite...');
    
    // HanjaDict 데이터 추출
    const hanjaDict = JSON.parse(
      execSync('sqlite3 prisma/dev.db "SELECT json_group_array(json_object(\\'id\\', id, \\'character\\', character, \\'meaning\\', meaning, \\'strokes\\', strokes, \\'element\\', element, \\'yin_yang\\', yin_yang, \\'review\\', review, \\'evidence_json\\', evidence_json, \\'decided_by\\', decided_by, \\'ruleset\\', ruleset, \\'codepoint\\', codepoint, \\'korean_reading\\', korean_reading, \\'chinese_reading\\', chinese_reading, \\'radical\\', radical, \\'usage_frequency\\', usage_frequency, \\'name_frequency\\', name_frequency, \\'category\\', category, \\'gender\\', gender, \\'created_at\\', created_at, \\'updated_at\\', updated_at)) FROM hanja_dict;"').toString()
    );
    
    // HanjaReading 데이터 추출
    const hanjaReading = JSON.parse(
      execSync('sqlite3 prisma/dev.db "SELECT json_group_array(json_object(\\'id\\', id, \\'character\\', character, \\'reading\\', reading, \\'sound_elem\\', sound_elem, \\'is_primary\\', is_primary)) FROM hanja_reading;"').toString()
    );
    
    console.log(`Found ${hanjaDict.length} hanja_dict records and ${hanjaReading.length} hanja_reading records`);
    
    // PostgreSQL에 데이터 삽입
    console.log('Inserting data into PostgreSQL...');
    
    // HanjaDict 마이그레이션
    let hanjaCount = 0;
    for (const hanja of hanjaDict) {
      try {
        await pgPrisma.hanjaDict.create({
          data: {
            id: hanja.id,
            character: hanja.character,
            meaning: hanja.meaning,
            strokes: hanja.strokes,
            element: hanja.element,
            yinYang: hanja.yin_yang,
            review: hanja.review,
            evidenceJSON: hanja.evidence_json,
            decidedBy: hanja.decided_by,
            ruleset: hanja.ruleset,
            codepoint: hanja.codepoint,
            koreanReading: hanja.korean_reading,
            chineseReading: hanja.chinese_reading,
            radical: hanja.radical,
            usageFrequency: hanja.usage_frequency,
            nameFrequency: hanja.name_frequency,
            category: hanja.category,
            gender: hanja.gender,
            createdAt: hanja.created_at ? new Date(Number(hanja.created_at)) : new Date(),
            updatedAt: hanja.updated_at ? new Date(Number(hanja.updated_at)) : new Date()
          }
        });
        hanjaCount++;
        if (hanjaCount % 100 === 0) {
          console.log(`Migrated ${hanjaCount} hanja_dict records...`);
        }
      } catch (error) {
        console.error(`Failed to migrate hanja ${hanja.character}:`, error.message);
      }
    }
    console.log(`Migrated ${hanjaCount} hanja_dict records`);

    // HanjaReading 마이그레이션
    let readingCount = 0;
    for (const reading of hanjaReading) {
      try {
        await pgPrisma.hanjaReading.create({
          data: {
            id: reading.id,
            character: reading.character,
            reading: reading.reading,
            soundElem: reading.sound_elem,
            isPrimary: Boolean(reading.is_primary)
          }
        });
        readingCount++;
        if (readingCount % 100 === 0) {
          console.log(`Migrated ${readingCount} hanja_reading records...`);
        }
      } catch (error) {
        console.error(`Failed to migrate reading ${reading.reading} for ${reading.character}:`, error.message);
      }
    }
    console.log(`Migrated ${readingCount} hanja_reading records`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgPrisma.$disconnect();
  }
}

migrateData();