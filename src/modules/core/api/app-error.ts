export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export interface AppError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
  requestId?: string;
}

export const UNKNOWN_APP_ERROR: AppError = {
  code: "UNKNOWN_ERROR",
  message: "Unexpected application error",
  status: 500,
};

export const isApiErrorPayload = (value: unknown): value is ApiErrorPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ApiErrorPayload;
  return Boolean(candidate.error?.code && candidate.error?.message);
};

export const toAppError = (value: unknown, status = 500): AppError => {
  if (isApiErrorPayload(value)) {
    return {
      code: value.error.code,
      message: value.error.message,
      status,
      details: value.error.details,
      requestId: value.meta?.requestId,
    };
  }

  if (value instanceof Error) {
    return {
      code: "UNEXPECTED_ERROR",
      message: value.message,
      status,
    };
  }

  return UNKNOWN_APP_ERROR;
};

export const resolveAppErrorMessage = (error: AppError | Error | null | undefined) => {
  if (!error) {
    return "Nao foi possivel concluir a acao.";
  }

  return "message" in error ? error.message : UNKNOWN_APP_ERROR.message;
};
