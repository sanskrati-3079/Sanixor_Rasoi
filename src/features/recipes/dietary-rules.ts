import type { Diet } from "./schemas";

const MEAT_OR_FISH =
  /\b(chicken|mutton|lamb|beef|pork|ham|bacon|sausage|meat|fish|seafood|prawn|shrimp|crab|lobster|anchovy|gelatin|lard|tallow|fish sauce|oyster sauce|chicken stock|meat stock)\b/iu;
const EGG = /\b(egg|eggs|egg white|egg yolk)\b/iu;
const ANIMAL_DERIVED =
  /\b(milk|cream|buttermilk|butter|ghee|paneer|cheese|curd|yogurt|yoghurt|honey|whey|casein)\b/iu;
const PLANT_BASED =
  /\b(vegan|plant[- ]based|dairy-free|meatless|mock meat|coconut|almond|oat|soy|soya|cashew|rice|hemp|pea|peanut|sunflower)\b/iu;

export type DietaryConflict = "meat_or_fish" | "egg" | "animal_derived";

export function ingredientDietaryConflict(
  ingredientName: string,
  diet: Diet,
): DietaryConflict | null {
  if (diet === "non-vegetarian") return null;

  const name = ingredientName.normalize("NFKC").toLocaleLowerCase("en-IN");
  if (MEAT_OR_FISH.test(name) && !PLANT_BASED.test(name)) {
    return "meat_or_fish";
  }

  if (diet === "vegetarian" && EGG.test(name) && !PLANT_BASED.test(name)) {
    return "egg";
  }
  if (diet === "vegan" && !PLANT_BASED.test(name)) {
    if (EGG.test(name)) return "egg";
    if (ANIMAL_DERIVED.test(name)) return "animal_derived";
  }

  return null;
}

export function hasMeatOrFish(ingredientNames: string[]): boolean {
  return ingredientNames.some(
    (name) => MEAT_OR_FISH.test(name) && !PLANT_BASED.test(name),
  );
}

export function hasEgg(ingredientNames: string[]): boolean {
  return ingredientNames.some(
    (name) => EGG.test(name) && !PLANT_BASED.test(name),
  );
}
