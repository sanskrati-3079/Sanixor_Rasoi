# ADR 0001: Use one Next.js application

Status: accepted

## Context

The MVP needs a responsive web interface and a small server endpoint for model requests. The repository had no existing framework or deployed services.

## Decision

Use Next.js App Router with TypeScript, Tailwind CSS, Zod, and a server-only provider adapter. Keep recipe logic modular inside the application. Use a deterministic mock when a provider key is absent.

## Consequences

- The UI and API share one deployable project and one recipe contract.
- Provider credentials stay on the server.
- There is no database or separate Python service to operate.
- In-memory rate limiting is limited to one process; deployment with multiple instances requires a shared limiter.
