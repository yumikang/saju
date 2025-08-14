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
        OR: [
          { meaning: { contains: searchTerm, mode: 'insensitive' } },
          { koreanReading: { contains: searchTerm, mode: 'insensitive' } },
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
        element: { in: elements },
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
        ...(element && { element }),
        ...(gender && { gender }),
        nameFrequency: { gt: 0 },
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
}