import { useId } from "react";
import { clsx } from "clsx";
import { Minus, Plus } from "lucide-react";

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Word shown after the number, e.g. "people". */
  unit?: string;
  /** Visually hide the label (it is still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
};

const stepButton =
  "grid size-11 place-items-center rounded-full bg-surface text-ink transition-colors duration-150 hover:bg-sky disabled:cursor-not-allowed disabled:text-ink-muted/50 disabled:hover:bg-surface";

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  unit,
  hideLabel = false,
  className,
}: StepperProps) {
  const labelId = useId();

  return (
    <div className={clsx("min-w-0", className)}>
      <span
        id={labelId}
        className={clsx(
          "text-ink mb-2 block text-sm font-semibold",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="border-line-strong bg-canvas inline-flex items-center gap-1 rounded-full border p-1"
      >
        <button
          type="button"
          className={stepButton}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={"Decrease " + label.toLowerCase()}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className="min-w-[5.5rem] text-center font-semibold tabular-nums"
        >
          {value}
          {unit && <span className="text-ink-muted font-normal"> {unit}</span>}
        </output>
        <button
          type="button"
          className={stepButton}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={"Increase " + label.toLowerCase()}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
