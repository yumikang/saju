#!/usr/bin/env npx tsx
// 핵심 성씨 30자 즉시 백필 스크립트
// 하드코딩된 정확한 데이터로 즉시 업데이트

import { PrismaClient, Element } from '@prisma/client';

const prisma = new PrismaClient();

// 핵심 성씨 30자 정확한 데이터
const CORE_SURNAMES = [
  // 최상위 빈도 성씨 (1-10위)
  { char: '金', reading: '김', strokes: 8, element: Element.METAL, meaning: '쇠, 금', nameFreq: 10000 },
  { char: '李', reading: '이', strokes: 7, element: Element.WOOD, meaning: '자두, 오얏', nameFreq: 9500 },
  { char: '朴', reading: '박', strokes: 6, element: Element.WOOD, meaning: '순박할, 후박나무', nameFreq: 9000 },
  { char: '崔', reading: '최', strokes: 11, element: Element.EARTH, meaning: '높을, 산이름', nameFreq: 8500 },
  { char: '鄭', reading: '정', strokes: 19, element: Element.FIRE, meaning: '나라이름', nameFreq: 8000 },
  { char: '姜', reading: '강', strokes: 9, element: Element.WOOD, meaning: '생강', nameFreq: 7500 },
  { char: '趙', reading: '조', strokes: 14, element: Element.FIRE, meaning: '나라이름', nameFreq: 7000 },
  { char: '尹', reading: '윤', strokes: 4, element: Element.EARTH, meaning: '다스릴, 관직', nameFreq: 6500 },
  { char: '張', reading: '장', strokes: 11, element: Element.FIRE, meaning: '베풀, 활', nameFreq: 6000 },
  { char: '林', reading: '임', strokes: 8, element: Element.WOOD, meaning: '수풀', nameFreq: 5500 },
  
  // 중상위 빈도 성씨 (11-20위)
  { char: '韓', reading: '한', strokes: 17, element: Element.WATER, meaning: '나라이름, 크다', nameFreq: 5000 },
  { char: '吳', reading: '오', strokes: 7, element: Element.WOOD, meaning: '나라이름, 크다', nameFreq: 4500 },
  { char: '申', reading: '신', strokes: 5, element: Element.METAL, meaning: '펼, 거듭', nameFreq: 4000 },
  { char: '徐', reading: '서', strokes: 10, element: Element.METAL, meaning: '천천히', nameFreq: 3500 },
  { char: '權', reading: '권', strokes: 22, element: Element.WOOD, meaning: '권세, 임시', nameFreq: 3000 },
  { char: '黃', reading: '황', strokes: 12, element: Element.EARTH, meaning: '누를', nameFreq: 2500 },
  { char: '安', reading: '안', strokes: 6, element: Element.EARTH, meaning: '편안할', nameFreq: 2000 },
  { char: '宋', reading: '송', strokes: 7, element: Element.METAL, meaning: '나라이름', nameFreq: 1800 },
  { char: '柳', reading: '유', strokes: 9, element: Element.WOOD, meaning: '버들', nameFreq: 1600 },
  { char: '洪', reading: '홍', strokes: 10, element: Element.WATER, meaning: '넓을, 큰물', nameFreq: 1400 },
  
  // 중위 빈도 성씨 (21-30위)
  { char: '高', reading: '고', strokes: 10, element: Element.WOOD, meaning: '높을', nameFreq: 1200 },
  { char: '文', reading: '문', strokes: 4, element: Element.WATER, meaning: '글월', nameFreq: 1000 },
  { char: '梁', reading: '양', strokes: 11, element: Element.WATER, meaning: '들보, 다리', nameFreq: 900 },
  { char: '孫', reading: '손', strokes: 10, element: Element.METAL, meaning: '손자', nameFreq: 800 },
  { char: '白', reading: '백', strokes: 5, element: Element.METAL, meaning: '흰', nameFreq: 700 },
  { char: '曺', reading: '조', strokes: 11, element: Element.METAL, meaning: '무리', nameFreq: 600 },
  { char: '許', reading: '허', strokes: 11, element: Element.EARTH, meaning: '허락할', nameFreq: 500 },
  { char: '千', reading: '천', strokes: 3, element: Element.METAL, meaning: '일천', nameFreq: 400 },
  { char: '劉', reading: '유', strokes: 15, element: Element.METAL, meaning: '죽일, 도끼', nameFreq: 350 },
  { char: '全', reading: '전', strokes: 6, element: Element.FIRE, meaning: '온전할', nameFreq: 300 }
];

async function backfillCoreSurnames() {
  console.log('🔧 핵심 성씨 30자 즉시 백필 시작\n');
  console.log('=' .repeat(80));
  
  let updatedCount = 0;
  let createdCount = 0;
  let errorCount = 0;
  
  for (const surname of CORE_SURNAMES) {
    try {
      // 기존 레코드 확인
      const existing = await prisma.hanjaDict.findFirst({
        where: { character: surname.char }
      });
      
      if (existing) {
        // 업데이트
        const updated = await prisma.hanjaDict.update({
          where: { id: existing.id },
          data: {
            strokes: surname.strokes,
            element: surname.element,
            meaning: existing.meaning || surname.meaning,
            nameFrequency: surname.nameFreq,
            usageFrequency: Math.floor(surname.nameFreq * 0.3), // 일반 사용 빈도는 이름 빈도의 30%로 추정
            evidenceJSON: JSON.stringify({
              isSurname: true,
              priority: CORE_SURNAMES.indexOf(surname) + 1,
              source: 'manual_core_surnames',
              updatedAt: new Date().toISOString()
            })
          }
        });
        
        console.log(`✅ ${surname.char}(${surname.reading}): 업데이트 완료 - ${surname.strokes}획, ${surname.element}행`);
        updatedCount++;
        
      } else {
        // 새로 생성
        const created = await prisma.hanjaDict.create({
          data: {
            character: surname.char,
            koreanReading: surname.reading,
            strokes: surname.strokes,
            element: surname.element,
            meaning: surname.meaning,
            nameFrequency: surname.nameFreq,
            usageFrequency: Math.floor(surname.nameFreq * 0.3),
            evidenceJSON: JSON.stringify({
              isSurname: true,
              priority: CORE_SURNAMES.indexOf(surname) + 1,
              source: 'manual_core_surnames',
              createdAt: new Date().toISOString()
            })
          }
        });
        
        // HanjaReading 테이블에도 추가
        await prisma.hanjaReading.create({
          data: {
            character: surname.char,
            reading: surname.reading,
            isPrimary: true,
            context: 'surname'
          }
        }).catch(() => {
          // 이미 존재하면 무시
        });
        
        console.log(`🆕 ${surname.char}(${surname.reading}): 새로 생성 - ${surname.strokes}획, ${surname.element}행`);
        createdCount++;
      }
      
    } catch (error) {
      console.error(`❌ ${surname.char}(${surname.reading}): 오류 발생`, error);
      errorCount++;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 백필 결과:');
  console.log(`  ✅ 업데이트: ${updatedCount}개`);
  console.log(`  🆕 새로 생성: ${createdCount}개`);
  console.log(`  ❌ 오류: ${errorCount}개`);
  console.log(`  📌 총 처리: ${updatedCount + createdCount}/${CORE_SURNAMES.length}개`);
  
  // 캐시 무효화 알림
  console.log('\n⚠️  주의사항:');
  console.log('  - Redis 캐시를 무효화해야 변경사항이 즉시 반영됩니다');
  console.log('  - 다음 명령 실행: redis-cli FLUSHDB 또는 redis-cli DEL "hanja:q:*"');
  
  await prisma.$disconnect();
}

// 실행
backfillCoreSurnames().catch(console.error);