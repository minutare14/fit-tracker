import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { resolveUserId } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));

    noStore();

    const dbConnections = await prisma.integrationConnection.findMany({ where: { userId } }).catch(() => []);
    const dbSyncRuns = await prisma.syncRun.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10,
    }).catch(() => []);
    const hevyWorkoutsCount = await prisma.hevyWorkout.count({ where: { userId } });
    const hevyRoutinesCount = await prisma.trainingRoutine.count({ where: { program: { userId } } });
    const totalErrors = await prisma.syncRun.count({ where: { userId, status: "FAILURE" } });

    const connections = dbConnections.map((connection: any) => ({
      id: connection.id,
      provider: connection.provider,
      isEnabled: connection.status === "CONNECTED" || connection.status === "ACTIVE",
      status: connection.status,
      lastSyncAt: connection.lastSyncedAt,
    }));

    const syncRuns = dbSyncRuns.map((run: any) => ({
      id: run.id,
      startedAt: run.startedAt,
      provider: run.provider,
      status: run.status,
      recordsCount: run.recordsProcessed,
      errorMessage: run.errorMessage,
      syncType: run.syncType,
      finishedAt: run.finishedAt,
    }));

    const completedRuns = dbSyncRuns.filter((run: any) => run.finishedAt);
    const successfulRuns = dbSyncRuns.filter((run: any) => run.status === "SUCCESS");
    const successRate = dbSyncRuns.length === 0 ? 0 : Number(((successfulRuns.length / dbSyncRuns.length) * 100).toFixed(1));

    const avgDurationMs = completedRuns.length === 0
      ? 0
      : Math.round(
          completedRuns.reduce((acc: number, run: any) => {
            return acc + Math.max(0, new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime());
          }, 0) / completedRuns.length
        );

    const stats = {
      hevy: {
        workoutsCount: hevyWorkoutsCount,
        routinesCount: hevyRoutinesCount,
      },
      successRate,
      avgSyncTime: avgDurationMs,
      totalErrors,
    };

    return NextResponse.json({ connections, syncRuns, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
