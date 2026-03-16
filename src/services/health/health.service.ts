import prisma from "@/lib/prisma";
import { IntegrationProvider } from "@prisma/client";

export interface HealthAutoExportPayload {
  data: {
    metrics: Array<{
      name: string;
      units: string;
      data: Array<{
        date: string;
        qty?: number;
        value?: number;
        avg?: number;
        [key: string]: any;
      }>;
    }>;
    workouts?: Array<any>;
  };
}

export class HealthService {
  async processWebhook(payload: HealthAutoExportPayload, userId: string = "default-user") {
    // 1. Store Raw Event for Auditing
    await prisma.rawEvent.create({
      data: {
        userId,
        provider: IntegrationProvider.HEALTH_AUTO_EXPORT,
        payloadJson: payload as any,
        status: "RECEIVED",
      },
    });

    const metrics = payload.data.metrics || [];
    const results = {
      processed: 0,
      errors: 0
    };

    // 2. Parse Metrics
    for (const metric of metrics) {
      const type = this.mapMetricType(metric.name);
      if (!type) continue;

      for (const entry of metric.data) {
        try {
          const value = entry.qty ?? entry.value ?? entry.avg;
          if (value === undefined) continue;
          const date = new Date(entry.date);

          await prisma.healthMetric.upsert({
            where: {
              userId_date_type: {
                userId,
                date,
                type,
              }
            },
            update: {
              value,
              unit: metric.units,
            },
            create: {
              userId,
              date,
              type,
              value,
              unit: metric.units,
              source: IntegrationProvider.HEALTH_AUTO_EXPORT,
            }
          });

          // 3. Special Case: Nutrition Rollup
          if (this.isNutritionMetric(metric.name)) {
            await this.rollupNutrition(userId, date);
          }
          
          results.processed++;
        } catch (err) {
          console.error(`Error processing metric ${metric.name}`, err);
          results.errors++;
        }
      }
    }

    return results;
  }

  private isNutritionMetric(name: string): boolean {
    return [
      "dietary_energy", "carbohydrates", "protein", "total_fat", 
      "fiber", "dietary_water", "sodium"
    ].includes(name);
  }

  private async rollupNutrition(userId: string, date: Date) {
    // Normalize date to 00:00:00
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const metrics = await prisma.healthMetric.findMany({
      where: {
        userId,
        date: { gte: d, lt: new Date(d.getTime() + 24 * 60 * 60 * 1000) },
        source: IntegrationProvider.HEALTH_AUTO_EXPORT
      }
    });

    const rollup: any = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      waterLiters: 0
    };

    metrics.forEach((m: any) => {
      if (m.type === "Calories") rollup.calories += m.value;
      if (m.type === "Protein") rollup.protein += m.value;
      if (m.type === "Carbs") rollup.carbs += m.value;
      if (m.type === "Fat") rollup.fat += m.value;
      if (m.type === "Fiber") rollup.fiber += m.value;
      if (m.type === "Water") rollup.waterLiters += (m.value / 1000); // ml to L
    });

    await prisma.nutritionDaily.upsert({
      where: { userId_date: { userId, date: d } },
      update: rollup,
      create: { 
        userId, 
        date: d, 
        ...rollup,
        source: IntegrationProvider.HEALTH_AUTO_EXPORT 
      }
    });
  }

  private mapMetricType(name: string): string | null {
    const maps: Record<string, string> = {
      "heart_rate_variability_sdnn": "HRV",
      "resting_heart_rate": "RHR",
      "sleep_analysis": "Sleep",
      "body_mass": "Weight",
      "active_energy": "ActiveCalories",
      "basal_energy_burned": "BasalCalories",
      "step_count": "Steps",
      "apple_exercise_time": "ExerciseTime",
      "dietary_energy": "Calories",
      "carbohydrates": "Carbs",
      "protein": "Protein",
      "total_fat": "Fat",
      "fiber": "Fiber",
      "dietary_water": "Water"
    };
    return maps[name] || null;
  }

  async getSyncStatus(userId: string) {
    const lastUpdate = await prisma.rawEvent.findFirst({
      where: { userId, provider: IntegrationProvider.HEALTH_AUTO_EXPORT },
      orderBy: { receivedAt: "desc" }
    });

    const metricsCount = await prisma.healthMetric.count({
      where: { userId, source: IntegrationProvider.HEALTH_AUTO_EXPORT }
    });

    return {
      connected: !!lastUpdate,
      lastSync: lastUpdate?.receivedAt || null,
      totalRecords: metricsCount,
      status: lastUpdate ? "Active" : "Pending"
    };
  }
}
