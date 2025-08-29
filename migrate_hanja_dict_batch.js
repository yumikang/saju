import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const pgPrisma = new PrismaClient();

async function migrateHanjaDictBatch() {
  try {
    console.log('Starting batch hanja_dict migration...');
    
    // 먼저 총 레코드 수 확인
    const countResult = execSync('sqlite3 prisma/dev.db "SELECT COUNT(*) FROM hanja_dict;"').toString().trim();
    const totalCount = parseInt(countResult);
    console.log(`Total hanja_dict records: ${totalCount}`);
    
    const batchSize = 500;
    let successCount = 0;
    let errorCount = 0;
    
    for (let offset = 0; offset < totalCount; offset += batchSize) {
      console.log(`Processing batch ${Math.floor(offset/batchSize) + 1}/${Math.ceil(totalCount/batchSize)} (offset: ${offset})...`);
      
      try {
        const batch = JSON.parse(
          execSync(`sqlite3 prisma/dev.db "SELECT json_group_array(json_object('id', id, 'character', character, 'meaning', meaning, 'strokes', strokes, 'element', element, 'yin_yang', yin_yang, 'review', review, 'evidence_json', evidence_json, 'decided_by', decided_by, 'ruleset', ruleset, 'codepoint', codepoint, 'korean_reading', korean_reading, 'chinese_reading', chinese_reading, 'radical', radical, 'usage_frequency', usage_frequency, 'name_frequency', name_frequency, 'category', category, 'gender', gender, 'created_at', created_at, 'updated_at', updated_at)) FROM hanja_dict LIMIT ${batchSize} OFFSET ${offset};"`, { maxBuffer: 1024 * 1024 * 10 }).toString()
        );
        
        for (const hanja of batch) {
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
            successCount++;
          } catch (error) {
            console.error(`Failed to migrate hanja ${hanja.character}:`, error.message);
            errorCount++;
          }
        }
        
        console.log(`Batch completed. Progress: ${successCount}/${totalCount}`);
        
      } catch (batchError) {
        console.error(`Batch error at offset ${offset}:`, batchError.message);
        errorCount += batchSize;
      }
    }
    
    console.log(`Migration completed: ${successCount} success, ${errorCount} errors`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgPrisma.$disconnect();
  }
}

migrateHanjaDictBatch();