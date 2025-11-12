#!/usr/bin/env npx tsx
/**
 * 의미 버킷 시스템 테스트
 */

import {
  findMatchingBucket,
  calculateBucketScore,
  normalizeBucketScore,
  MEANING_BUCKETS
} from '../app/lib/naming/scorers/meaning-buckets';
import type { ParentValue } from '../app/components/naming/ValueSelector';

function formatScore(score: number): string {
  return (score > 0 ? '+' : '') + score;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 의미 버킷 시스템 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: 한가할 閒 (calm bucket)
console.log('【Test 1】 "한가할" 閒');
console.log('─────────────────────────────────');

const meaning1 = '한가할';
const bucket1 = findMatchingBucket(meaning1);

if (bucket1) {
  console.log(`✓ 버킷: ${bucket1.name} (${bucket1.description})`);
  console.log(`  긍정: ${bucket1.positiveValues.join(', ')}`);
  console.log(`  부정: ${bucket1.negativeValues.join(', ')}\n`);

  const peaceSc = calculateBucketScore(meaning1, ['peace']);
  console.log(`  peace: ${formatScore(peaceSc)}점 → ${normalizeBucketScore(peaceSc).toFixed(1)}/100`);

  const healthSc = calculateBucketScore(meaning1, ['health']);
  console.log(`  health: ${formatScore(healthSc)}점 → ${normalizeBucketScore(healthSc).toFixed(1)}/100`);

  const successSc = calculateBucketScore(meaning1, ['success']);
  console.log(`  success: ${formatScore(successSc)}점 → ${normalizeBucketScore(successSc).toFixed(1)}/100`);

  const wealthSc = calculateBucketScore(meaning1, ['wealth']);
  console.log(`  wealth: ${formatScore(wealthSc)}점 → ${normalizeBucketScore(wealthSc).toFixed(1)}/100`);

  const noneSc = calculateBucketScore(meaning1, []);
  console.log(`  가치 없음: ${formatScore(noneSc)}점 → ${normalizeBucketScore(noneSc).toFixed(1)}/100\n`);
}

// Test 2: 빠를 快 (energetic bucket)
console.log('【Test 2】 "빠를" 快');
console.log('─────────────────────────────────');

const meaning2 = '빠를';
const bucket2 = findMatchingBucket(meaning2);

if (bucket2) {
  console.log(`✓ 버킷: ${bucket2.name} (${bucket2.description})`);
  console.log(`  긍정: ${bucket2.positiveValues.join(', ')}`);
  console.log(`  부정: ${bucket2.negativeValues.join(', ')}\n`);

  const successSc = calculateBucketScore(meaning2, ['success']);
  console.log(`  success: ${formatScore(successSc)}점 → ${normalizeBucketScore(successSc).toFixed(1)}/100`);

  const popularitySc = calculateBucketScore(meaning2, ['popularity']);
  console.log(`  popularity: ${formatScore(popularitySc)}점 → ${normalizeBucketScore(popularitySc).toFixed(1)}/100`);

  const peaceSc = calculateBucketScore(meaning2, ['peace']);
  console.log(`  peace: ${formatScore(peaceSc)}점 → ${normalizeBucketScore(peaceSc).toFixed(1)}/100`);

  const noneSc = calculateBucketScore(meaning2, []);
  console.log(`  가치 없음: ${formatScore(noneSc)}점 → ${normalizeBucketScore(noneSc).toFixed(1)}/100\n`);
}

// Test 3: 홀로 獨 (solitary bucket)
console.log('【Test 3】 "홀로" 獨');
console.log('─────────────────────────────────');

const meaning3 = '홀로';
const bucket3 = findMatchingBucket(meaning3);

if (bucket3) {
  console.log(`✓ 버킷: ${bucket3.name} (${bucket3.description})`);
  console.log(`  긍정: ${bucket3.positiveValues.join(', ')}`);
  console.log(`  부정: ${bucket3.negativeValues.join(', ')}\n`);

  const wisdomSc = calculateBucketScore(meaning3, ['wisdom']);
  console.log(`  wisdom: ${formatScore(wisdomSc)}점 → ${normalizeBucketScore(wisdomSc).toFixed(1)}/100`);

  const popularitySc = calculateBucketScore(meaning3, ['popularity']);
  console.log(`  popularity: ${formatScore(popularitySc)}점 → ${normalizeBucketScore(popularitySc).toFixed(1)}/100`);

  const peaceSc = calculateBucketScore(meaning3, ['peace']);
  console.log(`  peace: ${formatScore(peaceSc)}점 → ${normalizeBucketScore(peaceSc).toFixed(1)}/100\n`);
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 전체 버킷 목록');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

MEANING_BUCKETS.forEach((bucket, index) => {
  console.log(`${index + 1}. ${bucket.name.toUpperCase()}: ${bucket.description}`);
  console.log(`   긍정=${bucket.positiveValues.join(',')}, 부정=${bucket.negativeValues.join(',') || '없음'}`);
  console.log(`   base=${formatScore(bucket.baseScore)}, bonus=${formatScore(bucket.positiveBonus)}, penalty=${bucket.negativePenalty}\n`);
});

console.log('✅ 테스트 완료!');
