"use client"

import { useEffect, useState } from "react"

interface HevyConfigModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function HevyConfigModal({ userId, isOpen, onClose, onSuccess }: HevyConfigModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMask, setCurrentMask] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const controller = new AbortController()

    const loadConfig = async () => {
      setLoadingConfig(true)
      try {
        const res = await fetch(`/api/integrations/hevy/config?userId=${encodeURIComponent(userId)}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error("Failed to load Hevy configuration")
        }

        const data = await res.json()
        setCurrentMask(data.apiKeyMask ?? null)
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message)
        }
      } finally {
        setLoadingConfig(false)
      }
    }

    void loadConfig()

    return () => controller.abort()
  }, [isOpen, userId])

  if (!isOpen) return null

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/integrations/hevy/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, apiKey })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to save configuration")
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-sky-400">fitness_center</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Hevy Integration</h2>
            <p className="text-xs text-zinc-400">Configure sua API Key para sincronizar treinos</p>
          </div>
        </div>

        <div className="space-y-4">
          {loadingConfig ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
              Carregando configuracao atual...
            </div>
          ) : currentMask ? (
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-200">
              API key atual salva no backend: <strong>{currentMask}</strong>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
              Nenhuma API key salva ainda. A credencial fica criptografada no backend.
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">API Key</label>
            <input 
              type="password"
              placeholder="02dbf7b8-..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-sky-500 outline-none transition-colors"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={loading || !apiKey}
              className="flex-1 px-4 py-2.5 rounded-lg bg-sky-500 text-white text-xs font-bold hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Validando..." : "Salvar & Testar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
