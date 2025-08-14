import { PrismaClient } from '@prisma/client';
import { UserRepository } from '~/repositories/user.repository';
import { SajuRepository } from '~/repositories/saju.repository';
import { NamingRepository } from '~/repositories/naming.repository';
import { HanjaRepository } from '~/repositories/hanja.repository';

// Singleton pattern for PrismaClient
let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
  prisma.$connect();
}

// Repository instances
let userRepository: UserRepository;
let sajuRepository: SajuRepository;
let namingRepository: NamingRepository;
let hanjaRepository: HanjaRepository;

// Repository factory functions
export function getUserRepository(): UserRepository {
  if (!userRepository) {
    userRepository = new UserRepository(prisma);
  }
  return userRepository;
}

export function getSajuRepository(): SajuRepository {
  if (!sajuRepository) {
    sajuRepository = new SajuRepository(prisma);
  }
  return sajuRepository;
}

export function getNamingRepository(): NamingRepository {
  if (!namingRepository) {
    namingRepository = new NamingRepository(prisma);
  }
  return namingRepository;
}

export function getHanjaRepository(): HanjaRepository {
  if (!hanjaRepository) {
    hanjaRepository = new HanjaRepository(prisma);
  }
  return hanjaRepository;
}

// Transaction helper
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return fn(tx as PrismaClient);
  });
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Export the prisma client for direct use if needed
export { prisma };