import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardService } from "@/services/dashboard/dashboard.service";

export async function GET(req: NextRequest) {
  noStore();
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "default-user";
    const dashboardService = new DashboardService();
    const stats = await dashboardService.getDashboardStats(userId);
    return NextResponse.json(stats);
  } catch (error: any) {
    // If it fails during build, return empty data
    return NextResponse.json({ 
      kpi: { 
        totalWeeklyLoad: { value: 0, unit: "TSS", change: "0%", trend: "flat" },
        bodyWeight: { value: 0, unit: "kg", change: "0kg", trend: "flat" },
        avgSleep: { value: 0, unit: "hrs", change: "0%", trend: "flat" },
        readiness: { value: 0, unit: "%", change: "0%", trend: "flat" }
      },
      activity: []
    });
  }
}
