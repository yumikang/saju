#!/usr/bin/env npx tsx
// 필수 성씨 30종 데이터베이스 존재 여부 확인

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 필수 성씨 30종 정의
const ESSENTIAL_SURNAMES = [
  // 최상위군(10)
  { character: '金', readings: ['김', '금'], priority: 1 },
  { character: '李', readings: ['이', '리'], priority: 1 },
  { character: '朴', readings: ['박'], priority: 1 },
  { character: '崔', readings: ['최'], priority: 1 },
  { character: '鄭', readings: ['정'], priority: 1 },
  { character: '趙', readings: ['조'], priority: 1 },
  { character: '尹', readings: ['윤'], priority: 1 },
  { character: '張', readings: ['장'], priority: 1 },
  { character: '姜', readings: ['강'], priority: 1 },
  { character: '曺', readings: ['조'], priority: 1 },
  
  // 상위군(10)
  { character: '林', readings: ['임', '림'], priority: 2 },
  { character: '吳', readings: ['오'], priority: 2 },
  { character: '韓', readings: ['한'], priority: 2 },
  { character: '申', readings: ['신'], priority: 2 },
  { character: '梁', readings: ['양', '량'], priority: 2 },
  { character: '宋', readings: ['송'], priority: 2 },
  { character: '玄', readings: ['현'], priority: 2 },
  { character: '高', readings: ['고'], priority: 2 },
  { character: '朱', readings: ['주'], priority: 2 },
  { character: '徐', readings: ['서'], priority: 2 },
  
  // 보강군(10+)
  { character: '文', readings: ['문'], priority: 3 },
  { character: '孫', readings: ['손'], priority: 3 },
  { character: '安', readings: ['안'], priority: 3 },
  { character: '柳', readings: ['유', '류'], priority: 3 },
  { character: '田', readings: ['전'], priority: 3 },
  { character: '車', readings: ['차'], priority: 3 },
  { character: '千', readings: ['천'], priority: 3 },
  { character: '河', readings: ['하'], priority: 3 },
  { character: '盧', readings: ['노', '로'], priority: 3 },
  { character: '許', readings: ['허'], priority: 3 },
];

async function checkEssentialSurnames() {
  console.log('🔍 필수 성씨 30종 데이터베이스 확인\n');
  console.log('=' .repeat(80));
  
  const results = {
    found: [] as any[],
    missing: [] as any[],
    partialMatch: [] as any[]
  };
  
  for (const surname of ESSENTIAL_SURNAMES) {
    try {
      // 한자로 검색
      const record = await prisma.hanjaDict.findUnique({
        where: { character: surname.character }
      });
      
      if (record) {
        // 읽기 확인
        const hasAllReadings = surname.readings.every(r => 
          record.koreanReading?.includes(r) || 
          record.alternativeReadings?.includes(r)
        );
        
        const status = {
          character: surname.character,
          expectedReadings: surname.readings,
          actualReading: record.koreanReading,
          alternativeReadings: record.alternativeReadings,
          element: record.element,
          meaning: record.koreanMeaning,
          priority: surname.priority,
          hasAllReadings
        };
        
        if (hasAllReadings) {
          results.found.push(status);
          console.log(`✅ ${surname.character}: 완전 일치 (읽기: ${record.koreanReading})`);
        } else {
          results.partialMatch.push(status);
          console.log(`⚠️  ${surname.character}: 부분 일치 (기대: ${surname.readings.join('/')}, 실제: ${record.koreanReading})`);
        }
      } else {
        results.missing.push({
          character: surname.character,
          expectedReadings: surname.readings,
          priority: surname.priority
        });
        console.log(`❌ ${surname.character}: 누락 (기대 읽기: ${surname.readings.join('/')})`);
      }
    } catch (error) {
      console.error(`Error checking ${surname.character}:`, error);
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 요약:');
  console.log(`- 완전 일치: ${results.found.length}개`);
  console.log(`- 부분 일치: ${results.partialMatch.length}개`);
  console.log(`- 누락: ${results.missing.length}개`);
  
  if (results.missing.length > 0) {
    console.log('\n❌ 누락된 필수 성씨:');
    results.missing.forEach(m => {
      console.log(`  - ${m.character} (${m.expectedReadings.join('/')})`);
    });
  }
  
  if (results.partialMatch.length > 0) {
    console.log('\n⚠️  읽기 보완 필요:');
    results.partialMatch.forEach(m => {
      console.log(`  - ${m.character}: 기대(${m.expectedReadings.join('/')}), 실제(${m.actualReading})`);
    });
  }
  
  await prisma.$disconnect();
  
  return results;
}

checkEssentialSurnames()
  .then(results => {
    const needsAction = results.missing.length > 0 || results.partialMatch.length > 0;
    if (needsAction) {
      console.log('\n🚨 조치 필요: 누락되거나 불완전한 성씨 데이터가 있습니다.');
      process.exit(1);
    } else {
      console.log('\n✅ 모든 필수 성씨가 정상적으로 등록되어 있습니다.');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });