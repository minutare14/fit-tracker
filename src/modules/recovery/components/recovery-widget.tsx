import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { RecoveryMetricCard } from "@/modules/recovery/types/recovery.types";

interface RecoveryWidgetProps {
  metric: RecoveryMetricCard;
}

const toneByStatus = {
  available: "text-primary",
  partial: "text-amber-500",
  missing: "text-slate-400",
} as const;

export function RecoveryWidget({ metric }: RecoveryWidgetProps) {
  if (!metric) return null;

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          {metric.label || "Metrica"}
        </p>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {metric.status}
        </span>
      </div>
      <p className={`mt-4 text-3xl font-black ${toneByStatus[metric.status]}`}>
        {metric.value !== null && metric.value !== undefined
          ? `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`
          : "--"}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {metric.helper || "Sem dados."}
      </p>
      {metric.reasonUnavailable ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {metric.reasonUnavailable}
        </p>
      ) : null}
    </SurfaceCard>
  );
}
