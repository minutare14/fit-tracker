"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import StatsCard from "@/components/StatsCard"
import InsightCard from "@/components/InsightCard"
import ActivityItem from "@/components/ActivityItem"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats?userId=default-user')
      const stats = await res.json()
      setData(stats)
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const kpi = data?.kpi || {
    totalWeeklyLoad: { value: "0", unit: "TSS", change: "0%", trend: "flat" },
    bodyWeight: { value: "0", unit: "kg", change: "0kg", trend: "flat" },
    avgSleep: { value: "0", unit: "hrs", change: "0%", trend: "flat" },
    readiness: { value: "0", unit: "%", change: "0%", trend: "flat" },
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <Sidebar />
      
      <main className="ml-64 flex-1">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-background-light dark:bg-background-dark sticky top-0 z-10">
          <h2 className="text-lg font-bold">Athlete Overview</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded px-3 py-1.5 gap-2 border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="text-xs font-medium">Last 7 Days</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
            <button className="relative p-2 text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-background-dark"></span>
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Attention Block / AI Insight Alert */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-500">Attention Required Today</h4>
              <p className="text-xs text-red-500/80">Low HRV detected. Highly suggest adjusting BJJ intensity to 60% or focusing on technical drilling.</p>
            </div>
            <button className="text-xs font-bold text-red-500 underline uppercase tracking-wider">Dismiss</button>
          </div>

          {/* KPI Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard label="Total Weekly Load" value={kpi.totalWeeklyLoad.value} unit={kpi.totalWeeklyLoad.unit} change={kpi.totalWeeklyLoad.change} trend={kpi.totalWeeklyLoad.trend} />
            <StatsCard label="Body Weight" value={kpi.bodyWeight.value} unit={kpi.bodyWeight.unit} change={kpi.bodyWeight.change} trend={kpi.bodyWeight.trend} />
            <StatsCard label="Avg Sleep" value={kpi.avgSleep.value} unit={kpi.avgSleep.unit} change={kpi.avgSleep.change} trend={kpi.avgSleep.trend} />
            <StatsCard label="Readiness" value={kpi.readiness.value} unit={kpi.readiness.unit} change={kpi.readiness.change} trend={kpi.readiness.trend} />
          </div>

          {/* Charts Section - Real Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card-bg border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100">Weekly Training Load</h3>
                <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary"></span>
                    <span className="text-slate-400">BJJ Mat Time</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-accent-blue"></span>
                    <span className="text-slate-400">Strength/S&C</span>
                  </div>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded border border-dashed border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Gráfico em tempo real sincronizando...</span>
              </div>
            </div>

            <div className="bg-card-bg border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100">Weight Trend</h3>
                <span className="text-xs text-slate-500">30D</span>
              </div>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded border border-dashed border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Aguardando mais dados de pesagem</span>
              </div>
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold px-1 text-slate-100">Performance Insights (AI)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard 
                  type="improvement" 
                  title="Improving: Strength" 
                  description="Workout consistency is up by 25% this week. Focus on volume maintenance." 
                />
                <InsightCard 
                  type="gap" 
                  title="Gap: Recovery" 
                  description="Resting heart rate is slightly elevated. Monitor fatigue levels closely." 
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold px-1 text-slate-100 flex items-center justify-between">
                <span>Recent Activity</span>
                {data?.lastHevyWorkout && (
                  <span className="text-[10px] text-primary uppercase font-black px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                    Sincronizado
                  </span>
                )}
              </h3>
              
              {/* Latest Hevy Workout Mini-Card */}
              {data?.lastHevyWorkout && (
                <div className="bg-slate-900/50 border border-primary/20 rounded-xl p-4 mb-4 group hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative" 
                     onClick={() => window.location.href='/strength'}>
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Latest Strength Session</p>
                      <h4 className="text-sm font-black text-slate-100 group-hover:text-primary transition-colors">{data.lastHevyWorkout.title}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-primary leading-none">{Math.round(data.lastHevyWorkout.rawPayloadJson?.volume_kg || 0)}kg</p>
                      <p className="text-[8px] text-slate-500 uppercase font-black">Volume</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-tighter relative z-10">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> {new Date(data.lastHevyWorkout.startedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span> {Math.round(data.lastHevyWorkout.durationSeconds / 60)} min</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-6xl">fitness_center</span>
                  </div>
                </div>
              )}

              <div className="bg-card-bg border border-slate-800 rounded-xl overflow-hidden">
                {data?.activity?.map((act: any, idx: number) => (
                  <ActivityItem 
                    key={idx}
                    title={act.title} 
                    timeAgo={act.timeAgo} 
                    subtitle={act.subtitle} 
                    icon={act.type === 'bjj' ? "sports_kabaddi" : "fitness_center"} 
                    iconBg={act.type === 'bjj' ? "bg-primary" : "bg-accent-blue"} 
                  />
                ))}
                {!data?.activity?.length && (
                  <div className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">No activity logged yet</div>
                )}
                <button className="w-full py-3 bg-slate-800/30 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">
                  View All Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
