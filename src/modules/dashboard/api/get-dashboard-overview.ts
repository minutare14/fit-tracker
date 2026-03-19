import { requestJson } from "@/modules/core/api/http-client";
import { DashboardOverview } from "@/modules/dashboard/types/dashboard.types";
import { mapDashboardOverview } from "@/modules/dashboard/mappers/dashboard.mapper";

export async function getDashboardOverview() {
  const response = await requestJson<DashboardOverview>("/api/dashboard/overview");
  return mapDashboardOverview(response);
}
