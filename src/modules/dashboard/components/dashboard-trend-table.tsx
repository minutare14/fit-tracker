import { DashboardTrendPoint } from "@/modules/dashboard/types/dashboard.types";
import { SurfaceCard } from "@/modules/core/ui/surface-card";

interface DashboardTrendTableProps {
  points: DashboardTrendPoint[];
}

export function DashboardTrendTable({ points }: DashboardTrendTableProps) {
  return (
    <SurfaceCard eyebrow="Carga x Recuperacao" title="Ultimos 7 dias">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="pb-3">Data</th>
              <th className="pb-3">Carga BJJ</th>
              <th className="pb-3">Forca</th>
              <th className="pb-3">Sono</th>
              <th className="pb-3">Readiness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {points.map((point) => (
              <tr key={point.date}>
                <td className="py-3 font-medium text-slate-900 dark:text-white">{point.date}</td>
                <td className="py-3 text-slate-600 dark:text-slate-300">{point.bjjLoad}</td>
                <td className="py-3 text-slate-600 dark:text-slate-300">{point.strengthMinutes} min</td>
                <td className="py-3 text-slate-600 dark:text-slate-300">{point.sleepHours ?? "--"}</td>
                <td className="py-3 text-slate-600 dark:text-slate-300">{point.readiness ?? "--"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
