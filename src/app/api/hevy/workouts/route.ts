import { NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";

export async function GET() {
  try {
    const userId = "user_default";
    const hevyService = new HevyService();
    const workouts = await hevyService.getWorkouts(userId);
    return NextResponse.json(workouts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
