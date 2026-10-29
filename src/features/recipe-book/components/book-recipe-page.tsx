"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChefHat, Pencil, Trash2 } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { CookMode } from "../../recipes/components/cook-mode";
import { RecipeView } from "../../recipes/components/recipe-view";
import { fromBookRecipe } from "../../recipes/view-model";
import type { BookRecipe } from "../schemas";
import { SourceLabel } from "./book-recipe-card";

export function BookRecipePage({ recipe }: { recipe: BookRecipe }) {
  const router = useRouter();
  const [cooking, setCooking] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const confirmRef = useRef<HTMLDialogElement>(null);
  const view = fromBookRecipe(recipe);

  async function remove() {
    setDeleting(true);
    setDeleteError("");
    const response = await fetch("/api/book/recipes/" + recipe.id, {
      method: "DELETE",
    }).catch(() => null);
    if (response?.ok) {
      router.push("/book");
      router.refresh();
      return;
    }
    const payload = (await response?.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    setDeleting(false);
    setDeleteError(payload?.error?.message ?? "Couldn't delete this recipe.");
  }

  const actions = (
    <>
      <Button onClick={() => setCooking(true)}>
        <ChefHat className="size-5" aria-hidden="true" />
        Start cooking
      </Button>
      {recipe.canEdit && (
        <>
          <Link
            href={"/book/" + recipe.id + "/edit"}
            className={buttonClasses({ variant: "secondary" })}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
          <Button
            variant="ghost"
            onClick={() => confirmRef.current?.showModal()}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </>
      )}
    </>
  );

  return (
    <main
      id="main"
      className="mx-auto max-w-[1200px] px-0 pb-16 sm:px-6 lg:px-8"
    >
      <div className="px-4 py-3 sm:px-0">
        <Link
          href="/book"
          className="text-accent-strong hover:bg-sky inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          Recipe book
        </Link>
      </div>
      <div className="glass sm:rounded-panel overflow-hidden">
        <RecipeView
          recipe={view}
          titleId="recipe-title"
          titleAs="h1"
          actions={actions}
          byline={<SourceLabel source={recipe.source} author={recipe.author} />}
        />
      </div>

      {cooking && <CookMode recipe={view} onClose={() => setCooking(false)} />}

      <dialog
        ref={confirmRef}
        aria-labelledby="confirm-delete-title"
        className="rounded-panel glass-strong text-ink backdrop:bg-ink/45 m-auto w-[min(440px,calc(100%-2rem))] p-6 backdrop:backdrop-blur-sm"
      >
        <h2
          id="confirm-delete-title"
          className="font-display text-2xl font-semibold"
        >
          Delete this recipe?
        </h2>
        <p className="text-ink-muted mt-2">
          “{recipe.title}” and any photo or video attached to it will be removed
          for everyone. This can&apos;t be undone.
        </p>
        <p aria-live="polite" className="text-danger mt-2 text-sm font-medium">
          {deleteError}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => confirmRef.current?.close()}
          >
            Keep it
          </Button>
          <Button onClick={() => void remove()} disabled={deleting}>
            <Trash2 className="size-4" aria-hidden="true" />
            {deleting ? "Deleting…" : "Delete recipe"}
          </Button>
        </div>
      </dialog>
    </main>
  );
}
