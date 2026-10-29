import { RecipeWorkspace } from "@/features/recipes/components/recipe-workspace";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  return <RecipeWorkspace signedIn={user !== null} />;
}
