import { NextResponse } from "next/server";
import {
  deleteRecipe,
  getRecipe,
  RecipeAccessError,
  updateRecipe,
} from "@/features/recipe-book/repository";
import { BookRecipeInputSchema } from "@/features/recipe-book/schemas";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { jsonError, rateLimited, readJson, writeLimiter } from "@/lib/http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

function accessError(error: unknown) {
  if (error instanceof RecipeAccessError) {
    const code =
      error.status === 404
        ? "NOT_FOUND"
        : error.status === 403
          ? "FORBIDDEN"
          : "INVALID_INPUT";
    return jsonError(error.status, code, error.message);
  }
  throw error;
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const recipe = getRecipe(id, await getCurrentUser());
  if (!recipe)
    return jsonError(404, "NOT_FOUND", "This recipe no longer exists.");
  return NextResponse.json(
    { recipe },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request, context: Context) {
  if (!isSameOrigin(request))
    return jsonError(403, "FORBIDDEN", "Request blocked.");
  const user = await getCurrentUser();
  if (!user)
    return jsonError(401, "UNAUTHENTICATED", "Sign in to edit recipes.");
  const limit = writeLimiter(user.id);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const body = await readJson(request, 64_000);
  if (!body.ok) return body.response;
  const input = BookRecipeInputSchema.safeParse(body.value);
  if (!input.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Some fields need attention.",
          issues: input.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;
  try {
    const recipe = await updateRecipe(id, input.data, user);
    return NextResponse.json(
      { recipe },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return accessError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request))
    return jsonError(403, "FORBIDDEN", "Request blocked.");
  const user = await getCurrentUser();
  if (!user)
    return jsonError(401, "UNAUTHENTICATED", "Sign in to delete recipes.");

  const { id } = await context.params;
  try {
    await deleteRecipe(id, user);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return accessError(error);
  }
}
