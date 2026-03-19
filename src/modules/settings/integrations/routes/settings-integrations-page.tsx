"use client";

import { useEffect, useState } from "react";
import ProfileSettingsForm from "@/components/settings/ProfileSettingsForm";
import { requestJson } from "@/modules/core/api/http-client";
import { resolveAppErrorMessage } from "@/modules/core/api/app-error";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { AppShell } from "@/modules/core/ui/app-shell";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { getIntegrationsOverview } from "@/modules/settings/integrations/api/get-integrations-overview";
import { IntegrationFormCard } from "@/modules/settings/integrations/components/integration-form-card";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-white";

export function SettingsIntegrationsPage() {
  const resource = useViewResource({
    scope: "settings-integrations-page",
    fetcher: getIntegrationsOverview,
    isEmpty: (data) => !data,
  });

  const [hevyApiKey, setHevyApiKey] = useState("");
  const [healthHeaderName, setHealthHeaderName] = useState("x-health-autoexport-secret");
  const [healthSecret, setHealthSecret] = useState("");
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4.1-mini");
  const [message, setMessage] = useState<{ tone: "success" | "danger"; value: string } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    if (!resource.data) {
      return;
    }

    setHealthHeaderName(resource.data.healthAutoExport.headerName || "x-health-autoexport-secret");
    setAiProvider(resource.data.ai.provider || "openai");
    setAiModel(resource.data.ai.model || "gpt-4.1-mini");
  }, [resource.data]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyAction(key);
    setMessage(null);

    try {
      await action();
      await resource.refetch();
    } catch (error) {
      setMessage({ tone: "danger", value: resolveAppErrorMessage(error as Error) });
    } finally {
      setBusyAction(null);
    }
  };

  const statusBadges = resource.data ? (
    <>
      <StatusBadge
        label={`Hevy ${resource.data.hevy.status}`}
        tone={resource.data.hevy.configured ? "success" : "warning"}
      />
      <StatusBadge
        label={`Auto Export ${resource.data.healthAutoExport.status}`}
        tone={resource.data.healthAutoExport.hasSecret ? "success" : "warning"}
      />
      <StatusBadge
        label={`IA ${resource.data.ai.provider}/${resource.data.ai.model}`}
        tone={resource.data.ai.configured ? "success" : "default"}
      />
    </>
  ) : null;

  return (
    <AppShell
      title="Settings"
      subtitle="Integrações, perfil e configurações do atleta agora em contratos estáveis e ações reais de leitura/escrita."
      statusBadges={statusBadges}
    >
      <div className="space-y-8">
        {message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.tone === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message.value}
          </div>
        ) : null}

        {resource.isLoading ? (
          <StatePanel
            eyebrow="Settings"
            title="Carregando configuracoes"
            description="Buscando o estado real das integrações, histórico de sync e preferências persistidas."
          />
        ) : resource.isError || !resource.data ? (
          <StatePanel
            eyebrow="Settings"
            title="Erro ao carregar configuracoes"
            description={resource.error?.message ?? "Nao foi possivel carregar as configuracoes."}
          />
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-3">
              <IntegrationFormCard
                eyebrow="Hevy"
                title="Forca e sincronizacao"
                description="Salve a API key, teste a conexao antes de sincronizar e acompanhe erros reais."
                actions={
                  <>
                    <button
                      type="button"
                      disabled={busyAction === "save-hevy"}
                      onClick={() =>
                        void runAction("save-hevy", async () => {
                          await requestJson("/api/settings/integrations/hevy", {
                            method: "PUT",
                            body: JSON.stringify({ apiKey: hevyApiKey }),
                          });
                          setHevyApiKey("");
                          setMessage({ tone: "success", value: "Hevy salvo e validado com sucesso." });
                        })
                      }
                      className="rounded-2xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-background-dark disabled:opacity-50"
                    >
                      Salvar chave
                    </button>
                    <button
                      type="button"
                      disabled={busyAction === "test-hevy"}
                      onClick={() =>
                        void runAction("test-hevy", async () => {
                          await requestJson("/api/settings/integrations/hevy/test", {
                            method: "POST",
                            body: JSON.stringify({ apiKey: hevyApiKey || undefined }),
                          });
                          setMessage({ tone: "success", value: "Conexao com Hevy validada." });
                        })
                      }
                      className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary disabled:opacity-50"
                    >
                      Testar conexao
                    </button>
                    <button
                      type="button"
                      disabled={busyAction === "sync-hevy"}
                      onClick={() =>
                        void runAction("sync-hevy", async () => {
                          await requestJson("/api/settings/integrations/hevy/sync", {
                            method: "POST",
                            body: JSON.stringify({ mode: "delta" }),
                          });
                          setMessage({ tone: "success", value: "Sincronizacao do Hevy concluida." });
                        })
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:border-zinc-800 dark:text-slate-300 disabled:opacity-50"
                    >
                      Sincronizar agora
                    </button>
                  </>
                }
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300">
                    Status: <strong>{resource.data.hevy.status}</strong>
                    <br />
                    API key salva: {resource.data.hevy.maskedApiKey ?? "nenhuma"}
                    <br />
                    Workouts importados: {resource.data.hevy.workoutsImported}
                  </div>
                  <input
                    className={inputClassName}
                    type="password"
                    value={hevyApiKey}
                    placeholder={resource.data.hevy.maskedApiKey ?? "Cole a API key do Hevy"}
                    onChange={(event) => setHevyApiKey(event.target.value)}
                  />
                </div>
              </IntegrationFormCard>

              <IntegrationFormCard
                eyebrow="Health Auto Export"
                title="Webhook operacional"
                description="Salve segredo e header no backend e use a URL real para receber payloads."
                actions={
                  <button
                    type="button"
                    disabled={busyAction === "save-health"}
                    onClick={() =>
                      void runAction("save-health", async () => {
                        await requestJson("/api/settings/integrations/autoexport", {
                          method: "PUT",
                          body: JSON.stringify({
                            headerName: healthHeaderName,
                            webhookSecret: healthSecret,
                          }),
                        });
                        setHealthSecret("");
                        setMessage({ tone: "success", value: "Configuracao do Auto Export salva." });
                      })
                    }
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-background-dark disabled:opacity-50"
                  >
                    Salvar segredo
                  </button>
                }
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300">
                    URL do webhook:
                    <br />
                    <code className="break-all text-primary">{resource.data.healthAutoExport.webhookUrl}</code>
                    <br />
                    Segredo salvo: {resource.data.healthAutoExport.secretMask ?? "nenhum"}
                  </div>
                  <input className={inputClassName} value={healthHeaderName} onChange={(event) => setHealthHeaderName(event.target.value)} />
                  <input
                    className={inputClassName}
                    type="password"
                    value={healthSecret}
                    placeholder={resource.data.healthAutoExport.secretMask ?? "Defina o segredo do webhook"}
                    onChange={(event) => setHealthSecret(event.target.value)}
                  />
                </div>
              </IntegrationFormCard>

              <IntegrationFormCard
                eyebrow="IA"
                title="Provider e modelo"
                description="Persistencia simples de provider/model para a camada de insights e assistente."
                actions={
                  <button
                    type="button"
                    disabled={busyAction === "save-ai"}
                    onClick={() =>
                      void runAction("save-ai", async () => {
                        await requestJson("/api/settings/integrations/ai", {
                          method: "PUT",
                          body: JSON.stringify({
                            provider: aiProvider,
                            model: aiModel,
                          }),
                        });
                        setMessage({ tone: "success", value: "Configuracao de IA salva." });
                      })
                    }
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-background-dark disabled:opacity-50"
                  >
                    Salvar IA
                  </button>
                }
              >
                <div className="space-y-3">
                  <select className={inputClassName} value={aiProvider} onChange={(event) => setAiProvider(event.target.value)}>
                    <option value="openai">openai</option>
                    <option value="anthropic">anthropic</option>
                    <option value="google">google</option>
                  </select>
                  <input className={inputClassName} value={aiModel} onChange={(event) => setAiModel(event.target.value)} />
                </div>
              </IntegrationFormCard>
            </div>

            <ProfileSettingsForm userId="default-user" />

            <SurfaceCard eyebrow="Sync history" title="Historico de sincronizacao">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">Inicio</th>
                      <th className="pb-3">Fonte</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Itens</th>
                      <th className="pb-3">Erro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {resource.data.syncHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                          {new Date(item.startedAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{item.provider}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{item.status}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{item.recordsProcessed}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{item.errorMessage ?? "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </>
        )}
      </div>
    </AppShell>
  );
}
