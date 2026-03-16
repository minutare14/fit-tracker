"use client";

import { Activity, Database, RefreshCw, ShieldCheck, Zap, ChevronRight, Settings } from "lucide-react";
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[#141417] border border-zinc-800/50 p-6 rounded-2xl hover:border-sky-400/20 transition-all group shadow-sm hover:shadow-sky-400/5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-zinc-900 rounded-xl group-hover:scale-110 transition-transform border border-zinc-800/50">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold text-white truncate uppercase tracking-tight">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
        <div className="bg-[#141417] border border-zinc-800/50 p-8 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Sync Operations</h3>
          <p className="text-zinc-500 mb-6 font-light text-sm">Sincronize seus dados reais do Hevy Pro com o BJJ Lab Elite Performance.</p>
          <div className="space-y-3">
             <button 
              onClick={() => onSync("templates")}
              disabled={syncing}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-sky-400/50 rounded-xl group transition-all"
             >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-300">Sync Exercise Catalog</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors" />
             </button>
             <button 
              onClick={() => onSync("workouts")}
              disabled={syncing}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-sky-400/50 rounded-xl group transition-all"
             >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-300">Sync Latest Workouts</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors" />
             </button>
          </div>
        </div>

        <div className="bg-sky-950/20 border border-sky-400/20 p-8 rounded-2xl relative overflow-hidden group shadow-xl">
           <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
           <h3 className="text-xl font-bold mb-2 text-sky-100 flex items-center gap-2 uppercase tracking-wide">
             <Settings className="w-5 h-5 text-sky-400" />
             Routinary Framework
           </h3>
           <p className="text-sky-200/60 mb-6 font-light text-sm">Synchronizes your local training routines to Hevy, maintaining your BJJ folder structure and order.</p>
           <div className="flex gap-4">
             <button 
              onClick={async () => {
                const res = await fetch("/api/hevy/routines/defaults", { method: "POST" });
                const data = await res.json();
                if (res.ok) alert("Program mapped and initialized locally!");
                else alert("Error: " + data.error);
              }}
              className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-sky-400 font-black rounded-xl hover:bg-zinc-800 transition-colors text-[10px] uppercase tracking-widest shadow-lg"
             >
               Init Blueprint
             </button>
             <button 
              onClick={async () => {
                onSync("all");
                const res = await fetch("/api/hevy/sync", { 
                  method: "POST", 
                  body: JSON.stringify({ type: "routines" }) 
                });
                if (res.ok) alert("Routines exported to Hevy Folder successfully!");
              }}
              className="px-6 py-3 bg-sky-500 text-sky-950 font-black rounded-xl hover:bg-sky-300 transition-colors text-[10px] uppercase tracking-widest shadow-lg shadow-sky-500/20"
             >
               Export to Hevy
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
