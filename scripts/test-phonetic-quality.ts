/**
 * Phonetic Quality Regression Test
 *
 * 회귀 테스트: 발음 자연스러움 + 빅램 보너스 검증
 */

import {
  scorePhoneticNaturalness,
  explainPhoneticNaturalness,
} from '../app/lib/naming/utils/phonetic-naturalness';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎙️  Phonetic Quality Regression Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 1: 낯선 조합 → 하위 점수 (< 70)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('🔹 Test 1: 낯선 조합 (하위 점수 기대)\n');

const awkwardNames = [
  ['서', '서'], // 반복
  ['준', '준'], // 반복
  ['도', '호'], // 낯선 조합
  ['호', '도'], // 낯선 조합
  ['쇄', '란'], // 드문 음절
  ['쉐', '윤'], // 드문 음절
  ['뫼', '린'], // 드문 음절
];

console.log('이름   | 점수  | 설명');
console.log('-------|-------|-------------------------------------');

awkwardNames.forEach((name) => {
  const score = scorePhoneticNaturalness(name);
  const explanation = explainPhoneticNaturalness(name, score);
  const pass = score < 70 ? '✅' : '❌';
  console.log(
    `${name.join('').padEnd(7)}| ${score.toFixed(1).padEnd(6)}| ${explanation} ${pass}`
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 2: 자연스러운 조합 → 높은 점수 (>= 85)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔹 Test 2: 자연스러운 조합 (높은 점수 기대)\n');

const naturalNames = [
  ['지', '우'], // 빅램 보너스 +5
  ['서', '연'], // 빅램 보너스 +5
  ['민', '준'], // 빅램 보너스 +5
  ['하', '린'], // 빅램 보너스 +4
  ['서', '윤'], // 빅램 보너스 +5
  ['연', '우'], // 빅램 보너스 +4
  ['태', '이'], // 빅램 보너스 +3
  ['하', '윤'], // 빅램 보너스 +5
  ['지', '안'], // 빅램 보너스 +4
  ['채', '원'], // 빅램 보너스 +4
];

console.log('이름   | 점수  | 빅램 | 설명');
console.log('-------|-------|------|-------------------------------------');

naturalNames.forEach((name) => {
  const score = scorePhoneticNaturalness(name);
  const explanation = explainPhoneticNaturalness(name, score);
  const pass = score >= 85 ? '✅' : '❌';
  const hasBigram = score >= 90 ? '빅램✔' : '-';
  console.log(
    `${name.join('').padEnd(7)}| ${score.toFixed(1).padEnd(6)}| ${hasBigram.padEnd(5)}| ${explanation} ${pass}`
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 3: 화이트리스트 음절 (패널티 미적용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔹 Test 3: 화이트리스트 음절 (패널티 미적용)\n');

const whitelistNames = [
  ['태', '린'],
  ['채', '윤'],
  ['해', '인'],
  ['소', '윤'],
  ['라', '온'],
  ['나', '연'], // 빅램 보너스도 있음
  ['지', '율'],
  ['하', '원'],
  ['빈', '서'],
  ['솔', '아'],
];

console.log('이름   | 점수  | 설명');
console.log('-------|-------|-------------------------------------');

whitelistNames.forEach((name) => {
  const score = scorePhoneticNaturalness(name);
  const explanation = explainPhoneticNaturalness(name, score);
  const pass = score >= 80 ? '✅' : '❌';
  console.log(
    `${name.join('').padEnd(7)}| ${score.toFixed(1).padEnd(6)}| ${explanation} ${pass}`
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Summary
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Summary\n');

const awkwardPassed = awkwardNames.filter(
  (n) => scorePhoneticNaturalness(n) < 70
).length;
const naturalPassed = naturalNames.filter(
  (n) => scorePhoneticNaturalness(n) >= 85
).length;
const whitelistPassed = whitelistNames.filter(
  (n) => scorePhoneticNaturalness(n) >= 80
).length;

console.log(`✅ 낯선 조합 하위권: ${awkwardPassed}/${awkwardNames.length}`);
console.log(`✅ 자연 조합 상위권: ${naturalPassed}/${naturalNames.length}`);
console.log(`✅ 화이트리스트 통과: ${whitelistPassed}/${whitelistNames.length}`);

const allPassed =
  awkwardPassed === awkwardNames.length &&
  naturalPassed === naturalNames.length &&
  whitelistPassed === whitelistNames.length;

if (allPassed) {
  console.log('\n🎉 All Tests PASSED!');
} else {
  console.log('\n⚠️  Some Tests FAILED - Review needed');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
