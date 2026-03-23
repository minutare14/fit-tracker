import { InsightBlock, InsightsOverview } from "../types/insights.types";

const normalizeTone = (value: unknown): InsightBlock["tone"] =>
  value === "warning" || value === "success" || value === "danger" ? value : "info";

const mapBlock = (value: unknown): InsightBlock => {
  if (!value || typeof value !== "object") {
    return { title: "Sem bloco", detail: "Informacao indisponivel.", tone: "info" };
  }

  const record = value as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : "Sem titulo",
    detail: typeof record.detail === "string" ? record.detail : "Informacao indisponivel.",
    tone: normalizeTone(record.tone),
  };
};

const mapBlocks = (value: unknown): InsightBlock[] =>
  Array.isArray(value) ? value.map((item) => mapBlock(item)) : [];

export function mapInsightsOverview(input: Partial<InsightsOverview> | undefined): InsightsOverview {
  return {
    readiness: {
      status:
        input?.readiness?.status === "available" ||
        input?.readiness?.status === "partial" ||
        input?.readiness?.status === "missing"
          ? input.readiness.status
          : "missing",
      score: typeof input?.readiness?.score === "number" ? input.readiness.score : null,
      explanation: input?.readiness?.explanation ?? "Sem readiness consolidada.",
      missingInputs: input?.readiness?.missingInputs ?? [],
    },
    patterns: mapBlocks(input?.patterns),
    gaps: mapBlocks(input?.gaps),
    recommendations: mapBlocks(input?.recommendations),
    dataImpact: mapBlocks(input?.dataImpact),
    loadRecovery: {
      status:
        input?.loadRecovery?.status === "available" ||
        input?.loadRecovery?.status === "partial" ||
        input?.loadRecovery?.status === "missing"
          ? input.loadRecovery.status
          : "missing",
      acuteLoad: typeof input?.loadRecovery?.acuteLoad === "number" ? input.loadRecovery.acuteLoad : null,
      chronicLoad: typeof input?.loadRecovery?.chronicLoad === "number" ? input.loadRecovery.chronicLoad : null,
      acwr: typeof input?.loadRecovery?.acwr === "number" ? input.loadRecovery.acwr : null,
      readinessTrend:
        typeof input?.loadRecovery?.readinessTrend === "number"
          ? input.loadRecovery.readinessTrend
          : null,
      explanation: input?.loadRecovery?.explanation ?? "Sem leitura consolidada de carga x recuperacao.",
    },
    weightTrend: {
      status:
        input?.weightTrend?.status === "available" ||
        input?.weightTrend?.status === "partial" ||
        input?.weightTrend?.status === "missing"
          ? input.weightTrend.status
          : "missing",
      currentWeight: typeof input?.weightTrend?.currentWeight === "number" ? input.weightTrend.currentWeight : null,
      previousWeight:
        typeof input?.weightTrend?.previousWeight === "number" ? input.weightTrend.previousWeight : null,
      deltaFromPrevious:
        typeof input?.weightTrend?.deltaFromPrevious === "number"
          ? input.weightTrend.deltaFromPrevious
          : null,
      avg7d: typeof input?.weightTrend?.avg7d === "number" ? input.weightTrend.avg7d : null,
      explanation: input?.weightTrend?.explanation ?? "Sem tendencia de peso consolidada.",
    },
    sessionFrequency: {
      status:
        input?.sessionFrequency?.status === "available" ||
        input?.sessionFrequency?.status === "partial" ||
        input?.sessionFrequency?.status === "missing"
          ? input.sessionFrequency.status
          : "missing",
      bjjSessionsLast30Days: input?.sessionFrequency?.bjjSessionsLast30Days ?? 0,
      strengthSessionsLast30Days: input?.sessionFrequency?.strengthSessionsLast30Days ?? 0,
      weeklyAverage:
        typeof input?.sessionFrequency?.weeklyAverage === "number"
          ? input.sessionFrequency.weeklyAverage
          : null,
      explanation: input?.sessionFrequency?.explanation ?? "Sem frequencia consolidada.",
    },
    hasEnoughData: Boolean(input?.hasEnoughData),
  };
}
