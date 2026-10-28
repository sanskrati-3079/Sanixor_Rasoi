"use client";

import { useEffect, useRef, useState } from "react";
import type { Recipe } from "../schemas";

type RecipeDetailDialogProps = {
  recipe: Recipe | null;
  onClose: () => void;
};

function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(quantity);
}

export function RecipeDetailDialog({
  recipe,
  onClose,
}: RecipeDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [servingSelection, setServingSelection] = useState<{
    recipeId: string;
    servings: number;
  } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (recipe && !dialog.open) dialog.showModal();
    if (!recipe && dialog.open) dialog.close();
  }, [recipe]);

  if (!recipe) return null;

  const servings =
    servingSelection?.recipeId === recipe.id
      ? servingSelection.servings
      : recipe.servings;
  const updateServings = (value: number) =>
    setServingSelection({ recipeId: recipe.id, servings: value });
  const closeDialog = () => dialogRef.current?.close();
  const scale = servings / recipe.servings;

  return (
    <dialog
      className="recipe-dialog"
      ref={dialogRef}
      aria-labelledby="recipe-dialog-title"
      onClose={() => {
        setServingSelection(null);
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="dialog-content">
        <div className="dialog-topline">
          <span className="eyebrow">{recipe.cuisine}</span>
          <button
            className="dialog-close"
            type="button"
            onClick={closeDialog}
            aria-label="Close recipe details"
          >
            ×
          </button>
        </div>

        <h2 id="recipe-dialog-title">{recipe.title}</h2>
        <p className="dialog-description">{recipe.description}</p>

        <div className="detail-stats">
          <div>
            <span>PREP</span>
            <strong>{recipe.prepTimeMinutes} min</strong>
          </div>
          <div>
            <span>COOK</span>
            <strong>{recipe.cookTimeMinutes} min</strong>
          </div>
          <div>
            <span>TOTAL</span>
            <strong>{recipe.totalTimeMinutes} min</strong>
          </div>
        </div>

        <section className="detail-section">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Gather your ingredients</p>
              <h3>What you’ll need</h3>
            </div>
            <div
              className="serving-control"
              aria-label="Adjust recipe servings"
            >
              <button
                type="button"
                onClick={() => updateServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
                aria-label="Decrease servings"
              >
                −
              </button>
              <span>{servings} servings</span>
              <button
                type="button"
                onClick={() => updateServings(Math.min(12, servings + 1))}
                disabled={servings >= 12}
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>

          <ul className="detail-ingredients">
            {recipe.ingredients.map((item, index) => (
              <li key={item.name + "-" + index}>
                <span className="ingredient-check" aria-hidden="true">
                  {item.isUserProvided ? "✓" : "+"}
                </span>
                <span className="detail-ingredient-name">
                  <strong>{item.name}</strong>
                  {item.note && <small>{item.note}</small>}
                </span>
                <span className="ingredient-quantity">
                  {formatQuantity(item.quantity * scale)} {item.unit}
                </span>
                <span
                  className={
                    item.isUserProvided
                      ? "ingredient-origin is-pantry"
                      : "ingredient-origin"
                  }
                >
                  {item.isUserProvided ? "In your pantry" : "Add"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <p className="eyebrow">Let’s make it</p>
          <h3>Cooking steps</h3>
          <ol className="cooking-steps">
            {recipe.instructions.map((instruction) => (
              <li key={instruction.step}>
                <span className="step-number">
                  {String(instruction.step).padStart(2, "0")}
                </span>
                <div>
                  <p>{instruction.text}</p>
                  {instruction.durationMinutes > 0 && (
                    <small>About {instruction.durationMinutes} min</small>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {recipe.substitutions.length > 0 && (
          <section className="detail-section">
            <p className="eyebrow">Make it work</p>
            <h3>Easy swaps</h3>
            <ul className="substitution-list">
              {recipe.substitutions.map((substitution) => (
                <li
                  key={
                    substitution.originalIngredient + substitution.alternative
                  }
                >
                  <strong>
                    {substitution.originalIngredient}{" "}
                    <span aria-hidden="true">→</span> {substitution.alternative}
                  </strong>
                  <p>{substitution.note}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recipe.warnings.length > 0 && (
          <aside className="recipe-warning">
            <span className="warning-mark" aria-hidden="true">
              !
            </span>
            <div>
              <strong>A small note</strong>
              <ul>
                {recipe.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        <p className="dialog-disclaimer">
          AI-generated idea. Check ingredients, allergens, and safe cooking
          temperatures before you begin.
        </p>
      </div>
    </dialog>
  );
}
