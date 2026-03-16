interface MealItemProps {
  title: string
  description: string
  prot: string
  carb: string
  kcal: string
  icon: string
  iconBg: string
  isLogged?: boolean
}

export default function MealItem({
  title,
  description,
  prot,
  carb,
  kcal,
  icon,
  iconBg,
  isLogged = true,
}: MealItemProps) {
  if (!isLogged) {
    return (
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded border-2 border-dashed border-primary/50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">add_circle</span>
          </div>
          <div>
            <h4 className="font-bold text-primary">{title}</h4>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center">
          <button className="px-4 py-2 bg-primary text-background-dark text-xs font-black uppercase rounded tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
            Registrar agora
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-4">
        <div className={`size-12 rounded ${iconBg} flex items-center justify-center`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Prot</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{prot}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Carb</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{carb}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Kcal</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{kcal}</div>
          </div>
        </div>
        <button className="size-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 transition-colors">
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      </div>
    </div>
  )
}
