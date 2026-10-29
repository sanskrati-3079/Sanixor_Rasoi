import { NextResponse } from "next/server";
import { CredentialsSchema } from "@/features/recipe-book/schemas";
import {
  createSession,
  dummyPasswordHash,
  isSameOrigin,
  verifyPassword,
} from "@/lib/auth";
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

  const user = input.success
    ? (getDb()
        .prepare(
          "SELECT id, username, password_hash FROM users WHERE username = ?",
        )
        .get(input.data.username) as
        { id: string; username: string; password_hash: string } | undefined)
    : undefined;

  // Always run one hash so response time doesn't reveal which usernames exist.
  const valid = await verifyPassword(
    input.success ? input.data.password : "",
    user?.password_hash ?? (await dummyPasswordHash()),
  );
  if (!user || !valid) {
    return jsonError(401, "INVALID_CREDENTIALS", "Wrong username or password.");
  }

  await createSession(user.id);
  return NextResponse.json(
    { user: { username: user.username } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
