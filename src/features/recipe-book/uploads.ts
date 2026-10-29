import "server-only";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { getDb, UPLOAD_DIR } from "@/lib/db";
import { UPLOAD_LIMITS } from "./schemas";

export type UploadKind = "image" | "video";

export type UploadRow = {
  id: string;
  owner_id: string;
  kind: UploadKind;
  mime: string;
  size: number;
};

export class UploadRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadRejectedError";
  }
}

/** Identifies the file from its first bytes; the browser's MIME type is ignored. */
function sniff(head: Uint8Array): { kind: UploadKind; mime: string } | null {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...head.subarray(start, end));

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { kind: "image", mime: "image/jpeg" };
  }
  if (ascii(1, 4) === "PNG" && head[0] === 0x89) {
    return { kind: "image", mime: "image/png" };
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { kind: "image", mime: "image/webp" };
  }
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    return {
      kind: "video",
      mime: brand === "qt  " ? "video/quicktime" : "video/mp4",
    };
  }
  if (
    head[0] === 0x1a &&
    head[1] === 0x45 &&
    head[2] === 0xdf &&
    head[3] === 0xa3
  ) {
    return { kind: "video", mime: "video/webm" };
  }
  return null;
}

export function uploadPath(id: string): string {
  // ids are UUIDs generated here, so they cannot traverse directories.
  return path.join(UPLOAD_DIR, id);
}

export function uploadSrc(id: string): string {
  return "/api/book/uploads/" + id;
}

export async function saveUpload(
  file: File,
  ownerId: string,
  expected: UploadKind,
): Promise<UploadRow> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detected = sniff(head);
  if (!detected || detected.kind !== expected) {
    throw new UploadRejectedError(
      expected === "image"
        ? "Photos must be JPEG, PNG or WebP."
        : "Videos must be MP4, MOV or WebM.",
    );
  }
  if (file.size > UPLOAD_LIMITS[expected]) {
    throw new UploadRejectedError(
      expected === "image"
        ? "Photos must be 5 MB or smaller."
        : "Videos must be 100 MB or smaller.",
    );
  }

  const id = randomUUID();
  const target = uploadPath(id);
  try {
    await pipeline(
      Readable.fromWeb(file.stream() as WebReadableStream<Uint8Array>),
      createWriteStream(target, { flags: "wx" }),
    );
    const { size } = await stat(target);
    getDb()
      .prepare(
        "INSERT INTO uploads (id, owner_id, kind, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(id, ownerId, detected.kind, detected.mime, size, Date.now());
    return {
      id,
      owner_id: ownerId,
      kind: detected.kind,
      mime: detected.mime,
      size,
    };
  } catch (error) {
    await rm(target, { force: true });
    throw error;
  }
}

export function getUpload(id: string): UploadRow | null {
  return (
    (getDb()
      .prepare(
        "SELECT id, owner_id, kind, mime, size FROM uploads WHERE id = ?",
      )
      .get(id) as UploadRow | undefined) ?? null
  );
}

export async function deleteUploads(ids: string[]): Promise<void> {
  const db = getDb();
  for (const id of ids) {
    db.prepare("DELETE FROM uploads WHERE id = ?").run(id);
    await rm(uploadPath(id), { force: true });
  }
}
