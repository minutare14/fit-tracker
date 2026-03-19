import { requestJson } from "@/modules/core/api/http-client";
import { BjjSessionViewModel, CreateBjjSessionInput } from "@/modules/bjj-sessions/types/bjj-session.types";

export async function createBjjSession(input: CreateBjjSessionInput) {
  return requestJson<BjjSessionViewModel>("/api/bjj-sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
