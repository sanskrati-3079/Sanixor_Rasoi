import type { ComponentProps } from "react";
import { clsx } from "clsx";

type CardOptions = {
  /** Adds hover lift and a focus ring for cards containing a stretched link. */
  interactive?: boolean;
  padded?: boolean;
  className?: string;
};

export function cardClasses({
  interactive = false,
  padded = true,
  className,
}: CardOptions = {}) {
  return clsx(
    "relative rounded-card glass-strong",
    padded && "p-5 sm:p-6",
    interactive &&
      "transition duration-200 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-card-hover has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-strong",
    className,
  );
}

type CardProps = ComponentProps<"div"> & CardOptions;

export function Card({ interactive, padded, className, ...props }: CardProps) {
  return (
    <div
      className={cardClasses({ interactive, padded, className })}
      {...props}
    />
  );
}
