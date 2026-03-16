interface WeightKPIProps {
  label: string
  value: string
  subValue: string
  trend?: "up" | "down" | "flat"
  trendText?: string
  trendColor?: string
  badge?: string
}

export default function WeightKPI({
  label,
  value,
  subValue,
  trend,
  trendText,
  trendColor,
  badge,
}: WeightKPIProps) {
  return (
    <div className="bg-white dark:bg-[#121212] p-6 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group shadow-sm hover:border-primary/30 transition-colors">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</h3>
        {trend && (
          <span className={`text-xs font-medium ${trendColor} flex items-center`}>
            {trend === 'up' && <span className="material-symbols-outlined text-sm">arrow_upward</span>}
            {trend === 'down' && <span className="material-symbols-outlined text-sm">arrow_downward</span>}
            {trend === 'flat' && <span className="material-symbols-outlined text-sm">trending_flat</span>}
            {trendText}
          </span>
        )}
        {badge && (
          <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-500 mt-2">{subValue}</p>
    </div>
  )
}
