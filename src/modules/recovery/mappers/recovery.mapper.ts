import { RecoveryMetricCard, RecoveryOverview } from "../types/recovery.types";

const fallbackMetric = (label: string): RecoveryMetricCard => ({
  label,
  status: "missing",
  value: null,
  unit: null,
  helper: "Dado indisponivel no momento.",
  observedAt: null,
  source: null,
  reasonUnavailable: "Sem dados recentes.",
  missingInputs: [],
});

const normalizeMetric = (metric: unknown, label: string): RecoveryMetricCard => {
  if (!metric || typeof metric !== "object") {
    return fallbackMetric(label);
  }

  const record = metric as Record<string, unknown>;
  return {
    label: typeof record.label === "string" ? record.label : label,
    status:
      record.status === "available" || record.status === "partial" || record.status === "missing"
        ? record.status
        : "missing",
    value: typeof record.value === "number" && Number.isFinite(record.value) ? record.value : null,
    unit: typeof record.unit === "string" ? record.unit : null,
    helper: typeof record.helper === "string" ? record.helper : "Dado indisponivel no momento.",
    observedAt: typeof record.observedAt === "string" ? record.observedAt : null,
    source: typeof record.source === "string" ? record.source : null,
    reasonUnavailable:
      typeof record.reasonUnavailable === "string" ? record.reasonUnavailable : null,
    missingInputs: Array.isArray(record.missingInputs)
      ? record.missingInputs.filter((item): item is string => typeof item === "string")
      : [],
  };
};

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

  const metrics = (input.metrics ?? {}) as Partial<RecoveryOverview["metrics"]>;

  return {
    syncStatus: input.syncStatus ?? { connected: false, lastSync: null, totalRecords: 0, status: "DISCONNECTED" },
    metrics: {
      readiness: normalizeMetric(metrics.readiness, "Readiness"),
      hrv: normalizeMetric(metrics.hrv, "HRV"),
      restingHr: normalizeMetric(metrics.restingHr, "RHR"),
      sleep: normalizeMetric(metrics.sleep, "Sono"),
      temperature: normalizeMetric(metrics.temperature, "Temperatura"),
    },
    trend: input.trend ?? [],
    recommendations: input.recommendations ?? [],
    hasMinimumData: Boolean(input.hasMinimumData),
  };
}
