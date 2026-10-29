import { clsx } from "clsx";

export type SpiceKind = "mild" | "medium" | "hot";

const levels: Record<SpiceKind, { count: number; label: string }> = {
  mild: { count: 1, label: "Mild" },
  medium: { count: 2, label: "Medium" },
  hot: { count: 3, label: "Hot" },
};

function Chilli({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={clsx(
        "size-4",
        filled ? "text-accent-strong" : "text-line-strong",
      )}
      aria-hidden="true"
    >
      <path
        d="M11.5 3.2c.6-.8 1.4-1.2 2.3-1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M11.6 4c1.6.8 1.8 3 .6 5.2-1.7 3-5.4 5-9.3 4.6-.6-.1-.6-.7-.1-.9 2.6-1.1 4.5-3.2 5.6-6 .7-1.9 1.8-3.6 3.2-2.9Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Chillies only, for use inside controls that already show a text label. */
export function ChilliRow({ level }: { level: SpiceKind }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {Array.from({ length: levels[level].count }, (_, index) => (
        <Chilli filled key={index} />
      ))}
    </span>
  );
}

type SpiceMeterProps = {
  level: SpiceKind;
  showLabel?: boolean;
  className?: string;
};

/** Three chillies, filled up to the level, always paired with text. */
export function SpiceMeter({
  level,
  showLabel = true,
  className,
}: SpiceMeterProps) {
  const { count, label } = levels[level];

  return (
    <span
      className={clsx(
        "text-ink-muted inline-flex items-center gap-1.5 text-[0.8rem] font-semibold",
        className,
      )}
    >
      <span className="inline-flex" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <Chilli filled={index < count} key={index} />
        ))}
      </span>
      <span className={showLabel ? undefined : "sr-only"}>{label} spice</span>
    </span>
  );
}
