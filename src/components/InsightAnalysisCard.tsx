interface InsightAnalysisCardProps {
  title: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
  badge: string
  footerText: string
  hoverBorder: string
  fullWidth?: boolean
}

export default function InsightAnalysisCard({
  title,
  description,
  icon,
  iconBg,
  iconColor,
  badge,
  footerText,
  hoverBorder,
  fullWidth = false,
}: InsightAnalysisCardProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-5 rounded-lg group hover:border-${hoverBorder} transition-all ${fullWidth ? 'md:col-span-2' : ''} shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 ${iconBg} ${iconColor} rounded`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase">{badge}</span>
      </div>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h5>
      <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{description}</p>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
        <span className="text-[10px] font-bold py-0.5 px-2 bg-zinc-100 dark:bg-zinc-800 rounded uppercase text-slate-500 dark:text-zinc-400">
          {footerText}
        </span>
      </div>
    </div>
  )
}
