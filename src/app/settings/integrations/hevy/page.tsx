"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { OverviewTab } from "../../../hevy/components/OverviewTab";
import { CatalogTab } from "../../../hevy/components/CatalogTab";
import { MappingTab } from "../../../hevy/components/MappingTab";
import { Settings, Database, Activity, RefreshCw } from "lucide-react";

export default function HevyManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState<any>(null);
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
    }
  };

  const handleSync = async (type: string) => {
    setSyncing(true);
    try {
      await fetch("/api/hevy/sync", {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Settings },
    { id: "catalog", label: "Catalog", icon: Database },
    { id: "mapping", label: "Mapping", icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        <PageHeader 
          title="Hevy Integration" 
          subtitle="Advanced configuration, technical mapping and catalog management."
          action={
            <div className="flex items-center gap-2">
               <button 
                onClick={() => handleSync("all")}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
               >
                 <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncing ? 'animate-spin' : ''}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">Global Sync</span>
               </button>
            </div>
          }
        />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-background-dark shadow-lg shadow-primary/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8 transition-all animate-in fade-in duration-500">
            {activeTab === "overview" && (
              <OverviewTab status={status} syncing={syncing} onSync={handleSync} />
            )}
            {activeTab === "catalog" && <CatalogTab />}
            {activeTab === "mapping" && <MappingTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
