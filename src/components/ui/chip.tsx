import type { ComponentProps, ReactNode } from "react";
import { clsx } from "clsx";
import { Check, Plus, X } from "lucide-react";

export type ChipTone = "oak" | "sky" | "surface";
export type ChipSize = "sm" | "md";

const tones: Record<ChipTone, string> = {
  oak: "bg-oak",
  sky: "bg-sky",
  surface: "border border-line-strong bg-surface",
};

type ChipProps = {
  children: ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  /** When provided, the chip shows a remove (×) button. */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
};

/** A static label pill, optionally removable. */
export function Chip({
  children,
  tone = "oak",
  size = "md",
  onRemove,
  removeLabel,
  className,
}: ChipProps) {
  return (
    <span
      className={clsx(
        "text-ink inline-flex max-w-full items-center rounded-full font-medium",
        tones[tone],
        size === "sm" ? "min-h-8 px-3 text-sm" : "min-h-11 pl-4 text-[0.95rem]",
        size === "md" && !onRemove && "pr-4",
        className,
      )}
    >
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? "Remove"}
          className="text-ink-muted hover:bg-sky-deep hover:text-ink ml-0.5 grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-150"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

type ChipToggleProps = Omit<ComponentProps<"button">, "children"> & {
  children: ReactNode;
  pressed: boolean;
};

/** A tappable suggestion pill; shows a check once it is selected. */
export function ChipToggle({
  children,
  pressed,
  className,
  ...props
}: ChipToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={clsx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[0.95rem] font-medium transition duration-150",
        pressed
          ? "border-denim-edge bg-denim text-surface"
          : "border-line-strong bg-surface text-ink hover:bg-sky hover:-translate-y-px",
        className,
      )}
      {...props}
    >
      {pressed ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Plus className="text-denim size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
