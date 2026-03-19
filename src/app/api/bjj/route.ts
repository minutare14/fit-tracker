import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const backendBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000";

const buildUrl = (path: string) => `${backendBaseUrl.replace(/\/$/, "")}${path}`;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "default-user";
  const type = req.nextUrl.searchParams.get("type");

  const response = await fetch(buildUrl(`/api/bjj-sessions?userId=${encodeURIComponent(userId)}`), {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  if (type === "stats") {
    return NextResponse.json({
      monthlyMatHours: payload.summary?.monthlyMatHours ?? 0,
      weeklyLoad: payload.summary?.weeklyLoad ?? 0,
      recentCount: payload.summary?.totalSessions ?? 0,
    });
  }

  return NextResponse.json(
    (payload.items ?? []).map((session: {
      id: string;
      date: string;
      durationMinutes: number;
      trainingType: string;
      srpe: number;
      sessionLoad: number;
      notes?: string | null;
    }) => ({
      id: session.id,
      date: session.date,
      duration: session.durationMinutes,
      type: session.trainingType,
      rpe: session.srpe,
      load: session.sessionLoad,
      notes: session.notes ?? null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = {
    userId: body.userId || "default-user",
    date: body.date,
    durationMinutes: body.duration,
    trainingType:
      body.type?.toLowerCase?.() === "technical"
        ? "technical"
        : body.type?.toLowerCase?.() === "drilling"
          ? "drill"
          : body.type?.toLowerCase?.() === "competition"
            ? "competition"
            : "sparring",
    giMode: "gi",
    srpe: body.rpe,
    notes: body.notes,
  };

  const response = await fetch(buildUrl("/api/bjj-sessions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  return NextResponse.json(json, { status: response.status });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const response = await fetch(
    buildUrl(`/api/bjj-sessions/${encodeURIComponent(body.id)}?userId=${encodeURIComponent(body.userId || "default-user")}`),
    { method: "DELETE" }
  );

  if (response.status === 204) {
    return NextResponse.json({ success: true });
  }

  const json = await response.json();
  return NextResponse.json(json, { status: response.status });
}
