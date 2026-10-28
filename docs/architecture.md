# Architecture

## Shape

Sanixor Rasoi is one Next.js App Router application. The browser renders the recipe workspace and sends one JSON request to a server route. The server validates the request, applies a small request limit, selects a provider, validates the generated recipes, and returns a stable response.

    Browser
      → src/app/api/recipes/route.ts
      → request schema and ingredient normalization
      → recipe generation service
      → mock provider or OpenAI Responses adapter
      → response schema and constraint validation
      → browser recipe cards and detail dialog

## Boundaries

- **src/app/** owns route composition and Next.js conventions.
- **src/features/recipes/** owns recipe types, validation, prompts, provider adapters, generation, and recipe UI.
- **src/components/** holds small reusable interface pieces that are not specific to recipes.
- **src/lib/** holds cross-feature infrastructure such as request errors and rate limiting.
- **docs/** records API, architecture, operational limits, and decisions.

There is no database or authentication in the MVP. Recipe results remain in browser memory for the current page session.

## Generation flow

The route accepts bounded JSON, normalizes and deduplicates ingredient names, and calls the generation service. The service chooses the mock when no API key is configured. Otherwise, the OpenAI adapter requests schema-constrained JSON from the Responses API. Zod validates the returned object and the service checks servings and the requested time limit before returning it.

One repair request is allowed for malformed model output. Provider timeouts and provider errors are mapped to controlled API errors; they are not retried automatically.

## Adding a provider

Implement RecipeProvider in **src/features/recipes/providers/provider.ts**, return the same recipe payload shape, and select it in **providers/index.ts**. Keep SDKs, credentials, and network calls inside server-only provider modules.
