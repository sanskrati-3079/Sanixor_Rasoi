import type { BookRecipeInput } from "./schemas";

type KitchenRecipe = Omit<BookRecipeInput, "source">;

const base: Pick<
  KitchenRecipe,
  "language" | "substitutions" | "video" | "photoUploadId"
> = {
  language: "en",
  substitutions: [],
  video: { kind: "none" },
  photoUploadId: null,
};

const step = (text: string, durationMinutes = 0) => ({ text, durationMinutes });
const item = (
  name: string,
  quantity: number | null,
  unit: string,
  note = "",
) => ({
  name,
  quantity,
  unit,
  note,
});

/**
 * Starter recipes written for Sanixor Rasoi so the recipe book is useful on
 * day one. Nutrition values are rough per-serving estimates.
 */
export const kitchenRecipes: KitchenRecipe[] = [
  {
    ...base,
    title: "Aloo Matar",
    description:
      "Potatoes and green peas simmered in a light tomato–onion masala. A weeknight staple with roti or rice.",
    cuisine: "North Indian",
    servings: 3,
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    difficulty: "easy",
    diet: "vegan",
    spiceLevel: "medium",
    ingredients: [
      item("potato", 3, "medium", "peeled and cubed"),
      item("green peas", 1, "cup", "fresh or frozen"),
      item("onion", 1, "large", "finely chopped"),
      item("tomato", 2, "medium", "pureed"),
      item("ginger-garlic paste", 1, "tsp"),
      item("oil", 2, "tbsp"),
      item("cumin seeds", 1, "tsp"),
      item("turmeric", 0.5, "tsp"),
      item("red chilli powder", 1, "tsp"),
      item("garam masala", 0.5, "tsp"),
      item("salt", null, "", "to taste"),
      item("coriander leaves", null, "", "to garnish"),
    ],
    instructions: [
      step("Heat oil in a kadhai and add cumin seeds. Let them sizzle.", 1),
      step("Add the onion and cook until golden brown.", 6),
      step(
        "Stir in ginger-garlic paste for a minute, then add turmeric and chilli powder.",
        2,
      ),
      step("Add the tomato puree and cook until the oil separates.", 6),
      step(
        "Add potatoes, peas, salt and 1½ cups water. Cover and simmer until the potatoes are tender.",
        12,
      ),
      step("Finish with garam masala and coriander leaves."),
    ],
    equipment: ["Kadhai", "Wooden spatula", "Lid"],
    tips: [
      "Mash a few potato cubes against the pan to thicken the gravy naturally.",
      "Pressure-cook for 2 whistles instead of simmering to save 8–10 minutes.",
    ],
    servingSuggestion:
      "Serve with hot phulka or jeera rice and a side of pickle.",
    nutritionPerServing: { calories: 230, proteinG: 6, carbsG: 34, fatG: 9 },
    warnings: [],
  },
  {
    ...base,
    title: "Masoor Dal Tadka",
    description:
      "Red lentils cooked soft and finished with a sizzling cumin, garlic and chilli tempering.",
    cuisine: "North Indian",
    servings: 4,
    prepTimeMinutes: 5,
    cookTimeMinutes: 25,
    difficulty: "easy",
    diet: "vegan",
    spiceLevel: "mild",
    ingredients: [
      item("masoor dal (red lentils)", 1, "cup", "rinsed"),
      item("water", 3, "cup"),
      item("turmeric", 0.5, "tsp"),
      item("tomato", 1, "medium", "chopped"),
      item("oil", 2, "tbsp"),
      item("cumin seeds", 1, "tsp"),
      item("garlic", 4, "cloves", "sliced"),
      item("dried red chilli", 2, "whole"),
      item("asafoetida (hing)", 1, "pinch"),
      item("salt", null, "", "to taste"),
      item("lemon", 0.5, "whole", "juiced"),
    ],
    instructions: [
      step(
        "Boil dal with water, turmeric and tomato until completely soft, stirring now and then.",
        20,
      ),
      step(
        "Whisk the dal smooth and season with salt. Add water if it is too thick.",
        1,
      ),
      step(
        "For the tadka, heat oil and add cumin, garlic, red chillies and hing until the garlic turns golden.",
        2,
      ),
      step(
        "Pour the tadka over the dal, cover for a minute, then add lemon juice.",
      ),
    ],
    equipment: ["Pressure cooker or deep pot", "Tadka pan", "Whisk"],
    tips: [
      "Add the tadka just before serving so it stays aromatic.",
      "Use ghee instead of oil for a richer, non-vegan version.",
    ],
    servingSuggestion: "Pair with steamed rice and a crunchy onion salad.",
    nutritionPerServing: { calories: 210, proteinG: 12, carbsG: 28, fatG: 7 },
    warnings: [],
  },
  {
    ...base,
    title: "Kanda Poha",
    description:
      "Flattened rice tossed with onions, peanuts, curry leaves and turmeric — Maharashtra's favourite breakfast.",
    cuisine: "Maharashtrian",
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    difficulty: "easy",
    diet: "vegan",
    spiceLevel: "mild",
    ingredients: [
      item("thick poha", 2, "cup"),
      item("onion", 1, "medium", "chopped"),
      item("peanuts", 2, "tbsp"),
      item("green chilli", 1, "whole", "slit"),
      item("curry leaves", 8, "leaves"),
      item("mustard seeds", 0.5, "tsp"),
      item("turmeric", 0.25, "tsp"),
      item("oil", 1.5, "tbsp"),
      item("sugar", 0.5, "tsp"),
      item("salt", null, "", "to taste"),
      item("lemon", 0.5, "whole"),
      item("coriander leaves", null, "", "to garnish"),
    ],
    instructions: [
      step(
        "Rinse poha in a colander until just soft, then sprinkle salt and sugar and set aside.",
        5,
      ),
      step("Fry peanuts in oil until crisp; remove and keep aside.", 3),
      step(
        "In the same oil, crackle mustard seeds, then add curry leaves, green chilli and onion. Cook until soft.",
        4,
      ),
      step(
        "Add turmeric and the poha. Toss gently on low heat until heated through.",
        3,
      ),
      step("Top with peanuts, coriander and a squeeze of lemon."),
    ],
    equipment: ["Kadhai", "Colander"],
    tips: [
      "Don't soak the poha — a quick rinse keeps it fluffy, not mushy.",
      "Add a handful of peas or grated coconut for variety.",
    ],
    servingSuggestion: "Serve with masala chai and a sprinkle of sev.",
    nutritionPerServing: { calories: 320, proteinG: 7, carbsG: 50, fatG: 11 },
    warnings: ["Contains peanuts."],
  },
  {
    ...base,
    title: "Besan Chilla",
    description:
      "Savoury gram-flour pancakes with onion, tomato and herbs. Ready in under 20 minutes and high in protein.",
    cuisine: "North Indian",
    servings: 2,
    prepTimeMinutes: 8,
    cookTimeMinutes: 10,
    difficulty: "easy",
    diet: "vegan",
    spiceLevel: "medium",
    ingredients: [
      item("besan (gram flour)", 1, "cup"),
      item("water", 0.75, "cup", "roughly"),
      item("onion", 1, "small", "finely chopped"),
      item("tomato", 1, "small", "finely chopped"),
      item("green chilli", 1, "whole", "minced"),
      item("ajwain", 0.25, "tsp"),
      item("turmeric", 0.25, "tsp"),
      item("salt", null, "", "to taste"),
      item("oil", 1, "tbsp", "for the tawa"),
    ],
    instructions: [
      step("Whisk besan with water into a smooth, pourable batter.", 3),
      step("Stir in onion, tomato, chilli, ajwain, turmeric and salt.", 2),
      step(
        "Spread a ladle of batter on a hot greased tawa and drizzle oil around the edges.",
        2,
      ),
      step("Flip when the underside is golden and cook the other side.", 2),
      step("Repeat with the remaining batter."),
    ],
    equipment: ["Tawa", "Ladle", "Flat spatula"],
    tips: ["Rest the batter for 5 minutes for softer chillas."],
    servingSuggestion: "Serve with green chutney or ketchup.",
    nutritionPerServing: { calories: 260, proteinG: 13, carbsG: 30, fatG: 10 },
    warnings: [],
  },
  {
    ...base,
    title: "Egg Bhurji",
    description:
      "Indian-style scrambled eggs with onion, tomato and green chilli. Great with pav or toast.",
    cuisine: "Street style",
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    difficulty: "easy",
    diet: "eggetarian",
    spiceLevel: "medium",
    ingredients: [
      item("eggs", 4, "whole"),
      item("onion", 1, "medium", "chopped"),
      item("tomato", 1, "medium", "chopped"),
      item("green chilli", 1, "whole", "chopped"),
      item("butter or oil", 1, "tbsp"),
      item("turmeric", 0.25, "tsp"),
      item("pav bhaji masala", 0.5, "tsp", "or garam masala"),
      item("salt", null, "", "to taste"),
      item("coriander leaves", null, "", "to garnish"),
    ],
    instructions: [
      step("Melt butter, add onion and chilli and cook until soft.", 3),
      step(
        "Add tomato, turmeric, masala and salt. Cook until the tomato breaks down.",
        3,
      ),
      step(
        "Pour in the beaten eggs and stir gently on low heat until just set.",
        3,
      ),
      step("Garnish with coriander and serve hot."),
    ],
    equipment: ["Non-stick pan", "Spatula", "Bowl and whisk"],
    tips: [
      "Take the pan off the heat while the eggs are still slightly wet; they keep cooking.",
    ],
    servingSuggestion: "Serve with buttered pav and sliced onions.",
    nutritionPerServing: { calories: 250, proteinG: 14, carbsG: 8, fatG: 18 },
    warnings: [
      "Cook eggs until fully set if serving children, older adults or anyone pregnant.",
    ],
  },
  {
    ...base,
    title: "Palak Paneer",
    description: "Soft paneer cubes in a smooth, gently spiced spinach gravy.",
    cuisine: "Punjabi",
    servings: 3,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    difficulty: "medium",
    diet: "vegetarian",
    spiceLevel: "mild",
    ingredients: [
      item("spinach (palak)", 250, "g", "washed"),
      item("paneer", 200, "g", "cubed"),
      item("onion", 1, "medium", "chopped"),
      item("tomato", 1, "medium", "chopped"),
      item("ginger-garlic paste", 1, "tsp"),
      item("green chilli", 1, "whole"),
      item("ghee or oil", 2, "tbsp"),
      item("cumin seeds", 1, "tsp"),
      item("garam masala", 0.5, "tsp"),
      item("fresh cream", 2, "tbsp", "optional"),
      item("salt", null, "", "to taste"),
    ],
    instructions: [
      step(
        "Blanch spinach in boiling water, then plunge into cold water and blend with the green chilli.",
        4,
      ),
      step("Heat ghee, add cumin, then onion and cook until golden.", 6),
      step("Add ginger-garlic paste and tomato and cook until soft.", 4),
      step("Stir in the spinach puree, salt and garam masala and simmer.", 4),
      step("Add paneer, simmer for 2 minutes and finish with cream.", 2),
    ],
    equipment: ["Kadhai", "Blender", "Saucepan"],
    tips: [
      "Cold water after blanching keeps the spinach bright green.",
      "Soak paneer in warm water for 10 minutes to keep it soft.",
    ],
    servingSuggestion: "Best with butter naan, laccha paratha or jeera rice.",
    nutritionPerServing: { calories: 330, proteinG: 16, carbsG: 11, fatG: 25 },
    warnings: [],
  },
];
