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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

const resolveInput = (input: RequestInfo | URL): RequestInfo | URL => {
  if (!apiBaseUrl || typeof input !== "string" || !input.startsWith("/")) {
    return input;
  }

  return `${apiBaseUrl}${input}`;
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

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    console.error(`[http-client] Expected JSON but received Content-Type: ${contentType}. URL: ${response.url}`);
    throw new Error("O servidor retornou um formato invalido (nao-JSON). Verifique a conexao ou rota.");
  }

  const payload = await response.json().catch((err: Error) => {
    console.error(`[http-client] Failed to parse JSON: ${err.message}. URL: ${response.url}`);
    throw new Error("Falha ao processar a resposta do servidor.");
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
