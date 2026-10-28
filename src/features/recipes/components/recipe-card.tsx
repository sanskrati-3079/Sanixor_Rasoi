import type { Recipe } from "../schemas";

type RecipeCardProps = {
  recipe: Recipe;
  index: number;
  onOpen: (recipe: Recipe) => void;
};

const tagLabels: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  "non-vegetarian": "Non-vegetarian",
};

export function RecipeCard({ recipe, index, onOpen }: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <div className="recipe-card-topline">
        <span className="recipe-index">0{index + 1}</span>
        <span className="recipe-cuisine">{recipe.cuisine}</span>
      </div>

      <h3>{recipe.title}</h3>
      <p className="recipe-description">{recipe.description}</p>

      <div className="recipe-meta">
        <span>
          <span className="meta-icon" aria-hidden="true">
            ◷
          </span>
          {recipe.totalTimeMinutes} min
        </span>
        <span>
          <span className="meta-icon" aria-hidden="true">
            ♧
          </span>
          {recipe.servings} servings
        </span>
      </div>

      <div className="recipe-tags" aria-label="Dietary information">
        {(recipe.dietaryTags.length ? recipe.dietaryTags : ["vegetarian"]).map(
          (tag) => (
            <span className="recipe-tag" key={tag}>
              {tagLabels[tag] ?? tag}
            </span>
          ),
        )}
      </div>

      <button
        className="recipe-open-button"
        onClick={() => onOpen(recipe)}
        type="button"
        aria-label={"View " + recipe.title + " recipe"}
      >
        View recipe
        <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}
