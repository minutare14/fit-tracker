export interface DashboardSourceStatus {
  label: string;
  state: "connected" | "warning" | "missing";
  detail: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}

export interface DashboardTrendPoint {
  date: string;
  bjjLoad: number;
  strengthMinutes: number;
  sleepHours: number | null;
  readiness: number | null;
}

export interface DashboardRecentSession {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  load: number;
}

export interface DashboardOverview {
  sources: DashboardSourceStatus[];
  metrics: DashboardMetric[];
  trend: DashboardTrendPoint[];
  recentSessions: DashboardRecentSession[];
  recommendations: string[];
  hasAnyData: boolean;
}
