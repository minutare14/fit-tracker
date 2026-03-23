import { WeightEntryViewModel, WeightOverview, WeightStats } from "../types/weight.types";

const normalizeNumber = (value: unknown, fallback: number | null = null) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const normalizeString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

const mapEntry = (entry: Partial<WeightEntryViewModel> & Record<string, unknown>): WeightEntryViewModel => ({
  id: normalizeString(
    entry.id,
    `${normalizeString(entry.date, "entry")}-${normalizeNumber(entry.weightKg, 0)}-${normalizeString(entry.createdAt, "0")}`
  ),
  date: normalizeString(entry.date, new Date().toISOString().slice(0, 10)),
  weightKg: normalizeNumber(entry.weightKg, 0) ?? 0,
  bodyFatPct: normalizeNumber(entry.bodyFatPct),
  notes: typeof entry.notes === "string" ? entry.notes : null,
  source: normalizeString(entry.source, "manual"),
  createdAt: normalizeString(entry.createdAt, new Date().toISOString()),
  updatedAt: normalizeString(entry.updatedAt, new Date().toISOString()),
});

const mapStats = (stats: Partial<WeightStats> | undefined): WeightStats => ({
  currentWeight: normalizeNumber(stats?.currentWeight),
  currentBodyFat: normalizeNumber(stats?.currentBodyFat),
  previousWeight: normalizeNumber(stats?.previousWeight),
  previousDate: typeof stats?.previousDate === "string" ? stats.previousDate : null,
  avg7d: normalizeNumber(stats?.avg7d),
  trend: typeof stats?.trend === "string" ? stats.trend : null,
  diff: normalizeNumber(stats?.diff),
  totalEntries: typeof stats?.totalEntries === "number" && Number.isFinite(stats.totalEntries) ? stats.totalEntries : 0,
});

export function mapWeightOverview(input: Partial<WeightOverview> | undefined): WeightOverview {
  return {
    entries: Array.isArray(input?.entries) ? input!.entries.map((entry) => mapEntry(entry as Partial<WeightEntryViewModel> & Record<string, unknown>)) : [],
    stats: mapStats(input?.stats),
  };
}
