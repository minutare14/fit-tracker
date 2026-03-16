import { NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";
import prisma from "@/lib/prisma";
import { IntegrationProvider } from "@prisma/client";

export async function GET() {
  try {
    const userId = "user_default"; // Mocking user for now, in a real app this comes from session
    const hevyService = new HevyService();
    
    const connection = await prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: IntegrationProvider.HEVY } }
    });

    if (!connection) {
      return NextResponse.json({ 
        connected: false,
        stats: {
          workouts: 0,
          exercises: 0,
          mappings: 0,
          lastSync: null
        }
      });
    }

    const workoutsCount = await prisma.hevyWorkout.count({ where: { userId } });
    const exercisesCount = await prisma.hevyExerciseTemplate.count();
    const mappingsCount = await prisma.exerciseMapping.count({ where: { userId } });
    // Assuming routines are part of training programs
    const routinesCount = await prisma.trainingRoutine.count({
      where: { program: { userId } }
    });

    return NextResponse.json({
      connected: connection.status === "CONNECTED",
      status: connection.status,
      apiKey: connection.apiKey ? "****" + connection.apiKey.slice(-4) : null,
      lastSync: connection.lastSyncedAt,
      lastError: connection.lastError,
      stats: {
        workouts: workoutsCount,
        exercises: exercisesCount,
        mappings: mappingsCount,
        routines: routinesCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
