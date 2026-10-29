import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { CredentialsSchema } from "@/features/recipe-book/schemas";
import { createSession, hashPassword, isSameOrigin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  authLimiter,
  clientKey,
  jsonError,
  rateLimited,
  readJson,
} from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "FORBIDDEN", "Request blocked.");
  }
  const limit = authLimiter(clientKey(request));
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const body = await readJson(request, 2_000);
  if (!body.ok) return body.response;
  const input = CredentialsSchema.safeParse(body.value);
  if (!input.success) {
    return jsonError(
      400,
      "INVALID_INPUT",
      input.error.issues[0]?.message ?? "Check your username and password.",
    );
  }

  const db = getDb();
  const taken = db
    .prepare("SELECT 1 FROM users WHERE username = ?")
    .get(input.data.username);
  if (taken) {
    return jsonError(409, "USERNAME_TAKEN", "That username is already taken.");
  }

  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
  ).run(
    id,
    input.data.username,
    await hashPassword(input.data.password),
    Date.now(),
  );
  await createSession(id);

  return NextResponse.json(
    { user: { username: input.data.username } },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
