export type BjjTrainingType = "technical" | "drill" | "sparring" | "competition" | "open_mat";
export type BjjGiMode = "gi" | "nogi";

export interface CreateBjjSessionInput {
  date: string;
  startTime?: string | null;
  durationMinutes: number;
  location?: string | null;
  coach?: string | null;
  trainingType: BjjTrainingType;
  giMode: BjjGiMode;
  srpe: number;
  rounds?: number | null;
  roundDurationMinutes?: number | null;
  sparringMinutes?: number | null;
  drillMinutes?: number | null;
  techniqueMinutes?: number | null;
  trainedPositions?: string[];
  trainedTechniques?: string[];
  successfulTechniques?: string[];
  sufferedTechniques?: string[];
  notes?: string | null;
  fatigueBefore?: number | null;
  painLevel?: number | null;
  sessionScore?: number | null;
}

export interface BjjSessionViewModel extends CreateBjjSessionInput {
  id: string;
  trainedPositions: string[];
  trainedTechniques: string[];
  successfulTechniques: string[];
  sufferedTechniques: string[];
  sessionLoad: number;
  createdAt: string;
  updatedAt: string;
}

export interface BjjSessionsSummary {
  totalSessions: number;
  monthlyMatHours: number;
  weeklyLoad: number;
  averageSrpe: number | null;
  lastSessionAt: string | null;
}

export interface BjjSessionsOverview {
  items: BjjSessionViewModel[];
  summary: BjjSessionsSummary;
}
