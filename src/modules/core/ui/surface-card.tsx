interface SurfaceCardProps {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}

export function SurfaceCard({ title, eyebrow, children, className = "" }: SurfaceCardProps) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{eyebrow}</p> : null}
      {title ? <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{title}</h2> : null}
      <div className={title || eyebrow ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
