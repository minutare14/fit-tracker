import { RecoveryMetricCard } from "@/modules/recovery/types/recovery.types";
import { SurfaceCard } from "@/modules/core/ui/surface-card";

interface RecoveryWidgetProps {
  metric: RecoveryMetricCard;
}

export function RecoveryWidget({ metric }: RecoveryWidgetProps) {
  return (
    <SurfaceCard>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
      <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
        {metric.value !== null ? `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}` : "--"}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.helper}</p>
    </SurfaceCard>
  );
}
