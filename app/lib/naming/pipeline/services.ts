/**
 * Service Implementations for NamingPipeline
 *
 * Concrete implementations of abstract service interfaces:
 * - HanjaService (Database, In-Memory, Mock)
 * - CacheService (Redis, Memory, Mock)
 */

import type { Element } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { HanjaCharacter } from '~/lib/naming/types';
import type { HanjaService, CacheService } from './naming-pipeline';

// ============================================================
// HanjaService Implementations
// ============================================================

/**
 * Database-backed HanjaService using Prisma
 *
 * Production implementation that queries PostgreSQL
 */
export class DatabaseHanjaService implements HanjaService {
  constructor(private prisma: PrismaClient) {}

  async findByElement(
    element: Element,
    options: {
      minStrokes?: number;
      maxStrokes?: number;
      isGoodForNaming?: boolean;
      gender?: 'M' | 'F';
    }
  ): Promise<HanjaCharacter[]> {
    console.log(`[DEBUG] findByElement called with:`, { element, options });

    // Build AND conditions
    const andConditions: any[] = [];

    // 1. Element filter
    andConditions.push({ element });

    // 2. Stroke filters
    if (options.minStrokes !== undefined || options.maxStrokes !== undefined) {
      const strokeFilter: any = {};
      if (options.minStrokes !== undefined) {
        strokeFilter.gte = options.minStrokes;
      }
      if (options.maxStrokes !== undefined) {
        strokeFilter.lte = options.maxStrokes;
      }
      andConditions.push({ strokes: strokeFilter });
    }

    // 3. 🛡️ QUALITY FILTER: 2-stage hybrid (TRUE 먼저, 부족하면 NULL 보충)
    // - 1순위: isGoodForNaming = true (2,402자) - 출생 데이터 검증된 한자
    // - 2순위: isGoodForNaming = null (6,189자) - 미분류 (부족할 때만!)
    // - ❌ 차단: isGoodForNaming = false (64자) - 부정적 한자 (절대 사용 안함)

    // 4. 🔥 CRITICAL: Surname filter - ALWAYS exclude surnames from first names
    // This prevents Korean surnames (성씨 132자) from appearing in given names
    // Example: Prevents "김금철" (wrong) instead of correct "김철수"
    // TODO: Add isSurname field to schema
    // andConditions.push({ isSurname: false });

    // 5. Gender filter
    if (options.gender) {
      const genderFilter = options.gender === 'M' ? 'male' : 'female';
      andConditions.push({
        OR: [
          { gender: genderFilter },
          { gender: 'neutral' },
          { gender: null }
        ],
      });
    }

    const targetLimit = 300; // 🎯 NULL 한자 유입 감소 (500→300)
    const orderBy = [
      { nameFrequency: 'desc' },         // 이름 빈도 우선
      { usageFrequency: 'desc' },        // 일반 사용 빈도
    ];

    // STAGE 1: 먼저 검증된 한자만 (isGoodForNaming: true)
    // TODO: Add seedProtected field to schema for curated hanja
    let primaryResults = await this.prisma.hanjaDict.findMany({
      where: {
        AND: [
          ...andConditions,
          { isGoodForNaming: true }    // 출생 데이터 검증된 한자
        ]
      },
      take: targetLimit,
      orderBy,
    });

    // STAGE 2: 부족하면 NULL에서 보충 (fallback)
    let results = primaryResults;
    if (options.isGoodForNaming !== false && primaryResults.length < targetLimit) {
      const fallbackResults = await this.prisma.hanjaDict.findMany({
        where: {
          AND: [
            ...andConditions,
            { isGoodForNaming: null }  // NULL만 (부족할 때만!)
          ]
        },
        take: targetLimit - primaryResults.length,
        orderBy,
      });
      results = [...primaryResults, ...fallbackResults];
    }

    console.log(`[DEBUG] findByElement returning ${results.length} results`);
    if (results.length > 0) {
      console.log(`[DEBUG] Sample result:`, results[0]);
    }

    return results.map(this.mapToHanjaCharacter);
  }

  /**
   * Map Prisma HanjaDict to HanjaCharacter
   */
  private mapToHanjaCharacter(hanja: any): HanjaCharacter {
    return {
      id: parseInt(hanja.id) || 0, // HanjaDict uses string UUID, convert or use hash
      character: hanja.character,
      strokes: hanja.strokes || 0,
      element: hanja.element,
      yinYang: hanja.yinYang,
      meaning: hanja.meaning || '',
      koreanReading: hanja.koreanReading || '',
      fortune: '길', // Default fortune value (not stored in DB)
      nameFrequency: hanja.nameFrequency || 0,
      usageFrequency: hanja.usageFrequency || 0,
      category: hanja.category ? [hanja.category] : [],
      review: hanja.review,
      isGoodForNaming: hanja.isGoodForNaming,
    };
  }
}

/**
 * In-memory HanjaService
 *
 * Fast implementation for development/testing
 * Uses pre-loaded popular Hanja from popular-hanja.ts
 */
export class InMemoryHanjaService implements HanjaService {
  private hanjaPool: HanjaCharacter[] = [];

  constructor(initialPool: HanjaCharacter[] = []) {
    this.hanjaPool = initialPool;
  }

  async findByElement(
    element: Element,
    options: {
      minStrokes?: number;
      maxStrokes?: number;
      isGoodForNaming?: boolean;
      gender?: 'M' | 'F';
    }
  ): Promise<HanjaCharacter[]> {
    let results = this.hanjaPool.filter((h) => h.element === element);

    // Apply filters
    if (options.minStrokes !== undefined) {
      results = results.filter((h) => h.strokes >= options.minStrokes);
    }
    if (options.maxStrokes !== undefined) {
      results = results.filter((h) => h.strokes <= options.maxStrokes);
    }
    // 🔥 CRITICAL: Quality filter - DEFAULT to filtering out bad characters
    if (options.isGoodForNaming !== false) {
      results = results.filter((h) => h.isGoodForNaming !== false);
    }

    // Sort by popularity
    results.sort((a, b) => {
      const aFreq = (a.nameFrequency || 0) + (a.usageFrequency || 0);
      const bFreq = (b.nameFrequency || 0) + (b.usageFrequency || 0);
      return bFreq - aFreq;
    });

    return results.slice(0, 500);
  }

  /**
   * Add Hanja to pool (useful for testing)
   */
  addHanja(hanja: HanjaCharacter): void {
    this.hanjaPool.push(hanja);
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.hanjaPool = [];
  }
}

/**
 * Mock HanjaService for testing
 *
 * Returns deterministic test data
 */
export class MockHanjaService implements HanjaService {
  private mockData: Map<Element, HanjaCharacter[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  async findByElement(
    element: Element,
    options: {
      minStrokes?: number;
      maxStrokes?: number;
      isGoodForNaming?: boolean;
      gender?: 'M' | 'F';
    }
  ): Promise<HanjaCharacter[]> {
    const data = this.mockData.get(element) || [];
    return Promise.resolve(data.slice(0, 50)); // Return small set for testing
  }

  /**
   * Initialize with test data - 각 오행별로 충분한 한자 제공
   */
  private initializeMockData(): void {
    // Wood (木) - 10개
    this.mockData.set('WOOD', [
      this.createMockHanja(1, '木', 4, 'WOOD', '나무', '목'),
      this.createMockHanja(2, '林', 8, 'WOOD', '수풀', '림'),
      this.createMockHanja(3, '森', 12, 'WOOD', '울창한 숲', '삼'),
      this.createMockHanja(4, '松', 8, 'WOOD', '소나무', '송'),
      this.createMockHanja(5, '竹', 6, 'WOOD', '대나무', '죽'),
      this.createMockHanja(6, '梅', 11, 'WOOD', '매화', '매'),
      this.createMockHanja(7, '蘭', 19, 'WOOD', '난초', '난'),
      this.createMockHanja(8, '菊', 11, 'WOOD', '국화', '국'),
      this.createMockHanja(9, '柳', 9, 'WOOD', '버들', '류'),
      this.createMockHanja(10, '桂', 10, 'WOOD', '계수나무', '계'),
    ]);

    // Fire (火) - 10개
    this.mockData.set('FIRE', [
      this.createMockHanja(11, '火', 4, 'FIRE', '불', '화'),
      this.createMockHanja(12, '炎', 8, 'FIRE', '불꽃', '염'),
      this.createMockHanja(13, '焰', 12, 'FIRE', '타오르는 불', '염'),
      this.createMockHanja(14, '煥', 13, 'FIRE', '빛날', '환'),
      this.createMockHanja(15, '燦', 17, 'FIRE', '찬란할', '찬'),
      this.createMockHanja(16, '明', 8, 'FIRE', '밝을', '명'),
      this.createMockHanja(17, '光', 6, 'FIRE', '빛', '광'),
      this.createMockHanja(18, '照', 13, 'FIRE', '비출', '조'),
      this.createMockHanja(19, '燿', 18, 'FIRE', '빛날', '요'),
      this.createMockHanja(20, '煥', 13, 'FIRE', '빛날', '환'),
    ]);

    // Earth (土) - 10개
    this.mockData.set('EARTH', [
      this.createMockHanja(21, '土', 3, 'EARTH', '흙', '토'),
      this.createMockHanja(22, '地', 6, 'EARTH', '땅', '지'),
      this.createMockHanja(23, '坤', 8, 'EARTH', '땅의 기운', '곤'),
      this.createMockHanja(24, '山', 3, 'EARTH', '산', '산'),
      this.createMockHanja(25, '岳', 8, 'EARTH', '높은 산', '악'),
      this.createMockHanja(26, '石', 5, 'EARTH', '돌', '석'),
      this.createMockHanja(27, '岩', 8, 'EARTH', '바위', '암'),
      this.createMockHanja(28, '峰', 10, 'EARTH', '봉우리', '봉'),
      this.createMockHanja(29, '基', 11, 'EARTH', '터', '기'),
      this.createMockHanja(30, '堂', 11, 'EARTH', '집', '당'),
    ]);

    // Metal (金) - 10개
    this.mockData.set('METAL', [
      this.createMockHanja(31, '金', 8, 'METAL', '쇠', '금'),
      this.createMockHanja(32, '銀', 14, 'METAL', '은', '은'),
      this.createMockHanja(33, '鐵', 21, 'METAL', '철', '철'),
      this.createMockHanja(34, '鉉', 13, 'METAL', '솥 고리', '현'),
      this.createMockHanja(35, '鍾', 17, 'METAL', '쇠북', '종'),
      this.createMockHanja(36, '錫', 16, 'METAL', '주석', '석'),
      this.createMockHanja(37, '鑛', 20, 'METAL', '쇠', '광'),
      this.createMockHanja(38, '鈴', 13, 'METAL', '방울', '령'),
      this.createMockHanja(39, '鎭', 18, 'METAL', '진압할', '진'),
      this.createMockHanja(40, '錦', 16, 'METAL', '비단', '금'),
    ]);

    // Water (水) - 10개
    this.mockData.set('WATER', [
      this.createMockHanja(41, '水', 4, 'WATER', '물', '수'),
      this.createMockHanja(42, '河', 8, 'WATER', '강', '하'),
      this.createMockHanja(43, '海', 11, 'WATER', '바다', '해'),
      this.createMockHanja(44, '江', 6, 'WATER', '강', '강'),
      this.createMockHanja(45, '淵', 12, 'WATER', '못', '연'),
      this.createMockHanja(46, '泉', 9, 'WATER', '샘', '천'),
      this.createMockHanja(47, '湖', 12, 'WATER', '호수', '호'),
      this.createMockHanja(48, '波', 8, 'WATER', '물결', '파'),
      this.createMockHanja(49, '洋', 9, 'WATER', '큰 바다', '양'),
      this.createMockHanja(50, '潤', 15, 'WATER', '윤택할', '윤'),
    ]);
  }

  /**
   * Helper to create mock Hanja
   */
  private createMockHanja(
    id: number,
    character: string,
    strokes: number,
    element: Element,
    meaning: string,
    reading: string
  ): HanjaCharacter {
    return {
      id,
      character,
      strokes,
      element,
      yinYang: strokes % 2 === 0 ? 'YIN' : 'YANG',
      meaning,
      koreanReading: reading,
      fortune: '길',
      nameFrequency: 100,
      usageFrequency: 100,
      isGoodForNaming: true,
    };
  }
}

// ============================================================
// CacheService Implementations
// ============================================================

/**
 * Redis-backed CacheService
 *
 * Production implementation using Redis for distributed caching
 */
export class RedisCacheService implements CacheService {
  constructor(private redis: RedisClient) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      // Redis v4+ uses setEx instead of setex
      await this.redis.setEx(key, ttl, serialized);
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all naming-related cache entries
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys('naming:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
        console.log(`Redis: Cleared ${keys.length} naming cache entries`);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<{ keys: number; memory: string }> {
    try {
      const keys = await this.redis.keys('naming:*');
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      return {
        keys: keys.length,
        memory: memoryMatch ? memoryMatch[1] : 'unknown',
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return { keys: 0, memory: 'error' };
    }
  }
}

/**
 * In-memory CacheService
 *
 * Simple Map-based cache for development
 */
export class InMemoryCacheService implements CacheService {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Null CacheService (no-op)
 *
 * Disables caching entirely
 */
export class NullCacheService implements CacheService {
  async get<T>(key: string): Promise<T | null> {
    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // No-op
  }

  async delete(key: string): Promise<void> {
    // No-op
  }
}

// ============================================================
// Type Definitions for External Dependencies
// ============================================================

/**
 * Redis client interface (compatible with node-redis v4+)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<void>; // v4+ 사용
  del(key: string | string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  info(section?: string): Promise<string>;
  isOpen?: boolean;
}

// ============================================================
// Factory Functions
// ============================================================

/**
 * Create HanjaService based on environment
 */
export function createHanjaService(
  type: 'database' | 'memory' | 'mock',
  prisma?: PrismaClient,
  initialPool?: HanjaCharacter[]
): HanjaService {
  switch (type) {
    case 'database':
      if (!prisma) throw new Error('Prisma client required for database service');
      return new DatabaseHanjaService(prisma);
    case 'memory':
      return new InMemoryHanjaService(initialPool);
    case 'mock':
      return new MockHanjaService();
    default:
      throw new Error(`Unknown HanjaService type: ${type}`);
  }
}

/**
 * Create CacheService based on environment
 */
export function createCacheService(
  type: 'redis' | 'memory' | 'null',
  redis?: RedisClient
): CacheService {
  switch (type) {
    case 'redis':
      if (!redis) throw new Error('Redis client required for redis cache');
      return new RedisCacheService(redis);
    case 'memory':
      return new InMemoryCacheService();
    case 'null':
      return new NullCacheService();
    default:
      throw new Error(`Unknown CacheService type: ${type}`);
  }
}
