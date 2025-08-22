#!/usr/bin/env npx tsx
// 필수 성씨 30종 업서트 스크립트 (수정 버전)
// evidenceJSON에 복수 읽기 저장

import { PrismaClient, Element, YinYang } from '@prisma/client';

const prisma = new PrismaClient();

// 필수 성씨 30종 완전 데이터
const ESSENTIAL_SURNAMES = [
  // 최상위군(10) - 가장 많이 사용되는 성씨
  { 
    character: '金', 
    koreanReading: '김',
    alternativeReadings: ['금'],
    koreanMeaning: '쇠, 금',
    element: Element.METAL,
    strokes: 8,
    priority: 1
  },
  { 
    character: '李', 
    koreanReading: '이',
    alternativeReadings: ['리'],
    koreanMeaning: '오얏나무',
    element: Element.WOOD,
    strokes: 7,
    priority: 1
  },
  { 
    character: '朴', 
    koreanReading: '박',
    alternativeReadings: [],
    koreanMeaning: '박달나무',
    element: Element.WOOD,
    strokes: 6,
    priority: 1
  },
  { 
    character: '崔', 
    koreanReading: '최',
    alternativeReadings: [],
    koreanMeaning: '높을',
    element: Element.EARTH,
    strokes: 11,
    priority: 1
  },
  { 
    character: '鄭', 
    koreanReading: '정',
    alternativeReadings: [],
    koreanMeaning: '나라이름',
    element: Element.FIRE,
    strokes: 19,
    priority: 1
  },
  { 
    character: '趙', 
    koreanReading: '조',
    alternativeReadings: [],
    koreanMeaning: '나라이름',
    element: Element.FIRE,
    strokes: 14,
    priority: 1
  },
  { 
    character: '尹', 
    koreanReading: '윤',
    alternativeReadings: [],
    koreanMeaning: '다스릴',
    element: Element.EARTH,
    strokes: 4,
    priority: 1
  },
  { 
    character: '張', 
    koreanReading: '장',
    alternativeReadings: [],
    koreanMeaning: '활',
    element: Element.FIRE,
    strokes: 11,
    priority: 1
  },
  { 
    character: '姜', 
    koreanReading: '강',
    alternativeReadings: [],
    koreanMeaning: '생강',
    element: Element.WOOD,
    strokes: 9,
    priority: 1
  },
  { 
    character: '曺', 
    koreanReading: '조',
    alternativeReadings: [],
    koreanMeaning: '무리',
    element: Element.METAL,
    strokes: 11,
    priority: 1
  },
  
  // 상위군(10)
  { 
    character: '林', 
    koreanReading: '임',
    alternativeReadings: ['림'],
    koreanMeaning: '수풀',
    element: Element.WOOD,
    strokes: 8,
    priority: 2
  },
  { 
    character: '吳', 
    koreanReading: '오',
    alternativeReadings: [],
    koreanMeaning: '나라이름',
    element: Element.WOOD,
    strokes: 7,
    priority: 2
  },
  { 
    character: '韓', 
    koreanReading: '한',
    alternativeReadings: [],
    koreanMeaning: '나라이름',
    element: Element.WATER,
    strokes: 17,
    priority: 2
  },
  { 
    character: '申', 
    koreanReading: '신',
    alternativeReadings: [],
    koreanMeaning: '신',
    element: Element.METAL,
    strokes: 5,
    priority: 2
  },
  { 
    character: '梁', 
    koreanReading: '양',
    alternativeReadings: ['량'],
    koreanMeaning: '대들보',
    element: Element.WOOD,
    strokes: 11,
    priority: 2
  },
  { 
    character: '宋', 
    koreanReading: '송',
    alternativeReadings: [],
    koreanMeaning: '나라이름',
    element: Element.METAL,
    strokes: 7,
    priority: 2
  },
  { 
    character: '玄', 
    koreanReading: '현',
    alternativeReadings: [],
    koreanMeaning: '검을',
    element: Element.WATER,
    strokes: 5,
    priority: 2
  },
  { 
    character: '高', 
    koreanReading: '고',
    alternativeReadings: [],
    koreanMeaning: '높을',
    element: Element.WOOD,
    strokes: 10,
    priority: 2
  },
  { 
    character: '朱', 
    koreanReading: '주',
    alternativeReadings: [],
    koreanMeaning: '붉을',
    element: Element.WOOD,
    strokes: 6,
    priority: 2
  },
  { 
    character: '徐', 
    koreanReading: '서',
    alternativeReadings: [],
    koreanMeaning: '천천히',
    element: Element.METAL,
    strokes: 10,
    priority: 2
  },
  
  // 보강군(10+)
  { 
    character: '文', 
    koreanReading: '문',
    alternativeReadings: [],
    koreanMeaning: '글월',
    element: Element.WATER,
    strokes: 4,
    priority: 3
  },
  { 
    character: '孫', 
    koreanReading: '손',
    alternativeReadings: [],
    koreanMeaning: '손자',
    element: Element.METAL,
    strokes: 10,
    priority: 3
  },
  { 
    character: '安', 
    koreanReading: '안',
    alternativeReadings: [],
    koreanMeaning: '편안할',
    element: Element.EARTH,
    strokes: 6,
    priority: 3
  },
  { 
    character: '柳', 
    koreanReading: '유',
    alternativeReadings: ['류'],
    koreanMeaning: '버들',
    element: Element.WOOD,
    strokes: 9,
    priority: 3
  },
  { 
    character: '田', 
    koreanReading: '전',
    alternativeReadings: [],
    koreanMeaning: '밭',
    element: Element.FIRE,
    strokes: 5,
    priority: 3
  },
  { 
    character: '車', 
    koreanReading: '차',
    alternativeReadings: [],
    koreanMeaning: '수레',
    element: null,  // 차씨는 오행이 명확하지 않음
    strokes: 7,
    priority: 3
  },
  { 
    character: '千', 
    koreanReading: '천',
    alternativeReadings: [],
    koreanMeaning: '일천',
    element: null,  // 천씨는 오행이 명확하지 않음
    strokes: 3,
    priority: 3
  },
  { 
    character: '河', 
    koreanReading: '하',
    alternativeReadings: [],
    koreanMeaning: '물',
    element: Element.WATER,
    strokes: 8,
    priority: 3
  },
  { 
    character: '盧', 
    koreanReading: '노',
    alternativeReadings: ['로'],
    koreanMeaning: '화로',
    element: Element.FIRE,
    strokes: 16,
    priority: 3
  },
  { 
    character: '許', 
    koreanReading: '허',
    alternativeReadings: [],
    koreanMeaning: '허락할',
    element: Element.WOOD,
    strokes: 11,
    priority: 3
  },
];

async function upsertEssentialSurnames() {
  console.log('🔧 필수 성씨 30종 업서트 시작\n');
  console.log('=' .repeat(80));
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const surname of ESSENTIAL_SURNAMES) {
    try {
      // 기존 레코드 확인
      const existing = await prisma.hanjaDict.findUnique({
        where: { character: surname.character }
      });
      
      if (existing) {
        // 기존 evidenceJSON 파싱
        let evidenceData = {};
        try {
          evidenceData = existing.evidenceJSON ? JSON.parse(existing.evidenceJSON) : {};
        } catch (e) {
          evidenceData = {};
        }
        
        // 복수 읽기 정보 추가
        if (surname.alternativeReadings.length > 0) {
          evidenceData.alternativeReadings = surname.alternativeReadings;
        }
        evidenceData.updatedAt = new Date().toISOString();
        evidenceData.source = evidenceData.source || 'essential_surnames_patch';
        evidenceData.priority = surname.priority;
        evidenceData.isSurname = true;
        
        // 업데이트 필요 여부 확인
        const needsUpdate = 
          existing.koreanReading !== surname.koreanReading ||
          (!existing.element && surname.element) ||
          (!existing.meaning && surname.koreanMeaning) ||
          surname.alternativeReadings.length > 0;
        
        if (needsUpdate) {
          // 기존 레코드 업데이트
          await prisma.hanjaDict.update({
            where: { character: surname.character },
            data: {
              koreanReading: surname.koreanReading,
              meaning: existing.meaning || surname.koreanMeaning,
              element: existing.element || surname.element,
              strokes: existing.strokes || surname.strokes,
              review: 'ok',
              evidenceJSON: JSON.stringify(evidenceData)
            }
          });
          console.log(`✅ 업데이트: ${surname.character} (${surname.koreanReading}${surname.alternativeReadings.length > 0 ? '/' + surname.alternativeReadings.join('/') : ''})`);
          updated++;
        } else {
          console.log(`⏭️  스킵: ${surname.character} (이미 완전함)`);
          skipped++;
        }
      } else {
        // 새로 생성
        const evidenceData = {
          createdAt: new Date().toISOString(),
          source: 'essential_surnames_patch',
          priority: surname.priority,
          isSurname: true,
          ...(surname.alternativeReadings.length > 0 && { alternativeReadings: surname.alternativeReadings })
        };
        
        await prisma.hanjaDict.create({
          data: {
            character: surname.character,
            koreanReading: surname.koreanReading,
            meaning: surname.koreanMeaning,
            element: surname.element,
            strokes: surname.strokes,
            review: 'ok',
            evidenceJSON: JSON.stringify(evidenceData)
          }
        });
        console.log(`✨ 생성: ${surname.character} (${surname.koreanReading}${surname.alternativeReadings.length > 0 ? '/' + surname.alternativeReadings.join('/') : ''})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ 오류 ${surname.character}:`, error);
    }
  }
  
  // 차씨 특별 처리 (기존 '거' → '차'로 변경)
  try {
    const chaSurname = await prisma.hanjaDict.findUnique({
      where: { character: '車' }
    });
    
    if (chaSurname && chaSurname.koreanReading === '거') {
      await prisma.hanjaDict.update({
        where: { character: '車' },
        data: {
          koreanReading: '차',
          meaning: '수레',
          evidenceJSON: JSON.stringify({
            ...JSON.parse(chaSurname.evidenceJSON || '{}'),
            updatedAt: new Date().toISOString(),
            source: 'essential_surnames_patch',
            isSurname: true,
            originalReading: '거',
            note: '성씨로는 차(車)로 읽음'
          })
        }
      });
      console.log(`✅ 특별 업데이트: 車 (거 → 차)`);
      updated++;
    }
  } catch (error) {
    console.error('❌ 車씨 특별 처리 오류:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 업서트 결과:');
  console.log(`- 생성: ${created}개`);
  console.log(`- 업데이트: ${updated}개`);
  console.log(`- 스킵: ${skipped}개`);
  console.log(`- 총계: ${ESSENTIAL_SURNAMES.length}개`);
  
  await prisma.$disconnect();
  
  return { created, updated, skipped };
}

upsertEssentialSurnames()
  .then(result => {
    console.log('\n✅ 필수 성씨 업서트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });