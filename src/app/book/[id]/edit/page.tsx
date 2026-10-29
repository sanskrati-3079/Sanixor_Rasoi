import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RecipeForm } from "@/features/recipe-book/components/recipe-form";
import { getRecipe } from "@/features/recipe-book/repository";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit recipe — Sanixor Rasoi" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditRecipePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/book/" + id + "/edit");
  const recipe = getRecipe(id, user);
  if (!recipe) notFound();
  if (!recipe.canEdit) redirect("/book/" + id);
  return <RecipeForm mode="edit" recipe={recipe} />;
}
