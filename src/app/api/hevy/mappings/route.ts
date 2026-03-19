import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/current-user";
import { HevyService } from "@/integrations/hevy/service";

export async function GET(req: NextRequest) {
  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));
    const hevyService = new HevyService();
    const mappings = await hevyService.getMappings(userId);
    return NextResponse.json(mappings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = resolveUserId(body.userId);
    const hevyService = new HevyService();
    const mapping = await hevyService.upsertMapping(userId, body);
    return NextResponse.json(mapping);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = resolveUserId(body.userId);
    const hevyService = new HevyService();
    await hevyService.deleteMapping(userId, body.internalName);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
