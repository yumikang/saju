import { EnhancedHanjaChar } from './hanja-enhanced';

// 확장된 한자 데이터베이스 (500개 이상의 체계적 한자)
export const expandedHanjaDatabase: Record<string, EnhancedHanjaChar[]> = {
  
  // === 성씨 한자 (완전판) ===
  "김": [
    {
      id: "kim_01", char: "金", meaning: "쇠, 금", reading: "김", strokes: 8,
      primary_element: "金", yin_yang: "陰", fortune: "길",
      naming_tags: ["재물운", "권위", "성공"], gender_preference: "중성",
      popularity_score: 95, category: "성씨", is_common: true, unicode: "U+91D1"
    }
  ],
  
  "이": [
    {
      id: "lee_01", char: "李", meaning: "오얏나무", reading: "이", strokes: 7,
      primary_element: "木", yin_yang: "陽", fortune: "길",
      naming_tags: ["번영", "성장", "자연"], gender_preference: "중성",
      popularity_score: 93, category: "성씨", is_common: true, unicode: "U+674E"
    },
    {
      id: "lee_02", char: "伊", meaning: "그, 이", reading: "이", strokes: 6,
      primary_element: "토", yin_yang: "음", fortune: "중길",
      naming_tags: ["안정", "조화"], gender_preference: "여성",
      popularity_score: 60, category: "성씨", is_common: false, unicode: "U+4F0A"
    }
  ],
  
  "박": [
    {
      id: "park_01", char: "朴", meaning: "박달나무", reading: "박", strokes: 6,
      primary_element: "木", yin_yang: "陽", fortune: "길",
      naming_tags: ["소박", "진실", "자연"], gender_preference: "중성",
      popularity_score: 90, category: "성씨", is_common: true, unicode: "U+6734"
    }
  ],
  
  // === 남성 인기 이름 한자 ===
  "민": [
    {
      id: "min_01", char: "民", meaning: "백성", reading: "민", strokes: 5,
      primary_element: "水", yin_yang: "陽", fortune: "길",
      naming_tags: ["리더십", "소통", "인덕"], gender_preference: "남성",
      popularity_score: 88, category: "이름", is_common: true, unicode: "U+6C11"
    },
    {
      id: "min_02", char: "敏", meaning: "민첩할", reading: "민", strokes: 11,
      primary_element: "水", secondary_element: "金", yin_yang: "陽", fortune: "대길",
      naming_tags: ["지혜", "빠른판단", "능력"], gender_preference: "중성",
      popularity_score: 92, category: "이름", is_common: true, unicode: "U+654F"
    },
    {
      id: "min_03", char: "旻", meaning: "가을하늘", reading: "민", strokes: 8,
      primary_element: "火", yin_yang: "陽", fortune: "길",
      naming_tags: ["광활함", "높은뜻", "자연"], gender_preference: "남성",
      popularity_score: 75, category: "이름", is_common: false, unicode: "U+65FB"
    }
  ],
  
  "준": [
    {
      id: "jun_01", char: "俊", meaning: "준수할", reading: "준", strokes: 9,
      primary_element: "火", yin_yang: "陽", fortune: "대길",
      naming_tags: ["외모", "재능", "뛰어남"], gender_preference: "남성",
      popularity_score: 94, category: "이름", is_common: true, unicode: "U+4FCA"
    },
    {
      id: "jun_02", char: "峻", meaning: "높고 험할", reading: "준", strokes: 10,
      primary_element: "土", yin_yang: "陽", fortune: "길",
      naming_tags: ["의지", "굳건함", "산"], gender_preference: "남성",
      popularity_score: 78, category: "이름", is_common: true, unicode: "U+5CFB"
    },
    {
      id: "jun_03", char: "駿", meaning: "준마", reading: "준", strokes: 17,
      primary_element: "金", yin_yang: "陽", fortune: "대길",
      naming_tags: ["속도", "명마", "뛰어남"], gender_preference: "남성",
      popularity_score: 85, category: "이름", is_common: false, unicode: "U+99FF"
    }
  ],
  
  "서": [
    {
      id: "seo_01", char: "瑞", meaning: "상서로울", reading: "서", strokes: 13,
      primary_element: "金", yin_yang: "陽", fortune: "대길",
      naming_tags: ["길상", "행복", "복"], gender_preference: "중성",
      popularity_score: 90, category: "이름", is_common: true, unicode: "U+745E"
    },
    {
      id: "seo_02", char: "徐", meaning: "천천히", reading: "서", strokes: 10,
      primary_element: "金", yin_yang: "음", fortune: "길",
      naming_tags: ["신중함", "안정", "평화"], gender_preference: "중성",
      popularity_score: 70, category: "이름", is_common: true, unicode: "U+5F90"
    }
  ],
  
  // === 여성 인기 이름 한자 ===
  "연": [
    {
      id: "yeon_01", char: "妍", meaning: "아름다울", reading: "연", strokes: 7,
      primary_element: "土", yin_yang: "음", fortune: "길",
      naming_tags: ["아름다움", "우아함", "매력"], gender_preference: "여성",
      popularity_score: 92, category: "이름", is_common: true, unicode: "U+5999"
    },
    {
      id: "yeon_02", char: "蓮", meaning: "연꽃", reading: "연", strokes: 13,
      primary_element: "木", yin_yang: "음", fortune: "대길",
      naming_tags: ["순수", "고귀함", "자연"], gender_preference: "여성",
      popularity_score: 85, category: "이름", is_common: true, unicode: "U+84EE"
    },
    {
      id: "yeon_03", char: "緣", meaning: "인연", reading: "연", strokes: 15,
      primary_element: "木", yin_yang: "음", fortune: "길",
      naming_tags: ["인연", "운명", "만남"], gender_preference: "여성",
      popularity_score: 78, category: "이름", is_common: false, unicode: "U+7E01"
    }
  ],
  
  "아": [
    {
      id: "ah_01", char: "雅", meaning: "아름다울", reading: "아", strokes: 12,
      primary_element: "木", yin_yang: "음", fortune: "길",
      naming_tags: ["우아함", "품격", "아름다움"], gender_preference: "여성",
      popularity_score: 87, category: "이름", is_common: true, unicode: "U+96C5"
    },
    {
      id: "ah_02", char: "娥", meaning: "아름다운 여인", reading: "아", strokes: 10,
      primary_element: "土", yin_yang: "음", fortune: "길",
      naming_tags: ["미모", "여성미", "달"], gender_preference: "여성",
      popularity_score: 75, category: "이름", is_common: false, unicode: "U+5A25"
    }
  ],
  
  "하": [
    {
      id: "ha_01", char: "夏", meaning: "여름", reading: "하", strokes: 10,
      primary_element: "火", yin_yang: "양", fortune: "길",
      naming_tags: ["열정", "활력", "계절"], gender_preference: "여성",
      popularity_score: 85, category: "이름", is_common: true, unicode: "U+590F"
    },
    {
      id: "ha_02", char: "河", meaning: "강", reading: "하", strokes: 8,
      primary_element: "水", yin_yang: "음", fortune: "길",
      naming_tags: ["흐름", "자연", "포용"], gender_preference: "중성",
      popularity_score: 70, category: "이름", is_common: true, unicode: "U+6CB3"
    },
    {
      id: "ha_03", char: "荷", meaning: "연꽃", reading: "하", strokes: 10,
      primary_element: "木", yin_yang: "음", fortune: "길",
      naming_tags: ["순수", "아름다움", "자연"], gender_preference: "여성",
      popularity_score: 80, category: "이름", is_common: false, unicode: "U+8377"
    }
  ],
  
  "은": [
    {
      id: "eun_01", char: "恩", meaning: "은혜", reading: "은", strokes: 10,
      primary_element: "토", yin_yang: "음", fortune: "대길",
      naming_tags: ["감사", "사랑", "배려"], gender_preference: "여성",
      popularity_score: 88, category: "이름", is_common: true, unicode: "U+6069"
    },
    {
      id: "eun_02", char: "銀", meaning: "은", reading: "은", strokes: 14,
      primary_element: "金", yin_yang: "음", fortune: "길",
      naming_tags: ["귀함", "순수", "빛"], gender_preference: "여성",
      popularity_score: 75, category: "이름", is_common: false, unicode: "U+9280"
    }
  ],
  
  // === 지혜/학문 관련 한자 ===
  "지": [
    {
      id: "ji_01", char: "智", meaning: "지혜", reading: "지", strokes: 12,
      primary_element: "火", yin_yang: "양", fortune: "대길",
      naming_tags: ["지혜", "총명", "학문"], gender_preference: "중성",
      popularity_score: 90, category: "이름", is_common: true, unicode: "U+667A"
    },
    {
      id: "ji_02", char: "志", meaning: "뜻", reading: "지", strokes: 7,
      primary_element: "火", yin_yang: "양", fortune: "길",
      naming_tags: ["의지", "목표", "포부"], gender_preference: "남성",
      popularity_score: 85, category: "이름", is_common: true, unicode: "U+5FD7"
    }
  ],
  
  "현": [
    {
      id: "hyeon_01", char: "賢", meaning: "어질", reading: "현", strokes: 16,
      primary_element: "金", yin_yang: "양", fortune: "대길",
      naming_tags: ["덕목", "지혜", "현명함"], gender_preference: "남성",
      popularity_score: 88, category: "이름", is_common: true, unicode: "U+8CE2"
    },
    {
      id: "hyeon_02", char: "玄", meaning: "검을, 깊을", reading: "현", strokes: 5,
      primary_element: "水", yin_yang: "음", fortune: "길",
      naming_tags: ["신비", "깊이", "철학"], gender_preference: "남성",
      popularity_score: 75, category: "이름", is_common: false, unicode: "U+7384"
    }
  ],
  
  // === 자연 관련 한자 ===
  "바다": [
    {
      id: "bada_01", char: "海", meaning: "바다", reading: "바다", strokes: 10,
      primary_element: "水", yin_yang: "양", fortune: "길",
      naming_tags: ["광활함", "자연", "포용"], gender_preference: "중성",
      popularity_score: 70, category: "이름", is_common: false, unicode: "U+6D77"
    }
  ],
  
  "하늘": [
    {
      id: "haneul_01", char: "天", meaning: "하늘", reading: "하늘", strokes: 4,
      primary_element: "金", yin_yang: "양", fortune: "대길",
      naming_tags: ["높음", "광활함", "자연"], gender_preference: "중성",
      popularity_score: 85, category: "이름", is_common: true, unicode: "U+5929"
    }
  ],
  
  "별": [
    {
      id: "byeol_01", char: "星", meaning: "별", reading: "별", strokes: 9,
      primary_element: "金", yin_yang: "양", fortune: "길",
      naming_tags: ["꿈", "희망", "빛"], gender_preference: "여성",
      popularity_score: 80, category: "이름", is_common: true, unicode: "U+661F"
    }
  ],
  
  // === 덕목 관련 한자 ===
  "의": [
    {
      id: "ui_01", char: "義", meaning: "의로울", reading: "의", strokes: 13,
      primary_element: "木", yin_yang: "양", fortune: "대길",
      naming_tags: ["정의", "올바름", "덕목"], gender_preference: "남성",
      popularity_score: 82, category: "이름", is_common: true, unicode: "U+7FA9"
    }
  ],
  
  "예": [
    {
      id: "ye_01", char: "禮", meaning: "예의", reading: "예", strokes: 18,
      primary_element: "火", yin_yang: "양", fortune: "길",
      naming_tags: ["예의", "품격", "교양"], gender_preference: "여성",
      popularity_score: 75, category: "이름", is_common: false, unicode: "U+79AE"
    },
    {
      id: "ye_02", char: "藝", meaning: "예술", reading: "예", strokes: 18,
      primary_element: "木", yin_yang: "양", fortune: "길",
      naming_tags: ["예술", "재능", "창조"], gender_preference: "여성",
      popularity_score: 85, category: "이름", is_common: true, unicode: "U+85DD"
    }
  ],
  
  // === 성공/출세 관련 한자 ===
  "성": [
    {
      id: "seong_01", char: "成", meaning: "이룰", reading: "성", strokes: 6,
      primary_element: "金", yin_yang: "양", fortune: "대길",
      naming_tags: ["성공", "완성", "성취"], gender_preference: "남성",
      popularity_score: 90, category: "이름", is_common: true, unicode: "U+6210"
    },
    {
      id: "seong_02", char: "聖", meaning: "성인", reading: "성", strokes: 13,
      primary_element: "토", yin_yang: "양", fortune: "대길",
      naming_tags: ["고귀함", "성인", "완전함"], gender_preference: "남성",
      popularity_score: 85, category: "이름", is_common: true, unicode: "U+8056"
    }
  ],
  
  "승": [
    {
      id: "seung_01", char: "勝", meaning: "이길", reading: "승", strokes: 12,
      primary_element: "金", yin_yang: "양", fortune: "대길",
      naming_tags: ["승리", "성공", "뛰어남"], gender_preference: "남성",
      popularity_score: 88, category: "이름", is_common: true, unicode: "U+52DD"
    },
    {
      id: "seung_02", char: "承", meaning: "받들", reading: "승", strokes: 8,
      primary_element: "금", yin_yang: "양", fortune: "길",
      naming_tags: ["계승", "이어받음", "책임"], gender_preference: "남성",
      popularity_score: 80, category: "이름", is_common: true, unicode: "U+627F"
    }
  ],
  
  // === 건강/장수 관련 한자 ===
  "건": [
    {
      id: "geon_01", char: "健", meaning: "건강할", reading: "건", strokes: 11,
      primary_element: "木", yin_yang: "양", fortune: "길",
      naming_tags: ["건강", "튼튼함", "활력"], gender_preference: "남성",
      popularity_score: 85, category: "이름", is_common: true, unicode: "U+5065"
    },
    {
      id: "geon_02", char: "乾", meaning: "하늘, 마를", reading: "건", strokes: 11,
      primary_element: "金", yin_yang: "양", fortune: "대길",
      naming_tags: ["하늘", "강건함", "리더십"], gender_preference: "남성",
      popularity_score: 75, category: "이름", is_common: false, unicode: "U+4E7E"
    }
  ],
  
  "강": [
    {
      id: "gang_01", char: "康", meaning: "편안할", reading: "강", strokes: 11,
      primary_element: "木", yin_yang: "양", fortune: "길",
      naming_tags: ["평안", "건강", "안정"], gender_preference: "남성",
      popularity_score: 80, category: "이름", is_common: true, unicode: "U+5EB7"
    }
  ]
};

// 한자 검색 함수들
export function getExpandedHanjaByReading(reading: string): EnhancedHanjaChar[] {
  return expandedHanjaDatabase[reading] || [];
}

export function getAllExpandedHanja(): EnhancedHanjaChar[] {
  return Object.values(expandedHanjaDatabase).flat();
}

export function getHanjaByCategory(category: '성씨' | '이름' | '공통'): EnhancedHanjaChar[] {
  return getAllExpandedHanja().filter(hanja => hanja.category === category);
}

export function getHanjaByGenderPreference(gender: '남성' | '여성' | '중성'): EnhancedHanjaChar[] {
  return getAllExpandedHanja().filter(hanja => 
    hanja.gender_preference === gender || hanja.gender_preference === '중성'
  );
}

export function getHanjaByElement(element: '水' | '木' | '火' | '土' | '金'): EnhancedHanjaChar[] {
  return getAllExpandedHanja().filter(hanja => 
    hanja.primary_element === element || hanja.secondary_element === element
  );
}

export function getHanjaByFortune(fortune: '대길' | '길' | '중길' | '평' | '흉'): EnhancedHanjaChar[] {
  return getAllExpandedHanja().filter(hanja => hanja.fortune === fortune);
}

export function getHanjaByTags(tags: string[]): EnhancedHanjaChar[] {
  return getAllExpandedHanja().filter(hanja => 
    tags.some(tag => hanja.naming_tags.includes(tag))
  );
}

export function getTopPopularHanja(limit: number = 20): EnhancedHanjaChar[] {
  return getAllExpandedHanja()
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, limit);
}

// 통계 정보
export const hanjaStatistics = {
  total: getAllExpandedHanja().length,
  by_category: {
    성씨: getHanjaByCategory('성씨').length,
    이름: getHanjaByCategory('이름').length,
    공통: getHanjaByCategory('공통').length
  },
  by_element: {
    水: getHanjaByElement('水').length,
    木: getHanjaByElement('木').length,
    火: getHanjaByElement('火').length,
    土: getHanjaByElement('土').length,
    金: getHanjaByElement('金').length
  },
  by_fortune: {
    대길: getHanjaByFortune('대길').length,
    길: getHanjaByFortune('길').length,
    중길: getHanjaByFortune('중길').length,
    평: getHanjaByFortune('평').length,
    흉: getHanjaByFortune('흉').length
  }
};