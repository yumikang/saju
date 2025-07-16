// 강화된 한자 데이터베이스 구조
export interface EnhancedHanjaChar {
  id: string; // 고유 식별자
  char: string; // 한자
  meaning: string; // 의미
  reading: string; // 훈음
  strokes: number; // 획수
  
  // 오행/음양 속성
  primary_element: '水' | '木' | '火' | '土' | '金'; // 주 오행
  secondary_element?: '水' | '木' | '火' | '土' | '金'; // 부 오행
  yin_yang: '陰' | '陽'; // 음양
  
  // 작명 속성
  fortune: '대길' | '길' | '중길' | '평' | '흉'; // 길흉
  naming_tags: string[]; // ['재물운', '건강운', '지혜', '리더십']
  gender_preference: '남성' | '여성' | '중성'; // 성별 선호도
  
  // 사용 통계
  popularity_score: number; // 인기도 (1-100)
  frequency_rank?: number; // 사용 빈도 순위
  age_preference: '전체' | '현대적' | '전통적'; // 연령대 선호
  
  // 메타데이터
  category: '성씨' | '이름' | '공통'; // 카테고리
  is_common: boolean; // 흔한 한자 여부
  unicode: string; // 유니코드
}

// 성별/연령별 인기 한자 데이터
export const popularHanjaByCategory = {
  // 남성 인기 한자 (2020년대 기준)
  male_popular: [
    '민', '서', '준', '도', '하', '유', '주', '윤', '건', '현', 
    '성', '진', '우', '호', '영', '수', '태', '경', '원', '환'
  ],
  
  // 여성 인기 한자 (2020년대 기준)
  female_popular: [
    '서', '연', '윤', '하', '예', '지', '수', '아', '은', '혜', 
    '나', '유', '채', '민', '소', '다', '희', '영', '현', '빈'
  ],
  
  // 전통적 남성 한자
  traditional_male: [
    '용', '철', '석', '영', '호', '진', '성', '건', '규', '범', 
    '승', '찬', '혁', '완', '환', '원', '태', '경', '훈', '림'
  ],
  
  // 전통적 여성 한자
  traditional_female: [
    '순', '영', '자', '숙', '희', '정', '미', '경', '혜', '은', 
    '옥', '복', '화', '춘', '월', '향', '란', '매', '귀', '선'
  ],
  
  // 현대적 중성 한자
  modern_unisex: [
    '하늘', '바다', '별', '달', '해', '구름', '바람', '이슬', '샘', 
    '들', '강', '산', '꽃', '나무', '돌', '빛', '소리', '마음', '꿈', '희망'
  ]
};

// 의미별 한자 분류
export const hanjaByMeaning = {
  // 자연 관련
  nature: ['강', '산', '하', '바다', '하늘', '별', '달', '해', '구름', '바람'],
  
  // 덕목 관련  
  virtue: ['정', '의', '예', '지', '신', '충', '효', '인', '용', '겸'],
  
  // 성공/출세 관련
  success: ['성', '공', '달', '승', '왕', '패', '우', '최', '일', '원'],
  
  // 지혜/학문 관련
  wisdom: ['지', '혜', '현', '철', '학', '문', '예', '재', '능', '슬'],
  
  // 아름다움 관련
  beauty: ['미', '려', '아', '예', '화', '영', '빛', '찬', '환', '휘'],
  
  // 건강/장수 관련  
  health: ['건', '강', '수', '복', '안', '평', '태', '온', '화', '순'],
  
  // 부/재물 관련
  wealth: ['부', '귀', '금', '은', '보', '재', '복', '흥', '창', '융']
};

// 오행별 한자 분류 (더 체계적)
export const hanjaByElement = {
  '水': {
    primary: ['수', '강', '하', '바다', '샘', '호', '담', '빙', '설', '우'],
    secondary: ['혜', '윤', '민', '범', '현', '문', '한', '홍', '희', '은']
  },
  '木': {
    primary: ['나무', '숲', '림', '송', '죽', '매', '란', '국', '봄', '청'],
    secondary: ['동', '인', '갑', '을', '각', '건', '현', '경', '영', '규']
  },
  '火': {
    primary: ['불', '빛', '찬', '휘', '태양', '여름', '적', '단', '주', '화'],
    secondary: ['정', '장', '진', '지', '예', '련', '영', '광', '명', '정']
  },
  '土': {
    primary: ['땅', '산', '석', '토', '흙', '황', '중', '균', '안', '정'],
    secondary: ['성', '완', '용', '기', '무', '기', '신', '술', '축', '미']
  },
  '金': {
    primary: ['금', '은', '철', '동', '백', '서', '가을', '신', '유', '경'],
    secondary: ['성', '승', '청', '소', '상', '숙', '순', '신', '실', '심']
  }
};

// 길흉 판정 기준
export const fortuneClassification = {
  '대길': { 
    range: [90, 100], 
    description: '매우 길한 한자',
    characteristics: ['왕성한 기운', '큰 성공', '리더십', '창조력']
  },
  '길': { 
    range: [75, 89], 
    description: '길한 한자',
    characteristics: ['안정적 성장', '조화', '균형', '평안']
  },
  '중길': { 
    range: [60, 74], 
    description: '보통 수준의 길한 한자',
    characteristics: ['꾸준한 발전', '성실', '노력', '인내']
  },
  '평': { 
    range: [40, 59], 
    description: '평범한 한자',
    characteristics: ['무난함', '안정', '평범', '보통']
  },
  '흉': { 
    range: [0, 39], 
    description: '피해야 할 한자',
    characteristics: ['불안정', '시련', '고난', '장애']
  }
};

// 한자 점수화 시스템
export function calculateHanjaScore(hanja: EnhancedHanjaChar): number {
  let score = 50; // 기본 점수
  
  // 오행 조화 점수 (20점)
  if (hanja.primary_element && hanja.secondary_element) {
    score += 10; // 오행이 완전한 경우
  }
  
  // 길흉 점수 (30점)
  const fortunePoints = {
    '대길': 30, '길': 20, '중길': 10, '평': 0, '흉': -20
  };
  score += fortunePoints[hanja.fortune];
  
  // 인기도 점수 (20점)
  score += (hanja.popularity_score / 100) * 20;
  
  // 의미의 품격 점수 (20점)
  const positiveKeywords = ['지혜', '성공', '건강', '아름다움', '덕목'];
  const meaningScore = hanja.naming_tags.filter(tag => 
    positiveKeywords.some(keyword => tag.includes(keyword))
  ).length * 5;
  score += Math.min(meaningScore, 20);
  
  // 사용 빈도 점수 (10점)
  if (hanja.frequency_rank) {
    const frequencyScore = Math.max(0, 10 - (hanja.frequency_rank / 100));
    score += frequencyScore;
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

// 성별 맞춤 한자 추천
export function getHanjaByGender(gender: 'M' | 'F', style: '현대적' | '전통적' = '현대적'): string[] {
  if (gender === 'M') {
    return style === '현대적' ? popularHanjaByCategory.male_popular : popularHanjaByCategory.traditional_male;
  } else {
    return style === '현대적' ? popularHanjaByCategory.female_popular : popularHanjaByCategory.traditional_female;
  }
}

// 의미별 한자 추천
export function getHanjaByDesiredMeaning(meanings: string[]): string[] {
  const result = new Set<string>();
  
  meanings.forEach(meaning => {
    const category = Object.keys(hanjaByMeaning).find(key => 
      key.includes(meaning.toLowerCase()) || 
      hanjaByMeaning[key as keyof typeof hanjaByMeaning].some(h => h.includes(meaning))
    );
    
    if (category) {
      hanjaByMeaning[category as keyof typeof hanjaByMeaning].forEach(h => result.add(h));
    }
  });
  
  return Array.from(result);
}

// 오행 보완 한자 추천
export function getComplementaryHanja(lackingElements: string[]): string[] {
  const result = new Set<string>();
  
  lackingElements.forEach(element => {
    if (element in hanjaByElement) {
      const elementData = hanjaByElement[element as keyof typeof hanjaByElement];
      [...elementData.primary, ...elementData.secondary].forEach(h => result.add(h));
    }
  });
  
  return Array.from(result);
}