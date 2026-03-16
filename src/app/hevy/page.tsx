"use client";

import { useState, useEffect } from "react";
import { Activity, Database, RefreshCw, Zap, Settings } from "lucide-react";
import { OverviewTab } from "./components/OverviewTab";
import { WorkoutsTab } from "./components/WorkoutsTab";
import { CatalogTab } from "./components/CatalogTab";
import { MappingTab } from "./components/MappingTab";

interface HevyStats {
  workouts: number;
  exercises: number;
  mappings: number;
  routines: number;
}

interface HevyStatus {
  connected: boolean;
  status: string;
  apiKey: string | null;
  lastSync: string | null;
  lastError: string | null;
  stats: HevyStats;
}

export default function HevyPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "workouts" | "catalog" | "mapping">("overview");
  const [status, setStatus] = useState<HevyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/hevy/status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type: "workouts" | "templates" | "all") => {
    setSyncing(true);
    try {
      const res = await fetch("/api/hevy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      await fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase tracking-widest">Hevy Integration</h1>
          <p className="text-zinc-500 mt-1 font-light">Real-time synchronization for BJJ Lab Elite Performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
            status?.connected ? 'bg-sky-400/10 text-sky-400 border border-sky-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-sky-400' : 'bg-red-400'}`}></span>
            {status?.connected ? 'OPERATIONAL' : 'OFFLINE'}
          </div>
          <button 
            onClick={() => handleSync("all")}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 transition-all rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-sky-500/20 group"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-white' : 'group-hover:rotate-180 transition-transform'}`} />
            {syncing ? 'Syncing...' : 'Sync Global'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800/50 mb-8 overflow-x-auto no-scrollbar gap-2">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "workouts", label: "Workouts", icon: Zap },
          { id: "catalog", label: "Exercise Catalog", icon: Database },
          { id: "mapping", label: "Exercise Mapping", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap group ${
              activeTab === tab.id ? 'text-sky-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
        {activeTab === "overview" && <OverviewTab status={status} syncing={syncing} onSync={handleSync} />}
        {activeTab === "workouts" && <WorkoutsTab />}
        {activeTab === "catalog" && <CatalogTab />}
        {activeTab === "mapping" && <MappingTab />}
      </div>
    </div>
  );
}
