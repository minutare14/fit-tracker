"use client";

import { AppShell } from "@/modules/core/ui/app-shell";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { getRecoveryOverview } from "@/modules/recovery/api/get-recovery-overview";
import { RecoveryWidget } from "@/modules/recovery/components/recovery-widget";

export function RecoveryPage() {
  const resource = useViewResource({
    scope: "recovery-page",
    fetcher: getRecoveryOverview,
    isEmpty: (data) => !data || !data.hasMinimumData,
  });

  const statusBadges = resource.data ? (
    <>
      <StatusBadge
        label={resource.data.syncStatus.connected ? "Webhook conectado" : "Webhook aguardando payload"}
        tone={resource.data.syncStatus.connected ? "success" : "warning"}
      />
      <StatusBadge
        label={
          resource.data.syncStatus.lastSync
            ? `Ultima sync ${new Date(resource.data.syncStatus.lastSync).toLocaleString("pt-BR")}`
            : "Sem ultima sync"
        }
        tone="default"
      />
      <StatusBadge label={`${resource.data.syncStatus.totalRecords} registros`} tone="default" />
    </>
  ) : null;

  return (
    <AppShell
      title="Health & Recovery"
      subtitle="Widgets independentes de HRV, sono, RHR, temperatura e readiness, sem derrubar a tela inteira quando faltar uma fonte."
      statusBadges={statusBadges}
    >
      <div className="space-y-8">
        {resource.isLoading ? (
          <StatePanel
            eyebrow="Recovery"
            title="Carregando visao de recuperacao"
            description="Buscando as metricas recebidas via webhook, derivadas persistidas e historico dos ultimos dias."
          />
        ) : resource.isError ? (
          <StatePanel
            eyebrow="Recovery"
            title="Erro ao carregar recuperacao"
            description={resource.error?.message ?? "Nao foi possivel carregar a visao de recuperacao."}
            actions={
              <button
                type="button"
                onClick={() => void resource.refetch()}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark"
              >
                Tentar novamente
              </button>
            }
          />
        ) : resource.isEmpty || !resource.data ? (
          <StatePanel
            eyebrow="Recovery"
            title="Dados de recuperacao ainda insuficientes"
            description="A pagina agora diferencia estado vazio real de erro. Configure o Health Auto Export e envie o primeiro payload."
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <RecoveryWidget metric={resource.data.metrics.readiness} />
              <RecoveryWidget metric={resource.data.metrics.hrv} />
              <RecoveryWidget metric={resource.data.metrics.restingHr} />
              <RecoveryWidget metric={resource.data.metrics.sleep} />
              <RecoveryWidget metric={resource.data.metrics.temperature} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
              <SurfaceCard eyebrow="Tendencia" title="Ultimos 14 dias">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="pb-3">Data</th>
                        <th className="pb-3">HRV</th>
                        <th className="pb-3">Sono</th>
                        <th className="pb-3">Carga</th>
                        <th className="pb-3">Recovery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {resource.data.trend.map((point) => (
                        <tr key={point.date}>
                          <td className="py-3 font-medium text-slate-900 dark:text-white">{point.date}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{point.hrv ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{point.sleepHours ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{point.load ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{point.recovery ?? "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>

              <SurfaceCard eyebrow="Leitura operacional" title="Recomendacoes">
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
