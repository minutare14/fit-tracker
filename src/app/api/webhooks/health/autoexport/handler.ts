import { IntegrationProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { findUserBySecret } from "@/lib/integration-secrets";
import { HealthService } from "@/services/health/health.service";

const DEFAULT_HEADER_NAMES = [
  "x-health-autoexport-secret",
  "x-webhook-secret",
  "authorization",
];

const normalizeHeaderValue = (value: string) => {
  if (value.toLowerCase().startsWith("bearer ")) {
    return value.slice(7).trim();
  }

  return value.trim();
};

async function resolveWebhookUser(request: NextRequest) {
  const candidates = DEFAULT_HEADER_NAMES.map((headerName) => request.headers.get(headerName))
    .filter((value): value is string => Boolean(value))
    .map(normalizeHeaderValue)
    .filter(Boolean);

  for (const candidate of candidates) {
    const secret = await findUserBySecret(
      IntegrationProvider.HEALTH_AUTO_EXPORT,
      "WEBHOOK_SECRET",
      candidate
    );

    if (secret?.userId) {
      return secret.userId;
    }
  }

  return null;
}

export async function handleHealthAutoExportWebhook(req: NextRequest) {
  try {
    const userId = await resolveWebhookUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or missing webhook secret" }, { status: 401 });
    }

    const payload = await req.json();
    const healthService = new HealthService();
    const result = await healthService.processWebhook(payload, userId);

    await prisma.integrationConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
        },
      },
      update: {
        status: "CONNECTED",
        lastSyncedAt: new Date(),
        lastError: null,
      },
      create: {
        userId,
        provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
