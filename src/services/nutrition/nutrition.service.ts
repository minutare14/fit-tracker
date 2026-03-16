import { NutritionDaily } from "@prisma/client";
import prisma from "@/lib/prisma";

export class NutritionService {
  async getDailyLog(userId: string, date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.nutritionDaily.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
  }

  async upsertLog(userId: string, data: {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterLiters?: number;
    adherent?: boolean;
    notes?: string;
  }) {
    const logDate = new Date(data.date);
    logDate.setHours(0, 0, 0, 0); // Normalize to start of day for the unique constraint

    return await prisma.nutritionDaily.upsert({
      where: {
        userId_date: {
          userId,
          date: logDate
        }
      },
      update: {
        calories: Number(data.calories),
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat),
        waterLiters: data.waterLiters ?? 0,
        adherent: !!data.adherent,
        notes: data.notes ?? null,
      },
      create: {
        userId,
        date: logDate,
        calories: Number(data.calories),
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat),
        waterLiters: data.waterLiters ?? 0,
        adherent: !!data.adherent,
        notes: data.notes ?? null,
      }
    });
  }

  async getNutritionStats(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();
    const last7dDate = new Date();
    last7dDate.setDate(now.getDate() - 7);
    
    const last7d = await prisma.nutritionDaily.findMany({
      where: {
        userId,
        date: { gte: last7dDate }
      },
      orderBy: { date: "desc" }
    });

    const avgCalories = last7d.length > 0 
      ? last7d.reduce((acc: number, log: any) => acc + (log.calories || 0), 0) / last7d.length 
      : 0;
    
    const adherenceRate = last7d.length > 0
      ? (last7d.filter((log: any) => log.adherent).length / last7d.length) * 100
      : 0;

    return {
      avgCalories: Math.round(avgCalories),
      adherenceRate: Math.round(adherenceRate),
      logs: last7d,
      targets: {
        calories: user?.caloriesTarget || 2500,
        protein: user?.proteinTarget || 160,
        carbs: user?.carbsTarget || 300,
        fat: user?.fatTarget || 70,
      }
    };
  }
}
