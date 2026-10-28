import "server-only";
import { MockRecipeProvider } from "./mock-provider";
import { OpenAIRecipeProvider } from "./openai-provider";
import type { RecipeProvider } from "./provider";

export function getRecipeProvider(): RecipeProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) return new MockRecipeProvider();

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-6-luna";
  const baseUrl = (
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/+$/u, "");

  return new OpenAIRecipeProvider(apiKey, model, baseUrl);
}
