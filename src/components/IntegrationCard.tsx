interface IntegrationCardProps {
  name: string
  subtitle: string
  metrics: string
  health: string
  status: string
  statusColor: string
  icon: string
  lastSync: string
  borderColor: string
  pending?: boolean
  loading?: boolean
  onSync?: () => void
  onConfig?: () => void
  href?: string
}

export default function IntegrationCard({
  name,
  subtitle,
  metrics,
  health,
  status,
  statusColor,
  icon,
  lastSync,
  borderColor,
  pending = false,
  loading = false,
  onSync,
  onConfig,
  href,
}: IntegrationCardProps) {
  const content = (
    <>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center text-white relative">
            <span className={`material-symbols-outlined ${loading ? 'opacity-20' : ''}`}>{icon}</span>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <span className={`px-2 py-1 rounded ${statusColor} text-[10px] font-bold uppercase tracking-tighter`}>
            {status}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{name}</h3>
        <p className="text-[11px] text-slate-400 mb-4 italic">{subtitle}</p>
        
        {!pending ? (
          <div className="space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Métricas:</span>
              <span className="text-slate-300">{metrics}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Saúde:</span>
              <span className="text-primary font-bold">{health}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
            A conexão expirou ou ainda não foi configurada para este atleta.
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {lastSync}
        </div>
        
        <div className="flex items-center gap-2">
          {onConfig && (
            <button 
              onClick={(e) => { e.stopPropagation(); onConfig(); }}
              className="text-slate-500 hover:text-white transition-colors"
              title="Configurar"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          )}
          
          {!pending && onSync && (
            <button 
              onClick={(e) => { e.stopPropagation(); onSync(); }}
              disabled={loading}
              className="text-primary hover:text-white transition-colors flex items-center gap-1 group/btn"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
              <span className="text-[9px] font-black uppercase tracking-tighter hidden group-hover/btn:block">Sincronizar</span>
            </button>
          )}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={`bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 ${borderColor} flex flex-col justify-between shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer block`}>
        {content}
      </a>
    );
  }

  return (
    <div className={`bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 ${borderColor} flex flex-col justify-between shadow-sm hover:border-primary/group transition-all group`}>
      {content}
      {pending && (
        <button className="w-full py-2 bg-yellow-500 text-background-dark rounded text-xs font-bold uppercase hover:bg-yellow-400 transition-colors mt-4">
          Conectar Conta
        </button>
      )}
    </div>
  )
}
