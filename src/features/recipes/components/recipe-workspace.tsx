"use client";

import { useRef, useState, type FormEvent } from "react";
import { ChilliDoodle, LeafDoodle } from "@/components/decor/doodles";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { KitchenHero } from "@/components/kitchen3d/kitchen-hero";
import { buttonClasses } from "@/components/ui/button";
import { MAX_INGREDIENTS, MAX_INGREDIENT_LENGTH } from "../display";
import { isRecipeErrorCode, type RecipeErrorCode } from "../error-copy";
import { normalizeIngredients } from "../normalize";
import {
  RecipeApiErrorSchema,
  RecipeApiResponseSchema,
  type Diet,
  type Recipe,
  type RecipeRequest,
  type SpiceLevel,
} from "../schemas";
import { useRecipeLanguage } from "../language-context";
import { HowItWorks } from "./how-it-works";
import { IngredientForm } from "./ingredient-form";
import { RecipeDetailDialog } from "./recipe-detail-dialog";
import { RecipeResults } from "./recipe-results";

type WorkspaceStatus = "idle" | "loading" | "success" | "error";

class RecipeRequestError extends Error {
  constructor(readonly code: RecipeErrorCode) {
    super(code);
    this.name = "RecipeRequestError";
  }
}

function splitIngredients(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function RecipeWorkspace({ signedIn }: { signedIn: boolean }) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientDraft, setIngredientDraft] = useState("");
  const [servings, setServings] = useState(2);
  const [diet, setDiet] = useState<Diet>("vegetarian");
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>("medium");
  const [maxMinutes, setMaxMinutes] = useState<number>();
  const [language, setLanguage] = useRecipeLanguage();
  const [validationMessage, setValidationMessage] = useState("");
  const [status, setStatus] = useState<WorkspaceStatus>("idle");
  const [errorCode, setErrorCode] = useState<RecipeErrorCode | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [generationMode, setGenerationMode] = useState<"mock" | "ai">("mock");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [lastRequest, setLastRequest] = useState<RecipeRequest | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const ingredientInputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "loading";

  /** Adds ingredients; returns false (and shows why) if they don't fit. */
  function appendIngredients(parts: string[]): boolean {
    if (parts.some((part) => part.length > MAX_INGREDIENT_LENGTH)) {
      setValidationMessage("Keep each ingredient under 80 characters.");
      return false;
    }

    const nextIngredients = normalizeIngredients([...ingredients, ...parts]);
    if (nextIngredients.length > MAX_INGREDIENTS) {
      setValidationMessage("Add up to 30 ingredients.");
      return false;
    }

    setIngredients(nextIngredients);
    setValidationMessage("");
    return true;
  }

  function addFromText(value: string) {
    if (appendIngredients(splitIngredients(value))) setIngredientDraft("");
  }

  function toggleSuggestion(name: string) {
    if (ingredients.includes(name)) removeIngredient(name);
    else appendIngredients([name]);
  }

  function removeIngredient(target: string) {
    setIngredients((current) =>
      current.filter((ingredient) => ingredient !== target),
    );
  }

  function editIngredients() {
    const input = ingredientInputRef.current;
    if (!input) return;
    input.scrollIntoView({ block: "center" });
    input.focus({ preventScroll: true });
  }

  async function generateRecipes(request: RecipeRequest) {
    setLastRequest(request);
    setStatus("loading");
    setErrorCode(null);
    setValidationMessage("");
    setRecipes([]);
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ block: "start" });
    });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);

    try {
      let response: Response;
      try {
        response = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") throw error;
        throw new RecipeRequestError("NETWORK");
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new RecipeRequestError("UNREADABLE_RESPONSE");
      }

      if (!response.ok) {
        const apiError = RecipeApiErrorSchema.safeParse(payload);
        const code = apiError.success ? apiError.data.error.code : "";
        throw new RecipeRequestError(
          isRecipeErrorCode(code) ? code : "PROVIDER_ERROR",
        );
      }

      const parsed = RecipeApiResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new RecipeRequestError("UNREADABLE_RESPONSE");
      }

      setRecipes(parsed.data.recipes);
      setGenerationMode(parsed.data.generationMode);
      setStatus("success");
      window.requestAnimationFrame(() => {
        resultsHeadingRef.current?.focus();
      });
    } catch (error) {
      setStatus("error");
      if (error instanceof Error && error.name === "AbortError") {
        setErrorCode("CLIENT_TIMEOUT");
      } else if (error instanceof RecipeRequestError) {
        setErrorCode(error.code);
      } else {
        setErrorCode("INTERNAL_ERROR");
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draftParts = splitIngredients(ingredientDraft);
    if (draftParts.some((part) => part.length > MAX_INGREDIENT_LENGTH)) {
      setValidationMessage("Keep each ingredient under 80 characters.");
      return;
    }

    const submittedIngredients = normalizeIngredients([
      ...ingredients,
      ...draftParts,
    ]);
    if (submittedIngredients.length === 0) {
      setValidationMessage("Add at least one ingredient to get recipe ideas.");
      return;
    }
    if (submittedIngredients.length > MAX_INGREDIENTS) {
      setValidationMessage("Add up to 30 ingredients.");
      return;
    }
    if (!Number.isInteger(servings) || servings < 1 || servings > 12) {
      setValidationMessage("Choose between 1 and 12 servings.");
      return;
    }

    setIngredients(submittedIngredients);
    setIngredientDraft("");
    void generateRecipes({
      ingredients: submittedIngredients,
      servings,
      diet,
      spiceLevel,
      ...(maxMinutes ? { maxMinutes } : {}),
      language,
    });
  }

  return (
    <>
      <main id="main" className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <section
          aria-labelledby="page-title"
          className="relative grid gap-10 pt-8 pb-16 sm:pt-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pt-16"
        >
          <div className="relative min-w-0">
            <LeafDoodle className="text-leaf absolute -top-2 right-0 size-14 opacity-30 lg:hidden" />
            <p className="text-accent-strong mb-3 text-sm font-semibold tracking-[0.12em] uppercase">
              Indian recipes from your pantry
            </p>
            <h1
              id="page-title"
              className="font-display text-[2.25rem] leading-[1.06] font-semibold tracking-tight sm:text-5xl lg:text-[3.75rem]"
            >
              What&apos;s in your kitchen{" "}
              <span className="text-accent-strong italic">today?</span>
            </h1>
            <p className="text-ink-muted mt-4 max-w-xl text-[1.05rem] sm:text-lg">
              Tell us your ingredients — we&apos;ll suggest Indian recipes you
              can cook right now.
            </p>
            <p
              lang="hi"
              className="font-display text-ink mt-2 text-lg sm:text-xl"
            >
              आपकी रसोई, आपकी रेसिपी।
            </p>

            <div id="kitchen" className="mt-8 scroll-mt-24">
              <IngredientForm
                ingredients={ingredients}
                ingredientDraft={ingredientDraft}
                servings={servings}
                diet={diet}
                spiceLevel={spiceLevel}
                maxMinutes={maxMinutes}
                language={language}
                isLoading={isLoading}
                validationMessage={validationMessage}
                inputRef={ingredientInputRef}
                onDraftChange={(value) => {
                  setIngredientDraft(value);
                  if (validationMessage) setValidationMessage("");
                }}
                onAddDraft={() => addFromText(ingredientDraft)}
                onPasteIngredients={addFromText}
                onToggleSuggestion={toggleSuggestion}
                onRemoveIngredient={removeIngredient}
                onServingsChange={setServings}
                onDietChange={setDiet}
                onSpiceLevelChange={setSpiceLevel}
                onMaxMinutesChange={setMaxMinutes}
                onLanguageChange={setLanguage}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          <div className="relative">
            <div className="lg:sticky lg:top-28">
              <ChilliDoodle className="text-chilli absolute right-2 bottom-24 size-16 -rotate-12 opacity-30 max-lg:hidden" />
              <KitchenHero
                onCook={editIngredients}
                onAddIngredients={(items) => {
                  appendIngredients(items);
                  editIngredients();
                }}
                onQuickMeal={(minutes) => {
                  setMaxMinutes(minutes);
                  editIngredients();
                }}
              />
              <nav
                aria-label="Kitchen shortcuts"
                className="mt-4 flex flex-wrap justify-center gap-2"
              >
                <Link
                  href="/book"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  <BookOpen className="size-4" aria-hidden="true" />
                  Recipe book
                </Link>
                <Link
                  href="/book/new"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add your recipe
                </Link>
              </nav>
            </div>
          </div>
        </section>

        {status !== "idle" && lastRequest && (
          <section
            ref={resultsRef}
            aria-labelledby="results-title"
            className="border-line scroll-mt-24 border-t pt-12 pb-16"
          >
            <RecipeResults
              status={status}
              request={lastRequest}
              recipes={recipes}
              generationMode={generationMode}
              errorCode={errorCode}
              headingRef={resultsHeadingRef}
              onRetry={() => void generateRecipes(lastRequest)}
              onEditIngredients={editIngredients}
              onOpenRecipe={setSelectedRecipe}
            />
          </section>
        )}

        <div className="border-line border-t pt-14">
          <HowItWorks />
        </div>
      </main>

      <RecipeDetailDialog
        recipe={selectedRecipe}
        request={lastRequest}
        signedIn={signedIn}
        onClose={() => setSelectedRecipe(null)}
      />
    </>
  );
}
