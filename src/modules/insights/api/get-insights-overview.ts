import { requestJson } from "@/modules/core/api/http-client";
import { mapInsightsOverview } from "@/modules/insights/mappers/insights.mapper";
import { InsightsOverview } from "@/modules/insights/types/insights.types";

export async function getInsightsOverview() {
  const data = await requestJson<Partial<InsightsOverview>>("/api/insights/overview");
  return mapInsightsOverview(data);
}
