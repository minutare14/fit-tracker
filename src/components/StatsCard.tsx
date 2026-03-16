interface StatsCardProps {
  label: string
  value: string | number
  unit?: string
  change?: string
  trend?: "up" | "down"
}

export default function StatsCard({ label, value, unit, change, trend }: StatsCardProps) {
  const isPositive = trend === "up"
  const changeColor = isPositive ? "text-primary bg-primary/10" : "text-red-400 bg-red-400/10"

  return (
    <div className="bg-card-bg border border-slate-800 p-6 rounded-xl flex flex-col gap-2">
      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-slate-100">
          {value} {unit && <span className="text-sm font-normal text-slate-500">{unit}</span>}
        </span>
        {change && (
          <span className={`${changeColor} text-xs font-bold px-2 py-0.5 rounded`}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}
