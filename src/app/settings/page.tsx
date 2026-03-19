"use client";

import { useCallback, useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import IntegrationCard from "@/components/IntegrationCard";
import HevyConfigModal from "@/components/HevyConfigModal";
import HealthWebhookConfig from "@/components/HealthWebhookConfig";
import ProfileSettingsForm from "@/components/settings/ProfileSettingsForm";
import { QueryState } from "@/components/states/QueryState";
import { useAsyncResource } from "@/hooks/useAsyncResource";

interface Connection {
  id: string;
  provider: string;
  isEnabled: boolean;
  status: string;
  lastSyncAt: string | null;
}

interface SyncRun {
  id: string;
  startedAt: string;
  provider: string;
  status: string;
  recordsCount: number;
  errorMessage: string | null;
}

interface IntegrationStats {
  hevy: {
    workoutsCount: number;
    routinesCount: number;
  };
  successRate: number;
  avgSyncTime: number;
  totalErrors: number;
}

interface IntegrationPageData {
  connections: Connection[];
  syncRuns: SyncRun[];
  stats: IntegrationStats | null;
}

const centeredState = (title: string, description: string) => (
  <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
    <Sidebar />
    <main className="ml-64 flex flex-1 items-center justify-center p-8">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Integrations</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </main>
  </div>
);

export default function SettingsPage() {
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [isHevyModalOpen, setIsHevyModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const userId = "default-user";

  const fetchData = useCallback(async (): Promise<IntegrationPageData> => {
    const res = await fetch("/api/integrations", { cache: "no-store" });

    if (!res.ok) {
      throw new Error("Failed to fetch integration data");
    }

    const payload = (await res.json()) as Partial<IntegrationPageData>;
    return {
      connections: payload.connections ?? [],
      syncRuns: payload.syncRuns ?? [],
      stats: payload.stats ?? null,
    };
  }, []);

  const integrations = useAsyncResource<IntegrationPageData>({
    scope: "settings-integrations-page",
    fetcher: fetchData,
    isEmpty: (data) => !data || (!data.connections.length && !data.syncRuns.length),
  });

  const handleSync = async (provider: string) => {
    setSyncing((prev) => ({ ...prev, [provider]: true }));
    try {
      const endpoint = provider === "HEVY" ? "/api/integrations/hevy/sync" : null;
      if (!endpoint) {
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mode: "delta" }),
      });

      if (!res.ok) {
        throw new Error("Sync failed");
      }

      await integrations.refetch();
    } finally {
      setSyncing((prev) => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <>
      <QueryState
        data={integrations.data}
        isLoading={integrations.isLoading}
        isEmpty={integrations.isEmpty}
        error={integrations.error}
        loadingFallback={centeredState("Carregando integrações", "Buscando conexões, syncs e estatísticas reais do backend.")}
        emptyFallback={centeredState("Nenhuma integração configurada", "Conecte o Hevy ou configure o webhook de saúde para começar a preencher esta área.")}
        errorFallback={centeredState("Erro ao carregar integrações", "A tela não conseguiu buscar o estado atual das integrações.")}
      >
        {(data) => {
          const getConnection = (provider: string) =>
            data.connections.find((connection) => connection.provider === provider);

          return (
            <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
              <Sidebar />

              <main className="ml-64 flex min-w-0 flex-1 flex-col">
                <PageHeader
                  title="Gerenciamento de Integracoes"
                  action={
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Global</p>
                      <p className="text-sm font-bold text-primary">Dados e sincronização em tempo real</p>
                    </div>
                  }
                />

                <div className="mx-auto w-full max-w-7xl space-y-8 p-8">
                  <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <IntegrationCard
                      name="Apple Health"
                      subtitle="via Health Auto Export"
                      metrics="Webhooks"
                      health="Pronto"
                      status={getConnection("HEALTH_AUTO_EXPORT")?.isEnabled ? "Ativo" : "Aguardando"}
                      statusColor={getConnection("HEALTH_AUTO_EXPORT")?.isEnabled ? "bg-primary/10 text-primary" : "bg-slate-500/10 text-slate-500"}
                      icon="health_metrics"
                      lastSync={getConnection("HEALTH_AUTO_EXPORT")?.lastSyncAt ? new Date(getConnection("HEALTH_AUTO_EXPORT")?.lastSyncAt ?? "").toLocaleTimeString() : "Nunca"}
                      borderColor="border-l-4 border-l-primary"
                      onConfig={() => setIsHealthModalOpen(true)}
                    />
                    <IntegrationCard
                      name="Hevy"
                      subtitle="Treinamento de Forca"
                      metrics="API Sync"
                      health="Ativo"
                      status={getConnection("HEVY")?.isEnabled ? "Conectado" : "Desconectado"}
                      statusColor={getConnection("HEVY")?.isEnabled ? "bg-sky-400/10 text-sky-400" : "bg-red-400/10 text-red-500"}
                      icon="fitness_center"
                      lastSync={getConnection("HEVY")?.lastSyncAt ? new Date(getConnection("HEVY")?.lastSyncAt ?? "").toLocaleTimeString() : "Nunca"}
                      borderColor="border-l-4 border-l-sky-400"
                      onSync={() => void handleSync("HEVY")}
                      href="/settings/integrations/hevy"
                      loading={syncing.HEVY}
                    />
                    <IntegrationCard
                      name="Nutricao"
                      subtitle="Macros & Dieta"
                      metrics="Input Manual"
                      health="Ativo"
                      status="Habilitado"
                      statusColor="bg-yellow-500/10 text-yellow-500"
                      icon="restaurant"
                      lastSync="Historico"
                      borderColor="border-l-4 border-l-yellow-500"
                    />
                    <IntegrationCard
                      name="Registros Manuais"
                      subtitle="Treinos de Jiu-Jitsu"
                      metrics="Manual"
                      health="Consistente"
                      status="Ativo"
                      statusColor="bg-primary/5 text-primary/60"
                      icon="sports_kabaddi"
                      lastSync="Historico"
                      borderColor="border-l-4 border-l-primary/40"
                    />
                  </section>

                  <ProfileSettingsForm userId={userId} />

                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-1">
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          <span className="material-symbols-outlined text-lg text-primary">monitoring</span>
                          Saude dos Dados
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <div className="mb-2 flex justify-between text-[11px] font-bold tracking-tight">
                              <span className="uppercase text-slate-400">Sincronizacao</span>
                              <span className="text-primary">{data.stats?.successRate ?? 0}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <div className="h-full bg-primary transition-all" style={{ width: `${data.stats?.successRate ?? 0}%` }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded border border-white/5 bg-white/5 p-3">
                              <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Tempo Sync</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">
                                {data.stats?.avgSyncTime ? `${(data.stats.avgSyncTime / 1000).toFixed(1)}s` : "0.0s"}
                              </p>
                            </div>
                            <div className="rounded border border-white/5 bg-white/5 p-3">
                              <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Erros</p>
                              <p className="text-xl font-black text-red-500">{data.stats?.totalErrors ?? 0}</p>
                            </div>
                          </div>
                          <div className="rounded border border-white/5 bg-white/5 p-3">
                            <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Hevy Workouts</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{data.stats?.hevy.workoutsCount ?? 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between border-b border-white/5 p-6">
                          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            <span className="material-symbols-outlined text-lg text-sky-400">history</span>
                            Historico de Sincronizacao
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500">
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Fonte</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Itens</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-900 dark:text-slate-100">
                              {data.syncRuns.map((log) => (
                                <tr key={log.id} className="transition-colors hover:bg-white/5">
                                  <td className="px-6 py-4 font-mono">{new Date(log.startedAt).toLocaleString()}</td>
                                  <td className="flex items-center gap-2 px-6 py-4">
                                    <span className={`material-symbols-outlined text-[16px] ${log.provider === "HEVY" ? "text-sky-400" : "text-primary"}`}>
                                      {log.provider === "HEVY" ? "fitness_center" : "health_metrics"}
                                    </span>
                                    {log.provider}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 ${log.status === "FAILURE" ? "text-red-500" : "text-primary"}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${log.status === "FAILURE" ? "bg-red-500" : "bg-primary"}`} />
                                      {log.status === "FAILURE" ? "Erro" : "Sucesso"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">{log.recordsCount} data points</td>
                                </tr>
                              ))}
                              {!data.syncRuns.length && (
                                <tr>
                                  <td colSpan={4} className="px-6 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Nenhum registro encontrado
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <HevyConfigModal
                  userId={userId}
                  isOpen={isHevyModalOpen}
                  onClose={() => setIsHevyModalOpen(false)}
                  onSuccess={() => void integrations.refetch()}
                />
                <HealthWebhookConfig
                  userId={userId}
                  isOpen={isHealthModalOpen}
                  onClose={() => setIsHealthModalOpen(false)}
                  onSuccess={() => void integrations.refetch()}
                />
              </main>
            </div>
          );
        }}
      </QueryState>
    </>
  );
}
