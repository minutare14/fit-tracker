import { requestJson } from "@/modules/core/api/http-client";

export async function deleteBjjSession(id: string) {
  return requestJson<{ success: boolean }>(`/api/bjj-sessions/${id}`, {
    method: "DELETE",
  });
}
