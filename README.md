# Sanixor Rasoi

An AI-first Indian cooking assistant that turns pantry ingredients into practical recipe ideas — plus a shared recipe book where people browse, cook step by step, and add their own recipes with photos and videos.

Features:

- **Generate recipes** from the ingredients you have (works without an API key using a local mock).
- **Recipe details:** ingredient checklist, servings scaling, steps with timings, equipment, tips, approximate nutrition, detected allergens and a YouTube link for every dish.
- **Cook mode:** one step at a time with per-step timers; keeps the screen awake.
- **Recipe book:** search and filter by diet; sign up to add your own recipes with a photo and an uploaded video or YouTube link, edit or delete them, and save AI recipes to the book.
- **Interactive 3D kitchen** (three.js) that assembles itself on load and turns toward your cursor. Click the stove, cookbooks or fridge to navigate, and find a secret in the basket, spices, pressure cooker, clock, window and tulsi plant.
- **Glassmorphism UI:** frosted-glass surfaces over soft colour blobs, with solid surfaces for anyone who prefers reduced transparency.

## Run locally

Requirements: Node.js 22.13 or newer (for the built-in SQLite driver) and npm.

1. Install dependencies with **npm install**.
2. Copy **.env.example** to **.env.local**.
3. Leave **OPENAI_API_KEY** empty to use the local deterministic mock, or add a server-side OpenAI API key.
4. Start the development server with **npm run dev**.
5. Open http://localhost:3000.

The recipe book creates **data/rasoi.db** and **data/uploads/** on first use (both git-ignored) and seeds six starter recipes. Set **DATA_DIR** to keep them elsewhere, and **ADMIN_USERNAMES** to a comma-separated list of usernames allowed to remove any recipe. Node prints an "SQLite is an experimental feature" warning on start; it is harmless.

Available scripts:

- **npm run dev** starts the local app.
- **npm run lint** checks code style and common React/Next.js issues.
- **npm run typecheck** checks TypeScript types.
- **npm run build** creates the production build with Webpack.
- **npm run build:turbo** creates the production build with Turbopack.
- **npm run start** serves a production build.
- **npm run format** formats the project with Prettier.

## Project structure

    src/
      app/                 Next.js routes, page shell, and API route
      components/          Shared UI, header/footer and the 3D kitchen (kitchen3d/)
      features/recipes/    Recipe generation, schemas, recipe view and cook mode
      features/recipe-book/ Recipe book schema, storage, uploads, forms and pages' components
      lib/                 Database, sessions, HTTP helpers, request limits, safe logging
    docs/
      decisions/           Short architecture decisions
      api.md               Recipe endpoint contract
      architecture.md      Runtime boundaries and request flow
      performance.md       Latency goals and measurement approach
      security.md          Privacy and deployment controls

The recipe feature owns recipe-specific UI and business logic. The API route only coordinates parsing, limits, generation, and response formatting. Provider code stays in a server-only module.

## UI / design

The interface is built with Tailwind CSS v4. All colours, radii, shadows and motion are tokens in the `@theme` block of **src/app/globals.css**.

- **Palette:** an isometric "blue kitchen" look: denim blue, sky and tile white, natural oak, deep navy ink and a terracotta spice accent. The hero is an original isometric Indian kitchen drawn in SVG.
- **Fonts:** Fraunces for display, DM Sans for UI and Noto Sans Devanagari for Hindi, loaded through `next/font`.
- **Components:** shared UI components live in **src/components/ui/**; recipe screens live in **src/features/recipes/components/**.
- **Accessibility:** every text and border pairing meets WCAG AA. Controls are keyboard-accessible with targets of at least 44px, and motion respects `prefers-reduced-motion`.

See [Design system](docs/design-system.md) for tokens, contrast results, typography and component usage.

## Recipe generation

With no API key, the app uses a deterministic mock and labels results as sample suggestions. With **OPENAI_API_KEY** configured, the server calls the OpenAI Responses API using a strict JSON schema. **OPENAI_MODEL** can select another compatible model. The browser never receives provider credentials.

The model path makes one request under normal conditions and permits one repair request only if the provider returns malformed or schema-invalid output. The output is validated again with Zod before it reaches the browser.

## Documentation

- [Design system](docs/design-system.md)
- [Architecture](docs/architecture.md)
- [API contract](docs/api.md)
- [Security and privacy](docs/security.md)
- [Performance and latency](docs/performance.md)
- [ADR 0001: single Next.js application](docs/decisions/0001-single-nextjs-app.md)
- [ADR 0002: recipe book storage and accounts](docs/decisions/0002-recipe-book-storage.md)

## Deployment

Deploy as a Node.js Next.js application on a host with a **persistent disk** for DATA_DIR and **HTTPS** (session cookies are Secure in production). Serverless platforms with ephemeral filesystems will lose recipe-book data; see ADR 0002. Set **OPENAI_API_KEY** and optionally **OPENAI_MODEL** in the host's secret manager. Do not add the key to a **NEXT_PUBLIC_** variable. For multi-instance production deployments, replace the in-memory rate limiter with a shared store at the hosting edge or in a managed key-value service.

Generated recipes are suggestions, not verified food-safety or allergy guidance. Check ingredient labels, allergens, cross-contamination risks, and safe cooking temperatures before preparing a dish.
