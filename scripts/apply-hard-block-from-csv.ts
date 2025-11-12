/**
 * 🚑 긴급 하드블록 (CSV 기반)
 *
 * hardblock_200.csv 파일을 읽어서 부적절한 한자를 일괄 차단합니다.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface BlockEntry {
  char: string;
  meaning: string;
  category: string;
  reason: string;
}

async function main() {
  console.log('🚑 CSV 기반 하드블록 시작...\n');

  // 1. CSV 파일 읽기
  const csvPath = path.join(__dirname, 'hardblock_200.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV 파일을 찾을 수 없습니다:', csvPath);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // 헤더 제거
  const [_header, ...dataLines] = lines;

  // 2. CSV 파싱
  const entries: BlockEntry[] = dataLines
    .map(line => {
      const [char, meaning, category, reason] = line.split(',');
      return { char, meaning, category, reason };
    })
    .filter(e => e.char && e.char.length > 0);

  console.log(`📊 CSV에서 ${entries.length}자 로드됨\n`);

  // 3. 한자 문자만 추출
  const blockChars = entries.map(e => e.char);

  // 4. 차단 대상 확인
  const existingCount = await prisma.hanjaDict.count({
    where: {
      character: { in: blockChars },
      isGoodForNaming: true
    }
  });

  console.log(`📊 차단 대상: ${blockChars.length}자`);
  console.log(`📊 현재 isGoodForNaming=true인 차단 대상: ${existingCount}자\n`);

  if (existingCount === 0) {
    console.log('✅ 차단 대상 없음 - 이미 모두 차단됨');
    return;
  }

  // 5. 차단 대상 한자 상세 정보 출력 (상위 20개만)
  const targets = await prisma.hanjaDict.findMany({
    where: {
      character: { in: blockChars },
      isGoodForNaming: true
    },
    select: {
      character: true,
      meaning: true,
      nameFrequency: true
    },
    orderBy: { nameFrequency: 'desc' },
    take: 20
  });

  console.log('🎯 차단할 한자 목록 (상위 20개):');
  targets.forEach((h, i) => {
    const entry = entries.find(e => e.char === h.character);
    console.log(`  ${i + 1}. ${h.character} - ${h.meaning} (빈도: ${h.nameFrequency || 0}) [${entry?.category}]`);
  });

  if (existingCount > 20) {
    console.log(`  ... 외 ${existingCount - 20}자 더 있음`);
  }
  console.log();

  // 6. 하드블록 실행
  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: blockChars }
    },
    data: {
      isGoodForNaming: false,
      review: 'needs_review'
    }
  });

  console.log(`✅ ${result.count}자 차단 완료\n`);

  // 7. 검증
  const remainingCount = await prisma.hanjaDict.count({
    where: {
      character: { in: blockChars },
      isGoodForNaming: true
    }
  });

  if (remainingCount === 0) {
    console.log('✅ 검증 성공: 모든 부적절 한자 차단됨');
  } else {
    console.log(`⚠️  경고: ${remainingCount}자가 여전히 isGoodForNaming=true`);
  }

  // 8. 카테고리별 통계
  console.log('\n📊 카테고리별 차단 통계:');
  const categoryStats = new Map<string, number>();

  for (const entry of entries) {
    const count = categoryStats.get(entry.category) || 0;
    categoryStats.set(entry.category, count + 1);
  }

  Array.from(categoryStats.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}자`);
    });

  // 9. 전체 통계
  const finalStats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true
  });

  console.log('\n📊 최종 DB 통계:');
  finalStats.forEach(s => {
    console.log(`  isGoodForNaming=${s.isGoodForNaming}: ${s._count}자`);
  });
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
