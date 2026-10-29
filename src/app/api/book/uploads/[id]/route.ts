import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { z } from "zod";
import { getUpload, uploadPath } from "@/features/recipe-book/uploads";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const SAFE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Content-Disposition": "inline",
  "Cache-Control": "public, max-age=31536000, immutable",
  "Accept-Ranges": "bytes",
};

/** Serves an uploaded photo or video, with byte ranges so videos can seek. */
export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    return jsonError(404, "NOT_FOUND", "File not found.");
  const upload = getUpload(id);
  if (!upload) return jsonError(404, "NOT_FOUND", "File not found.");

  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/u);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : upload.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : upload.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, upload.size - 1);
    if (start > end) {
      return new Response(null, {
        status: 416,
        headers: { ...SAFE_HEADERS, "Content-Range": `bytes */${upload.size}` },
      });
    }
    const stream = createReadStream(uploadPath(id), { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...SAFE_HEADERS,
        "Content-Type": upload.mime,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${upload.size}`,
      },
    });
  }

  const stream = createReadStream(uploadPath(id));
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      ...SAFE_HEADERS,
      "Content-Type": upload.mime,
      "Content-Length": String(upload.size),
    },
  });
}
