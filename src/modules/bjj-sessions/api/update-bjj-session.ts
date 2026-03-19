import { requestJson } from "@/modules/core/api/http-client";
import { BjjSessionViewModel, CreateBjjSessionInput } from "@/modules/bjj-sessions/types/bjj-session.types";

export async function updateBjjSession(id: string, input: Partial<CreateBjjSessionInput>) {
  return requestJson<BjjSessionViewModel>(`/api/bjj-sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
