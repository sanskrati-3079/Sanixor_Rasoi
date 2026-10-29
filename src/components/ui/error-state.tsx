import type { ReactNode } from "react";
import { clsx } from "clsx";
import { RotateCcw } from "lucide-react";
import { Button } from "./button";

type ErrorStateProps = {
  title: string;
  description: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  /** Extra action shown beside Retry, e.g. "Edit ingredients". */
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  secondaryAction,
  icon,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={clsx(
        "rounded-panel border-danger/25 bg-danger-soft/70 flex flex-col items-start gap-4 border p-6 sm:flex-row sm:items-center sm:p-8",
        className,
      )}
    >
      {icon && (
        <span
          className="bg-surface text-danger grid size-14 shrink-0 place-items-center rounded-full"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-semibold sm:text-2xl">
          {title}
        </p>
        <div className="text-ink-muted mt-1">{description}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {secondaryAction}
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
