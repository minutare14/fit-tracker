interface ActivityItemProps {
  title: string
  timeAgo: string
  subtitle: string
  icon: string
  iconBg: string
}

export default function ActivityItem({ title, timeAgo, subtitle, icon, iconBg }: ActivityItemProps) {
  return (
    <div className="p-4 border-b border-slate-800 flex items-center gap-3">
      <div className={`size-8 rounded flex items-center justify-center text-background-dark shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-base">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold truncate text-slate-100">{title}</p>
          <span className="text-[10px] text-slate-500">{timeAgo}</span>
        </div>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  )
}
