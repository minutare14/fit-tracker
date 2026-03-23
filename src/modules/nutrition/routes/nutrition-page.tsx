"use client";

import { AppShell } from "@/modules/core/ui/app-shell";
import { MetricTile } from "@/modules/core/ui/metric-tile";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { getNutritionOverview } from "@/modules/nutrition/api/get-nutrition-overview";

export function NutritionPageRoute() {
  const resource = useViewResource({
    scope: "nutrition-page",
    fetcher: getNutritionOverview,
    isEmpty: (data) => !data || !data.availability.hasData,
  });

  return (
    <AppShell
      title="Nutricao & Macros"
      subtitle="Historico nutricional consolidado a partir do Auto Export e metas operacionais do perfil."
    >
      <div className="space-y-8">
        {resource.isLoading ? (
          <StatePanel
            eyebrow="Nutricao"
            title="Consolidando dados nutricionais"
            description="Buscando cobertura, medias de 7 dias e aderencia operacional."
          />
        ) : resource.isError ? (
          <StatePanel
            eyebrow="Nutricao"
            title="Falha ao carregar nutricao"
            description={resource.error?.message ?? "Nao foi possivel carregar o overview nutricional."}
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
            eyebrow="Nutricao"
            title="Sem historico nutricional consolidado"
            description={resource.data?.emptyStateReason ?? "Ainda nao ha dias suficientes de nutricao no sistema."}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Aderencia 7d"
                value={`${resource.data.summary.adherenceRate7d}%`}
                helper="Percentual recente comparado com as metas do perfil."
                tone={resource.data.summary.adherenceRate7d >= 80 ? "primary" : "default"}
              />
              <MetricTile
                label="Calorias 7d"
                value={`${Math.round(resource.data.summary.avgCalories7d)} kcal`}
                helper="Media recente dos dias acompanhados."
              />
              <MetricTile
                label="Hidratacao 7d"
                value={
                  resource.data.summary.avgHydration7d !== null
                    ? `${resource.data.summary.avgHydration7d} L`
                    : "--"
                }
                helper="Media de hidratacao registrada."
              />
              <MetricTile
                label="Cobertura"
                value={`${resource.data.availability.daysTracked} dias`}
                helper={`Fonte principal: ${resource.data.availability.source}`}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
              <SurfaceCard eyebrow="Historico" title="Ultimos dias registrados">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="pb-3">Data</th>
                        <th className="pb-3">Calorias</th>
                        <th className="pb-3">Proteina</th>
                        <th className="pb-3">Carbs</th>
                        <th className="pb-3">Gordura</th>
                        <th className="pb-3">Agua</th>
                        <th className="pb-3">Fonte</th>
                        <th className="pb-3">Aderencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {resource.data.history.map((entry) => (
                        <tr key={entry.date}>
                          <td className="py-3 font-medium text-slate-900 dark:text-white">
                            {new Date(`${entry.date}T12:00:00Z`).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{entry.calories ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{entry.protein ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{entry.carbs ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{entry.fat ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{entry.hydration ?? "--"}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{entry.source}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {entry.adherence === null ? "--" : entry.adherence ? "Dentro" : "Fora"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>

              <SurfaceCard eyebrow="Metas" title="Referencias do perfil">
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    Calorias alvo: {resource.data.targets.calories ?? "--"}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    Proteina alvo: {resource.data.targets.protein ?? "--"}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    Carbo alvo: {resource.data.targets.carbs ?? "--"}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    Gordura alvo: {resource.data.targets.fat ?? "--"}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    Hidratacao alvo: {resource.data.targets.hydration ?? "--"}
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
