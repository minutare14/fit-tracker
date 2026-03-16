import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { NutritionService } from "@/services/nutrition/nutrition.service";

export async function GET(req: NextRequest) {
  noStore();
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "default-user";
    const type = req.nextUrl.searchParams.get("type");
    const nutritionService = new NutritionService();

    if (type === "stats") {
      const stats = await nutritionService.getNutritionStats(userId);
      return NextResponse.json(stats);
    }

    const dateStr = req.nextUrl.searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : new Date();
    const log = await nutritionService.getDailyLog(userId, date);
    
    return NextResponse.json(log || { calories: 0, protein: 0, carbs: 0, fat: 0, adherent: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  noStore();
  try {
    const body = await req.json();
    const { userId, ...data } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const nutritionService = new NutritionService();
    const log = await nutritionService.upsertLog(userId, data);
    return NextResponse.json(log);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
