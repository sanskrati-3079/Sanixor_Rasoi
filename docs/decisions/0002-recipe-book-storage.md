# ADR 0002: SQLite and session auth for the recipe book

Status: accepted

## Context

The recipe book is shared: everyone sees every recipe, people add their own with photos or videos, and only authors can change their recipes. That needs persistent storage, file storage and accounts. The app had no database and runs as one Next.js process.

## Decision

- Store recipes, users, sessions and upload metadata in **SQLite** through Node's built-in `node:sqlite` driver (no native package to install). The file lives in `DATA_DIR` (default `./data`).
- Store uploaded files on local disk next to the database, under random UUID names, and serve them through a route handler.
- Use **username + password accounts** with scrypt hashes and server-side sessions in an HttpOnly cookie, rather than an auth provider that would need OAuth keys to run locally.
- Keep recipe JSON in one column with a few indexed columns (title, cuisine, diet, time) for listing and search.

## Consequences

- Runs locally with no extra services; requires Node 22.13+ (`node:sqlite` prints an "experimental" warning on start).
- Suitable for a single server with a persistent disk. Serverless hosts with read-only or ephemeral filesystems will lose data — use a VM/container with a volume, or move to Postgres and object storage (S3/R2) behind the same repository and upload functions.
- Rate limits are in memory, so they reset on restart and don't span instances.
- There is no password reset or email; adding email later means a migration on `users`.
