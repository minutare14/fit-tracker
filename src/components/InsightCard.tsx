interface InsightCardProps {
  title: string
  description: string
  type: "improvement" | "gap" | "warning"
}

export default function InsightCard({ title, description, type }: InsightCardProps) {
  const config = {
    improvement: { icon: "trending_up", color: "text-primary bg-primary/10" },
    gap: { icon: "restaurant", color: "text-accent-blue bg-accent-blue/10" },
    warning: { icon: "warning", color: "text-red-500 bg-red-500/10" },
  }

  const { icon, color } = config[type]

  return (
    <div className="bg-card-bg border border-slate-800 rounded-xl p-5 flex gap-4">
      <div className={`size-10 rounded flex items-center justify-center shrink-0 ${color}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-100">{title}</p>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  )
}
