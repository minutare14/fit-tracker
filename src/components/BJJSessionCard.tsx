interface BJJSessionCardProps {
  day: string
  month: string
  title: string
  type: string
  load: number
  rpe: number
  rpeText: string
  notes: string
  typeColor: string
}

export default function BJJSessionCard({
  day,
  month,
  title,
  type,
  load,
  rpe,
  rpeText,
  notes,
  typeColor,
}: BJJSessionCardProps) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-primary/30 transition-colors group">
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex flex-col items-center justify-center min-w-[80px] py-2 px-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
          <span className="text-xs font-bold text-slate-500 uppercase">{month}</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{day}</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeColor}`}>
                {type}
              </span>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{title}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Session Load</p>
              <p className="text-xl font-bold text-primary">{load}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium text-slate-900 dark:text-slate-400">Intensity (RPE {rpe})</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{rpeText}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${rpe * 10}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-slate-500 text-sm mt-0.5">notes</span>
              <p className="text-sm text-slate-500 line-clamp-2 italic">"{notes}"</p>
            </div>
          </div>
        </div>
        <div className="flex md:flex-col gap-2 justify-end">
          <button className="p-2 rounded hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button className="p-2 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
