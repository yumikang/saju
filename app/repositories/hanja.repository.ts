import { PrismaClient } from '@prisma/client';
import type { HanjaDict, Prisma } from '@prisma/client';

export class HanjaRepository {
  constructor(private prisma: PrismaClient) {}

  async findByCharacter(character: string): Promise<HanjaDict | null> {
    return this.prisma.hanjaDict.findUnique({
      where: { character },
    });
  }

  async findMany(params: {
    element?: string;
    minStrokes?: number;
    maxStrokes?: number;
    category?: string;
    gender?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: HanjaDict[]; total: number }> {
    const {
      element,
      minStrokes,
      maxStrokes,
      category,
      gender,
      skip = 0,
      take = 100,
    } = params;

    const where: Prisma.HanjaDictWhereInput = {
      ...(element && { element }),
      ...(minStrokes || maxStrokes
        ? {
            strokes: {
              ...(minStrokes && { gte: minStrokes }),
              ...(maxStrokes && { lte: maxStrokes }),
            },
          }
        : {}),
      ...(category && { category: { has: category } }),
      ...(gender && { gender }),
    };

    const [data, total] = await Promise.all([
      this.prisma.hanjaDict.findMany({
        where,
        skip,
        take,
        orderBy: [{ nameFrequency: 'desc' }, { usageFrequency: 'desc' }],
      }),
      this.prisma.hanjaDict.count({ where }),
    ]);

    return { data, total };
  }

  async searchByMeaning(
    searchTerm: string,
    limit: number = 20
  ): Promise<HanjaDict[]> {
    return this.prisma.hanjaDict.findMany({
      where: {
        isSurname: false,
        AND: [
          // 🛡️ SEED PROTECTION: 보호된 한자도 검색 결과에 포함
          {
            OR: [
              { seedProtected: true },
              { isGoodForNaming: true },
            ],
          },
          // 검색 조건
          {
            OR: [
              { meaning: { contains: searchTerm, mode: 'insensitive' } },
              { koreanReading: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { nameFrequency: 'desc' },
    });
  }

  async findByElements(
    elements: string[],
    limit: number = 50
  ): Promise<HanjaDict[]> {
    return this.prisma.hanjaDict.findMany({
      where: {
        // 🛡️ SEED PROTECTION: 보호된 한자도 결과에 포함
        OR: [
          { seedProtected: true },
          { isGoodForNaming: true },
        ],
        element: { in: elements },
        isSurname: false,
      },
      take: limit,
      orderBy: [{ nameFrequency: 'desc' }, { strokes: 'asc' }],
    });
  }

  async getPopularCharacters(params: {
    element?: string;
    gender?: string;
    limit?: number;
  }): Promise<HanjaDict[]> {
    const { element, gender, limit = 20 } = params;

    return this.prisma.hanjaDict.findMany({
      where: {
        // 🛡️ SEED PROTECTION: 보호된 한자도 인기 한자에 포함
        OR: [
          { seedProtected: true },
          {
            isGoodForNaming: true,
            nameFrequency: { gt: 0 },
          },
        ],
        ...(element && { element }),
        ...(gender && { gender }),
        isSurname: false,
      },
      orderBy: { nameFrequency: 'desc' },
      take: limit,
    });
  }

  async incrementUsage(
    character: string,
    type: 'usage' | 'name' = 'usage'
  ): Promise<void> {
    const field = type === 'usage' ? 'usageFrequency' : 'nameFrequency';
    
    await this.prisma.hanjaDict.update({
      where: { character },
      data: {
        [field]: { increment: 1 },
      },
    });
  }

  async createMany(data: Prisma.HanjaDictCreateManyInput[]): Promise<number> {
    const result = await this.prisma.hanjaDict.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async upsert(data: {
    character: string;
    meaning: string;
    koreanReading: string;
    strokes: number;
    element: string;
    category?: string[];
  }): Promise<HanjaDict> {
    return this.prisma.hanjaDict.upsert({
      where: { character: data.character },
      create: {
        ...data,
        category: data.category || [],
      },
      update: {
        meaning: data.meaning,
        koreanReading: data.koreanReading,
        strokes: data.strokes,
        element: data.element,
        category: data.category || [],
      },
    });
  }

  async getStatistics(): Promise<{
    total: number;
    byElement: Record<string, number>;
    averageStrokes: number;
  }> {
    const [total, byElement, strokeStats] = await Promise.all([
      this.prisma.hanjaDict.count(),
      this.prisma.hanjaDict.groupBy({
        by: ['element'],
        _count: true,
      }),
      this.prisma.hanjaDict.aggregate({
        _avg: { strokes: true },
      }),
    ]);

    const elementCounts = byElement.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.element]: curr._count,
      }),
      {} as Record<string, number>
    );

    return {
      total,
      byElement: elementCounts,
      averageStrokes: strokeStats._avg.strokes || 0,
    };
  }

  /**
   * 사주에 맞는 한자 추천 (DB 기반) - 핵심 작명 로직
   *
   * gender, nameFrequency, isGoodForNaming 필터를 활용하여
   * 현대적이고 품질 높은 이름 추천
   *
   * @param lackingElements - 부족한 오행 (예: ['WOOD', 'FIRE'])
   * @param gender - 성별 ('M' | 'F' | null)
   * @param minPopularity - 최소 인기도 (기본: 50점 이상)
   * @param limit - 최대 결과 수 (기본: 100개)
   */
  async recommendForSaju(params: {
    lackingElements?: string[];
    gender?: 'M' | 'F' | null;
    minPopularity?: number;
    limit?: number;
  }): Promise<HanjaDict[]> {
    const {
      lackingElements = [],
      gender = null,
      minPopularity = 50,
      limit = 100,
    } = params;

    // WHERE 조건 구성
    const where: Prisma.HanjaDictWhereInput = {
      AND: [
        // 0. 🛡️ SEED PROTECTION: "사람이 고른 것 > 머신이 고른 것"
        {
          OR: [
            // 사람이 고른 한자는 빈도 관계없이 무조건 통과
            { seedProtected: true },
            // 나머지는 기존 규칙 (빈도 + 적합성)
            {
              isGoodForNaming: true,
              nameFrequency: { gte: minPopularity },
            },
          ],
        },

        // 1. 🔥 CRITICAL: 성씨 제외 (한국 성씨 132자)
        { isSurname: false },

        // 2. 부족한 오행 중 하나 (optional)
        lackingElements.length > 0
          ? { element: { in: lackingElements as any } }
          : {},

        // 3. 🎯 성별 힌트 필터 (genderHint 우선, fallback to legacy gender)
        gender === 'M'
          ? {
              OR: [
                { genderHint: { in: ['male', 'unisex'] } },
                { genderHint: null }, // genderHint 없으면 포함
              ],
            }
          : gender === 'F'
          ? {
              OR: [
                { genderHint: { in: ['female', 'unisex'] } },
                { genderHint: null }, // genderHint 없으면 포함
              ],
            }
          : {},
      ],
    };

    // DB 쿼리 (인기도 우선 정렬)
    const results = await this.prisma.hanjaDict.findMany({
      where,
      orderBy: [
        { nameFrequency: 'desc' }, // 인기도 우선
        { strokes: 'asc' }, // 획수 적은 것 우선
      ],
      take: limit,
    });

    return results;
  }

  /**
   * 성별별 인기 한자 가져오기
   */
  async getPopularByGender(params: {
    gender: 'male' | 'female' | 'neutral';
    limit?: number;
    minPopularity?: number;
  }): Promise<HanjaDict[]> {
    const { gender, limit = 50, minPopularity = 70 } = params;

    return this.prisma.hanjaDict.findMany({
      where: {
        // 🛡️ SEED PROTECTION: "사람이 고른 것 > 머신이 고른 것"
        OR: [
          { seedProtected: true },
          {
            isGoodForNaming: true,
            nameFrequency: { gte: minPopularity },
          },
        ],
        gender: gender,
        isSurname: false,
      },
      orderBy: [
        { nameFrequency: 'desc' },
        { strokes: 'asc' },
      ],
      take: limit,
    });
  }

  /**
   * 오행별 한자 가져오기
   */
  async getByElement(params: {
    element: string;
    gender?: 'male' | 'female' | 'neutral';
    limit?: number;
    minPopularity?: number;
  }): Promise<HanjaDict[]> {
    const { element, gender, limit = 50, minPopularity = 50 } = params;

    return this.prisma.hanjaDict.findMany({
      where: {
        // 🛡️ SEED PROTECTION: "사람이 고른 것 > 머신이 고른 것"
        OR: [
          { seedProtected: true },
          {
            isGoodForNaming: true,
            nameFrequency: { gte: minPopularity },
          },
        ],
        element: element as any,
        isSurname: false,
        ...(gender ? { gender: gender } : {}),
      },
      orderBy: [
        { nameFrequency: 'desc' },
      ],
      take: limit,
    });
  }
}