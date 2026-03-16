"use client"

interface NutritionTargetCardProps {
  label: string
  current: number
  target: number
  unit: string
  icon: string
  color: string
  onUpdate?: (val: number) => void
}

export default function NutritionTargetCard({
  label,
  current,
  target,
  unit,
  icon,
  color,
  onUpdate
}: NutritionTargetCardProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100)
  
  return (
    <div className="bg-white dark:bg-card-bg rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-slate-900 dark:text-slate-100`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">{current}{unit}</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Meta: {target}{unit}</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div className={`h-full ${color.replace('bg-', 'bg-opacity-100 bg-')}`} style={{ width: `${percentage}%` }}></div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onUpdate?.(Math.max(0, current - 5))}
              className="size-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
            >
              <span className="material-symbols-outlined text-xs">remove</span>
            </button>
            <button 
              onClick={() => onUpdate?.(current + 5)}
              className="size-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
            >
              <span className="material-symbols-outlined text-xs">add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
