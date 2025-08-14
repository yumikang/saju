// 작명 평가 시스템 - 전통 성명학 기반 종합 평가
import type { UnifiedHanjaChar } from './hanja-unified';

// 성명학 평가 기준
export interface NamingEvaluation {
  // 원격(元格) - 성명 전체 획수
  wonGyeok: {
    totalStrokes: number;
    fortune: '대길' | '길' | '평' | '흉';
    score: number;
    description: string;
  };
  
  // 형격(亨格) - 성 + 이름 첫 글자
  hyeongGyeok: {
    strokes: number;
    fortune: '대길' | '길' | '평' | '흉';
    score: number;
    description: string;
  };
  
  // 이격(利格) - 이름의 획수
  iGyeok: {
    strokes: number;
    fortune: '대길' | '길' | '평' | '흉';
    score: number;
    description: string;
  };
  
  // 정격(貞格) - 성 + 이름 끝 글자
  jeongGyeok: {
    strokes: number;
    fortune: '대길' | '길' | '평' | '흉';
    score: number;
    description: string;
  };
  
  // 오행 균형
  elementBalance: {
    distribution: Record<string, number>;
    balanceScore: number;
    lackingElements: string[];
    excessElements: string[];
  };
  
  // 음양 조화
  yinYangHarmony: {
    yinCount: number;
    yangCount: number;
    harmonyScore: number;
    pattern: string; // '양음양', '음양음' 등
  };
  
  // 음운 평가
  soundEvaluation: {
    initialConsonants: string[];
    soundFlow: '원활' | '보통' | '부자연스러움';
    score: number;
  };
  
  // 의미 평가
  meaningEvaluation: {
    positiveTraits: string[];
    concernedTraits: string[];
    overallMeaning: string;
    score: number;
  };
  
  // 종합 평가
  overall: {
    totalScore: number; // 0-100
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    recommendation: '강력추천' | '추천' | '보통' | '재고려' | '비추천';
    strengths: string[];
    weaknesses: string[];
    advice: string;
  };
}

// 81수리 상세 해석
const SUGYO_INTERPRETATIONS: Record<number, { fortune: '대길' | '길' | '평' | '흉'; meaning: string }> = {
  1: { fortune: '대길', meaning: '천지개벽, 만물창조의 수. 독립심과 리더십' },
  2: { fortune: '흉', meaning: '분리와 이별의 수. 협력 필요' },
  3: { fortune: '대길', meaning: '천지인 삼재의 수. 창의성과 표현력' },
  4: { fortune: '흉', meaning: '사분오열의 수. 인내심 필요' },
  5: { fortune: '대길', meaning: '오행 조화의 수. 균형과 중용' },
  6: { fortune: '대길', meaning: '육합의 수. 조화와 완성' },
  7: { fortune: '길', meaning: '칠성의 수. 독립과 완벽 추구' },
  8: { fortune: '길', meaning: '팔방의 수. 현실적 성공과 부' },
  9: { fortune: '평', meaning: '구궁의 수. 지혜와 이상' },
  10: { fortune: '흉', meaning: '공허의 수. 극단과 시련' },
  11: { fortune: '대길', meaning: '춘풍의 수. 온화하고 순조로운 발전' },
  13: { fortune: '대길', meaning: '봄날의 수. 인기와 총명함' },
  15: { fortune: '대길', meaning: '대덕의 수. 원만한 인덕과 부귀' },
  16: { fortune: '대길', meaning: '덕망의 수. 귀인의 도움과 성공' },
  17: { fortune: '길', meaning: '권위의 수. 강한 의지와 추진력' },
  18: { fortune: '길', meaning: '철석의 수. 인내와 성취' },
  19: { fortune: '평', meaning: '장애의 수. 재능은 있으나 시련 많음' },
  20: { fortune: '흉', meaning: '공허의 수. 명예는 있으나 실속 없음' },
  21: { fortune: '대길', meaning: '명월의 수. 독립과 권위로 큰 성공' },
  23: { fortune: '대길', meaning: '일출의 수. 왕성한 발전과 성공' },
  24: { fortune: '대길', meaning: '금전의 수. 재물과 가정의 행복' },
  25: { fortune: '길', meaning: '영민의 수. 총명하고 개성적' },
  29: { fortune: '길', meaning: '지모의 수. 지혜와 책략으로 성공' },
  31: { fortune: '대길', meaning: '봄꽃의 수. 지혜와 용기로 큰 성취' },
  32: { fortune: '대길', meaning: '요행의 수. 귀인의 도움으로 성공' },
  33: { fortune: '대길', meaning: '승천의 수. 극강의 성공운' },
  34: { fortune: '흉', meaning: '파멸의 수. 재난과 시련' },
  35: { fortune: '길', meaning: '온화의 수. 평온하고 안정적' },
  37: { fortune: '길', meaning: '충의의 수. 신의와 성실로 성공' },
  38: { fortune: '평', meaning: '예술의 수. 재능은 있으나 현실성 부족' },
  39: { fortune: '길', meaning: '권위의 수. 지도력과 명예' },
  41: { fortune: '대길', meaning: '덕망의 수. 명예와 실리 겸비' },
  45: { fortune: '길', meaning: '순풍의 수. 순조로운 발전' },
  47: { fortune: '대길', meaning: '개화의 수. 행운과 발전' },
  48: { fortune: '길', meaning: '지덕의 수. 지혜로운 참모' },
  52: { fortune: '길', meaning: '선견의 수. 통찰력과 계획성' },
  57: { fortune: '길', meaning: '노력의 수. 꾸준한 노력으로 성공' },
  61: { fortune: '길', meaning: '번영의 수. 명예와 부의 획득' },
  63: { fortune: '길', meaning: '순조의 수. 평안하고 순조로운 삶' },
  65: { fortune: '길', meaning: '장수의 수. 건강과 장수' },
  67: { fortune: '길', meaning: '통솔의 수. 뛰어난 리더십' },
  68: { fortune: '길', meaning: '발명의 수. 창의성과 독창성' },
  81: { fortune: '대길', meaning: '귀환의 수. 완성과 새로운 시작' }
};

// 획수에 따른 길흉 판단
export function evaluateStrokes(strokes: number): { fortune: '대길' | '길' | '평' | '흉'; score: number; description: string } {
  const mod81 = strokes % 81 || 81;
  const interpretation = SUGYO_INTERPRETATIONS[mod81];
  
  if (interpretation) {
    const score = interpretation.fortune === '대길' ? 100 : 
                  interpretation.fortune === '길' ? 80 :
                  interpretation.fortune === '평' ? 60 : 40;
    return {
      fortune: interpretation.fortune,
      score,
      description: interpretation.meaning
    };
  }
  
  // 기본 판단
  if ([1,3,5,6,7,8,11,13,15,16,21,23,24,31,32,33,41,47,48,52,57,61,63,65,67,68,81].includes(mod81)) {
    return { fortune: '대길', score: 90, description: '길한 수로 성공과 행복이 예상됨' };
  } else if ([17,18,25,29,35,37,39,45].includes(mod81)) {
    return { fortune: '길', score: 75, description: '대체로 길한 수로 노력하면 성공 가능' };
  } else if ([9,12,14,19,22,26,27,28,30,36,38,40,42,43,44,49,50,51,53,55,58,59,60,71,72,73,74,75,77,78,79,80].includes(mod81)) {
    return { fortune: '평', score: 60, description: '평범한 수로 노력이 필요함' };
  } else {
    return { fortune: '흉', score: 40, description: '주의가 필요한 수' };
  }
}

// 음양 패턴 분석
export function analyzeYinYangPattern(hanjaList: UnifiedHanjaChar[]): {
  pattern: string;
  harmonyScore: number;
  description: string;
} {
  const pattern = hanjaList.map(h => h.yinYang === '양' ? '양' : '음').join('');
  let harmonyScore = 50;
  let description = '';
  
  // 이상적인 패턴들
  const idealPatterns = ['양음양', '음양음', '양음', '음양'];
  const goodPatterns = ['양양음', '음음양', '양음음', '음양양'];
  const concernPatterns = ['양양양', '음음음'];
  
  if (idealPatterns.includes(pattern)) {
    harmonyScore = 95;
    description = '음양이 완벽하게 조화를 이루는 이상적인 배치';
  } else if (goodPatterns.includes(pattern)) {
    harmonyScore = 80;
    description = '음양 조화가 양호한 배치';
  } else if (concernPatterns.includes(pattern)) {
    harmonyScore = 50;
    description = '음양이 한쪽으로 치우쳐 균형이 필요';
  } else {
    harmonyScore = 70;
    description = '음양 배치가 무난함';
  }
  
  return { pattern, harmonyScore, description };
}

// 음운 흐름 평가
export function evaluateSoundFlow(name: string): {
  initialConsonants: string[];
  soundFlow: '원활' | '보통' | '부자연스러움';
  score: number;
} {
  const consonants = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const initialConsonants: string[] = [];
  
  // 초성 추출
  for (const char of name) {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) {
      const consonantIndex = Math.floor(code / 588);
      initialConsonants.push(consonants[consonantIndex]);
    }
  }
  
  // 음운 흐름 평가
  let score = 80;
  let soundFlow: '원활' | '보통' | '부자연스러움' = '보통';
  
  // 같은 초성 반복 체크
  const hasSameConsonant = initialConsonants.some((c, i) => 
    i > 0 && c === initialConsonants[i - 1]
  );
  
  if (hasSameConsonant) {
    score -= 15;
  }
  
  // 된소리 체크
  const hasHardConsonant = initialConsonants.some(c => 
    ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'].includes(c)
  );
  
  if (hasHardConsonant) {
    score -= 10;
  }
  
  // 부드러운 조합 체크
  const softCombos = [['ㅇ', 'ㅎ'], ['ㅁ', 'ㄴ'], ['ㄹ', 'ㅇ']];
  const hasSoftCombo = softCombos.some(combo => 
    initialConsonants.join('').includes(combo.join(''))
  );
  
  if (hasSoftCombo) {
    score += 10;
  }
  
  if (score >= 85) soundFlow = '원활';
  else if (score >= 70) soundFlow = '보통';
  else soundFlow = '부자연스러움';
  
  return { initialConsonants, soundFlow, score };
}

// 종합 작명 평가 함수
export function evaluateName(
  lastName: string,
  firstName: string,
  lastNameHanja: string,
  firstNameHanja: string,
  hanjaList: UnifiedHanjaChar[],
  sajuLackingElements: string[] = []
): NamingEvaluation {
  // 획수 계산
  const lastNameStrokes = getHanjaStrokes(lastNameHanja);
  const firstNameStrokes = hanjaList.reduce((sum, h) => sum + h.strokes, 0);
  const totalStrokes = lastNameStrokes + firstNameStrokes;
  
  // 각 격 평가
  const wonGyeok = evaluateStrokes(totalStrokes);
  const hyeongGyeok = evaluateStrokes(lastNameStrokes + (hanjaList[0]?.strokes || 0));
  const iGyeok = evaluateStrokes(firstNameStrokes);
  const jeongGyeok = evaluateStrokes(lastNameStrokes + (hanjaList[hanjaList.length - 1]?.strokes || 0));
  
  // 오행 균형 평가
  const elementDistribution: Record<string, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0
  };
  
  hanjaList.forEach(hanja => {
    elementDistribution[hanja.element]++;
    if (hanja.subElement) {
      elementDistribution[hanja.subElement] += 0.5;
    }
  });
  
  const elementValues = Object.values(elementDistribution);
  const elementAvg = elementValues.reduce((a, b) => a + b, 0) / 5;
  const elementVariance = elementValues.reduce((sum, val) => sum + Math.pow(val - elementAvg, 2), 0) / 5;
  const balanceScore = Math.max(0, 100 - (elementVariance * 25));
  
  const lackingElements = Object.entries(elementDistribution)
    .filter(([_, count]) => count === 0)
    .map(([elem]) => elem);
    
  const excessElements = Object.entries(elementDistribution)
    .filter(([_, count]) => count > 2)
    .map(([elem]) => elem);
  
  // 음양 조화 평가
  const yinYangAnalysis = analyzeYinYangPattern(hanjaList);
  const yinCount = hanjaList.filter(h => h.yinYang === '음').length;
  const yangCount = hanjaList.filter(h => h.yinYang === '양').length;
  
  // 음운 평가
  const soundEval = evaluateSoundFlow(firstName);
  
  // 의미 평가
  const positiveTraits = hanjaList.flatMap(h => h.namingTags);
  const uniquePositiveTraits = [...new Set(positiveTraits)];
  const concernedTraits = hanjaList
    .filter(h => h.fortune === '흉' || h.fortune === '평')
    .map(h => h.meaning);
  
  const meaningScore = hanjaList.reduce((sum, h) => {
    const fortuneScore = h.fortune === '대길' ? 30 : h.fortune === '길' ? 20 : h.fortune === '평' ? 10 : 0;
    return sum + fortuneScore + (h.popularityScore / 5);
  }, 0) / hanjaList.length;
  
  // 종합 점수 계산
  const totalScore = (
    wonGyeok.score * 0.25 +
    (hyeongGyeok.score + iGyeok.score + jeongGyeok.score) / 3 * 0.15 +
    balanceScore * 0.20 +
    yinYangAnalysis.harmonyScore * 0.15 +
    soundEval.score * 0.10 +
    meaningScore * 0.15
  );
  
  // 등급 결정
  let grade: 'S' | 'A' | 'B' | 'C' | 'D';
  let recommendation: '강력추천' | '추천' | '보통' | '재고려' | '비추천';
  
  if (totalScore >= 90) {
    grade = 'S';
    recommendation = '강력추천';
  } else if (totalScore >= 80) {
    grade = 'A';
    recommendation = '추천';
  } else if (totalScore >= 70) {
    grade = 'B';
    recommendation = '보통';
  } else if (totalScore >= 60) {
    grade = 'C';
    recommendation = '재고려';
  } else {
    grade = 'D';
    recommendation = '비추천';
  }
  
  // 강점과 약점 분석
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (wonGyeok.fortune === '대길' || wonGyeok.fortune === '길') {
    strengths.push('전체 획수가 길한 수');
  } else {
    weaknesses.push('전체 획수 개선 필요');
  }
  
  if (balanceScore >= 80) {
    strengths.push('오행이 균형잡힘');
  } else if (balanceScore < 60) {
    weaknesses.push('오행 균형 부족');
  }
  
  if (yinYangAnalysis.harmonyScore >= 80) {
    strengths.push('음양 조화 우수');
  }
  
  if (soundEval.soundFlow === '원활') {
    strengths.push('발음이 자연스러움');
  } else if (soundEval.soundFlow === '부자연스러움') {
    weaknesses.push('발음 개선 필요');
  }
  
  if (meaningScore >= 80) {
    strengths.push('의미가 매우 긍정적');
  }
  
  // 사주 보완 체크
  const complementsSaju = sajuLackingElements.some(elem => 
    Object.keys(elementDistribution).includes(elem) && elementDistribution[elem] > 0
  );
  
  if (complementsSaju) {
    strengths.push('사주의 부족한 오행을 보완');
  }
  
  // 조언 생성
  let advice = `${lastName}${firstName}(${lastNameHanja}${firstNameHanja})는 `;
  advice += `전체적으로 ${grade}등급의 ${recommendation} 이름입니다. `;
  
  if (strengths.length > 0) {
    advice += `특히 ${strengths.join(', ')} 등의 장점이 있습니다. `;
  }
  
  if (weaknesses.length > 0) {
    advice += `다만 ${weaknesses.join(', ')} 부분은 고려가 필요합니다. `;
  }
  
  if (totalScore >= 80) {
    advice += '아이의 미래에 좋은 영향을 줄 수 있는 이름으로 판단됩니다.';
  } else if (totalScore >= 70) {
    advice += '무난한 이름이지만 더 나은 대안을 고려해보는 것도 좋겠습니다.';
  } else {
    advice += '다른 이름을 추가로 검토해보시기를 권합니다.';
  }
  
  return {
    wonGyeok: { ...wonGyeok, totalStrokes },
    hyeongGyeok,
    iGyeok,
    jeongGyeok,
    elementBalance: {
      distribution: elementDistribution,
      balanceScore,
      lackingElements,
      excessElements
    },
    yinYangHarmony: {
      yinCount,
      yangCount,
      harmonyScore: yinYangAnalysis.harmonyScore,
      pattern: yinYangAnalysis.pattern
    },
    soundEvaluation: soundEval,
    meaningEvaluation: {
      positiveTraits: uniquePositiveTraits,
      concernedTraits,
      overallMeaning: hanjaList.map(h => h.meaning).join(' + '),
      score: meaningScore
    },
    overall: {
      totalScore: Math.round(totalScore),
      grade,
      recommendation,
      strengths,
      weaknesses,
      advice
    }
  };
}

// 한자 획수 계산 (간단한 매핑)
function getHanjaStrokes(hanja: string): number {
  // 실제로는 DB에서 조회
  const strokeMap: Record<string, number> = {
    '金': 8, '김': 8,
    '李': 7, '이': 7,
    '朴': 6, '박': 6,
    '崔': 11, '최': 11,
    '鄭': 14, '정': 14,
    '姜': 9, '강': 9,
    '趙': 14, '조': 14,
    '尹': 4, '윤': 4,
    '張': 11, '장': 11,
    '林': 8, '임': 8,
    '韓': 17, '한': 17,
    '吳': 7, '오': 7,
    '申': 5, '신': 5,
    '劉': 15, '유': 15,
    '安': 6, '안': 6,
    '宋': 7, '송': 7,
  };
  
  return strokeMap[hanja] || 10; // 기본값
}