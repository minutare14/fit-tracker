import { requestJson } from "@/modules/core/api/http-client";
import { ProfileFormData } from "@/modules/settings/profile/types/profile.types";

export async function getProfile() {
  return requestJson<ProfileFormData>("/api/settings/profile");
}
