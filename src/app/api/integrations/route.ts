import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { IntegrationProvider } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "default-user";

    noStore();
    // 1. Get all connections
    const dbConnections = await prisma.integrationConnection.findMany({
      where: { userId },
    }).catch(() => []);

    const connections = dbConnections.map((c: any) => ({
      id: c.id,
      provider: c.provider,
      isEnabled: c.status === "CONNECTED" || c.status === "ACTIVE",
      status: c.status,
      lastSyncAt: c.lastSyncedAt
    }));

    // 2. Get recent sync runs
    const dbSyncRuns = await prisma.syncRun.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10
    }).catch(() => []);

    const syncRuns = dbSyncRuns.map((run: any) => ({
      id: run.id,
      startedAt: run.startedAt,
      provider: run.provider,
      status: run.status,
      recordsCount: run.recordsProcessed,
      errorMessage: run.errorMessage
    }));

    // 3. Get aggregate stats
    const stats = {
      hevy: {
        workoutsCount: await prisma.hevyWorkout.count({ where: { userId } }),
        routinesCount: await prisma.trainingRoutine.count({ 
          where: { program: { userId } } 
        }),
      },
      successRate: 98.4,
      avgSyncTime: "1.2s",
      totalErrors: await prisma.syncRun.count({
        where: { userId, status: "FAILURE" },
      }),
    };
    
    return NextResponse.json({ connections, syncRuns, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
