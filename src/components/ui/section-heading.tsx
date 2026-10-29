import type { ReactNode, Ref } from "react";
import { clsx } from "clsx";

type SectionHeadingProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
  align?: "start" | "center";
  /** Lets callers move focus to the heading (e.g. after results load). */
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
};

const sizes = {
  h1: "text-[2.25rem] leading-[1.08] sm:text-5xl lg:text-[3.6rem]",
  h2: "text-[1.75rem] leading-tight sm:text-[2rem]",
  h3: "text-xl leading-snug sm:text-2xl",
};

export function SectionHeading({
  title,
  eyebrow,
  description,
  as: Heading = "h2",
  id,
  align = "start",
  headingRef,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-accent-strong mb-2 text-sm font-semibold tracking-[0.12em] uppercase">
          {eyebrow}
        </p>
      )}
      <Heading
        id={id}
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className={clsx(
          "font-display text-ink font-semibold tracking-tight focus:outline-none",
          sizes[Heading],
        )}
      >
        {title}
      </Heading>
      {description && (
        <div className="text-ink-muted mt-3 text-[1.05rem] sm:text-lg">
          {description}
        </div>
      )}
    </div>
  );
}
