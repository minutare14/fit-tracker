"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import PageHeader from "@/components/PageHeader"
import IntegrationCard from "@/components/IntegrationCard"
import HevyConfigModal from "@/components/HevyConfigModal"
import HealthWebhookConfig from "@/components/HealthWebhookConfig"

interface Connection {
  id: string
  provider: string
  isEnabled: boolean
  status: string
  lastSyncAt: string | null
}

interface SyncRun {
  id: string
  startedAt: string
  provider: string
  status: string
  recordsCount: number
  errorMessage: string | null
}

export default function SettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [isHevyModalOpen, setIsHevyModalOpen] = useState(false)
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false)
  const userId = "default-user" // In a real app, this comes from auth/session

  const fetchData = async () => {
    try {
      const res = await fetch('/api/integrations')
      const data = await res.json()
      setConnections(data.connections)
      setSyncRuns(data.syncRuns)
      setStats(data.stats)
    } catch (err) {
      console.error("Failed to fetch integration data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSync = async (provider: string) => {
    setSyncing(prev => ({ ...prev, [provider]: true }))
    try {
      const endpoint = provider === 'HEVY' ? '/api/integrations/hevy/sync' : null
      if (!endpoint) return

      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ userId: 'default-user' })
      })
      
      if (!res.ok) throw new Error("Sync failed")
      
      await fetchData() // Refresh data
    } catch (err) {
      alert(`Erro ao sincronizar ${provider}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setSyncing(prev => ({ ...prev, [provider]: false }))
    }
  }

  const getConnection = (provider: string) => connections.find(c => c.provider === provider)

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        <PageHeader 
          title="Gerenciamento de Integrações" 
          action={
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Status Global</p>
              <p className="text-primary font-bold flex items-center gap-2 justify-end text-sm">
                Sistemas Operacionais
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </p>
            </div>
          }
        />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Integration Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <IntegrationCard 
              name="Apple Health" subtitle="via Health Auto Export" metrics="Webhooks" health="Pronto" 
              status={getConnection('HEALTH_AUTO_EXPORT')?.isEnabled ? 'Ativo' : 'Aguardando'} 
              statusColor={getConnection('HEALTH_AUTO_EXPORT')?.isEnabled ? 'bg-primary/10 text-primary' : 'bg-slate-500/10 text-slate-500'} 
              icon="health_metrics" 
              lastSync={getConnection('HEALTH_AUTO_EXPORT')?.lastSyncAt ? new Date(getConnection('HEALTH_AUTO_EXPORT')!.lastSyncAt!).toLocaleTimeString() : 'Nunca'} 
              borderColor="border-l-4 border-l-primary"
              onConfig={() => setIsHealthModalOpen(true)}
            />
            <IntegrationCard 
              name="Hevy" subtitle="Treinamento de Força" metrics="API Sync" health="Ativo" 
              status={getConnection('HEVY')?.isEnabled ? 'Conectado' : 'Desconectado'} 
              statusColor={getConnection('HEVY')?.isEnabled ? 'bg-sky-400/10 text-sky-400' : 'bg-red-400/10 text-red-500'} 
              icon="fitness_center" 
              lastSync={getConnection('HEVY')?.lastSyncAt ? new Date(getConnection('HEVY')!.lastSyncAt!).toLocaleTimeString() : 'Nunca'} 
              borderColor="border-l-4 border-l-sky-400"
              onSync={() => handleSync('HEVY')}
              href="/settings/integrations/hevy"
              loading={syncing['HEVY']}
            />
            <IntegrationCard 
              name="Nutrição" subtitle="Macros & Dieta" metrics="Input Manual" health="Ativo" 
              status="Habilitado" statusColor="bg-yellow-500/10 text-yellow-500" icon="restaurant" lastSync="Histórico" borderColor="border-l-4 border-l-yellow-500"
            />
            <IntegrationCard 
              name="Registros Manuais" subtitle="Treinos de Jiu-Jitsu" metrics="Manual" health="Consistente" 
              status="Ativo" statusColor="bg-primary/5 text-primary/60" icon="sports_kabaddi" lastSync="Histórico" borderColor="border-l-4 border-l-primary/40"
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">monitoring</span>
                  Saúde dos Dados
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[11px] mb-2 font-bold tracking-tight">
                      <span className="text-slate-400 uppercase">Sincronização (30D)</span>
                      <span className="text-primary">{stats?.successRate || '98.4'}%</span>
                    </div>
                    <div className="flex gap-1 h-8 items-end">
                      {[20, 40, 60, 30, 80, 50, 100, 90, 100, 100, 80, 100].map((v, i) => (
                        <div key={i} className={`flex-1 rounded-t-sm transition-all ${v === 100 ? 'bg-primary' : 'bg-primary/30'}`} style={{ height: `${v}%` }}></div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded border border-white/5">
                      <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Tempo Sync</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">{stats?.avgSyncTime || '1.2s'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded border border-white/5">
                      <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Erros</p>
                      <p className="text-xl font-black text-red-500">{stats?.totalErrors || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-400 text-lg">history</span>
                    Histórico de Sincronização
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase text-slate-500 font-black">
                        <th className="px-6 py-4">Data/Hora</th>
                        <th className="px-6 py-4">Fonte</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Itens</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-900 dark:text-slate-100">
                      {syncRuns.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono">{new Date(log.startedAt).toLocaleString()}</td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <span className={`material-symbols-outlined text-[16px] ${log.provider === 'HEVY' ? 'text-sky-400' : 'text-primary'}`}>
                              {log.provider === 'HEVY' ? 'fitness_center' : 'health_metrics'}
                            </span>
                            {log.provider}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1.5 ${log.status === 'FAILURE' ? 'text-red-500' : 'text-primary'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'FAILURE' ? 'bg-red-500' : 'bg-primary'}`}></span>
                              {log.status === 'FAILURE' ? 'Erro' : 'Sucesso'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{log.recordsCount} data points</td>
                        </tr>
                      ))}
                      {syncRuns.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                            Nenhum registro encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <HevyConfigModal 
          userId={userId} 
          isOpen={isHevyModalOpen} 
          onClose={() => setIsHevyModalOpen(false)} 
          onSuccess={fetchData} 
        />
        <HealthWebhookConfig 
          isOpen={isHealthModalOpen} 
          onClose={() => setIsHealthModalOpen(false)} 
        />
      </main>
    </div>
  )
}
