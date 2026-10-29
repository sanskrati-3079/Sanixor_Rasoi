import "server-only";
import { buildRecipePrompt } from "../prompt";
import { RECIPE_OUTPUT_JSON_SCHEMA, type RecipeRequest } from "../schemas";
import {
  MalformedProviderOutputError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  type RecipeProvider,
} from "./provider";

const PROVIDER_TIMEOUT_MS = 20_000;

type OpenAIResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export class OpenAIRecipeProvider implements RecipeProvider {
  readonly mode = "ai" as const;

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
  ) {}

  async generate(
    input: RecipeRequest,
    repairOutput?: string,
  ): Promise<unknown> {
    const prompt = buildRecipePrompt(input, repairOutput);
    let response: Response;

    try {
      response = await fetch(this.baseUrl + "/responses", {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        headers: {
          Authorization: "Bearer " + this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          store: false,
          instructions: prompt.system,
          input: prompt.user,
          max_output_tokens: 7000,
          text: {
            format: {
              type: "json_schema",
              name: "sanixor_recipe_candidates",
              strict: true,
              schema: RECIPE_OUTPUT_JSON_SCHEMA,
            },
          },
        }),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        throw new ProviderTimeoutError();
      }
      throw new ProviderUnavailableError();
    }

    if (!response.ok) {
      throw new ProviderUnavailableError();
    }

    let payload: OpenAIResponse;
    try {
      payload = (await response.json()) as OpenAIResponse;
    } catch {
      throw new MalformedProviderOutputError("");
    }

    const text = payload.output
      ?.flatMap((item) => (item.type === "message" ? (item.content ?? []) : []))
      .find((item) => item.type === "output_text")?.text;

    if (!text) {
      throw new MalformedProviderOutputError("");
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new MalformedProviderOutputError(text);
    }
  }
}
