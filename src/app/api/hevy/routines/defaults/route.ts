import { NextResponse } from "next/server";
import { HevyService } from "@/integrations/hevy/service";

export async function POST() {
  try {
    const userId = "user_default";
    const hevyService = new HevyService();
    const program = await hevyService.createDefaultBJJProgram(userId);
    
    return NextResponse.json({ 
      success: true, 
      message: "BJJ Blueprint initialized and mapped",
      program 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
