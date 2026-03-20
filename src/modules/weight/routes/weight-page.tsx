"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/modules/core/ui/app-shell";
import { MetricTile } from "@/modules/core/ui/metric-tile";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { resolveAppErrorMessage } from "@/modules/core/api/app-error";
import { getWeightOverview } from "@/modules/weight/api/get-weight-overview";
import { createWeightEntry } from "@/modules/weight/api/create-weight-entry";
import { deleteWeightEntry } from "@/modules/weight/api/delete-weight-entry";

export function WeightPage() {
  const resource = useViewResource({
    scope: "weight-page",
    fetcher: getWeightOverview,
    isEmpty: (data) => !data || data.entries.length === 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    weightKg: "",
    bodyFatPct: "",
    notes: "",
  });

  const canSubmit = useMemo(() => {
    const w = Number(formData.weightKg);
    return formData.date && Number.isFinite(w) && w > 0;
  }, [formData]);

  const openModal = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      weightKg: "",
      bodyFatPct: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleCreate = async () => {
    const weightKg = Number(formData.weightKg);
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setBanner({ tone: "danger", message: "Peso deve ser maior que zero." });
      return;
    }

    setIsSaving(true);
    setBanner(null);

    try {
      const bodyFatPct = formData.bodyFatPct ? Number(formData.bodyFatPct) : null;
      await createWeightEntry({
        date: formData.date,
        weightKg,
        bodyFatPct: bodyFatPct && Number.isFinite(bodyFatPct) ? bodyFatPct : null,
        notes: formData.notes || null,
      });
      setBanner({ tone: "success", message: "Peso registrado com sucesso." });
      setIsModalOpen(false);
      await resource.refetch();
    } catch (error) {
      setBanner({ tone: "danger", message: resolveAppErrorMessage(error as Error) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Excluir este registro de peso?");
    if (!confirmed) return;

    try {
      await deleteWeightEntry(id);
      setBanner({ tone: "success", message: "Registro excluido com sucesso." });
      await resource.refetch();
    } catch (error) {
      setBanner({ tone: "danger", message: resolveAppErrorMessage(error as Error) });
    }
  };

  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-white";

  const statusBadges = resource.data ? (
    <>
      <StatusBadge label={`${resource.data.stats.totalEntries} registros`} tone="default" />
      {resource.data.stats.trend ? (
        <StatusBadge
          label={`Tendencia ${resource.data.stats.trend === "up" ? "↑" : resource.data.stats.trend === "down" ? "↓" : "→"} ${resource.data.stats.diff ?? 0} kg`}
          tone={resource.data.stats.trend === "down" ? "success" : resource.data.stats.trend === "up" ? "warning" : "default"}
        />
      ) : null}
    </>
  ) : null;

  const actions = (
    <button
      type="button"
      onClick={openModal}
      className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark transition-opacity hover:opacity-90"
    >
      Registrar peso
    </button>
  );

  return (
    <AppShell
      title="Peso & Composição"
      subtitle="Registro, historico e tendencias de peso e gordura corporal com persistência real."
      statusBadges={statusBadges}
      actions={actions}
    >
      <div className="space-y-8">
        {banner ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              banner.tone === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {banner.message}
          </div>
        ) : null}

        {resource.isLoading ? (
          <StatePanel
            eyebrow="Peso"
            title="Carregando dados de peso"
            description="Buscando historico, estatísticas e tendencias persistidas."
          />
        ) : resource.isError ? (
          <StatePanel
            eyebrow="Peso"
            title="Erro ao carregar peso"
            description={resource.error?.message ?? "Nao foi possivel carregar os dados de peso."}
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
            eyebrow="Peso"
            title="Nenhum registro de peso ainda"
            description="Registre seu primeiro peso para iniciar o acompanhamento de composição corporal."
            actions={
              <button
                type="button"
                onClick={openModal}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark"
              >
                Registrar primeiro peso
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Peso atual"
                value={resource.data.stats.currentWeight ? `${resource.data.stats.currentWeight} kg` : "--"}
                helper="Ultimo registro persistido."
                tone="primary"
              />
              <MetricTile
                label="Gordura corporal"
                value={resource.data.stats.currentBodyFat ? `${resource.data.stats.currentBodyFat}%` : "--"}
                helper="Ultima medicao registrada."
              />
              <MetricTile
                label="Variacao"
                value={
                  resource.data.stats.diff !== null
                    ? `${resource.data.stats.trend === "up" ? "+" : resource.data.stats.trend === "down" ? "-" : ""}${resource.data.stats.diff} kg`
                    : "--"
                }
                helper={
                  resource.data.stats.previousDate
                    ? `Desde ${new Date(resource.data.stats.previousDate + "T12:00:00Z").toLocaleDateString("pt-BR")}`
                    : "Baseada no registro anterior."
                }
              />
              <MetricTile
                label="Total registros"
                value={String(resource.data.stats.totalEntries)}
                helper="Entradas persistidas no banco."
              />
            </div>

            <SurfaceCard eyebrow="Historico" title="Registros de pesagem">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">Data</th>
                      <th className="pb-3">Peso</th>
                      <th className="pb-3">Gordura %</th>
                      <th className="pb-3">Notas</th>
                      <th className="pb-3 text-right">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {resource.data.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                          {new Date(entry.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 font-bold text-primary">{entry.weightKg} kg</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {entry.bodyFatPct ? `${entry.bodyFatPct}%` : "--"}
                        </td>
                        <td className="py-3 text-xs text-slate-500 italic max-w-xs truncate">
                          {entry.notes ?? "--"}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors text-xs font-black uppercase tracking-[0.15em]"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Registrar Peso
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="82.5"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Gordura (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="12.5"
                  value={formData.bodyFatPct}
                  onChange={(e) => setFormData({ ...formData, bodyFatPct: e.target.value })}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações opcionais..."
                  className={`${inputClassName} h-24 resize-none`}
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSaving || !canSubmit}
                className="w-full rounded-2xl bg-primary py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Salvar Registro"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
