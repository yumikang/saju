/**
 * 한자 작명 인기도 점수 업데이트 시스템
 *
 * 2024년 신생아 이름 통계 기반 nameFrequency 점수 산정
 * - 데이터 출처: 대한민국 법원 전자가족관계등록시스템 출생신고 통계
 * - 총 8,787개 한자 캐릭터 대상
 *
 * 점수 체계:
 * - 100: TOP 10 이름에 사용 (매우 인기 많음)
 * - 80-99: TOP 50 이름에 사용 (인기 많음)
 * - 60-79: TOP 100 이름에 사용 (인기 있음)
 * - 40-59: TOP 500 이름에 사용 (보통)
 * - 20-39: 가끔 사용 (작명에 간혹 사용)
 * - 1-19: 거의 사용 안 함 (매우 드물게 사용)
 * - 0: 현대 이름에 미사용
 *
 * @see Prisma batch update pattern for type safety
 * @see scripts/classify-gender-comprehensive.ts for similar pattern
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2024년 신생아 이름 통계 데이터
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 2024년 TOP 10 남아 이름 (1,593 ~ 1,135명)
 * 출처: 법원 전자가족관계등록시스템
 */
const TOP_10_MALE_NAMES = [
  '이준', '하준', '도윤', '은우', '시우',
  '서준', '선우', '유준', '수호', '도현',
] as const;

/**
 * 2024년 TOP 10 여아 이름 (1,689 ~ 1,087명)
 * 출처: 법원 전자가족관계등록시스템
 */
const TOP_10_FEMALE_NAMES = [
  '이서', '서아', '하린', '지유', '하윤',
  '지안', '지아', '서윤', '아린', '시아',
] as const;

/**
 * 2024년 TOP 11-50 남아 이름 (추정 1,100 ~ 600명)
 * 데이터 출처: namechart.kr, baby-name.kr 종합
 */
const TOP_50_MALE_NAMES = [
  '지호', '예준', '주원', '우진', '민준',
  '건우', '현우', '준서', '지우', '서우',
  '태윤', '시윤', '연우', '태오', '이안',
  '지훈', '민성', '윤우', '하율', '승우',
  '지환', '승현', '태현', '재윤', '준영',
  '윤호', '민규', '성민', '재현', '동현',
  '준혁', '우빈', '시후', '지한', '승준',
  '태민', '민호', '재민', '성준', '현준',
] as const;

/**
 * 2024년 TOP 11-50 여아 이름 (추정 1,050 ~ 550명)
 * 데이터 출처: namechart.kr, baby-name.kr 종합
 */
const TOP_50_FEMALE_NAMES = [
  '유주', '채원', '수아', '윤서', '채아',
  '지원', '민서', '서영', '다은', '소율',
  '하은', '예은', '서현', '예린', '다인',
  '수빈', '지민', '예서', '윤아', '소윤',
  '은서', '채은', '하늘', '지수', '수현',
  '민지', '예나', '소은', '유나', '채윤',
  '서은', '예원', '지예', '나윤', '서진',
  '다연', '소연', '채린', '민주', '유진',
] as const;

/**
 * 2024년 TOP 51-100 남아 이름 (추정 550 ~ 350명)
 * 데이터 출처: 통계 추정치 기반
 */
const TOP_100_MALE_NAMES = [
  '정우', '승민', '상우', '진우', '지안',
  '은찬', '태양', '시원', '준호', '시환',
  '예찬', '유찬', '강민', '지원', '태준',
  '시온', '준우', '정민', '성현', '주호',
  '윤성', '재원', '태은', '민우', '현성',
  '승원', '정현', '유현', '시완', '진호',
  '재혁', '시형', '준범', '동우', '승호',
  '현서', '재호', '우주', '태호', '준수',
  '지성', '민재', '성우', '현민', '승빈',
  '정훈', '재우', '윤재', '성훈', '도훈',
] as const;

/**
 * 2024년 TOP 51-100 여아 이름 (추정 520 ~ 330명)
 * 데이터 출처: 통계 추정치 기반
 */
const TOP_100_FEMALE_NAMES = [
  '지효', '서연', '가은', '서희', '은채',
  '예주', '하영', '지은', '다윤', '나은',
  '수민', '예빈', '지아', '하윤', '시현',
  '윤지', '서율', '가윤', '예진', '소희',
  '유림', '하빈', '서아', '나연', '윤하',
  '지윤', '다혜', '서우', '예림', '수연',
  '민아', '하연', '지현', '채연', '서린',
  '유빈', '나현', '소미', '다솜', '예지',
  '은지', '서민', '윤진', '하나', '지혜',
  '수진', '예윤', '소정', '다영', '유선',
] as const;

/**
 * 자주 사용되는 작명용 한자 (TOP 500 추정)
 * 한자 사전 및 작명 사이트 기반 선별
 */
const FREQUENTLY_USED_HANJA = [
  // 남성 선호 한자 (강함, 지혜, 덕목)
  '俊', '準', '峻', '竣', '駿', // 준 계열
  '宇', '佑', '祐', '又', '友', // 우 계열
  '瑞', '瑞', '端', // 서 계열
  '夏', '河', '荷', '賀', // 하 계열
  '道', '都', '度', '到', // 도 계열
  '允', '胤', '尹', '倫', // 윤 계열
  '時', '是', '侍', '詩', // 시 계열
  '鎬', '浩', '昊', '灝', '皓', '豪', // 호 계열
  '泰', '太', '態', '泰', // 태 계열
  '成', '誠', '城', '晟', '盛', '聖', // 성 계열
  '賢', '鉉', '炫', '弦', '玄', '顯', // 현 계열
  '民', '旻', '珉', '敏', '閔', '憫', // 민 계열
  '勝', '昇', '承', '丞', '乘', '升', // 승 계열
  '振', '眞', '鎭', '珍', '辰', '陳', // 진 계열
  '永', '泳', '映', '詠', '榮', '榮', // 영 계열

  // 여성 선호 한자 (아름다움, 부드러움)
  '書', '徐', '西', '曙', '緖', // 서 계열
  '智', '知', '池', '芝', '枝', '地', // 지 계열
  '雅', '娥', '我', '亞', '兒', // 아 계열
  '潤', '胤', '允', '尹', '倫', // 윤 계열
  '河', '夏', '荷', '何', '賀', // 하 계열
  '優', '羽', '雨', '又', '友', '宇', // 우 계열
  '延', '然', '姸', '娟', '妍', '硏', // 연 계열
  '秀', '綬', '受', '壽', '樹', '秋', // 수 계열
  '恩', '銀', '隱', '殷', '誾', '垠', // 은 계열
  '美', '未', '眉', '媚', '微', '尾', // 미 계열
  '惠', '慧', '蕙', '憙', '熹', '暉', // 혜 계열
  '娜', '奈', '那', '羅', '蘿', '羅', // 나 계열
  '淑', '叔', '姝', '淳', '純', '順', // 숙/순 계열
  '貞', '正', '靜', '情', '晴', '淨', // 정 계열

  // 중성 한자 (남녀 공통)
  '仁', '義', '禮', '智', '信', '孝',
  '福', '壽', '康', '寧', '安', '平',
  '明', '光', '輝', '曜', '晶', '星',
  '春', '夏', '秋', '冬', '日', '月',
  '東', '西', '南', '北', '中', '央',
  '善', '美', '德', '和', '樂', '喜',
  '天', '地', '山', '水', '木', '火',
  '金', '石', '玉', '珠', '琳', '瑛',
] as const;

/**
 * 간혹 사용되는 한자 (고전적이거나 특수한 의미)
 */
const OCCASIONALLY_USED_HANJA = [
  '鳳', '龍', '虎', '熊', '鶴', '麟', // 동물
  '梅', '蘭', '菊', '竹', '松', '柏', // 식물
  '璧', '璋', '瑜', '瑾', '琪', '琇', // 보석
  '劍', '弓', '戟', '矛', '盾', // 무기
  '雲', '雨', '雪', '霜', '露', '霧', // 날씨
  '彩', '紅', '碧', '翠', '紫', '綠', // 색상
  '聲', '音', '韻', '律', '歌', '詠', // 소리
  '香', '芬', '馥', '薰', '芳', // 향기
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 유틸리티 타입 및 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 이름 빈도 점수 타입 (0-100) */
type FrequencyScore = number;

/** 한자 점수 업데이트 데이터 */
interface HanjaFrequencyUpdate {
  character: string;
  score: FrequencyScore;
}

/**
 * 한글 이름에서 개별 음절 추출
 *
 * @param name - 한글 이름 (예: "이준", "서아")
 * @returns 음절 배열 (예: ["이", "준"], ["서", "아"])
 */
function extractSyllables(name: string): string[] {
  return name.split('');
}

/**
 * 모든 이름에서 사용된 한글 음절 추출
 *
 * @param names - 이름 목록
 * @returns 중복 제거된 음절 Set
 */
function extractUniqueSyllables(names: readonly string[]): Set<string> {
  const syllables = new Set<string>();
  names.forEach(name => {
    extractSyllables(name).forEach(syllable => syllables.add(syllable));
  });
  return syllables;
}

/**
 * 한글 음절과 매칭되는 한자 찾기 (데이터베이스 조회 기반)
 *
 * @param syllable - 한글 음절 (예: "준", "서")
 * @returns 해당 음절의 한자 배열
 */
async function findHanjaForSyllable(syllable: string): Promise<string[]> {
  const results = await prisma.hanjaDict.findMany({
    where: {
      koreanReading: {
        contains: syllable,
        mode: 'insensitive',
      },
    },
    select: { character: true },
  });

  return results.map(r => r.character);
}

/**
 * 점수별로 그룹화하여 updateMany로 안전하게 업데이트 (Type-safe)
 *
 * @param updates - 업데이트할 한자 배열
 * @param score - 설정할 점수
 */
async function bulkUpdateFrequency(
  updates: readonly HanjaFrequencyUpdate[],
  score: FrequencyScore
): Promise<void> {
  if (updates.length === 0) {
    console.log(`   ⚠️  점수 ${score}: 업데이트할 한자 없음\n`);
    return;
  }

  const startTime = Date.now();
  const characters = updates.map(u => u.character);

  console.log(`   📊 ${updates.length}개 한자 업데이트 시작...`);
  console.log(`   🎯 점수: ${score}\n`);

  const result = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: characters },
    },
    data: { nameFrequency: score },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = Math.round((result.count / (Date.now() - startTime)) * 1000);

  console.log(
    `   ✅ 완료: ${result.count}/${updates.length}개 업데이트 | ` +
    `${rate} records/sec | ${elapsed}s 경과`
  );

  if (result.count < updates.length) {
    console.log(
      `   ⚠️  ${updates.length - result.count}개 한자는 DB에 존재하지 않습니다.`
    );
  }

  console.log('');
}

/**
 * 이름 목록에서 사용된 모든 한자 추출 (음절 매칭 기반)
 *
 * @param names - 이름 목록
 * @returns 한자 Set
 */
async function extractHanjaFromNames(
  names: readonly string[]
): Promise<Set<string>> {
  const hanjaSet = new Set<string>();
  const syllables = extractUniqueSyllables(names);

  console.log(`   🔍 총 ${syllables.size}개 고유 음절 분석 중...`);

  for (const syllable of syllables) {
    const hanja = await findHanjaForSyllable(syllable);
    hanja.forEach(h => hanjaSet.add(h));
  }

  console.log(`   ✅ ${hanjaSet.size}개 한자 발견\n`);

  return hanjaSet;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function updateNameFrequency(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 한자 작명 인기도 점수 업데이트 시작...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1단계: TOP 10 이름 → 점수 100
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('1️⃣  TOP 10 이름 분석 (점수 100 - 매우 인기 많음)\n');

  const top10Names = [...TOP_10_MALE_NAMES, ...TOP_10_FEMALE_NAMES];
  const top10Hanja = await extractHanjaFromNames(top10Names);

  const top10Updates: HanjaFrequencyUpdate[] = Array.from(top10Hanja).map(char => ({
    character: char,
    score: 100,
  }));

  await bulkUpdateFrequency(top10Updates, 100);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2단계: TOP 11-50 이름 → 점수 80-99
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('2️⃣  TOP 11-50 이름 분석 (점수 90 - 인기 많음)\n');

  const top50Names = [...TOP_50_MALE_NAMES, ...TOP_50_FEMALE_NAMES];
  const top50Hanja = await extractHanjaFromNames(top50Names);

  // TOP 10에 이미 포함된 한자 제외
  const top50OnlyHanja = new Set(
    Array.from(top50Hanja).filter(h => !top10Hanja.has(h))
  );

  const top50Updates: HanjaFrequencyUpdate[] = Array.from(top50OnlyHanja).map(char => ({
    character: char,
    score: 90,
  }));

  await bulkUpdateFrequency(top50Updates, 90);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3단계: TOP 51-100 이름 → 점수 60-79
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('3️⃣  TOP 51-100 이름 분석 (점수 70 - 인기 있음)\n');

  const top100Names = [...TOP_100_MALE_NAMES, ...TOP_100_FEMALE_NAMES];
  const top100Hanja = await extractHanjaFromNames(top100Names);

  // 이미 처리된 한자 제외
  const top100OnlyHanja = new Set(
    Array.from(top100Hanja).filter(h => !top10Hanja.has(h) && !top50Hanja.has(h))
  );

  const top100Updates: HanjaFrequencyUpdate[] = Array.from(top100OnlyHanja).map(char => ({
    character: char,
    score: 70,
  }));

  await bulkUpdateFrequency(top100Updates, 70);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4단계: 자주 사용되는 한자 → 점수 40-59
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('4️⃣  자주 사용되는 작명용 한자 (점수 50 - 보통)\n');

  const processedHanja = new Set([...top10Hanja, ...top50Hanja, ...top100Hanja]);
  const frequentOnlyHanja = FREQUENTLY_USED_HANJA.filter(
    h => !processedHanja.has(h)
  );

  const frequentUpdates: HanjaFrequencyUpdate[] = frequentOnlyHanja.map(char => ({
    character: char,
    score: 50,
  }));

  await bulkUpdateFrequency(frequentUpdates, 50);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5단계: 간혹 사용되는 한자 → 점수 20-39
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('5️⃣  간혹 사용되는 한자 (점수 30 - 가끔 사용)\n');

  processedHanja.forEach(h => processedHanja.add(h));
  FREQUENTLY_USED_HANJA.forEach(h => processedHanja.add(h));

  const occasionalOnlyHanja = OCCASIONALLY_USED_HANJA.filter(
    h => !processedHanja.has(h)
  );

  const occasionalUpdates: HanjaFrequencyUpdate[] = occasionalOnlyHanja.map(char => ({
    character: char,
    score: 30,
  }));

  await bulkUpdateFrequency(occasionalUpdates, 30);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6단계: 나머지는 모두 0 (사용 안 함)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('6️⃣  나머지 한자 → 0점 처리 (현대 작명 미사용)\n');

  const remaining = await prisma.hanjaDict.count({
    where: { nameFrequency: null }
  });

  if (remaining > 0) {
    console.log(`   📊 미처리 한자: ${remaining}개\n`);

    const zeroResult = await prisma.hanjaDict.updateMany({
      where: {
        OR: [
          { nameFrequency: null },
          { nameFrequency: 0 }
        ]
      },
      data: { nameFrequency: 0 },
    });

    console.log(`   ✅ ${zeroResult.count}개 한자를 0점으로 설정\n`);
  } else {
    console.log(`   ✅ 모든 한자가 이미 처리되었습니다.\n`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 최종 통계
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 최종 통계');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const stats = await prisma.hanjaDict.groupBy({
    by: ['nameFrequency'],
    _count: true,
    orderBy: { nameFrequency: 'desc' },
  });

  const totalCount = await prisma.hanjaDict.count();

  for (const stat of stats) {
    const score = stat.nameFrequency ?? 0;
    const count = stat._count;
    const percentage = ((count / totalCount) * 100).toFixed(2);

    let emoji = '';
    let label = '';

    if (score === 100) {
      emoji = '🔥';
      label = '매우 인기 많음 (TOP 10)';
    } else if (score >= 80) {
      emoji = '⭐';
      label = '인기 많음 (TOP 50)';
    } else if (score >= 60) {
      emoji = '✨';
      label = '인기 있음 (TOP 100)';
    } else if (score >= 40) {
      emoji = '💫';
      label = '보통 (자주 사용)';
    } else if (score >= 20) {
      emoji = '🌟';
      label = '가끔 사용';
    } else if (score >= 1) {
      emoji = '⚡';
      label = '거의 사용 안 함';
    } else {
      emoji = '❌';
      label = '현대 작명 미사용';
    }

    console.log(
      `${emoji} ${score}점 (${label}): ${count}개 (${percentage}%)`
    );
  }

  // null 값 확인
  const nullCount = await prisma.hanjaDict.count({
    where: { nameFrequency: null }
  });

  if (nullCount > 0) {
    console.log(`\n⚠️  경고: ${nullCount}개 한자가 여전히 미처리 상태입니다!`);
  } else {
    console.log('\n✅ 모든 한자 점수 업데이트 완료!');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 작명 인기도 점수 시스템 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

updateNameFrequency()
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
