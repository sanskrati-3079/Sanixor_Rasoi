/**
 * Friendly copy for each failure the recipe request can hit. Codes mirror
 * the API's error codes (see src/app/api/recipes/route.ts) plus the ones the
 * browser can produce on its own.
 */
export type RecipeErrorCode =
  | "INVALID_INPUT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_MODEL_OUTPUT"
  | "INTERNAL_ERROR"
  | "CLIENT_TIMEOUT"
  | "NETWORK"
  | "UNREADABLE_RESPONSE";

type ErrorCopy = {
  title: string;
  description: string;
  /** Whether editing the ingredients is the more useful next step. */
  suggestEdit: boolean;
};

const copy: Record<RecipeErrorCode, ErrorCopy> = {
  INVALID_INPUT: {
    title: "Something in that list didn't look right",
    description:
      "Check your ingredients, servings and preferences, then try again.",
    suggestEdit: true,
  },
  PAYLOAD_TOO_LARGE: {
    title: "That's a very full pantry",
    description: "Try a shorter list of ingredients and send it again.",
    suggestEdit: true,
  },
  RATE_LIMITED: {
    title: "The kitchen is a little busy",
    description:
      "You've asked for lots of recipes in a short time. Give it a minute, then retry.",
    suggestEdit: false,
  },
  PROVIDER_TIMEOUT: {
    title: "That took longer than a slow-cooked dal",
    description: "The recipe service didn't answer in time. Please retry.",
    suggestEdit: false,
  },
  CLIENT_TIMEOUT: {
    title: "That took longer than a slow-cooked dal",
    description: "We stopped waiting after 25 seconds. Please retry.",
    suggestEdit: false,
  },
  PROVIDER_ERROR: {
    title: "Our recipe helper stepped out for a moment",
    description: "Recipe generation is temporarily unavailable. Please retry.",
    suggestEdit: false,
  },
  INVALID_MODEL_OUTPUT: {
    title: "Those suggestions came out half-baked",
    description:
      "We couldn't check the recipes properly, so we didn't show them. Retry for a fresh batch.",
    suggestEdit: false,
  },
  UNREADABLE_RESPONSE: {
    title: "Those suggestions came out half-baked",
    description: "We couldn't read the response. Retry for a fresh batch.",
    suggestEdit: false,
  },
  NETWORK: {
    title: "We couldn't reach the kitchen",
    description: "Check your internet connection, then retry.",
    suggestEdit: false,
  },
  INTERNAL_ERROR: {
    title: "Something went wrong on our side",
    description: "It isn't anything you did. Please retry in a moment.",
    suggestEdit: false,
  },
};

export function isRecipeErrorCode(value: string): value is RecipeErrorCode {
  return Object.hasOwn(copy, value);
}

export function describeRecipeError(code: RecipeErrorCode): ErrorCopy {
  return copy[code];
}
