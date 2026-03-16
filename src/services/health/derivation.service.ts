import prisma from "@/lib/prisma";

export class MetricDerivationService {
  async calculateDailyMetrics(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Calculate BJJ Load
    const bjjSessions = await prisma.bjjSession.findMany({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } }
    });
    const dailyBjjLoad = bjjSessions.reduce((acc: number, s: any) => acc + s.load, 0);

    // 2. Calculate Strength Volume
    const strengthWorkouts = await prisma.hevyWorkout.findMany({
      where: { userId, startedAt: { gte: startOfDay, lte: endOfDay } },
      include: { exercises: { include: { sets: true } } }
    });
    
    let dailyStrengthVolume = 0;
    for (const workout of strengthWorkouts) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          dailyStrengthVolume += (Number(set.weightKg) || 0) * (Number(set.reps) || 0);
        }
      }
    }

    // 3. Get Recovery (HRV + Sleep)
    const hrvMetric = await prisma.healthMetric.findFirst({
      where: { userId, type: "HRV", date: { gte: startOfDay, lte: endOfDay } },
      orderBy: { date: "desc" }
    });
    
    const sleepMetric = await prisma.healthMetric.findFirst({
      where: { userId, type: "Sleep", date: { gte: startOfDay, lte: endOfDay } },
      orderBy: { date: "desc" }
    });

    // 4. Derive Scores
    const recoveryScore = this.calculateRecoveryScore(hrvMetric?.value, sleepMetric?.value);
    
    // 5. Persist
    return prisma.derivedMetric.upsert({
      where: { 
        userId_date: { userId, date: startOfDay } 
      },
      update: {
        weeklyLoad: dailyBjjLoad,
        fatigue: Math.floor(dailyBjjLoad / 10),
        recovery: recoveryScore,
      },
      create: {
        userId,
        date: startOfDay,
        weeklyLoad: dailyBjjLoad,
        fatigue: Math.floor(dailyBjjLoad / 10),
        recovery: recoveryScore,
      }
    });
  }

  private calculateRecoveryScore(hrv?: number, sleep?: number): number {
    if (!hrv || !sleep) return 70;
    const hrvScore = Math.min((hrv / 80) * 100, 100);
    const sleepScore = Math.min((sleep / 28800) * 100, 100); // sleep in seconds (8h = 28800s)
    return Math.floor((hrvScore * 0.6) + (sleepScore * 0.4));
  }
}
