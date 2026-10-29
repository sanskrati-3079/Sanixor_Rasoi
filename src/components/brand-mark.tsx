import { clsx } from "clsx";

type BrandMarkProps = {
  className?: string;
};

/** A small cooking pot with steam, used beside the wordmark. */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={clsx(
        "bg-denim text-surface grid size-10 shrink-0 place-items-center rounded-full",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <path
          d="M12 9.5c-1-1.4 1-2.4 0-4M16 9.5c-1-1.4 1-2.4 0-4M20 9.5c-1-1.4 1-2.4 0-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M6.5 14h19v4.5a6 6 0 0 1-6 6h-7a6 6 0 0 1-6-6V14Z"
          fill="currentColor"
        />
        <path
          d="M4 15h2.5M25.5 15H28M9 27h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
