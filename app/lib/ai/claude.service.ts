/**
 * Claude AI Service
 *
 * Anthropic Claude API wrapper for Korean naming service
 *
 * Key Features:
 * - Yongsin (용신) analysis using 5 traditional methods
 * - Hanja semantic matching for names
 * - Name interpretation and meaning generation
 * - Traditional Korean naming philosophy with AI assistance
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Element } from '@prisma/client';

// Claude API client - lazy initialization
let claude: Anthropic | null = null;
let claudeInitialized = false;

async function getClaude(): Promise<Anthropic | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY not configured');
    return null;
  }

  if (!claudeInitialized) {
    claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    claudeInitialized = true;
  }

  return claude;
}

/**
 * Yongsin Analysis Request
 */
export interface YongsinAnalysisRequest {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  isLunar: boolean;
  gender: 'M' | 'F';

  // Saju pillars (년월일시)
  pillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };

  // Day master (일간)
  dayMaster: {
    stem: string;
    element: Element;
  };

  // Element counts
  elementCounts: Record<Element, number>;
}

/**
 * Yongsin Analysis Result
 *
 * Uses 5 traditional methods:
 * 1. 扶抑法 (Fu-Yi): Support weak, suppress strong
 * 2. 調候法 (Tiao-Hou): Seasonal adjustment
 * 3. 通關法 (Tong-Guan): Mediation between conflicting elements
 * 4. 從格法 (Cong-Ge): Following the strong
 * 5. 化氣法 (Hua-Qi): Transformation pattern
 */
export interface YongsinAnalysisResult {
  // Primary Yongsin (용신)
  primary: {
    element: Element;
    method: '扶抑法' | '調候法' | '通關法' | '從格法' | '化氣法';
    confidence: number; // 0-100
    reasoning: string;
  };

  // Secondary Yongsin (희신)
  secondary?: {
    element: Element;
    reasoning: string;
  };

  // Elements to avoid (기신)
  avoid: Element[];

  // Day master strength analysis
  dayMasterStrength: {
    score: number; // -100 to +100 (negative = weak, positive = strong)
    category: '극약' | '약' | '중화' | '강' | '극강';
    explanation: string;
  };

  // Seasonal context (조후)
  seasonalContext: {
    season: '봄' | '여름' | '가을' | '겨울';
    temperatureNeed: '온난' | '한냉' | '중화';
    adjustment: string;
  };

  // Full analysis text
  fullAnalysis: string;
}

/**
 * Hanja Semantic Matching Request
 */
export interface HanjaSemanticRequest {
  targetMeaning: string; // e.g., "지혜롭다", "성공"
  existingHanja: string[]; // Already selected hanja
  yongsinElement: Element; // Preferred element
  gender: 'M' | 'F';
  style: 'traditional' | 'modern' | 'balanced';
}

/**
 * Hanja Semantic Match Result
 */
export interface HanjaSemanticMatch {
  character: string;
  meaning: string;
  detailedMeaning: string;
  element: Element;
  strokes: number;
  semanticScore: number; // 0-100 (how well it matches targetMeaning)
  reasoning: string;
  culturalContext: string;
  exampleNames: string[];
}

/**
 * Name Interpretation Request
 */
export interface NameInterpretationRequest {
  fullName: string;
  hanja: string;
  gender: 'M' | 'F';
  sajuContext?: YongsinAnalysisRequest;
}

/**
 * Name Interpretation Result
 */
export interface NameInterpretationResult {
  overallMeaning: string;
  characterBreakdown: Array<{
    character: string;
    meaning: string;
    culturalSignificance: string;
    element: Element;
  }>;
  elementalHarmony: string;
  yinYangBalance: string;
  soundAnalysis: string;
  culturalImplications: string;
  modernRelevance: string;
  parentalGuidance: string;
}

/**
 * Claude AI Service
 */
export class ClaudeAIService {
  /**
   * Analyze Yongsin (용신) using 5 traditional methods
   *
   * This is the most critical function for Korean naming.
   * It determines which element will benefit the person's life path.
   */
  async analyzeYongsin(request: YongsinAnalysisRequest): Promise<YongsinAnalysisResult | null> {
    const client = await getClaude();
    if (!client) return null;

    const prompt = this.buildYongsinPrompt(request);

    try {
      const message = await client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 4000,
        temperature: 0.3, // Low temperature for consistency
        system: this.getYongsinSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      return this.parseYongsinResponse(responseText, request);
    } catch (error) {
      console.error('❌ Claude Yongsin analysis failed:', error);
      return null;
    }
  }

  /**
   * Find semantically matching Hanja characters
   */
  async findMatchingHanja(request: HanjaSemanticRequest): Promise<HanjaSemanticMatch[]> {
    const client = await getClaude();
    if (!client) return [];

    const prompt = this.buildHanjaMatchingPrompt(request);

    try {
      const message = await client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 3000,
        temperature: 0.5,
        system: this.getHanjaMatchingSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      return this.parseHanjaMatches(responseText);
    } catch (error) {
      console.error('❌ Claude Hanja matching failed:', error);
      return [];
    }
  }

  /**
   * Interpret a name's meaning and cultural significance
   */
  async interpretName(request: NameInterpretationRequest): Promise<NameInterpretationResult | null> {
    const client = await getClaude();
    if (!client) return null;

    const prompt = this.buildNameInterpretationPrompt(request);

    try {
      const message = await client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 3000,
        temperature: 0.7, // Higher creativity for interpretation
        system: this.getNameInterpretationSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      return this.parseNameInterpretation(responseText);
    } catch (error) {
      console.error('❌ Claude name interpretation failed:', error);
      return null;
    }
  }

  // ===== PRIVATE METHODS =====

  /**
   * System prompt for Yongsin analysis
   */
  private getYongsinSystemPrompt(): string {
    return `You are a master of Korean Saju-myeongri (사주명리학) with 40 years of experience.

Your specialty is determining Yongsin (용신 - "useful god"), the element that will benefit a person's destiny.

You MUST use the 5 traditional methods rigorously:

1. **扶抑法 (Fu-Yi Method)**: Support weak day master, suppress strong day master
2. **調候法 (Tiao-Hou Method)**: Adjust based on birth season (cold/hot balance)
3. **通關法 (Tong-Guan Method)**: Mediate between conflicting elements (e.g., Metal vs Wood → use Water)
4. **從格法 (Cong-Ge Method)**: When extremely imbalanced, follow the dominant force
5. **化氣法 (Hua-Qi Method)**: Special transformation patterns (e.g., 甲己合化土)

Always respond in JSON format with Korean explanations.
Be precise, methodical, and cite the specific method you're using.
Never guess - if uncertain, explain why and provide your best analysis with caveats.`;
  }

  /**
   * System prompt for Hanja semantic matching
   */
  private getHanjaMatchingSystemPrompt(): string {
    return `You are an expert in Korean Hanja (한자) with deep knowledge of:
- Classical Chinese character meanings and etymology
- Korean cultural interpretations of Hanja
- Naming conventions and traditions (작명학)
- Element theory (오행론) in the context of names

When matching Hanja to desired meanings:
- Consider both literal and cultural/poetic interpretations
- Account for gender appropriateness
- Respect traditional vs modern style preferences
- Ensure characters work harmoniously together
- Always provide element (오행) classification

Respond in JSON format with Korean explanations.`;
  }

  /**
   * System prompt for name interpretation
   */
  private getNameInterpretationSystemPrompt(): string {
    return `You are a Korean naming master (작명가) specializing in explaining the deeper meaning and significance of names.

Your interpretations should:
- Analyze each Hanja character's meaning and cultural significance
- Explain how characters work together (조화)
- Discuss elemental harmony (오행 조화)
- Comment on yin-yang balance (음양 균형)
- Analyze sound and rhythm (음운)
- Provide parental guidance on nurturing the child's destiny

Write in warm, encouraging Korean that helps parents connect with their child's name.
Be poetic yet practical, traditional yet modern.`;
  }

  /**
   * Build Yongsin analysis prompt
   */
  private buildYongsinPrompt(request: YongsinAnalysisRequest): string {
    const { pillars, dayMaster, elementCounts, birthYear, birthMonth } = request;

    // Determine season
    const season = [12, 1, 2].includes(birthMonth)
      ? '겨울'
      : [3, 4, 5].includes(birthMonth)
      ? '봄'
      : [6, 7, 8].includes(birthMonth)
      ? '여름'
      : '가을';

    return `다음 사주의 용신을 5가지 전통 방법으로 분석해주세요.

## 사주팔자
- 년주: ${pillars.year.stem}${pillars.year.branch}
- 월주: ${pillars.month.stem}${pillars.month.branch}
- 일주: ${pillars.day.stem}${pillars.day.branch} (일간: ${dayMaster.stem}, 오행: ${dayMaster.element})
- 시주: ${pillars.hour.stem}${pillars.hour.branch}

## 오행 분포
- 木: ${elementCounts.WOOD}개
- 火: ${elementCounts.FIRE}개
- 土: ${elementCounts.EARTH}개
- 金: ${elementCounts.METAL}개
- 水: ${elementCounts.WATER}개

## 출생 정보
- 계절: ${season}
- 년도: ${birthYear}년
- 월: ${birthMonth}월

## 분석 요구사항

다음 JSON 형식으로 응답하세요:

\`\`\`json
{
  "primary": {
    "element": "WOOD|FIRE|EARTH|METAL|WATER",
    "method": "扶抑法|調候法|通關法|從格法|化氣法",
    "confidence": 85,
    "reasoning": "상세한 이유..."
  },
  "secondary": {
    "element": "WOOD|FIRE|EARTH|METAL|WATER",
    "reasoning": "보조 용신 설명..."
  },
  "avoid": ["ELEMENT1", "ELEMENT2"],
  "dayMasterStrength": {
    "score": 45,
    "category": "중화",
    "explanation": "일간 강약 분석..."
  },
  "seasonalContext": {
    "season": "${season}",
    "temperatureNeed": "온난|한냉|중화",
    "adjustment": "계절 조후 설명..."
  },
  "fullAnalysis": "종합 분석 내용..."
}
\`\`\`

**중요**: 반드시 5가지 방법을 모두 검토하고, 가장 적합한 방법을 선택한 이유를 명확히 설명하세요.`;
  }

  /**
   * Build Hanja matching prompt
   */
  private buildHanjaMatchingPrompt(request: HanjaSemanticRequest): string {
    return `다음 조건에 맞는 한자 5개를 추천해주세요.

## 요구사항
- 의미: ${request.targetMeaning}
- 선호 오행: ${request.yongsinElement}
- 성별: ${request.gender === 'M' ? '남자' : '여자'}
- 스타일: ${request.style === 'traditional' ? '전통적' : request.style === 'modern' ? '현대적' : '균형잡힌'}
${request.existingHanja.length > 0 ? `- 이미 선택된 한자: ${request.existingHanja.join(', ')}` : ''}

다음 JSON 배열 형식으로 응답하세요:

\`\`\`json
[
  {
    "character": "智",
    "meaning": "지혜",
    "detailedMeaning": "상세한 의미 설명...",
    "element": "WATER",
    "strokes": 12,
    "semanticScore": 95,
    "reasoning": "왜 이 한자가 '${request.targetMeaning}'과 잘 맞는지...",
    "culturalContext": "문화적/역사적 맥락...",
    "exampleNames": ["지혜", "지원", "지민"]
  },
  ...
]
\`\`\`

**중요**:
- 정확한 획수를 제공하세요
- 의미적 연관성을 명확히 설명하세요
- 작명에 적합한 한자만 추천하세요 (흉자 제외)`;
  }

  /**
   * Build name interpretation prompt
   */
  private buildNameInterpretationPrompt(request: NameInterpretationRequest): string {
    return `다음 이름의 의미와 문화적 의의를 해석해주세요.

## 이름 정보
- 이름: ${request.fullName}
- 한자: ${request.hanja}
- 성별: ${request.gender === 'M' ? '남아' : '여아'}

${request.sajuContext ? `## 사주 맥락\n- 일간: ${request.sajuContext.dayMaster.stem} (${request.sajuContext.dayMaster.element})` : ''}

다음 JSON 형식으로 응답하세요:

\`\`\`json
{
  "overallMeaning": "전체적인 이름의 의미...",
  "characterBreakdown": [
    {
      "character": "智",
      "meaning": "지혜",
      "culturalSignificance": "문화적 의의...",
      "element": "WATER"
    }
  ],
  "elementalHarmony": "오행 조화 분석...",
  "yinYangBalance": "음양 균형 분석...",
  "soundAnalysis": "발음과 음운 분석...",
  "culturalImplications": "이름이 주는 문화적 인상...",
  "modernRelevance": "현대 사회에서의 적합성...",
  "parentalGuidance": "부모님께 드리는 양육 조언..."
}
\`\`\`

**중요**:
- 따뜻하고 격려적인 어조로 작성하세요
- 구체적이고 실용적인 조언을 제공하세요
- 전통과 현대의 균형을 유지하세요`;
  }

  /**
   * Parse Yongsin analysis response
   */
  private parseYongsinResponse(
    responseText: string,
    request: YongsinAnalysisRequest
  ): YongsinAnalysisResult | null {
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonStr);

      return {
        primary: {
          element: parsed.primary.element as Element,
          method: parsed.primary.method,
          confidence: parsed.primary.confidence || 80,
          reasoning: parsed.primary.reasoning || '',
        },
        secondary: parsed.secondary
          ? {
              element: parsed.secondary.element as Element,
              reasoning: parsed.secondary.reasoning || '',
            }
          : undefined,
        avoid: (parsed.avoid || []) as Element[],
        dayMasterStrength: {
          score: parsed.dayMasterStrength?.score || 0,
          category: parsed.dayMasterStrength?.category || '중화',
          explanation: parsed.dayMasterStrength?.explanation || '',
        },
        seasonalContext: {
          season: parsed.seasonalContext?.season || this.getSeason(request.birthMonth),
          temperatureNeed: parsed.seasonalContext?.temperatureNeed || '중화',
          adjustment: parsed.seasonalContext?.adjustment || '',
        },
        fullAnalysis: parsed.fullAnalysis || responseText,
      };
    } catch (error) {
      console.error('Failed to parse Yongsin response:', error);
      return null;
    }
  }

  /**
   * Parse Hanja matching response
   */
  private parseHanjaMatches(responseText: string): HanjaSemanticMatch[] {
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        console.error('Hanja matches response is not an array');
        return [];
      }

      return parsed.map((item) => ({
        character: item.character || '',
        meaning: item.meaning || '',
        detailedMeaning: item.detailedMeaning || '',
        element: (item.element as Element) || 'EARTH',
        strokes: item.strokes || 10,
        semanticScore: item.semanticScore || 70,
        reasoning: item.reasoning || '',
        culturalContext: item.culturalContext || '',
        exampleNames: item.exampleNames || [],
      }));
    } catch (error) {
      console.error('Failed to parse Hanja matches:', error);
      return [];
    }
  }

  /**
   * Parse name interpretation response
   */
  private parseNameInterpretation(responseText: string): NameInterpretationResult | null {
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonStr);

      return {
        overallMeaning: parsed.overallMeaning || '',
        characterBreakdown: parsed.characterBreakdown || [],
        elementalHarmony: parsed.elementalHarmony || '',
        yinYangBalance: parsed.yinYangBalance || '',
        soundAnalysis: parsed.soundAnalysis || '',
        culturalImplications: parsed.culturalImplications || '',
        modernRelevance: parsed.modernRelevance || '',
        parentalGuidance: parsed.parentalGuidance || '',
      };
    } catch (error) {
      console.error('Failed to parse name interpretation:', error);
      return null;
    }
  }

  /**
   * Helper: Get season from month
   */
  private getSeason(month: number): '봄' | '여름' | '가을' | '겨울' {
    if ([12, 1, 2].includes(month)) return '겨울';
    if ([3, 4, 5].includes(month)) return '봄';
    if ([6, 7, 8].includes(month)) return '여름';
    return '가을';
  }
}

// Singleton instance
let claudeService: ClaudeAIService;

export function getClaudeService(): ClaudeAIService {
  if (!claudeService) {
    claudeService = new ClaudeAIService();
  }
  return claudeService;
}
