# Sanixor Rasoi

An AI-first Indian cooking assistant that turns pantry ingredients into practical recipe ideas. The first milestone is intentionally stateless: no account, database, or saved history is required.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

1. Install dependencies with **npm install**.
2. Copy **.env.example** to **.env.local**.
3. Leave **OPENAI_API_KEY** empty to use the local deterministic mock, or add a server-side OpenAI API key.
4. Start the development server with **npm run dev**.
5. Open http://localhost:3000.

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
      components/          Shared interface components
      features/recipes/    Recipe form, cards, details, schemas, and generation
      lib/                 HTTP errors, request limits, and safe logging
    docs/
      decisions/           Short architecture decisions
      api.md               Recipe endpoint contract
      architecture.md      Runtime boundaries and request flow
      performance.md       Latency goals and measurement approach
      security.md          Privacy and deployment controls

The recipe feature owns recipe-specific UI and business logic. The API route only coordinates parsing, limits, generation, and response formatting. Provider code stays in a server-only module.

## Recipe generation

With no API key, the app uses a deterministic mock and labels results as sample suggestions. With **OPENAI_API_KEY** configured, the server calls the OpenAI Responses API using a strict JSON schema. **OPENAI_MODEL** can select another compatible model. The browser never receives provider credentials.

The model path makes one request under normal conditions and permits one repair request only if the provider returns malformed or schema-invalid output. The output is validated again with Zod before it reaches the browser.

## Documentation

- [Architecture](docs/architecture.md)
- [API contract](docs/api.md)
- [Security and privacy](docs/security.md)
- [Performance and latency](docs/performance.md)
- [ADR 0001: single Next.js application](docs/decisions/0001-single-nextjs-app.md)

## Deployment

Deploy as a Node.js Next.js application. Set **OPENAI_API_KEY** and optionally **OPENAI_MODEL** in the host's secret manager. Do not add the key to a **NEXT_PUBLIC_** variable. For multi-instance production deployments, replace the in-memory rate limiter with a shared store at the hosting edge or in a managed key-value service.

Generated recipes are suggestions, not verified food-safety or allergy guidance. Check ingredient labels, allergens, cross-contamination risks, and safe cooking temperatures before preparing a dish.
