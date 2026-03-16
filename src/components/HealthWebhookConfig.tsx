"use client"

import { useState } from "react"

interface HealthWebhookConfigProps {
  isOpen: boolean
  onClose: () => void
}

export default function HealthWebhookConfig({ isOpen, onClose }: HealthWebhookConfigProps) {
  const [copied, setCopied] = useState(false)
  
  if (!isOpen) return null

  // In a real app this would come from an environment variable or window.location
  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/integrations/health/webhook`

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-6 text-left">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">health_metrics</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Health Auto Export</h2>
            <p className="text-xs text-zinc-400">Configure o webhook no seu iOS</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Webhook URL</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-black/40 rounded px-3 py-2 text-xs text-primary font-mono break-all line-clamp-1 border border-zinc-800">
                {webhookUrl}
              </code>
              <button 
                onClick={handleCopy}
                className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg transition-colors"
                title="Copiar URL"
              >
                <span className="material-symbols-outlined text-zinc-400 text-sm">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Passo a Passo:</h4>
            <ul className="space-y-2.5">
              {[
                "Abra o app 'Health Auto Export' no iOS.",
                "Vá em 'Automations' e adicione uma nova.",
                "Selecione 'Webhook' como destino.",
                "Cole a URL acima no campo 'Endpoint URL'.",
                "Certifique-se de que o formato seja JSON.",
                "Habilite as métricas de Nutrição e Exercíos."
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-zinc-400">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-4 px-4 py-3 rounded-lg bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
