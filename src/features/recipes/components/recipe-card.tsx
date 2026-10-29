import { clsx } from "clsx";
import {
  ArrowRight,
  Clock,
  ShoppingBasket,
  Users,
  Utensils,
} from "lucide-react";
import { cardClasses } from "@/components/ui/card";
import { DietBadge } from "@/components/ui/diet-badge";
import { SpiceMeter } from "@/components/ui/spice-meter";
import { emojiForRecipe, ingredientUsage, primaryDiet } from "../display";
import type { Recipe, SpiceLevel } from "../schemas";

type RecipeCardProps = {
  recipe: Recipe;
  index: number;
  /** The spice level that was requested; recipes don't carry their own. */
  spiceLevel: SpiceLevel;
  lang: string;
  onOpen: (recipe: Recipe) => void;
};

const artTints = ["bg-sky", "bg-oak", "bg-sky-deep/60"];

export function RecipeCard({
  recipe,
  index,
  spiceLevel,
  lang,
  onOpen,
}: RecipeCardProps) {
  const diet = primaryDiet(recipe.dietaryTags);
  const usage = ingredientUsage(recipe);

  return (
    <article
      className={cardClasses({
        interactive: true,
        padded: false,
        className: "group animate-fade-up flex flex-col overflow-hidden",
      })}
      style={{ animationDelay: index * 80 + "ms" }}
    >
      <div
        className={clsx(
          "relative grid h-36 place-items-center",
          artTints[index % artTints.length],
        )}
        aria-hidden="true"
      >
        <span className="bg-surface/80 shadow-card grid size-24 place-items-center rounded-full text-5xl">
          {emojiForRecipe(recipe.title)}
        </span>
        <span className="font-display text-ink-muted absolute top-3 left-4 text-sm font-semibold">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-0 p-5 sm:p-6">
        <h3
          lang={lang}
          className="font-display text-xl leading-snug font-semibold sm:text-[1.35rem]"
        >
          <button
            type="button"
            onClick={() => onOpen(recipe)}
            className="after:rounded-card text-left after:absolute after:inset-0 focus:outline-none"
          >
            {recipe.title}
          </button>
        </h3>
        <p
          lang={lang}
          className="text-ink-muted mt-2 line-clamp-2 text-[0.95rem]"
        >
          {recipe.description}
        </p>

        <ul className="text-ink-muted mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          <li className="inline-flex items-center gap-1.5">
            <Clock className="text-accent-strong size-4" aria-hidden="true" />
            <span className="sr-only">Total time:</span>
            {recipe.totalTimeMinutes} min
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Users className="text-accent-strong size-4" aria-hidden="true" />
            {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
          </li>
          <li className="inline-flex min-w-0 items-center gap-1.5">
            <Utensils
              className="text-accent-strong size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="sr-only">Cuisine:</span>
            <span lang={lang} className="truncate">
              {recipe.cuisine}
            </span>
          </li>
        </ul>

        <div className="mt-4 mb-5 flex flex-wrap items-center gap-2">
          {diet && <DietBadge diet={diet} />}
          <SpiceMeter level={spiceLevel} />
        </div>

        <div className="border-line mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-ink inline-flex items-center gap-1.5 text-sm font-medium">
            <ShoppingBasket
              className="text-success size-4 shrink-0"
              aria-hidden="true"
            />
            Uses {usage.used} of your ingredients
            {usage.extra > 0 && (
              <span className="text-ink-muted"> · {usage.extra} extra</span>
            )}
          </p>
          <ArrowRight
            className="text-accent-strong size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  );
}
