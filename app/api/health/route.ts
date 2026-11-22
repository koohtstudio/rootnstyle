import { NextResponse } from "next/server";
import { APP_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, mode: APP_MODE }, { headers: { "Cache-Control": "no-store" } });
}
