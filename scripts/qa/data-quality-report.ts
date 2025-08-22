#!/usr/bin/env npx tsx
// 데이터 품질 현황 분석 리포트
// strokes, element, frequency 필드의 null/0 값 통계 생성

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QualityMetrics {
  totalRecords: number;
  strokesNull: number;
  strokesZero: number;
  elementNull: number;
  frequencyZero: number;
  nameFrequencyZero: number;
  usageFrequencyZero: number;
  completeRecords: number;  // 모든 필드가 정상인 레코드
}

interface SurnameMetrics {
  character: string;
  reading: string;
  strokes: number | null;
  element: string | null;
  frequency: number;
  issues: string[];
}

async function generateDataQualityReport() {
  console.log('📊 한자 데이터 품질 분석 리포트\n');
  console.log('=' .repeat(80));
  console.log(`분석 시작: ${new Date().toLocaleString('ko-KR')}\n`);

  try {
    // 1. 전체 통계 수집
    console.log('1️⃣ 전체 데이터 통계');
    console.log('-' .repeat(40));
    
    const totalRecords = await prisma.hanjaDict.count();
    
    const strokesNull = await prisma.hanjaDict.count({
      where: { strokes: null }
    });
    
    const strokesZero = await prisma.hanjaDict.count({
      where: { strokes: 0 }
    });
    
    const elementNull = await prisma.hanjaDict.count({
      where: { element: null }
    });
    
    const nameFrequencyZero = await prisma.hanjaDict.count({
      where: { nameFrequency: 0 }
    });
    
    const usageFrequencyZero = await prisma.hanjaDict.count({
      where: { usageFrequency: 0 }
    });
    
    // 모든 필드가 정상인 레코드
    const completeRecords = await prisma.hanjaDict.count({
      where: {
        AND: [
          { strokes: { not: null } },
          { strokes: { not: 0 } },
          { element: { not: null } },
          { OR: [
            { nameFrequency: { gt: 0 } },
            { usageFrequency: { gt: 0 } }
          ]}
        ]
      }
    });

    const metrics: QualityMetrics = {
      totalRecords,
      strokesNull,
      strokesZero,
      elementNull,
      frequencyZero: 0,  // 계산 예정
      nameFrequencyZero,
      usageFrequencyZero,
      completeRecords
    };

    // 빈도가 둘 다 0인 레코드
    const bothFrequencyZero = await prisma.hanjaDict.count({
      where: {
        AND: [
          { nameFrequency: 0 },
          { usageFrequency: 0 }
        ]
      }
    });
    metrics.frequencyZero = bothFrequencyZero;

    // 통계 출력
    console.log(`총 레코드 수: ${metrics.totalRecords.toLocaleString()}개\n`);
    
    console.log('🔴 문제 있는 데이터:');
    console.log(`  • strokes = NULL: ${metrics.strokesNull}개 (${(metrics.strokesNull/metrics.totalRecords*100).toFixed(1)}%)`);
    console.log(`  • strokes = 0: ${metrics.strokesZero}개 (${(metrics.strokesZero/metrics.totalRecords*100).toFixed(1)}%)`);
    console.log(`  • element = NULL: ${metrics.elementNull}개 (${(metrics.elementNull/metrics.totalRecords*100).toFixed(1)}%)`);
    console.log(`  • nameFrequency = 0: ${metrics.nameFrequencyZero}개 (${(metrics.nameFrequencyZero/metrics.totalRecords*100).toFixed(1)}%)`);
    console.log(`  • usageFrequency = 0: ${metrics.usageFrequencyZero}개 (${(metrics.usageFrequencyZero/metrics.totalRecords*100).toFixed(1)}%)`);
    console.log(`  • 모든 frequency = 0: ${metrics.frequencyZero}개 (${(metrics.frequencyZero/metrics.totalRecords*100).toFixed(1)}%)`);
    
    console.log('\n🟢 정상 데이터:');
    console.log(`  • 완전한 레코드: ${metrics.completeRecords}개 (${(metrics.completeRecords/metrics.totalRecords*100).toFixed(1)}%)`);

    // 2. 핵심 성씨 30자 분석
    console.log('\n2️⃣ 핵심 성씨 30자 품질 분석');
    console.log('-' .repeat(40));
    
    const essentialSurnames = [
      '金', '李', '朴', '崔', '鄭', '姜', '趙', '尹', '張', '林',
      '韓', '吳', '申', '徐', '權', '黃', '安', '宋', '柳', '洪',
      '高', '文', '梁', '孫', '白', '曺', '許', '千', '劉', '全'
    ];

    const surnameIssues: SurnameMetrics[] = [];
    
    for (const surname of essentialSurnames) {
      const hanja = await prisma.hanjaDict.findFirst({
        where: { character: surname }
      });

      if (!hanja) {
        console.log(`  ❌ ${surname}: 데이터 없음`);
        continue;
      }

      const issues: string[] = [];
      if (!hanja.strokes || hanja.strokes === 0) issues.push('획수');
      if (!hanja.element) issues.push('오행');
      if (hanja.nameFrequency === 0 && hanja.usageFrequency === 0) issues.push('빈도');

      if (issues.length > 0) {
        surnameIssues.push({
          character: surname,
          reading: hanja.koreanReading || '',
          strokes: hanja.strokes,
          element: hanja.element,
          frequency: (hanja.nameFrequency || 0) + (hanja.usageFrequency || 0),
          issues
        });
      }
    }

    if (surnameIssues.length > 0) {
      console.log('\n  문제 있는 성씨:');
      surnameIssues.forEach(s => {
        console.log(`  • ${s.character}(${s.reading}): ${s.issues.join(', ')} 문제`);
        console.log(`    - strokes: ${s.strokes}, element: ${s.element}, freq: ${s.frequency}`);
      });
    } else {
      console.log('  ✅ 모든 핵심 성씨 데이터 정상');
    }

    // 3. 샘플 데이터 확인
    console.log('\n3️⃣ 문제 데이터 샘플 (각 5개)');
    console.log('-' .repeat(40));
    
    // strokes = 0인 샘플
    const strokesZeroSamples = await prisma.hanjaDict.findMany({
      where: { strokes: 0 },
      take: 5
    });
    
    if (strokesZeroSamples.length > 0) {
      console.log('\n📌 strokes = 0 샘플:');
      strokesZeroSamples.forEach(h => {
        console.log(`  ${h.character}(${h.koreanReading}): strokes=${h.strokes}, element=${h.element}`);
      });
    }

    // element = null인 샘플
    const elementNullSamples = await prisma.hanjaDict.findMany({
      where: { element: null },
      take: 5
    });
    
    if (elementNullSamples.length > 0) {
      console.log('\n📌 element = NULL 샘플:');
      elementNullSamples.forEach(h => {
        console.log(`  ${h.character}(${h.koreanReading}): strokes=${h.strokes}, element=${h.element}`);
      });
    }

    // frequency가 모두 0인 샘플
    const freqZeroSamples = await prisma.hanjaDict.findMany({
      where: {
        AND: [
          { nameFrequency: 0 },
          { usageFrequency: 0 }
        ]
      },
      take: 5
    });
    
    if (freqZeroSamples.length > 0) {
      console.log('\n📌 모든 frequency = 0 샘플:');
      freqZeroSamples.forEach(h => {
        console.log(`  ${h.character}(${h.koreanReading}): name=${h.nameFrequency}, usage=${h.usageFrequency}`);
      });
    }

    // 4. 개선 제안
    console.log('\n4️⃣ 개선 제안');
    console.log('-' .repeat(40));
    
    const strokesIssueRate = ((metrics.strokesNull + metrics.strokesZero) / metrics.totalRecords * 100);
    const elementIssueRate = (metrics.elementNull / metrics.totalRecords * 100);
    const frequencyIssueRate = (metrics.frequencyZero / metrics.totalRecords * 100);

    console.log('\n🎯 우선순위:');
    
    const priorities = [
      { name: '획수 문제', rate: strokesIssueRate, threshold: 2 },
      { name: '오행 문제', rate: elementIssueRate, threshold: 5 },
      { name: '빈도 문제', rate: frequencyIssueRate, threshold: 10 }
    ].sort((a, b) => b.rate - a.rate);

    priorities.forEach((p, idx) => {
      const status = p.rate < p.threshold ? '✅' : '⚠️';
      console.log(`  ${idx + 1}. ${p.name}: ${p.rate.toFixed(1)}% ${status} (목표: <${p.threshold}%)`);
    });

    console.log('\n💡 권장 조치:');
    if (strokesIssueRate > 2) {
      console.log('  • 획수: ETL 단계에서 Unihan kTotalStrokes 데이터로 백필');
    }
    if (elementIssueRate > 5) {
      console.log('  • 오행: 부수 기반 매핑 테이블 + 음운 휴리스틱 적용');
    }
    if (frequencyIssueRate > 10) {
      console.log('  • 빈도: Laplace smoothing (count + 1) 적용');
    }

    // 5. 품질 점수 계산
    const qualityScore = (metrics.completeRecords / metrics.totalRecords * 100);
    const grade = qualityScore >= 95 ? 'A+' : 
                  qualityScore >= 90 ? 'A' :
                  qualityScore >= 80 ? 'B' :
                  qualityScore >= 70 ? 'C' :
                  qualityScore >= 60 ? 'D' : 'F';

    console.log('\n' + '=' .repeat(80));
    console.log(`\n📈 데이터 품질 점수: ${qualityScore.toFixed(1)}% (${grade})`);
    console.log(`분석 완료: ${new Date().toLocaleString('ko-KR')}\n`);

  } catch (error) {
    console.error('❌ 분석 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
generateDataQualityReport().catch(console.error);