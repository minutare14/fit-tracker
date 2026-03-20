export interface NutritionLogViewModel {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterLiters: number;
  isAdherent: boolean;
}

export interface NutritionStats {
  avgCalories7d: number;
  adherenceRate7d: number;
  macrosHit7d: number;
  totalTrackedDays: number;
}

export interface NutritionOverview {
  recentLogs: NutritionLogViewModel[];
  stats: NutritionStats;
}
