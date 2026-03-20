import { requestJson } from "@/modules/core/api/http-client";
import { WeightOverview } from "@/modules/weight/types/weight.types";

export async function getWeightOverview() {
  return requestJson<WeightOverview>("/api/weight/overview");
}
