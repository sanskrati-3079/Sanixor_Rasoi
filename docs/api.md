# Recipe API

## POST /api/recipes

Request JSON:

    {
      "ingredients": ["potato", "onion", "tomato"],
      "servings": 2,
      "diet": "vegetarian",
      "spiceLevel": "medium",
      "maxMinutes": 30,
      "language": "en"
    }

Ingredients are required and accept 1–30 entries. Ingredient names are trimmed, split on commas, case-normalized for duplicate removal, and bounded to 80 characters. Servings is an integer from 1–12 and defaults to 2. Diet defaults to vegetarian and accepts vegetarian, vegan, eggetarian, or non-vegetarian. Spice level defaults to medium. Maximum time is optional and ranges from 5–240 minutes. Language defaults to English and accepts en, hi, or hinglish.

The request body is capped at 12 KB. A process-local limiter allows 12 requests per client key in a 15-minute window and returns a Retry-After header when the limit is reached. The client key comes from the deployment proxy's forwarded IP headers; configure a shared limiter and trusted proxy headers for multi-instance production.

Success response:

    {
      "requestId": "server-generated-id",
      "generationMode": "mock",
      "recipes": [
        {
          "id": "recipe-id",
          "title": "A practical Indian recipe",
          "description": "A short description.",
          "cuisine": "North Indian",
          "servings": 2,
          "prepTimeMinutes": 10,
          "cookTimeMinutes": 20,
          "totalTimeMinutes": 30,
          "dietaryTags": ["vegetarian"],
          "ingredients": [
            {
              "name": "potato",
              "quantity": 2,
              "unit": "medium",
              "isUserProvided": true,
              "note": ""
            }
          ],
          "instructions": [
            {
              "step": 1,
              "text": "Wash and prepare the potatoes.",
              "durationMinutes": 5
            }
          ],
          "substitutions": [],
          "warnings": [],
          "difficulty": "easy",
          "equipment": ["Kadhai", "Wooden spatula"],
          "tips": ["Let the cumin sizzle before adding vegetables."],
          "servingSuggestion": "Serve hot with roti.",
          "nutritionPerServing": { "calories": 240, "proteinG": 5, "carbsG": 28, "fatG": 11 }
        }
      ]
    }

The server returns three to five validated recipes. Nutrition values are model estimates and the UI labels them as approximate. Allergens are not part of this response; the UI detects common allergens from ingredient names (`src/features/recipes/allergens.ts`). Generation mode is mock or ai; the UI uses it to label local sample results clearly.

Errors use one response shape:

    {
      "error": {
        "code": "INVALID_INPUT",
        "message": "Check your ingredients and preferences.",
        "requestId": "server-generated-id"
      }
    }

Status codes: 400 invalid JSON or fields, 413 body too large, 429 request limit reached, 502 provider failure or invalid model output, 504 provider timeout, and 500 unexpected server error.

# Recipe book API

All state-changing requests need a signed-in session cookie and are rejected with 403 when the `Origin` header doesn't match the host (CSRF defence on top of `SameSite=Lax` cookies). Errors use `{ "error": { "code", "message" } }`; validation errors add `issues: [{ "path", "message" }]`.

## Accounts

| Method & path | Body | Result |
|---|---|---|
| `POST /api/auth/signup` | `{ "username", "password" }` | 201 and a session cookie. Username: 3–24 letters, numbers or `_` (case-insensitive unique). Password: 8–128 characters. 409 `USERNAME_TAKEN`. |
| `POST /api/auth/login` | `{ "username", "password" }` | 200 and a session cookie, or 401 `INVALID_CREDENTIALS` (same response for unknown users and wrong passwords). |
| `POST /api/auth/logout` | — | 200; the session is deleted server-side. |

Sign-up and sign-in share a limiter of 10 requests per IP per 15 minutes.

## Recipes

| Method & path | Who | Notes |
|---|---|---|
| `GET /api/book/recipes?q=&diet=` | anyone | Up to 60 summaries, newest first. `q` searches title, cuisine and recipe text. |
| `POST /api/book/recipes` | signed in | Body is `BookRecipeInput` (`src/features/recipe-book/schemas.ts`), max 64 KB. 201 `{ recipe }`. |
| `GET /api/book/recipes/:id` | anyone | `{ recipe }` including `canEdit` for the current user. |
| `PUT /api/book/recipes/:id` | owner or admin | Same body as POST. Files no longer attached are deleted. |
| `DELETE /api/book/recipes/:id` | owner or admin | Deletes the recipe and its attached files. |

Writes are limited to 40 per user per hour. `BookRecipeInput.video` is one of `{ "kind": "none" }`, `{ "kind": "youtube", "url" }` (youtube.com / youtu.be only) or `{ "kind": "upload", "uploadId" }`. Attached uploads must belong to the user.

## Uploads

`POST /api/book/uploads` (signed in, multipart): fields `kind` (`image` or `video`) and `file`. The type is detected from the file's first bytes, not its name or MIME type: JPEG, PNG or WebP photos up to 5 MB; MP4, MOV or WebM videos up to 100 MB. 20 uploads per user per hour. Returns 201 `{ upload: { id, kind, src } }`.

`GET /api/book/uploads/:id` serves the file with `Range` support (206) so videos can seek, plus `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; sandbox` and a long immutable cache.
