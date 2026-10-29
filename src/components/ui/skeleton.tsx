import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-shimmer rounded-xl bg-[linear-gradient(90deg,var(--color-sky)_0%,var(--color-canvas)_50%,var(--color-sky)_100%)] bg-[length:200%_100%] opacity-70",
        className,
      )}
    />
  );
}
