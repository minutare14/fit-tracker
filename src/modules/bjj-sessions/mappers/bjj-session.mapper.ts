import { BjjSessionsOverview } from "@/modules/bjj-sessions/types/bjj-session.types";

export function mapBjjSessionsOverview(input: BjjSessionsOverview): BjjSessionsOverview {
  return {
    items: input.items ?? [],
    summary: {
      totalSessions: input.summary?.totalSessions ?? 0,
      monthlyMatHours: input.summary?.monthlyMatHours ?? 0,
      weeklyLoad: input.summary?.weeklyLoad ?? 0,
      averageSrpe: input.summary?.averageSrpe ?? null,
      lastSessionAt: input.summary?.lastSessionAt ?? null,
    },
  };
}
