"use client";

import { getInsightsOverview } from "@/modules/insights/api/get-insights-overview";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { AppShell } from "@/modules/core/ui/app-shell";
import { MetricTile } from "@/modules/core/ui/metric-tile";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";

export function InsightsPageRoute() {
  const resource = useViewResource({
    scope: "insights-page",
    fetcher: getInsightsOverview,
    isEmpty: (data) => !data || (!data.hasEnoughData && data.dataGaps.length === 0),
  });

  const statusBadges = resource.data ? (
    <>
      <StatusBadge
        label={resource.data.hasEnoughData ? "Dados suficientes" : "Dados parciais"}
        tone={resource.data.hasEnoughData ? "success" : "warning"}
      />
      <StatusBadge label={`BJJ ${resource.data.bjjSessionsLast30Days}/30d`} />
      <StatusBadge label={`Saude ${resource.data.healthRecordsLast14Days}/14d`} />
    </>
  ) : null;

  return (
    <AppShell
      title="Insights"
      subtitle="Os insights agora deixam de inventar correlações e passam a refletir apenas o que o banco realmente sustenta."
      statusBadges={statusBadges}
    >
      <div className="space-y-8">
        {resource.isLoading ? (
          <StatePanel eyebrow="Insights" title="Carregando sinais reais" description="Consolidando disponibilidade de dados e recomendações que o sistema consegue sustentar." />
        ) : resource.isError || !resource.data ? (
          <StatePanel eyebrow="Insights" title="Erro ao carregar insights" description={resource.error?.message ?? "Nao foi possivel carregar os insights."} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Readiness" value={resource.data.readiness !== null ? `${resource.data.readiness}%` : "--"} helper="Ultima derivada persistida." tone="primary" />
              <MetricTile label="Carga agregada" value={String(resource.data.weeklyLoad)} helper="Carga de BJJ considerada nas ultimas duas semanas." />
              <MetricTile label="BJJ 30 dias" value={String(resource.data.bjjSessionsLast30Days)} helper="Sessoes reais usadas como base." />
              <MetricTile label="Forca 30 dias" value={String(resource.data.strengthSessionsLast30Days)} helper="Treinos sincronizados do Hevy." />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SurfaceCard eyebrow="Gaps" title="Lacunas de dados">
                <div className="space-y-3">
                  {resource.data.dataGaps.length ? (
                    resource.data.dataGaps.map((gap) => (
                      <div key={gap} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                        {gap}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      O conjunto atual de dados ja suporta leituras mais profundas.
                    </div>
                  )}
                </div>
              </SurfaceCard>

              <SurfaceCard eyebrow="Recomendacoes" title="Proximo passo mais util">
                <div className="space-y-3">
                  {resource.data.recommendations.map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
