"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import PageHeader from "@/components/PageHeader"
import NutritionTargetCard from "@/components/NutritionTargetCard"

export default function NutritionPage() {
  const [log, setLog] = useState<any>({ calories: 0, protein: 0, carbs: 0, fat: 0, waterLiters: 0, adherent: false })
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Dynamic targets from stats or defaults
  const targets = stats?.targets || { calories: 2850, protein: 180, carbs: 320, fat: 85, water: 4.5 }

  const fetchData = async () => {
    try {
      const userId = 'default-user'
      const [logRes, statsRes] = await Promise.all([
        fetch(`/api/nutrition?userId=${userId}&date=${selectedDate}`),
        fetch(`/api/nutrition?type=stats&userId=${userId}`)
      ])
      const logData = await logRes.json()
      const statsData = await statsRes.json()
      setLog(logData)
      setStats(statsData)
    } catch (err) {
      console.error("Failed to fetch nutrition data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const handleUpdate = async (field: string, value: any) => {
    const updatedLog = { ...log, [field]: value }
    setLog(updatedLog)
    
    try {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user', date: selectedDate, ...updatedLog })
      })
    } catch (err) {
      console.error("Failed to save nutrition")
    }
  }

  const getPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col overflow-y-auto">
        <PageHeader 
          title="Nutrição & Macros" 
          action={
            <div className="flex items-center gap-4">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded px-3 py-1.5 text-xs font-bold outline-none"
              />
              <button className="bg-primary text-black px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest hover:opacity-90">
                Sync Macros
              </button>
            </div>
          }
        />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Daily Summary Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-card-bg rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Balanço Calórico</h4>
                <div className="relative size-32 mx-auto">
                  <svg className="size-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * getPercentage(log.calories, targets.calories)) / 100} className="text-primary" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black">{log.calories}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500">kcal</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-500">Meta Diária</span>
                  <span>{targets.calories} kcal</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <NutritionTargetCard label="Proteínas" current={log.protein} target={targets.protein} unit="g" icon="egg" color="bg-accent-blue" onUpdate={(val) => handleUpdate('protein', val)} />
              <NutritionTargetCard label="Carboidratos" current={log.carbs} target={targets.carbs} unit="g" icon="bakery_dining" color="bg-amber-500" onUpdate={(val) => handleUpdate('carbs', val)} />
              <NutritionTargetCard label="Gorduras" current={log.fat} target={targets.fat} unit="g" icon="water_drop" color="bg-rose-500" onUpdate={(val) => handleUpdate('fat', val)} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-card-bg rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest">Hidratação</h4>
                <span className="text-xs font-black text-primary">{log.waterLiters || 0}L / {targets.water}L</span>
              </div>
              <div className="flex gap-2">
                {[250, 500, 750].map(v => (
                  <button 
                    key={v}
                    onClick={() => handleUpdate('waterLiters', Number((log.waterLiters || 0)) + (v/1000))}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-black py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    +{v}ml
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-card-bg rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest">Aderência</h4>
                <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${log.adherent ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  {log.adherent ? 'Em Meta' : 'Fora da Meta'}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-around">
                <div className="text-center">
                  <div className="text-2xl font-black text-primary">{stats?.adherenceRate || 0}%</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">Aderência (7D)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black">{stats?.avgCalories || 0}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">Média Kcal</div>
                </div>
                <button 
                  onClick={() => handleUpdate('adherent', !log.adherent)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${log.adherent ? 'border-primary text-primary' : 'bg-primary text-black'}`}
                >
                  {log.adherent ? 'Invalidar Dia' : 'Validar Dia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
