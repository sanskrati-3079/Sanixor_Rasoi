"use client";

import type {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { clsx } from "clsx";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipToggle } from "@/components/ui/chip";
import { DietMark, dietLabels } from "@/components/ui/diet-badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ChilliRow } from "@/components/ui/spice-meter";
import { Stepper } from "@/components/ui/stepper";
import {
  MAX_INGREDIENTS,
  languageOptions,
  quickAddIngredients,
} from "../display";
import type { Diet, RecipeLanguage, SpiceLevel } from "../schemas";

type IngredientFormProps = {
  ingredients: string[];
  ingredientDraft: string;
  servings: number;
  diet: Diet;
  spiceLevel: SpiceLevel;
  maxMinutes: number | undefined;
  language: RecipeLanguage;
  isLoading: boolean;
  validationMessage: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (value: string) => void;
  onAddDraft: () => void;
  onPasteIngredients: (text: string) => void;
  onToggleSuggestion: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
  onServingsChange: (value: number) => void;
  onDietChange: (value: Diet) => void;
  onSpiceLevelChange: (value: SpiceLevel) => void;
  onMaxMinutesChange: (value: number | undefined) => void;
  onLanguageChange: (value: RecipeLanguage) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const dietOrder: Diet[] = [
  "vegetarian",
  "vegan",
  "eggetarian",
  "non-vegetarian",
];

const spiceOptions: { value: SpiceLevel; label: string }[] = [
  { value: "mild", label: "Mild" },
  { value: "medium", label: "Medium" },
  { value: "hot", label: "Hot" },
];

const timeOptions = ["any", "15", "30", "45", "60", "90"] as const;

export function IngredientForm({
  ingredients,
  ingredientDraft,
  servings,
  diet,
  spiceLevel,
  maxMinutes,
  language,
  isLoading,
  validationMessage,
  inputRef,
  onDraftChange,
  onAddDraft,
  onPasteIngredients,
  onToggleSuggestion,
  onRemoveIngredient,
  onServingsChange,
  onDietChange,
  onSpiceLevelChange,
  onMaxMinutesChange,
  onLanguageChange,
  onSubmit,
}: IngredientFormProps) {
  const hasAnything = ingredients.length > 0 || ingredientDraft.trim() !== "";

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      onAddDraft();
    } else if (
      event.key === "Backspace" &&
      ingredientDraft === "" &&
      ingredients.length > 0
    ) {
      onRemoveIngredient(ingredients[ingredients.length - 1]);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (/[,\n]/u.test(text)) {
      event.preventDefault();
      onPasteIngredients(ingredientDraft + text.replace(/\r?\n/gu, ","));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="kitchen-form-title"
      className="rounded-panel glass-strong p-5 sm:p-7"
    >
      <h2
        id="kitchen-form-title"
        className="font-display text-2xl font-semibold tracking-tight"
      >
        Your ingredients
      </h2>

      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label htmlFor="ingredient-input" className="text-sm font-semibold">
            Add what you have
          </label>
          <span
            id="ingredient-count"
            className={clsx(
              "text-sm tabular-nums",
              ingredients.length >= MAX_INGREDIENTS
                ? "text-danger font-semibold"
                : "text-ink-muted",
            )}
          >
            {ingredients.length} / {MAX_INGREDIENTS} ingredients
          </span>
        </div>

        <div
          className="rounded-field border-line-strong bg-canvas focus-within:border-accent-strong focus-within:bg-surface flex flex-wrap items-center gap-2 border-2 p-2 transition-colors duration-150"
          onClick={(event) => {
            if (event.target === event.currentTarget) inputRef.current?.focus();
          }}
        >
          {ingredients.length > 0 && (
            <ul
              className="flex w-full flex-wrap gap-2"
              aria-label="Added ingredients"
            >
              {ingredients.map((ingredient) => (
                <li key={ingredient} className="max-w-full">
                  <Chip
                    onRemove={() => onRemoveIngredient(ingredient)}
                    removeLabel={"Remove " + ingredient}
                  >
                    {ingredient}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={inputRef}
            id="ingredient-input"
            type="text"
            value={ingredientDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              ingredients.length ? "Add another…" : "e.g. potato, onion, peas"
            }
            autoComplete="off"
            enterKeyHint="enter"
            maxLength={2400}
            aria-describedby="ingredient-help ingredient-count"
            className="text-ink placeholder:text-ink-muted min-h-11 min-w-[8rem] flex-1 bg-transparent px-2 text-base focus:outline-none"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddDraft}
            disabled={!ingredientDraft.trim()}
            className="shrink-0"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </Button>
        </div>
        <p id="ingredient-help" className="text-ink-muted mt-2 text-sm">
          Press Enter or type a comma after each one. You can paste a whole
          list.
        </p>
      </div>

      <div className="mt-5">
        <p id="quick-add-label" className="mb-2 text-sm font-semibold">
          Quick add
        </p>
        <ul aria-labelledby="quick-add-label" className="flex flex-wrap gap-2">
          {quickAddIngredients.map((name) => (
            <li key={name}>
              <ChipToggle
                pressed={ingredients.includes(name)}
                onClick={() => onToggleSuggestion(name)}
              >
                {name}
              </ChipToggle>
            </li>
          ))}
        </ul>
      </div>

      <section
        aria-labelledby="preferences-title"
        className="bg-sky/60 mt-7 rounded-[22px] p-4 sm:p-5"
      >
        <h3
          id="preferences-title"
          className="font-display text-xl font-semibold"
        >
          Your preferences
        </h3>

        <div className="mt-4 grid gap-5">
          <Stepper
            label="Servings"
            value={servings}
            min={1}
            max={12}
            unit={servings === 1 ? "person" : "people"}
            onChange={onServingsChange}
          />

          <SegmentedControl
            legend="Diet"
            name="diet"
            value={diet}
            onChange={onDietChange}
            options={dietOrder.map((value) => ({
              value,
              label: dietLabels[value],
              icon: (
                <span className="bg-surface grid size-6 place-items-center rounded-md">
                  <DietMark diet={value} />
                </span>
              ),
            }))}
          />

          <SegmentedControl
            legend="Spice level"
            name="spice-level"
            value={spiceLevel}
            onChange={onSpiceLevelChange}
            options={spiceOptions.map((option) => ({
              value: option.value,
              label: option.label,
              icon: (
                <span className="bg-surface inline-flex rounded-full px-1.5 py-0.5">
                  <ChilliRow level={option.value} />
                </span>
              ),
            }))}
          />

          <SegmentedControl
            legend="Ready in"
            name="max-minutes"
            value={maxMinutes ? String(maxMinutes) : "any"}
            onChange={(value) =>
              onMaxMinutesChange(value === "any" ? undefined : Number(value))
            }
            options={timeOptions.map((value) => ({
              value,
              label: value === "any" ? "Any time" : value + " min",
            }))}
          />

          <SegmentedControl
            legend="Recipe language"
            name="language"
            value={language}
            onChange={onLanguageChange}
            options={languageOptions.map((option) => ({
              value: option.value,
              label: option.label,
              lang: option.tag,
            }))}
          />
        </div>
      </section>

      <p
        aria-live="polite"
        className={clsx(
          "text-danger text-[0.95rem] font-medium",
          validationMessage &&
            "rounded-field border-danger/30 bg-danger-soft mt-5 border px-4 py-3",
        )}
      >
        {validationMessage}
      </p>

      <Button
        type="submit"
        size="lg"
        fullWidth
        className="mt-6"
        disabled={isLoading || !hasAnything}
        aria-describedby={hasAnything ? undefined : "generate-hint"}
      >
        {isLoading ? (
          <>
            <span
              className="border-ink/30 border-t-ink size-5 animate-spin rounded-full border-2"
              aria-hidden="true"
            />
            Cooking up ideas…
          </>
        ) : (
          <>
            <Sparkles className="size-5" aria-hidden="true" />
            Generate Recipes
          </>
        )}
      </Button>
      <p id="generate-hint" className="text-ink-muted mt-3 text-center text-sm">
        {hasAnything
          ? "No sign-up needed. Recipes are suggestions — check allergens before cooking."
          : "Add at least one ingredient to get recipe ideas."}
      </p>
    </form>
  );
}
