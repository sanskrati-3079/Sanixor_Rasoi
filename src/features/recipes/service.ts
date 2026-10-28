import "server-only";
import {
  hasEgg,
  hasMeatOrFish,
  ingredientDietaryConflict,
} from "./dietary-rules";
import { ingredientKey } from "./normalize";
import {
  RecipeCandidatesSchema,
  type RecipeCandidate,
  type RecipeRequest,
} from "./schemas";
import {
  InvalidRecipeOutputError,
  MalformedProviderOutputError,
  type RecipeProvider,
} from "./providers/provider";

const MAX_REPAIR_CONTEXT_LENGTH = 8000;

function serializedOutput(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, MAX_REPAIR_CONTEXT_LENGTH);
  } catch {
    return "";
  }
}

function validateForRequest(
  recipes: RecipeCandidate[],
  input: RecipeRequest,
): RecipeCandidate[] {
  const availableIngredients = new Set(input.ingredients.map(ingredientKey));

  return recipes.map((recipe) => {
    if (recipe.servings !== input.servings) {
      throw new Error("Recipe serving count did not match the request.");
    }

    if (
      recipe.totalTimeMinutes !==
      recipe.prepTimeMinutes + recipe.cookTimeMinutes
    ) {
      throw new Error("Recipe time totals did not match.");
    }

    if (input.maxMinutes && recipe.totalTimeMinutes > input.maxMinutes) {
      throw new Error("Recipe exceeded the requested time.");
    }

    if (
      recipe.instructions.some(
        (instruction, index) => instruction.step !== index + 1,
      )
    ) {
      throw new Error("Recipe instructions were not sequential.");
    }

    const tags = new Set(recipe.dietaryTags);
    const ingredientNames = recipe.ingredients.map((item) => item.name);
    if (
      ingredientNames.some(
        (name) => ingredientDietaryConflict(name, input.diet) !== null,
      )
    ) {
      throw new Error(
        "Recipe included an ingredient outside the selected diet.",
      );
    }
    if (
      (hasMeatOrFish(ingredientNames) && !tags.has("non-vegetarian")) ||
      (hasEgg(ingredientNames) &&
        !tags.has("eggetarian") &&
        !tags.has("non-vegetarian"))
    ) {
      throw new Error("Recipe dietary tags do not match its ingredients.");
    }
    if (input.diet === "vegan" && !tags.has("vegan")) {
      throw new Error("Vegan recipes must be tagged as vegan.");
    }
    if (
      input.diet === "vegetarian" &&
      !tags.has("vegetarian") &&
      !tags.has("vegan")
    ) {
      throw new Error("Vegetarian recipes must be tagged as vegetarian.");
    }

    return {
      ...recipe,
      ingredients: recipe.ingredients.map((item) => ({
        ...item,
        isUserProvided: availableIngredients.has(ingredientKey(item.name)),
      })),
    };
  });
}

export async function generateRecipeCandidates(
  provider: RecipeProvider,
  input: RecipeRequest,
): Promise<RecipeCandidate[]> {
  let repairOutput: string | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let raw: unknown;

    try {
      raw = await provider.generate(input, repairOutput);
    } catch (error) {
      if (error instanceof MalformedProviderOutputError) {
        if (attempt === 0) {
          repairOutput = error.output.slice(0, MAX_REPAIR_CONTEXT_LENGTH);
          continue;
        }
        throw new InvalidRecipeOutputError(error.output);
      }
      throw error;
    }

    try {
      const parsed = RecipeCandidatesSchema.parse(raw);
      return validateForRequest(parsed.recipes, input);
    } catch {
      if (attempt === 0) {
        repairOutput = serializedOutput(raw);
        continue;
      }
      throw new InvalidRecipeOutputError(serializedOutput(raw));
    }
  }

  throw new InvalidRecipeOutputError("");
}
