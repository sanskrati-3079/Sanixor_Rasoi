import { NextResponse, type NextRequest } from "next/server";
import {
  createRecipe,
  listRecipes,
  RecipeAccessError,
} from "@/features/recipe-book/repository";
import { BookRecipeInputSchema } from "@/features/recipe-book/schemas";
import { DietSchema } from "@/features/recipes/schemas";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { jsonError, rateLimited, readJson, writeLimiter } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const diet = DietSchema.safeParse(params.get("diet"));
  const recipes = listRecipes({
    query: params.get("q")?.trim().slice(0, 80) || undefined,
    diet: diet.success ? diet.data : undefined,
  });
  return NextResponse.json(
    { recipes },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return jsonError(403, "FORBIDDEN", "Request blocked.");
  const user = await getCurrentUser();
  if (!user)
    return jsonError(401, "UNAUTHENTICATED", "Sign in to add recipes.");
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

  try {
    const recipe = createRecipe(input.data, user);
    return NextResponse.json(
      { recipe },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RecipeAccessError) {
      return jsonError(error.status, "INVALID_INPUT", error.message);
    }
    throw error;
  }
}
