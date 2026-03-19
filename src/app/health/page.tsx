"use client";

import { useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { QueryState } from "@/components/states/QueryState";
import { useAsyncResource } from "@/hooks/useAsyncResource";

interface HealthOverviewResponse {
  syncStatus: {
    connected: boolean;
    lastSync: string | null;
    totalRecords: number;
    status: string;
  };
  metrics: {
    hrv: { value: number; unit: string } | null;
    restingHr: { value: number; unit: string } | null;
    bodyTemp: { value: number; unit: string } | null;
    sleep: number | null;
    readinessScore: number | null;
  };
  series: Array<{
    date: string;
    hrv: number | null;
    sleepHours: number | null;
    load: number | null;
    recovery: number | null;
  }>;
  recommendations: string[];
}

const shellState = (title: string, description: string) => (
  <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
    <Sidebar />
    <main className="ml-64 flex flex-1 items-center justify-center p-8">
      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Recovery</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </main>
  </div>
);

const MetricCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</p>
    <p className="mt-4 text-3xl font-black text-slate-900 dark:text-slate-100">{value}</p>
    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
  </div>
);

export default function HealthPage() {
  const fetchOverview = useCallback(async (): Promise<HealthOverviewResponse> => {
    const response = await fetch("/api/health/overview", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Failed to fetch health overview");
    }

    return response.json() as Promise<HealthOverviewResponse>;
  }, []);

  const resource = useAsyncResource<HealthOverviewResponse>({
    scope: "health-overview-page",
    fetcher: fetchOverview,
    isEmpty: (data) => !data || (!data.syncStatus.totalRecords && !data.series.some((point) => point.hrv || point.sleepHours || point.load)),
  });

  return (
    <QueryState
      data={resource.data}
      isLoading={resource.isLoading}
      isEmpty={resource.isEmpty}
      error={resource.error}
      loadingFallback={shellState("Carregando recuperação", "Buscando métricas reais, readiness e histórico recebido via webhook.")}
      emptyFallback={shellState("Nenhum dado de saúde ainda", "Configure o Health Auto Export e envie o primeiro payload para popular esta área.")}
      errorFallback={shellState("Erro ao carregar recuperação", "A página não conseguiu montar o overview real de saúde e recuperação.")}
    >
      {(data) => (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
          <Sidebar />

          <main className="ml-64 flex min-w-0 flex-1 flex-col">
            <PageHeader
              title="Recuperação & Saúde"
              action={
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Última sync</p>
                  <p className="text-sm font-bold text-primary">
                    {data.syncStatus.lastSync ? new Date(data.syncStatus.lastSync).toLocaleString() : "Aguardando webhook"}
                  </p>
                </div>
              }
            />

            <div className="mx-auto w-full max-w-7xl space-y-8 p-8">
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Readiness"
                  value={data.metrics.readinessScore !== null ? `${data.metrics.readinessScore}%` : "--"}
                  helper="Calculado a partir das derivadas persistidas no backend."
                />
                <MetricCard
                  label="HRV"
                  value={data.metrics.hrv ? `${Math.round(data.metrics.hrv.value)} ${data.metrics.hrv.unit}` : "--"}
                  helper="Última leitura recebida do Health Auto Export."
                />
                <MetricCard
                  label="RHR"
                  value={data.metrics.restingHr ? `${Math.round(data.metrics.restingHr.value)} ${data.metrics.restingHr.unit}` : "--"}
                  helper="Frequência cardíaca de repouso mais recente."
                />
                <MetricCard
                  label="Sono"
                  value={data.metrics.sleep !== null ? `${data.metrics.sleep.toFixed(1)} h` : "--"}
                  helper="Horas de sono extraídas dos dados normalizados."
                />
              </section>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Últimos 14 dias</p>
                      <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">Carga, HRV e recuperação</h2>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      {data.syncStatus.totalRecords} registros ingeridos
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
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
                        {data.series.map((point) => (
                          <tr key={point.date}>
                            <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{point.date}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{point.hrv ?? "--"}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{point.sleepHours ?? "--"}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{point.load ?? "--"}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{point.recovery ?? "--"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Protocolo</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">Leitura operacional</h2>
                  <div className="mt-6 space-y-4">
                    {data.recommendations.map((item) => (
                      <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      )}
    </QueryState>
  );
}
