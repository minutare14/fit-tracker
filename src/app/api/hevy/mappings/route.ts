import { NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";

export async function GET() {
  try {
    const userId = "user_default";
    const hevyService = new HevyService();
    const mappings = await hevyService.getMappings(userId);
    return NextResponse.json(mappings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = "user_default";
    const data = await req.json();
    const hevyService = new HevyService();
    const mapping = await hevyService.upsertMapping(userId, data);
    return NextResponse.json(mapping);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = "user_default";
    const { internalName } = await req.json();
    const hevyService = new HevyService();
    await hevyService.deleteMapping(userId, internalName);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
