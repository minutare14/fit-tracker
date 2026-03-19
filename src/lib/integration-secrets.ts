import { IntegrationProvider } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/current-user";
import { decryptSecret, encryptSecret, hashSecret } from "@/lib/server/secrets";

export async function saveIntegrationSecret(params: {
  userId: string;
  provider: IntegrationProvider;
  key: string;
  value: string;
  metadataJson?: unknown;
}) {
  const { userId, provider, key, value, metadataJson } = params;
  await ensureUser(userId);

  return prisma.integrationSecret.upsert({
    where: {
      userId_provider_key: {
        userId,
        provider,
        key,
      },
    },
    update: {
      encryptedValue: encryptSecret(value),
      valueHash: hashSecret(value),
      last4: value.slice(-4),
      metadataJson: metadataJson ?? undefined,
    },
    create: {
      userId,
      provider,
      key,
      encryptedValue: encryptSecret(value),
      valueHash: hashSecret(value),
      last4: value.slice(-4),
      metadataJson: metadataJson ?? undefined,
    },
  });
}

export async function getIntegrationSecret(
  userId: string,
  provider: IntegrationProvider,
  key: string
) {
  const secret = await prisma.integrationSecret.findUnique({
    where: {
      userId_provider_key: {
        userId,
        provider,
        key,
      },
    },
  });

  if (!secret) {
    return null;
  }

  return {
    ...secret,
    value: decryptSecret(secret.encryptedValue),
    maskedValue: secret.last4 ? `****${secret.last4}` : null,
  };
}

export async function getMaskedIntegrationSecret(
  userId: string,
  provider: IntegrationProvider,
  key: string
) {
  const secret = await prisma.integrationSecret.findUnique({
    where: {
      userId_provider_key: {
        userId,
        provider,
        key,
      },
    },
  });

  return secret?.last4 ? `****${secret.last4}` : null;
}

export async function findUserBySecret(
  provider: IntegrationProvider,
  key: string,
  value: string
) {
  const valueHash = hashSecret(value);

  return prisma.integrationSecret.findFirst({
    where: {
      provider,
      key,
      valueHash,
    },
    include: {
      user: true,
    },
  });
}
