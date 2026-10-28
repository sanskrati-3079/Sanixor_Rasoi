# Security and privacy

- Provider keys are read only from server environment variables and are never passed to client components.
- The app sets basic browser security headers to prevent MIME sniffing and framing, restrict browser permissions, and limit referrer detail.
- Request bodies, ingredient counts, ingredient lengths, and model outputs are bounded and schema-validated.
- Ingredient names are passed as data in a fixed prompt. The model is not given tools, browsing, or code execution.
- Logs contain a generated request ID, provider mode, duration, and coarse outcome. They do not contain ingredients, prompts, credentials, or provider response bodies.
- The app does not collect accounts, location, or persistent cooking history.
- The local in-memory request limiter is useful for a single process and local development. It is not a distributed production limiter; use a shared edge or key-value limiter before running multiple instances.
- Basic diet checks match common ingredient names and cannot prove a dish is suitable; recipe output can still contain inaccurate instructions or omit an allergen. Users should check ingredient labels and safe cooking requirements.

Before a public launch, add a privacy notice, configure platform-level request limits, set provider spend controls, and review the deployed headers and logs.
