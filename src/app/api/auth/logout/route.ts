import { NextResponse } from "next/server";
import { destroySession, isSameOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "FORBIDDEN", "Request blocked.");
  }
  await destroySession();
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
