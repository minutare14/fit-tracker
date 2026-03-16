interface RecoveryProtocolItemProps {
  title: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
  borderVariant?: string
}

export default function RecoveryProtocolItem({
  title,
  description,
  icon,
  iconBg,
  iconColor,
  borderVariant = "border-slate-200 dark:border-slate-800"
}: RecoveryProtocolItemProps) {
  return (
    <div className={`flex gap-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border ${borderVariant} hover:border-primary/30 transition-colors`}>
      <div className={`size-10 shrink-0 rounded ${iconBg} flex items-center justify-center ${iconColor}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
