type RecipeRequestLog = {
  requestId: string;
  durationMs: number;
  outcome: "success" | "error";
  mode?: "mock" | "ai";
  code?: string;
};

export function logRecipeRequest(event: RecipeRequestLog): void {
  const safeEvent = {
    event: "recipe_request",
    requestId: event.requestId,
    durationMs: Math.round(event.durationMs),
    outcome: event.outcome,
    ...(event.mode ? { mode: event.mode } : {}),
    ...(event.code ? { code: event.code } : {}),
  };

  if (event.outcome === "error") {
    console.error(JSON.stringify(safeEvent));
    return;
  }

  console.info(JSON.stringify(safeEvent));
}
