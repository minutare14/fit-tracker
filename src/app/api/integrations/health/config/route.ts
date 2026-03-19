import { IntegrationProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureUser, resolveUserId } from "@/lib/current-user";
import { getIntegrationSecret, getMaskedIntegrationSecret, saveIntegrationSecret } from "@/lib/integration-secrets";

export const dynamic = "force-dynamic";

const DEFAULT_HEADER_NAME = "x-health-autoexport-secret";

export async function GET(req: NextRequest) {
  noStore();

  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));
    await ensureUser(userId);

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
        },
      },
    });

    const secretMask = await getMaskedIntegrationSecret(
      userId,
      IntegrationProvider.HEALTH_AUTO_EXPORT,
      "WEBHOOK_SECRET"
    );

    const headerNameSecret = await getIntegrationSecret(
      userId,
      IntegrationProvider.HEALTH_AUTO_EXPORT,
      "HEADER_NAME"
    );

    const origin = req.nextUrl.origin;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || origin;

    return NextResponse.json({
      connected: connection?.status === "CONNECTED" || connection?.status === "ACTIVE",
      status: connection?.status ?? "DISCONNECTED",
      lastSyncAt: connection?.lastSyncedAt ?? null,
      lastError: connection?.lastError ?? null,
      webhookUrl: `${baseUrl}/api/webhooks/health/autoexport`,
      headerName: headerNameSecret?.value || DEFAULT_HEADER_NAME,
      hasSecret: Boolean(secretMask),
      secretMask,
      recommendedHeaderName: DEFAULT_HEADER_NAME,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  noStore();

  try {
    const body = await req.json();
    const userId = resolveUserId(body.userId);
    const webhookSecret = typeof body.webhookSecret === "string" ? body.webhookSecret.trim() : "";
    const headerName =
      typeof body.headerName === "string" && body.headerName.trim()
        ? body.headerName.trim().toLowerCase()
        : DEFAULT_HEADER_NAME;

    if (!webhookSecret) {
      return NextResponse.json({ error: "webhookSecret is required" }, { status: 400 });
    }

    await ensureUser(userId);
    await saveIntegrationSecret({
      userId,
      provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
      key: "WEBHOOK_SECRET",
      value: webhookSecret,
    });
    await saveIntegrationSecret({
      userId,
      provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
      key: "HEADER_NAME",
      value: headerName,
    });

    await prisma.integrationConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
        },
      },
      update: {
        status: "ACTIVE",
        lastError: null,
      },
      create: {
        userId,
        provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      headerName,
      secretMask: `****${webhookSecret.slice(-4)}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
