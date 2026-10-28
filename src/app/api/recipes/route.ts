import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { generateRecipeCandidates } from "@/features/recipes/service";
import { RecipeRequestSchema } from "@/features/recipes/schemas";
import { getRecipeProvider } from "@/features/recipes/providers";
import {
  InvalidRecipeOutputError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from "@/features/recipes/providers/provider";
import { logRecipeRequest } from "@/lib/operational-log";
import { checkRequestLimit, requestClientKey } from "@/lib/request-limit";

export const runtime = "nodejs";
export const maxDuration = 25;

const MAX_BODY_BYTES = 12_000;

class BodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeded the allowed size.");
    this.name = "BodyTooLargeError";
  }
}

async function readBoundedBody(request: NextRequest): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

type ErrorCode =
  | "INVALID_INPUT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_MODEL_OUTPUT"
  | "INTERNAL_ERROR";

function errorResponse(
  requestId: string,
  status: number,
  code: ErrorCode,
  message: string,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    { error: { code, message, requestId } },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...headers,
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = performance.now();
  const clientKey = requestClientKey(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const limit = checkRequestLimit(clientKey);

  if (!limit.allowed) {
    logRecipeRequest({
      requestId,
      durationMs: performance.now() - startedAt,
      outcome: "error",
      code: "RATE_LIMITED",
    });

    return errorResponse(
      requestId,
      429,
      "RATE_LIMITED",
      "Too many recipe requests. Please wait a little before trying again.",
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return errorResponse(
      requestId,
      413,
      "PAYLOAD_TOO_LARGE",
      "Please shorten the recipe request and try again.",
    );
  }

  let rawBody: string;
  try {
    rawBody = await readBoundedBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return errorResponse(
        requestId,
        413,
        "PAYLOAD_TOO_LARGE",
        "Please shorten the recipe request and try again.",
      );
    }

    return errorResponse(
      requestId,
      400,
      "INVALID_INPUT",
      "The request body could not be read.",
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return errorResponse(
      requestId,
      400,
      "INVALID_INPUT",
      "Please send a valid JSON recipe request.",
    );
  }

  const input = RecipeRequestSchema.safeParse(body);
  if (!input.success) {
    return errorResponse(
      requestId,
      400,
      "INVALID_INPUT",
      "Check your ingredients, servings, and preferences, then try again.",
    );
  }

  const provider = getRecipeProvider();

  try {
    const candidates = await generateRecipeCandidates(provider, input.data);
    const recipes = candidates.map((recipe) => ({
      ...recipe,
      id: randomUUID(),
    }));
    const durationMs = performance.now() - startedAt;

    logRecipeRequest({
      requestId,
      durationMs,
      outcome: "success",
      mode: provider.mode,
    });

    return NextResponse.json(
      {
        requestId,
        generationMode: provider.mode,
        recipes,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const durationMs = performance.now() - startedAt;

    if (error instanceof ProviderTimeoutError) {
      logRecipeRequest({
        requestId,
        durationMs,
        outcome: "error",
        mode: provider.mode,
        code: "PROVIDER_TIMEOUT",
      });
      return errorResponse(
        requestId,
        504,
        "PROVIDER_TIMEOUT",
        "Recipe generation took too long. Please try again.",
      );
    }

    if (error instanceof InvalidRecipeOutputError) {
      logRecipeRequest({
        requestId,
        durationMs,
        outcome: "error",
        mode: provider.mode,
        code: "INVALID_MODEL_OUTPUT",
      });
      return errorResponse(
        requestId,
        502,
        "INVALID_MODEL_OUTPUT",
        "We could not validate the recipe suggestions. Please try again.",
      );
    }

    if (error instanceof ProviderUnavailableError) {
      logRecipeRequest({
        requestId,
        durationMs,
        outcome: "error",
        mode: provider.mode,
        code: "PROVIDER_ERROR",
      });
      return errorResponse(
        requestId,
        502,
        "PROVIDER_ERROR",
        "Recipe generation is temporarily unavailable. Please try again.",
      );
    }

    logRecipeRequest({
      requestId,
      durationMs,
      outcome: "error",
      mode: provider.mode,
      code: "INTERNAL_ERROR",
    });
    return errorResponse(
      requestId,
      500,
      "INTERNAL_ERROR",
      "Something went wrong while preparing your recipe ideas.",
    );
  }
}
