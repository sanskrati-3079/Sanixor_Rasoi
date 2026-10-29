import "server-only";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getDb } from "./db";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "rasoi_session";
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;

export type SessionUser = {
  id: string;
  username: string;
  isAdmin: boolean;
};

function adminUsernames(): Set<string> {
  return new Set(
    (process.env.ADMIN_USERNAMES ?? "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return "scrypt$" + salt.toString("base64") + "$" + key.toString("base64");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltText, keyText] = stored.split("$");
  if (scheme !== "scrypt" || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64");
  const actual = await scryptAsync(
    password,
    Buffer.from(saltText, "base64"),
    expected.length,
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A hash computed once so failed lookups take as long as real checks. */
let dummyHash: Promise<string> | undefined;
export function dummyPasswordHash() {
  return (dummyHash ??= hashPassword(randomUUID()));
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashToken(token), userId, expiresAt);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb()
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .run(hashToken(token));
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT users.id, users.username FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashToken(token), Date.now()) as
    { id: string; username: string } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    isAdmin: adminUsernames().has(row.username.toLowerCase()),
  };
}

/**
 * CSRF defence for state-changing requests, on top of SameSite=Lax cookies:
 * the Origin header (when sent) must match the host serving the request.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
