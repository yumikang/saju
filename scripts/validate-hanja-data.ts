#!/usr/bin/env tsx

import { getAllExpandedHanja } from '../app/lib/hanja-expanded-data';
import { getAllHanja } from '../app/lib/hanja-data';
import { validateHanjaData, printValidationReport } from '../app/lib/hanja-enhanced';

console.log('=== 한자 데이터 검증 스크립트 ===\n');

// 1. 확장 데이터 검증
console.log('1. 확장 한자 데이터 검증...');
const expandedData = getAllExpandedHanja();
const expandedReport = validateHanjaData(expandedData, { reportMode: true });
printValidationReport(expandedReport);

// 2. 기본 데이터 검증 (element 필드는 기본 데이터에서 한글로 되어있음)
console.log('\n2. 기본 한자 데이터 검증...');
const baseData = getAllHanja().map(item => ({
  ...item,
  primary_element: item.element // element -> primary_element 매핑
}));
const baseReport = validateHanjaData(baseData, { reportMode: true });
printValidationReport(baseReport);

// 3. 종합 요약
console.log('\n=== 종합 요약 ===');
console.log(`확장 데이터: ${expandedReport.successCount}/${expandedReport.totalProcessed} 성공`);
console.log(`기본 데이터: ${baseReport.successCount}/${baseReport.totalProcessed} 성공`);
console.log(`총 오류: ${expandedReport.errorCount + baseReport.errorCount}건`);

if (expandedReport.errorCount === 0 && baseReport.errorCount === 0) {
  console.log('✅ 모든 데이터가 검증을 통과했습니다!');
} else {
  console.log('❌ 일부 데이터에서 오류가 발견되었습니다.');
}