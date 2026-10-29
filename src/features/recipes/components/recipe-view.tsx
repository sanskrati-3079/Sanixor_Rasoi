"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import {
  ChefHat,
  CookingPot,
  Lightbulb,
  Repeat,
  Timer,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { DietMark, dietLabels } from "@/components/ui/diet-badge";
import { SpiceMeter } from "@/components/ui/spice-meter";
import { Stepper } from "@/components/ui/stepper";
import { detectAllergens } from "../allergens";
import { difficultyLabels, formatQuantity } from "../display";
import type { RecipeViewModel } from "../view-model";
import { RecipeVideo } from "./recipe-video";

type RecipeViewProps = {
  recipe: RecipeViewModel;
  titleId: string;
  titleAs?: "h1" | "h2";
  /** Shown in the hero beside the stats, e.g. "Start cooking". */
  actions?: ReactNode;
  /** Small line above the title, e.g. "by @asha". */
  byline?: ReactNode;
};

type IndexedIngredient = {
  item: RecipeViewModel["ingredients"][number];
  index: number;
};

const statLabel =
  "text-xs font-semibold tracking-wide text-ink-muted uppercase";

export function RecipeView({
  recipe,
  titleId,
  titleAs: Title = "h2",
  actions,
  byline,
}: RecipeViewProps) {
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());
  const { lang } = recipe;
  const scale = servings / recipe.servings;

  const indexed = recipe.ingredients.map((item, index) => ({ item, index }));
  const hasPantryInfo = recipe.ingredients.some(
    (item) => item.isUserProvided !== undefined,
  );
  const allergens = detectAllergens(recipe.ingredients.map((i) => i.name));

  function toggle(index: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function renderGroup(title: string | null, items: IndexedIngredient[]) {
    if (items.length === 0) return null;
    return (
      <div key={title ?? "all"}>
        {title && (
          <h4 className="text-accent-strong mb-2 text-sm font-semibold tracking-[0.1em] uppercase">
            {title}
          </h4>
        )}
        <ul className="divide-line divide-y">
          {items.map(({ item, index }) => {
            const id = titleId + "-ingredient-" + index;
            const isChecked = checked.has(index);
            return (
              <li key={id}>
                <label
                  htmlFor={id}
                  className="flex min-h-12 cursor-pointer items-start gap-3 py-2.5"
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(index)}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-denim)]"
                  />
                  <span
                    className={clsx(
                      "min-w-0 flex-1 transition-colors duration-150",
                      isChecked && "text-ink-muted line-through",
                    )}
                  >
                    <span lang={lang} className="font-medium">
                      {item.name}
                    </span>
                    {item.note && (
                      <span
                        lang={lang}
                        className="text-ink-muted block text-sm"
                      >
                        {item.note}
                      </span>
                    )}
                  </span>
                  <span className="text-ink shrink-0 text-right text-sm font-semibold tabular-nums">
                    {item.quantity !== null &&
                      formatQuantity(item.quantity * scale)}{" "}
                    <span lang={lang}>{item.unit}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const stats: { label: string; value: ReactNode }[] = [
    { label: "Prep", value: recipe.prepTimeMinutes + " min" },
    { label: "Cook", value: recipe.cookTimeMinutes + " min" },
    { label: "Total", value: recipe.totalTimeMinutes + " min" },
    { label: "Servings", value: servings },
    ...(recipe.difficulty
      ? [{ label: "Difficulty", value: difficultyLabels[recipe.difficulty] }]
      : []),
    { label: "Cuisine", value: <span lang={lang}>{recipe.cuisine}</span> },
    {
      label: "Diet",
      value: recipe.diet ? (
        <span className="flex items-center gap-1.5">
          <DietMark diet={recipe.diet} />
          {dietLabels[recipe.diet]}
        </span>
      ) : (
        "Not stated"
      ),
    },
  ];

  return (
    <div>
      <header className="bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-sky)_70%,transparent),transparent)] px-5 pt-8 pb-7 sm:px-8 md:px-10">
        <div
          className={clsx(
            "grid gap-6",
            recipe.photoSrc &&
              "md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-center",
          )}
        >
          <div className="min-w-0">
            <p
              lang={lang}
              className="text-accent-strong text-sm font-semibold tracking-[0.12em] uppercase"
            >
              {recipe.cuisine}
            </p>
            {byline && (
              <div className="text-ink-muted mt-1 text-sm">{byline}</div>
            )}
            <Title
              id={titleId}
              lang={lang}
              className="font-display mt-2 text-[2rem] leading-tight font-semibold tracking-tight sm:text-[2.6rem]"
            >
              {recipe.title}
            </Title>
            <p lang={lang} className="text-ink mt-3 max-w-2xl text-[1.05rem]">
              {recipe.description}
            </p>
            {recipe.spiceLevel && (
              <SpiceMeter level={recipe.spiceLevel} className="mt-3" />
            )}
            {actions && (
              <div className="mt-5 flex flex-wrap gap-2">{actions}</div>
            )}
          </div>
          {recipe.photoSrc && (
            <div className="rounded-card shadow-card relative aspect-[4/3] overflow-hidden">
              <Image
                src={recipe.photoSrc}
                alt={"Photo of " + recipe.title}
                fill
                unoptimized
                sizes="(min-width: 768px) 320px, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 lg:grid-cols-7">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-field glass-strong min-w-0 px-3 py-2.5"
            >
              <dt className={statLabel}>{stat.label}</dt>
              <dd className="leading-snug font-semibold break-words">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-8 px-5 py-8 sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:px-10">
        <div className="space-y-6 self-start md:sticky md:top-20">
          <section
            aria-labelledby={titleId + "-ingredients"}
            className="rounded-card glass-strong p-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3
                id={titleId + "-ingredients"}
                className="font-display text-2xl font-semibold"
              >
                Ingredients
              </h3>
              <Stepper
                label="Servings"
                hideLabel
                value={servings}
                min={1}
                max={12}
                unit={servings === 1 ? "serving" : "servings"}
                onChange={setServings}
              />
            </div>
            <p className="text-ink-muted mt-1 text-sm">
              Tick things off as you go.
            </p>
            <div className="mt-4 space-y-5">
              {hasPantryInfo ? (
                <>
                  {renderGroup(
                    "From your kitchen",
                    indexed.filter(({ item }) => item.isUserProvided),
                  )}
                  {renderGroup(
                    "You'll also need",
                    indexed.filter(({ item }) => !item.isUserProvided),
                  )}
                </>
              ) : (
                renderGroup(null, indexed)
              )}
            </div>
          </section>

          {recipe.equipment.length > 0 && (
            <section
              aria-labelledby={titleId + "-equipment"}
              className="rounded-card glass-strong p-5"
            >
              <h3
                id={titleId + "-equipment"}
                className="font-display flex items-center gap-2 text-xl font-semibold"
              >
                <CookingPot className="text-denim size-5" aria-hidden="true" />
                Equipment
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2" lang={lang}>
                {recipe.equipment.map((tool) => (
                  <li
                    key={tool}
                    className="bg-sky rounded-full px-3 py-1.5 text-sm font-medium"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recipe.nutritionPerServing && (
            <section
              aria-labelledby={titleId + "-nutrition"}
              className="rounded-card glass-strong p-5"
            >
              <h3
                id={titleId + "-nutrition"}
                className="font-display text-xl font-semibold"
              >
                Nutrition per serving
              </h3>
              <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                {(
                  [
                    ["Calories", recipe.nutritionPerServing.calories, "kcal"],
                    ["Protein", recipe.nutritionPerServing.proteinG, "g"],
                    ["Carbs", recipe.nutritionPerServing.carbsG, "g"],
                    ["Fat", recipe.nutritionPerServing.fatG, "g"],
                  ] as const
                ).map(([label, value, unit]) => (
                  <div
                    key={label}
                    className="rounded-field bg-canvas px-1 py-2.5"
                  >
                    <dt className="text-ink-muted text-xs font-semibold">
                      {label}
                    </dt>
                    <dd className="font-display text-lg font-semibold">
                      {Math.round(value)}
                      <span className="text-ink-muted text-xs font-normal">
                        {" "}
                        {unit}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-ink-muted mt-3 text-xs">
                Approximate estimate for the original serving size, not dietary
                or medical advice.
              </p>
            </section>
          )}
        </div>

        <div className="min-w-0 space-y-10">
          <section aria-labelledby={titleId + "-steps"}>
            <h3
              id={titleId + "-steps"}
              className="font-display flex items-center gap-2 text-2xl font-semibold"
            >
              <ChefHat className="text-denim size-6" aria-hidden="true" />
              Let&apos;s cook
            </h3>
            <ol className="mt-5 space-y-6">
              {recipe.instructions.map((instruction) => (
                <li key={instruction.step} className="flex gap-4">
                  <span
                    className="bg-denim font-display text-surface grid size-11 shrink-0 place-items-center rounded-full text-lg font-semibold"
                    aria-hidden="true"
                  >
                    {instruction.step}
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <span className="sr-only">Step {instruction.step}: </span>
                    <p lang={lang} className="text-[1.05rem] leading-relaxed">
                      {instruction.text}
                    </p>
                    {instruction.durationMinutes > 0 && (
                      <Badge
                        tone="accent"
                        className="mt-2"
                        icon={<Timer className="size-3.5" aria-hidden="true" />}
                      >
                        About {instruction.durationMinutes} min
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <RecipeVideo recipe={recipe} headingId={titleId + "-video"} />

          {(recipe.tips.length > 0 || recipe.servingSuggestion) && (
            <section aria-labelledby={titleId + "-tips"} className="space-y-3">
              <h3
                id={titleId + "-tips"}
                className="font-display flex items-center gap-2 text-2xl font-semibold"
              >
                <Lightbulb className="text-denim size-6" aria-hidden="true" />
                Tips &amp; serving
              </h3>
              {recipe.tips.length > 0 && (
                <ul
                  className="marker:text-accent-strong list-disc space-y-2 pl-5"
                  lang={lang}
                >
                  {recipe.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              )}
              {recipe.servingSuggestion && (
                <Callout
                  tone="info"
                  title="Serve it with"
                  icon={
                    <Utensils
                      className="text-denim size-5"
                      aria-hidden="true"
                    />
                  }
                >
                  <p lang={lang}>{recipe.servingSuggestion}</p>
                </Callout>
              )}
            </section>
          )}

          {recipe.substitutions.length > 0 && (
            <section aria-labelledby={titleId + "-swaps"}>
              <h3
                id={titleId + "-swaps"}
                className="font-display text-2xl font-semibold"
              >
                Easy swaps
              </h3>
              <ul className="mt-4 grid gap-3">
                {recipe.substitutions.map((swap) => (
                  <li key={swap.originalIngredient + swap.alternative}>
                    <Callout
                      tone="tip"
                      icon={
                        <Repeat
                          className="text-accent-strong size-5"
                          aria-hidden="true"
                        />
                      }
                      title={
                        <>
                          Don&apos;t have{" "}
                          <span lang={lang}>{swap.originalIngredient}</span>?
                          Use <span lang={lang}>{swap.alternative}</span>.
                        </>
                      }
                    >
                      <p lang={lang} className="text-ink-muted">
                        {swap.note}
                      </p>
                    </Callout>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Callout tone="warning" title="Allergens & safety">
            {allergens.length > 0 ? (
              <p>
                <span className="font-semibold">May contain: </span>
                {allergens.join(", ")}.
              </p>
            ) : (
              <p>No common allergens spotted in the ingredient names.</p>
            )}
            {recipe.warnings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5" lang={lang}>
                {recipe.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
            <p>
              Allergens are detected from ingredient names only and can be
              missed. We can&apos;t confirm any recipe is allergy-safe — check
              every label, watch for cross-contamination and cook to safe
              temperatures.
            </p>
          </Callout>
        </div>
      </div>
    </div>
  );
}
