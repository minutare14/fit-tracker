"use client"

import { useEffect, useState } from "react"

interface HealthWebhookConfigProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface HealthConfigResponse {
  webhookUrl: string
  headerName: string
  secretMask: string | null
  hasSecret: boolean
  status: string
}

export default function HealthWebhookConfig({ userId, isOpen, onClose, onSuccess }: HealthWebhookConfigProps) {
  const [config, setConfig] = useState<HealthConfigResponse | null>(null)
  const [webhookSecret, setWebhookSecret] = useState("")
  const [headerName, setHeaderName] = useState("x-health-autoexport-secret")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const controller = new AbortController()

    const loadConfig = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/integrations/health/config?userId=${encodeURIComponent(userId)}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error("Failed to load Health Auto Export config")
        }

        const data = (await res.json()) as HealthConfigResponse
        setConfig(data)
        setHeaderName(data.headerName || "x-health-autoexport-secret")
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadConfig()

    return () => controller.abort()
  }, [isOpen, userId])

  if (!isOpen) return null

  const handleCopy = async () => {
    if (!config?.webhookUrl) {
      return
    }

    await navigator.clipboard.writeText(config.webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/integrations/health/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          webhookSecret,
          headerName,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save Health Auto Export configuration")
      }

      setWebhookSecret("")
      setConfig((current) =>
        current
          ? { ...current, headerName: data.headerName, secretMask: data.secretMask, hasSecret: true, status: "ACTIVE" }
          : current
      )
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="mb-6 flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <span className="material-symbols-outlined text-primary">health_metrics</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Health Auto Export</h2>
            <p className="text-xs text-zinc-400">Configure o webhook real e salve o segredo no backend.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-6 text-center text-sm text-zinc-400">
            Carregando configuracao do webhook...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Webhook URL</label>
              <div className="flex gap-2">
                <code className="line-clamp-1 flex-1 break-all rounded border border-zinc-800 bg-black/40 px-3 py-2 font-mono text-xs text-primary">
                  {config?.webhookUrl ?? "Indisponivel"}
                </code>
                <button
                  onClick={() => void handleCopy()}
                  className="rounded-lg bg-zinc-800 p-2 transition-colors hover:bg-zinc-700"
                  title="Copiar URL"
                  disabled={!config?.webhookUrl}
                >
                  <span className="material-symbols-outlined text-sm text-zinc-400">
                    {copied ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nome do Header</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
                  value={headerName}
                  onChange={(e) => setHeaderName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Segredo do Webhook</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={config?.secretMask ?? "Defina um segredo forte"}
                />
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-xs text-zinc-300">
              <p className="font-semibold text-primary">Estado atual</p>
              <p className="mt-1">Status: {config?.status ?? "DISCONNECTED"}</p>
              <p>Segredo salvo: {config?.secretMask ?? "nenhum"}</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Passo a passo</h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>1. No Health Auto Export, selecione o modo Webhook JSON.</li>
                <li>2. Use a URL acima como endpoint.</li>
                <li>3. Envie o header configurado aqui com o segredo salvo no backend.</li>
                <li>4. Depois da primeira entrega, a sincronizacao real passa a aparecer na tela.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-800 px-4 py-3 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Fechar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving || !webhookSecret.trim()}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-xs font-bold text-background-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar configuracao"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
