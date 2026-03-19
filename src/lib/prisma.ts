import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from '@prisma/client'

const shouldUseMockPrisma = process.env.ALLOW_MOCK_PRISMA === 'true'

const createMockPrisma = () => {
  return new Proxy({}, {
    get: (_target, prop) => {
      const models = [
        'user',
        'bjjSession',
        'strengthWorkout',
        'hevyWorkout',
        'hevyExercise',
        'hevySet',
        'healthMetric',
        'nutritionDaily',
        'weightEntry',
        'derivedMetric',
        'integrationConnection',
        'syncRun',
        'trainingProgram',
        'trainingRoutine',
        'trainingExercise',
        'trainingSetTemplate',
        'hevyExerciseTemplate',
        'exerciseMapping',
        'rawEvent',
        'hevyProgramLink',
      ]

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
        }

        return new Proxy(result, {
          get: (target, key) => target[key as string] || (() => Promise.resolve({}))
        })
      }

      return undefined
    }
  }) as any
}

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8")
}

const resolveConnectionString = (connectionString: string) => {
  if (!connectionString.startsWith("prisma+postgres://")) {
    return connectionString
  }

  const parsed = new URL(connectionString)
  const apiKey = parsed.searchParams.get("api_key")
  if (!apiKey) {
    throw new Error("Prisma dev connection string is missing api_key")
  }

  const decoded = JSON.parse(decodeBase64Url(apiKey))
  if (!decoded.databaseUrl) {
    throw new Error("Prisma dev connection string did not expose databaseUrl")
  }

  return decoded.databaseUrl as string
}

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma")
  }

  const adapter = new PrismaPg({ connectionString: resolveConnectionString(connectionString) })
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = shouldUseMockPrisma
  ? createMockPrisma()
  : (globalForPrisma.prisma ?? prismaClientSingleton())

if (!shouldUseMockPrisma && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
