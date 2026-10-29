import type { ComponentProps, ReactNode } from "react";
import { clsx } from "clsx";
import { Info, Lightbulb, TriangleAlert, CircleAlert } from "lucide-react";

export type CalloutTone = "info" | "tip" | "warning" | "danger";

const tones: Record<CalloutTone, { box: string; icon: ReactNode }> = {
  info: {
    box: "bg-sky/70 border-line-strong/40",
    icon: <Info className="text-accent-strong size-5" aria-hidden="true" />,
  },
  tip: {
    box: "bg-oak border-transparent",
    icon: (
      <Lightbulb className="text-accent-strong size-5" aria-hidden="true" />
    ),
  },
  warning: {
    box: "bg-warning-soft border-warning/30",
    icon: <TriangleAlert className="text-warning size-5" aria-hidden="true" />,
  },
  danger: {
    box: "bg-danger-soft border-danger/30",
    icon: <CircleAlert className="text-danger size-5" aria-hidden="true" />,
  },
};

type CalloutProps = Omit<ComponentProps<"div">, "title"> & {
  tone?: CalloutTone;
  title?: ReactNode;
  icon?: ReactNode;
};

export function Callout({
  tone = "info",
  title,
  icon,
  className,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      className={clsx(
        "text-ink flex gap-3 rounded-[20px] border p-4",
        tones[tone].box,
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 shrink-0">{icon ?? tones[tone].icon}</span>
      <div className="min-w-0 space-y-1 text-[0.95rem]">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
