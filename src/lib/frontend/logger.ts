export type FrontendLogLevel = "info" | "warn" | "error";

interface FrontendLogPayload {
  scope: string;
  message: string;
  details?: unknown;
}

const emitConsoleLog = (level: FrontendLogLevel, payload: FrontendLogPayload) => {
  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  logger(`[frontend:${payload.scope}] ${payload.message}`, payload.details ?? "");
};

export const frontendLogger = {
  info(payload: FrontendLogPayload) {
    emitConsoleLog("info", payload);
  },
  warn(payload: FrontendLogPayload) {
    emitConsoleLog("warn", payload);
  },
  error(payload: FrontendLogPayload) {
    emitConsoleLog("error", payload);
  },
};
