import { PrismaClient } from '@prisma/client';
import { env } from './environment';

/**
 * Prisma Client singleton with proper configuration
 * - Logging enabled based on environment
 * - Connection pooling configured via DATABASE_URL
 * - Graceful shutdown handlers
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Prevent multiple instances in development (hot reload)
if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Graceful shutdown handlers
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});


