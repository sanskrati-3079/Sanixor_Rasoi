import type { Diet, Difficulty, Recipe, RecipeLanguage } from "./schemas";

/** Mirrors the request schema's ingredient limits. */
export const MAX_INGREDIENTS = 30;
export const MAX_INGREDIENT_LENGTH = 80;

export const quickAddIngredients = [
  "potato",
  "onion",
  "tomato",
  "paneer",
  "rice",
  "dal",
  "egg",
  "chicken",
  "spinach",
  "besan",
];

export const languageOptions: {
  value: RecipeLanguage;
  label: string;
  short: string;
  /** BCP 47 tag for the lang attribute of generated text. */
  tag: string;
}[] = [
  { value: "en", label: "English", short: "EN", tag: "en" },
  { value: "hi", label: "हिन्दी", short: "हि", tag: "hi" },
  { value: "hinglish", label: "Hinglish", short: "HING", tag: "hi-Latn" },
];

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function languageTag(language: RecipeLanguage): string {
  return languageOptions.find((option) => option.value === language)!.tag;
}

const dietPriority: Diet[] = [
  "non-vegetarian",
  "eggetarian",
  "vegan",
  "vegetarian",
];

/**
 * The single most specific diet to show on a badge. Returns null when the
 * recipe carries no tags, so we never claim a diet the data does not state.
 */
export function primaryDiet(tags: Recipe["dietaryTags"]): Diet | null {
  return dietPriority.find((diet) => tags.includes(diet)) ?? null;
}

export function ingredientUsage(recipe: Recipe) {
  const fromKitchen = recipe.ingredients.filter((item) => item.isUserProvided);
  return {
    used: fromKitchen.length,
    extra: recipe.ingredients.length - fromKitchen.length,
  };
}

const dishEmoji: [RegExp, string][] = [
  [/\b(biryani|pulao|rice|chawal)\b/iu, "🍚"],
  [/\b(dal|daal|lentil|sambar)\b/iu, "🥣"],
  [/\b(egg|anda|omelette|bhurji)\b/iu, "🍳"],
  [/\b(chicken|mutton|fish|keema|murgh)\b/iu, "🍗"],
  [/\b(roti|paratha|chapati|naan|dosa|chilla)\b/iu, "🫓"],
  [/\b(curry|masala|sabzi|subzi|korma)\b/iu, "🍛"],
];

/** A decorative emoji for the card artwork; purely cosmetic. */
export function emojiForRecipe(title: string): string {
  return dishEmoji.find(([pattern]) => pattern.test(title))?.[1] ?? "🍲";
}

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(quantity);
}

export function listIngredients(ingredients: string[], limit = 3): string {
  const shown = ingredients.slice(0, limit);
  const rest = ingredients.length - shown.length;
  const joined =
    shown.length > 1
      ? shown.slice(0, -1).join(", ") + " and " + shown[shown.length - 1]
      : (shown[0] ?? "");
  return rest > 0 ? shown.join(", ") + " and " + rest + " more" : joined;
}
