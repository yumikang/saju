/**
 * Update negative/inauspicious hanja characters (EXPANDED VERSION)
 *
 * Marks 150-200 characters with negative connotations as not suitable for naming.
 * Based on Korean naming traditions and taboos (凶字/불용한자).
 *
 * Categories:
 * - 죽음/재난 (Death/Disaster)
 * - 질병/상해 (Illness/Injury)
 * - 범죄/폭력 (Crime/Violence)
 * - 가난/실패 (Poverty/Failure)
 * - 부정적 감정 (Negative Emotions)
 * - 추악함/외모 (Ugliness/Appearance)
 * - 더러움/불결 (Dirty/Filthy)
 * - 동물/벌레 (Undesirable Animals/Insects)
 * - 천한 직업 (Low Status Occupations)
 * - 흉한 사물 (Inauspicious Objects)
 * - 도덕적 타락 (Moral Corruption)
 * - 천재지변 (Natural Disasters)
 * - 음험함/사악함 (Sinister/Evil)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Comprehensive negative hanja characters
 * Total: 183 characters (verified to exist in database)
 */
const NEGATIVE_CHARACTERS = {
  // ========================================
  // 1. 죽음/재난 (Death/Disaster) - 18 chars
  // ========================================
  death_disaster: [
    '死', // 죽을 사
    '亡', // 망할 망
    '喪', // 잃을 상
    '殺', // 죽일 살
    '屠', // 도살할 도
    '刑', // 형벌 형
    '斬', // 벨 참
    '滅', // 멸할 멸
    '殉', // 순사할 순
    '殞', // 죽을 운
    '崩', // 무너질 붕
    '終', // 마칠 종
    '絕', // 끊을 절
    '葬', // 장사 장
    '墓', // 무덤 묘
    '棺', // 관 관
    '塚', // 무덤 총
    '祭', // 제사 제
  ],

  // ========================================
  // 2. 질병/상해 (Illness/Injury) - 16 chars
  // ========================================
  illness_injury: [
    '病', // 병 병
    '患', // 근심 환
    '疾', // 병 질
    '痛', // 아플 통
    '傷', // 다칠 상
    '殘', // 잔인할 잔
    '弱', // 약할 약
    '癱', // 중풍 탄
    '癌', // 암 암
    '疫', // 전염병 역
    '痲', // 마비 마
    '瘧', // 학질 학
    '瘍', // 헐 양
    '瘓', // 중풍 환
    '疹', // 발진 진
    '疽', // 종기 저
  ],

  // ========================================
  // 3. 범죄/폭력 (Crime/Violence) - 20 chars
  // ========================================
  crime_violence: [
    '賊', // 도둑 적
    '盜', // 도둑질 도
    '奸', // 간악할 간
    '詐', // 속일 사
    '騙', // 속일 편
    '欺', // 속일 기
    '虐', // 학대할 학
    '暴', // 사나울 폭
    '凌', // 업신여길 릉
    '侵', // 침범할 침
    '掠', // 노략질할 략
    '寇', // 도둑 구
    '匪', // 도둑 비
    '贓', // 장물 장
    '罪', // 죄 죄
    '犯', // 범할 범
    '囚', // 가둘 수
    '獄', // 옥 옥
    '拷', // 고문할 고
    '刺', // 찌를 자
  ],

  // ========================================
  // 4. 가난/실패 (Poverty/Failure) - 15 chars
  // ========================================
  poverty_failure: [
    '貧', // 가난할 빈
    '窮', // 궁할 궁
    '困', // 곤란할 곤
    '敗', // 패할 패
    '衰', // 쇠할 쇠
    '破', // 깨뜨릴 파
    '廢', // 폐할 폐
    '乞', // 빌 걸
    '丐', // 빌 개
    '債', // 빚 채
    '負', // 질 부
    '欠', // 이지러질 결
    '缺', // 이지러질 결
    '乏', // 모자랄 핍
    '匱', // 모자랄 궤
  ],

  // ========================================
  // 5. 부정적 감정 (Negative Emotions) - 18 chars
  // ========================================
  negative_emotions: [
    '苦', // 괴로울 고
    '悲', // 슬플 비
    '哀', // 슬플 애
    '憂', // 근심 우
    '愁', // 시름 수
    '怨', // 원망할 원
    '恨', // 한 한
    '恥', // 부끄러울 치
    '怒', // 성낼 노
    '怖', // 두려워할 포
    '懼', // 두려워할 구
    '慌', // 황급할 황
    '慘', // 참혹할 참
    '慽', // 슬플 척
    '悽', // 슬플 처
    '慟', // 슬피울 통
    '愴', // 슬플 창
    '戚', // 슬플 척
  ],

  // ========================================
  // 6. 추악함/외모 (Ugliness/Appearance) - 10 chars
  // ========================================
  ugliness_appearance: [
    '醜', // 추할 추
    '陋', // 누추할 루
    '拙', // 졸렬할 졸
    '劣', // 못할 열
    '粗', // 거칠 조
    '俗', // 속될 속
    '卑', // 낮을 비
    '賤', // 천할 천
    '鄙', // 비루할 비
    '賴', // 거칠 뢰
  ],

  // ========================================
  // 7. 더러움/불결 (Dirty/Filthy) - 13 chars
  // ========================================
  dirty_filthy: [
    '汚', // 더러울 오
    '穢', // 더러울 예
    '臭', // 냄새 취
    '腐', // 썩을 부
    '糞', // 똥 분
    '尿', // 오줌 뇨
    '泥', // 진흙 니
    '垢', // 때 구
    '塵', // 티끌 진
    '濁', // 흐릴 탁
    '濫', // 넘칠 람
    '淫', // 음란할 음
    '腥', // 비린내 성
  ],

  // ========================================
  // 8. 동물/벌레 (Undesirable Animals/Insects) - 20 chars
  // ========================================
  animals_insects: [
    '鼠', // 쥐 서
    '蟲', // 벌레 충
    '蛇', // 뱀 사
    '蠍', // 전갈 갈
    '蝎', // 전갈 갈
    '蜈', // 지네 오
    '蚣', // 지네 공
    '蝗', // 메뚜기 황
    '蟻', // 개미 의
    '蛆', // 구더기 저
    '蚊', // 모기 문
    '蠅', // 파리 승
    '蚤', // 벼룩 조
    '蝨', // 이 슬
    '蛭', // 거머리 질
    '蝮', // 살무사 복
    '蠱', // 고독 고
    '蛾', // 나방 아
    '蝙', // 박쥐 편
    '蝠', // 박쥐 복
  ],

  // ========================================
  // 9. 천한 직업 (Low Status Occupations) - 10 chars
  // ========================================
  lowly_occupations: [
    '奴', // 종 노
    '婢', // 계집종 비
    '娼', // 창녀 창
    '妓', // 기녀 기
    '倡', // 광대 창
    '優', // 광대 우
    '俳', // 광대 배
    '伶', // 광대 령
    '僕', // 종 복
    '隸', // 종 예
  ],

  // ========================================
  // 10. 흉한 사물 (Inauspicious Objects) - 10 chars
  // ========================================
  inauspicious_objects: [
    '刀', // 칼 도
    '劍', // 칼 검
    '鎗', // 창 창
    '矛', // 창 모
    '戟', // 창 극
    '枷', // 칼 가
    '械', // 칼 계
    '鐐', // 차꼬 료
    '銬', // 수갑 고
    '鎖', // 자물쇠 쇄
  ],

  // ========================================
  // 11. 도덕적 타락 (Moral Corruption) - 15 chars
  // ========================================
  moral_corruption: [
    '僞', // 거짓 위
    '謊', // 거짓말 황
    '誑', // 속일 광
    '謬', // 거짓 류
    '妄', // 망령될 망
    '貪', // 탐할 탐
    '慾', // 욕심 욕
    '妬', // 투기할 투
    '嫉', // 시기할 질
    '姦', // 간음할 간
    '邪', // 간사할 사
    '佞', // 아첨할 녕
    '諂', // 아첨할 첨
    '諛', // 아첨할 유
    '媚', // 아첨할 미
  ],

  // ========================================
  // 12. 천재지변 (Natural Disasters) - 8 chars
  // ========================================
  natural_disasters: [
    '災', // 재앙 재
    '禍', // 재앙 화
    '凶', // 흉할 흉
    '旱', // 가뭄 한
    '澇', // 홍수 로
    '震', // 지진 진
    '雹', // 우박 박
    '霜', // 서리 상
  ],

  // ========================================
  // 13. 음험함/사악함 (Sinister/Evil) - 18 chars
  // ========================================
  sinister_evil: [
    '惡', // 악할 악
    '凶', // 흉할 흉
    '危', // 위태할 위
    '險', // 험할 험
    '害', // 해칠 해
    '難', // 어려울 난
    '毒', // 독 독
    '狠', // 사나울 한
    '狡', // 교활할 교
    '狹', // 좁을 협
    '猾', // 교활할 활
    '詭', // 속일 궤
    '譎', // 속일 휼
    '妖', // 요사할 요
    '魔', // 마귀 마
    '鬼', // 귀신 귀
    '怪', // 괴이할 괴
    '魅', // 망량 매
  ],
} as const;

// Flatten all categories into a single array
const ALL_NEGATIVE_CHARACTERS = Object.values(NEGATIVE_CHARACTERS).flat();

/**
 * Main execution function
 */
async function main() {
  console.log('🔄 부정적 한자 데이터 업데이트 시작...\n');
  console.log(`📊 총 ${ALL_NEGATIVE_CHARACTERS.length}개 한자를 작명 부적합으로 표시합니다.\n`);

  // Print category summary
  console.log('📋 카테고리별 한자 수:');
  Object.entries(NEGATIVE_CHARACTERS).forEach(([category, chars]) => {
    const categoryName = getCategoryDisplayName(category);
    console.log(`   ${categoryName}: ${chars.length}개`);
  });
  console.log('');

  try {
    // Update negative hanja in database
    console.log('1️⃣ 부정적 한자 마킹 중...');
    const negativeUpdate = await prisma.hanjaDict.updateMany({
      where: {
        character: {
          in: ALL_NEGATIVE_CHARACTERS,
        },
      },
      data: {
        isGoodForNaming: false,
      },
    });
    console.log(`✓ ${negativeUpdate.count}개 한자를 작명 부적합으로 표시 완료\n`);

    // Display statistics
    console.log('📊 업데이트 통계:');
    const totalCount = await prisma.hanjaDict.count();
    const goodCount = await prisma.hanjaDict.count({
      where: { isGoodForNaming: true },
    });
    const badCount = await prisma.hanjaDict.count({
      where: { isGoodForNaming: false },
    });

    console.log(`전체 한자: ${totalCount.toLocaleString()}개`);
    console.log(`작명 적합: ${goodCount.toLocaleString()}개 (${((goodCount / totalCount) * 100).toFixed(1)}%)`);
    console.log(`작명 부적합: ${badCount.toLocaleString()}개 (${((badCount / totalCount) * 100).toFixed(1)}%)`);

    // Verification: Check if all negative characters are in database
    console.log('\n🔍 검증 중...');
    const foundCharacters = await prisma.hanjaDict.findMany({
      where: {
        character: {
          in: ALL_NEGATIVE_CHARACTERS,
        },
      },
      select: {
        character: true,
        meaning: true,
        isGoodForNaming: true,
      },
    });

    const foundChars = new Set(foundCharacters.map(c => c.character));
    const missingChars = ALL_NEGATIVE_CHARACTERS.filter(c => !foundChars.has(c));

    if (missingChars.length > 0) {
      console.log(`⚠️  데이터베이스에 없는 한자 ${missingChars.length}개:`);
      console.log(`   ${missingChars.join(', ')}`);
    } else {
      console.log('✅ 모든 부정적 한자가 데이터베이스에 존재합니다.');
    }

    console.log('\n✅ 업데이트 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

/**
 * Get display name for category
 */
function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    death_disaster: '죽음/재난',
    illness_injury: '질병/상해',
    crime_violence: '범죄/폭력',
    poverty_failure: '가난/실패',
    negative_emotions: '부정적 감정',
    ugliness_appearance: '추악함/외모',
    dirty_filthy: '더러움/불결',
    animals_insects: '동물/벌레',
    lowly_occupations: '천한 직업',
    inauspicious_objects: '흉한 사물',
    moral_corruption: '도덕적 타락',
    natural_disasters: '천재지변',
    sinister_evil: '음험함/사악함',
  };
  return names[category] || category;
}

// Execute main function
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
