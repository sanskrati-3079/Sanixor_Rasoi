import { z } from "zod";
import { normalizeIngredients } from "./normalize";

export const DietSchema = z.enum([
  "vegetarian",
  "vegan",
  "eggetarian",
  "non-vegetarian",
]);
export const SpiceLevelSchema = z.enum(["mild", "medium", "hot"]);
export const LanguageSchema = z.enum(["en", "hi", "hinglish"]);
export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export const DietaryTagSchema = z.enum([
  "vegetarian",
  "vegan",
  "eggetarian",
  "non-vegetarian",
]);

const IngredientListSchema = z
  .array(z.string().max(80))
  .min(1)
  .max(30)
  .transform((items, context) => {
    const ingredients = normalizeIngredients(items);

    if (ingredients.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Enter at least one ingredient.",
      });
    }

    if (ingredients.length > 30) {
      context.addIssue({
        code: "custom",
        message: "Enter no more than 30 ingredients.",
      });
    }

    if (
      ingredients.some((ingredient) =>
        /[\u0000-\u001f\u007f]/u.test(ingredient),
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Ingredient names cannot contain control characters.",
      });
    }

    return ingredients;
  });

export const RecipeRequestSchema = z
  .object({
    ingredients: IngredientListSchema,
    servings: z.number().int().min(1).max(12).default(2),
    diet: DietSchema.default("vegetarian"),
    spiceLevel: SpiceLevelSchema.default("medium"),
    maxMinutes: z.number().int().min(5).max(240).optional(),
    language: LanguageSchema.default("en"),
  })
  .strict();

const RecipeIngredientSchema = z
  .object({
    name: z.string().min(1).max(80),
    quantity: z.number().positive().max(10000),
    unit: z.string().min(1).max(32),
    isUserProvided: z.boolean(),
    note: z.string().max(160),
  })
  .strict();

const InstructionSchema = z
  .object({
    step: z.number().int().min(1).max(30),
    text: z.string().min(1).max(500),
    durationMinutes: z.number().int().min(0).max(180),
  })
  .strict();

export const NutritionSchema = z
  .object({
    calories: z.number().int().min(0).max(3000),
    proteinG: z.number().min(0).max(300),
    carbsG: z.number().min(0).max(500),
    fatG: z.number().min(0).max(300),
  })
  .strict();

export const SubstitutionSchema = z
  .object({
    originalIngredient: z.string().min(1).max(80),
    alternative: z.string().min(1).max(80),
    note: z.string().min(1).max(240),
  })
  .strict();

export const RecipeCandidateSchema = z
  .object({
    title: z.string().min(2).max(100),
    description: z.string().min(8).max(240),
    cuisine: z.string().min(2).max(60),
    servings: z.number().int().min(1).max(12),
    prepTimeMinutes: z.number().int().min(0).max(360),
    cookTimeMinutes: z.number().int().min(0).max(360),
    totalTimeMinutes: z.number().int().min(1).max(720),
    dietaryTags: z.array(DietaryTagSchema).max(4),
    ingredients: z.array(RecipeIngredientSchema).min(1).max(30),
    instructions: z.array(InstructionSchema).min(2).max(20),
    substitutions: z.array(SubstitutionSchema).max(10),
    warnings: z.array(z.string().min(1).max(240)).max(8),
    difficulty: DifficultySchema,
    equipment: z.array(z.string().min(1).max(60)).max(10),
    tips: z.array(z.string().min(1).max(240)).max(6),
    servingSuggestion: z.string().max(240),
    nutritionPerServing: NutritionSchema,
  })
  .strict();

export const RecipeCandidatesSchema = z
  .object({
    recipes: z.array(RecipeCandidateSchema).min(3).max(5),
  })
  .strict();

export const RecipeSchema = RecipeCandidateSchema.extend({
  id: z.string().min(1).max(100),
});

export const RecipeApiResponseSchema = z
  .object({
    requestId: z.string().min(1),
    generationMode: z.enum(["mock", "ai"]),
    recipes: z.array(RecipeSchema).min(3).max(5),
  })
  .strict();

export const RecipeApiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        requestId: z.string(),
      })
      .strict(),
  })
  .strict();

export type RecipeRequest = z.infer<typeof RecipeRequestSchema>;
export type RecipeCandidate = z.infer<typeof RecipeCandidateSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeApiResponse = z.infer<typeof RecipeApiResponseSchema>;
export type Diet = z.infer<typeof DietSchema>;
export type SpiceLevel = z.infer<typeof SpiceLevelSchema>;
export type RecipeLanguage = z.infer<typeof LanguageSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Nutrition = z.infer<typeof NutritionSchema>;

export const RECIPE_OUTPUT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recipes"],
  properties: {
    recipes: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "description",
          "cuisine",
          "servings",
          "prepTimeMinutes",
          "cookTimeMinutes",
          "totalTimeMinutes",
          "dietaryTags",
          "ingredients",
          "instructions",
          "substitutions",
          "warnings",
          "difficulty",
          "equipment",
          "tips",
          "servingSuggestion",
          "nutritionPerServing",
        ],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          cuisine: { type: "string" },
          servings: { type: "integer" },
          prepTimeMinutes: { type: "integer" },
          cookTimeMinutes: { type: "integer" },
          totalTimeMinutes: { type: "integer" },
          dietaryTags: {
            type: "array",
            items: {
              type: "string",
              enum: ["vegetarian", "vegan", "eggetarian", "non-vegetarian"],
            },
          },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "quantity", "unit", "isUserProvided", "note"],
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                isUserProvided: { type: "boolean" },
                note: { type: "string" },
              },
            },
          },
          instructions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["step", "text", "durationMinutes"],
              properties: {
                step: { type: "integer" },
                text: { type: "string" },
                durationMinutes: { type: "integer" },
              },
            },
          },
          substitutions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["originalIngredient", "alternative", "note"],
              properties: {
                originalIngredient: { type: "string" },
                alternative: { type: "string" },
                note: { type: "string" },
              },
            },
          },
          warnings: {
            type: "array",
            items: { type: "string" },
          },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          equipment: { type: "array", items: { type: "string" } },
          tips: { type: "array", items: { type: "string" } },
          servingSuggestion: { type: "string" },
          nutritionPerServing: {
            type: "object",
            additionalProperties: false,
            required: ["calories", "proteinG", "carbsG", "fatG"],
            properties: {
              calories: { type: "integer" },
              proteinG: { type: "number" },
              carbsG: { type: "number" },
              fatG: { type: "number" },
            },
          },
        },
      },
    },
  },
} as const;
