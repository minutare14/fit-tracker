import { AppError, toAppError } from "./app-error";

export interface ApiSuccess<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

const isApiSuccess = <T>(value: unknown): value is ApiSuccess<T> => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "data" in (value as Record<string, unknown>);
};

const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const serverApiBaseUrl =
  process.env.API_BASE_URL_SERVER?.replace(/\/$/, "") ?? browserApiBaseUrl;

const resolveInput = (input: RequestInfo | URL): RequestInfo | URL => {
  if (typeof input !== "string" || !input.startsWith("/")) {
    return input;
  }

  const baseUrl = typeof window === "undefined" ? serverApiBaseUrl : browserApiBaseUrl;
  if (!baseUrl) {
    return input;
  }

  return `${baseUrl}${input}`;
};

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveInput(input), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: init?.cache ?? "no-store",
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    const textBody = await response.text().catch(() => "");
    const excerpt = textBody.substring(0, 120).replace(/\n/g, " ");

    throw new Error(
      `Resposta invalida do backend em ${response.url}. Esperado JSON, recebido ${contentType}. Exemplo: ${excerpt}`
    );
  }

  const payload = await response.json().catch((err: Error) => {
    throw new Error(`Falha ao processar JSON do backend: ${err.message}`);
  });

  if (!response.ok) {
    throw toAppError(payload, response.status);
  }

  if (isApiSuccess<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

export function isAppError(error: unknown): error is AppError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in (error as Record<string, unknown>) &&
      "message" in (error as Record<string, unknown>) &&
      "status" in (error as Record<string, unknown>)
  );
}
