// 통합 한자 데이터베이스 - AI 작명에 최적화된 구조
import type { HanjaDict } from '@prisma/client';

// 작명용 한자 인터페이스 (EnhancedHanjaChar의 확장판)
export interface UnifiedHanjaChar {
  id: string;
  character: string;
  meaning: string;
  koreanReading: string;
  chineseReading?: string;
  strokes: number;
  radical?: string;
  
  // 오행/음양 속성 (사주 작명의 핵심)
  element: '목' | '화' | '토' | '금' | '수';
  subElement?: '목' | '화' | '토' | '금' | '수';
  yinYang: '음' | '양';
  
  // 사주 작명 속성
  fortune: '대길' | '길' | '중길' | '평' | '흉';
  namingTags: string[]; // 작명 특성 태그
  genderPreference: '남성' | '여성' | '중성';
  
  // 수리오행 (획수에 따른 오행)
  strokeElement?: '목' | '화' | '토' | '금' | '수';
  
  // 음운오행 (발음에 따른 오행)
  soundElement?: '목' | '화' | '토' | '금' | '수';
  
  // 사용 통계
  popularityScore: number; // 1-100
  nameFrequency: number; // 실제 사용 빈도
  trendScore: number; // 트렌드 점수 (현대적/전통적)
  
  // 카테고리
  category: string[]; // SQLite compatibility - will be joined/split as needed
  isCommon: boolean;
  
  // 작명 규칙 관련
  compatibleElements: string[]; // 상생하는 오행
  incompatibleElements: string[]; // 상극하는 오행
  recommendedPosition: 'first' | 'middle' | 'last' | 'any'; // 추천 위치
  
  // AI 학습용 메타데이터
  semanticVector?: number[]; // 의미 벡터 (AI 임베딩용)
  contextTags?: string[]; // 문맥 태그
  historicalUsage?: string; // 역사적 용례
}

// 획수에 따른 수리오행 계산
export function getStrokeElement(strokes: number): '목' | '화' | '토' | '금' | '수' {
  const mod = strokes % 10;
  switch (mod) {
    case 1:
    case 2:
      return '목';
    case 3:
    case 4:
      return '화';
    case 5:
    case 6:
      return '토';
    case 7:
    case 8:
      return '금';
    case 9:
    case 0:
      return '수';
    default:
      return '토';
  }
}

// 음운오행 계산 (초성 기준)
export function getSoundElement(reading: string): '목' | '화' | '토' | '금' | '수' {
  const firstConsonant = reading.charAt(0);
  const consonantMap: Record<string, '목' | '화' | '토' | '금' | '수'> = {
    'ㄱ': '목', 'ㅋ': '목',
    'ㄴ': '화', 'ㄷ': '화', 'ㅌ': '화', 'ㄹ': '화',
    'ㅁ': '토', 'ㅂ': '토', 'ㅍ': '토',
    'ㅅ': '금', 'ㅈ': '금', 'ㅊ': '금',
    'ㅇ': '수', 'ㅎ': '수'
  };
  
  // 한글 초성 추출
  const code = reading.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return '토';
  
  const consonantIndex = Math.floor(code / 588);
  const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 
                      'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  return consonantMap[consonants[consonantIndex]] || '토';
}

// 오행 상생상극 관계
export const elementRelations = {
  상생: {
    '목': '화',
    '화': '토',
    '토': '금',
    '금': '수',
    '수': '목'
  },
  상극: {
    '목': '토',
    '화': '금',
    '토': '수',
    '금': '목',
    '수': '화'
  }
};

// 사주 작명을 위한 핵심 한자 데이터베이스
export const coreHanjaDatabase: UnifiedHanjaChar[] = [
  // === 긍정적 의미의 대표 한자 (대길) ===
  {
    id: "wisdom_01",
    character: "智",
    meaning: "지혜롭다",
    koreanReading: "지",
    strokes: 12,
    element: "수",
    yinYang: "양",
    fortune: "대길",
    namingTags: ["지혜", "총명", "학업", "리더십"],
    genderPreference: "중성",
    popularityScore: 95,
    nameFrequency: 8500,
    trendScore: 85,
    category: ["wisdom", "virtue"],
    isCommon: true,
    compatibleElements: ["목", "금"],
    incompatibleElements: ["화"],
    recommendedPosition: "any",
  },
  {
    id: "virtue_01",
    character: "仁",
    meaning: "어질다",
    koreanReading: "인",
    strokes: 4,
    element: "목",
    yinYang: "양",
    fortune: "대길",
    namingTags: ["인덕", "자비", "리더십", "품격"],
    genderPreference: "중성",
    popularityScore: 88,
    nameFrequency: 6200,
    trendScore: 75,
    category: ["virtue", "positive"],
    isCommon: true,
    compatibleElements: ["화", "수"],
    incompatibleElements: ["금"],
    recommendedPosition: "first",
  },
  {
    id: "prosperity_01",
    character: "榮",
    meaning: "영화롭다",
    koreanReading: "영",
    strokes: 14,
    element: "목",
    subElement: "화",
    yinYang: "양",
    fortune: "대길",
    namingTags: ["성공", "번영", "명예", "출세"],
    genderPreference: "중성",
    popularityScore: 90,
    nameFrequency: 7800,
    trendScore: 80,
    category: ["success", "positive"],
    isCommon: true,
    compatibleElements: ["화", "수"],
    incompatibleElements: ["금"],
    recommendedPosition: "any",
  },
  
  // === 자연 관련 한자 (길) ===
  {
    id: "nature_01",
    character: "河",
    meaning: "강",
    koreanReading: "하",
    strokes: 8,
    element: "수",
    yinYang: "음",
    fortune: "길",
    namingTags: ["자연", "평화", "유연함", "포용"],
    genderPreference: "중성",
    popularityScore: 92,
    nameFrequency: 9200,
    trendScore: 88,
    category: ["nature", "positive"],
    isCommon: true,
    compatibleElements: ["목", "금"],
    incompatibleElements: ["토"],
    recommendedPosition: "any",
  },
  {
    id: "nature_02",
    character: "星",
    meaning: "별",
    koreanReading: "성",
    strokes: 9,
    element: "화",
    yinYang: "양",
    fortune: "길",
    namingTags: ["희망", "빛", "꿈", "미래"],
    genderPreference: "여성",
    popularityScore: 86,
    nameFrequency: 5500,
    trendScore: 90,
    category: ["nature", "beauty"],
    isCommon: true,
    compatibleElements: ["토", "목"],
    incompatibleElements: ["수"],
    recommendedPosition: "last",
  },
  
  // === 건강/장수 관련 한자 ===
  {
    id: "health_01",
    character: "康",
    meaning: "편안하다",
    koreanReading: "강",
    strokes: 11,
    element: "목",
    yinYang: "양",
    fortune: "길",
    namingTags: ["건강", "평안", "안정", "행복"],
    genderPreference: "남성",
    popularityScore: 84,
    nameFrequency: 4800,
    trendScore: 70,
    category: ["health", "positive"],
    isCommon: true,
    compatibleElements: ["화", "수"],
    incompatibleElements: ["금"],
    recommendedPosition: "middle",
  },
  
  // === 성공/출세 관련 한자 ===
  {
    id: "success_01",
    character: "成",
    meaning: "이루다",
    koreanReading: "성",
    strokes: 6,
    element: "금",
    yinYang: "양",
    fortune: "대길",
    namingTags: ["성공", "성취", "완성", "목표달성"],
    genderPreference: "남성",
    popularityScore: 89,
    nameFrequency: 7200,
    trendScore: 82,
    category: ["success", "positive"],
    isCommon: true,
    compatibleElements: ["수", "토"],
    incompatibleElements: ["화"],
    recommendedPosition: "first",
  }
];

// 사주에 따른 한자 추천 함수
export function recommendHanjaForSaju(
  lackingElements: string[],
  yongsin: string,
  gender: 'M' | 'F',
  preferredTags: string[] = []
): UnifiedHanjaChar[] {
  return coreHanjaDatabase.filter(hanja => {
    // 1. 부족한 오행 보충
    const elementMatch = lackingElements.includes(hanja.element) || 
                         (hanja.subElement && lackingElements.includes(hanja.subElement));
    
    // 2. 용신과의 상생 관계
    const yongsinCompatible = hanja.compatibleElements.includes(yongsin) ||
                             hanja.element === yongsin;
    
    // 3. 성별 적합성
    const genderMatch = hanja.genderPreference === '중성' ||
                       (gender === 'M' && hanja.genderPreference === '남성') ||
                       (gender === 'F' && hanja.genderPreference === '여성');
    
    // 4. 선호 태그 매칭
    const tagMatch = preferredTags.length === 0 ||
                     preferredTags.some(tag => hanja.namingTags.includes(tag));
    
    // 5. 길흉 필터 (평 이상만)
    const fortuneMatch = hanja.fortune !== '흉';
    
    return elementMatch && yongsinCompatible && genderMatch && tagMatch && fortuneMatch;
  }).sort((a, b) => {
    // 인기도와 트렌드 점수로 정렬
    return (b.popularityScore + b.trendScore) - (a.popularityScore + a.trendScore);
  });
}

// 한자 조합의 음양오행 균형 점수 계산
export function calculateBalance(hanjaList: UnifiedHanjaChar[]): number {
  const elementCounts: Record<string, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0
  };
  
  hanjaList.forEach(hanja => {
    elementCounts[hanja.element]++;
    if (hanja.subElement) {
      elementCounts[hanja.subElement] += 0.5;
    }
  });
  
  // 균형 점수 계산 (0-100)
  const values = Object.values(elementCounts);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  
  // 낮은 분산 = 높은 균형
  const balanceScore = Math.max(0, 100 - (variance * 20));
  
  return Math.round(balanceScore);
}

// 전체 한자 데이터를 DB에 마이그레이션하기 위한 변환 함수
export function convertToDBFormat(hanja: UnifiedHanjaChar): Omit<HanjaDict, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    character: hanja.character,
    meaning: hanja.meaning,
    koreanReading: hanja.koreanReading,
    chineseReading: hanja.chineseReading || null,
    strokes: hanja.strokes,
    radical: hanja.radical || null,
    element: hanja.element,
    usageFrequency: Math.round(hanja.popularityScore),
    nameFrequency: hanja.nameFrequency,
    category: hanja.category.join(','), // Convert array to comma-separated string for SQLite
    gender: hanja.genderPreference === '중성' ? null : hanja.genderPreference
  };
}