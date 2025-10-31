#!/usr/bin/env npx tsx
/**
 * 부정적 의미 한자 처리 스크립트
 *
 * 명백히 부정적인 의미의 한자를 isGoodForNaming=false로 처리
 *
 * 처리 대상 (13개):
 * - 주검: 屍, 尸
 * - 죽음/살인: 弒, 殭, 殤
 * - 질병: 疴, 瘐, 瘕, 癩, 恙, 瘟
 * - 재앙: 災, 灾
 *
 * 실행: npx tsx scripts/fix-negative-meanings.ts
 */

import { PrismaClient } from '@prisma/client';
import { appendFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// 명백히 부정적인 한자 목록
const NEGATIVE_CHARS = [
  // 주검
  { char: '屍', reading: '시', meaning: '주검 시', category: '주검' },
  { char: '尸', reading: '시', meaning: '주검', category: '주검' },

  // 죽음/살인
  { char: '弒', reading: '시', meaning: '죽일', category: '살인' },
  { char: '殭', reading: '강', meaning: '죽어썩지않을', category: '죽음' },
  { char: '殤', reading: '상', meaning: '일찍죽을', category: '죽음' },

  // 질병
  { char: '疴', reading: '아', meaning: '병', category: '질병' },
  { char: '瘐', reading: '유', meaning: '병들', category: '질병' },
  { char: '瘕', reading: '하', meaning: '기생충병', category: '질병' },
  { char: '癩', reading: '나', meaning: '문둥병', category: '질병' },
  { char: '恙', reading: '양', meaning: '병', category: '질병' },
  { char: '瘟', reading: '온', meaning: '염병', category: '질병' },

  // 재앙
  { char: '災', reading: '재', meaning: '재앙 재', category: '재앙' },
  { char: '灾', reading: '재', meaning: '재앙', category: '재앙' },
];

/**
 * 변경 로그 기록
 */
function logChange(change: {
  character: string;
  koreanReading: string;
  oldMeaning: string;
  oldIsGoodForNaming: boolean;
  newIsGoodForNaming: boolean;
  reason: string;
  category: string;
  timestamp: string;
}) {
  const logPath = join(process.cwd(), 'data/logs', `negative-meanings-removal-${new Date().toISOString().split('T')[0]}.jsonl`);
  appendFileSync(logPath, JSON.stringify(change) + '\n');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  부정적 의미 한자 제거 스크립트            ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`처리 대상: ${NEGATIVE_CHARS.length}개 한자\n`);

  // 카테고리별 통계
  const categories = ['주검', '살인', '죽음', '질병', '재앙'];
  categories.forEach(cat => {
    const count = NEGATIVE_CHARS.filter(c => c.category === cat).length;
    console.log(`  - ${cat}: ${count}개`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // 현재 상태 확인
  const beforeGood = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  console.log(`작업 전 상태:`);
  console.log(`  작명 가능 한자: ${beforeGood}개\n`);

  // 각 한자 처리
  let processedCount = 0;
  let skippedCount = 0;
  let alreadyBadCount = 0;

  for (const item of NEGATIVE_CHARS) {
    try {
      const existing = await prisma.hanjaDict.findFirst({
        where: { character: item.char }
      });

      if (!existing) {
        console.log(`⏭️  스킵: ${item.char} (${item.reading}) - DB에 없음`);
        skippedCount++;
        continue;
      }

      if (existing.isGoodForNaming === false) {
        console.log(`✅ 이미 제외됨: ${item.char} (${item.reading}) - ${item.category}`);
        alreadyBadCount++;
        continue;
      }

      // isGoodForNaming=false로 업데이트
      await prisma.hanjaDict.update({
        where: { id: existing.id },
        data: { isGoodForNaming: false }
      });

      // 로그 기록
      logChange({
        character: item.char,
        koreanReading: item.reading,
        oldMeaning: existing.meaning || '',
        oldIsGoodForNaming: existing.isGoodForNaming,
        newIsGoodForNaming: false,
        reason: `부정적 의미 제거: ${item.category}`,
        category: item.category,
        timestamp: new Date().toISOString()
      });

      console.log(`❌ 제외 처리: ${item.char} (${item.reading}) - "${item.meaning}" [${item.category}]`);
      processedCount++;

    } catch (error) {
      console.error(`❌ 실패: ${item.char} (${item.reading})`, error);
    }
  }

  // 작업 후 상태 확인
  const afterGood = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 처리 결과:\n');
  console.log(`  처리됨: ${processedCount}개`);
  console.log(`  이미 제외: ${alreadyBadCount}개`);
  console.log(`  스킵: ${skippedCount}개`);
  console.log(`\n  작업 전: ${beforeGood}개 → 작업 후: ${afterGood}개`);
  console.log(`  감소: ${beforeGood - afterGood}개\n`);

  console.log('='.repeat(60));
  console.log('✅ 부정적 의미 한자 제거 완료!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
