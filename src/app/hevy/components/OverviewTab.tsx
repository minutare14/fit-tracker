"use client";

import { Activity, ChevronRight, Database, RefreshCw, Settings, ShieldCheck, Zap } from "lucide-react";
import { format } from "date-fns";

export function OverviewTab({ status, syncing, onSync }: any) {
  const kpis = [
    { label: "Connection", value: status?.status || "NOT CONFIGURED", icon: ShieldCheck, color: "text-sky-400" },
    { label: "API Key", value: status?.apiKey || "NOT SET", icon: Settings, color: "text-zinc-400" },
    { label: "Last Sync", value: status?.lastSync ? format(new Date(status.lastSync), "dd/MM HH:mm") : "NEVER", icon: RefreshCw, color: "text-zinc-400" },
    { label: "Workouts", value: status?.stats.workouts || 0, icon: Zap, color: "text-sky-400" },
    { label: "Exercises", value: status?.stats.exercises || 0, icon: Database, color: "text-zinc-400" },
    { label: "Routines", value: status?.stats.routines || 0, icon: Activity, color: "text-zinc-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, index) => (
          <div key={index} className="rounded-2xl border border-zinc-800/50 bg-[#141417] p-6 shadow-sm transition-all hover:border-sky-400/20 hover:shadow-sky-400/5 group">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900 p-2.5 transition-transform group-hover:scale-110">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{kpi.label}</span>
            </div>
            <div className="truncate text-2xl font-bold uppercase tracking-tight text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 leading-relaxed md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800/50 bg-[#141417] p-8 shadow-sm">
          <h3 className="mb-2 text-xl font-bold uppercase tracking-wide">Sync Operations</h3>
          <p className="mb-6 text-sm font-light text-zinc-500">Sincronize seus dados reais do Hevy Pro com o BJJ Lab Elite Performance.</p>
          {status?.lastError && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
              {status.lastError}
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => onSync("templates")}
              disabled={syncing}
              className="group flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-all hover:border-sky-400/50"
            >
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-300">Sync Exercise Catalog</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-sky-400" />
            </button>
            <button
              onClick={() => onSync("workouts")}
              disabled={syncing}
              className="group flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-all hover:border-sky-400/50"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-300">Sync Latest Workouts</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-sky-400" />
            </button>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-950/20 p-8 shadow-xl">
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl transition-all group-hover:scale-150"></div>
          <h3 className="mb-2 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-sky-100">
            <Settings className="h-5 w-5 text-sky-400" />
            Routinary Framework
          </h3>
          <p className="mb-6 text-sm font-light text-sky-200/60">Synchronizes your local training routines to Hevy, maintaining your BJJ folder structure and order.</p>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                const res = await fetch("/api/hevy/routines/defaults", { method: "POST" });
                const data = await res.json();
                if (res.ok) alert("Program mapped and initialized locally!");
                else alert("Error: " + data.error);
              }}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-sky-400 shadow-lg transition-colors hover:bg-zinc-800"
            >
              Init Blueprint
            </button>
            <button
              onClick={async () => {
                const res = await fetch("/api/hevy/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "routines" })
                });
                const data = await res.json();
                if (res.ok) alert("Routines exported to Hevy Folder successfully!");
                else alert("Error: " + data.error);
              }}
              className="rounded-xl bg-sky-500 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-sky-950 shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-300"
            >
              Export to Hevy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
