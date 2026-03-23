export interface NutritionHistoryEntry {
  date: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  hydration: number | null;
  adherence: boolean | null;
  source: string;
  notes: string | null;
}

export interface NutritionOverview {
  availability: {
    hasData: boolean;
    source: string;
    daysTracked: number;
    lastEntryAt: string | null;
  };
  summary: {
    avgCalories7d: number;
    avgProtein7d: number | null;
    avgCarbs7d: number | null;
    avgFat7d: number | null;
    avgHydration7d: number | null;
    adherenceRate7d: number;
    macrosHit7d: number;
    totalTrackedDays: number;
  };
  targets: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    hydration: number | null;
  };
  history: NutritionHistoryEntry[];
  emptyStateReason: string | null;
}
