import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { HevyService } from "@/integrations/hevy/service";

export async function POST(req: NextRequest) {
  noStore();
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const service = new HevyService();
    const result = await service.syncProgramToHevy(userId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
