import { requestJson } from "@/modules/core/api/http-client";
import { SettingsIntegrationsOverview } from "@/modules/settings/integrations/types/integration.types";

export async function getIntegrationsOverview() {
  return requestJson<SettingsIntegrationsOverview>("/api/settings/integrations");
}
