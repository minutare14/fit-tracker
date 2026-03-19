import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/current-user";
import { HevyService } from "@/integrations/hevy/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = resolveUserId(body.userId);
    const type = body.type || "all";
    const hevyService = new HevyService();

    const results: Record<string, any> = {};

    if (type === "workouts" || type === "all") {
      results.workouts = await hevyService.syncWorkoutsFromHevy(userId, body.mode || "delta");
    }

    if (type === "templates" || type === "all") {
      results.templates = await hevyService.syncExerciseTemplates(userId);
    }

    if (type === "routines") {
      results.routines = await hevyService.syncProgramToHevy(userId);
    }

    return NextResponse.json({
      success: true,
      message: "Synchronization completed",
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
