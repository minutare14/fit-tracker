import { requestJson } from "@/modules/core/api/http-client";
import { mapRecoveryOverview } from "@/modules/recovery/mappers/recovery.mapper";
import { RecoveryOverview } from "@/modules/recovery/types/recovery.types";

export async function getRecoveryOverview() {
  const response = await requestJson<RecoveryOverview>("/api/recovery/overview");
  return mapRecoveryOverview(response);
}
