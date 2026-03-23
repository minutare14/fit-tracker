import { requestJson } from "@/modules/core/api/http-client";
import { mapWeightOverview } from "@/modules/weight/mappers/weight.mapper";
import { WeightOverview } from "@/modules/weight/types/weight.types";

export async function getWeightOverview() {
  const data = await requestJson<Partial<WeightOverview>>("/api/weight/overview");
  return mapWeightOverview(data);
}
