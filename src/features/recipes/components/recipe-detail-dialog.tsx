"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, BookmarkPlus, Check, ChefHat } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import type { BookRecipeInput } from "../../recipe-book/schemas";
import type { Recipe, RecipeRequest } from "../schemas";
import { fromAiRecipe, type RecipeViewModel } from "../view-model";
import { CookMode } from "./cook-mode";
import { RecipeView } from "./recipe-view";

type RecipeDetailDialogProps = {
  recipe: Recipe | null;
  request: RecipeRequest | null;
  signedIn: boolean;
  onClose: () => void;
};

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; id: string }
  | { status: "error"; message: string };

function toBookInput(
  view: RecipeViewModel,
  recipe: Recipe,
  request: RecipeRequest,
): BookRecipeInput {
  return {
    title: recipe.title,
    description: recipe.description,
    cuisine: recipe.cuisine,
    language: request.language,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    diet: view.diet ?? request.diet,
    spiceLevel: request.spiceLevel,
    ingredients: recipe.ingredients.map(({ name, quantity, unit, note }) => ({
      name,
      quantity,
      unit,
      note,
    })),
    instructions: recipe.instructions.map(({ text, durationMinutes }) => ({
      text,
      durationMinutes,
    })),
    equipment: recipe.equipment,
    tips: recipe.tips,
    servingSuggestion: recipe.servingSuggestion,
    nutritionPerServing: recipe.nutritionPerServing,
    substitutions: recipe.substitutions,
    warnings: recipe.warnings,
    video: { kind: "none" },
    photoUploadId: null,
    source: "ai",
  };
}

export function RecipeDetailDialog({
  recipe,
  request,
  signedIn,
  onClose,
}: RecipeDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [cooking, setCooking] = useState(false);
  const [save, setSave] = useState<{
    recipeId: string;
    state: SaveState;
  } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (recipe && !dialog.open) dialog.showModal();
    if (!recipe && dialog.open) dialog.close();
  }, [recipe]);

  if (!recipe || !request) return null;

  const view = fromAiRecipe(recipe, request.language, request.spiceLevel);
  const saveState: SaveState =
    save?.recipeId === recipe.id ? save.state : { status: "idle" };
  const closeDialog = () => dialogRef.current?.close();

  async function saveToBook() {
    if (!recipe || !request) return;
    const recipeId = recipe.id;
    setSave({ recipeId, state: { status: "saving" } });
    try {
      const response = await fetch("/api/book/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBookInput(view, recipe, request)),
      });
      const payload = (await response.json().catch(() => null)) as {
        recipe?: { id: string };
        error?: { message?: string };
      } | null;
      if (!response.ok || !payload?.recipe) {
        throw new Error(
          payload?.error?.message ?? "Couldn't save this recipe.",
        );
      }
      setSave({ recipeId, state: { status: "saved", id: payload.recipe.id } });
    } catch (error) {
      setSave({
        recipeId,
        state: {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Couldn't save this recipe.",
        },
      });
    }
  }

  const actions = (
    <>
      <Button onClick={() => setCooking(true)}>
        <ChefHat className="size-5" aria-hidden="true" />
        Start cooking
      </Button>
      {!signedIn ? (
        <Link
          href="/login?next=/"
          className={buttonClasses({ variant: "secondary" })}
        >
          <BookmarkPlus className="size-4" aria-hidden="true" />
          Sign in to save
        </Link>
      ) : saveState.status === "saved" ? (
        <Link
          href={"/book/" + saveState.id}
          className={buttonClasses({ variant: "secondary" })}
        >
          <Check className="text-success size-4" aria-hidden="true" />
          Saved — open in recipe book
        </Link>
      ) : (
        <Button
          variant="secondary"
          onClick={() => void saveToBook()}
          disabled={saveState.status === "saving"}
        >
          <BookmarkPlus className="size-4" aria-hidden="true" />
          {saveState.status === "saving" ? "Saving…" : "Save to recipe book"}
        </Button>
      )}
      <p
        aria-live="polite"
        className={clsx(
          "text-danger w-full text-sm",
          saveState.status !== "error" && "sr-only",
        )}
      >
        {saveState.status === "error" ? saveState.message : ""}
      </p>
    </>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="recipe-dialog-title"
      onClose={() => {
        setCooking(false);
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      className={clsx(
        "bg-canvas/85 text-ink backdrop:bg-ink/45 m-0 h-dvh max-h-none w-full max-w-none p-0 backdrop-blur-2xl backdrop:backdrop-blur-sm",
        "md:rounded-panel md:shadow-card-hover md:m-auto md:h-[min(92dvh,960px)] md:w-[min(1120px,calc(100%-3rem))]",
        "open:animate-fade-up",
      )}
    >
      <div className="h-full overflow-y-auto overscroll-contain">
        <div className="glass-strong sticky top-0 z-10 flex items-center justify-between border-x-0 border-t-0 px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={closeDialog}
            className="text-accent-strong hover:bg-sky inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold transition-colors duration-150"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to results
          </button>
        </div>
        <RecipeView
          key={recipe.id}
          recipe={view}
          titleId="recipe-dialog-title"
          actions={actions}
        />
      </div>
      {cooking && <CookMode recipe={view} onClose={() => setCooking(false)} />}
    </dialog>
  );
}
