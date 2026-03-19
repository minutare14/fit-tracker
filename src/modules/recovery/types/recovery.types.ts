export interface RecoveryMetricCard {
  label: string;
  value: number | null;
  unit: string;
  helper: string;
}

export interface RecoveryTrendPoint {
  date: string;
  hrv: number | null;
  sleepHours: number | null;
  load: number | null;
  recovery: number | null;
}

export interface RecoveryOverview {
  syncStatus: {
    connected: boolean;
    lastSync: string | null;
    totalRecords: number;
    status: string;
  };
  metrics: {
    readiness: RecoveryMetricCard;
    hrv: RecoveryMetricCard;
    restingHr: RecoveryMetricCard;
    sleep: RecoveryMetricCard;
    temperature: RecoveryMetricCard;
  };
  trend: RecoveryTrendPoint[];
  recommendations: string[];
  hasMinimumData: boolean;
}
