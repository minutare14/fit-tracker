import { NutritionHistoryEntry, NutritionOverview } from "../types/nutrition.types";

const normalizeNumber = (value: unknown, fallback: number | null = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const mapHistoryEntry = (entry: Partial<NutritionHistoryEntry> & Record<string, unknown>): NutritionHistoryEntry => ({
  date: typeof entry.date === "string" ? entry.date : new Date().toISOString().slice(0, 10),
  calories: normalizeNumber(entry.calories, null),
  protein: normalizeNumber(entry.protein, null),
  carbs: normalizeNumber(entry.carbs, null),
  fat: normalizeNumber(entry.fat, null),
  hydration: normalizeNumber(entry.hydration, null),
  adherence: typeof entry.adherence === "boolean" ? entry.adherence : null,
  source: typeof entry.source === "string" ? entry.source : "NONE",
  notes: typeof entry.notes === "string" ? entry.notes : null,
});

export function mapNutritionOverview(input: Partial<NutritionOverview> | undefined): NutritionOverview {
  return {
    availability: {
      hasData: Boolean(input?.availability?.hasData),
      source: input?.availability?.source ?? "NONE",
      daysTracked: normalizeNumber(input?.availability?.daysTracked, 0) ?? 0,
      lastEntryAt: input?.availability?.lastEntryAt ?? null,
    },
    summary: {
      avgCalories7d: normalizeNumber(input?.summary?.avgCalories7d, 0) ?? 0,
      avgProtein7d: normalizeNumber(input?.summary?.avgProtein7d, null),
      avgCarbs7d: normalizeNumber(input?.summary?.avgCarbs7d, null),
      avgFat7d: normalizeNumber(input?.summary?.avgFat7d, null),
      avgHydration7d: normalizeNumber(input?.summary?.avgHydration7d, null),
      adherenceRate7d: normalizeNumber(input?.summary?.adherenceRate7d, 0) ?? 0,
      macrosHit7d: normalizeNumber(input?.summary?.macrosHit7d, 0) ?? 0,
      totalTrackedDays: normalizeNumber(input?.summary?.totalTrackedDays, 0) ?? 0,
    },
    targets: {
      calories: normalizeNumber(input?.targets?.calories, null),
      protein: normalizeNumber(input?.targets?.protein, null),
      carbs: normalizeNumber(input?.targets?.carbs, null),
      fat: normalizeNumber(input?.targets?.fat, null),
      hydration: normalizeNumber(input?.targets?.hydration, null),
    },
    history: Array.isArray(input?.history)
      ? input.history.map((entry) => mapHistoryEntry(entry as Partial<NutritionHistoryEntry> & Record<string, unknown>))
      : [],
    emptyStateReason: input?.emptyStateReason ?? "Sem dados nutricionais suficientes.",
  };
}
