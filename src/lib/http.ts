import "server-only";
import { NextResponse } from "next/server";
import { createRequestLimiter, requestClientKey } from "./request-limit";

export function jsonError(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

export function clientKey(request: Request): string {
  return requestClientKey(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
}

export function rateLimited(retryAfterSeconds: number) {
  return jsonError(
    429,
    "RATE_LIMITED",
    "Too many requests. Please wait a little before trying again.",
    { "Retry-After": String(retryAfterSeconds) },
  );
}

/** Reads a JSON body, refusing anything larger than `maxBytes`. */
export async function readJson(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) {
    return {
      ok: false,
      response: jsonError(
        413,
        "PAYLOAD_TOO_LARGE",
        "That request is too large.",
      ),
    };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return {
      ok: false,
      response: jsonError(
        413,
        "PAYLOAD_TOO_LARGE",
        "That request is too large.",
      ),
    };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "INVALID_INPUT", "Please send valid JSON."),
    };
  }
}

export const authLimiter = createRequestLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});
export const writeLimiter = createRequestLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 40,
});
export const uploadLimiter = createRequestLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
});
