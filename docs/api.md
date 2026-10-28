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
          "warnings": []
        }
      ]
    }

The server returns three to five validated recipes. Generation mode is mock or ai; the UI uses it to label local sample results clearly.

Errors use one response shape:

    {
      "error": {
        "code": "INVALID_INPUT",
        "message": "Check your ingredients and preferences.",
        "requestId": "server-generated-id"
      }
    }

Status codes: 400 invalid JSON or fields, 413 body too large, 429 request limit reached, 502 provider failure or invalid model output, 504 provider timeout, and 500 unexpected server error.
