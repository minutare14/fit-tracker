"use client";

import { AppShell } from "@/modules/core/ui/app-shell";
import { MetricTile } from "@/modules/core/ui/metric-tile";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { getInsightsOverview } from "@/modules/insights/api/get-insights-overview";

export function InsightsPageRoute() {
  const resource = useViewResource({
    scope: "insights-page",
    fetcher: getInsightsOverview,
    isEmpty: (data) => !data || (!data.hasEnoughData && data.patterns.length === 0 && data.gaps.length === 0),
  });

  const statusBadges = resource.data ? (
    <>
      <StatusBadge
        label={resource.data.hasEnoughData ? "Dados suficientes" : "Dados parciais"}
        tone={resource.data.hasEnoughData ? "success" : "warning"}
      />
      <StatusBadge label={`BJJ ${resource.data.sessionFrequency.bjjSessionsLast30Days}/30d`} />
      <StatusBadge label={`Forca ${resource.data.sessionFrequency.strengthSessionsLast30Days}/30d`} />
    </>
  ) : null;

  const renderBlocks = (
    title: string,
    eyebrow: string,
    items: { title: string; detail: string; tone: string }[],
    emptyText: string
  ) => (
    <SurfaceCard eyebrow={eyebrow} title={title}>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={`${title}-${item.title}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300"
            >
              <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
              <p className="mt-1">{item.detail}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500 dark:border-zinc-800 dark:text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </SurfaceCard>
  );

  return (
    <AppShell
      title="Insights"
      subtitle="Leituras operacionais de padroes, gaps, impacto de ausencia de dados e relacao entre carga, recuperacao e peso."
      statusBadges={statusBadges}
    >
      <div className="space-y-8">
        {resource.isLoading ? (
          <StatePanel
            eyebrow="Insights"
            title="Carregando sinais operacionais"
            description="Consolidando padroes, lacunas e recomendacoes sustentadas pelos dados atuais."
          />
        ) : resource.isError || !resource.data ? (
          <StatePanel
            eyebrow="Insights"
            title="Erro ao carregar insights"
            description={resource.error?.message ?? "Nao foi possivel carregar os insights."}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Readiness"
                value={resource.data.readiness.score !== null ? `${resource.data.readiness.score}%` : "--"}
                helper={resource.data.readiness.explanation}
                tone="primary"
              />
              <MetricTile
                label="ACWR"
                value={resource.data.loadRecovery.acwr !== null ? `${resource.data.loadRecovery.acwr}` : "--"}
                helper={resource.data.loadRecovery.explanation}
              />
              <MetricTile
                label="Peso atual"
                value={
                  resource.data.weightTrend.currentWeight !== null
                    ? `${resource.data.weightTrend.currentWeight} kg`
                    : "--"
                }
                helper={resource.data.weightTrend.explanation}
              />
              <MetricTile
                label="Media semanal BJJ"
                value={
                  resource.data.sessionFrequency.weeklyAverage !== null
                    ? `${resource.data.sessionFrequency.weeklyAverage}`
                    : "--"
                }
                helper={resource.data.sessionFrequency.explanation}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {renderBlocks("Padroes", "Patterns", resource.data.patterns, "Sem padroes relevantes ainda.")}
              {renderBlocks("Gaps", "Gaps", resource.data.gaps, "Sem gaps criticos identificados.")}
              {renderBlocks(
                "Recomendacoes operacionais",
                "Recommendations",
                resource.data.recommendations,
                "Sem recomendacoes operacionais no momento."
              )}
              {renderBlocks(
                "Impacto da ausencia de dados",
                "Data impact",
                resource.data.dataImpact,
                "As principais leituras ja contam com cobertura suficiente."
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
