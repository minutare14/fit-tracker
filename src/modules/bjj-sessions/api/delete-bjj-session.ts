import { requestJson } from "@/modules/core/api/http-client";

export async function deleteBjjSession(id: string) {
  await requestJson<void>(`/api/bjj-sessions/${id}`, {
    method: "DELETE",
  });
}

