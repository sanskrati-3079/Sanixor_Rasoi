import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { DietMark, dietLabels } from "@/components/ui/diet-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { BookRecipeCard } from "@/features/recipe-book/components/book-recipe-card";
import { listRecipes } from "@/features/recipe-book/repository";
import { DietSchema, type Diet } from "@/features/recipes/schemas";
import { getCurrentUser } from "@/lib/auth";
import { clsx } from "clsx";

export const metadata: Metadata = {
  title: "Recipe book — Sanixor Rasoi",
  description: "Browse, cook and share Indian home recipes.",
};

type PageProps = {
  searchParams: Promise<{ q?: string; diet?: string; mine?: string }>;
};

const diets: Diet[] = ["vegetarian", "vegan", "eggetarian", "non-vegetarian"];

export default async function RecipeBookPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const query = params.q?.trim().slice(0, 80) ?? "";
  const diet = DietSchema.safeParse(params.diet);
  const mine = params.mine === "1" && user !== null;
  const recipes = listRecipes({
    query: query || undefined,
    diet: diet.success ? diet.data : undefined,
    authorId: mine ? user.id : undefined,
  });

  const filterHref = (next: { diet?: string | null; mine?: boolean }) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    const nextDiet =
      next.diet === undefined ? (diet.success ? diet.data : null) : next.diet;
    if (nextDiet) search.set("diet", nextDiet);
    if (next.mine ?? mine) search.set("mine", "1");
    const text = search.toString();
    return "/book" + (text ? "?" + text : "");
  };

  const pill = (active: boolean) =>
    clsx(
      "inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[0.95rem] transition-colors duration-150",
      active
        ? "border-denim-edge bg-denim font-semibold text-surface"
        : "border-transparent bg-surface text-ink hover:border-line-strong hover:bg-sky",
    );

  return (
    <main
      id="main"
      className="mx-auto max-w-[1200px] px-4 pt-10 pb-16 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          as="h1"
          eyebrow="Recipe book"
          title="Cook, save and share"
          description="Every recipe here can be cooked step by step. Add your own family favourites — with a photo or video."
        />
        <Link
          href="/book/new"
          className={buttonClasses({
            className: "shrink-0 self-start sm:self-auto",
          })}
        >
          <Plus className="size-5" aria-hidden="true" />
          Add your recipe
        </Link>
      </div>

      <form role="search" action="/book" className="mt-8 flex max-w-xl gap-2">
        <label htmlFor="book-search" className="sr-only">
          Search recipes
        </label>
        <div className="border-line-strong bg-surface focus-within:border-accent-strong flex min-h-12 flex-1 items-center gap-2 rounded-full border-2 px-4">
          <Search className="text-ink-muted size-5" aria-hidden="true" />
          <input
            id="book-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search dal, paneer, breakfast…"
            maxLength={80}
            className="min-h-11 w-full bg-transparent text-base focus:outline-none"
          />
        </div>
        {diet.success && <input type="hidden" name="diet" value={diet.data} />}
        {mine && <input type="hidden" name="mine" value="1" />}
        <button
          type="submit"
          className={buttonClasses({ variant: "secondary" })}
        >
          Search
        </button>
      </form>

      <nav aria-label="Filter recipes" className="mt-4 flex flex-wrap gap-2">
        <Link
          href={filterHref({ diet: null })}
          aria-current={!diet.success ? "page" : undefined}
          className={pill(!diet.success)}
        >
          All diets
        </Link>
        {diets.map((value) => {
          const active = diet.success && diet.data === value;
          return (
            <Link
              key={value}
              href={filterHref({ diet: value })}
              aria-current={active ? "page" : undefined}
              className={pill(active)}
            >
              <span className="bg-surface grid size-6 place-items-center rounded-md">
                <DietMark diet={value} />
              </span>
              {dietLabels[value]}
            </Link>
          );
        })}
        {user && (
          <Link
            href={filterHref({ mine: !mine })}
            aria-current={mine ? "page" : undefined}
            className={pill(mine)}
          >
            My recipes
          </Link>
        )}
      </nav>

      <p className="text-ink-muted mt-6 text-sm" aria-live="polite">
        {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
        {query && <> matching “{query}”</>}
      </p>

      {recipes.length === 0 ? (
        <EmptyState
          className="mt-4"
          illustration={
            <span className="bg-sky grid size-24 place-items-center rounded-full">
              <BookOpen className="text-denim size-10" />
            </span>
          }
          title={mine ? "You haven't added a recipe yet" : "No recipes found"}
          description={
            mine
              ? "Share a dish you love — it only takes a few minutes."
              : "Try another search or clear the filters."
          }
          action={
            <Link
              href={mine ? "/book/new" : "/book"}
              className={buttonClasses()}
            >
              {mine ? "Add your first recipe" : "Show all recipes"}
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, index) => (
            <li key={recipe.id} className="grid">
              <BookRecipeCard recipe={recipe} index={index} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
