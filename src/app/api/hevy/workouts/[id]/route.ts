import { NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hevyService = new HevyService();
    const workout = await hevyService.getWorkoutById(id);
    
    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    return NextResponse.json(workout);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
