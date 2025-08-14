import { PrismaClient } from '@prisma/client';
import type { SajuData, Prisma } from '@prisma/client';

export class SajuRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.SajuDataCreateInput): Promise<SajuData> {
    return this.prisma.sajuData.create({
      data,
    });
  }

  async findById(id: string): Promise<SajuData | null> {
    return this.prisma.sajuData.findUnique({
      where: { id },
      include: {
        user: true,
        namingResults: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<SajuData[]> {
    return this.prisma.sajuData.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        namingResults: {
          take: 3,
          orderBy: { overallScore: 'desc' },
        },
      },
    });
  }

  async update(id: string, data: Prisma.SajuDataUpdateInput): Promise<SajuData> {
    return this.prisma.sajuData.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<SajuData> {
    return this.prisma.sajuData.delete({
      where: { id },
    });
  }

  async findWithFilters(params: {
    userId?: string;
    gender?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }): Promise<{ data: SajuData[]; total: number }> {
    const { userId, gender, startDate, endDate, skip = 0, take = 10 } = params;

    const where: Prisma.SajuDataWhereInput = {
      ...(userId && { userId }),
      ...(gender && { gender }),
      ...(startDate && endDate && {
        birthDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.sajuData.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.sajuData.count({ where }),
    ]);

    return { data, total };
  }

  async getElementStatistics(userId: string): Promise<{
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  }> {
    const result = await this.prisma.sajuData.aggregate({
      where: { userId },
      _avg: {
        woodCount: true,
        fireCount: true,
        earthCount: true,
        metalCount: true,
        waterCount: true,
      },
    });

    return {
      wood: result._avg.woodCount || 0,
      fire: result._avg.fireCount || 0,
      earth: result._avg.earthCount || 0,
      metal: result._avg.metalCount || 0,
      water: result._avg.waterCount || 0,
    };
  }
}