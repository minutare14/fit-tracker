import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { BjjService } from "@/services/bjj/bjj.service";

export async function GET(req: NextRequest) {
  noStore();
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "default-user";
    const type = req.nextUrl.searchParams.get("type");
    const bjjService = new BjjService();

    if (type === "stats") {
      const stats = await bjjService.getSessionStats(userId);
      return NextResponse.json(stats);
    }

    const sessions = await bjjService.getSessions(userId);
    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  noStore();
  try {
    const body = await req.json();
    const { userId, ...data } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const bjjService = new BjjService();
    const session = await bjjService.createSession(userId, data);
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  noStore();
  try {
    const { id, userId } = await req.json();
    if (!id || !userId) return NextResponse.json({ error: "id and userId required" }, { status: 400 });

    const bjjService = new BjjService();
    await bjjService.deleteSession(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
