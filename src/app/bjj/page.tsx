"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import PageHeader from "@/components/PageHeader"
import BJJSessionCard from "@/components/BJJSessionCard"

export default function BJJPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 90,
    type: "Sparring",
    rpe: 8,
    notes: ""
  })

  const fetchData = async () => {
    try {
      const userId = 'default-user'
      const [sessionsRes, statsRes] = await Promise.all([
        fetch(`/api/bjj?userId=${userId}`),
        fetch(`/api/bjj?type=stats&userId=${userId}`)
      ])
      
      const sessionsData = await sessionsRes.json()
      const statsData = await statsRes.json()
      
      setSessions(Array.isArray(sessionsData) ? sessionsData : [])
      setStats(statsData)
    } catch (err) {
      console.error("Failed to fetch BJJ data", err)
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
      const res = await fetch('/api/bjj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user', ...formData })
      })
      if (res.ok) {
        setShowModal(false)
        fetchData()
      }
    } catch (err) {
      alert("Erro ao salvar sessão")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta sessão?")) return
    try {
      await fetch('/api/bjj', {
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
      
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        <PageHeader 
          title="Jiu-Jitsu Sessions" 
          action={
            <div className="flex items-center gap-4">
               <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-white/5 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50" 
                  placeholder="Techniques or notes..." 
                  type="text"
                />
              </div>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <button 
                  onClick={() => setShowModal(true)}
                  className="w-full h-32 bg-primary hover:bg-primary/90 text-background-dark rounded-xl flex flex-col items-center justify-center gap-2 transition-all group shadow-lg shadow-primary/10"
                >
                  <span className="material-symbols-outlined text-4xl font-bold group-hover:scale-110 transition-transform">add_circle</span>
                  <span className="text-xl font-bold uppercase tracking-wider">Log New Session</span>
                </button>
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Monthly Mat Hours</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-3xl font-bold">{stats?.monthlyMatHours || '0'}</span>
                    <span className="text-emerald-500 text-xs font-bold mb-1">hrs</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Weekly Load</p>
                   <div className="flex items-end gap-1 mt-2 h-10">
                    <span className="text-3xl font-bold">{stats?.weeklyLoad || '0'}</span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase mb-1">load</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Recent Sessions</h2>
              {sessions.length === 0 && !loading && (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10 text-slate-500 font-bold uppercase tracking-widest text-xs">
                  Ainda não há sessões registradas
                </div>
              )}
              {sessions.map((session) => (
                <div key={session.id} className="relative group">
                  <BJJSessionCard 
                    day={new Date(session.date).getDate().toString()}
                    month={new Date(session.date).toLocaleString('default', { month: 'short' })}
                    title={session.type}
                    type={session.type}
                    load={session.load}
                    rpe={session.rpe}
                    rpeText={session.rpe >= 8 ? 'Hard' : session.rpe >= 5 ? 'Challenging' : 'Light'}
                    notes={session.notes}
                    typeColor={session.type === 'Sparring' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}
                  />
                  <button 
                    onClick={() => handleDelete(session.id)}
                    className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Log BJJ Session</h3>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Duração (min)</label>
                    <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-primary appearance-none">
                      <option>Sparring</option>
                      <option>Technical</option>
                      <option>Drilling</option>
                      <option>Competition</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">RPE (1-10)</label>
                    <input type="number" min="1" max="10" value={formData.rpe} onChange={e => setFormData({...formData, rpe: parseInt(e.target.value)})} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-primary" />
                  </div>
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
                  {loading ? 'Salvando...' : 'Salvar Sessão'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
