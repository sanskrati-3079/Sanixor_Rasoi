import { clsx } from "clsx";

type DoodleProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LeafDoodle({ className }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={clsx("pointer-events-none", className)}
    >
      <path d="M12 52C14 28 30 12 54 10c-2 24-18 40-42 42Z" {...stroke} />
      <path d="M14 50 40 24M26 38h10M32 32V22" {...stroke} />
    </svg>
  );
}

export function ChilliDoodle({ className }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={clsx("pointer-events-none", className)}
    >
      <path
        d="M46 16c7 4 7 14 1 22-8 12-22 18-36 16-2 0-2-3 0-4 10-4 18-12 22-24 2-8 7-14 13-10Z"
        {...stroke}
      />
      <path d="M46 16c2-4 6-6 10-6" {...stroke} />
    </svg>
  );
}

export function SteamDoodle({ className }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={clsx("pointer-events-none", className)}
    >
      <path
        d="M20 54c-8-8 8-14 0-24s8-14 0-22M34 54c-8-8 8-14 0-24s8-14 0-22M48 54c-8-8 8-14 0-24"
        {...stroke}
      />
    </svg>
  );
}
