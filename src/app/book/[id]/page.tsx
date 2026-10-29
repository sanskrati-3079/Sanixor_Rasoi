import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookRecipePage } from "@/features/recipe-book/components/book-recipe-page";
import { getRecipe } from "@/features/recipe-book/repository";
import { getCurrentUser } from "@/lib/auth";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const recipe = getRecipe((await params).id, null);
  return {
    title: recipe
      ? recipe.title + " — Sanixor Rasoi"
      : "Recipe not found — Sanixor Rasoi",
    description: recipe?.description,
  };
}

export default async function RecipePage({ params }: PageProps) {
  const recipe = getRecipe((await params).id, await getCurrentUser());
  if (!recipe) notFound();
  return <BookRecipePage recipe={recipe} />;
}
