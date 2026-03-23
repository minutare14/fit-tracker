import { requestJson } from "@/modules/core/api/http-client";
import { mapNutritionOverview } from "../mappers/nutrition.mapper";
import { NutritionOverview } from "../types/nutrition.types";

export async function getNutritionOverview(): Promise<NutritionOverview> {
  const data = await requestJson<Partial<NutritionOverview>>("/api/nutrition/overview");
  return mapNutritionOverview(data);
}
