import { PrismaClient } from '@prisma/client';
import type { NamingResult, Prisma } from '@prisma/client';

export class NamingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.NamingResultCreateInput): Promise<NamingResult> {
    return this.prisma.namingResult.create({
      data,
      include: {
        sajuData: true,
        user: true,
      },
    });
  }

  async createMany(data: Prisma.NamingResultCreateManyInput[]): Promise<number> {
    const result = await this.prisma.namingResult.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async findById(id: string): Promise<NamingResult | null> {
    return this.prisma.namingResult.findUnique({
      where: { id },
      include: {
        sajuData: true,
        user: true,
        favorites: true,
      },
    });
  }

  async findByUserId(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
      orderBy?: 'score' | 'date';
    }
  ): Promise<{ data: NamingResult[]; total: number }> {
    const { skip = 0, take = 10, orderBy = 'date' } = params || {};

    const orderByClause: Prisma.NamingResultOrderByWithRelationInput =
      orderBy === 'score'
        ? { overallScore: 'desc' }
        : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.namingResult.findMany({
        where: { userId },
        skip,
        take,
        orderBy: orderByClause,
        include: {
          sajuData: {
            select: {
              name: true,
              birthDate: true,
              gender: true,
            },
          },
          favorites: {
            where: { userId },
            select: {
              rating: true,
              comment: true,
            },
          },
        },
      }),
      this.prisma.namingResult.count({ where: { userId } }),
    ]);

    return { data, total };
  }

  async findBySajuDataId(sajuDataId: string): Promise<NamingResult[]> {
    return this.prisma.namingResult.findMany({
      where: { sajuDataId },
      orderBy: { overallScore: 'desc' },
      include: {
        favorites: true,
      },
    });
  }

  async searchNames(params: {
    userId?: string;
    searchTerm?: string;
    minScore?: number;
    generationMethod?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: NamingResult[]; total: number }> {
    const {
      userId,
      searchTerm,
      minScore,
      generationMethod,
      skip = 0,
      take = 10,
    } = params;

    const where: Prisma.NamingResultWhereInput = {
      ...(userId && { userId }),
      ...(searchTerm && {
        OR: [
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { firstNameHanja: { contains: searchTerm, mode: 'insensitive' } },
          { notes: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }),
      ...(minScore && { overallScore: { gte: minScore } }),
      ...(generationMethod && { generationMethod }),
    };

    const [data, total] = await Promise.all([
      this.prisma.namingResult.findMany({
        where,
        skip,
        take,
        orderBy: { overallScore: 'desc' },
        include: {
          sajuData: true,
          favorites: {
            where: userId ? { userId } : undefined,
          },
        },
      }),
      this.prisma.namingResult.count({ where }),
    ]);

    return { data, total };
  }

  async getTopNames(params: {
    userId?: string;
    limit?: number;
    minScore?: number;
  }): Promise<NamingResult[]> {
    const { userId, limit = 10, minScore = 80 } = params;

    return this.prisma.namingResult.findMany({
      where: {
        ...(userId && { userId }),
        overallScore: { gte: minScore },
      },
      orderBy: { overallScore: 'desc' },
      take: limit,
      include: {
        sajuData: {
          select: {
            name: true,
            gender: true,
          },
        },
        _count: {
          select: { favorites: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.NamingResultUpdateInput
  ): Promise<NamingResult> {
    return this.prisma.namingResult.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<NamingResult> {
    return this.prisma.namingResult.delete({
      where: { id },
    });
  }

  async addToFavorites(
    userId: string,
    namingResultId: string,
    rating?: number,
    comment?: string
  ): Promise<void> {
    await this.prisma.favorite.upsert({
      where: {
        userId_namingResultId: {
          userId,
          namingResultId,
        },
      },
      create: {
        userId,
        namingResultId,
        rating,
        comment,
      },
      update: {
        rating,
        comment,
      },
    });
  }

  async removeFromFavorites(
    userId: string,
    namingResultId: string
  ): Promise<void> {
    await this.prisma.favorite.delete({
      where: {
        userId_namingResultId: {
          userId,
          namingResultId,
        },
      },
    });
  }

  async getFavorites(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
    }
  ): Promise<{ data: NamingResult[]; total: number }> {
    const { skip = 0, take = 10 } = params || {};

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          namingResult: {
            include: {
              sajuData: true,
            },
          },
        },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    const data = favorites.map((f) => ({
      ...f.namingResult,
      favorites: [
        {
          rating: f.rating,
          comment: f.comment,
        },
      ],
    }));

    return { data: data as any, total };
  }
}