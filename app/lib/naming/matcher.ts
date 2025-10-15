/**
 * Hanja Matcher - 한자 매칭 알고리즘
 *
 * 사주에 맞는 최적의 이름 후보를 생성합니다.
 *
 * Performance Target: <3초 내 1,000개 고품질 후보 생성
 *
 * Strategy:
 * 1. Element Filter (DB): 8,787 → 600-800 chars (50-100ms)
 * 2. Stroke Filter (CPU): 600-800 → 300-500 chars (10-20ms)
 * 3. Combination Generation (CPU): 300-500 → 1,000+ pairs (50-100ms)
 * 4. Full Scoring (CPU): 1,000 pairs → scored (1.5-2.5s)
 */

import { PrismaClient, Element } from '@prisma/client';
import { ScoringPipeline } from './scorers';
import type {
  NameCandidate,
  ScoringContext,
  ScoredCandidate,
  HanjaCharacter,
} from './types';
import type { SajuResult } from '../saju/calculator';

const prisma = new PrismaClient();

export interface MatchingOptions {
  minScore?: number;           // 최소 점수 (기본 60)
  maxResults?: number;         // 최대 결과 수 (기본 1,000)
  gender?: 'male' | 'female';  // 성별 필터
  preferredElements?: Element[]; // 선호 오행 (기본: saju.favorableElements)
  avoidChars?: string[];       // 제외 한자
  enableEarlyTermination?: boolean; // 조기 종료 (기본 true)
}

interface HanjaFromDB {
  id: string;
  character: string;
  koreanReading: string | null;
  meaning: string | null;
  strokes: number | null;
  element: Element | null;
  yinYang: any;
  gender: string | null;
  nameFrequency: number | null;
  usageFrequency: number | null;
  category: string | null;
}

export class HanjaMatcher {
  private pipeline: ScoringPipeline;
  private strokeCache: Map<string, number>;

  constructor() {
    this.pipeline = new ScoringPipeline();
    this.strokeCache = new Map();
  }

  /**
   * 사주에 맞는 최적의 이름 후보 생성
   */
  async findOptimalNames(
    saju: SajuResult,
    lastName: string,
    options: MatchingOptions = {}
  ): Promise<ScoredCandidate[]> {
    const startTime = Date.now();

    // 옵션 기본값 설정
    const {
      minScore = 60,
      maxResults = 1000,
      gender,
      preferredElements = saju.favorableElements,
      avoidChars = [],
      enableEarlyTermination = true,
    } = options;

    console.log('🔍 매칭 시작:', {
      favorableElements: preferredElements.map(e => e.toString()),
      lackingElements: saju.lackingElements.map(e => e.toString()),
      lastName,
    });

    // ═══════════════════════════════════════
    // Stage 1: Element-based DB filtering
    // ═══════════════════════════════════════
    const stage1Start = Date.now();
    const pool = await this.filterByElements(
      preferredElements,
      saju.lackingElements,
      gender,
      avoidChars
    );
    const stage1Time = Date.now() - stage1Start;

    console.log(`✓ Stage 1 완료: ${pool.length}개 한자 선택 (${stage1Time}ms)`);

    if (pool.length < 10) {
      throw new Error(
        '사주에 맞는 한자가 너무 적습니다 (최소 10개 필요). 조건을 완화해주세요.'
      );
    }

    // ═══════════════════════════════════════
    // Stage 2: Stroke-based filtering
    // ═══════════════════════════════════════
    const stage2Start = Date.now();
    const lastNameStrokes = await this.getStrokeCount(lastName);
    const filteredPool = this.filterByStrokeLuck(pool, lastNameStrokes);
    const stage2Time = Date.now() - stage2Start;

    console.log(`✓ Stage 2 완료: ${filteredPool.length}개 한자 유지 (${stage2Time}ms)`);

    // ═══════════════════════════════════════
    // Stage 3 & 4: Combination generation + scoring
    // ═══════════════════════════════════════
    const stage3Start = Date.now();
    const candidates = await this.generateAndScoreCombinations(
      filteredPool,
      lastName,
      lastNameStrokes,
      saju,
      maxResults,
      minScore,
      enableEarlyTermination
    );
    const stage3Time = Date.now() - stage3Start;

    const totalTime = Date.now() - startTime;
    console.log(`✓ Stage 3-4 완료: ${candidates.length}개 후보 생성 (${stage3Time}ms)`);
    console.log(`🎉 전체 완료: ${totalTime}ms`);

    // ═══════════════════════════════════════
    // Final: Sort and return top results
    // ═══════════════════════════════════════
    return candidates
      .sort((a, b) => b.scores.overall - a.scores.overall)
      .slice(0, maxResults);
  }

  /**
   * Stage 1: 오행으로 한자 필터링 (DB)
   */
  private async filterByElements(
    favorableElements: Element[],
    lackingElements: Element[],
    gender?: string,
    avoidChars: string[] = []
  ): Promise<HanjaFromDB[]> {
    // Combine favorable and lacking elements
    const allTargetElements = [
      ...new Set([...favorableElements, ...lackingElements])
    ];

    // Build where clause
    const where: any = {
      AND: [
        // Element filter (uses composite index [element, isGoodForNaming])
        { element: { in: allTargetElements } },

        // Only good for naming
        { isGoodForNaming: true },

        // Exclude specific characters
        { character: { notIn: avoidChars } },
      ],
    };

    // Optional gender filter
    if (gender) {
      where.AND.push({
        OR: [
          { gender: gender },
          { gender: 'neutral' },
          { gender: null },
        ],
      });
    }

    return await prisma.hanjaDict.findMany({
      where,
      select: {
        id: true,
        character: true,
        koreanReading: true,
        meaning: true,
        strokes: true,
        element: true,
        yinYang: true,
        gender: true,
        nameFrequency: true,
        usageFrequency: true,
        category: true,
      },
      orderBy: [
        { nameFrequency: 'desc' },
        { usageFrequency: 'desc' },
      ],
      take: 1000, // Safety limit
    });
  }

  /**
   * Stage 2: 획수 길흉으로 필터링 (CPU)
   */
  private filterByStrokeLuck(
    pool: HanjaFromDB[],
    lastNameStrokes: number
  ): HanjaFromDB[] {
    // If pool is already small, skip filtering
    if (pool.length <= 300) {
      return pool;
    }

    // Filter by stroke luck
    return pool.filter(char => {
      if (!char.strokes) return false;

      // Quick check: can this character form at least 2 auspicious grids?
      const auspiciousCount = this.countAuspiciousGrids(
        lastNameStrokes,
        char.strokes
      );

      return auspiciousCount >= 2;
    });
  }

  /**
   * Count how many auspicious grids this character can form
   */
  private countAuspiciousGrids(
    lastNameStrokes: number,
    charStrokes: number
  ): number {
    const AUSPICIOUS_NUMBERS = [
      1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25,
      31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 63, 65, 67, 68, 81,
    ];

    let count = 0;

    // 형격 (성 + 이름첫자)
    const hyeongGyeok = (lastNameStrokes + charStrokes) % 81 || 81;
    if (AUSPICIOUS_NUMBERS.includes(hyeongGyeok)) count++;

    // 정격 (성 + 이름끝자)
    const jeongGyeok = (lastNameStrokes + charStrokes) % 81 || 81;
    if (AUSPICIOUS_NUMBERS.includes(jeongGyeok)) count++;

    // 원격/이격은 두 글자 조합이 필요하므로 여기서는 스킵
    // (조합 생성 단계에서 체크)

    return count;
  }

  /**
   * Stage 3 & 4: 조합 생성 및 점수화
   */
  private async generateAndScoreCombinations(
    pool: HanjaFromDB[],
    lastName: string,
    lastNameStrokes: number,
    saju: SajuResult,
    maxResults: number,
    minScore: number,
    enableEarlyTermination: boolean
  ): Promise<ScoredCandidate[]> {
    const candidates: ScoredCandidate[] = [];

    // Scoring context
    const context: ScoringContext = {
      sajuResult: saju,
      lastName,
      lastNameStrokes,
    };

    // Configuration
    const BATCH_SIZE = 100;
    const QUICK_SCORE_THRESHOLD = 65;
    const EARLY_TERMINATION_THRESHOLD = 150; // 150+ high-quality candidates

    let batchBuffer: NameCandidate[] = [];
    let processedCount = 0;
    let highScoreCount = 0;

    // Generate combinations using nested loops
    for (let i = 0; i < pool.length; i++) {
      for (let j = i; j < pool.length; j++) {
        const firstChar = pool[i];
        const secondChar = pool[j];

        // Skip if missing critical data
        if (!firstChar.strokes || !secondChar.strokes) continue;
        if (!firstChar.element || !secondChar.element) continue;

        // Create candidate
        const candidate = this.createCandidate(firstChar, secondChar);

        // Quick score pre-filtering
        const quickScore = this.calculateQuickScore(
          candidate,
          saju,
          lastNameStrokes
        );

        if (quickScore < QUICK_SCORE_THRESHOLD) {
          continue; // Skip low-potential candidates
        }

        batchBuffer.push(candidate);

        // Process batch when full
        if (batchBuffer.length >= BATCH_SIZE) {
          const scored = await this.pipeline.scoreAll(batchBuffer, context);
          const qualified = scored.filter(c => c.scores.overall >= minScore);

          candidates.push(...qualified);
          highScoreCount += qualified.filter(c => c.scores.overall >= 80).length;
          processedCount += batchBuffer.length;

          batchBuffer = [];

          // Early termination check
          if (enableEarlyTermination && highScoreCount >= EARLY_TERMINATION_THRESHOLD) {
            console.log(`⚡ 조기 종료: ${highScoreCount}개 고득점 후보 확보`);
            break;
          }
        }
      }

      // Early termination outer loop break
      if (enableEarlyTermination && highScoreCount >= EARLY_TERMINATION_THRESHOLD) {
        break;
      }
    }

    // Process remaining batch
    if (batchBuffer.length > 0) {
      const scored = await this.pipeline.scoreAll(batchBuffer, context);
      const qualified = scored.filter(c => c.scores.overall >= minScore);
      candidates.push(...qualified);
      processedCount += batchBuffer.length;
    }

    console.log(`📊 총 ${processedCount}개 조합 평가, ${candidates.length}개 적격`);

    return candidates;
  }

  /**
   * Create name candidate from two hanja characters
   */
  private createCandidate(
    firstChar: HanjaFromDB,
    secondChar: HanjaFromDB
  ): NameCandidate {
    const hanjaChar1: HanjaCharacter = {
      id: parseInt(firstChar.id) || 0,
      character: firstChar.character,
      strokes: firstChar.strokes || 0,
      element: firstChar.element || Element.WOOD,
      yinYang: firstChar.yinYang,
      meaning: firstChar.meaning || '',
      koreanReading: firstChar.koreanReading || '',
      nameFrequency: firstChar.nameFrequency || 0,
      usageFrequency: firstChar.usageFrequency || 0,
      category: firstChar.category ? [firstChar.category] : [],
    };

    const hanjaChar2: HanjaCharacter = {
      id: parseInt(secondChar.id) || 0,
      character: secondChar.character,
      strokes: secondChar.strokes || 0,
      element: secondChar.element || Element.WOOD,
      yinYang: secondChar.yinYang,
      meaning: secondChar.meaning || '',
      koreanReading: secondChar.koreanReading || '',
      nameFrequency: secondChar.nameFrequency || 0,
      usageFrequency: secondChar.usageFrequency || 0,
      category: secondChar.category ? [secondChar.category] : [],
    };

    return {
      firstName: [
        hanjaChar1.koreanReading,
        hanjaChar2.koreanReading,
      ] as [string, string],
      characters: [hanjaChar1, hanjaChar2] as [HanjaCharacter, HanjaCharacter],
      score: 0,
      breakdown: {
        element: 0,
        yinyang: 0,
        numerology: 0,
        meaning: 0,
      },
      analysis: {
        elementHarmony: {
          lacksComplement: false,
          hasProducingCycle: false,
          hasConflictingCycle: false,
          strengthensFavorable: false,
          details: [],
        },
        yinyangBalance: {
          pattern: '',
          isBalanced: false,
          distribution: { yang: 0, yin: 0 },
          details: [],
        },
        numerologyGrids: {
          원격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
          형격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
          이격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
          정격: { strokes: 0, number: 0, fortune: '평', meaning: '', score: 0 },
          overallFortune: '',
        },
        meaningCompatibility: {
          theme: '',
          isHarmonious: false,
          quality: 'fair',
          details: [],
        },
        reasoning: [],
      },
    };
  }

  /**
   * Quick scoring heuristic (before full scoring)
   */
  private calculateQuickScore(
    candidate: NameCandidate,
    saju: SajuResult,
    lastNameStrokes: number
  ): number {
    let score = 50; // Base score

    const [char1, char2] = candidate.characters;

    // 1. Element harmony (quick check)
    const isLackingElement =
      saju.lackingElements.includes(char1.element) ||
      saju.lackingElements.includes(char2.element);

    if (isLackingElement) {
      score += 20;
    }

    // 2. Stroke luck (quick check)
    const AUSPICIOUS = [1,3,5,6,7,8,11,13,15,16,17,18,21,23,24,25,31,32,33];
    const 형격 = (lastNameStrokes + char1.strokes) % 81 || 81;
    if (AUSPICIOUS.includes(형격)) {
      score += 15;
    }

    // 3. Popularity bonus
    const avgPopularity = (char1.nameFrequency + char2.nameFrequency) / 2;
    score += Math.min(15, avgPopularity / 10);

    return score;
  }

  /**
   * Get stroke count (with caching)
   */
  private async getStrokeCount(character: string): Promise<number> {
    // Check cache first
    if (this.strokeCache.has(character)) {
      return this.strokeCache.get(character)!;
    }

    // Query database
    const result = await prisma.hanjaDict.findUnique({
      where: { character },
      select: { strokes: true },
    });

    const strokes = result?.strokes || 0;
    this.strokeCache.set(character, strokes);

    return strokes;
  }
}
