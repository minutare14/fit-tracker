import { NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    
    const hevyService = new HevyService();
    const templates = await hevyService.getExerciseTemplates(search, category);

    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
