"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Zap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { HevyWorkoutList } from "@/components/strength/HevyWorkoutList";

export default function StrengthPage() {
  const [programSyncing, setProgramSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({
    weeklyVolume: 0,
    prsThisMonth: 0,
    avgDuration: 0,
    workoutsCount: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [configRes, workoutsRes] = await Promise.all([
        fetch("/api/integrations/hevy/config?userId=default-user"),
        fetch("/api/hevy/workouts?userId=default-user&limit=200"),
      ]);

      const config = await configRes.json();
      const workouts = await workoutsRes.json();

      setConnected(config.status === "CONNECTED");

      const now = new Date();
      const last7d = new Date(now);
      last7d.setDate(now.getDate() - 7);

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const weeklyVolume = workouts
        .filter((workout: any) => new Date(workout.startedAt) >= last7d)
        .reduce((acc: number, workout: any) => acc + (workout.volumeKg || 0), 0);

      const prsThisMonth = workouts
        .filter((workout: any) => {
          const startedAt = new Date(workout.startedAt);
          return startedAt.getMonth() === currentMonth && startedAt.getFullYear() === currentYear;
        })
        .reduce((acc: number, workout: any) => acc + (workout.prsCount || 0), 0);

      const avgDuration = workouts.length
        ? Math.round(workouts.reduce((acc: number, workout: any) => acc + (workout.durationSeconds || 0), 0) / workouts.length / 60)
        : 0;

      setStats({
        weeklyVolume: Math.round(weeklyVolume),
        prsThisMonth,
        avgDuration,
        workoutsCount: workouts.length,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/integrations/hevy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "default-user", mode: "delta" })
      });
      await fetchStats();
    } catch (error) {
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const handleProgramSync = async () => {
    setProgramSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/integrations/hevy/sync-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "default-user" })
      });
      const data = await res.json();
      setSyncResult(data);
    } catch (error: any) {
      setSyncResult({ error: error.message });
    } finally {
      setProgramSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />

      <main className="ml-64 flex flex-1 flex-col overflow-y-auto">
        <PageHeader
          title="Strength Performance"
          action={
            <div className="flex items-center gap-4">
              <div className="mr-4 flex flex-col items-end">
                <p className="text-[9px] font-black uppercase tracking-widest leading-none text-slate-500">Status</p>
                <p className={`flex items-center gap-1 text-[11px] font-bold ${connected ? "text-primary" : "text-red-500"}`}>
                  {connected ? "HEVY CONNECTED" : "HEVY DISCONNECTED"}
                  <span className={`size-1.5 rounded-full ${connected ? "animate-pulse bg-primary" : "bg-red-500"}`}></span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleProgramSync}
                  disabled={programSyncing}
                  className="group flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 transition-all hover:bg-primary/20"
                  title="Sincronizar Programa BJJ Performance"
                >
                  <Zap className={`h-3.5 w-3.5 text-primary ${programSyncing ? "animate-pulse" : ""}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sincronizar Treino</span>
                </button>
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="group flex items-center gap-2 rounded-xl border border-primary/20 bg-slate-100 px-4 py-2 transition-all hover:border-primary dark:bg-slate-900"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-primary ${syncing ? "animate-spin" : "transition-transform duration-500 group-hover:rotate-180"}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sync Logs</span>
                </button>
              </div>
            </div>
          }
        />

        <div className="mx-auto w-full max-w-7xl space-y-10 p-8">
          {syncResult && (
            <div className={`animate-in slide-in-from-top-4 rounded-2xl border p-4 duration-300 ${syncResult.success ? "border-emerald-500/20 bg-emerald-500/10" : "border-red-500/20 bg-red-500/10"}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className={`text-[10px] font-black uppercase tracking-widest ${syncResult.success ? "text-emerald-400" : "text-red-400"}`}>
                  {syncResult.success ? "Sincronizacao Concluida" : "Falha na Sincronizacao"}
                </p>
                <button onClick={() => setSyncResult(null)} className="text-slate-500 transition-colors hover:text-white">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              {syncResult.success ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">Programa <span className="font-bold text-white">BJJ Performance</span> sincronizado com sucesso.</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {syncResult.routines?.map((routine: any, index: number) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{routine.routine}</span>
                        {routine.status === "SUCCESS" ? (
                          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        ) : (
                          <span className="size-2 rounded-full bg-red-500"></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs font-medium text-red-400">{syncResult.error || "Ocorreu um erro desconhecido na sincronizacao."}</p>
              )}
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-white/5 p-6 shadow-xl transition-all hover:border-primary/20">
              <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Total Volume (W)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black uppercase tracking-tighter text-slate-50">{stats.weeklyVolume.toLocaleString()}</span>
                <span className="text-xs font-bold text-primary">kg</span>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-5 transition-opacity group-hover:opacity-10">
                <Zap className="h-24 w-24 text-primary" />
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-white/5 p-6 shadow-xl transition-all hover:border-primary/20">
              <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">PRs (M)</p>
              <div className="text-3xl font-black uppercase tracking-tighter text-slate-50">{stats.prsThisMonth}</div>
              <div className="mt-1 text-[9px] font-bold uppercase text-primary">Records broken</div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-white/5 p-6 shadow-xl transition-all hover:border-primary/20">
              <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Duration</p>
              <div className="text-3xl font-black uppercase tracking-tighter text-slate-50">{stats.avgDuration}m</div>
              <div className="mt-1 text-[9px] font-bold uppercase text-slate-500">Sess. Efficiency</div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-white/5 p-6 shadow-xl transition-all hover:border-primary/20">
              <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Workouts Sync</p>
              <div className="text-3xl font-black uppercase tracking-tighter text-primary">{stats.workoutsCount}</div>
              <div className="mt-1 text-[9px] font-bold uppercase text-slate-500">Hevy Total</div>
            </div>
          </section>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter text-slate-100">
                  <Zap className="h-5 w-5 text-primary" />
                  Execution Logs
                </h3>
                <p className="text-xs font-medium text-slate-500">Detailed strength sessions history synced from Hevy.</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-background-dark">Hevy</button>
                <button className="rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:bg-white/10">Manual</button>
              </div>
            </div>
            <HevyWorkoutList />
          </div>
        </div>
      </main>
    </div>
  );
}
