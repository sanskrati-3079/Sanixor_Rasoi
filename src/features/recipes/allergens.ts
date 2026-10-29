/**
 * Flags common allergens from ingredient names. This is a keyword scan, not
 * a safety check: it can miss hidden or translated allergens, so the UI must
 * always pair it with "check every label" guidance.
 */
const ALLERGEN_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "Dairy",
    pattern:
      /\b(milk|cream|malai|butter|ghee|paneer|cheese|curd|dahi|yogh?urt|khoa|khoya|buttermilk|chaas|whey)\b|दूध|घी|पनीर|दही|मक्खन/iu,
  },
  {
    label: "Gluten",
    pattern:
      /\b(wheat|atta|maida|suji|sooji|semolina|rava|bread|naan|roti|paratha|barley|noodles?|pasta|seviyan|vermicelli)\b|आटा|मैदा|सूजी/iu,
  },
  {
    label: "Peanuts",
    pattern: /\b(peanuts?|groundnuts?|moongphali|mungfali)\b|मूंगफली/iu,
  },
  {
    label: "Tree nuts",
    pattern:
      /\b(almonds?|badam|cashews?|kaju|pistachios?|pista|walnuts?|akhrot|hazelnuts?)\b|बादाम|काजू|पिस्ता/iu,
  },
  { label: "Egg", pattern: /\b(eggs?|anda|ande)\b|अंडा|अंडे/iu },
  {
    label: "Fish",
    pattern: /\b(fish|machhi|machli|salmon|tuna|rohu|pomfret|surmai)\b|मछली/iu,
  },
  {
    label: "Shellfish",
    pattern:
      /\b(prawns?|shrimps?|jhinga|crab|lobster|clams?|mussels?)\b|झींगा/iu,
  },
  { label: "Soy", pattern: /\b(soy|soya|tofu|edamame)\b|सोया/iu },
  { label: "Sesame", pattern: /\b(sesame|til|tahini|gingelly)\b|तिल/iu },
  {
    label: "Mustard",
    pattern: /\b(mustard|rai|sarson|sarso)\b|सरसों|राई/iu,
  },
];

export function detectAllergens(ingredientNames: string[]): string[] {
  const text = ingredientNames.join(" \n ");
  return ALLERGEN_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ label }) => label,
  );
}
