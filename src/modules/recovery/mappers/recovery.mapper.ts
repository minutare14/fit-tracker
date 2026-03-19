import { RecoveryOverview } from "@/modules/recovery/types/recovery.types";

export function mapRecoveryOverview(input: RecoveryOverview): RecoveryOverview {
  return {
    ...input,
    trend: input.trend ?? [],
    recommendations: input.recommendations ?? [],
    hasMinimumData: Boolean(input.hasMinimumData),
  };
}
