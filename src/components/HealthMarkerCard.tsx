interface HealthMarkerCardProps {
  label: string
  value: string
  unit: string
  trend: string
  trendText: string
  trendColor: string
  chartColor: string
}

export default function HealthMarkerCard({
  label,
  value,
  unit,
  trend,
  trendText,
  trendColor,
  chartColor,
}: HealthMarkerCardProps) {
  return (
    <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:border-primary/30 transition-colors group">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-3xl font-black ${chartColor}`}>{value} <span className="text-sm font-bold text-slate-500">{unit}</span></h3>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={`material-symbols-outlined ${trendColor} text-sm`}>{trend}</span>
        <span className={`text-xs font-bold ${trendColor}`}>{trendText}</span>
      </div>
      <div className="mt-4 h-12 w-full flex items-end gap-1">
         {[0.5, 0.7, 0.5, 0.8, 0.9, 1].map((h, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-t-sm transition-all ${i === 5 ? chartColor : 'bg-slate-200 dark:bg-slate-800'}`} 
              style={{ height: `${h * 100}%`, backgroundColor: i === 5 ? undefined : '' }}
            ></div>
         ))}
      </div>
    </div>
  )
}
