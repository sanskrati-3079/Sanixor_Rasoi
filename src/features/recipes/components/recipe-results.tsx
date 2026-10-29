"use client";

import { useEffect, useState, type Ref } from "react";
import {
  Clock,
  Hourglass,
  Pencil,
  SearchX,
  WifiOff,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { languageTag, listIngredients } from "../display";
import { describeRecipeError, type RecipeErrorCode } from "../error-copy";
import type { Recipe, RecipeRequest } from "../schemas";
import { RecipeCard } from "./recipe-card";

export type ResultsStatus = "loading" | "success" | "error";

type RecipeResultsProps = {
  status: ResultsStatus;
  request: RecipeRequest;
  recipes: Recipe[];
  generationMode: "mock" | "ai";
  errorCode: RecipeErrorCode | null;
  headingRef: Ref<HTMLHeadingElement>;
  onRetry: () => void;
  onEditIngredients: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
};

const loadingLines = [
  "Tadka in progress…",
  "Chopping the onions…",
  "Tasting for salt…",
  "Warming the tawa…",
  "Picking fresh dhaniya…",
];

function errorIcon(code: RecipeErrorCode) {
  if (code === "NETWORK") return <WifiOff className="size-7" />;
  if (code === "PROVIDER_TIMEOUT" || code === "CLIENT_TIMEOUT")
    return <Clock className="size-7" />;
  if (code === "RATE_LIMITED") return <Hourglass className="size-7" />;
  return <CircleAlert className="size-7" />;
}

function LoadingLine() {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setLine((current) => (current + 1) % loadingLines.length),
      2200,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <p className="sr-only" role="status">
        Finding recipes. This can take a few seconds.
      </p>
      <p
        aria-hidden="true"
        key={line}
        className="animate-fade-up font-display text-ink-muted text-xl italic"
      >
        {loadingLines[line]}
      </p>
    </>
  );
}

function RecipeCardSkeleton() {
  return (
    <div className="rounded-card glass-strong overflow-hidden">
      <Skeleton className="h-36 rounded-none" />
      <div className="space-y-3 p-5 sm:p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-4 h-7 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function RecipeResults({
  status,
  request,
  recipes,
  generationMode,
  errorCode,
  headingRef,
  onRetry,
  onEditIngredients,
  onOpenRecipe,
}: RecipeResultsProps) {
  const lang = languageTag(request.language);
  const editButton = (
    <Button variant="secondary" onClick={onEditIngredients}>
      <Pencil className="size-4" aria-hidden="true" />
      Edit ingredients
    </Button>
  );

  const title =
    status === "success" && recipes.length > 0
      ? recipes.length + " recipes with " + listIngredients(request.ingredients)
      : status === "loading"
        ? "Finding recipes for you"
        : "Your recipes";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          id="results-title"
          headingRef={headingRef}
          eyebrow="Your recipe ideas"
          title={title}
        />
        {status !== "error" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditIngredients}
            className="self-start sm:self-auto"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit ingredients
          </Button>
        )}
      </div>

      <ul
        className="mt-4 flex flex-wrap gap-2"
        aria-label="Ingredients you searched with"
      >
        {request.ingredients.map((ingredient) => (
          <li key={ingredient}>
            <Chip size="sm" tone="sky">
              {ingredient}
            </Chip>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {status === "loading" && (
          <div aria-busy="true">
            <LoadingLine />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <RecipeCardSkeleton key={index} />
              ))}
            </div>
          </div>
        )}

        {status === "error" &&
          errorCode &&
          (() => {
            const copy = describeRecipeError(errorCode);
            return (
              <ErrorState
                icon={errorIcon(errorCode)}
                title={copy.title}
                description={copy.description}
                onRetry={onRetry}
                secondaryAction={copy.suggestEdit ? editButton : undefined}
              />
            );
          })()}

        {status === "success" && recipes.length === 0 && (
          <EmptyState
            illustration={
              <span className="bg-sky grid size-24 place-items-center rounded-full">
                <SearchX className="text-accent-strong size-10" />
              </span>
            }
            title="No recipes matched"
            description="Try adding a few more ingredients."
            action={editButton}
          />
        )}

        {status === "success" && recipes.length > 0 && (
          <>
            {generationMode === "mock" && (
              <Callout tone="info" role="status" className="mb-6">
                <p>
                  These are sample suggestions. Add an API key on the server to
                  get AI-generated recipes.
                </p>
              </Callout>
            )}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe, index) => (
                <li key={recipe.id} className="grid">
                  <RecipeCard
                    recipe={recipe}
                    index={index}
                    spiceLevel={request.spiceLevel}
                    lang={lang}
                    onOpen={onOpenRecipe}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
