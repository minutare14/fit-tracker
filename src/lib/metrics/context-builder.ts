import prisma from "@/lib/prisma";

export class AIContextBuilder {
  async getAthleteContext(userId: string, daysBack = 14) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const [
      bjjSessions,
      workouts,
      health,
      nutrition,
      derived
    ] = await Promise.all([
      prisma.bjjSession.findMany({ where: { userId, date: { gte: startDate } } }),
      prisma.hevyWorkout.findMany({ where: { userId, startedAt: { gte: startDate } }, include: { exercises: { include: { sets: true } } } }),
      prisma.healthMetric.findMany({ where: { userId, date: { gte: startDate } } }),
      prisma.nutritionDaily.findMany({ where: { userId, date: { gte: startDate } } }),
      prisma.derivedMetric.findMany({ where: { date: { gte: startDate } }, orderBy: { date: "asc" } })
    ]);

    return {
      athleteProfile: {
        belt: "Purple", // Dynamic later
        weight: 82,
      },
      trainingSummary: {
        bjjCount: bjjSessions.length,
        strengthCount: workouts.length,
        totalVolume: derived.reduce((acc: number, d: any) => acc + (d.weeklyLoad || 0), 0)
      },
      historicalData: {
        sessions: bjjSessions,
        workouts: workouts,
        healthMetrics: health,
        nutritionLogs: nutrition,
        trends: derived
      }
    };
  }
}
