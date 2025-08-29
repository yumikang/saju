import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const pgPrisma = new PrismaClient();

// 한자 오행을 Prisma enum 값으로 변환하는 매핑
const ELEMENT_MAP = {
  '金': 'METAL',
  '木': 'WOOD', 
  '水': 'WATER',
  '火': 'FIRE',
  '土': 'EARTH'
};

async function migrateWithEnum() {
  try {
    console.log('Starting hanja_dict migration with enum conversion...');
    
    // SQLite 연결
    const db = new Database('./prisma/dev.db');
    
    // SQLite에서 데이터 읽기
    const hanjaDict = db.prepare('SELECT * FROM hanja_dict').all();
    console.log(`Found ${hanjaDict.length} hanja_dict records in SQLite`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const hanja of hanjaDict) {
      try {
        // element 변환
        let elementValue = null;
        if (hanja.element && ELEMENT_MAP[hanja.element]) {
          elementValue = ELEMENT_MAP[hanja.element];
        }
        
        await pgPrisma.hanjaDict.create({
          data: {
            id: hanja.id,
            character: hanja.character,
            meaning: hanja.meaning || null,
            strokes: hanja.strokes || null,
            element: elementValue,  // 변환된 enum 값 사용
            yinYang: hanja.yin_yang || null,
            review: hanja.review || 'ok',
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

migrateWithEnum();