import { clsx } from "clsx";
import { Egg, Leaf } from "lucide-react";
import { Badge } from "./badge";

export type DietKind = "vegetarian" | "vegan" | "eggetarian" | "non-vegetarian";

export const dietLabels: Record<DietKind, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  "non-vegetarian": "Non-veg",
};

/**
 * Indian food-label style marks: a square with a circle for vegetarian and a
 * square with a triangle for non-vegetarian, so the shape — not only the
 * colour — tells them apart. Vegan and eggetarian use their own icons.
 */
export function DietMark({
  diet,
  className,
}: {
  diet: DietKind;
  className?: string;
}) {
  const size = clsx("size-4 shrink-0", className);

  if (diet === "vegan") {
    return <Leaf className={clsx(size, "text-veg")} aria-hidden="true" />;
  }
  if (diet === "eggetarian") {
    return <Egg className={clsx(size, "text-warning")} aria-hidden="true" />;
  }

  const isVeg = diet === "vegetarian";
  return (
    <svg
      viewBox="0 0 16 16"
      className={clsx(size, isVeg ? "text-veg" : "text-nonveg")}
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {isVeg ? (
        <circle cx="8" cy="8" r="3.6" fill="currentColor" />
      ) : (
        <path d="M8 3.8 12 11.2H4Z" fill="currentColor" />
      )}
    </svg>
  );
}

export function DietBadge({
  diet,
  className,
}: {
  diet: DietKind;
  className?: string;
}) {
  return (
    <Badge
      tone="neutral"
      icon={<DietMark diet={diet} />}
      className={clsx("bg-surface", className)}
    >
      {dietLabels[diet]}
    </Badge>
  );
}
