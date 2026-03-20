import { requestJson } from "@/modules/core/api/http-client";
import { NutritionOverview } from "../types/nutrition.types";

export async function getNutritionOverview(): Promise<NutritionOverview> {
  return requestJson<NutritionOverview>("/api/nutrition/overview");
}
