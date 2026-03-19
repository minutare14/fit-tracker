import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/current-user";
import { HevyService } from "@/integrations/hevy/service";

export async function GET(req: NextRequest) {
  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));
    const limit = Number(req.nextUrl.searchParams.get("limit") || "50");
    const hevyService = new HevyService();
    const workouts = await hevyService.getWorkouts(userId, Number.isNaN(limit) ? 50 : limit);
    return NextResponse.json(workouts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
