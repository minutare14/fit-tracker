import { NextRequest, NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  noStore();
  try {
    const body = await req.json();
    const { userId, apiKey } = body;

    if (!userId || !apiKey) {
      return NextResponse.json({ error: "userId and apiKey are required" }, { status: 400 });
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
    const userId = req.nextUrl.searchParams.get("userId") || "default-user";
    const hevyService = new HevyService();
    // Use repository to get public connection info
    const repository = (hevyService as any).repository; 
    const connection = await repository.getConnection(userId);
    
    return NextResponse.json({
      connected: !!connection?.apiKey,
      status: connection?.status || "DISCONNECTED",
      lastSyncAt: connection?.lastSyncedAt,
      lastError: connection?.lastError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
