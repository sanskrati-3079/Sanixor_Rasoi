import "server-only";
import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/lib/auth";
import { getDb, onDatabaseInit } from "@/lib/db";
import type { Diet } from "../recipes/schemas";
import type {
  BookRecipe,
  BookRecipeInput,
  BookRecipeSummary,
  BookVideo,
  RecipeSource,
} from "./schemas";
import { kitchenRecipes } from "./seed";
import { deleteUploads, getUpload, uploadSrc } from "./uploads";
import { parseYouTubeId } from "./youtube";

/** Stored JSON: the validated input minus fields kept in columns. */
type StoredData = Omit<BookRecipeInput, "source">;

type RecipeRow = {
  id: string;
  author_id: string | null;
  author: string | null;
  source: RecipeSource;
  total_minutes: number;
  data: string;
  created_at: number;
};

export class RecipeAccessError extends Error {
  constructor(
    readonly status: 400 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = "RecipeAccessError";
  }
}

onDatabaseInit((db) => {
  const seeded = db
    .prepare("SELECT COUNT(*) AS count FROM recipes WHERE source = 'kitchen'")
    .get() as { count: number };
  if (seeded.count > 0) return;

  const insert = db.prepare(
    `INSERT INTO recipes (id, author_id, source, title, cuisine, diet, total_minutes, data, created_at, updated_at)
     VALUES (?, NULL, 'kitchen', ?, ?, ?, ?, ?, ?, ?)`,
  );
  const now = Date.now();
  kitchenRecipes.forEach((recipe, index) => {
    const createdAt = now - index * 60_000;
    insert.run(
      randomUUID(),
      recipe.title,
      recipe.cuisine,
      recipe.diet,
      recipe.prepTimeMinutes + recipe.cookTimeMinutes,
      JSON.stringify(recipe),
      createdAt,
      createdAt,
    );
  });
});

function canEdit(row: Pick<RecipeRow, "author_id">, user: SessionUser | null) {
  return Boolean(user && (user.isAdmin || row.author_id === user.id));
}

function toVideo(video: StoredData["video"]): BookVideo {
  if (video.kind === "youtube") {
    const youtubeId = parseYouTubeId(video.url);
    return youtubeId ? { kind: "youtube", youtubeId } : { kind: "none" };
  }
  if (video.kind === "upload") {
    return {
      kind: "upload",
      uploadId: video.uploadId,
      src: uploadSrc(video.uploadId),
    };
  }
  return { kind: "none" };
}

function toRecipe(row: RecipeRow, user: SessionUser | null): BookRecipe {
  const data = JSON.parse(row.data) as StoredData;
  const { video, photoUploadId, ...rest } = data;
  return {
    ...rest,
    id: row.id,
    source: row.source,
    author: row.author,
    createdAt: row.created_at,
    totalTimeMinutes: row.total_minutes,
    video: toVideo(video),
    photo: photoUploadId
      ? { uploadId: photoUploadId, src: uploadSrc(photoUploadId) }
      : null,
    canEdit: canEdit(row, user),
  };
}

const SELECT = `SELECT recipes.id, recipes.author_id, users.username AS author,
  recipes.source, recipes.total_minutes, recipes.data, recipes.created_at
  FROM recipes LEFT JOIN users ON users.id = recipes.author_id`;

export function listRecipes(options: {
  query?: string;
  diet?: Diet;
  authorId?: string;
  limit?: number;
}): BookRecipeSummary[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (options.query) {
    where.push(
      "(recipes.title LIKE ? ESCAPE '\\' OR recipes.cuisine LIKE ? ESCAPE '\\' OR recipes.data LIKE ? ESCAPE '\\')",
    );
    const like = "%" + options.query.replace(/[\\%_]/gu, "\\$&") + "%";
    params.push(like, like, like);
  }
  if (options.diet) {
    where.push("recipes.diet = ?");
    params.push(options.diet);
  }
  if (options.authorId) {
    where.push("recipes.author_id = ?");
    params.push(options.authorId);
  }
  params.push(Math.min(options.limit ?? 60, 200));

  const rows = getDb()
    .prepare(
      SELECT +
        (where.length ? " WHERE " + where.join(" AND ") : "") +
        " ORDER BY recipes.created_at DESC LIMIT ?",
    )
    .all(...params) as RecipeRow[];

  return rows.map((row) => {
    const recipe = toRecipe(row, null);
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      diet: recipe.diet,
      difficulty: recipe.difficulty,
      language: recipe.language,
      totalTimeMinutes: recipe.totalTimeMinutes,
      source: recipe.source,
      author: recipe.author,
      photo: recipe.photo,
      createdAt: recipe.createdAt,
      hasVideo: recipe.video.kind !== "none",
    };
  });
}

function getRow(id: string): RecipeRow | null {
  return (
    (getDb()
      .prepare(SELECT + " WHERE recipes.id = ?")
      .get(id) as RecipeRow | undefined) ?? null
  );
}

export function getRecipe(
  id: string,
  user: SessionUser | null,
): BookRecipe | null {
  const row = getRow(id);
  return row ? toRecipe(row, user) : null;
}

/** Uploads referenced by a recipe must exist, belong to the user and match kind. */
function assertOwnUploads(
  input: BookRecipeInput,
  user: SessionUser,
  previous?: StoredData,
) {
  const checks: [string | null, "image" | "video"][] = [
    [input.photoUploadId, "image"],
    [input.video.kind === "upload" ? input.video.uploadId : null, "video"],
  ];
  for (const [id, kind] of checks) {
    if (!id) continue;
    const alreadyAttached =
      previous &&
      (previous.photoUploadId === id ||
        (previous.video.kind === "upload" && previous.video.uploadId === id));
    const upload = getUpload(id);
    if (
      !upload ||
      upload.kind !== kind ||
      (!alreadyAttached && upload.owner_id !== user.id)
    ) {
      throw new RecipeAccessError(
        400,
        "An attached file could not be found. Please upload it again.",
      );
    }
  }
}

function attachedUploads(data: StoredData): string[] {
  return [
    data.photoUploadId,
    data.video.kind === "upload" ? data.video.uploadId : null,
  ].filter((id): id is string => Boolean(id));
}

export function createRecipe(
  input: BookRecipeInput,
  user: SessionUser,
): BookRecipe {
  assertOwnUploads(input, user);
  const { source, ...data } = input;
  const id = randomUUID();
  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO recipes (id, author_id, source, title, cuisine, diet, total_minutes, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      user.id,
      source,
      data.title,
      data.cuisine,
      data.diet,
      data.prepTimeMinutes + data.cookTimeMinutes,
      JSON.stringify(data),
      now,
      now,
    );
  return getRecipe(id, user)!;
}

export async function updateRecipe(
  id: string,
  input: BookRecipeInput,
  user: SessionUser,
): Promise<BookRecipe> {
  const row = getRow(id);
  if (!row) throw new RecipeAccessError(404, "This recipe no longer exists.");
  if (!canEdit(row, user)) {
    throw new RecipeAccessError(403, "You can only edit your own recipes.");
  }
  const previous = JSON.parse(row.data) as StoredData;
  assertOwnUploads(input, user, previous);

  const { source: _source, ...data } = input;
  void _source;
  getDb()
    .prepare(
      `UPDATE recipes SET title = ?, cuisine = ?, diet = ?, total_minutes = ?, data = ?, updated_at = ? WHERE id = ?`,
    )
    .run(
      data.title,
      data.cuisine,
      data.diet,
      data.prepTimeMinutes + data.cookTimeMinutes,
      JSON.stringify(data),
      Date.now(),
      id,
    );

  const kept = new Set(attachedUploads(data));
  await deleteUploads(
    attachedUploads(previous).filter((upload) => !kept.has(upload)),
  );
  return getRecipe(id, user)!;
}

export async function deleteRecipe(
  id: string,
  user: SessionUser,
): Promise<void> {
  const row = getRow(id);
  if (!row) throw new RecipeAccessError(404, "This recipe no longer exists.");
  if (!canEdit(row, user)) {
    throw new RecipeAccessError(403, "You can only delete your own recipes.");
  }
  getDb().prepare("DELETE FROM recipes WHERE id = ?").run(id);
  await deleteUploads(attachedUploads(JSON.parse(row.data) as StoredData));
}
