// Web Worker for heavy Saju calculations
import type { SajuAnalysis } from '~/lib/ai-naming.server';

// Message types
interface CalculateSajuMessage {
  type: 'CALCULATE_SAJU';
  payload: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    isLunar: boolean;
  };
}

interface CalculateElementBalanceMessage {
  type: 'CALCULATE_ELEMENT_BALANCE';
  payload: {
    elements: Record<string, number>;
    lackingThreshold: number;
    excessThreshold: number;
  };
}

interface Calculate81FortuneMessage {
  type: 'CALCULATE_81_FORTUNE';
  payload: {
    strokes: number[];
  };
}

type WorkerMessage = 
  | CalculateSajuMessage 
  | CalculateElementBalanceMessage 
  | Calculate81FortuneMessage;

// 천간 (天干)
const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const CHEONGAN_ELEMENTS = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수'
};

// 지지 (地支)
const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const JIJI_ELEMENTS = {
  '자': '수', '축': '토', '인': '목', '묘': '목',
  '진': '토', '사': '화', '오': '화', '미': '토',
  '신': '금', '유': '금', '술': '토', '해': '수'
};

// 60갑자 계산
function calculate60GapJa(year: number): { gan: string; ji: string } {
  const ganIndex = (year - 4) % 10;
  const jiIndex = (year - 4) % 12;
  return {
    gan: CHEONGAN[ganIndex],
    ji: JIJI[jiIndex]
  };
}

// 월주 계산
function calculateMonthPillar(year: number, month: number, day: number): { gan: string; ji: string } {
  // 절기 기준 월 계산 (간단화된 버전)
  const adjustedMonth = month; // 실제로는 절기 기준으로 조정 필요
  
  const yearGan = CHEONGAN[(year - 4) % 10];
  const monthJi = JIJI[(adjustedMonth + 1) % 12];
  
  // 월간 계산 (년간에 따라 결정)
  const monthGanTable: Record<string, string[]> = {
    '갑': ['병', '정', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
    '기': ['병', '정', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
    '을': ['무', '기', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
    '경': ['무', '기', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
    '병': ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
    '신': ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
    '정': ['임', '계', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
    '임': ['임', '계', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
    '무': ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
    '계': ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을']
  };
  
  const monthGan = monthGanTable[yearGan]?.[adjustedMonth - 1] || '갑';
  
  return { gan: monthGan, ji: monthJi };
}

// 일주 계산
function calculateDayPillar(year: number, month: number, day: number): { gan: string; ji: string } {
  // 간단화된 일주 계산 (실제로는 만세력 참조 필요)
  const totalDays = Math.floor(new Date(year, month - 1, day).getTime() / 86400000);
  const ganIndex = totalDays % 10;
  const jiIndex = totalDays % 12;
  
  return {
    gan: CHEONGAN[ganIndex],
    ji: JIJI[jiIndex]
  };
}

// 시주 계산
function calculateHourPillar(dayGan: string, hour: number): { gan: string; ji: string } {
  const hourJi = JIJI[Math.floor((hour + 1) / 2) % 12];
  
  // 시간 계산 테이블
  const hourGanTable: Record<string, string[]> = {
    '갑': ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
    '기': ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
    '을': ['병', '정', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
    '경': ['병', '정', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
    '병': ['무', '기', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
    '신': ['무', '기', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
    '정': ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
    '임': ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
    '무': ['임', '계', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
    '계': ['임', '계', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
  };
  
  const hourGan = hourGanTable[dayGan]?.[Math.floor((hour + 1) / 2) % 12] || '갑';
  
  return { gan: hourGan, ji: hourJi };
}

// 오행 분석
function analyzeElements(
  yearGan: string, yearJi: string,
  monthGan: string, monthJi: string,
  dayGan: string, dayJi: string,
  hourGan: string, hourJi: string
): Record<string, number> {
  const elements: Record<string, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0
  };
  
  // 천간 오행
  elements[CHEONGAN_ELEMENTS[yearGan as keyof typeof CHEONGAN_ELEMENTS]]++;
  elements[CHEONGAN_ELEMENTS[monthGan as keyof typeof CHEONGAN_ELEMENTS]]++;
  elements[CHEONGAN_ELEMENTS[dayGan as keyof typeof CHEONGAN_ELEMENTS]]++;
  elements[CHEONGAN_ELEMENTS[hourGan as keyof typeof CHEONGAN_ELEMENTS]]++;
  
  // 지지 오행
  elements[JIJI_ELEMENTS[yearJi as keyof typeof JIJI_ELEMENTS]]++;
  elements[JIJI_ELEMENTS[monthJi as keyof typeof JIJI_ELEMENTS]]++;
  elements[JIJI_ELEMENTS[dayJi as keyof typeof JIJI_ELEMENTS]]++;
  elements[JIJI_ELEMENTS[hourJi as keyof typeof JIJI_ELEMENTS]]++;
  
  return elements;
}

// 용신 판단 (간단화된 버전)
function determineYongsin(dayGan: string, elements: Record<string, number>): string {
  const dayElement = CHEONGAN_ELEMENTS[dayGan as keyof typeof CHEONGAN_ELEMENTS];
  
  // 일간의 오행에 따른 용신 판단 로직
  const yongsinTable: Record<string, string> = {
    '목': '수', // 목은 수가 생성
    '화': '목', // 화는 목이 생성
    '토': '화', // 토는 화가 생성
    '금': '토', // 금은 토가 생성
    '수': '금'  // 수는 금이 생성
  };
  
  // 가장 부족한 오행을 용신으로 (간단화)
  let minElement = '';
  let minCount = 10;
  
  for (const [elem, count] of Object.entries(elements)) {
    if (count < minCount) {
      minCount = count;
      minElement = elem;
    }
  }
  
  return minElement || yongsinTable[dayElement] || '토';
}

// 81수리 길흉 판단
function calculate81Fortune(strokes: number): { fortune: string; score: number } {
  const mod81 = strokes % 81 || 81;
  
  const SUGYO_81 = {
    길수: [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 38, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81],
    반길반흉: [9, 12, 14, 19, 22, 26, 27, 28, 30, 36, 40, 42, 43, 44, 49, 50, 51, 53, 55, 58, 59, 60, 71, 72, 73, 74, 75, 77, 78, 79, 80],
    흉수: [2, 4, 10, 20, 34, 46, 54, 56, 62, 64, 66, 69, 70, 76]
  };
  
  if (SUGYO_81.길수.includes(mod81)) {
    return { fortune: '대길', score: 90 };
  } else if (SUGYO_81.반길반흉.includes(mod81)) {
    return { fortune: '평', score: 60 };
  } else {
    return { fortune: '흉', score: 30 };
  }
}

// Message handler
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CALCULATE_SAJU': {
      const { year, month, day, hour } = payload;
      
      // 사주 팔자 계산
      const yearPillar = calculate60GapJa(year);
      const monthPillar = calculateMonthPillar(year, month, day);
      const dayPillar = calculateDayPillar(year, month, day);
      const hourPillar = calculateHourPillar(dayPillar.gan, hour);
      
      // 오행 분석
      const elements = analyzeElements(
        yearPillar.gan, yearPillar.ji,
        monthPillar.gan, monthPillar.ji,
        dayPillar.gan, dayPillar.ji,
        hourPillar.gan, hourPillar.ji
      );
      
      // 용신 판단
      const yongsin = determineYongsin(dayPillar.gan, elements);
      
      // 부족/과다 오행
      const lackingElements: string[] = [];
      const excessElements: string[] = [];
      
      Object.entries(elements).forEach(([elem, count]) => {
        if (count === 0) {
          lackingElements.push(elem);
        } else if (count > 3) {
          excessElements.push(elem);
        }
      });
      
      const result: SajuAnalysis = {
        yearGan: yearPillar.gan,
        yearJi: yearPillar.ji,
        monthGan: monthPillar.gan,
        monthJi: monthPillar.ji,
        dayGan: dayPillar.gan,
        dayJi: dayPillar.ji,
        hourGan: hourPillar.gan,
        hourJi: hourPillar.ji,
        elements: {
          wood: elements['목'],
          fire: elements['화'],
          earth: elements['토'],
          metal: elements['금'],
          water: elements['수']
        },
        yongsin,
        lackingElements,
        excessElements
      };
      
      self.postMessage({ type: 'SAJU_CALCULATED', result });
      break;
    }
    
    case 'CALCULATE_ELEMENT_BALANCE': {
      const { elements, lackingThreshold, excessThreshold } = payload;
      
      const values = Object.values(elements);
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = total / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
      
      const balanceScore = Math.max(0, 100 - (variance * 20));
      
      const lacking = Object.entries(elements)
        .filter(([_, count]) => count < lackingThreshold)
        .map(([elem]) => elem);
      
      const excess = Object.entries(elements)
        .filter(([_, count]) => count > excessThreshold)
        .map(([elem]) => elem);
      
      self.postMessage({
        type: 'ELEMENT_BALANCE_CALCULATED',
        result: { balanceScore, lacking, excess }
      });
      break;
    }
    
    case 'CALCULATE_81_FORTUNE': {
      const { strokes } = payload;
      const results = strokes.map(stroke => ({
        stroke,
        ...calculate81Fortune(stroke)
      }));
      
      self.postMessage({
        type: '81_FORTUNE_CALCULATED',
        result: results
      });
      break;
    }
  }
});

// Export for TypeScript
export {};