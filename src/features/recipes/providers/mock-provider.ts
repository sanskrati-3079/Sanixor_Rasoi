import type {
  RecipeCandidate,
  RecipeLanguage,
  RecipeRequest,
} from "../schemas";
import { ingredientDietaryConflict } from "../dietary-rules";
import type { RecipeProvider } from "./provider";

const formatText = {
  en: {
    description: "A simple, flexible home-style dish built around your pantry.",
    prepare: "Wash and prepare",
    heat: "Warm oil in a pan, then add cumin and turmeric.",
    cook: "Add the prepared ingredients and stir until they begin to soften.",
    finish:
      "Season to taste, finish with fresh herbs if available, and serve warm.",
    curry: "Add a little water, cover, and simmer until tender.",
    rice: "Stir in cooked rice and toss gently until hot.",
    warning:
      "Sample mock recipe: adjust quantities and cooking time to the ingredients you have.",
    cuisine: "Indian home cooking",
    tip: "Let the cumin sizzle for a few seconds before adding vegetables.",
    tip2: "Add salt early so the vegetables release moisture and cook evenly.",
    serving: "Serve hot with roti, rice or a bowl of curd.",
    pan: "Kadhai or deep pan",
    spoon: "Wooden spatula",
    board: "Knife and chopping board",
  },
  hi: {
    description: "आपकी रसोई की सामग्री से बनी एक आसान घरेलू डिश।",
    prepare: "सामग्री को धोकर तैयार करें",
    heat: "पैन में तेल गरम करें और जीरा व हल्दी डालें।",
    cook: "तैयार सामग्री डालकर नरम होने तक चलाते हुए पकाएँ।",
    finish:
      "स्वादानुसार नमक डालें, उपलब्ध हो तो हरी जड़ी-बूटी डालें और गरम परोसें।",
    curry: "थोड़ा पानी डालें, ढकें और नरम होने तक धीमी आँच पर पकाएँ।",
    rice: "पके हुए चावल मिलाएँ और गरम होने तक हल्के हाथ से चलाएँ।",
    warning: "यह नमूना सुझाव है। अपनी सामग्री के अनुसार मात्रा और समय जाँचें।",
    cuisine: "भारतीय घरेलू खाना",
    tip: "सब्ज़ी डालने से पहले जीरे को कुछ सेकंड चटकने दें।",
    tip2: "नमक जल्दी डालें ताकि सब्ज़ियाँ पानी छोड़ें और बराबर पकें।",
    serving: "रोटी, चावल या दही के साथ गरम परोसें।",
    pan: "कड़ाही या गहरा पैन",
    spoon: "लकड़ी का चम्मच",
    board: "चाकू और चॉपिंग बोर्ड",
  },
  hinglish: {
    description: "Aapke pantry ingredients se bani ek easy ghar-style dish.",
    prepare: "Ingredients ko dho kar prepare karein",
    heat: "Pan mein oil garam karein, phir jeera aur haldi daalein.",
    cook: "Prepared ingredients daal kar naram hone tak stir karte hue pakayein.",
    finish:
      "Taste ke hisaab se namak daalein, fresh herbs hon to add karein aur garam serve karein.",
    curry:
      "Thoda paani daalein, cover karein aur tender hone tak simmer karein.",
    rice: "Cooked rice milayein aur garam hone tak gently toss karein.",
    warning:
      "Yeh sample suggestion hai. Apne ingredients ke hisaab se quantity aur time check karein.",
    cuisine: "Indian ghar ka khana",
    tip: "Sabzi daalne se pehle jeera ko kuch second chatakne dein.",
    tip2: "Namak jaldi daalein taaki sabziyan paani chhodein aur evenly pakein.",
    serving: "Roti, chawal ya dahi ke saath garam serve karein.",
    pan: "Kadhai ya deep pan",
    spoon: "Wooden spatula",
    board: "Knife aur chopping board",
  },
} satisfies Record<RecipeLanguage, Record<string, string>>;

function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) =>
      word ? word[0].toLocaleUpperCase("en-IN") + word.slice(1) : word,
    )
    .join(" ");
}

function cookTimes(input: RecipeRequest, variation: number) {
  const suggested = [28, 32, 30][variation];
  const total = Math.min(suggested, input.maxMinutes ?? suggested);
  const prepTimeMinutes = Math.max(2, Math.min(10, Math.floor(total * 0.3)));

  return {
    prepTimeMinutes,
    cookTimeMinutes: total - prepTimeMinutes,
    totalTimeMinutes: total,
  };
}

function ingredient(
  name: string,
  quantity: number,
  unit: string,
  available: Set<string>,
): RecipeCandidate["ingredients"][number] {
  const lowerName = name.toLocaleLowerCase("en-IN");
  if (unit === "medium") {
    if (
      /\b(rice|dal|lentils|flour|atta|poha|semolina|chickpeas?)\b/iu.test(
        lowerName,
      )
    ) {
      quantity = 1;
      unit = "cup";
    } else if (
      /\b(chicken|mutton|lamb|beef|pork|fish|prawns?|shrimp)\b/iu.test(
        lowerName,
      )
    ) {
      quantity = 200;
      unit = "g";
    } else if (/\b(peas|corn|spinach|beans)\b/iu.test(lowerName)) {
      quantity = 1;
      unit = "cup";
    } else if (/\b(milk|water|stock|broth)\b/iu.test(lowerName)) {
      quantity = 1;
      unit = "cup";
    }
  }

  return {
    name,
    quantity,
    unit,
    isUserProvided: available.has(name.toLocaleLowerCase("en-IN")),
    note: "",
  };
}

function createRecipe(
  input: RecipeRequest,
  variation: number,
  title: string,
  pantryIngredients: string[],
  steps: string[],
): RecipeCandidate {
  const language = formatText[input.language];
  const available = new Set(
    input.ingredients.map((value) => value.toLocaleLowerCase("en-IN")),
  );
  const primaryIngredients = pantryIngredients.map((name, index) =>
    ingredient(name, index === 0 ? 2 : 1, "medium", available),
  );
  const seasoning = ["oil", "cumin", "turmeric", "salt"].map((name, index) =>
    ingredient(
      name,
      [1, 0.5, 0.5, 0.5][index],
      index === 0 ? "tbsp" : "tsp",
      available,
    ),
  );
  const time = cookTimes(input, variation);
  const tags =
    input.diet === "vegan" ? ["vegetarian", "vegan"] : ["vegetarian"];

  return {
    title,
    description: language.description,
    cuisine: language.cuisine,
    servings: input.servings,
    ...time,
    dietaryTags: tags as RecipeCandidate["dietaryTags"],
    ingredients: [...primaryIngredients, ...seasoning],
    instructions: steps.map((text, index) => ({
      step: index + 1,
      text,
      durationMinutes:
        index === 0
          ? time.prepTimeMinutes
          : Math.max(2, Math.floor(time.cookTimeMinutes / (steps.length - 1))),
    })),
    substitutions: [],
    warnings: [language.warning],
    difficulty: variation === 1 ? "medium" : "easy",
    equipment: [language.pan, language.spoon, language.board],
    tips: [language.tip, language.tip2],
    servingSuggestion: language.serving,
    // Sample values only; the UI labels nutrition as an approximate estimate.
    nutritionPerServing: [
      { calories: 210, proteinG: 4, carbsG: 30, fatG: 8 },
      { calories: 240, proteinG: 5, carbsG: 28, fatG: 11 },
      { calories: 320, proteinG: 6, carbsG: 54, fatG: 8 },
    ][variation],
  };
}

export class MockRecipeProvider implements RecipeProvider {
  readonly mode = "mock" as const;

  async generate(input: RecipeRequest): Promise<unknown> {
    const language = formatText[input.language];
    const pantry = input.ingredients.filter(
      (name) => ingredientDietaryConflict(name, input.diet) === null,
    );
    const first = pantry[0] ?? "potato";
    const second = pantry[1] ?? "onion";
    const third = pantry[2];
    const pantryPair = third ? [first, second, third] : [first, second];

    return {
      recipes: [
        createRecipe(input, 0, titleCase("tawa masala " + first), pantryPair, [
          language.prepare + " " + pantryPair.join(", ") + ".",
          language.heat,
          language.cook,
          language.finish,
        ]),
        createRecipe(
          input,
          1,
          titleCase("homestyle " + second + " curry"),
          [second, first],
          [
            language.prepare + " " + second + " and " + first + ".",
            language.heat,
            language.cook,
            language.curry,
            language.finish,
          ],
        ),
        createRecipe(
          input,
          2,
          titleCase("quick pantry " + first + " rice"),
          [first, "rice"],
          [
            language.prepare + " " + first + " and cook the rice.",
            language.heat,
            language.cook,
            language.rice,
            language.finish,
          ],
        ),
      ],
    };
  }
}
