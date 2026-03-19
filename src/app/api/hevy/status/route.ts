import { IntegrationProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));

    const connection = await prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: IntegrationProvider.HEVY } }
    });
    const workoutsCount = await prisma.hevyWorkout.count({ where: { userId } });
    const exercisesCount = await prisma.hevyExerciseTemplate.count();
    const mappingsCount = await prisma.exerciseMapping.count({ where: { userId } });
    const routinesCount = await prisma.trainingRoutine.count({ where: { program: { userId } } });
    const rawEventsCount = await prisma.rawEvent.count({ where: { userId, provider: IntegrationProvider.HEVY } });
    const lastSyncRun = await prisma.syncRun.findFirst({
      where: { userId, provider: IntegrationProvider.HEVY },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      connected: connection?.status === "CONNECTED",
      status: connection?.status || "DISCONNECTED",
      apiKey: connection?.apiKey ? `****${connection.apiKey.slice(-4)}` : null,
      lastSync: connection?.lastSyncedAt || null,
      lastError: connection?.lastError || lastSyncRun?.errorMessage || null,
      stats: {
        workouts: workoutsCount,
        exercises: exercisesCount,
        mappings: mappingsCount,
        routines: routinesCount,
        rawEvents: rawEventsCount,
      },
      lastSyncRun: lastSyncRun ? {
        status: lastSyncRun.status,
        syncType: lastSyncRun.syncType,
        startedAt: lastSyncRun.startedAt,
        finishedAt: lastSyncRun.finishedAt,
        recordsProcessed: lastSyncRun.recordsProcessed,
        recordsCreated: lastSyncRun.recordsCreated,
        recordsUpdated: lastSyncRun.recordsUpdated,
        errorMessage: lastSyncRun.errorMessage,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
