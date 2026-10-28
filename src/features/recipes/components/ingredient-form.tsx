"use client";

import type { FormEvent, KeyboardEvent } from "react";
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
  onDraftChange: (value: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (ingredient: string) => void;
  onServingsChange: (value: number) => void;
  onDietChange: (value: Diet) => void;
  onSpiceLevelChange: (value: SpiceLevel) => void;
  onMaxMinutesChange: (value: number | undefined) => void;
  onLanguageChange: (value: RecipeLanguage) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const spiceOptions: {
  value: SpiceLevel;
  label: string;
  description: string;
}[] = [
  { value: "mild", label: "Mild", description: "Gentle warmth" },
  { value: "medium", label: "Medium", description: "Balanced heat" },
  { value: "hot", label: "Hot", description: "Bring the heat" },
];

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
  onDraftChange,
  onAddIngredient,
  onRemoveIngredient,
  onServingsChange,
  onDietChange,
  onSpiceLevelChange,
  onMaxMinutesChange,
  onLanguageChange,
  onSubmit,
}: IngredientFormProps) {
  function handleIngredientKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      onAddIngredient();
    }
  }

  return (
    <form className="pantry-form" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Start with your pantry</p>
          <h2>What do you have?</h2>
        </div>
        <span className="step-indicator" aria-label="Step 1 of 1">
          01 <span>/ 01</span>
        </span>
      </div>

      <label className="field-label" htmlFor="ingredient-input">
        Ingredients <span className="required-note">Add at least one</span>
      </label>
      <div className="ingredient-entry">
        <input
          id="ingredient-input"
          type="text"
          value={ingredientDraft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleIngredientKeyDown}
          placeholder="e.g. potatoes, peas, onion"
          autoComplete="off"
          maxLength={2400}
          aria-describedby="ingredient-help"
        />
        <button
          className="add-ingredient-button"
          type="button"
          onClick={onAddIngredient}
          disabled={!ingredientDraft.trim()}
          aria-label="Add ingredient"
        >
          <span aria-hidden="true">+</span>
          Add
        </button>
      </div>
      <p id="ingredient-help" className="field-help">
        Press Enter or separate items with commas.
      </p>

      {ingredients.length > 0 && (
        <ul
          className="ingredient-chips"
          aria-label="Ingredients in your pantry"
        >
          {ingredients.map((ingredient) => (
            <li className="ingredient-chip" key={ingredient}>
              <span>{ingredient}</span>
              <button
                type="button"
                onClick={() => onRemoveIngredient(ingredient)}
                aria-label={"Remove " + ingredient}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="preference-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="diet-select">
            Dietary preference
          </label>
          <select
            id="diet-select"
            value={diet}
            onChange={(event) => onDietChange(event.target.value as Diet)}
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="eggetarian">Eggetarian</option>
            <option value="non-vegetarian">Non-vegetarian</option>
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="servings-input">
            Servings
          </label>
          <div className="number-input-wrap">
            <input
              id="servings-input"
              type="number"
              min={1}
              max={12}
              value={servings}
              onChange={(event) => onServingsChange(Number(event.target.value))}
            />
            <span className="input-suffix">people</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="time-select">
            Ready in
          </label>
          <select
            id="time-select"
            value={maxMinutes ?? ""}
            onChange={(event) =>
              onMaxMinutesChange(
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
          >
            <option value="">Any time</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="language-select">
            Recipe language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(event) =>
              onLanguageChange(event.target.value as RecipeLanguage)
            }
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
      </div>

      <fieldset className="spice-fieldset">
        <legend className="field-label">Spice level</legend>
        <div className="spice-options">
          {spiceOptions.map((option, index) => (
            <label
              className={
                "spice-option" +
                (spiceLevel === option.value ? " is-selected" : "")
              }
              key={option.value}
            >
              <input
                type="radio"
                name="spice-level"
                value={option.value}
                checked={spiceLevel === option.value}
                onChange={() => onSpiceLevelChange(option.value)}
              />
              <span className="spice-indicator" aria-hidden="true">
                {Array.from({ length: 3 }, (_, dotIndex) => (
                  <span
                    className={dotIndex <= index ? "is-filled" : ""}
                    key={dotIndex}
                  />
                ))}
              </span>
              <span className="spice-copy">
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {validationMessage && (
        <p className="form-error" role="alert">
          <span aria-hidden="true">!</span>
          {validationMessage}
        </p>
      )}

      <button className="generate-button" type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="button-spinner" aria-hidden="true" />
            Finding something delicious…
          </>
        ) : (
          <>
            Find my recipes
            <span className="button-arrow" aria-hidden="true">
              →
            </span>
          </>
        )}
      </button>

      <p className="form-footnote">
        No sign-up. Just good ideas from what you have.
      </p>
    </form>
  );
}
