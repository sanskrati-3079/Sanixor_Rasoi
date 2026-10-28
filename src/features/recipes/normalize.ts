export function normalizeIngredients(values: string[]): string[] {
  const unique = new Map<string, string>();

  for (const value of values) {
    for (const part of value.split(",")) {
      const ingredient = part.normalize("NFKC").replace(/\s+/gu, " ").trim();
      if (!ingredient) continue;

      const key = ingredient.toLocaleLowerCase("en-IN");
      if (!unique.has(key)) unique.set(key, key);
    }
  }

  return [...unique.values()];
}

export function ingredientKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-IN");
}
