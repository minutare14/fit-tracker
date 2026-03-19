import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const shouldUseMockPrisma = process.env.ALLOW_MOCK_PRISMA === "true";

const createMockPrisma = () => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        const models = [
          "user",
          "bjjSession",
          "strengthWorkout",
          "hevyWorkout",
          "hevyExercise",
          "hevySet",
          "healthMetric",
          "nutritionDaily",
          "weightEntry",
          "derivedMetric",
          "integrationConnection",
          "syncRun",
          "trainingProgram",
          "trainingRoutine",
          "trainingExercise",
          "trainingSetTemplate",
          "hevyExerciseTemplate",
          "exerciseMapping",
          "rawEvent",
          "hevyProgramLink",
        ];

        if (models.includes(prop as string) || (prop as string).toLowerCase().includes("model")) {
          const result = {
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
            get: (target, key) =>
              target[key as keyof typeof target] || (() => Promise.resolve({})),
          });
        }

        return undefined;
      },
    }
  ) as unknown as PrismaClient;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
};

const resolveConnectionString = (connectionString: string) => {
  if (!connectionString.startsWith("prisma+postgres://")) {
    return connectionString;
  }

  const parsed = new URL(connectionString);
  const apiKey = parsed.searchParams.get("api_key");
  if (!apiKey) {
    throw new Error("Prisma dev connection string is missing api_key");
  }

  const decoded = JSON.parse(decodeBase64Url(apiKey)) as { databaseUrl?: string };
  if (!decoded.databaseUrl) {
    throw new Error("Prisma dev connection string did not expose databaseUrl");
  }

  return decoded.databaseUrl;
};

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
  }

  const adapter = new PrismaPg({ connectionString: resolveConnectionString(connectionString) });
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
  prismaProxy: PrismaClient | undefined;
};

const getPrismaClient = (): PrismaClient => {
  if (shouldUseMockPrisma) {
    return createMockPrisma();
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaClientSingleton();
  }

  return globalForPrisma.prisma;
};

const prisma =
  globalForPrisma.prismaProxy ??
  new Proxy({} as PrismaClient, {
    get(_target, prop, receiver) {
      const client = getPrismaClient() as unknown as Record<PropertyKey, unknown>;
      const value = Reflect.get(client, prop, receiver);

      if (typeof value === "function") {
        return value.bind(client);
      }

      return value;
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaProxy = prisma;
}

export default prisma;
