import type { RecipeRequest } from "../schemas";

export type GenerationMode = "mock" | "ai";

export interface RecipeProvider {
  readonly mode: GenerationMode;
  generate(input: RecipeRequest, repairOutput?: string): Promise<unknown>;
}

export class ProviderTimeoutError extends Error {
  constructor() {
    super("Recipe provider timed out.");
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderUnavailableError extends Error {
  constructor() {
    super("Recipe provider is unavailable.");
    this.name = "ProviderUnavailableError";
  }
}

export class MalformedProviderOutputError extends Error {
  readonly output: string;

  constructor(output: string) {
    super("Recipe provider returned malformed output.");
    this.name = "MalformedProviderOutputError";
    this.output = output;
  }
}

export class InvalidRecipeOutputError extends Error {
  readonly output: string;

  constructor(output: string) {
    super("Recipe provider returned invalid recipes.");
    this.name = "InvalidRecipeOutputError";
    this.output = output;
  }
}
