CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "birthDate" TIMESTAMP(3),
    "sex" TEXT,
    "heightCm" DOUBLE PRECISION,
    "currentWeightKg" DOUBLE PRECISION,
    "targetCategory" TEXT,
    "beltRank" TEXT,
    "academyTeam" TEXT,
    "primaryGoal" TEXT,
    "injuriesRestrictions" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Bahia',
    "unitSystem" TEXT NOT NULL DEFAULT 'metric',
    "dailyCalorieTarget" DOUBLE PRECISION,
    "proteinTargetG" DOUBLE PRECISION,
    "carbsTargetG" DOUBLE PRECISION,
    "fatTargetG" DOUBLE PRECISION,
    "hydrationTargetLiters" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "key" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "valueHash" TEXT,
    "last4" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSecret_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX "IntegrationSecret_userId_provider_key_key" ON "IntegrationSecret"("userId", "provider", "key");

ALTER TABLE "UserProfile"
ADD CONSTRAINT "UserProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntegrationSecret"
ADD CONSTRAINT "IntegrationSecret_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
