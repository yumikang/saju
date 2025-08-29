import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const pgPrisma = new PrismaClient();

async function migrateSimpleInsert() {
  try {
    console.log('Starting simple insert migration for hanja_dict...');
    
    // SQLite 연결
    const db = new Database('./prisma/dev.db');
    
    // SQLite에서 데이터 읽기
    const hanjaDict = db.prepare('SELECT * FROM hanja_dict').all();
    console.log(`Found ${hanjaDict.length} hanja_dict records in SQLite`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const hanja of hanjaDict) {
      try {
        await pgPrisma.hanjaDict.create({
          data: {
            id: hanja.id,
            character: hanja.character,
            meaning: hanja.meaning || null,
            strokes: hanja.strokes || null,
            element: hanja.element || null,
            yinYang: hanja.yin_yang || null,
            review: hanja.review || null,
            evidenceJSON: hanja.evidence_json || null,
            decidedBy: hanja.decided_by || null,
            ruleset: hanja.ruleset || null,
            codepoint: hanja.codepoint || null,
            koreanReading: hanja.korean_reading || null,
            chineseReading: hanja.chinese_reading || null,
            radical: hanja.radical || null,
            usageFrequency: hanja.usage_frequency || 0,
            nameFrequency: hanja.name_frequency || 0,
            category: hanja.category || null,
            gender: hanja.gender || null,
            createdAt: hanja.created_at ? new Date(hanja.created_at) : new Date(),
            updatedAt: hanja.updated_at ? new Date(hanja.updated_at) : new Date()
          }
        });
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Migrated ${successCount} hanja_dict records...`);
        }
      } catch (error) {
        console.error(`Failed to migrate hanja ${hanja.character}:`, error.message);
        errorCount++;
        if (errorCount > 50) {
          console.log('Too many errors, stopping...');
          break;
        }
      }
    }
    
    console.log(`Migration completed: ${successCount} success, ${errorCount} errors`);
    
    db.close();
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgPrisma.$disconnect();
  }
}

migrateSimpleInsert();