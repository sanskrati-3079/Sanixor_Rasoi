import type { ReactNode } from "react";
import { clsx } from "clsx";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  illustration,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "rounded-panel border-line-strong/50 bg-surface/60 flex flex-col items-center border-2 border-dashed px-6 py-12 text-center backdrop-blur-xl",
        className,
      )}
    >
      {illustration && (
        <div className="mb-5" aria-hidden="true">
          {illustration}
        </div>
      )}
      <p className="font-display text-2xl font-semibold">{title}</p>
      {description && (
        <div className="text-ink-muted mt-2 max-w-md">{description}</div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
