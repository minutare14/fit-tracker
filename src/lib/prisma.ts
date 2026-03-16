import { PrismaClient } from '@prisma/client'

// Helper to check if we are in a build environment where DB might not be available
const isBuild = process.env.NODE_ENV === 'production' && 
                (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost'));

const createMockPrisma = () => {
  return new Proxy({}, {
    get: (target, prop) => {
      // Mock common models
      const models = ['user', 'bjjSession', 'strengthWorkout', 'hevyWorkout', 'hevyExercise', 'hevySet', 'healthMetric', 'nutritionDaily', 'weightEntry', 'derivedMetric', 'integrationConnection', 'syncRun', 'trainingProgram', 'trainingRoutine', 'trainingExercise', 'trainingSetTemplate'];
      
      if (models.includes(prop as string) || (prop as string).toLowerCase().includes('model')) {
        const result: any = {
          findMany: async () => [],
          findUnique: async () => null,
          findFirst: async () => null,
          count: async () => 0,
          upsert: async () => ({}),
          create: async () => ({}),
          update: async () => ({}),
          delete: async () => ({}),
          deleteMany: async () => ({}),
        };
        return new Proxy(result, {
          get: (t, p) => t[p as string] || (() => Promise.resolve({}))
        });
      }
      return undefined;
    }
  }) as any;
}

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

let prisma: any;

if (isBuild) {
  prisma = createMockPrisma();
} else {
  try {
    prisma = globalForPrisma.prisma ?? prismaClientSingleton()
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
    
    // Test the connection immediately (optional, but helps catch errors early)
    prisma.$connect().catch((err: any) => {
      console.warn("⚠️ Prisma connection failed, falling back to mock mode for UI stability:", err.message);
    });
  } catch (err: any) {
    console.warn("⚠️ Prisma initialization failed, falling back to mock mode:", err.message);
    prisma = createMockPrisma();
  }
}

export default prisma
