export interface IntegrationSyncLog {
  id: string;
  provider: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  recordsProcessed: number;
  errorMessage: string | null;
}

export interface SettingsIntegrationsOverview {
  hevy: {
    configured: boolean;
    status: string;
    lastSyncAt: string | null;
    hasValidApiKey: boolean;
    syncInProgress: boolean;
    workoutsImported: number;
    maskedApiKey: string | null;
    lastError: string | null;
  };
  healthAutoExport: {
    configured: boolean;
    status: string;
    lastPayloadAt: string | null;
    hasSecret: boolean;
    webhookUrl: string;
    headerName: string;
    secretMask: string | null;
    lastError: string | null;
  };
  ai: {
    configured: boolean;
    provider: string;
    model: string;
  };
  syncHistory: IntegrationSyncLog[];
}
