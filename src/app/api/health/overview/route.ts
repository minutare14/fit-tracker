import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const backendBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000";

const buildUrl = (path: string) => `${backendBaseUrl.replace(/\/$/, "")}${path}`;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "default-user";
  const response = await fetch(buildUrl(`/api/recovery/overview?userId=${encodeURIComponent(userId)}`), {
    cache: "no-store",
  });
  const payload = await response.json();

  return NextResponse.json(payload, { status: response.status });
}
