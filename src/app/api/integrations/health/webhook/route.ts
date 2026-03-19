import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { unstable_noStore as noStore } from "next/cache";
import { handleHealthAutoExportWebhook } from "@/app/api/webhooks/health/autoexport/handler";

export async function POST(req: NextRequest) {
  noStore();
  return handleHealthAutoExportWebhook(req);
}
