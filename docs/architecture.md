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
- **src/lib/** holds cross-feature infrastructure: the database, sessions, HTTP helpers and rate limiting.
- **docs/** records API, architecture, operational limits, and decisions.

AI recipe results stay in browser memory for the page session unless a signed-in user saves one to the recipe book.

## Recipe book

    Browser (/book, /book/[id], /book/new, /login)
      → server components read SQLite directly for pages
      → src/app/api/book/** and src/app/api/auth/** for writes and uploads
      → src/features/recipe-book/repository.ts (recipes) and uploads.ts (files)
      → src/lib/db.ts (node:sqlite, DATA_DIR/rasoi.db) and src/lib/auth.ts (sessions)

- **src/features/recipe-book/** owns the recipe-book schema (shared by the form and the API), repository, uploads, starter recipes and pages' components.
- **src/features/recipes/components/recipe-view.tsx** renders any recipe (AI or book) through one view model (`view-model.ts`), and **cook-mode.tsx** provides the step-by-step cooking view.
- Six starter recipes are seeded the first time the database is created.

See [ADR 0002](decisions/0002-recipe-book-storage.md) for the storage choice.

## 3D kitchen

The hero is a three.js scene built in code (`src/components/kitchen3d/kitchen-scene.ts`) — no model files. It is loaded with `next/dynamic` only in the browser, so three.js is not in the initial bundle. The server renders the SVG kitchen; the 3D scene replaces it once ready, and the SVG stays when WebGL is unavailable or the visitor prefers reduced motion. Rendering pauses when the canvas is off-screen or the tab is hidden. Hotspot content (spice of the day, meal for the time of day, basket items) lives in `kitchen-secrets.ts`; the scene only reports which object was clicked and plays its effect (steam burst, day/night).

## Generation flow

The route accepts bounded JSON, normalizes and deduplicates ingredient names, and calls the generation service. The service chooses the mock when no API key is configured. Otherwise, the OpenAI adapter requests schema-constrained JSON from the Responses API. Zod validates the returned object and the service checks servings and the requested time limit before returning it.

One repair request is allowed for malformed model output. Provider timeouts and provider errors are mapped to controlled API errors; they are not retried automatically.

## Adding a provider

Implement RecipeProvider in **src/features/recipes/providers/provider.ts**, return the same recipe payload shape, and select it in **providers/index.ts**. Keep SDKs, credentials, and network calls inside server-only provider modules.
