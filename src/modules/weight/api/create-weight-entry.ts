import { requestJson } from "@/modules/core/api/http-client";
import { WeightEntryViewModel, CreateWeightEntryInput } from "@/modules/weight/types/weight.types";

export async function createWeightEntry(input: CreateWeightEntryInput) {
  return requestJson<WeightEntryViewModel>("/api/weight/entries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
