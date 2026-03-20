export interface WeightEntryViewModel {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number | null;
  notes: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeightStats {
  currentWeight: number | null;
  currentBodyFat: number | null;
  previousWeight: number | null;
  previousDate: string | null;
  avg7d: number | null;
  trend: string | null;
  diff: number | null;
  totalEntries: number;
}

export interface WeightOverview {
  entries: WeightEntryViewModel[];
  stats: WeightStats;
}

export interface CreateWeightEntryInput {
  date: string;
  weightKg: number;
  bodyFatPct?: number | null;
  notes?: string | null;
  source?: string;
}
