// AI 기반 사주 작명 엔진 - GPT-4와 전통 작명법의 융합
import type { SajuData, NamingResult } from '@prisma/client';
import { 
  UnifiedHanjaChar, 
  recommendHanjaForSaju, 
  calculateBalance, 
  getStrokeElement,
  getSoundElement,
  elementRelations 
} from './hanja-unified';

// OpenAI 클라이언트 - 조건부 초기화
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  const OpenAI = (await import('openai')).default;
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// 사주 데이터 타입
export interface SajuAnalysis {
  // 사주 기본 정보
  yearGan: string;
  yearJi: string;
  monthGan: string;
  monthJi: string;
  dayGan: string; // 일간 (중심)
  dayJi: string;
  hourGan: string;
  hourJi: string;
  
  // 오행 분석
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  
  // 용신/기신
  yongsin: string; // 용신 (유익한 오행)
  gisin?: string; // 기신 (해로운 오행)
  
  // 부족/과다 오행
  lackingElements: string[];
  excessElements: string[];
}

// 작명 요청 타입
export interface NamingRequest {
  sajuAnalysis: SajuAnalysis;
  lastName: string;
  gender: 'M' | 'F';
  parentPreferences: {
    values: string[]; // ['지혜', '성공', '건강' 등]
    avoidCharacters?: string[]; // 피하고 싶은 글자
    preferredStyle: 'traditional' | 'modern' | 'balanced';
  };
}

// 81수리 길흉 판단 (원격, 형격, 이격)
const SUGYO_81 = {
  길수: [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 38, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81],
  반길반흉: [9, 12, 14, 19, 22, 26, 27, 28, 30, 36, 40, 42, 43, 44, 49, 50, 51, 53, 55, 58, 59, 60, 71, 72, 73, 74, 75, 77, 78, 79, 80],
  흉수: [2, 4, 10, 20, 34, 46, 54, 56, 62, 64, 66, 69, 70, 76]
};

// 획수 길흉 판단
function checkStrokeFortune(totalStrokes: number): '대길' | '길' | '평' | '흉' {
  const mod81 = totalStrokes % 81 || 81;
  
  if (SUGYO_81.길수.includes(mod81)) {
    return totalStrokes <= 20 ? '대길' : '길';
  } else if (SUGYO_81.반길반흉.includes(mod81)) {
    return '평';
  } else {
    return '흉';
  }
}

// 사주 기반 작명 프롬프트 생성
function generateNamingPrompt(request: NamingRequest): string {
  const { sajuAnalysis, lastName, gender, parentPreferences } = request;
  
  return `당신은 40년 경력의 한국 전통 작명 전문가입니다. 사주명리학과 성명학의 깊은 지식을 바탕으로 아기의 운명을 개선할 최적의 이름을 지어주세요.

## 아기 사주 정보
- 일간(본인): ${sajuAnalysis.dayGan}
- 사주팔자: 
  * 년주: ${sajuAnalysis.yearGan}${sajuAnalysis.yearJi}
  * 월주: ${sajuAnalysis.monthGan}${sajuAnalysis.monthJi}
  * 일주: ${sajuAnalysis.dayGan}${sajuAnalysis.dayJi}
  * 시주: ${sajuAnalysis.hourGan}${sajuAnalysis.hourJi}

## 오행 분석
- 목(木): ${sajuAnalysis.elements.wood}개
- 화(火): ${sajuAnalysis.elements.fire}개
- 토(土): ${sajuAnalysis.elements.earth}개
- 금(金): ${sajuAnalysis.elements.metal}개
- 수(水): ${sajuAnalysis.elements.water}개

## 보완이 필요한 부분
- 부족한 오행: ${sajuAnalysis.lackingElements.join(', ')}
- 과다한 오행: ${sajuAnalysis.excessElements.join(', ')}
- 용신(도움되는 오행): ${sajuAnalysis.yongsin}
${sajuAnalysis.gisin ? `- 기신(피해야 할 오행): ${sajuAnalysis.gisin}` : ''}

## 작명 요구사항
- 성씨: ${lastName}
- 성별: ${gender === 'M' ? '남아' : '여아'}
- 부모님 희망 가치: ${parentPreferences.values.join(', ')}
- 스타일: ${parentPreferences.preferredStyle === 'traditional' ? '전통적' : parentPreferences.preferredStyle === 'modern' ? '현대적' : '균형잡힌'}
${parentPreferences.avoidCharacters ? `- 피해야 할 글자: ${parentPreferences.avoidCharacters.join(', ')}` : ''}

## 작명 규칙 (반드시 준수)
1. **오행 보완**: 부족한 오행을 보충하는 한자를 우선 선택
2. **용신 강화**: 용신과 상생하는 오행의 한자 사용
3. **획수 길흉**: 성명 전체 획수가 81수리 중 길수가 되도록 조합
4. **음양 조화**: 음양이 균형을 이루도록 배치
5. **발음**: 부르기 쉽고 듣기 좋은 음향 고려
6. **의미**: 긍정적이고 미래지향적인 의미
7. **시대성**: ${new Date().getFullYear()}년대에 어울리는 이름

다음 형식으로 3개의 이름을 제안해주세요:

### 이름 1: [이름]
- 한자: [한자 표기]
- 획수: [각 글자 획수] (총 XX획)
- 오행: [각 글자의 오행]
- 의미: [상세한 의미 설명]
- 작명 이유: [사주와 연관지어 설명]
- 장점: [이 이름의 강점]

### 이름 2: [이름]
(동일한 형식)

### 이름 3: [이름]
(동일한 형식)

## 추가 조언
부모님께 드리는 양육 조언과 아이의 타고난 성향에 대한 간단한 설명을 추가해주세요.`;
}

// AI 작명 생성 함수
export async function generateAINames(request: NamingRequest): Promise<NamingResult[]> {
  // OpenAI가 설정되지 않은 경우 규칙 기반 작명 사용
  if (!openai) {
    console.log('OpenAI API key not configured, using rule-based naming');
    return generateRuleBasedNames(request);
  }

  try {
    // 1. GPT-4에 작명 요청
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "당신은 한국 전통 사주명리학과 성명학의 대가입니다. 정확한 한자 지식과 오행 이론을 바탕으로 작명합니다."
        },
        {
          role: "user",
          content: generateNamingPrompt(request)
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    
    // 2. AI 응답 파싱 및 검증
    const parsedNames = parseAIResponse(aiResponse, request);
    
    // 3. 전통 규칙으로 재검증 및 점수 계산
    const validatedNames = await validateAndScoreNames(parsedNames, request);
    
    return validatedNames;
  } catch (error) {
    console.error('AI 작명 생성 오류:', error);
    
    // 폴백: 규칙 기반 작명
    return generateRuleBasedNames(request);
  }
}

// AI 응답 파싱
function parseAIResponse(response: string, request: NamingRequest): Partial<NamingResult>[] {
  const names: Partial<NamingResult>[] = [];
  
  // 정규식으로 이름 추출
  const namePattern = /### 이름 \d+: (.+)\n- 한자: (.+)\n- 획수: .+ \(총 (\d+)획\)\n- 오행: (.+)\n- 의미: (.+)\n- 작명 이유: (.+)\n- 장점: (.+)/g;
  
  let match;
  while ((match = namePattern.exec(response)) !== null) {
    const [_, firstName, firstNameHanja, totalStrokes, elements, meaning, reason, advantage] = match;
    
    names.push({
      lastName: request.lastName,
      firstName: firstName.trim(),
      fullName: request.lastName + firstName.trim(),
      firstNameHanja: firstNameHanja.trim(),
      totalStrokes: parseInt(totalStrokes),
      notes: `의미: ${meaning}\n이유: ${reason}\n장점: ${advantage}`,
      generationMethod: 'ai_advanced',
      aiModel: 'gpt-4-turbo',
    });
  }
  
  return names;
}

// 이름 검증 및 점수 계산
async function validateAndScoreNames(
  names: Partial<NamingResult>[], 
  request: NamingRequest
): Promise<NamingResult[]> {
  const validatedNames: NamingResult[] = [];
  
  for (const name of names) {
    if (!name.firstName || !name.firstNameHanja) continue;
    
    // 한자 정보 조회 (실제로는 DB에서)
    const hanjaChars = await getHanjaInfo(name.firstNameHanja);
    
    // 오행 균형 점수 계산
    const balanceScore = calculateElementBalance(hanjaChars, request.sajuAnalysis);
    
    // 음향 점수 계산
    const soundScore = calculateSoundScore(name.firstName);
    
    // 의미 점수 계산
    const meaningScore = calculateMeaningScore(hanjaChars, request.parentPreferences.values);
    
    // 획수 길흉 점수
    const strokeFortune = checkStrokeFortune(name.totalStrokes || 0);
    const strokeScore = strokeFortune === '대길' ? 100 : strokeFortune === '길' ? 80 : strokeFortune === '평' ? 60 : 40;
    
    // 종합 점수
    const overallScore = (balanceScore * 0.3 + soundScore * 0.2 + meaningScore * 0.3 + strokeScore * 0.2);
    
    validatedNames.push({
      ...name,
      balanceScore,
      soundScore,
      meaningScore,
      overallScore,
    } as NamingResult);
  }
  
  // 점수 순으로 정렬
  return validatedNames.sort((a, b) => b.overallScore - a.overallScore);
}

// 오행 균형 점수 계산
function calculateElementBalance(hanjaChars: UnifiedHanjaChar[], sajuAnalysis: SajuAnalysis): number {
  const elementBonus: Record<string, number> = {};
  
  // 부족한 오행에 가중치
  sajuAnalysis.lackingElements.forEach(elem => {
    elementBonus[elem] = 30;
  });
  
  // 용신에 추가 가중치
  elementBonus[sajuAnalysis.yongsin] = (elementBonus[sajuAnalysis.yongsin] || 0) + 20;
  
  let score = 50; // 기본 점수
  
  hanjaChars.forEach(hanja => {
    if (elementBonus[hanja.element]) {
      score += elementBonus[hanja.element] / hanjaChars.length;
    }
    
    // 기신과 상극 관계 체크
    if (sajuAnalysis.gisin && hanja.element === sajuAnalysis.gisin) {
      score -= 10;
    }
  });
  
  return Math.min(100, Math.max(0, score));
}

// 음향 점수 계산
function calculateSoundScore(name: string): number {
  let score = 70; // 기본 점수
  
  // 발음 난이도 체크
  const difficultSounds = ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ'];
  const chars = name.split('');
  
  chars.forEach(char => {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) {
      const consonantIndex = Math.floor(code / 588);
      if (consonantIndex >= 1 && consonantIndex <= 4) { // 된소리
        score -= 5;
      }
    }
  });
  
  // 음의 조화 체크
  if (chars.length === 2) {
    const firstSound = getSoundElement(chars[0]);
    const secondSound = getSoundElement(chars[1]);
    
    // 상생 관계면 가점
    if (elementRelations.상생[firstSound] === secondSound) {
      score += 15;
    }
    // 상극 관계면 감점
    else if (elementRelations.상극[firstSound] === secondSound) {
      score -= 10;
    }
  }
  
  return Math.min(100, Math.max(0, score));
}

// 의미 점수 계산
function calculateMeaningScore(hanjaChars: UnifiedHanjaChar[], preferredValues: string[]): number {
  let score = 60; // 기본 점수
  
  hanjaChars.forEach(hanja => {
    // 선호 가치와 매칭
    const matchingTags = hanja.namingTags.filter(tag => 
      preferredValues.some(value => tag.includes(value) || value.includes(tag))
    );
    
    score += matchingTags.length * 10;
    
    // 길흉에 따른 가점/감점
    if (hanja.fortune === '대길') score += 10;
    else if (hanja.fortune === '길') score += 5;
    else if (hanja.fortune === '흉') score -= 20;
    
    // 인기도 반영
    score += hanja.popularityScore / 20;
  });
  
  return Math.min(100, Math.max(0, score / hanjaChars.length));
}

// 규칙 기반 작명 (폴백)
function generateRuleBasedNames(request: NamingRequest): NamingResult[] {
  // 사주에 맞는 한자 추천
  const recommendedHanja = recommendHanjaForSaju(
    request.sajuAnalysis.lackingElements,
    request.sajuAnalysis.yongsin,
    request.gender,
    request.parentPreferences.values
  );
  
  // 상위 10개 한자로 조합 생성
  const names: NamingResult[] = [];
  
  for (let i = 0; i < Math.min(3, recommendedHanja.length - 1); i++) {
    for (let j = i + 1; j < Math.min(i + 3, recommendedHanja.length); j++) {
      const firstName = recommendedHanja[i].koreanReading + recommendedHanja[j].koreanReading;
      const firstNameHanja = recommendedHanja[i].character + recommendedHanja[j].character;
      const totalStrokes = recommendedHanja[i].strokes + recommendedHanja[j].strokes;
      
      const balanceScore = calculateBalance([recommendedHanja[i], recommendedHanja[j]]);
      const soundScore = calculateSoundScore(firstName);
      const meaningScore = (recommendedHanja[i].popularityScore + recommendedHanja[j].popularityScore) / 2;
      
      names.push({
        lastName: request.lastName,
        firstName,
        fullName: request.lastName + firstName,
        firstNameHanja,
        totalStrokes,
        balanceScore,
        soundScore,
        meaningScore,
        overallScore: (balanceScore * 0.3 + soundScore * 0.2 + meaningScore * 0.5),
        generationMethod: 'ai_basic',
        notes: `${recommendedHanja[i].meaning} + ${recommendedHanja[j].meaning}`,
      } as NamingResult);
    }
  }
  
  return names.sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
}

// 한자 정보 조회 (임시 구현)
async function getHanjaInfo(hanjaString: string): Promise<UnifiedHanjaChar[]> {
  // 실제로는 DB에서 조회
  const { coreHanjaDatabase } = await import('./hanja-unified');
  
  return hanjaString.split('').map(char => 
    coreHanjaDatabase.find(h => h.character === char) || {
      id: 'unknown',
      character: char,
      meaning: '알 수 없음',
      koreanReading: '',
      strokes: 10,
      element: '토' as const,
      yinYang: '음' as const,
      fortune: '평' as const,
      namingTags: [],
      genderPreference: '중성' as const,
      popularityScore: 50,
      nameFrequency: 0,
      trendScore: 50,
      category: [],
      isCommon: false,
      compatibleElements: [],
      incompatibleElements: [],
      recommendedPosition: 'any' as const,
    }
  );
}