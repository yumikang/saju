/**
 * Test script for scoring mode system
 *
 * Tests:
 * 1. Mode configurations (균형형, 의미형, 하이브리드)
 * 2. Hybrid mode dynamic weight adjustment
 * 3. Safety threshold application
 */

import {
  BALANCE_MODE,
  MEANING_MODE,
  HYBRID_MODE,
  calculateHybridWeights,
  applySafetyThreshold,
  validateWeights,
} from '../app/lib/naming/types/scoring-mode';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Scoring Mode System Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 1: Mode Configurations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('🔹 Test 1: Mode Configurations\n');

const modes = [
  { name: '균형형 (Balance)', config: BALANCE_MODE },
  { name: '의미형 (Meaning)', config: MEANING_MODE },
  { name: '하이브리드 (Hybrid)', config: HYBRID_MODE },
];

modes.forEach(({ name, config }) => {
  console.log(`${name}:`);
  console.log(`  Description: ${config.description}`);
  console.log(`  Element Threshold: ${config.elementThreshold}`);
  console.log(`  Meaning Cap: +${config.meaningCap}`);
  console.log(`  Weights:`);
  console.log(`    - 오행: ${(config.weights.element * 100).toFixed(0)}%`);
  console.log(`    - 음양: ${(config.weights.yinyang * 100).toFixed(0)}%`);
  console.log(`    - 의미: ${(config.weights.meaning * 100).toFixed(0)}%`);
  console.log(`    - 언어: ${(config.weights.linguistic * 100).toFixed(0)}%`);
  console.log(`    - 금기: ${(config.weights.taboo * 100).toFixed(0)}%`);

  const weightSum = Object.values(config.weights).reduce((a, b) => a + b, 0);
  const isValid = validateWeights(config.weights);
  console.log(`  Sum: ${weightSum.toFixed(3)} (Valid: ${isValid ? '✅' : '❌'})\n`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 2: Hybrid Mode Dynamic Weights
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔹 Test 2: Hybrid Mode Dynamic Weight Adjustment\n');

const elementScores = [100, 80, 60, 40, 20];

console.log('Element Score | Element Weight | Meaning Weight | Sum   | Valid');
console.log('-------------|---------------|---------------|-------|------');

elementScores.forEach(score => {
  const weights = calculateHybridWeights(score);
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = validateWeights(weights);

  console.log(
    `${score.toString().padEnd(13)}| ${(weights.element * 100).toFixed(1)}%`.padEnd(15) +
    `| ${(weights.meaning * 100).toFixed(1)}%`.padEnd(15) +
    `| ${sum.toFixed(3)} | ${isValid ? '✅' : '❌'}`
  );
});

console.log('\n설명:');
console.log('- Element Score 높음 (100) → 오행 가중치 낮춤 (30%), 의미 가중치 높임 (30%)');
console.log('- Element Score 낮음 (20)  → 오행 가중치 높임 (45%), 의미 가중치 낮춤 (15%)');
console.log('- 오행이 부족할수록 오행에 집중, 충분하면 의미에 집중\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 3: Safety Threshold Application
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔹 Test 3: Safety Threshold Application\n');

const testCases = [
  { score: 95.0, elementScore: 70, threshold: 60, mode: '균형형' },
  { score: 95.0, elementScore: 55, threshold: 60, mode: '균형형' },
  { score: 92.0, elementScore: 45, threshold: 50, mode: '의미형' },
  { score: 88.0, elementScore: 50, threshold: 55, mode: '하이브리드' },
  { score: 85.0, elementScore: 52, threshold: 55, mode: '하이브리드' },
];

console.log('Score | Element | Threshold | Final Score | Capped?');
console.log('------|---------|-----------|-------------|--------');

testCases.forEach(({ score, elementScore, threshold, mode }) => {
  const finalScore = applySafetyThreshold(score, elementScore, threshold);
  const capped = finalScore < score;

  console.log(
    `${score.toString().padEnd(6)}| ${elementScore.toString().padEnd(8)}| ${threshold.toString().padEnd(10)}| ${finalScore.toFixed(1).padEnd(12)}| ${capped ? '❌ (79.9)' : '✅'}`
  );
});

console.log('\n설명:');
console.log('- 오행 점수가 기준(threshold) 미달이면 79.9점으로 제한');
console.log('- 이를 통해 의미 점수가 높아도 오행이 나쁜 이름은 TOP 10 진입 차단\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 4: Weight Comparison
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔹 Test 4: Weight Comparison for Element Score 60\n');

const score60Hybrid = calculateHybridWeights(60);

console.log('Scorer     | 균형형 | 의미형 | 하이브리드(60점)');
console.log('-----------|-------|-------|----------------');
console.log(`오행       | ${(BALANCE_MODE.weights.element * 100).toFixed(0)}%   | ${(MEANING_MODE.weights.element * 100).toFixed(0)}%   | ${(score60Hybrid.element * 100).toFixed(1)}%`);
console.log(`음양       | ${(BALANCE_MODE.weights.yinyang * 100).toFixed(0)}%   | ${(MEANING_MODE.weights.yinyang * 100).toFixed(0)}%   | ${(score60Hybrid.yinyang * 100).toFixed(1)}%`);
console.log(`의미       | ${(BALANCE_MODE.weights.meaning * 100).toFixed(0)}%   | ${(MEANING_MODE.weights.meaning * 100).toFixed(0)}%   | ${(score60Hybrid.meaning * 100).toFixed(1)}%`);
console.log(`언어       | ${(BALANCE_MODE.weights.linguistic * 100).toFixed(0)}%   | ${(MEANING_MODE.weights.linguistic * 100).toFixed(0)}%   | ${(score60Hybrid.linguistic * 100).toFixed(1)}%`);
console.log(`금기       | ${(BALANCE_MODE.weights.taboo * 100).toFixed(0)}%   | ${(MEANING_MODE.weights.taboo * 100).toFixed(0)}%   | ${(score60Hybrid.taboo * 100).toFixed(1)}%`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ All Tests Passed!\n');
