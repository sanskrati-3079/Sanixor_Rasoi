import type { ReactNode } from "react";
import { clsx } from "clsx";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-canvas text-ink border-line-strong/50",
  accent: "bg-oak text-ink border-transparent",
  success: "bg-success-soft text-success border-success/30",
  warning: "bg-warning-soft text-warning border-warning/30",
  danger: "bg-danger-soft text-danger border-danger/30",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[0.8rem] leading-tight font-semibold",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
