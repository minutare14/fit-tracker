"use client";

import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { getNutritionOverview } from "@/modules/nutrition/api/get-nutrition-overview";
import { AppShell } from "@/modules/core/ui/app-shell";
import { MetricTile } from "@/modules/core/ui/metric-tile";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { SurfaceCard } from "@/modules/core/ui/surface-card";

export function NutritionPageRoute() {
  const resource = useViewResource({
    scope: "nutrition-page",
    fetcher: getNutritionOverview,
    isEmpty: (data) => !data || data.stats.totalTrackedDays === 0,
  });

  return (
    <AppShell
      title="Nutrição & Macros"
      subtitle="Estatísticas sumarizadas e visão geral do histórico nutricional validado no banco."
    >
      <div className="space-y-8">
        {resource.isLoading ? (
          <StatePanel
            eyebrow="Nutricao"
            title="Consolidando dados agregados"
            description="Buscando estatisticas validadas de ingestao calorica e aderencia do banco real."
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
            title="Sem historico nutricional valido"
            description="Ainda nao ha log nutricional no sistema."
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Aderencia 7d"
                value={`${resource.data.stats.adherenceRate7d}%`}
                helper="Percentual dos ultimos 7 registros marcados como aderentes."
                tone={resource.data.stats.adherenceRate7d >= 80 ? "primary" : "default"}
              />
              <MetricTile
                label="Calorias (Media 7d)"
                value={`${Math.round(resource.data.stats.avgCalories7d)} kcal`}
                helper="Injestao media recente."
              />
              <MetricTile
                label="Macros atingidos"
                value={`${resource.data.stats.macrosHit7d} dias`}
                helper="Frequencia de bater metas de macros."
              />
              <MetricTile
                label="Registros Totais"
                value={String(resource.data.stats.totalTrackedDays)}
                helper="Dias de monitoramento nutricional no sistema."
              />
            </div>

            <SurfaceCard eyebrow="Historico" title="Ultimos Registros Nutricionais">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">Data</th>
                      <th className="pb-3">Calorias</th>
                      <th className="pb-3 text-center">Proteínas</th>
                      <th className="pb-3 text-center">Carboidratos</th>
                      <th className="pb-3 text-center">Gorduras</th>
                      <th className="pb-3 text-right">Agua</th>
                      <th className="pb-3 text-right">Meta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {resource.data.recentLogs.map((log) => (
                      <tr key={log.date}>
                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                          {new Date(log.date + "T12:00:00Z").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 font-bold text-primary">{log.calories} kcal</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-300">{log.protein}g</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-300">{log.carbs}g</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-300">{log.fat}g</td>
                        <td className="py-3 text-right text-slate-600 dark:text-slate-300">{log.waterLiters}L</td>
                        <td className="py-3 text-right font-medium">
                          {log.isAdherent ? (
                            <span className="text-emerald-500">Aderente</span>
                          ) : (
                            <span className="text-red-500">Fora</span>
                          )}
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
    </AppShell>
  );
}
