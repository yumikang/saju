#!/usr/bin/env npx tsx
// HanjaReading 테이블 마이그레이션 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateHanjaReadings() {
  console.log('🔄 HanjaReading 테이블 마이그레이션 시작\n');
  console.log('='.repeat(80));
  
  try {
    // 기존 데이터 클리어
    await prisma.hanjaReading.deleteMany({});
    console.log('✅ 기존 HanjaReading 데이터 삭제 완료');
    
    // 모든 한자 가져오기
    const allHanja = await prisma.hanjaDict.findMany({
      select: {
        character: true,
        koreanReading: true,
        evidenceJSON: true,
        element: true
      }
    });
    
    console.log(`📊 총 ${allHanja.length}개 한자 처리 시작\n`);
    
    const readingsToInsert: Array<{
      character: string;
      reading: string;
      soundElem: any;
      isPrimary: boolean;
    }> = [];
    
    let processedCount = 0;
    let alternativeCount = 0;
    
    for (const hanja of allHanja) {
      // Primary reading
      if (hanja.koreanReading) {
        readingsToInsert.push({
          character: hanja.character,
          reading: hanja.koreanReading,
          soundElem: hanja.element,
          isPrimary: true
        });
        processedCount++;
      }
      
      // Alternative readings from evidenceJSON
      if (hanja.evidenceJSON) {
        try {
          const evidence = JSON.parse(hanja.evidenceJSON);
          if (evidence.alternativeReadings && Array.isArray(evidence.alternativeReadings)) {
            for (const altReading of evidence.alternativeReadings) {
              readingsToInsert.push({
                character: hanja.character,
                reading: altReading,
                soundElem: hanja.element,
                isPrimary: false
              });
              alternativeCount++;
            }
          }
        } catch (e) {
          // JSON 파싱 실패 무시
        }
      }
    }
    
    // 배치 삽입
    console.log(`📝 ${readingsToInsert.length}개 읽기 레코드 삽입 중...`);
    
    // createMany를 사용하여 배치 삽입
    const batchSize = 500;
    for (let i = 0; i < readingsToInsert.length; i += batchSize) {
      const batch = readingsToInsert.slice(i, i + batchSize);
      // SQLite는 skipDuplicates를 지원하지 않으므로 try-catch로 처리
      for (const record of batch) {
        try {
          await prisma.hanjaReading.create({
            data: record
          });
        } catch (e: any) {
          // Unique constraint violation 무시
          if (!e.message?.includes('Unique constraint')) {
            console.error(`Error inserting ${record.character}-${record.reading}:`, e.message);
          }
        }
      }
      
      if (i % 2000 === 0) {
        console.log(`  진행: ${i}/${readingsToInsert.length}`);
      }
    }
    
    // 통계
    const totalReadings = await prisma.hanjaReading.count();
    const primaryReadings = await prisma.hanjaReading.count({ where: { isPrimary: true } });
    const altReadings = await prisma.hanjaReading.count({ where: { isPrimary: false } });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 마이그레이션 완료 통계:');
    console.log(`- 총 읽기 레코드: ${totalReadings}개`);
    console.log(`- Primary 읽기: ${primaryReadings}개`);
    console.log(`- Alternative 읽기: ${altReadings}개`);
    
    // 주요 성씨 확인
    console.log('\n🔍 주요 성씨 검증:');
    const testSurnames = [
      { reading: '김', expected: '金' },
      { reading: '이', expected: '李' },
      { reading: '리', expected: '李' },
      { reading: '박', expected: '朴' },
      { reading: '천', expected: '千' },
      { reading: '임', expected: '林' },
      { reading: '림', expected: '林' },
      { reading: '유', expected: '柳' },
      { reading: '류', expected: '柳' }
    ];
    
    for (const test of testSurnames) {
      const found = await prisma.hanjaReading.findMany({
        where: { 
          reading: test.reading,
          character: test.expected
        }
      });
      
      if (found.length > 0) {
        console.log(`  ✅ ${test.reading} → ${test.expected}: ${found[0].isPrimary ? 'Primary' : 'Alternative'}`);
      } else {
        console.log(`  ❌ ${test.reading} → ${test.expected}: 없음`);
      }
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
migrateHanjaReadings()
  .then(() => {
    console.log('\n✅ HanjaReading 마이그레이션 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });