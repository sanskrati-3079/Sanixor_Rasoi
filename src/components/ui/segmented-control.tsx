import type { ReactNode } from "react";
import { clsx } from "clsx";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Decorative marker shown before the label (icon, dot, chillies…). */
  icon?: ReactNode;
  lang?: string;
};

type SegmentedControlProps<T extends string> = {
  legend: string;
  name: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Native radio group styled as pills. Native radios give arrow-key
 * navigation and screen-reader semantics for free.
 */
export function SegmentedControl<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className={clsx("min-w-0", className)}>
      <legend className="text-ink mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              lang={option.lang}
              className={clsx(
                "relative inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[0.95rem] transition duration-150 select-none",
                "has-[:focus-visible]:outline-accent-strong has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2",
                selected
                  ? "border-denim-edge bg-denim text-surface font-semibold"
                  : "bg-surface text-ink hover:border-line-strong hover:bg-sky cursor-pointer border-transparent",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.icon}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
