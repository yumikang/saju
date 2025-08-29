import { PrismaClient } from '@prisma/client';

// SQLite 클라이언트 (소스 데이터베이스)
const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

// PostgreSQL 클라이언트 (타겟 데이터베이스)
const pgPrisma = new PrismaClient();

async function migratePrismaDirect() {
  try {
    console.log('Starting direct Prisma migration for hanja_dict...');
    
    // SQLite에서 hanja_dict 데이터 읽기
    const hanjaDict = await sqlitePrisma.hanjaDict.findMany();
    console.log(`Found ${hanjaDict.length} hanja_dict records in SQLite`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const hanja of hanjaDict) {
      try {
        await pgPrisma.hanjaDict.create({
          data: {
            id: hanja.id,
            character: hanja.character,
            meaning: hanja.meaning,
            strokes: hanja.strokes,
            element: hanja.element,
            yinYang: hanja.yinYang,
            review: hanja.review,
            evidenceJSON: hanja.evidenceJSON,
            decidedBy: hanja.decidedBy,
            ruleset: hanja.ruleset,
            codepoint: hanja.codepoint,
            koreanReading: hanja.koreanReading,
            chineseReading: hanja.chineseReading,
            radical: hanja.radical,
            usageFrequency: hanja.usageFrequency,
            nameFrequency: hanja.nameFrequency,
            category: hanja.category,
            gender: hanja.gender,
            createdAt: hanja.createdAt,
            updatedAt: hanja.updatedAt
          }
        });
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Migrated ${successCount} hanja_dict records...`);
        }
      } catch (error) {
        console.error(`Failed to migrate hanja ${hanja.character}:`, error.message);
        errorCount++;
        if (errorCount > 10) {
          console.log('Too many errors, stopping...');
          break;
        }
      }
    }
    
    console.log(`Migration completed: ${successCount} success, ${errorCount} errors`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sqlitePrisma.$disconnect();
    await pgPrisma.$disconnect();
  }
}

migratePrismaDirect();