import { NextResponse } from "next/server";
import { UPLOAD_LIMITS } from "@/features/recipe-book/schemas";
import {
  saveUpload,
  UploadRejectedError,
} from "@/features/recipe-book/uploads";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { jsonError, rateLimited, uploadLimiter } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return jsonError(403, "FORBIDDEN", "Request blocked.");
  const user = await getCurrentUser();
  if (!user)
    return jsonError(401, "UNAUTHENTICATED", "Sign in to upload files.");
  const limit = uploadLimiter(user.id);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  // Multipart overhead is small; refuse bodies clearly above the video limit.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > UPLOAD_LIMITS.video + 1024 * 1024) {
    return jsonError(
      413,
      "PAYLOAD_TOO_LARGE",
      "Videos must be 100 MB or smaller.",
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "INVALID_INPUT", "Upload a single file.");
  }
  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File) || (kind !== "image" && kind !== "video")) {
    return jsonError(400, "INVALID_INPUT", "Upload a single photo or video.");
  }

  try {
    const upload = await saveUpload(file, user.id, kind);
    return NextResponse.json(
      {
        upload: {
          id: upload.id,
          kind: upload.kind,
          src: "/api/book/uploads/" + upload.id,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof UploadRejectedError) {
      return jsonError(400, "UNSUPPORTED_FILE", error.message);
    }
    throw error;
  }
}
