import { NextRequest } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { handleHealthAutoExportWebhook } from "./handler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  noStore();
  return handleHealthAutoExportWebhook(req);
}
