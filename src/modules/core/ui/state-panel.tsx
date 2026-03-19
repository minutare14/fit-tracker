interface StatePanelProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function StatePanel({ eyebrow, title, description, actions }: StatePanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
