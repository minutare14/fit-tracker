import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { resolveUserId } from "@/lib/current-user";
import { HevyService } from "@/integrations/hevy/service";

export async function POST(req: NextRequest) {
  noStore();

  try {
    const body = await req.json().catch(() => ({}));
    const userId = resolveUserId(body.userId);
    const mode = body.mode || "delta";

    const service = new HevyService();
    const result = await service.syncWorkoutsFromHevy(userId, mode);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
