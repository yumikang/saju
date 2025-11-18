# 🚨 사주 작명 서비스 한자 데이터 보완 및 알고리즘 개선 계획

## 📊 현황 분석 보고서

### 1. 데이터 품질 현황 (2025년 1월 기준)

#### 1.1 한자 데이터베이스 현황
- **총 한자 수**: 8,787개
- **메타데이터 완성률**: 2.2% (192개)
- **메타데이터 누락률**: 97.8% (8,595개)

#### 1.2 핵심 메타데이터 누락 현황
| 필드 | 완성 | 누락 | 누락률 |
|------|------|------|--------|
| 오행(element) | 192개 | 8,595개 | 97.8% |
| 획수(strokes) | 192개 | 8,595개 | 97.8% |
| 음양(yinYang) | - | 8,787개 | 100% |
| 한글읽기 | - | 대량누락 | 추정 80%+ |

#### 1.3 현재 오행 분포 (192개 중)
- 목(木): 44개 (22.9%)
- 화(火): 38개 (19.8%)
- 토(土): 29개 (15.1%)
- 금(金): 38개 (19.8%)
- 수(水): 43개 (22.4%)

### 2. 알고리즘 문제점 분석

#### 2.1 사주 계산 정확성 문제
```typescript
// 현재 문제점: saju-calculator.worker.ts
// Unix timestamp 기반 단순 계산 - 사주명리학적으로 부정확
const totalDays = Math.floor(new Date(year, month - 1, day).getTime() / 86400000);
const ganIndex = totalDays % 10;
```
**문제점**:
- 절기(節氣) 미고려
- 만세력 미적용
- 음력/양력 변환 부재
- 지역 시차 미고려

#### 2.2 용신 판단 로직 단순화
**현재**: 단순히 가장 부족한 오행을 용신으로 선택
**문제점**: 일간 강약, 계절, 조후, 통관 등 전문적 분석 부재

#### 2.3 한자 추천 시스템 제한
- 192개 한자만 사용 가능 → 작명 다양성 극도로 제한
- 오행 균형 맞추기 불가능 (선택지 부족)

## 🎯 개선 목표

### 단기 목표 (1-2주)
1. **데이터 완성도**: 2.2% → 100% (8,787개 한자 모두 메타데이터 보유)
2. **작명 가능 한자**: 192개 → 8,787개 (4,478% 증가)
3. **사주 계산 정확도**: 절기 기반 정확한 계산 시스템 도입

### 중기 목표 (1개월)
1. **용신 분석 고도화**: 전문적 사주명리학 규칙 적용
2. **AI 작명 품질 향상**: 구조화된 프롬프트 + 검증 시스템
3. **성능 최적화**: 대량 데이터 처리 최적화

## 🛠️ 구체적 실행 계획

### Phase 1: 긴급 데이터 보완 (1주차)

#### 1.1 데이터 소스 확보
```typescript
// 신뢰할 수 있는 데이터 소스
const dataSources = {
  unihan: {
    url: 'https://www.unicode.org/charts/unihan.html',
    data: ['획수', '부수', '정의', 'IDS']
  },
  court: {
    source: '대법원 인명용 한자표',
    count: 8142,
    data: ['한글읽기', '획수', '부수']
  },
  traditional: {
    source: '전통 한자 오행 분류표',
    data: ['오행', '음양', '의미']
  }
};
```

#### 1.2 ETL 파이프라인 구축
```bash
# 새로운 ETL 스크립트 생성
scripts/etl/
├── 80_fetch_unihan.ts      # Unicode 데이터 수집
├── 81_merge_court.ts        # 대법원 데이터 병합
├── 82_apply_wuxing.ts       # 오행/음양 적용
├── 83_validate_data.ts      # 데이터 검증
└── 84_update_database.ts    # DB 업데이트
```

#### 1.3 오행 분류 규칙 적용
```typescript
// 부수 기반 오행 자동 분류
const radicalToElement = {
  // 목(木)
  '木': '목', '艸': '목', '竹': '목', '禾': '목', '米': '목',
  
  // 화(火)
  '火': '화', '日': '화', '心': '화', '灬': '화',
  
  // 토(土)
  '土': '토', '石': '토', '山': '토', '阜': '토', '邑': '토',
  
  // 금(金)
  '金': '금', '刀': '금', '戈': '금', '斤': '금',
  
  // 수(水)
  '水': '수', '氵': '수', '雨': '수', '冫': '수'
};
```

### Phase 2: 사주 계산 정확성 개선 (2주차)

#### 2.1 정확한 만세력 시스템 도입
```typescript
// scripts/lib/accurate-saju.ts
import { SolarLunarConverter } from './solar-lunar';
import { Jeolgi } from './jeolgi-calculator';

class AccurateSajuCalculator {
  // 절기 기반 월주 계산
  calculateMonthPillar(date: Date): Pillar {
    const jeolgi = Jeolgi.getJeolgi(date);
    // 입춘, 경칩 등 24절기 기준
    return this.getMonthPillarByJeolgi(jeolgi);
  }
  
  // 정확한 일주 계산 (만세력 데이터 활용)
  calculateDayPillar(date: Date): Pillar {
    // 1900년 1월 1일 기준 계산
    const baseDate = new Date(1900, 0, 1);
    const daysDiff = Math.floor((date - baseDate) / 86400000);
    return this.getDayPillarFromManselyeok(daysDiff);
  }
}
```

#### 2.2 음력/양력 변환기 통합
```typescript
// 한국천문연구원 데이터 기반
const lunarConverter = {
  solarToLunar(year, month, day) {
    // 정확한 음력 변환
  },
  lunarToSolar(year, month, day, isLeapMonth) {
    // 정확한 양력 변환
  }
};
```

### Phase 3: 용신 분석 고도화 (3주차)

#### 3.1 전문적 용신 판단 시스템
```typescript
class YongsinAnalyzer {
  analyze(saju: SajuData): YongsinResult {
    const dayGan = saju.dayGan;
    
    // 1. 일간 강약 판단
    const strength = this.calculateDayGanStrength(saju);
    
    // 2. 계절 고려
    const season = this.getSeason(saju.month);
    
    // 3. 조후 판단 (계절에 따른 조절)
    const johu = this.getJohu(dayGan, season);
    
    // 4. 통관 필요성 검토
    const needsTongwan = this.checkTongwan(saju);
    
    // 5. 종합적 용신 결정
    return {
      primary: this.determinePrimaryYongsin(strength, johu, needsTongwan),
      secondary: this.determineSecondaryYongsin(saju),
      avoid: this.determineGisin(saju)
    };
  }
}
```

### Phase 4: AI 작명 프롬프트 최적화 (4주차)

#### 4.1 구조화된 프롬프트 템플릿
```typescript
const enhancedPrompt = `
## 작명 전문가 역할
40년 경력의 사주명리학 전문가로서 전통과 현대를 아우르는 작명을 수행합니다.

## 분석 데이터
### 사주 원국
- 년주: ${yearPillar} (${yearElement})
- 월주: ${monthPillar} (${monthElement})  
- 일주: ${dayPillar} (${dayElement}) ← 일간(본인)
- 시주: ${hourPillar} (${hourElement})

### 오행 분포
${generateElementChart(elements)}

### 전문 분석
- 일간 강약: ${dayStrength}
- 격국: ${pattern}
- 용신: ${yongsin} (이유: ${yongsinReason})
- 기신: ${gisin}
- 조후: ${johu}

## 작명 규칙 (우선순위)
1. 용신 오행 한자 우선 선택 (40%)
2. 81수리 길수 조합 (30%)
3. 음양 조화 (15%)
4. 의미/발음 (15%)

## 출력 형식
{
  "name": "이름",
  "hanja": "한자",
  "strokes": [획수배열],
  "elements": ["오행배열"],
  "score": {
    "element_balance": 95,
    "sugyo": 90,
    "yinyang": 85,
    "meaning": 92
  },
  "reasoning": "작명 근거"
}
`;
```

## 📅 실행 일정

### Week 1 (데이터 긴급 보완)
- [ ] Day 1-2: Unihan 데이터베이스 크롤링 스크립트 작성
- [ ] Day 3-4: 대법원 인명용 한자 데이터 병합
- [ ] Day 5: 오행/음양 자동 분류 규칙 적용
- [ ] Day 6-7: 데이터 검증 및 DB 업데이트

### Week 2 (사주 계산 정확성)
- [ ] Day 1-2: 절기 계산 모듈 개발
- [ ] Day 3-4: 만세력 데이터 통합
- [ ] Day 5: 음력/양력 변환기 구현
- [ ] Day 6-7: 테스트 및 검증

### Week 3 (용신 분석 고도화)
- [ ] Day 1-2: 일간 강약 판단 로직
- [ ] Day 3-4: 계절/조후 시스템
- [ ] Day 5: 통관 분석 구현
- [ ] Day 6-7: 종합 용신 결정 시스템

### Week 4 (AI 최적화 및 통합)
- [ ] Day 1-2: 프롬프트 템플릿 개선
- [ ] Day 3-4: 응답 검증 시스템
- [ ] Day 5: 전체 시스템 통합 테스트
- [ ] Day 6-7: 성능 최적화 및 배포

## 📊 성과 지표

### 정량적 목표
- 작명 가능 한자: 192개 → 8,787개
- 데이터 완성도: 2.2% → 100%
- 계산 정확도: 추정 60% → 95%+
- 응답 시간: 현재 대비 20% 단축

### 정성적 목표
- 전문성: 실제 작명소 수준의 전문성 확보
- 신뢰도: 계산 근거 투명성 제공
- 사용성: 직관적 UI/UX 개선

## 🚀 즉시 실행 가능한 조치

### 1. 임시 해결책 (당일 적용 가능)
```typescript
// app/lib/temporary-fix.ts
// 현재 사용 가능한 192개 한자 최대한 활용
export async function getAvailableHanja() {
  return await prisma.hanjaDict.findMany({
    where: {
      AND: [
        { element: { not: null } },
        { strokes: { not: null } }
      ]
    }
  });
}
```

### 2. 데이터 보완 스크립트 작성 (1-2일)
```bash
# 즉시 작성 시작
touch scripts/etl/80_fetch_unihan.ts
touch scripts/etl/81_merge_court.ts
touch scripts/etl/82_apply_wuxing.ts
```

### 3. 프로젝트 보드 생성
GitHub Issues 또는 Jira에 각 Phase별 태스크 생성 및 트래킹

## 📝 위험 요소 및 대응 방안

### 위험 요소
1. **데이터 소스 접근성**: 대법원 데이터 접근 제한 가능
   - 대응: 공개된 한자 사전 API 활용
   
2. **오행 분류 정확성**: 자동 분류 시 오류 가능성
   - 대응: 전문가 검수 샘플링 (10% 검증)
   
3. **성능 저하**: 8,787개 한자 처리 시 속도 문제
   - 대응: Redis 캐싱, DB 인덱싱 최적화

## 💰 예상 효과

### 사업적 효과
- **신뢰도 향상**: 2.2% → 100% 데이터로 전문성 확보
- **차별화**: 정확한 사주 계산으로 경쟁력 강화
- **확장성**: 8,787개 한자로 다양한 작명 가능

### 기술적 효과
- **데이터 품질**: 업계 최고 수준 데이터베이스 구축
- **알고리즘 정확도**: 전문 작명소 수준 달성
- **시스템 안정성**: 검증된 데이터로 오류 감소

## 📞 문의사항
- 프로젝트 관리자: [담당자명]
- 기술 문의: [개발팀 연락처]
- 데이터 문의: [데이터팀 연락처]

---
*작성일: 2025년 1월*
*문서 버전: 1.0*