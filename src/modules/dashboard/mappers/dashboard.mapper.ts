import { DashboardOverview } from "@/modules/dashboard/types/dashboard.types";

export function mapDashboardOverview(input: DashboardOverview): DashboardOverview {
  return {
    ...input,
    sources: input.sources ?? [],
    metrics: input.metrics ?? [],
    trend: input.trend ?? [],
    recentSessions: input.recentSessions ?? [],
    recommendations: input.recommendations ?? [],
    hasAnyData: Boolean(input.hasAnyData),
  };
}
