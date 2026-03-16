import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { WeightService } from "@/services/weight/weight.service";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "default-user";
    const type = req.nextUrl.searchParams.get("type");
    const weightService = new WeightService();

    if (type === "stats") {
      const stats = await weightService.getWeightStats(userId);
      return NextResponse.json(stats);
    }

    const entries = await weightService.getEntries(userId);
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...data } = body;
    
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const weightService = new WeightService();
    const entry = await weightService.createEntry(userId, data);
    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, userId } = await req.json();
    if (!id || !userId) return NextResponse.json({ error: "id and userId required" }, { status: 400 });

    const weightService = new WeightService();
    await weightService.deleteEntry(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
