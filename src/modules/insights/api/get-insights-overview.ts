import { requestJson } from "@/modules/core/api/http-client";
import { InsightsOverview } from "@/modules/insights/types/insights.types";

export async function getInsightsOverview() {
  return requestJson<InsightsOverview>("/api/insights/overview");
}
