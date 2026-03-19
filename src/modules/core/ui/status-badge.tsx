interface StatusBadgeProps {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClassMap: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  default: "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-zinc-900 dark:text-slate-300",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",
};

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
}
