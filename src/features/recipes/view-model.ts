import type { BookRecipe, BookVideo } from "../recipe-book/schemas";
import { languageTag, primaryDiet } from "./display";
import type {
  Diet,
  Difficulty,
  Nutrition,
  Recipe,
  RecipeLanguage,
  SpiceLevel,
} from "./schemas";

/** One shape for showing any recipe, AI-generated or from the recipe book. */
export type RecipeViewModel = {
  title: string;
  description: string;
  cuisine: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: Difficulty | null;
  diet: Diet | null;
  spiceLevel: SpiceLevel | null;
  ingredients: {
    name: string;
    quantity: number | null;
    unit: string;
    note: string;
    /** Only known for AI recipes generated from the user's pantry. */
    isUserProvided?: boolean;
  }[];
  instructions: { step: number; text: string; durationMinutes: number }[];
  substitutions: Recipe["substitutions"];
  warnings: string[];
  equipment: string[];
  tips: string[];
  servingSuggestion: string;
  nutritionPerServing: Nutrition | null;
  video: BookVideo;
  photoSrc: string | null;
  lang: string;
  language: RecipeLanguage;
};

export function fromAiRecipe(
  recipe: Recipe,
  language: RecipeLanguage,
  spiceLevel: SpiceLevel,
): RecipeViewModel {
  return {
    ...recipe,
    difficulty: recipe.difficulty,
    diet: primaryDiet(recipe.dietaryTags),
    spiceLevel,
    video: { kind: "none" },
    photoSrc: null,
    lang: languageTag(language),
    language,
  };
}

export function fromBookRecipe(recipe: BookRecipe): RecipeViewModel {
  return {
    ...recipe,
    instructions: recipe.instructions.map((instruction, index) => ({
      ...instruction,
      step: index + 1,
    })),
    photoSrc: recipe.photo?.src ?? null,
    lang: languageTag(recipe.language),
  };
}
