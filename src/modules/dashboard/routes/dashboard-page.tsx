"use client";

import Link from "next/link";
import { useState } from "react";
import { getDashboardOverview } from "@/modules/dashboard/api/get-dashboard-overview";
import { DashboardTrendTable } from "@/modules/dashboard/components/dashboard-trend-table";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { requestJson } from "@/modules/core/api/http-client";
import { AppShell } from "@/modules/core/ui/app-shell";
import { MetricTile } from "@/modules/core/ui/metric-tile";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { resolveAppErrorMessage } from "@/modules/core/api/app-error";

export function DashboardPage() {
  const resource = useViewResource({
    scope: "dashboard-page",
    fetcher: getDashboardOverview,
    isEmpty: (data) => !data || !data.hasAnyData,
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleHevySync = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      await requestJson("/api/settings/integrations/hevy/sync", {
        method: "POST",
        body: JSON.stringify({ mode: "delta" }),
      });
      setSyncMessage("Sincronizacao do Hevy concluida.");
      await resource.refetch();
    } catch (error) {
      setSyncMessage(resolveAppErrorMessage(error as Error));
    } finally {
      setSyncing(false);
    }
  };

  const statusBadges = resource.data?.sources.map((source) => (
    <StatusBadge
      key={source.label}
      label={`${source.label} · ${source.detail}`}
      tone={source.state === "connected" ? "success" : source.state === "warning" ? "warning" : "danger"}
    />
  ));

  const actions = (
    <>
      <button
        type="button"
        onClick={handleHevySync}
        disabled={syncing}
        className="rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
      >
        {syncing ? "Sincronizando..." : "Sincronizar agora"}
      </button>
      <Link
        href="/bjj"
        className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark transition-opacity hover:opacity-90"
      >
        Registrar sessao
      </Link>
      <Link
        href="/settings"
        className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
      >
        Editar perfil
      </Link>
    </>
  );

  return (
    <AppShell
      title="Dashboard"
      subtitle="Visao consolidada de carga, recuperacao e composicao, com estados reais para dados presentes, parciais ou ausentes."
      statusBadges={statusBadges}
      actions={actions}
    >
      <div className="space-y-8">
        {syncMessage ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-slate-200">
            {syncMessage}
          </div>
        ) : null}

        {resource.isLoading ? (
          <StatePanel
            eyebrow="Dashboard"
            title="Carregando visao operacional"
            description="Montando KPIs, fontes de dados e historico real do atleta."
          />
        ) : resource.isError ? (
          <StatePanel
            eyebrow="Dashboard"
            title="Falha ao carregar dashboard"
            description={resource.error?.message ?? "A rota principal do dashboard falhou."}
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
            eyebrow="Dashboard"
            title="Ainda nao ha dados suficientes"
            description="Em vez de um card solto, o onboarding agora mostra acoes reais para conectar fontes e criar os primeiros registros."
            actions={
              <>
                <Link href="/settings" className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark">
                  Conectar fontes
                </Link>
                <Link href="/bjj" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 dark:border-zinc-800 dark:text-slate-300">
                  Registrar primeira sessao
                </Link>
              </>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {resource.data.metrics.map((metric) => (
                <MetricTile key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.label === "Readiness" ? "primary" : "default"} />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
              <DashboardTrendTable points={resource.data.trend} />

              <SurfaceCard eyebrow="Acoes recomendadas" title="Proximos passos">
                <div className="space-y-3">
                  {resource.data.recommendations.map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>

            <SurfaceCard eyebrow="Ultimas sessoes" title="Historico recente">
              <div className="space-y-4">
                {resource.data.recentSessions.length ? (
                  resource.data.recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          {new Date(session.date).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{session.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session.subtitle}</p>
                      </div>
                      <StatusBadge label={`Carga ${session.load}`} tone="success" />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500 dark:border-zinc-800 dark:text-slate-400">
                    Nenhuma sessao recente persistida ainda.
                  </div>
                )}
              </div>
            </SurfaceCard>
          </>
        )}
      </div>
    </AppShell>
  );
}
