# Security and privacy

- Provider keys are read only from server environment variables and are never passed to client components.
- The app sets basic browser security headers to prevent MIME sniffing and framing, restrict browser permissions, and limit referrer detail.
- Request bodies, ingredient counts, ingredient lengths, and model outputs are bounded and schema-validated.
- Ingredient names are passed as data in a fixed prompt. The model is not given tools, browsing, or code execution.
- Logs contain a generated request ID, provider mode, duration, and coarse outcome. They do not contain ingredients, prompts, credentials, or provider response bodies.
- The local in-memory request limiter is useful for a single process and local development. It is not a distributed production limiter; use a shared edge or key-value limiter before running multiple instances.
- Basic diet checks match common ingredient names and cannot prove a dish is suitable; recipe output can still contain inaccurate instructions or omit an allergen. Users should check ingredient labels and safe cooking requirements.

## Recipe book, accounts and uploads

- **Accounts:** usernames and passwords only — no email or personal data. Passwords are hashed with scrypt and a per-user salt; sign-in compares hashes in constant time and runs a dummy hash for unknown usernames so timing doesn't reveal which accounts exist.
- **Sessions:** a random 256-bit token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production, so production must be served over HTTPS). Only the SHA-256 of the token is stored; sign-out deletes it. Sessions last 30 days.
- **CSRF:** every state-changing route also checks that the `Origin` header matches the host.
- **Authorisation:** recipes can be edited or deleted only by their author or by usernames listed in `ADMIN_USERNAMES` (moderators). Uploads can only be attached by the user who uploaded them.
- **Uploads:** file type is decided from magic bytes; size limits are enforced; files are stored under random UUIDs outside `public/` and served with `nosniff`, a sandboxing CSP and `Content-Disposition: inline`. Upload ids are validated as UUIDs before touching the disk.
- **Videos from YouTube** are embedded through `youtube-nocookie.com` with a strict referrer policy; only YouTube URLs are accepted.
- **Abuse limits:** sign-in/sign-up 10 per IP per 15 min, recipe writes 40 per user per hour, uploads 20 per user per hour (in-memory, single process).
- **Content is user-generated.** There is no automated moderation; admins delete problem recipes. Allergen hints are keyword-based and the UI says they can be missed.
- **Data location:** SQLite database and uploads live in `DATA_DIR` (default `./data`, git-ignored). Back it up; it contains password hashes.

Not yet built: password reset, account deletion, a report button, and orphan-upload cleanup (files uploaded but never attached to a recipe stay on disk).

Before a public launch, add a privacy notice, configure platform-level request limits, set provider spend controls, and review the deployed headers and logs.
