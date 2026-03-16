"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar"
import PageHeader from "@/components/PageHeader"
import { HevyWorkoutList } from "@/components/strength/HevyWorkoutList"
import { RefreshCw, Zap } from "lucide-react"

export default function StrengthPage() {
  const [programSyncing, setProgramSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    weeklyVolume: 0,
    prsThisMonth: 0,
    avgDuration: 0,
    workoutsCount: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/integrations/hevy/config?userId=default-user");
      const data = await res.json();
      if (data.status === "CONNECTED") {
        setStats(prev => ({ ...prev, workoutsCount: 0 })); // We'll get real count later
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/integrations/hevy/sync", { 
        method: "POST", 
        body: JSON.stringify({ userId: "default-user" }) 
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
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
        body: JSON.stringify({ userId: "default-user" })
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        // Option to reload or show success toast
      }
    } catch (e: any) {
      setSyncResult({ error: e.message });
    } finally {
      setProgramSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col overflow-y-auto">
        <PageHeader 
          title="Strength Performance" 
          action={
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-4">
                <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest leading-none">Status</p>
                <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                  HEVY CONNECTED
                  <span className="size-1.5 bg-primary rounded-full animate-pulse"></span>
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleProgramSync}
                  disabled={programSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all group"
                  title="Sincronizar Programa BJJ Performance"
                >
                  <Zap className={`w-3.5 h-3.5 text-primary ${programSyncing ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sincronizar Treino</span>
                </button>
                <button 
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-primary/20 rounded-xl hover:border-primary transition-all group"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sync Logs</span>
                </button>
              </div>
            </div>
          }
        />

        <div className="p-8 space-y-10 max-w-7xl mx-auto w-full">
          {syncResult && (
            <div className={`p-4 rounded-2xl border ${syncResult.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} animate-in fade-in slide-in-from-top-4 duration-300`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] font-black uppercase tracking-widest ${syncResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {syncResult.success ? 'Sincronização Concluída' : 'Falha na Sincronização'}
                </p>
                <button onClick={() => setSyncResult(null)} className="text-slate-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              {syncResult.success ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">Programa <span className="text-white font-bold">BJJ Performance</span> sincronizado com sucesso.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {syncResult.routines?.map((r: any, idx: number) => (
                      <div key={idx} className="bg-black/20 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{r.routine}</span>
                        {r.status === 'SUCCESS' ? (
                          <span className="size-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        ) : (
                          <span className="size-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-400 font-medium">{syncResult.error || 'Ocorreu um erro desconhecido na sincronização.'}</p>
              )}
            </div>
          )}
          {/* Top Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-primary/5 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Volume (W)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-50 uppercase tracking-tighter">42,850</span>
                <span className="text-xs font-bold text-primary">kg</span>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-24 h-24 text-primary" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-primary/5 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">PRs (M)</p>
              <div className="text-3xl font-black text-slate-50 uppercase tracking-tighter">08</div>
              <div className="text-[9px] font-bold text-primary uppercase mt-1">Records broken</div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-primary/5 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Avg Duration</p>
              <div className="text-3xl font-black text-slate-50 uppercase tracking-tighter">58m</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Sess. Efficiency</div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-primary/5 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Workouts Sync</p>
              <div className="text-3xl font-black text-primary uppercase tracking-tighter">{stats.workoutsCount}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Hevy Total</div>
            </div>
          </section>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2 text-slate-100">
                  <Zap className="w-5 h-5 text-primary" />
                  Execution Logs
                </h3>
                <p className="text-xs text-slate-500 font-medium">Detailed strength sessions history synced from Hevy.</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 bg-primary text-background-dark rounded-full text-[10px] font-black uppercase tracking-widest">Hevy</button>
                <button className="px-4 py-1.5 bg-white/5 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Manual</button>
              </div>
            </div>
            <HevyWorkoutList />
          </div>
        </div>
      </main>
    </div>
  )
}
