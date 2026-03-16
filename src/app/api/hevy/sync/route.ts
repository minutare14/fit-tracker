import { NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";

export async function POST(req: Request) {
  try {
    const userId = "user_default";
    const { type } = await req.json(); // "workouts", "templates", or "all"
    const hevyService = new HevyService();
    
    let results = { workouts: 0, templates: 0 };

    if (type === "workouts" || type === "all") {
      const res = await hevyService.syncWorkoutsFromHevy(userId);
      results.workouts = res.events || res.created;
    }

    if (type === "templates" || type === "all") {
      const res = await hevyService.syncExerciseTemplates(userId);
      results.templates = res.count;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Synchronization completed",
      results 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
