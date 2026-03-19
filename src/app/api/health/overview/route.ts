import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/prisma";
import { resolveUserId } from "@/lib/current-user";
import { HealthService } from "@/services/health/health.service";

export const dynamic = "force-dynamic";

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const formatMetric = (value?: number | null, unit?: string | null) => {
  if (value === null || value === undefined) {
    return null;
  }

  return {
    value,
    unit: unit ?? "",
  };
};

export async function GET(req: NextRequest) {
  noStore();

  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));
    const now = new Date();
    const last14Days = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));
    const healthService = new HealthService();

    const [syncStatus, metrics, derivedMetrics, nutritionDaily] = await Promise.all([
      healthService.getSyncStatus(userId),
      prisma.healthMetric.findMany({
        where: {
          userId,
          date: { gte: last14Days },
        },
        orderBy: { date: "asc" },
      }),
      prisma.derivedMetric.findMany({
        where: {
          userId,
          date: { gte: last14Days },
        },
        orderBy: { date: "asc" },
      }),
      prisma.nutritionDaily.findFirst({
        where: {
          userId,
          date: { gte: startOfDay(now) },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    const latestByType = new Map<string, (typeof metrics)[number]>();
    for (const metric of metrics) {
      latestByType.set(metric.type, metric);
    }

    const series = Array.from({ length: 14 }).map((_, index) => {
      const date = startOfDay(new Date(last14Days.getTime() + index * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().slice(0, 10);
      const hrv = metrics.find((metric) => metric.type === "HRV" && metric.date.toISOString().slice(0, 10) === dateKey);
      const sleep = metrics.find((metric) => metric.type === "Sleep" && metric.date.toISOString().slice(0, 10) === dateKey);
      const derived = derivedMetrics.find((metric) => metric.date.toISOString().slice(0, 10) === dateKey);

      return {
        date: dateKey,
        hrv: hrv?.value ?? null,
        sleepHours: sleep ? Number((sleep.value / 3600).toFixed(1)) : null,
        load: derived?.weeklyLoad ?? null,
        recovery: derived?.recovery ?? null,
      };
    });

    const latestDerived = derivedMetrics[derivedMetrics.length - 1] ?? null;
    const readinessScore = latestDerived?.recovery ?? null;
    const recommendations = [
      readinessScore !== null
        ? readinessScore >= 80
          ? "Readiness alta: o sistema indica boa janela para treino intenso."
          : readinessScore >= 60
            ? "Readiness moderada: priorize qualidade de sono e ajuste a carga do dia."
            : "Readiness baixa: o backend sugere reduzir intensidade e focar em recuperação."
        : "Ainda não há base suficiente para sugerir readiness real.",
      syncStatus.lastSync
        ? `Ultima sincronizacao recebida em ${new Date(syncStatus.lastSync).toLocaleString()}.`
        : "Nenhum payload do Health Auto Export foi recebido ainda.",
      nutritionDaily
        ? `Nutrição de hoje: ${nutritionDaily.calories} kcal e ${nutritionDaily.waterLiters.toFixed(1)}L de agua.`
        : "Sem rollup nutricional de hoje no banco.",
    ];

    return NextResponse.json({
      syncStatus,
      metrics: {
        hrv: formatMetric(latestByType.get("HRV")?.value, latestByType.get("HRV")?.unit),
        restingHr: formatMetric(latestByType.get("RHR")?.value, latestByType.get("RHR")?.unit),
        bodyTemp: formatMetric(latestByType.get("BodyTemp")?.value, latestByType.get("BodyTemp")?.unit),
        sleep: latestByType.get("Sleep")?.value ? Number((latestByType.get("Sleep")!.value / 3600).toFixed(1)) : null,
        readinessScore,
      },
      series,
      recommendations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
