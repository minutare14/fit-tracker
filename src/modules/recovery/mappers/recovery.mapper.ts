import { RecoveryOverview, RecoveryMetricCard } from "@/modules/recovery/types/recovery.types";

const fallbackMetric = (label: string): RecoveryMetricCard => ({
  label,
  value: null,
  unit: "",
  helper: "Dado indisponivel no momento.",
});

export function mapRecoveryOverview(input: Partial<RecoveryOverview> | undefined): RecoveryOverview {
  if (!input) {
    return {
      syncStatus: { connected: false, lastSync: null, totalRecords: 0, status: "DISCONNECTED" },
      metrics: {
        readiness: fallbackMetric("Readiness"),
        hrv: fallbackMetric("HRV"),
        restingHr: fallbackMetric("RHR"),
        sleep: fallbackMetric("Sono"),
        temperature: fallbackMetric("Temperatura"),
      },
      trend: [],
      recommendations: ["Sem dados de recuperacao."],
      hasMinimumData: false,
    };
  }

  const metrics = input.metrics || {} as Partial<RecoveryOverview["metrics"]>;

  return {
    syncStatus: input.syncStatus ?? { connected: false, lastSync: null, totalRecords: 0, status: "DISCONNECTED" },
    metrics: {
      readiness: metrics.readiness ?? fallbackMetric("Readiness"),
      hrv: metrics.hrv ?? fallbackMetric("HRV"),
      restingHr: metrics.restingHr ?? fallbackMetric("RHR"),
      sleep: metrics.sleep ?? fallbackMetric("Sono"),
      temperature: metrics.temperature ?? fallbackMetric("Temperatura"),
    },
    trend: input.trend ?? [],
    recommendations: input.recommendations ?? [],
    hasMinimumData: Boolean(input.hasMinimumData),
  };
}
