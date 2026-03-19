import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export interface RouteContext {
  method: string;
  path: string;
  requestId: string;
  timestamp: string;
}

export interface RouteErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export const createRouteContext = (request: NextRequest): RouteContext => ({
  method: request.method,
  path: request.nextUrl.pathname,
  requestId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
});

export const apiSuccess = <T>(context: RouteContext, data: T, status = 200) =>
  NextResponse.json(
    {
      data,
      meta: {
        requestId: context.requestId,
        timestamp: context.timestamp,
      },
    },
    {
      status,
      headers: {
        "x-request-id": context.requestId,
      },
    }
  );

export const apiError = (
  context: RouteContext,
  error: RouteErrorShape,
  status = 500
) => {
  console.error(
    JSON.stringify({
      level: "error",
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      status,
      error,
      timestamp: context.timestamp,
    })
  );

  return NextResponse.json(
    {
      error,
      meta: {
        requestId: context.requestId,
        timestamp: context.timestamp,
      },
    },
    {
      status,
      headers: {
        "x-request-id": context.requestId,
      },
    }
  );
};

export const logRouteEvent = (
  context: RouteContext,
  action: string,
  details?: Record<string, unknown>
) => {
  console.info(
    JSON.stringify({
      level: "info",
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      action,
      details,
      timestamp: context.timestamp,
    })
  );
};
