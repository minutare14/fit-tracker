import { requestJson } from "@/modules/core/api/http-client";
import { BjjSessionsOverview } from "@/modules/bjj-sessions/types/bjj-session.types";
import { mapBjjSessionsOverview } from "@/modules/bjj-sessions/mappers/bjj-session.mapper";

export async function listBjjSessions() {
  const response = await requestJson<BjjSessionsOverview>("/api/bjj-sessions");
  return mapBjjSessionsOverview(response);
}
