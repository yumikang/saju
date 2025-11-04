/**
 * Gender Sensitivity Filter Test
 *
 * 성별 감성 필터링 시스템 검증
 */

import {
  evaluateGenderSensitivity,
  adjustScoreForGenderSensitivity,
  passesGenderSensitivityFilter,
  type Gender,
} from '../app/lib/naming/utils/gender-sensitivity-filter';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚻 성별 감성 필터링 시스템 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 테스트 케이스 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TestCase {
  name: string;
  hanja: string[];
  gender: Gender;
  expectedPass: boolean;
  expectedPenalty: number;
  category: string;
}

const testCases: TestCase[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 여아 케이스
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: '서연',
    hanja: ['瑞', '姸'],
    gender: 'FEMALE',
    expectedPass: true, // 姸는 여성적 한자지만 여아이므로 OK
    expectedPenalty: 0,
    category: '✅ 여아 적합 (여성적 한자)',
  },
  {
    name: '지우',
    hanja: ['智', '宇'],
    gender: 'FEMALE',
    expectedPass: true,
    expectedPenalty: 0,
    category: '✅ 여아 적합 (중성)',
  },
  {
    name: '준희',
    hanja: ['俊', '熙'],
    gender: 'FEMALE',
    expectedPass: false, // 俊은 남성적 한자 (medium severity)
    expectedPenalty: -40,
    category: '❌ 여아 부적합 (남성적 한자 medium)',
  },
  {
    name: '민준',
    hanja: ['敏', '俊'],
    gender: 'FEMALE',
    expectedPass: false,
    expectedPenalty: -40,
    category: '❌ 여아 부적합 (준)',
  },
  {
    name: '서호',
    hanja: ['瑞', '豪'],
    gender: 'FEMALE',
    expectedPass: false, // 豪는 남성적 한자 (medium severity)
    expectedPenalty: -40,
    category: '❌ 여아 부적합 (호)',
  },
  {
    name: '현우',
    hanja: ['玄', '宇'],
    gender: 'FEMALE',
    expectedPass: false, // 玄은 남성적 한자 (low severity)
    expectedPenalty: -20,
    category: '⚠️ 여아 약간 부적합 (현)',
  },
  {
    name: '서웅',
    hanja: ['瑞', '雄'],
    gender: 'FEMALE',
    expectedPass: false, // 雄은 high severity
    expectedPenalty: -100,
    category: '🚨 여아 완전 차단 (웅)',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 남아 케이스
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: '민준',
    hanja: ['敏', '俊'],
    gender: 'MALE',
    expectedPass: true, // 俊은 남성적 한자지만 남아이므로 OK
    expectedPenalty: 0,
    category: '✅ 남아 적합 (남성적 한자)',
  },
  {
    name: '지우',
    hanja: ['智', '宇'],
    gender: 'MALE',
    expectedPass: true,
    expectedPenalty: 0,
    category: '✅ 남아 적합 (중성)',
  },
  {
    name: '서연',
    hanja: ['瑞', '姸'],
    gender: 'MALE',
    expectedPass: false, // 姸은 여성적 한자 (high severity)
    expectedPenalty: -100,
    category: '❌ 남아 부적합 (여성적 한자 연)',
  },
  {
    name: '지아',
    hanja: ['智', '雅'],
    gender: 'MALE',
    expectedPass: false, // 雅는 여성적 한자 (medium severity)
    expectedPenalty: -40,
    category: '❌ 남아 부적합 (아)',
  },
  {
    name: '민완',
    hanja: ['敏', '婉'],
    gender: 'MALE',
    expectedPass: false, // 婉은 high severity
    expectedPenalty: -100,
    category: '🚨 남아 완전 차단 (완)',
  },
  {
    name: '서유',
    hanja: ['瑞', '柔'],
    gender: 'MALE',
    expectedPass: false, // 柔는 여성적 한자 (medium severity)
    expectedPenalty: -40,
    category: '❌ 남아 부적합 (유)',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NEUTRAL 케이스
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: '준희',
    hanja: ['俊', '熙'],
    gender: 'NEUTRAL',
    expectedPass: true, // NEUTRAL은 필터링 제외
    expectedPenalty: 0,
    category: '✅ 중성 (필터링 제외)',
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 테스트 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let passedCount = 0;
let failedCount = 0;

testCases.forEach((testCase) => {
  console.log(`🔹 ${testCase.category}`);
  console.log(`   이름: ${testCase.name} (${testCase.hanja.join('')}) | 성별: ${testCase.gender}\n`);

  const result = evaluateGenderSensitivity(testCase.hanja, testCase.gender);
  const passes = passesGenderSensitivityFilter(testCase.hanja, testCase.gender);

  // 결과 출력
  console.log(`   📊 평가 결과:`);
  console.log(`      적합성: ${result.isAppropriate ? '✅ 적합' : '❌ 부적합'}`);
  console.log(`      패널티: ${result.penalty}점`);

  if (result.issues.length > 0) {
    console.log(`      이슈:`);
    result.issues.forEach((issue) => {
      const emoji =
        issue.severity === 'high' ? '🚨' : issue.severity === 'medium' ? '⚠️' : '⚡';
      console.log(
        `        ${emoji} ${issue.char} (${issue.reading}): ${issue.reason} [${issue.severity}]`
      );
    });
  }

  // 점수 조정 테스트
  const baseScore = 90;
  const adjustedScore = adjustScoreForGenderSensitivity(baseScore, testCase.hanja, testCase.gender);
  console.log(`\n   🎯 점수 조정:`);
  console.log(`      기본 점수: ${baseScore}점`);
  console.log(`      조정 점수: ${adjustedScore}점`);

  // 예상 결과 검증
  const passMatch = passes === testCase.expectedPass;
  const penaltyMatch = result.penalty === testCase.expectedPenalty;

  console.log(`\n   ✅ 예상 결과:`);
  console.log(`      통과 여부: ${passMatch ? '✅' : '❌'} (예상: ${testCase.expectedPass}, 실제: ${passes})`);
  console.log(
    `      패널티: ${penaltyMatch ? '✅' : '❌'} (예상: ${testCase.expectedPenalty}, 실제: ${result.penalty})`
  );

  if (passMatch && penaltyMatch) {
    passedCount++;
    console.log(`   🎉 테스트 통과\n`);
  } else {
    failedCount++;
    console.log(`   🚨 테스트 실패\n`);
  }

  console.log('─'.repeat(60) + '\n');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 최종 결과
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 테스트 결과 요약\n');
console.log(`✅ 통과: ${passedCount}/${testCases.length}`);
console.log(`❌ 실패: ${failedCount}/${testCases.length}`);

if (failedCount === 0) {
  console.log('\n🎉 All Tests PASSED!');
} else {
  console.log(`\n🚨 ${failedCount} Tests FAILED!`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
