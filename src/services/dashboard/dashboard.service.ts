import { BjjSession, HevyWorkout, HealthMetric } from "@prisma/client";
import prisma from "@/lib/prisma";

export class DashboardService {
  async getDashboardStats(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const targets = {
      weeklyLoad: user?.weeklyLoadTarget || 1000,
      sleep: user?.sleepTarget || 8
    };

    const now = new Date();
    const last7d = new Date(new Date().setDate(now.getDate() - 7));

    // 1. Weekly Load (BJJ + Strength)
    const bjjSessions7d = await prisma.bjjSession.findMany({
      where: { userId, date: { gte: last7d } }
    });
    const strengthWorkouts7d = await prisma.hevyWorkout.findMany({
      where: { userId, startedAt: { gte: last7d } }
    });

    const bjjLoad = bjjSessions7d.reduce((acc: number, s: BjjSession) => acc + s.load, 0);
    const strengthLoad = strengthWorkouts7d.reduce((acc: number, w: HevyWorkout) => acc + ((w.durationSeconds || 0) / 60) * 7, 0);
    const totalWeeklyLoad = bjjLoad + strengthLoad;

    // 2. Weight Trend
    const weightEntries = await prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 2
    });
    const currentWeight = weightEntries[0]?.weight || 0;
    const prevWeight = weightEntries[1]?.weight || currentWeight;
    const weightChange = currentWeight - prevWeight;

    // 3. Health Metrics (HRV, Sleep)
    const hrvMetrics = await prisma.healthMetric.findMany({
      where: { userId, type: "HRV", date: { gte: last7d } },
      orderBy: { date: "desc" }
    });
    const avgHRV = hrvMetrics.length > 0 
      ? hrvMetrics.reduce((acc: number, m: HealthMetric) => acc + m.value, 0) / hrvMetrics.length 
      : 0;

    const sleepMetrics = await prisma.healthMetric.findMany({
      where: { userId, type: "Sleep", date: { gte: last7d } },
      orderBy: { date: "desc" }
    });
    const avgSleep = sleepMetrics.length > 0 
      ? sleepMetrics.reduce((acc: number, m: HealthMetric) => acc + m.value, 0) / sleepMetrics.length / 3600
      : 0;

    // 4. Activity History
    const recentBjj = bjjSessions7d.slice(0, 3).map((s: BjjSession) => ({
      title: s.type,
      timeAgo: this.getTimeAgo(s.date),
      subtitle: `${s.duration} min • RPE ${s.rpe}`,
      type: "bjj"
    }));
    const recentStrength = strengthWorkouts7d.slice(0, 3).map((w: HevyWorkout) => ({
      title: w.title || "Strength Session",
      timeAgo: this.getTimeAgo(w.startedAt),
      subtitle: `${Math.round((w.durationSeconds || 0) / 60)} min • Focus: ${w.title}`,
      type: "strength"
    }));

    // 5. Last Hevy Workout
    const lastHevyWorkout = await prisma.hevyWorkout.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" }
    });

    return {
      kpi: {
        totalWeeklyLoad: {
          value: Math.round(totalWeeklyLoad),
          unit: "TSS",
          change: `${Math.round((totalWeeklyLoad / targets.weeklyLoad) * 100)}%`,
          trend: totalWeeklyLoad > targets.weeklyLoad ? "up" : "down"
        },
        bodyWeight: {
          value: currentWeight.toFixed(1),
          unit: "kg",
          change: `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg`,
          trend: weightChange > 0 ? "up" : "down"
        },
        avgSleep: {
          value: avgSleep.toFixed(1),
          unit: "hrs",
          change: `${Math.round((avgSleep / targets.sleep) * 100)}%`,
          trend: avgSleep < targets.sleep ? "down" : "up"
        },
        readiness: {
          value: avgHRV > 60 ? 92 : avgHRV > 40 ? 75 : 45,
          unit: "%",
          change: "+5%",
          trend: "up"
        }
      },
      activity: [...recentBjj, ...recentStrength].sort((a, b) => 0.5 - Math.random()),
      lastHevyWorkout
    };
  }

  private getTimeAgo(date: Date) {
    const diff = new Date().getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }
}
