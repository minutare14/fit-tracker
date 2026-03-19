interface MetricTileProps {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "primary";
}

export function MetricTile({ label, value, helper, tone = "default" }: MetricTileProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className={`mt-4 text-3xl font-black ${tone === "primary" ? "text-primary" : "text-slate-900 dark:text-white"}`}>
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}
