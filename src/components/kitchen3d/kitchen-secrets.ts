/** Things you can click in the kitchen, in 3D or from the secrets dock. */
export type HotspotId =
  | "cook"
  | "book"
  | "add"
  | "spices"
  | "basket"
  | "cooker"
  | "clock"
  | "window"
  | "tulsi";

/** Hotspots that open an info card instead of navigating. */
export type SecretId = Exclude<HotspotId, "cook" | "book" | "add">;

export const hotspotNames: Record<HotspotId, string> = {
  cook: "Gas stove",
  book: "Cookbooks",
  add: "Fridge",
  spices: "Masala dabba",
  basket: "Vegetable basket",
  cooker: "Pressure cooker",
  clock: "Wall clock",
  window: "Window",
  tulsi: "Tulsi plant",
};

export const secretOrder: SecretId[] = [
  "basket",
  "spices",
  "cooker",
  "clock",
  "window",
  "tulsi",
];

const spices = [
  {
    name: "Turmeric (haldi)",
    fact: "Gives dal and sabzi their golden colour. Stir it into hot oil for only a few seconds — it burns quickly and turns bitter.",
  },
  {
    name: "Cumin (jeera)",
    fact: "The heart of most tadkas. Let the seeds crackle and darken a shade before anything else goes in.",
  },
  {
    name: "Mustard seeds (rai)",
    fact: "Wait until they pop and dance in the oil before adding curry leaves — unpopped seeds taste raw and bitter.",
  },
  {
    name: "Asafoetida (hing)",
    fact: "A tiny pinch in hot oil adds a deep, onion–garlic savouriness to dals. More is not better.",
  },
  {
    name: "Kashmiri red chilli",
    fact: "Brings a bright red colour with gentle heat — handy when you want the look without the fire.",
  },
  {
    name: "Coriander powder (dhaniya)",
    fact: "Adds a warm, citrusy body to gravies and helps thicken them slightly.",
  },
  {
    name: "Garam masala",
    fact: "Add it near the end of cooking so its aroma stays bright instead of cooking away.",
  },
];

export function spiceOfTheDay(date = new Date()) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start) / 86_400_000);
  return spices[day % spices.length];
}

export type MealSuggestion = {
  title: string;
  body: string;
  actionLabel: string;
  action:
    { type: "quick"; minutes: number } | { type: "search"; query: string };
};

export function mealForTime(date = new Date()): MealSuggestion {
  const hour = date.getHours();
  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (hour >= 5 && hour < 11) {
    return {
      title: `It's ${time} — breakfast time`,
      body: "Poha, besan chilla or upma come together in under 20 minutes.",
      actionLabel: "Breakfast recipes",
      action: { type: "search", query: "breakfast" },
    };
  }
  if (hour >= 11 && hour < 16) {
    return {
      title: `It's ${time} — lunch time`,
      body: "Dal, a sabzi and rice: plan for about 45 minutes.",
      actionLabel: "Find a 45-minute lunch",
      action: { type: "quick", minutes: 45 },
    };
  }
  if (hour >= 16 && hour < 19) {
    return {
      title: `It's ${time} — chai time`,
      body: "Something quick to go with your chai? Try a 15-minute snack.",
      actionLabel: "Find a 15-minute snack",
      action: { type: "quick", minutes: 15 },
    };
  }
  if (hour >= 19 && hour < 23) {
    return {
      title: `It's ${time} — dinner time`,
      body: "A comforting dinner on the table in half an hour.",
      actionLabel: "Find a 30-minute dinner",
      action: { type: "quick", minutes: 30 },
    };
  }
  return {
    title: `It's ${time} — a late-night craving?`,
    body: "Keep it light and quick: 15 minutes or less.",
    actionLabel: "Find a 15-minute bite",
    action: { type: "quick", minutes: 15 },
  };
}

export const BASKET_ITEMS = ["potato", "onion", "tomato"];
