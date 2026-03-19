export interface InsightsOverview {
  readiness: number | null;
  weeklyLoad: number;
  bjjSessionsLast30Days: number;
  strengthSessionsLast30Days: number;
  healthRecordsLast14Days: number;
  nutritionLogsLast14Days: number;
  dataGaps: string[];
  recommendations: string[];
  hasEnoughData: boolean;
}
