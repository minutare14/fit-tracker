import { IntegrationProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { resolveUserId } from "@/lib/current-user";
import { getMaskedIntegrationSecret } from "@/lib/integration-secrets";
import { HevyService } from "@/integrations/hevy/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  noStore();

  try {
    const body = await req.json();
    const userId = resolveUserId(body.userId);
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    const hevyService = new HevyService();
    const isValid = await hevyService.validateAndSaveConnection(userId, apiKey);

    return NextResponse.json({ success: true, isValid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  noStore();

  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));
    const hevyService = new HevyService();
    const repository = (hevyService as any).repository;
    const connection = await repository.getConnection(userId);
    const apiKeyMask = await getMaskedIntegrationSecret(userId, IntegrationProvider.HEVY, "API_KEY");

    return NextResponse.json({
      connected: connection?.status === "CONNECTED",
      status: connection?.status || "DISCONNECTED",
      apiKeyMask,
      lastSyncAt: connection?.lastSyncedAt || null,
      lastError: connection?.lastError || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
