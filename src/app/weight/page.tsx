"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import PageHeader from "@/components/PageHeader"
import WeightKPI from "@/components/WeightKPI"

export default function WeightPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: 82.5,
    bodyFat: 12.5,
    notes: ""
  })

  const fetchData = async () => {
    try {
      const userId = 'default-user'
      const [entriesRes, statsRes] = await Promise.all([
        fetch(`/api/weight?userId=${userId}`),
        fetch(`/api/weight?type=stats&userId=${userId}`)
      ])
      const entriesData = await entriesRes.json()
      const statsData = await statsRes.json()
      setEntries(Array.isArray(entriesData) ? entriesData : [])
      setStats(statsData)
    } catch (err) {
      console.error("Failed to fetch weight data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user', ...formData })
      })
      if (res.ok) {
        setShowModal(false)
        fetchData()
      }
    } catch (err) {
      alert("Erro ao salvar peso")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este registro?")) return
    try {
      await fetch('/api/weight', {
        method: 'DELETE',
        body: JSON.stringify({ id, userId: 'default-user' })
      })
      fetchData()
    } catch (err) {
      alert("Erro ao excluir")
    }
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col overflow-y-auto">
        <PageHeader 
          title="Peso e Composição" 
          action={
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowModal(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-black hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          }
        />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WeightKPI 
              label="Peso Atual" 
              value={`${stats?.currentWeight || '0'} kg`} 
              subValue="vs média 7 dias" 
              trend={stats?.trend || 'flat'} 
              trendText={stats?.diff ? `${stats.diff}kg` : '-'} 
              trendColor={stats?.trend === 'down' ? 'text-emerald-500' : 'text-rose-500'} 
            />
            <WeightKPI 
              label="% Gordura" 
              value={`${stats?.currentBodyFat || '0'}%`} 
              subValue="Última medição" 
              trend="flat" 
              trendText="N/A" 
              trendColor="text-slate-500" 
            />
            <WeightKPI label="Média 7 Dias" value={`${stats?.avg7d || '0'} kg`} subValue="Baseada em histórico" trend="flat" />
            <WeightKPI label="Registros" value={entries.length.toString()} subValue="Nos últimos 30 dias" badge="Histórico" />
          </div>

          {/* History Table */}
          <div className="bg-white dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Histórico de Pesagem</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Peso</th>
                    <th className="px-6 py-3">Gordura %</th>
                    <th className="px-6 py-3">Notas</th>
                    <th className="px-6 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {entries.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Nenhum registro encontrado</td>
                    </tr>
                  )}
                  {entries.map((row) => (
                    <tr key={row.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{new Date(row.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4 font-bold text-primary">{row.weight} kg</td>
                      <td className="px-6 py-4 text-slate-500">{row.bodyFat ? `${row.bodyFat}%` : '-'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">{row.notes || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(row.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Registrar Peso</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Data</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Peso (kg)</label>
                    <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Gordura (%)</label>
                  <input type="number" step="0.1" value={formData.bodyFat} onChange={e => setFormData({...formData, bodyFat: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Notas</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-primary h-24 resize-none" />
                </div>
                <button 
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full bg-primary text-background-dark py-3 rounded-lg font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
