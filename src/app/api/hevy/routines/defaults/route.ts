import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/current-user";
import { HevyService } from "@/integrations/hevy/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = resolveUserId(body.userId);
    const hevyService = new HevyService();
    const program = await hevyService.createDefaultBJJProgram(userId);

    return NextResponse.json({
      success: true,
      message: "BJJ Blueprint initialized and mapped",
      program,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
