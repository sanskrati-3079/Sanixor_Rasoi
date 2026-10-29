import type { ComponentProps } from "react";
import { clsx } from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 ease-[var(--ease-soft)] disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-denim-edge bg-denim text-surface shadow-press hover:-translate-y-0.5 hover:bg-denim-hover hover:shadow-[0_6px_0_0_var(--color-denim-edge)] active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:border-line disabled:bg-sky disabled:text-ink-muted disabled:shadow-none",
  secondary:
    "border-2 border-line-strong bg-surface text-ink hover:bg-sky disabled:opacity-60",
  ghost:
    "text-accent-strong underline-offset-4 hover:bg-sky hover:underline disabled:opacity-60",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
};

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

/** Class names for anything that should look like a button (e.g. a Link). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}) {
  return clsx(
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & ButtonStyleOptions;

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
