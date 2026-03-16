interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="h-16 min-h-[64px] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-background-light dark:bg-background-dark sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider -mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}
