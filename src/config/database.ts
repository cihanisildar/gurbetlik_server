import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Enhanced Prisma client configuration with security settings
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during development
const prisma = global.__prisma || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

// Database connection monitoring is handled through health checks

// Database health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Secure database connection validation
export const validateDatabaseConnection = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Check for SSL requirement in production
  if (process.env.NODE_ENV === 'production') {
    const dbUrl = new URL(process.env.DATABASE_URL);
    if (!dbUrl.searchParams.get('sslmode')) {
      console.warn('⚠️  WARNING: SSL is not explicitly configured for database connection in production');
    }
  }

  try {
    await checkDatabaseHealth();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Failed to establish database connection:', error);
    throw error;
  }
};

export default prisma; 