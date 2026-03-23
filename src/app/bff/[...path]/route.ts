import { NextRequest, NextResponse } from "next/server";

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const readServerApiBaseUrl = () => process.env.API_BASE_URL_SERVER?.replace(/\/$/, "") ?? "";

const readPublicOrigin = (request: NextRequest) => {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(/:$/, "") ??
    "http";

  return `${protocol}://${host}`;
};

const buildBackendUrl = (request: NextRequest, path: string[]) => {
  const baseUrl = readServerApiBaseUrl();
  if (!baseUrl) {
    throw new Error("API_BASE_URL_SERVER is not configured.");
  }

  const pathname = path.join("/");
  const query = request.nextUrl.search;
  return `${baseUrl}/${pathname}${query}`;
};

const copyRequestHeaders = (request: NextRequest) => {
  const headers = new Headers(request.headers);

  for (const header of hopByHopHeaders) {
    headers.delete(header);
  }

  headers.set("x-public-origin", `${readPublicOrigin(request)}/bff`);

  return headers;
};

const copyResponseHeaders = (response: Response) => {
  const headers = new Headers(response.headers);

  for (const header of hopByHopHeaders) {
    headers.delete(header);
  }

  headers.set("cache-control", "no-store");
  return headers;
};

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (!path.length || path[0] !== "api") {
    return NextResponse.json(
      {
        error: {
          code: "BFF_ROUTE_NOT_ALLOWED",
          message: "BFF can only proxy requests under /api.",
        },
      },
      { status: 404 }
    );
  }

  let target: string;
  try {
    target = buildBackendUrl(request, path);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "BFF_BACKEND_NOT_CONFIGURED",
          message: error instanceof Error ? error.message : "Backend URL is not configured.",
        },
      },
      { status: 500 }
    );
  }

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : Buffer.from(await request.arrayBuffer());

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers: copyRequestHeaders(request),
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "BFF_UPSTREAM_UNAVAILABLE",
          message: `Nao foi possivel conectar ao backend Python em ${target}.`,
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 502 }
    );
  }

  const responseBody =
    upstream.status === 204 ? null : Buffer.from(await upstream.arrayBuffer());

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: copyResponseHeaders(upstream),
  });
}

export const dynamic = "force-dynamic";

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
