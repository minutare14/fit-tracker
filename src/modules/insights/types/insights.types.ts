export interface InsightBlock {
  title: string;
  detail: string;
  tone: "info" | "warning" | "success" | "danger";
}

export interface InsightsOverview {
  readiness: {
    status: "available" | "partial" | "missing";
    score: number | null;
    explanation: string;
    missingInputs: string[];
  };
  patterns: InsightBlock[];
  gaps: InsightBlock[];
  recommendations: InsightBlock[];
  dataImpact: InsightBlock[];
  loadRecovery: {
    status: "available" | "partial" | "missing";
    acuteLoad: number | null;
    chronicLoad: number | null;
    acwr: number | null;
    readinessTrend: number | null;
    explanation: string;
  };
  weightTrend: {
    status: "available" | "partial" | "missing";
    currentWeight: number | null;
    previousWeight: number | null;
    deltaFromPrevious: number | null;
    avg7d: number | null;
    explanation: string;
  };
  sessionFrequency: {
    status: "available" | "partial" | "missing";
    bjjSessionsLast30Days: number;
    strengthSessionsLast30Days: number;
    weeklyAverage: number | null;
    explanation: string;
  };
  hasEnoughData: boolean;
}
