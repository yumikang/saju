#!/usr/bin/env npx tsx
/**
 * 자동 의미 기반 하드블록 스크립트 (ver.4 - 빈도 기반 복원)
 * ------------------------------------------
 * 3단계 전략:
 * 1. 수동 CSV 차단 (명백한 부정어) - 이미 완료
 * 2. 공격적 자동 필터링 (의미 기반)
 * 3. 빈도 기반 자동 복원 (실제 많이 쓰이는 한자)
 *
 * 실행 명령:
 *   npx tsx scripts/auto-hardblock-from-meaning-v4.ts --dry-run  (테스트)
 *   npx tsx scripts/auto-hardblock-from-meaning-v4.ts             (실제 적용)
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

// 화이트리스트 극소화 (성씨 + 매우 흔한 긍정적 한자만)
const SAFE_EXCEPTIONS = [
  // 자연물이지만 긍정적이고 이름에 매우 흔함
  "花", "梅", "蘭", "荷", "蓮", "菊", // 꽃 중 대표적인 것만
  "星", "海", "雨", "雪", "雲", // 자연 현상 긍정적
  "珍", "珠", "玉", "瑛", "瑜", "璟", "瑞", "璇", "琳", "琇", "琦", "瑩", // 보석류
  "英", "秀", "麗", "美", "嬌", "妍", "姸", "嫣", "媛", // 아름다움
  "宇", "宙", "宸", "安", "寧", "容", "宏", // 추상적 긍정
  "民", "人", "仁", "伊", "佑", "侑", "俊", "傑", // 인간 관련
  "天", "明", "日", "月", "光", "輝", "曜", // 빛 관련

  // 성씨 (절대 차단 금지) - 한국 100대 성씨
  "金", "李", "朴", "崔", "鄭", "姜", "趙", "尹", "張", "林",
  "韓", "吳", "徐", "申", "權", "黃", "安", "宋", "柳", "洪",
  "全", "高", "文", "孫", "梁", "曺", "許", "裵", "白", "河",
  "盧", "成", "辛", "嚴", "卞", "羅", "南", "元", "邊", "魯",
  "劉", "陳", "楊", "蔡", "閔", "池", "千", "馬", "賈", "董",
  "由", "車", "石", "方", "田", "康", "都", "片", "陸", "印",
];

// 빈도 복원 기준
const FREQUENCY_RESTORE_THRESHOLD = {
  nameFrequency: 200,    // 이름 빈도 200 이상이면 복원
  usageFrequency: 500,   // 일반 빈도 500 이상이면 복원
};

// 공격적 차단 규칙 (화이트리스트 제외하면 모두 차단 대상)
interface BlockRule {
  pattern: RegExp;
  reason: string;
  category: 'negative' | 'plant' | 'animal' | 'tool' | 'nature' | 'misc';
}

const BLOCK_RULES: BlockRule[] = [
  // === 부정어 (완전 단어 매칭) ===
  { pattern: /^똥$/, reason: '배설물', category: 'negative' },
  { pattern: /^오줌$/, reason: '배설물', category: 'negative' },
  { pattern: /^분뇨$/, reason: '배설물', category: 'negative' },
  { pattern: /^고름$/, reason: '불결', category: 'negative' },
  { pattern: /더러울/, reason: '불결', category: 'negative' },
  { pattern: /^죽음$/, reason: '죽음', category: 'negative' },
  { pattern: /^주검$/, reason: '죽음', category: 'negative' },
  { pattern: /^시체$/, reason: '죽음', category: 'negative' },
  { pattern: /무덤/, reason: '죽음', category: 'negative' },
  { pattern: /^문둥병$/, reason: '질병', category: 'negative' },
  { pattern: /^악창$/, reason: '질병', category: 'negative' },
  { pattern: /^두창$/, reason: '질병', category: 'negative' },
  { pattern: /^염병$/, reason: '질병', category: 'negative' },
  { pattern: /재앙/, reason: '흉의', category: 'negative' },
  { pattern: /귀신/, reason: '음습', category: 'negative' },
  { pattern: /마귀/, reason: '음습', category: 'negative' },
  { pattern: /요괴/, reason: '음습', category: 'negative' },
  { pattern: /도깨비/, reason: '음습', category: 'negative' },

  // === 부정적 행위 동사 (하이브리드 필터) ===
  // 염탐/정탐 계열
  { pattern: /(염|정|간)탐|엿보|몰래.*보|도청|사찰/, reason: '부정행위(염탐)', category: 'negative' },

  // 도둑질/절취 계열
  { pattern: /훔치|도둑질|도둑|절도|절취|편취/, reason: '부정행위(절도)', category: 'negative' },

  // 폭력/학대 계열
  { pattern: /살인|살해|학살|참살|주살|죽임/, reason: '부정행위(살해)', category: 'negative' },
  { pattern: /폭행|구타|가해|가학|학대/, reason: '부정행위(폭력)', category: 'negative' },
  { pattern: /괴롭|핍박|압박/, reason: '부정행위(괴롭힘)', category: 'negative' },

  // 분쟁/다툼 계열
  { pattern: /싸움|분쟁|다툼|쟁투|투쟁|시비/, reason: '부정행위(분쟁)', category: 'negative' },

  // 기만/사기 계열
  { pattern: /거짓|허위|사기|기만|속이|기망|위계|위조/, reason: '부정행위(기만)', category: 'negative' },

  // 부정 감정 계열
  { pattern: /증오|질투|시기|혐오|비난|폄훼|모욕/, reason: '부정감정', category: 'negative' },

  // === 일상적 동작/행위 (이름에 부적합) ===
  { pattern: /^걸을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^달릴$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^뛸$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^앉을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^서있을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^세울$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^눕힐$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^엎드릴$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^먹을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^마실$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^잡을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^던질$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^때릴$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^치다$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^밀$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^당길$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^끌$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^쓸$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^씻을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^닦을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^긁을$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^할퀼$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^뿌릴$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^묻힐$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^삼킬$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^토할$/, reason: '일상 동작', category: 'misc' },
  { pattern: /^뱉을$/, reason: '일상 동작', category: 'misc' },

  // === 식물명 (공격적 필터링) ===
  { pattern: /풀$/, reason: '식물명(~풀)', category: 'plant' },
  { pattern: /나무$/, reason: '나무명', category: 'plant' },
  { pattern: /^(이끼|버섯|잡초|수초|갈대|띠|억새|쑥|마름)$/, reason: '식물명', category: 'plant' },

  // 약초/한약재 이름
  { pattern: /^(지황|인삼|감초|당귀|천궁|작약|백출|황기|황금|황련|치자|시호|길경|행인|마황|상엽|복령|택사|차전자|연자육|산수유|구기자|오미자|산조인|맥문동|천마|석창포)$/, reason: '약초명', category: 'plant' },

  // 일반 식물 이름 (과일/채소/곡물 제외)
  { pattern: /^(칡|쑥부쟁이|질경이|도라지|더덕|토란|우엉|냉이|쑥갓|아욱|시금치|무청|배추|상추|근대|고사리|고비|취나물|달래|미나리|씀바귀)$/, reason: '일반 식물명', category: 'plant' },

  // === 동물/곤충 (완전 단어) ===
  { pattern: /^(쥐|돼지|개미|모기|파리|거미|구더기|메뚜기)$/, reason: '동물/곤충', category: 'animal' },
  { pattern: /^(물고기|새우|조개|꽃게|갈거미|왕개미)$/, reason: '동물/곤충', category: 'animal' },

  // === 동물명 부분 매칭 (공격적) ===
  { pattern: /말$/, reason: '말 관련', category: 'animal' },
  { pattern: /소$/, reason: '소 관련', category: 'animal' },
  { pattern: /개$/, reason: '개 관련', category: 'animal' },
  { pattern: /게$/, reason: '게 관련', category: 'animal' },
  { pattern: /닭$/, reason: '닭 관련', category: 'animal' },
  { pattern: /^(벌레|새|날개)$/, reason: '동물 부위', category: 'animal' },

  // === 도구/물건 ===
  { pattern: /^(칼|도끼|창|활|방패|수레|낚시|가마|관|솥)$/, reason: '도구명', category: 'tool' },

  // === 악기명 🆕 ===
  { pattern: /^(피리|거문고|가야금|해금|대금|단소|장구|북|징|꽹과리|생황|비파|적|퉁소|아쟁|편경|편종|방울|목탁)$/, reason: '악기명', category: 'tool' },
  { pattern: /^(금|슬|적|관|현)$/, reason: '악기(한자)', category: 'tool' }, // 琴笙笛管絃 등

  // === 지명/장소 🆕 ===
  { pattern: /나라.*이름|국명|지명|고을.*이름/, reason: '지명/장소', category: 'misc' },
  { pattern: /^(터|마을|고을|동네|시장|거리)$/, reason: '장소명', category: 'misc' },

  // === 자연물 (공격적) ===
  { pattern: /^(흙|돌|모래|바위|늪|못)$/, reason: '자연물', category: 'nature' },
];

function shouldBlock(char: string, meaning: string): { block: boolean; reason?: string } {
  // 화이트리스트 체크 (최소화됨)
  if (SAFE_EXCEPTIONS.includes(char)) {
    return { block: false };
  }

  // 의미가 없거나 너무 짧으면 패스
  if (!meaning || meaning.length < 1) {
    return { block: false };
  }

  // 규칙 기반 필터링
  for (const rule of BLOCK_RULES) {
    if (rule.pattern.test(meaning)) {
      return { block: true, reason: rule.reason };
    }
  }

  return { block: false };
}

function shouldRestore(
  nameFrequency: number | null,
  usageFrequency: number | null
): boolean {
  // 빈도가 높으면 복원 (실제로 많이 쓰이는 한자)
  if (nameFrequency && nameFrequency >= FREQUENCY_RESTORE_THRESHOLD.nameFrequency) {
    return true;
  }
  if (usageFrequency && usageFrequency >= FREQUENCY_RESTORE_THRESHOLD.usageFrequency) {
    return true;
  }
  return false;
}

async function main() {
  console.log(`🔍 빈도 기반 하드블록 시스템 (v4)...`);
  if (DRY_RUN) {
    console.log(`⚠️  DRY-RUN 모드: DB 변경하지 않음\n`);
  } else {
    console.log(`⚠️  실제 적용 모드: DB 업데이트 진행\n`);
  }

  // 현재 상태 확인
  const totalCount = await prisma.hanjaDict.count();
  const currentBadCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: false }
  });
  const currentGoodCount = await prisma.hanjaDict.count({
    where: { isGoodForNaming: true }
  });

  console.log(`📊 현재 상태:`);
  console.log(`  전체: ${totalCount}자`);
  console.log(`  isGoodForNaming=false: ${currentBadCount}자 (수동 차단)`);
  console.log(`  isGoodForNaming=true: ${currentGoodCount}자\n`);

  // === STEP 1: 공격적 필터링 ===
  console.log(`\n🔥 STEP 1: 공격적 의미 기반 필터링...\n`);

  const hanjas = await prisma.hanjaDict.findMany({
    where: {
      meaning: { not: null },
      isGoodForNaming: true
    },
    select: {
      id: true,
      character: true,
      meaning: true,
      nameFrequency: true,
      usageFrequency: true,
    },
  });

  let blocked = 0;
  let skipped = 0;
  const blockedList: Array<{
    id: number;
    char: string;
    meaning: string;
    reason: string;
    nameFreq: number | null;
    usageFreq: number | null;
  }> = [];

  for (const h of hanjas) {
    const meaning = h.meaning ?? "";
    const char = h.character;

    const result = shouldBlock(char, meaning);

    if (result.block && result.reason) {
      blockedList.push({
        id: h.id,
        char,
        meaning,
        reason: result.reason,
        nameFreq: h.nameFrequency,
        usageFreq: h.usageFrequency,
      });
      blocked++;

      if (blocked <= 50) {
        console.log(`🚫 차단: ${char} - ${meaning} [${result.reason}]`);
      }
    } else {
      skipped++;
    }
  }

  if (blocked > 50) {
    console.log(`... 외 ${blocked - 50}자 더 차단됨`);
  }

  console.log(`\n📊 STEP 1 결과:`);
  console.log(`  차단 대상: ${blocked}자`);
  console.log(`  유지: ${skipped}자`);

  // === STEP 2: 빈도 기반 복원 ===
  console.log(`\n🔄 STEP 2: 빈도 기반 복원 (nameFreq≥${FREQUENCY_RESTORE_THRESHOLD.nameFrequency} OR usageFreq≥${FREQUENCY_RESTORE_THRESHOLD.usageFrequency})...\n`);

  let restored = 0;
  const restoredList: Array<{
    char: string;
    meaning: string;
    nameFreq: number | null;
    usageFreq: number | null;
  }> = [];

  const finalBlockList = blockedList.filter((item) => {
    const restore = shouldRestore(item.nameFreq, item.usageFreq);
    if (restore) {
      restored++;
      restoredList.push({
        char: item.char,
        meaning: item.meaning,
        nameFreq: item.nameFreq,
        usageFreq: item.usageFreq,
      });

      if (restored <= 30) {
        console.log(
          `✅ 복원: ${item.char} - ${item.meaning} [이름빈도:${item.nameFreq}, 사용빈도:${item.usageFreq}]`
        );
      }
      return false; // 차단 리스트에서 제외
    }
    return true; // 차단 유지
  });

  if (restored > 30) {
    console.log(`... 외 ${restored - 30}자 더 복원됨`);
  }

  console.log(`\n📊 STEP 2 결과:`);
  console.log(`  복원: ${restored}자`);
  console.log(`  최종 차단: ${finalBlockList.length}자`);

  // === STEP 3: DB 적용 ===
  if (!DRY_RUN && finalBlockList.length > 0) {
    console.log(`\n💾 STEP 3: DB 적용 중...\n`);

    const blockIds = finalBlockList.map((item) => item.id);

    const result = await prisma.hanjaDict.updateMany({
      where: {
        id: { in: blockIds },
      },
      data: {
        isGoodForNaming: false,
        review: 'needs_review',
      },
    });

    console.log(`✅ ${result.count}자 차단 완료`);
  }

  // === 최종 통계 ===
  const finalStats = !DRY_RUN
    ? await prisma.hanjaDict.groupBy({
        by: ['isGoodForNaming'],
        _count: true,
      })
    : null;

  console.log(`\n📊 최종 통계:`);
  if (DRY_RUN) {
    console.log(`  차단 예정: ${finalBlockList.length}자`);
    console.log(`  복원 예정: ${restored}자`);
    console.log(`  예상 최종 good: ${currentGoodCount - finalBlockList.length}자`);
  } else {
    finalStats?.forEach((s) => {
      console.log(`  isGoodForNaming=${s.isGoodForNaming}: ${s._count}자`);
    });
  }

  // === 사유별 통계 ===
  console.log(`\n📈 차단 사유별 통계:`);
  const reasonStats = new Map<string, number>();
  finalBlockList.forEach(({ reason }) => {
    reasonStats.set(reason, (reasonStats.get(reason) || 0) + 1);
  });

  Array.from(reasonStats.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count}자`);
    });

  // === 복원 대상 샘플 ===
  if (restoredList.length > 0) {
    console.log(`\n🔄 복원된 한자 샘플 (처음 20개):`);
    restoredList.slice(0, 20).forEach(({ char, meaning, nameFreq, usageFreq }) => {
      console.log(`  ${char} - ${meaning} [이름:${nameFreq}, 사용:${usageFreq}]`);
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
