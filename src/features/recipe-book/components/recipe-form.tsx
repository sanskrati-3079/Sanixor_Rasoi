"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DietMark, dietLabels } from "@/components/ui/diet-badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ChilliRow } from "@/components/ui/spice-meter";
import { Stepper } from "@/components/ui/stepper";
import { difficultyLabels, languageOptions } from "../../recipes/display";
import type {
  Diet,
  Difficulty,
  RecipeLanguage,
  SpiceLevel,
} from "../../recipes/schemas";
import {
  BookRecipeInputSchema,
  type BookRecipe,
  type BookRecipeInput,
} from "../schemas";
import { parseYouTubeId, youTubeEmbedUrl } from "../youtube";
import { FileUploadField, type UploadedFile } from "./file-upload-field";

type IngredientRow = {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
};
type StepRow = { key: string; text: string; minutes: string };

type FormState = {
  title: string;
  description: string;
  cuisine: string;
  language: RecipeLanguage;
  servings: number;
  prep: string;
  cook: string;
  difficulty: Difficulty;
  diet: Diet;
  spiceLevel: SpiceLevel;
  ingredients: IngredientRow[];
  steps: StepRow[];
  equipment: string;
  tips: string;
  servingSuggestion: string;
  nutrition: {
    calories: string;
    proteinG: string;
    carbsG: string;
    fatG: string;
  };
  videoKind: "none" | "youtube" | "upload";
  youtubeUrl: string;
  videoUpload: UploadedFile | null;
  photo: UploadedFile | null;
};

const newKey = () => Math.random().toString(36).slice(2);
const emptyIngredient = (): IngredientRow => ({
  key: newKey(),
  name: "",
  quantity: "",
  unit: "",
  note: "",
});
const emptyStep = (): StepRow => ({ key: newKey(), text: "", minutes: "" });
const str = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

function initialState(recipe?: BookRecipe): FormState {
  if (!recipe) {
    return {
      title: "",
      description: "",
      cuisine: "",
      language: "en",
      servings: 2,
      prep: "",
      cook: "",
      difficulty: "easy",
      diet: "vegetarian",
      spiceLevel: "medium",
      ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
      steps: [emptyStep(), emptyStep()],
      equipment: "",
      tips: "",
      servingSuggestion: "",
      nutrition: { calories: "", proteinG: "", carbsG: "", fatG: "" },
      videoKind: "none",
      youtubeUrl: "",
      videoUpload: null,
      photo: null,
    };
  }
  const n = recipe.nutritionPerServing;
  return {
    title: recipe.title,
    description: recipe.description,
    cuisine: recipe.cuisine,
    language: recipe.language,
    servings: recipe.servings,
    prep: str(recipe.prepTimeMinutes),
    cook: str(recipe.cookTimeMinutes),
    difficulty: recipe.difficulty,
    diet: recipe.diet,
    spiceLevel: recipe.spiceLevel,
    ingredients: recipe.ingredients.map((item) => ({
      key: newKey(),
      name: item.name,
      quantity: str(item.quantity),
      unit: item.unit,
      note: item.note,
    })),
    steps: recipe.instructions.map((step) => ({
      key: newKey(),
      text: step.text,
      minutes: step.durationMinutes ? String(step.durationMinutes) : "",
    })),
    equipment: recipe.equipment.join(", "),
    tips: recipe.tips.join("\n"),
    servingSuggestion: recipe.servingSuggestion,
    nutrition: {
      calories: str(n?.calories),
      proteinG: str(n?.proteinG),
      carbsG: str(n?.carbsG),
      fatG: str(n?.fatG),
    },
    videoKind: recipe.video.kind,
    youtubeUrl:
      recipe.video.kind === "youtube"
        ? "https://youtu.be/" + recipe.video.youtubeId
        : "",
    videoUpload:
      recipe.video.kind === "upload"
        ? { id: recipe.video.uploadId, src: recipe.video.src }
        : null,
    photo: recipe.photo
      ? { id: recipe.photo.uploadId, src: recipe.photo.src }
      : null,
  };
}

const toNumber = (value: string) => (value.trim() === "" ? NaN : Number(value));
const lines = (value: string, separator: RegExp) =>
  value
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);

function toInput(state: FormState, source: "user" | "ai"): BookRecipeInput {
  const n = state.nutrition;
  const hasNutrition = Object.values(n).some((value) => value.trim() !== "");
  return {
    title: state.title,
    description: state.description,
    cuisine: state.cuisine,
    language: state.language,
    servings: state.servings,
    prepTimeMinutes: state.prep.trim() ? toNumber(state.prep) : 0,
    cookTimeMinutes: state.cook.trim() ? toNumber(state.cook) : 0,
    difficulty: state.difficulty,
    diet: state.diet,
    spiceLevel: state.spiceLevel,
    ingredients: state.ingredients
      .filter(
        (row) => row.name.trim() || row.quantity.trim() || row.unit.trim(),
      )
      .map((row) => ({
        name: row.name,
        quantity: row.quantity.trim() ? toNumber(row.quantity) : null,
        unit: row.unit,
        note: row.note,
      })),
    instructions: state.steps
      .filter((row) => row.text.trim())
      .map((row) => ({
        text: row.text,
        durationMinutes: row.minutes.trim() ? toNumber(row.minutes) : 0,
      })),
    equipment: lines(state.equipment, /,/u),
    tips: lines(state.tips, /\n/u),
    servingSuggestion: state.servingSuggestion,
    nutritionPerServing: hasNutrition
      ? {
          calories: toNumber(n.calories),
          proteinG: toNumber(n.proteinG),
          carbsG: toNumber(n.carbsG),
          fatG: toNumber(n.fatG),
        }
      : null,
    substitutions: [],
    warnings: [],
    video:
      state.videoKind === "youtube"
        ? { kind: "youtube", url: state.youtubeUrl }
        : state.videoKind === "upload" && state.videoUpload
          ? { kind: "upload", uploadId: state.videoUpload.id }
          : { kind: "none" },
    photoUploadId: state.photo?.id ?? null,
    source,
  };
}

type Issue = { path: string; message: string };

const fieldId = (path: string) => "f-" + path.replace(/\./gu, "-");

const inputClass = (invalid: boolean) =>
  clsx(
    "min-h-12 w-full rounded-field border-2 bg-surface px-3.5 text-base focus:border-accent-strong focus:outline-none",
    invalid ? "border-danger" : "border-line-strong",
  );

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-panel glass-strong p-5 sm:p-7">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {description && <p className="text-ink-muted mt-1">{description}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

export function RecipeForm({
  mode,
  recipe,
}: {
  mode: "create" | "edit";
  recipe?: BookRecipe;
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => initialState(recipe));
  const [issues, setIssues] = useState<Issue[]>([]);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const source = recipe?.source === "ai" ? "ai" : "user";

  const errorFor = (path: string) =>
    issues.find((issue) => issue.path === path)?.message;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  function updateRow<T extends { key: string }>(
    key: "ingredients" | "steps",
    rowKey: string,
    patch: Partial<T>,
  ) {
    setState((current) => ({
      ...current,
      [key]: (current[key] as unknown as T[]).map((row) =>
        row.key === rowKey ? { ...row, ...patch } : row,
      ),
    }));
  }

  function moveStep(index: number, delta: number) {
    setState((current) => {
      const steps = [...current.steps];
      const target = index + delta;
      if (target < 0 || target >= steps.length) return current;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...current, steps };
    });
  }

  /** Server/schema paths refer to filtered rows; map them back to row positions. */
  function mapIssuePaths(found: Issue[]): Issue[] {
    const ingredientRows = state.ingredients
      .map((row, index) => ({ row, index }))
      .filter(
        ({ row }) => row.name.trim() || row.quantity.trim() || row.unit.trim(),
      );
    const stepRows = state.steps
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.text.trim());
    return found.map((issue) => {
      const [head, position, ...rest] = issue.path.split(".");
      const rows =
        head === "ingredients"
          ? ingredientRows
          : head === "instructions"
            ? stepRows
            : null;
      if (rows && position !== undefined && rows[Number(position)]) {
        return {
          ...issue,
          path: [head, rows[Number(position)].index, ...rest].join("."),
        };
      }
      return issue;
    });
  }

  function showIssues(found: Issue[]) {
    setIssues(mapIssuePaths(found));
    window.requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    if (state.videoKind === "upload" && !state.videoUpload) {
      showIssues([
        {
          path: "video.uploadId",
          message: "Upload a video or choose “No video”.",
        },
      ]);
      return;
    }
    const input = toInput(state, source);
    const check = BookRecipeInputSchema.safeParse(input);
    if (!check.success) {
      showIssues(
        check.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
      return;
    }
    setIssues([]);
    setBusy(true);

    const response = await fetch(
      mode === "edit" ? "/api/book/recipes/" + recipe!.id : "/api/book/recipes",
      {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check.data),
      },
    ).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as {
      recipe?: { id: string };
      error?: { message?: string; issues?: Issue[] };
    } | null;

    if (response?.ok && payload?.recipe) {
      router.push("/book/" + payload.recipe.id);
      router.refresh();
      return;
    }
    setBusy(false);
    if (payload?.error?.issues) {
      showIssues(payload.error.issues);
    } else {
      setServerError(
        response?.status === 401
          ? "Your session has ended. Sign in again in a new tab, then save."
          : (payload?.error?.message ??
              "We couldn't save the recipe. Check your connection and try again."),
      );
      window.requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  const youtubeId =
    state.videoKind === "youtube" ? parseYouTubeId(state.youtubeUrl) : null;

  const text = (
    path: keyof FormState & string,
    label: string,
    options: {
      placeholder?: string;
      multiline?: boolean;
      hint?: string;
      maxLength?: number;
    } = {},
  ) => {
    const error = errorFor(path);
    const id = fieldId(path);
    const describedBy =
      clsx(options.hint && id + "-hint", error && id + "-error") || undefined;
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
          {label}
        </label>
        {options.multiline ? (
          <textarea
            id={id}
            value={state[path] as string}
            onChange={(event) => set(path, event.target.value as never)}
            rows={3}
            maxLength={options.maxLength}
            placeholder={options.placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={clsx(inputClass(Boolean(error)), "py-3")}
          />
        ) : (
          <input
            id={id}
            value={state[path] as string}
            onChange={(event) => set(path, event.target.value as never)}
            maxLength={options.maxLength}
            placeholder={options.placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={inputClass(Boolean(error))}
          />
        )}
        {options.hint && (
          <p id={id + "-hint"} className="text-ink-muted mt-1 text-sm">
            {options.hint}
          </p>
        )}
        {error && (
          <p
            id={id + "-error"}
            className="text-danger mt-1 text-sm font-medium"
          >
            {error}
          </p>
        )}
      </div>
    );
  };

  const minutes = (key: "prep" | "cook", label: string, path: string) => {
    const error = errorFor(path);
    return (
      <div>
        <label
          htmlFor={fieldId(path)}
          className="mb-1.5 block text-sm font-semibold"
        >
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={fieldId(path)}
            type="number"
            inputMode="numeric"
            min={0}
            max={360}
            value={state[key]}
            onChange={(event) => set(key, event.target.value)}
            aria-invalid={error ? true : undefined}
            className={clsx(inputClass(Boolean(error)), "max-w-28")}
          />
          <span className="text-ink-muted">min</span>
        </div>
        {error && (
          <p className="text-danger mt-1 text-sm font-medium">{error}</p>
        )}
      </div>
    );
  };

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 pt-10 pb-16 sm:px-6">
      <p className="text-accent-strong text-sm font-semibold tracking-[0.12em] uppercase">
        Recipe book
      </p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
        {mode === "edit" ? "Edit your recipe" : "Add your recipe"}
      </h1>
      <p className="text-ink-muted mt-2 text-lg">
        Share a dish you love. Everyone can see recipes in the book; only you
        can edit yours.
      </p>

      <div
        ref={summaryRef}
        tabIndex={-1}
        aria-live="polite"
        className={clsx(
          "focus:outline-none",
          (issues.length > 0 || serverError) &&
            "rounded-panel border-danger/30 bg-danger-soft mt-6 border p-5",
        )}
      >
        {serverError && (
          <p className="text-danger font-semibold">{serverError}</p>
        )}
        {issues.length > 0 && (
          <>
            <p className="text-danger font-semibold">
              Please fix {issues.length === 1 ? "this" : "these"} before saving:
            </p>
            <ul className="text-danger mt-2 list-disc space-y-1 pl-5">
              {issues.slice(0, 8).map((issue) => (
                <li key={issue.path + issue.message}>
                  <a
                    href={"#" + fieldId(issue.path)}
                    className="underline underline-offset-4"
                  >
                    {issue.message}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-6">
        <Section title="The basics">
          {text("title", "Recipe name", {
            placeholder: "e.g. Nani's rajma chawal",
            maxLength: 100,
          })}
          {text("description", "Short description", {
            multiline: true,
            maxLength: 400,
            hint: "What makes it special? One or two sentences.",
          })}
          {text("cuisine", "Cuisine or region", {
            placeholder: "e.g. Punjabi, South Indian, Street food",
            maxLength: 60,
          })}
          <SegmentedControl
            legend="Written in"
            name="language"
            value={state.language}
            onChange={(value) => set("language", value)}
            options={languageOptions.map((option) => ({
              value: option.value,
              label: option.label,
              lang: option.tag,
            }))}
          />
          <FileUploadField
            kind="image"
            label="Photo (optional)"
            fieldId={fieldId("photoUploadId")}
            value={state.photo}
            onChange={(value) => set("photo", value)}
            error={errorFor("photoUploadId")}
          />
        </Section>

        <Section title="Time, servings & diet">
          <div className="grid gap-5 sm:grid-cols-3">
            <Stepper
              label="Servings"
              value={state.servings}
              min={1}
              max={12}
              onChange={(value) => set("servings", value)}
            />
            {minutes("prep", "Prep time", "prepTimeMinutes")}
            {minutes("cook", "Cook time", "cookTimeMinutes")}
          </div>
          <SegmentedControl
            legend="Difficulty"
            name="difficulty"
            value={state.difficulty}
            onChange={(value) => set("difficulty", value)}
            options={(["easy", "medium", "hard"] as const).map((value) => ({
              value,
              label: difficultyLabels[value],
            }))}
          />
          <SegmentedControl
            legend="Diet"
            name="diet"
            value={state.diet}
            onChange={(value) => set("diet", value)}
            options={(
              ["vegetarian", "vegan", "eggetarian", "non-vegetarian"] as const
            ).map((value) => ({
              value,
              label: dietLabels[value],
              icon: (
                <span className="bg-surface grid size-6 place-items-center rounded-md">
                  <DietMark diet={value} />
                </span>
              ),
            }))}
          />
          <SegmentedControl
            legend="Spice level"
            name="spice"
            value={state.spiceLevel}
            onChange={(value) => set("spiceLevel", value)}
            options={(["mild", "medium", "hot"] as const).map((value) => ({
              value,
              label: value[0].toUpperCase() + value.slice(1),
              icon: (
                <span className="bg-surface inline-flex rounded-full px-1.5 py-0.5">
                  <ChilliRow level={value} />
                </span>
              ),
            }))}
          />
        </Section>

        <Section
          title="Ingredients"
          description="Leave the amount empty for “to taste”."
        >
          <ol className="grid gap-3">
            {state.ingredients.map((row, index) => {
              const base = "ingredients." + index;
              const nameError = errorFor(base + ".name");
              const qtyError = errorFor(base + ".quantity");
              return (
                <li
                  key={row.key}
                  className="rounded-field bg-canvas grid grid-cols-[5.5rem_6.5rem_minmax(0,1fr)] gap-2 p-3 sm:grid-cols-[5.5rem_6.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <input
                    id={fieldId(base + ".quantity")}
                    aria-label={"Ingredient " + (index + 1) + " amount"}
                    placeholder="Qty"
                    inputMode="decimal"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow<IngredientRow>("ingredients", row.key, {
                        quantity: event.target.value,
                      })
                    }
                    aria-invalid={qtyError ? true : undefined}
                    className={inputClass(Boolean(qtyError))}
                  />
                  <input
                    aria-label={"Ingredient " + (index + 1) + " unit"}
                    placeholder="Unit"
                    value={row.unit}
                    maxLength={32}
                    onChange={(event) =>
                      updateRow<IngredientRow>("ingredients", row.key, {
                        unit: event.target.value,
                      })
                    }
                    className={inputClass(false)}
                  />
                  <input
                    id={fieldId(base + ".name")}
                    aria-label={"Ingredient " + (index + 1) + " name"}
                    placeholder="Ingredient"
                    value={row.name}
                    maxLength={80}
                    onChange={(event) =>
                      updateRow<IngredientRow>("ingredients", row.key, {
                        name: event.target.value,
                      })
                    }
                    aria-invalid={nameError ? true : undefined}
                    className={inputClass(Boolean(nameError))}
                  />
                  <input
                    aria-label={"Ingredient " + (index + 1) + " note"}
                    placeholder="Note (optional)"
                    value={row.note}
                    maxLength={160}
                    onChange={(event) =>
                      updateRow<IngredientRow>("ingredients", row.key, {
                        note: event.target.value,
                      })
                    }
                    className={clsx(
                      inputClass(false),
                      "col-span-2 sm:col-span-1",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "ingredients",
                        state.ingredients.filter((r) => r.key !== row.key),
                      )
                    }
                    disabled={state.ingredients.length === 1}
                    className="text-ink-muted hover:bg-sky grid size-12 place-items-center justify-self-end rounded-full disabled:opacity-40"
                    aria-label={"Remove ingredient " + (index + 1)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                  {(nameError || qtyError) && (
                    <p className="text-danger col-span-full text-sm font-medium">
                      {nameError ?? qtyError}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          {errorFor("ingredients") && (
            <p
              className="text-danger text-sm font-medium"
              id={fieldId("ingredients")}
            >
              {errorFor("ingredients")}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="justify-self-start"
            onClick={() =>
              set("ingredients", [...state.ingredients, emptyIngredient()])
            }
            disabled={state.ingredients.length >= 40}
          >
            <Plus className="size-4" aria-hidden="true" /> Add ingredient
          </Button>
        </Section>

        <Section
          title="Steps"
          description="One action per step. Add minutes to get a timer in cook mode."
        >
          <ol className="grid gap-3">
            {state.steps.map((row, index) => {
              const base = "instructions." + index;
              const error = errorFor(base + ".text");
              return (
                <li
                  key={row.key}
                  className="rounded-field bg-canvas flex gap-3 p-3"
                >
                  <span
                    className="bg-denim font-display text-surface grid size-10 shrink-0 place-items-center rounded-full font-semibold"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="grid min-w-0 flex-1 gap-2">
                    <textarea
                      id={fieldId(base + ".text")}
                      aria-label={"Step " + (index + 1)}
                      value={row.text}
                      rows={2}
                      maxLength={500}
                      onChange={(event) =>
                        updateRow<StepRow>("steps", row.key, {
                          text: event.target.value,
                        })
                      }
                      aria-invalid={error ? true : undefined}
                      className={clsx(inputClass(Boolean(error)), "py-3")}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        aria-label={"Step " + (index + 1) + " minutes"}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={180}
                        placeholder="Min"
                        value={row.minutes}
                        onChange={(event) =>
                          updateRow<StepRow>("steps", row.key, {
                            minutes: event.target.value,
                          })
                        }
                        className={clsx(inputClass(false), "max-w-24")}
                      />
                      <span className="text-ink-muted text-sm">
                        minutes (optional)
                      </span>
                      <span className="ml-auto flex">
                        <button
                          type="button"
                          onClick={() => moveStep(index, -1)}
                          disabled={index === 0}
                          className="hover:bg-sky grid size-11 place-items-center rounded-full disabled:opacity-40"
                          aria-label={"Move step " + (index + 1) + " up"}
                        >
                          <ArrowUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, 1)}
                          disabled={index === state.steps.length - 1}
                          className="hover:bg-sky grid size-11 place-items-center rounded-full disabled:opacity-40"
                          aria-label={"Move step " + (index + 1) + " down"}
                        >
                          <ArrowDown className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "steps",
                              state.steps.filter((r) => r.key !== row.key),
                            )
                          }
                          disabled={state.steps.length === 1}
                          className="text-ink-muted hover:bg-sky grid size-11 place-items-center rounded-full disabled:opacity-40"
                          aria-label={"Remove step " + (index + 1)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                    {error && (
                      <p className="text-danger text-sm font-medium">{error}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {errorFor("instructions") && (
            <p
              className="text-danger text-sm font-medium"
              id={fieldId("instructions")}
            >
              {errorFor("instructions")}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="justify-self-start"
            onClick={() => set("steps", [...state.steps, emptyStep()])}
            disabled={state.steps.length >= 30}
          >
            <Plus className="size-4" aria-hidden="true" /> Add step
          </Button>
        </Section>

        <Section
          title="Extras"
          description="All optional, but they make your recipe easier to cook."
        >
          {text("equipment", "Equipment", {
            placeholder: "Kadhai, pressure cooker, tawa",
            hint: "Separate with commas.",
          })}
          {text("tips", "Tips", { multiline: true, hint: "One tip per line." })}
          {text("servingSuggestion", "Serve it with", {
            placeholder: "e.g. Jeera rice and kachumber salad",
            maxLength: 240,
          })}
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">
              Nutrition per serving (approximate)
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["calories", "Calories", "kcal"],
                  ["proteinG", "Protein", "g"],
                  ["carbsG", "Carbs", "g"],
                  ["fatG", "Fat", "g"],
                ] as const
              ).map(([key, label, unit]) => {
                const error = errorFor("nutritionPerServing." + key);
                return (
                  <div key={key}>
                    <label
                      htmlFor={fieldId("nutritionPerServing." + key)}
                      className="text-ink-muted mb-1 block text-sm"
                    >
                      {label} ({unit})
                    </label>
                    <input
                      id={fieldId("nutritionPerServing." + key)}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={state.nutrition[key]}
                      onChange={(event) =>
                        set("nutrition", {
                          ...state.nutrition,
                          [key]: event.target.value,
                        })
                      }
                      aria-invalid={error ? true : undefined}
                      className={inputClass(Boolean(error))}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-ink-muted mt-1 text-sm">
              Fill all four or leave them all empty.
            </p>
          </fieldset>
        </Section>

        <Section title="Video" description="Show people how it's done.">
          <SegmentedControl
            legend="Add a video"
            name="video-kind"
            value={state.videoKind}
            onChange={(value) => set("videoKind", value)}
            options={[
              { value: "none", label: "No video" },
              { value: "youtube", label: "YouTube link" },
              { value: "upload", label: "Upload a file" },
            ]}
          />
          {state.videoKind === "youtube" && (
            <div className="grid gap-3">
              {text("youtubeUrl", "YouTube link", {
                placeholder: "https://youtu.be/…",
              })}
              {errorFor("video.url") && (
                <p
                  id={fieldId("video.url")}
                  className="text-danger text-sm font-medium"
                >
                  {errorFor("video.url")}
                </p>
              )}
              {youtubeId && (
                <div className="rounded-field bg-ink aspect-video max-w-md overflow-hidden">
                  <iframe
                    src={youTubeEmbedUrl(youtubeId)}
                    title="Video preview"
                    loading="lazy"
                    className="size-full"
                    allow="encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              )}
            </div>
          )}
          {state.videoKind === "upload" && (
            <FileUploadField
              kind="video"
              label="Video file"
              fieldId={fieldId("video.uploadId")}
              value={state.videoUpload}
              onChange={(value) => set("videoUpload", value)}
              error={errorFor("video.uploadId")}
            />
          )}
        </Section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={busy}>
            {busy
              ? "Saving…"
              : mode === "edit"
                ? "Save changes"
                : "Publish recipe"}
          </Button>
        </div>
      </form>
    </main>
  );
}
