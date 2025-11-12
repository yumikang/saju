#!/usr/bin/env npx tsx
/**
 * Top 200 자주 쓰이는 한자 추출
 * inferredNameFrequency 기준 상위 200개
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(80));
  console.log('Top 200 자주 쓰이는 한자 추출');
  console.log('='.repeat(80));

  // inferredNameFrequency 기준 상위 200개 한자 추출
  const top200 = await prisma.hanjaDict.findMany({
    where: {
      isGoodForNaming: true,
    },
    orderBy: [
      { inferredNameFrequency: 'desc' },
      { nameFrequency: 'desc' },
    ],
    take: 200,
    select: {
      character: true,
      meaning: true,
      koreanReading: true,
      strokes: true,
      element: true,
      radical: true,
      inferredNameFrequency: true,
      nameFrequency: true,
    },
  });

  console.log(`\n총 ${top200.length}개 한자 추출 완료\n`);

  // CSV 헤더
  const csvLines = [
    'character,meaning,reading,current_strokes,current_element,radical,kangxi_strokes,ziyuan_element,comment,name_freq',
  ];

  // CSV 데이터
  top200.forEach((h) => {
    const line = [
      h.character,
      `"${h.meaning || ''}"`, // meaning은 따옴표로 감싸기
      h.koreanReading || '',
      h.strokes || '',
      h.element || '',
      h.radical || '',
      '', // kangxi_strokes - 웹 조사로 채울 예정
      '', // ziyuan_element - 웹 조사로 채울 예정
      '', // comment - 웹 조사로 채울 예정
      h.inferredNameFrequency || h.nameFrequency || 0,
    ].join(',');
    csvLines.push(line);
  });

  // CSV 파일 저장
  const csvContent = csvLines.join('\n');
  writeFileSync('top200-hanja-template.csv', csvContent, 'utf-8');

  console.log('✅ top200-hanja-template.csv 파일 생성 완료');
  console.log('\n다음 단계:');
  console.log('1. CSV 파일을 열어서 kangxi_strokes, ziyuan_element, comment 컬럼을 채우기');
  console.log('2. 웹 검색으로 강희자전 기준 획수 확인');
  console.log('3. 부수와 의미 기반으로 자원오행 결정');
  console.log('\n샘플 (첫 20개):');

  top200.slice(0, 20).forEach((h, idx) => {
    console.log(
      `${idx + 1}. ${h.character} (${h.koreanReading}) - ${h.meaning} - ${h.strokes}획 ${h.element} - 빈도: ${h.inferredNameFrequency || h.nameFrequency}`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
