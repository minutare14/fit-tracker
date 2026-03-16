import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { HealthService } from "@/services/health/health.service";

export async function POST(req: NextRequest) {
  noStore();
  try {
    const payload = await req.json();
    const healthService = new HealthService();
    // Default to a specific user for now if not provided in payload
    // In a real app, this would be determined by a token in the URL or payload
    const userId = "default-user"; 
    
    await healthService.processWebhook(payload, userId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // During build or local testing without proper DB/payload
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
