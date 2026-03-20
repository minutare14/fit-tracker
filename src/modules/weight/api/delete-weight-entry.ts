import { requestJson } from "@/modules/core/api/http-client";

export async function deleteWeightEntry(id: string) {
  await requestJson<void>(`/api/weight/entries/${id}`, {
    method: "DELETE",
  });
}
