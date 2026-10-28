"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { normalizeIngredients } from "../normalize";
import {
  RecipeApiErrorSchema,
  RecipeApiResponseSchema,
  type Diet,
  type Recipe,
  type RecipeLanguage,
  type RecipeRequest,
  type SpiceLevel,
} from "../schemas";
import { IngredientForm } from "./ingredient-form";
import { RecipeCard } from "./recipe-card";
import { RecipeDetailDialog } from "./recipe-detail-dialog";

type WorkspaceStatus = "idle" | "loading" | "success" | "error";

const sampleIngredients = ["potato", "tomato", "peas"];

export function RecipeWorkspace() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientDraft, setIngredientDraft] = useState("");
  const [servings, setServings] = useState(2);
  const [diet, setDiet] = useState<Diet>("vegetarian");
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>("medium");
  const [maxMinutes, setMaxMinutes] = useState<number>();
  const [language, setLanguage] = useState<RecipeLanguage>("en");
  const [validationMessage, setValidationMessage] = useState("");
  const [status, setStatus] = useState<WorkspaceStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [generationMode, setGenerationMode] = useState<"mock" | "ai">("mock");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [lastRequest, setLastRequest] = useState<RecipeRequest | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const isLoading = status === "loading";

  function addIngredient(value = ingredientDraft) {
    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.some((part) => part.length > 80)) {
      setValidationMessage("Keep each ingredient under 80 characters.");
      return;
    }

    const nextIngredients = normalizeIngredients([...ingredients, ...parts]);
    if (nextIngredients.length > 30) {
      setValidationMessage("Add up to 30 ingredients.");
      return;
    }

    setIngredients(nextIngredients);
    setIngredientDraft("");
    setValidationMessage("");
  }

  function addSampleIngredients() {
    setIngredients((current) =>
      normalizeIngredients([...current, ...sampleIngredients]).slice(0, 30),
    );
    setValidationMessage("");
  }

  function removeIngredient(target: string) {
    setIngredients((current) =>
      current.filter((ingredient) => ingredient !== target),
    );
  }

  async function generateRecipes(request: RecipeRequest) {
    setLastRequest(request);
    setStatus("loading");
    setErrorMessage("");
    setValidationMessage("");
    setRecipes([]);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("The recipe service returned an unreadable response.");
      }

      if (!response.ok) {
        const apiError = RecipeApiErrorSchema.safeParse(payload);
        throw new Error(
          apiError.success
            ? apiError.data.error.message
            : "Recipe generation is temporarily unavailable.",
        );
      }

      const parsed = RecipeApiResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(
          "We couldn’t read those recipe suggestions. Please try again.",
        );
      }

      setRecipes(parsed.data.recipes);
      setGenerationMode(parsed.data.generationMode);
      setStatus("success");
      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (error) {
      setStatus("error");
      if (error instanceof Error && error.name === "AbortError") {
        setErrorMessage("The request took too long. Please try again.");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Something went wrong while finding recipes.");
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draftParts = ingredientDraft
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (draftParts.some((part) => part.length > 80)) {
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
    if (submittedIngredients.length > 30) {
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
    <div className="site-frame">
      <header className="site-header">
        <Link className="brand-lockup" href="/" aria-label="Sanixor Rasoi home">
          <BrandMark />
          <span className="brand-words">
            <strong>sanixor</strong>
            <span>rasoi</span>
          </span>
        </Link>
        <div className="header-note">
          <span className="header-note-dot" aria-hidden="true" />A little help
          for the everyday kitchen
        </div>
      </header>

      <main>
        <section className="hero-grid" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span className="kicker-line" aria-hidden="true" />
              EVERYDAY COOKING, MADE EASIER
            </p>
            <h1 id="page-title">
              Good meals begin with <em>what you have.</em>
            </h1>
            <p className="hero-description">
              A few things in the fridge. A little inspiration. Let’s make
              something lovely from what’s already in your kitchen.
            </p>

            <div className="hero-note">
              <span className="hero-note-mark" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none">
                  <path
                    d="M10 29c2.5-9.4 11-15.6 22-15-1 11-7.8 19.4-18.2 20.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 36c5-8 10-13 17-18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 23c3.8.2 6 1.8 7 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div>
                <strong>Start simple</strong>
                <p>Tell us what’s on hand. We’ll take it from there.</p>
              </div>
              <span className="note-spark" aria-hidden="true">
                ✳
              </span>
            </div>

            <div className="hero-footnote">
              <span className="avatar-stack" aria-hidden="true">
                <i>स</i>
                <i>R</i>
                <i>🌿</i>
              </span>
              <span>Made for real kitchens and real days.</span>
            </div>
          </div>

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
            onDraftChange={(value) => {
              setIngredientDraft(value);
              if (validationMessage) setValidationMessage("");
            }}
            onAddIngredient={() => addIngredient()}
            onRemoveIngredient={removeIngredient}
            onServingsChange={setServings}
            onDietChange={setDiet}
            onSpiceLevelChange={setSpiceLevel}
            onMaxMinutesChange={setMaxMinutes}
            onLanguageChange={setLanguage}
            onSubmit={handleSubmit}
          />
        </section>

        <section
          className="results-section"
          ref={resultsRef}
          aria-labelledby="results-title"
        >
          <div className="results-heading">
            <div>
              <p className="eyebrow">
                {status === "success"
                  ? "A little inspiration"
                  : "Your kitchen, your call"}
              </p>
              <h2 id="results-title">
                {status === "success"
                  ? "Your recipe ideas"
                  : "A good place to start"}
              </h2>
            </div>
            {status === "success" && (
              <span className="result-count">
                {recipes.length} ideas for your table
              </span>
            )}
          </div>

          {status === "success" && generationMode === "mock" && (
            <div className="mock-notice" role="status">
              <span className="mock-notice-dot" aria-hidden="true" />
              Sample suggestions are showing. Add an API key to enable
              AI-generated recipes.
            </div>
          )}

          {status === "loading" && (
            <div className="results-status" role="status" aria-live="polite">
              <span className="status-orbit" aria-hidden="true">
                <i />
              </span>
              <div>
                <strong>Looking through your pantry…</strong>
                <p>Finding a few dishes that fit your time and taste.</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="results-error" role="alert">
              <div>
                <strong>We couldn’t find your recipes this time.</strong>
                <p>{errorMessage}</p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => lastRequest && void generateRecipes(lastRequest)}
              >
                Try again <span aria-hidden="true">↻</span>
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="recipe-grid">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  recipe={recipe}
                  index={index}
                  onOpen={setSelectedRecipe}
                  key={recipe.id}
                />
              ))}
            </div>
          )}

          {status === "idle" && (
            <div className="empty-state">
              <div className="empty-illustration" aria-hidden="true">
                <span className="empty-plate" />
                <span className="empty-leaf leaf-one" />
                <span className="empty-leaf leaf-two" />
                <span className="empty-tomato" />
              </div>
              <div>
                <strong>Your next favourite meal might be in here.</strong>
                <p>Add a few ingredients above to see where they take you.</p>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={addSampleIngredients}
              >
                Try a few pantry staples <span aria-hidden="true">↑</span>
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" href="/">
          <BrandMark />
          <span>Sanixor Rasoi</span>
        </Link>
        <p>
          Recipes are AI-generated suggestions. Check ingredients, allergens,
          and food-safety guidance.
        </p>
        <span className="footer-signoff">Cook something good today.</span>
      </footer>

      <RecipeDetailDialog
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  );
}
