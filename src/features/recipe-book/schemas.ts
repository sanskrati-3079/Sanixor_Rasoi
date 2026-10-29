import { z } from "zod";
import {
  DietSchema,
  DifficultySchema,
  LanguageSchema,
  NutritionSchema,
  SpiceLevelSchema,
  SubstitutionSchema,
} from "../recipes/schemas";
import { parseYouTubeId } from "./youtube";

/** Trimmed text with friendly messages, e.g. text(2, 100, "the title", "Title"). */
const text = (min: number, max: number, noun: string, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Add ${noun}.`)
    .min(min, `${label} needs at least ${min} characters.`)
    .max(max, `Keep ${noun} under ${max} characters.`);

export const BookIngredientSchema = z
  .object({
    name: text(1, 80, "an ingredient name", "Ingredient name"),
    /** null means "to taste" / unmeasured. */
    quantity: z
      .number()
      .positive("Quantity must be above 0.")
      .max(10000)
      .nullable(),
    unit: z.string().trim().max(32),
    note: z.string().trim().max(160),
  })
  .strict();

export const BookStepSchema = z
  .object({
    text: text(1, 500, "the step", "Step"),
    durationMinutes: z.number().int().min(0).max(180),
  })
  .strict();

export const VideoInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }).strict(),
  z
    .object({
      kind: z.literal("youtube"),
      url: z
        .string()
        .trim()
        .max(300)
        .refine((value) => parseYouTubeId(value) !== null, {
          message: "Paste a YouTube video link (youtube.com or youtu.be).",
        }),
    })
    .strict(),
  z.object({ kind: z.literal("upload"), uploadId: z.uuid() }).strict(),
]);

export const BookRecipeInputSchema = z
  .object({
    title: text(2, 100, "a recipe name", "Recipe name"),
    description: text(8, 400, "a short description", "Description"),
    cuisine: text(2, 60, "the cuisine or region", "Cuisine"),
    language: LanguageSchema,
    servings: z.number().int().min(1).max(12),
    prepTimeMinutes: z.number().int().min(0).max(360),
    cookTimeMinutes: z.number().int().min(0).max(360),
    difficulty: DifficultySchema,
    diet: DietSchema,
    spiceLevel: SpiceLevelSchema,
    ingredients: z
      .array(BookIngredientSchema)
      .min(1, "Add at least one ingredient.")
      .max(40),
    instructions: z
      .array(BookStepSchema)
      .min(1, "Add at least one step.")
      .max(30),
    equipment: z.array(z.string().trim().min(1).max(60)).max(12),
    tips: z.array(z.string().trim().min(1).max(240)).max(8),
    servingSuggestion: z.string().trim().max(240),
    nutritionPerServing: NutritionSchema.nullable(),
    substitutions: z.array(SubstitutionSchema).max(10),
    warnings: z.array(z.string().trim().min(1).max(240)).max(8),
    video: VideoInputSchema,
    photoUploadId: z.uuid().nullable(),
    source: z.enum(["user", "ai"]),
  })
  .strict()
  .refine((recipe) => recipe.prepTimeMinutes + recipe.cookTimeMinutes > 0, {
    message: "Add a preparation or cooking time.",
    path: ["cookTimeMinutes"],
  });

export type BookRecipeInput = z.infer<typeof BookRecipeInputSchema>;
export type BookIngredient = z.infer<typeof BookIngredientSchema>;

export type RecipeSource = "user" | "ai" | "kitchen";

export type BookVideo =
  | { kind: "none" }
  | { kind: "youtube"; youtubeId: string }
  | { kind: "upload"; uploadId: string; src: string };

/** A recipe as returned to the browser. */
export type BookRecipe = Omit<
  BookRecipeInput,
  "video" | "photoUploadId" | "source"
> & {
  id: string;
  source: RecipeSource;
  author: string | null;
  createdAt: number;
  totalTimeMinutes: number;
  video: BookVideo;
  photo: { uploadId: string; src: string } | null;
  canEdit: boolean;
};

export type BookRecipeSummary = Pick<
  BookRecipe,
  | "id"
  | "title"
  | "description"
  | "cuisine"
  | "diet"
  | "difficulty"
  | "language"
  | "totalTimeMinutes"
  | "source"
  | "author"
  | "photo"
  | "createdAt"
> & { hasVideo: boolean };

export const UPLOAD_LIMITS = {
  image: 5 * 1024 * 1024,
  video: 100 * 1024 * 1024,
} as const;

export const CredentialsSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(
        /^[a-zA-Z0-9_]{3,24}$/u,
        "Use 3–24 letters, numbers or underscores.",
      ),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Keep the password under 128 characters."),
  })
  .strict();
