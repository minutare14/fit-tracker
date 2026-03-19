"use client";

import { useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import ActivityItem from "@/components/ActivityItem";
import { QueryState } from "@/components/states/QueryState";
import { useAsyncResource } from "@/hooks/useAsyncResource";

interface DashboardKpiCard {
  value: string | number;
  unit: string;
  change: string;
  trend?: "up" | "down";
}

interface DashboardActivityItem {
  title: string;
  timeAgo: string;
  subtitle: string;
  type: "bjj" | "strength";
}

interface DashboardResponse {
  kpi: {
    totalWeeklyLoad: DashboardKpiCard;
    bodyWeight: DashboardKpiCard;
    avgSleep: DashboardKpiCard;
    readiness: DashboardKpiCard;
  };
  activity: DashboardActivityItem[];
  lastHevyWorkout: {
    title: string | null;
    startedAt: string;
    durationSeconds: number | null;
    rawPayloadJson?: { volume_kg?: number | null } | null;
  } | null;
}

const emptyDashboard = (message: string) => (
  <div className="flex min-h-screen bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100">
    <Sidebar />
    <main className="ml-64 flex flex-1 items-center justify-center p-8">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Dashboard</p>
        <h1 className="mt-3 text-2xl font-black">Ainda não há dados suficientes.</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    </main>
  </div>
);

export default function Dashboard() {
  const fetchStats = useCallback(async (): Promise<DashboardResponse> => {
    const res = await fetch("/api/dashboard/stats?userId=default-user", { cache: "no-store" });

    if (!res.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    return res.json();
  }, []);

  const dashboard = useAsyncResource<DashboardResponse>({
    scope: "dashboard-page",
    fetcher: fetchStats,
    isEmpty: (data) => !data || (!data.activity.length && !data.lastHevyWorkout),
  });

  return (
    <QueryState
      data={dashboard.data}
      isLoading={dashboard.isLoading}
      isEmpty={dashboard.isEmpty}
      error={dashboard.error}
      loadingFallback={emptyDashboard("Carregando dados reais do atleta e integrações...")}
      emptyFallback={emptyDashboard("Sincronize o Hevy, registre sessões de BJJ ou envie dados de saúde para popular esta visão.")}
      errorFallback={emptyDashboard("A leitura do dashboard falhou. Revise a conectividade do backend e tente novamente.")}
    >
      {(data) => (
        <div className="flex min-h-screen bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100">
          <Sidebar />

          <main className="ml-64 flex-1">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-background-light px-8 dark:border-slate-800 dark:bg-background-dark">
              <h2 className="text-lg font-bold">Athlete Overview</h2>
              <div className="rounded border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Dados reais
              </div>
            </header>

            <div className="space-y-8 p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard {...data.kpi.totalWeeklyLoad} label="Total Weekly Load" />
                <StatsCard {...data.kpi.bodyWeight} label="Body Weight" />
                <StatsCard {...data.kpi.avgSleep} label="Avg Sleep" />
                <StatsCard {...data.kpi.readiness} label="Readiness" />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-card-bg p-6 lg:col-span-2">
                  <h3 className="font-bold text-slate-100">Training Load</h3>
                  <div className="mt-6 rounded border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-400">
                    A série temporal real ainda precisa ser exposta pela API. Os KPIs e a atividade recente acima já usam dados persistidos.
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-card-bg p-6">
                  <h3 className="font-bold text-slate-100">Latest Strength Sync</h3>
                  {data.lastHevyWorkout ? (
                    <div className="mt-6 space-y-3">
                      <p className="text-sm font-black text-slate-100">{data.lastHevyWorkout.title || "Workout"}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {new Date(data.lastHevyWorkout.startedAt).toLocaleDateString()} •{" "}
                        {Math.round((data.lastHevyWorkout.durationSeconds ?? 0) / 60)} min
                      </p>
                      <p className="text-xs text-slate-400">
                        Volume: {Math.round(data.lastHevyWorkout.rawPayloadJson?.volume_kg ?? 0)}kg
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 rounded border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                      Nenhum treino de força sincronizado ainda.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <h3 className="font-bold text-slate-100">Operational Insight</h3>
                  <div className="rounded-xl border border-slate-800 bg-card-bg p-6 text-sm text-slate-400">
                    Os insights ainda precisam ser calculados pelo backend com base em readiness, carga e recuperação. Esta área permanece em empty state em vez de exibir texto inventado.
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-100">Recent Activity</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-card-bg">
                    {data.activity.map((act, idx) => (
                      <ActivityItem
                        key={`${act.type}-${idx}-${act.title}`}
                        title={act.title}
                        timeAgo={act.timeAgo}
                        subtitle={act.subtitle}
                        icon={act.type === "bjj" ? "sports_kabaddi" : "fitness_center"}
                        iconBg={act.type === "bjj" ? "bg-primary" : "bg-accent-blue"}
                      />
                    ))}
                    {!data.activity.length && (
                      <div className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        No activity logged yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </QueryState>
  );
}
