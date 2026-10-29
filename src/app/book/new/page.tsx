import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RecipeForm } from "@/features/recipe-book/components/recipe-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Add a recipe — Sanixor Rasoi" };

export default async function NewRecipePage() {
  if (!(await getCurrentUser())) redirect("/login?next=/book/new");
  return <RecipeForm mode="create" />;
}
